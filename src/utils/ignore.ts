import { minimatch } from 'minimatch'
import path from 'node:path'

import type { PreparedFile } from '@/internal-types'

/**
 * Resolves the effective ignore pattern list for a specific output by merging global `ignoreFiles` with
 * per-output patterns.
 *
 * Per-output patterns that start with `!` are treated as negations — they _un-ignore_ files that were matched
 * by the global list. All other per-output patterns are additive (extend the global list).
 *
 * @param globalPatterns - The global ignore patterns shared across all outputs.
 * @param perOutputPatterns - Optional per-output patterns; negations (prefixed with `!`) remove entries from
 *   the global list, while all others extend it.
 * @returns An object with `positive` patterns (files to ignore) and `negative` patterns (files to un-ignore).
 *
 * @example
 * ```ts
 * resolveIgnorePatterns(
 *   ['team/*', 'blog/*'], // global
 *   ['!team/*', 'changelog.md'], // perOutput
 * )
 * 	// => { positive: ['blog/*', 'changelog.md'], negative: ['team/*'] }
 * ```
 */
export function resolveIgnorePatterns(
	globalPatterns: string[],
	perOutputPatterns: string[] | undefined,
): { positive: string[]; negative: string[] } {
	if (!perOutputPatterns) {
		return { negative: [], positive: [...globalPatterns] }
	}
	const extraNegations = perOutputPatterns
		.filter((pattern) => pattern.startsWith('!'))
		.map((pattern) => pattern.slice(1))

	const extraPositive = perOutputPatterns.filter((pattern) => !pattern.startsWith('!'))

	// Remove from global any pattern that is negated by perOutput
	const positive = [
		...globalPatterns.filter((positive_) => !extraNegations.some((negative) => negative === positive_)),
		...extraPositive,
	]

	return { negative: extraNegations, positive }
}

/**
 * Returns `true` if `filePath` should be ignored given the resolved pattern sets.
 *
 * A file is ignored when it matches at least one positive pattern AND is not matched by any negative
 * (un-ignore) pattern.
 *
 * @param filePath - The file path to test against the pattern sets.
 * @param positive - Patterns that mark a file as ignored when matched.
 * @param negative - Patterns that exempt a file from being ignored when matched.
 * @returns `true` if the file should be ignored, `false` otherwise.
 */
export function isIgnored(filePath: string, positive: string[], negative: string[]): boolean {
	if (positive.length === 0) {
		return false
	}

	const matchesPositive = positive.some((positive_) => minimatch(filePath, positive_))
	if (!matchesPositive) {
		return false
	}

	const matchesNegative = negative.some((negative_) => minimatch(filePath, negative_))
	return !matchesNegative
}

/**
 * Filters a list of {@link PreparedFile} objects, keeping only those whose resolved output path is **not**
 * ignored by the given pattern sets.
 *
 * @param files - The list of prepared files to filter.
 * @param workDir - The working directory used to resolve absolute paths to relative ones for pattern matching.
 * @param positive - Patterns that mark a file as ignored when matched.
 * @param negative - Patterns that exempt a file from being ignored when matched.
 * @returns A filtered array containing only the files whose paths are not ignored.
 */
// oxlint-disable-next-line max-params
export function filterPreparedFiles(
	files: PreparedFile[],
	workDir: string,
	positive: string[],
	negative: string[],
): PreparedFile[] {
	if (positive.length === 0 && negative.length === 0) {
		return files
	}

	return files.filter((file) => {
		const relativePath = path.isAbsolute(file.path) ? path.relative(workDir, file.path) : file.path

		return !isIgnored(relativePath, positive, negative)
	})
}
