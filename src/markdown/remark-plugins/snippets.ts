import type { Code, Root, RootContent } from 'mdast'
import type { VFile } from 'vfile'

import matter from 'gray-matter'
import { fromMarkdown } from 'mdast-util-from-markdown'
import fs from 'node:fs'
import path from 'node:path'
import { visit } from 'unist-util-visit'

import log from '@/utils/logger'

interface IncludeOptions {
	/** Source directory for resolving @ prefixed paths */
	readonly srcDir: string
}

interface ProcessingOptions extends IncludeOptions {
	readonly content: string
	readonly filePath: string
	includes: string[]
}

//#region Regexes
const includesRE = /<!--\s*@include:\s*(.*?)\s*-->/g
const snippetRE = /^<<<\s*(.*?)$/gm
const regionRE = /(#[^\s{]+)/
const rangeRE = /\{(\d*),(\d*)\}$/

/**
 * Raw path format: "/path/to/file.extension#region {meta} [title]" where #region, {meta} and [title] are
 * optional meta can be like '1,2,4-6 lang', 'lang' or '1,2,4-6' lang can contain special characters like C++,
 * C#, F#, etc. path can be relative to the current file or absolute file extension is optional path can
 * contain spaces and dots
 *
 * Captures: ['/path/to/file.extension', 'extension', '#region', '{meta}', '[title]']
 */
const rawPathRegexp =
	/^(.+?(?:(?:\.([a-z0-9]+))?))(?:(#[\w-]+))?(?: ?(?:{(\d+(?:[,-]\d+)*)? ?(\S+)? ?(\S+)?}))? ?(?:\[(.+)\])?$/

// VitePress region markers
const markers = [
	{
		end: /^\s*\/\/\s*#?endregion\b\s*(.*?)\s*$/,
		start: /^\s*\/\/\s*#?region\b\s*(.*?)\s*$/,
	},
	{
		end: /^\s*<!--\s*#?endregion\b\s*(.*?)\s*-->/,
		start: /^\s*<!--\s*#?region\b\s*(.*?)\s*-->/,
	},
	{
		end: /^\s*\/\*\s*#endregion\b\s*(.*?)\s*\*\//,
		start: /^\s*\/\*\s*#region\b\s*(.*?)\s*\*\//,
	},
	{
		// Spellchecker:disable
		end: /^\s*#[eE]nd ?[rR]egion\b\s*(.*?)\s*$/,
		start: /^\s*#[rR]egion\b\s*(.*?)\s*$/,
		// Spellchecker:enable
	},
	{
		end: /^\s*#\s*#?endregion\b\s*(.*?)\s*$/,
		start: /^\s*#\s*#?region\b\s*(.*?)\s*$/,
	},
	{
		end: /^\s*(?:--|::|@?REM)\s*#endregion\b\s*(.*?)\s*$/,
		start: /^\s*(?:--|::|@?REM)\s*#region\b\s*(.*?)\s*$/,
	},
	{
		end: /^\s*#pragma\s+endregion\b\s*(.*?)\s*$/,
		start: /^\s*#pragma\s+region\b\s*(.*?)\s*$/,
	},
	{
		end: /^\s*\(\*\s*#endregion\b\s*(.*?)\s*\*\)/,
		start: /^\s*\(\*\s*#region\b\s*(.*?)\s*\*\)/,
	},
]
//#endregion

function rawPathToToken(rawPath: string): {
	attrs: string
	extension: string
	filepath: string
	lang: string
	lines: string
	region: string
	title: string
} {
	const [filepath = '', extension = '', region = '', lines = '', lang = '', attrs = '', title = ''] = (
		rawPathRegexp.exec(rawPath) ?? []
	).slice(1)

	return { attrs, extension, filepath, lang, lines, region, title }
}

/** Find the start marker and its regex pair */
function findRegionStart(
	lines: readonly string[],
	regionName: string,
): { re: (typeof markers)[number]; start: number } | undefined {
	for (let i = 0; i < lines.length; i += 1) {
		for (const re of markers) {
			// @ts-expect-error False error?
			if (re.start.exec(lines[i])?.[1] === regionName) {
				return { re, start: i + 1 }
			}
		}
	}
	return undefined
}

/** Find the end marker index, handling nesting */
function findRegionEnd(
	lines: readonly string[],
	regionName: string,
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
	chosen: Readonly<{ re: (typeof markers)[number]; start: number }>,
): number | undefined {
	let counter = 1
	for (let i = chosen.start; i < lines.length; i += 1) {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const line = lines[i] as unknown as string
		if (chosen.re.start.exec(line)?.[1] === regionName) {
			counter += 1
		}
		const endRegion = chosen.re.end.exec(line)?.[1]
		if ((endRegion === regionName || endRegion === '') && (counter -= 1) === 0) {
			return i
		}
	}
	return undefined
}

/** Find region in content (VitePress algorithm) */
function findRegion(
	lines: readonly string[],
	regionName: string,
): { re: (typeof markers)[number]; start: number; end?: number | undefined } | undefined {
	const chosen = findRegionStart(lines, regionName)
	if (!chosen) {
		return undefined
	}

	const end = findRegionEnd(lines, regionName, chosen)
	return { ...chosen, end }
}

function dedent(text: string): string {
	const lines = text.split('\n')

	let minIndentLength = Infinity

	for (const line of lines) {
		for (let i = 0; i < line.length; i += 1) {
			if (line[i] !== ' ' && line[i] !== '\t') {
				minIndentLength = Math.min(i, minIndentLength)
				break
			}
		}
	}

	if (minIndentLength < Infinity) {
		return lines.map((line) => line.slice(minIndentLength)).join('\n')
	}

	return text
}

/** Process includes recursively (VitePress algorithm) */
// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
function processIncludes({ srcDir, content, filePath, includes }: Readonly<ProcessingOptions>): string {
	return content.replace(includesRE, (string: string, m1: string) => {
		if (m1.length === 0) {
			return string
		}

		const range = rangeRE.exec(m1)
		const region = regionRE.exec(m1)
		const hasMeta = Boolean(region ?? range)

		if (hasMeta) {
			const len = (region?.[0].length ?? 0) + (range?.[0].length ?? 0)
			m1 = m1.slice(0, -len) // Remove meta info from the include path
		}

		const atPresent = m1.startsWith('@')

		try {
			const includePath = atPresent
				? // oxlint-disable-next-line no-magic-numbers
					path.join(srcDir, m1.slice(m1[1] === '/' ? 2 : 1))
				: path.join(path.dirname(filePath), m1)

			if (!fs.existsSync(includePath)) {
				throw new Error(`File not found: ${includePath}`)
			}

			// oxlint-disable-next-line no-shadow
			let content = fs.readFileSync(includePath, 'utf8')

			// Handle region selection
			if (region) {
				const [regionName] = region
				const lines = content.split(/\r?\n/)
				const regionData = findRegion(lines, regionName.slice(1))

				if (regionData) {
					content = lines.slice(regionData.start, regionData.end).join('\n')
				} else {
					log.warn(`[remark-include] Region '${regionName}' not found in ${includePath}`)
				}
			}

			// Handle line range selection
			if (range) {
				const [, startLine, endLine] = range
				const lines = content.split(/\r?\n/)
				content = lines
					.slice(
						// oxlint-disable typescript/strict-boolean-expressions
						startLine ? Number.parseInt(startLine, 10) - 1 : undefined,
						endLine ? Number.parseInt(endLine, 10) : undefined,
						// oxlint-enable typescript/strict-boolean-expressions
					)
					.join('\n')
			}

			// Strip frontmatter from .md files if no meta info present
			if (!hasMeta && path.extname(includePath) === '.md') {
				;({ content } = matter(content))
			}

			includes.push(includePath)

			// Recursively process includes in the content
			return processIncludes({ content, filePath, includes, srcDir })
		} catch {
			log.warn(`[remark-include] Include file not found: ${m1}`)

			return string // Silently ignore error if file is not present
		}
	})
}

/** Process code snippets (VitePress <<< syntax) */
// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
function processSnippets({
	srcDir,
	content,
	filePath,
	includes,
}: Readonly<ProcessingOptions>): Code | undefined {
	let codeNode: Code | undefined
	content.replace(snippetRE, (string: string, rawPath: string) => {
		if (rawPath.length === 0) {
			return string
		}

		// Handle @ prefix first, then parse the rest
		const cleanPath = rawPath.trim()
		const atPresent = cleanPath.startsWith('@')
		const pathToParse = atPresent ? cleanPath.slice(1) : cleanPath

		const { filepath, extension, region, lines, lang, attrs, title } = rawPathToToken(pathToParse)

		try {
			const snippetPath = atPresent
				? path.join(srcDir, filepath)
				: path.resolve(path.dirname(filePath), filepath)

			if (!fs.existsSync(snippetPath)) {
				throw new Error(`Snippet file not found: ${snippetPath}`)
			}

			let codeContent = fs.readFileSync(snippetPath, 'utf8').replaceAll('\r\n', '\n')

			// Handle region selection
			if (region) {
				const regionName = region.slice(1)
				const contentLines = codeContent.split('\n')
				const regionData = findRegion(contentLines, regionName)

				if (regionData) {
					codeContent = dedent(
						contentLines
							.slice(regionData.start, regionData.end)
							.filter(
								(line) => !(regionData.re.start.test(line) || regionData.re.end.test(line)),
							)
							.join('\n'),
					)
				}
			}

			includes.push(snippetPath)

			const infoLang = lang || extension || undefined
			const infoMeta =
				`${lines && `{${lines}}`}${title && `[${title}]`}${attrs && ` ${attrs}`}`.trim() || undefined

			codeNode = {
				lang: infoLang,
				meta: infoMeta,
				type: 'code',
				value: codeContent,
			}
		} catch {
			log.warn(`[remark-include] Snippet file not found: ${rawPath}`)
		}
		return string
	})
	return codeNode
}

/** Remark plugin for markdown file inclusion and code snippets (VitePress-style) */
function remarkInclude({ srcDir }: Readonly<IncludeOptions>) {
	return () =>
		// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
		(tree: Root, file: VFile): void => {
			const includes: string[] = []

			visit(tree, (node, index, parent) => {
				if (parent === undefined || typeof index !== 'number') {
					return
				}

				const isIncludeNode = node.type === 'html' && includesRE.test(node.value)
				const isSnippetNode = node.type === 'text' && snippetRE.test(node.value)

				if (isIncludeNode || isSnippetNode) {
					let processedValue: Code | string | undefined

					if (isIncludeNode) {
						processedValue = processIncludes({
							content: node.value,
							filePath: file.path,
							includes,
							srcDir,
						})
					} else if (isSnippetNode) {
						processedValue = processSnippets({
							content: node.value,
							filePath: file.path,
							includes,
							srcDir,
						})
					}

					if (processedValue !== undefined) {
						if (typeof processedValue === 'string') {
							if (processedValue !== (node as { value: string }).value) {
								parent.children.splice(index, 1, ...fromMarkdown(processedValue).children)
							}
						} else {
							parent.children.splice(index, 1, processedValue as RootContent)
						}
					}
				}
			})

			file.data['includes'] = includes
		}
}

export default remarkInclude
