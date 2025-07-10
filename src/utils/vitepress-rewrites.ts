import path from 'node:path'
import { compile, match } from 'path-to-regexp'
import type { VitePressConfig } from '../internal-types'

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

	// Handle function-based rewrites
	if (typeof rewrites === 'function') {
		const resolvedFilePath = rewrites(file)
		if (resolvedFilePath) resolvedRewrite = resolvedFilePath
	}
	// Handle object-based rewrites
	else if (rewrites && typeof rewrites === 'object') {
		// First try exact match (static rewrites)
		if (file in rewrites) {
			resolvedRewrite = rewrites[file]
		} else {
			// Try dynamic pattern matching
			for (const [pattern, replacement] of Object.entries(rewrites)) {
				// Skip if it's not a dynamic pattern (no : or *)
				if (!pattern.includes(':') && !pattern.includes('*')) {
					continue
				}

				try {
					const matcher = match(pattern)
					const result = matcher(file)

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

		console.log(rewrites)

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
