import { markers } from './patterns'

/**
 * Finds the start marker line index and its regex pair for a given region name.
 * @param lines - Lines of the file content.
 * @param regionName - The name of the region to find.
 * @returns The matched marker pair and start line index, or undefined if not found.
 */
export function findRegionStart(
	lines: string[],
	regionName: string,
): { re: (typeof markers)[number]; start: number } | undefined {
	for (let i = 0; i < lines.length; i += 1) {
		for (const re of markers) {
			// @ts-expect-error False error?
			if (re.start.exec(lines[i])?.[1] === regionName) {
				return { re, start: i + 1 }
			}
		}
	}
	return undefined
}

/**
 * Finds the end marker line index for a region, handling nested regions.
 *
 * @param lines - Lines of the file content.
 * @param regionName - The name of the region to close.
 * @param chosen - The start marker info returned by {@link findRegionStart}.
 * @returns The end line index, or undefined if not found.
 */
export function findRegionEnd(
	lines: string[],
	regionName: string,
	chosen: { re: (typeof markers)[number]; start: number },
): number | undefined {
	let counter = 1
	for (let i = chosen.start; i < lines.length; i += 1) {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const line = lines[i] as unknown as string
		if (chosen.re.start.exec(line)?.[1] === regionName) {
			counter += 1
		}
		const endRegion = chosen.re.end.exec(line)?.[1]
		if ((endRegion === regionName || endRegion === '') && (counter -= 1) === 0) {
			return i
		}
	}
	return undefined
}

/**
 * Locates a named region within file lines using VitePress-style markers.
 * @param lines - Lines of the file content.
 * @param regionName - The region name to search for.
 * @returns Region bounds and marker info, or undefined if not found.
 */
export function findRegion(
	lines: string[],
	regionName: string,
): { re: (typeof markers)[number]; start: number; end?: number | undefined } | undefined {
	const chosen = findRegionStart(lines, regionName)
	if (!chosen) {
		return undefined
	}

	const end = findRegionEnd(lines, regionName, chosen)
	return { ...chosen, end }
}
