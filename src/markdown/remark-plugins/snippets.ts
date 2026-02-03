import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Code, Root, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import log from '@/utils/logger'

interface IncludeOptions {
	/**
	 * Source directory for resolving @ prefixed paths
	 */
	srcDir: string
}

interface ProcessingOptions extends IncludeOptions {
	content: string
	filePath: string
	includes: string[]
}

//#region Regexes
const includesRE = /<!--\s*@include:\s*(.*?)\s*-->/g
const snippetRE = /^<<<\s*(.*?)$/gm
const regionRE = /(#[^\s{]+)/
const rangeRE = /\{(\d*),(\d*)\}$/

/**
 * raw path format: "/path/to/file.extension#region {meta} [title]"
 *    where #region, {meta} and [title] are optional
 *    meta can be like '1,2,4-6 lang', 'lang' or '1,2,4-6'
 *    lang can contain special characters like C++, C#, F#, etc.
 *    path can be relative to the current file or absolute
 *    file extension is optional
 *    path can contain spaces and dots
 *
 * captures: ['/path/to/file.extension', 'extension', '#region', '{meta}', '[title]']
 */
const rawPathRegexp =
	/^(.+?(?:(?:\.([a-z0-9]+))?))(?:(#[\w-]+))?(?: ?(?:{(\d+(?:[,-]\d+)*)? ?(\S+)? ?(\S+)?}))? ?(?:\[(.+)\])?$/

// VitePress region markers
const markers = [
	{
		start: /^\s*\/\/\s*#?region\b\s*(.*?)\s*$/,
		end: /^\s*\/\/\s*#?endregion\b\s*(.*?)\s*$/,
	},
	{
		start: /^\s*<!--\s*#?region\b\s*(.*?)\s*-->/,
		end: /^\s*<!--\s*#?endregion\b\s*(.*?)\s*-->/,
	},
	{
		start: /^\s*\/\*\s*#region\b\s*(.*?)\s*\*\//,
		end: /^\s*\/\*\s*#endregion\b\s*(.*?)\s*\*\//,
	},
	{
		// spellchecker:disable
		start: /^\s*#[rR]egion\b\s*(.*?)\s*$/,
		end: /^\s*#[eE]nd ?[rR]egion\b\s*(.*?)\s*$/,
		// spellchecker:enable
	},
	{
		start: /^\s*#\s*#?region\b\s*(.*?)\s*$/,
		end: /^\s*#\s*#?endregion\b\s*(.*?)\s*$/,
	},
	{
		start: /^\s*(?:--|::|@?REM)\s*#region\b\s*(.*?)\s*$/,
		end: /^\s*(?:--|::|@?REM)\s*#endregion\b\s*(.*?)\s*$/,
	},
	{
		start: /^\s*#pragma\s+region\b\s*(.*?)\s*$/,
		end: /^\s*#pragma\s+endregion\b\s*(.*?)\s*$/,
	},
	{
		start: /^\s*\(\*\s*#region\b\s*(.*?)\s*\*\)/,
		end: /^\s*\(\*\s*#endregion\b\s*(.*?)\s*\*\)/,
	},
]
//#endregion

function rawPathToToken(rawPath: string) {
	const [filepath = '', extension = '', region = '', lines = '', lang = '', attrs = '', title = ''] = (
		rawPathRegexp.exec(rawPath) ?? []
	).slice(1)

	return { filepath, extension, region, lines, lang, attrs, title }
}

/**
 * Find region in content (VitePress algorithm)
 */
function findRegion(lines: string[], regionName: string) {
	let chosen: { re: (typeof markers)[number]; start: number } | null = null

	// Find the regex pair for a start marker that matches the given region name
	for (let i = 0; i < lines.length; i++) {
		for (const re of markers) {
			if (re.start.exec(lines[i] as unknown as string)?.[1] === regionName) {
				chosen = { re, start: i + 1 }
				break
			}
		}
		if (chosen) break
	}

	if (!chosen) return null

	let counter = 1
	// Scan the rest of the lines to find the matching end marker, handling nested markers
	for (let i = chosen.start; i < lines.length; i++) {
		// Check for an inner start marker for the same region
		if (chosen.re.start.exec(lines[i] as unknown as string)?.[1] === regionName) {
			counter++
			continue
		}
		// Check for an end marker for the same region
		const endRegion = chosen.re.end.exec(lines[i] as unknown as string)?.[1]
		// Allow empty region name on the end marker as a fallback
		if ((endRegion === regionName || endRegion === '') && --counter === 0) {
			return { ...chosen, end: i }
		}
	}

	return null
}

function dedent(text: string): string {
	const lines = text.split('\n')

	const minIndentLength = lines.reduce((acc, line) => {
		for (let i = 0; i < line.length; i++) {
			if (line[i] !== ' ' && line[i] !== '\t') return Math.min(i, acc)
		}
		return acc
	}, Infinity)

	if (minIndentLength < Infinity) {
		return lines.map((x) => x.slice(minIndentLength)).join('\n')
	}

	return text
}

/**
 * Process includes recursively (VitePress algorithm)
 */
function processIncludes({ srcDir, content, filePath, includes }: ProcessingOptions): string {
	return content.replace(includesRE, (m: string, m1: string) => {
		if (m1.length === 0) return m

		const range = m1.match(rangeRE)
		const region = m1.match(regionRE)
		const hasMeta = !!(region ?? range)

		if (hasMeta) {
			const len = (region?.[0].length ?? 0) + (range?.[0].length ?? 0)
			m1 = m1.slice(0, -len) // remove meta info from the include path
		}

		const atPresent = m1[0] === '@'

		try {
			const includePath = atPresent
				? path.join(srcDir, m1.slice(m1[1] === '/' ? 2 : 1))
				: path.join(path.dirname(filePath), m1)

			if (!fs.existsSync(includePath)) {
				throw new Error(`File not found: ${includePath}`)
			}

			let content = fs.readFileSync(includePath, 'utf-8')

			// Handle region selection
			if (region) {
				const [regionName] = region
				const lines = content.split(/\r?\n/)
				const regionData = findRegion(lines, regionName.slice(1))

				if (regionData) {
					content = lines.slice(regionData.start, regionData.end).join('\n')
				} else {
					console.warn(`[remark-include] Region '${regionName}' not found in ${includePath}`)
				}
			}

			// Handle line range selection
			if (range) {
				const [, startLine, endLine] = range
				const lines = content.split(/\r?\n/)
				content = lines
					.slice(
						// oxlint-disable-next-line typescript/strict-boolean-expressions
						startLine ? parseInt(startLine, 10) - 1 : undefined,
						// oxlint-disable-next-line typescript/strict-boolean-expressions
						endLine ? parseInt(endLine, 10) : undefined,
					)
					.join('\n')
			}

			// Strip frontmatter from .md files if no meta info present
			if (!hasMeta && path.extname(includePath) === '.md') {
				content = matter(content).content
			}

			includes.push(includePath)

			// Recursively process includes in the content
			return processIncludes({ srcDir, content, filePath, includes })
		} catch {
			log.warn(`[remark-include] Include file not found: ${m1}`)

			return m // silently ignore error if file is not present
		}
	})
}

/**
 * Process code snippets (VitePress <<< syntax)
 */
function processSnippets({ srcDir, content, filePath, includes }: ProcessingOptions): Code | undefined {
	let codeNode: Code | undefined
	content.replace(snippetRE, (m: string, rawPath: string) => {
		if (rawPath.length === 0) return m

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

			// oxlint-disable-next-line typescript/no-unsafe-call
			let codeContent = fs.readFileSync(snippetPath, 'utf-8').replaceAll('\r\n', '\n') as string

			// Handle region selection
			if (region) {
				const regionName = region.slice(1)
				const contentLines = codeContent.split('\n')
				const regionData = findRegion(contentLines, regionName)

				if (regionData) {
					codeContent = dedent(
						contentLines
							.slice(regionData.start, regionData.end)
							.filter((l) => !(regionData.re.start.test(l) || regionData.re.end.test(l)))
							.join('\n'),
					)
				}
			}

			includes.push(snippetPath)

			const infoLang = lang || extension || null
			const infoMeta =
				`${lines && `{${lines}}`}${title && `[${title}]`}${attrs && ` ${attrs}`}`.trim() || null

			codeNode = {
				type: 'code',
				lang: infoLang,
				meta: infoMeta,
				value: codeContent,
			}
		} catch {
			log.warn(`[remark-include] Snippet file not found: ${rawPath}`)
		}
		return m
	})
	return codeNode
}

/**
 * Remark plugin for markdown file inclusion and code snippets (VitePress-style)
 */
function remarkInclude({ srcDir }: IncludeOptions) {
	return () =>
		(tree: Root, file: VFile): void => {
			const includes: string[] = []

			visit(tree, (node, index, parent) => {
				if (parent === undefined || typeof index !== 'number') return

				const isIncludeNode = node.type === 'html' && includesRE.test(node.value)
				const isSnippetNode = node.type === 'text' && snippetRE.test(node.value)

				if (isIncludeNode || isSnippetNode) {
					let processedValue: Code | string | undefined

					if (isIncludeNode) {
						processedValue = processIncludes({
							srcDir,
							content: node.value,
							filePath: file.path,
							includes,
						})
					} else if (isSnippetNode) {
						processedValue = processSnippets({
							srcDir,
							content: node.value,
							filePath: file.path,
							includes,
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

			// oxlint-disable-next-line typescript/strict-boolean-expressions
			if (file.data) file.data['includes'] = includes
		}
}

export default remarkInclude
