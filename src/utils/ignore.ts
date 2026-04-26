import { minimatch } from 'minimatch'
import path from 'node:path'

import type { DeepReadonly, PreparedFile } from '@/internal-types'

/**
 * Resolves the effective ignore pattern list for a specific output by merging global `ignoreFiles` with
 * per-output patterns.
 *
 * Per-output patterns that start with `!` are treated as negations — they _un-ignore_ files that were matched
 * by the global list. All other per-output patterns are additive (extend the global list).
 *
 * @example
 * 	resolveIgnorePatterns(
 * 		['team/*', 'blog/*'], // global
 * 		['!team/*', 'changelog.md'], // perOutput
 * 	)
 * 	// => { positive: ['blog/*', 'changelog.md'], negative: ['team/*'] }
 */
export function resolveIgnorePatterns(
	globalPatterns: readonly string[],
	perOutputPatterns: readonly string[] | undefined,
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
 */
export function isIgnored(
	filePath: string,
	positive: readonly string[],
	negative: readonly string[],
): boolean {
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
 */
export function filterPreparedFiles(
	files: DeepReadonly<PreparedFile[]>,
	workDir: string,
	positive: readonly string[],
	negative: readonly string[],
): DeepReadonly<PreparedFile[]> {
	if (positive.length === 0 && negative.length === 0) {
		return files
	}

	return files.filter((file) => {
		const relativePath = path.isAbsolute(file.path) ? path.relative(workDir, file.path) : file.path

		return !isIgnored(relativePath, positive, negative)
	})
}
