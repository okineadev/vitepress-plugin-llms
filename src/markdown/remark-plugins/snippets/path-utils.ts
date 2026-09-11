import path from 'node:path'

import type { ResolveIncludePathOptions, StripMetaOptions } from './types'

import { rawPathRegexp } from './patterns'

/**
 * Converts a raw path string into its component parts.
 *
 * @param rawPath - The raw path string to parse.
 * @returns An object with filepath, extension, region, lines, lang, attrs, and title.
 */
export function rawPathToToken(rawPath: string): {
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

/**
 * Removes the common leading whitespace from all lines of a string.
 * @param text - The indented text to dedent.
 * @returns The string with common indentation removed.
 */
export function dedent(text: string): string {
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

/**
 * Resolves an include path - handles both `@`-prefixed and relative paths.
 *
 * @returns The resolved absolute path.
 */
export function resolveIncludePath({ rawPath, srcDir, filePath }: ResolveIncludePathOptions): string {
	if (rawPath.startsWith('@')) {
		// oxlint-disable-next-line no-magic-numbers
		return path.join(srcDir, rawPath.slice(rawPath[1] === '/' ? 2 : 1))
	}
	return path.join(path.dirname(filePath), rawPath)
}

/**
 * Strips the region/range meta suffix from an include path string.
 *
 * @param options - Options with the raw path and matched region/range results.
 * @returns The cleaned path without meta info.
 */
export function stripMeta({ rawPath, region, range }: StripMetaOptions): string {
	const len = (region?.[0].length ?? 0) + (range?.[0].length ?? 0)
	return rawPath.slice(0, -len)
}
