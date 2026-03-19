import path from 'node:path'
import { minimatch } from 'minimatch'
import type { PreparedFile } from '@/internal-types'

/**
 * Resolves the effective ignore pattern list for a specific output by merging
 * global `ignoreFiles` with per-output patterns.
 *
 * Per-output patterns that start with `!` are treated as negations — they
 * _un-ignore_ files that were matched by the global list. All other per-output
 * patterns are additive (extend the global list).
 *
 * @example
 * resolveIgnorePatterns(
 *   ['team/*', 'blog/*'],   // global
 *   ['!team/*', 'changelog.md'], // perOutput
 * )
 * // => { positive: ['blog/*', 'changelog.md'], negative: ['team/*'] }
 */
export function resolveIgnorePatterns(
	globalPatterns: string[],
	perOutputPatterns: string[],
): { positive: string[]; negative: string[] } {
	const extraNegations = perOutputPatterns.filter((p) => p.startsWith('!')).map((p) => p.slice(1))

	const extraPositive = perOutputPatterns.filter((p) => !p.startsWith('!'))

	// Remove from global any pattern that is negated by perOutput
	const positive = [
		...globalPatterns.filter((p) => !extraNegations.some((neg) => neg === p)),
		...extraPositive,
	]

	return { positive, negative: extraNegations }
}

/**
 * Returns `true` if `filePath` should be ignored given the resolved pattern sets.
 *
 * A file is ignored when it matches at least one positive pattern AND is not
 * matched by any negative (un-ignore) pattern.
 */
export function isIgnored(filePath: string, positive: string[], negative: string[]): boolean {
	if (positive.length === 0) return false

	const matchesPositive = positive.some((p) => minimatch(filePath, p))
	if (!matchesPositive) return false

	const matchesNegative = negative.some((p) => minimatch(filePath, p))
	return !matchesNegative
}

/**
 * Filters a list of {@link PreparedFile} objects, keeping only those whose
 * resolved output path is **not** ignored by the given pattern sets.
 */
export function filterPreparedFiles(
	files: PreparedFile[],
	workDir: string,
	positive: string[],
	negative: string[],
): PreparedFile[] {
	if (positive.length === 0 && negative.length === 0) return files

	return files.filter((f) => {
		const relativePath = path.isAbsolute(f.path) ? path.relative(workDir, f.path) : f.path

		return !isIgnored(relativePath, positive, negative)
	})
}
