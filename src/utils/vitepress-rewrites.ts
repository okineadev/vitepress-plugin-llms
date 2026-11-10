import path from 'node:path'
import { compile, match } from 'path-to-regexp'

import type { VitePressConfig } from '@/internal-types'

import { transformToPosixPath } from './file-utils'

function matchDynamicRewrite(file: string, pattern: string, replacement: string): string | undefined {
	if (!pattern.includes(':') && !pattern.includes('*')) {
		return undefined
	}
	try {
		const matcher = match(pattern)
		const result = matcher(file)
		if (result !== false) {
			const compileReplacement = compile(replacement)
			return compileReplacement(result.params)
		}
	} catch {
		// Ignore invalid patterns, as VitePress does.
	}
	return undefined
}

function resolveObjectRewrite(file: string, entries: [string, string][]): string | undefined {
	const exactMatch = entries.find(([source]) => source === file)
	if (exactMatch) {
		return exactMatch[1]
	}
	for (const [pattern, replacement] of entries) {
		const resolved = matchDynamicRewrite(file, pattern, replacement)
		if (resolved !== undefined) {
			return resolved
		}
	}
	return undefined
}

/**
 * Resolves the output file path using static, dynamic, or function-based VitePress rewrites.
 * @param file - Source file path.
 * @param workDir - Working directory for resolving relative paths.
 * @param rewrites - VitePress rewrite configuration.
 * @returns The rewritten output path, or the original file path.
 */
export function resolveOutputFilePath(
	file: string,
	workDir: string,
	rewrites: VitePressConfig['rewrites'] = {},
): string {
	const normalizedFile = file.split(path.sep).join(path.posix.sep)
	const normalizedWorkDir = workDir.split(path.sep).join(path.posix.sep)
	const relativePath = path.posix.relative(normalizedWorkDir, normalizedFile)
	const resolved =
		typeof rewrites === 'function'
			? rewrites(relativePath) || undefined
			: resolveObjectRewrite(relativePath, Object.entries(rewrites))
	return resolved === undefined ? file : path.join(workDir, resolved)
}

/**
 * Resolves the source file path from an output path using VitePress rewrites.
 * @param outputPath - Output file path.
 * @param workDir - Working directory.
 * @param rewrites - VitePress rewrite configuration.
 * @returns The source path. Function-based rewrites return the original output path.
 */
export function resolveSourceFilePath(
	outputPath: string,
	workDir: string,
	rewrites: VitePressConfig['rewrites'] = {},
): string {
	if (typeof rewrites === 'function') {
		return outputPath
	}
	const reversedEntries: [string, string][] = Object.entries(rewrites).map(([source, target]) => [
		target,
		source,
	])
	return path.join(workDir, resolveObjectRewrite(outputPath, reversedEntries) ?? outputPath)
}

/**
 * Resolves a VitePress page URL from its file system path.
 * @param url - The file system path of the page (e.g., `guide/index.md`).
 * @returns The resolved URL path (e.g., `guide.md`).
 */
export function resolvePageURL(url: string): string {
	// Normalize leading slash
	const hasLeadingSlash = url.startsWith('/')
	const normalized = transformToPosixPath(hasLeadingSlash ? url.slice(1) : url)

	// Only rewrite if ends with /index.md and is not just index.md
	if (normalized.endsWith('/index.md') && normalized !== 'index.md') {
		const newUrl = `${normalized.slice(0, -'/index.md'.length)}.md`
		return hasLeadingSlash ? `/${newUrl}` : newUrl
	}
	return url
}
