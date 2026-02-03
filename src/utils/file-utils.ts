import path from 'node:path'

// #region Path utilities
/**
 * Splits a file path into its directory and file components.
 *
 * @param filepath - The path to the file.
 * @returns An object containing the directory and file name.
 */
export const splitDirAndFile = (filepath: string): { dir: string; file: string } => ({
	dir: path.dirname(filepath),
	file: path.basename(filepath),
})

/**
 * Only remove the file extension from the file path if it is a content file.
 *
 * This is needed to avoid removing an extension from a file more than once.
 */
const contentFileExts = new Set(['.md', '.html'])

/**
 * Strips the file extension from a given file path, only if it is a content file.
 *
 * @param filepath - The path to the file.
 * @param usePosix - Whether to return the path in POSIX format.
 * @returns The path without the extension if applicable.
 */
export const stripExt = (filepath: string, usePosix = false): string => {
	const { dir, file } = splitDirAndFile(filepath)
	const ext = path.extname(file)
	const base = contentFileExts.has(ext) ? path.basename(file, ext) : file

	// oxlint-disable-next-line typescript/unbound-method
	const joinFn = usePosix ? path.posix.join : path.join

	return joinFn(dir, base)
}

export const stripExtPosix = (filepath: string): string => stripExt(filepath, true)

/**
 * Transforms a file path to use forward slashes (POSIX style) instead of backslashes.
 *
 * @param filepath - The file path to transform
 * @returns The file path with forward slashes
 *
 * @example
 * ```ts
 * transformToPosixPath('foo\\bar\\baz.md') // Returns 'foo/bar/baz.md'
 * ```
 */
// oxlint-disable-next-line typescript/no-unsafe-return typescript/no-unsafe-call
export const transformToPosixPath = (filepath: string): string => filepath.replaceAll('\\', '/')

/**
 * Gets all directories at specific depths relative to the base directory.
 *
 * @param files - Array of file paths
 * @param baseDir - Base directory path
 * @param maxDepth - Maximum depth to traverse (1 = root only, 2 = root + first level, etc.)
 * @returns Array of directory objects with path and depth information
 */
export function getDirectoriesAtDepths(
	files: string[],
	baseDir: string,
	maxDepth: number,
): Array<{
	path: string
	depth: number
	relativePath: string
}> {
	// Always include root directory
	const directories = new Set<string>([baseDir])

	for (const file of files) {
		const relativePath = path.relative(baseDir, file)
		const parts = relativePath.split(path.sep)

		// Build directory paths up to maxDepth
		for (let depth = 1; depth < Math.min(parts.length, maxDepth); depth++) {
			const dirParts = parts.slice(0, depth)
			const dirPath = path.resolve(baseDir, ...dirParts)
			directories.add(dirPath)
		}
	}

	return Array.from(directories)
		.map((dirPath) => ({
			path: dirPath,
			depth: dirPath === baseDir ? 1 : path.relative(baseDir, dirPath).split(path.sep).length + 1,
			relativePath: path.relative(baseDir, dirPath) || '.',
		}))
		.filter((dir) => dir.depth <= maxDepth)
		.sort((a, b) => {
			// Sort by depth first, then by path
			if (a.depth !== b.depth) return a.depth - b.depth
			return a.path.localeCompare(b.path)
		})
}
// #endregion
