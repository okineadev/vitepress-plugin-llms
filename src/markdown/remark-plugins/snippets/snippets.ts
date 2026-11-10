import type { Code } from 'mdast'

import fs from 'node:fs'
import path from 'node:path'

import log from '@/utils/logger'

import type { BuildSnippetNodeOptions, ProcessingOptions, ResolveSnippetPathOptions } from './types'

import { dedent, rawPathToToken } from './path-utils'
import { snippetRE } from './patterns'
import { findRegion } from './regions'

/**
 * Extracts the named region from snippet content lines and removes common indentation.
 * @param codeContent - Full file content of the snippet.
 * @param region - Region selector string including the `#` prefix.
 * @returns Region content without common indentation, or the original content if the region is not found.
 */
function applySnippetRegion(codeContent: string, region: string): string {
	const regionName = region.slice(1)
	const contentLines = codeContent.split('\n')
	const regionData = findRegion(contentLines, regionName)

	if (!regionData) {
		return codeContent
	}

	return dedent(
		contentLines
			.slice(regionData.start, regionData.end)
			.filter((line) => !(regionData.re.start.test(line) || regionData.re.end.test(line)))
			.join('\n'),
	)
}

/**
 * Builds the `meta` info string for a code fence from a parsed token.
 *
 * @param token - Parsed raw path token.
 * @returns The formatted meta string, or undefined if empty.
 */
function buildCodeMeta(token: ReturnType<typeof rawPathToToken>): string | undefined {
	const { lines, title, attrs } = token
	return `${lines && `{${lines}}`}${title && `[${title}]`}${attrs && ` ${attrs}`}`.trim() || undefined
}

/**
 * Builds a `Code` mdast node from a snippet file, applying optional region filtering and removing indentation.
 *
 * @param options - Options with the snippet path, region, parsed token, and includes list.
 * @returns A `Code` node with the snippet content.
 */
function buildSnippetNode({ snippetPath, region, token, includes }: BuildSnippetNodeOptions): Code {
	let codeContent = fs.readFileSync(snippetPath, 'utf8').replaceAll('\r\n', '\n')

	if (region) {
		codeContent = applySnippetRegion(codeContent, region)
	}

	includes.push(snippetPath)

	const infoLang = token.lang || token.extension || undefined
	const infoMeta = buildCodeMeta(token)

	return { lang: infoLang, meta: infoMeta, type: 'code', value: codeContent }
}

/**
 * Resolves a snippet's absolute path from the raw path token, handling `@`-prefixed paths.
 * @param options - Options with the clean path, token filepath, current file path, and source root.
 * @returns The resolved absolute snippet path.
 */
function resolveSnippetPath({
	cleanPath,
	tokenFilePath,
	filePath,
	srcDir,
}: ResolveSnippetPathOptions): string {
	return cleanPath.startsWith('@')
		? path.join(srcDir, tokenFilePath)
		: path.resolve(path.dirname(filePath), tokenFilePath)
}

/**
 * Processes `<<< ` snippet directives in markdown content (VitePress-style).
 * @param options - Processing options including source directory, content, file path, and includes list.
 * @returns A `Code` mdast node if a snippet was found, otherwise undefined.
 */
function processSnippets({ srcDir, content, filePath, includes }: ProcessingOptions): Code | undefined {
	let codeNode: Code | undefined

	// oxlint-disable-next-line max-statements
	content.replace(snippetRE, (fallback: string, rawPath: string) => {
		if (rawPath.length === 0) {
			return fallback
		}

		const cleanPath = rawPath.trim()
		const pathToParse = cleanPath.startsWith('@') ? cleanPath.slice(1) : cleanPath
		const token = rawPathToToken(pathToParse)

		try {
			const snippetPath = resolveSnippetPath({
				cleanPath,
				filePath,
				srcDir,
				tokenFilePath: token.filepath,
			})

			if (!fs.existsSync(snippetPath)) {
				throw new Error(`Snippet file not found: ${snippetPath}`)
			}

			codeNode = buildSnippetNode({ includes, region: token.region, snippetPath, token })
		} catch {
			log.warn(`[remark-include] Snippet file not found: ${rawPath}`)
		}

		return fallback
	})

	return codeNode
}

export default processSnippets
