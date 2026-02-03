import path from 'node:path'
import { compile, match } from 'path-to-regexp'
import type { VitePressConfig } from '@/internal-types'
import { transformToPosixPath } from './file-utils'

/**
 * Resolves the output file path for VitePress with support for route rewrites and dynamic slugs.
 *
 * Handles both static rewrites (exact matches) and dynamic patterns using path-to-regexp.
 * Dynamic patterns support parameters (`:param`) and wildcards (`*wildcard`) as defined
 * in VitePress rewrites configuration.
 *
 * @param file - The source file path to resolve (e.g., 'packages/pkg-a/src/index.md')
 * @param workDir - The working directory to join resolved paths with
 * @param rewrites - VitePress rewrites configuration (object, function, or undefined)
 * @returns The resolved output file path
 */
export function resolveOutputFilePath(
	file: string,
	workDir: string,
	rewrites: VitePressConfig['rewrites'] = {},
): string {
	let resolvedRewrite: string | undefined
	// Normalize paths to POSIX format for consistent matching
	// TODO: maybe refactor it later
	const normalizedFile = file.split(path.sep).join(path.posix.sep)
	const normalizedWorkDir = workDir.split(path.sep).join(path.posix.sep)
	const relativePath = path.posix.relative(normalizedWorkDir, normalizedFile)

	// Handle function-based rewrites
	if (typeof rewrites === 'function') {
		const resolvedFilePath = rewrites(relativePath)
		if (resolvedFilePath) resolvedRewrite = resolvedFilePath
	}
	// Handle object-based rewrites
	else if (rewrites && typeof rewrites === 'object') {
		// First try exact match (static rewrites)
		if (relativePath in rewrites) {
			resolvedRewrite = rewrites[relativePath]
		} else {
			// Try dynamic pattern matching
			for (const [pattern, replacement] of Object.entries(rewrites)) {
				// Skip if it's not a dynamic pattern (no : or *)
				if (!pattern.includes(':') && !pattern.includes('*')) {
					continue
				}

				try {
					const matcher = match(pattern)
					const result = matcher(relativePath)

					if (result) {
						// Compile the replacement pattern with matched parameters
						const compileFn = compile(replacement)
						resolvedRewrite = compileFn(result.params)
						break
					}
				} catch (_error) {
					// Skip invalid patterns silently
				}
			}
		}
	}

	// Return resolved path or original file path
	if (resolvedRewrite) {
		return path.join(workDir, resolvedRewrite)
	}

	return file
}

/**
 * Resolves the source file path from output path using VitePress rewrites configuration.
 * This is the reverse operation of {@link resolveOutputFilePath}.
 *
 * @param outputPath - The output file path to resolve back to source (e.g., 'index.md')
 * @param workDir - The working directory
 * @param rewrites - VitePress rewrites configuration (object, function, or undefined)
 * @returns The resolved source file path or the original outputPath if no rewrite found
 */
export function resolveSourceFilePath(
	outputPath: string,
	workDir: string,
	rewrites: VitePressConfig['rewrites'] = {},
): string {
	// Handle function-based rewrites - we can't reverse these easily
	if (typeof rewrites === 'function') {
		// For function-based rewrites, we can't easily reverse the operation
		// so we return the original path
		return outputPath
	}

	// Handle object-based rewrites
	if (rewrites && typeof rewrites === 'object') {
		// First try exact reverse match (static rewrites)
		for (const [source, target] of Object.entries(rewrites)) {
			if (target === outputPath) {
				return path.join(workDir, source)
			}
		}

		// Try dynamic pattern reverse matching
		for (const [sourcePattern, targetPattern] of Object.entries(rewrites)) {
			// Skip if it's not a dynamic pattern (no : or *)
			if (!targetPattern.includes(':') && !targetPattern.includes('*')) {
				continue
			}

			try {
				const matcher = match(targetPattern)
				const result = matcher(outputPath)

				if (result) {
					// Compile the source pattern with matched parameters
					const compileFn = compile(sourcePattern)
					const resolvedSource = compileFn(result.params)
					return path.join(workDir, resolvedSource)
				}
			} catch (_error) {
				// Skip invalid patterns silently
			}
		}
	}

	// Return original path if no rewrite found
	return path.join(workDir, outputPath)
}

/**
 * Resolves a VitePress page URL from its file system path.
 *
 * This function converts the internal file path (e.g., `guide/index.md`)
 * to the actual URL path (e.g., `guide.md`).
 *
 * @param url The file system path of the page (e.g., `guide/index.md`).
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
