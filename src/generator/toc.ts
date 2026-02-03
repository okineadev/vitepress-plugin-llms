import path from 'node:path'
import type { DefaultTheme } from 'vitepress'
import type { LinksExtension, PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'
import { stripExtPosix, transformToPosixPath } from '@/utils/file-utils'
import log from '@/utils/logger'
import { generateLink } from '@/utils/template-utils'

/**
 * Generates a Markdown-formatted table of contents (TOC) link for a given file.
 *
 * @param file - The prepared file.
 * @param domain - The base domain for the generated link.
 * @param relativePath - The relative path of the file, which is converted to a `.md` link.
 * @param extension - The link extension for the generated link (default is `.md`).
 * @param base - The base URL path from VitePress config.
 * @returns The formatted TOC entry as a Markdown list item.
 */
export const generateTOCLink = (
	file: PreparedFile,
	domain: LlmstxtSettings['domain'],
	relativePath: string,
	extension?: LinksExtension,
	base?: string,
) => {
	const description: string = file.file.data['description'] as string
	return `- [${file.title}](${generateLink(stripExtPosix(relativePath), domain, extension ?? '.md', base)})${description ? `: ${description.trim()}` : ''}\n`
}

/**
 * Recursively collects all paths from sidebar items.
 *
 * @param items - Array of sidebar items to process.
 * @returns Array of paths collected from the sidebar items.
 */
function collectPathsFromSidebarItems(items: DefaultTheme.SidebarItem[], base = ''): Promise<string[]> {
	return Promise.all(
		items.map(async (item) => {
			const paths: string[] = []

			if (typeof item.link === 'string') {
				paths.push((item.base ?? base) + item.link)
			}

			// Recursively add paths from nested items
			if (item.items && Array.isArray(item.items)) {
				const nestedPaths = await collectPathsFromSidebarItems(item.items, item.base ?? base ?? '')
				paths.push(...nestedPaths)
			}

			return paths
		}),
	).then((results) => results.flat())
}

/**
 * Normalizes link path for comparison, handling both index.md and directory paths.
 *
 * @param link - The link path to normalize.
 * @returns Normalized link path for consistent comparison.
 */
export function normalizeLinkPath(link: string): string {
	const normalizedPath = stripExtPosix(link)

	if (path.basename(normalizedPath) === 'index') {
		return path.dirname(normalizedPath)
	}

	return normalizedPath
}

/**
 * Checks if a file path matches a sidebar path, handling various path formats.
 *
 * @param filePath - The file path to check.
 * @param sidebarPath - The sidebar path to compare against.
 * @returns True if paths match, false otherwise
 */
export function isPathMatch(filePath: string, sidebarPath: string): boolean {
	const normalizedFilePath = normalizeLinkPath(filePath)
	const normalizedSidebarPath = normalizeLinkPath(sidebarPath)

	return (
		normalizedFilePath === normalizedSidebarPath || normalizedFilePath === `${normalizedSidebarPath}.md`
	)
}

/**
 * Processes sidebar items and generates TOC entries in the exact order they appear in sidebar config
 *
 * @param section - A sidebar section
 * @param preparedFiles - An array of prepared files
 * @param outDir - The VitePress output directory
 * @param domain - Optional domain to prefix URLs with
 * @param linksExtension - The link extension for generated links.
 * @param depth - Current depth level for headings
 * @returns A string representing the formatted section of the TOC
 */
async function processSidebarSection(
	section: DefaultTheme.SidebarItem,
	preparedFiles: PreparedFile[],
	domain?: LlmstxtSettings['domain'],
	linksExtension?: LinksExtension,
	depth = 3,
	base = '',
): Promise<string> {
	if (!section.items || !Array.isArray(section.items)) {
		return ''
	}

	let sectionTOC = ''

	// Process items in this section
	const [linkItems, nestedSections] = await Promise.all([
		Promise.all(
			section.items
				.filter(
					(item): item is DefaultTheme.SidebarItem & { link: string } =>
						typeof item.link === 'string',
				)
				.map((item) => {
					// Normalize the link path for matching
					const normalizedItemLink = normalizeLinkPath(
						path.posix.join(base, item.base ?? section.base ?? '', item.link),
					)
					const matchingFile = preparedFiles.find((file) => {
						const basePrefix = base.endsWith('/') ? base : `${base}/`
						const relativePath = `${basePrefix}${transformToPosixPath(stripExtPosix(file.path))}`
						return isPathMatch(relativePath, normalizedItemLink)
					})

					if (matchingFile) {
						const relativePath = matchingFile.path
						return generateTOCLink(matchingFile, domain, relativePath, linksExtension, base)
					}

					log.warn(
						`No matching file found for sidebar link: ${item.link} (normalized: ${normalizedItemLink})`,
					)
					return null
				}),
		).then((items) => items.filter((item): item is string => item !== null)),

		Promise.all(
			section.items
				.filter(
					(
						item,
					): item is DefaultTheme.SidebarItem & {
						items: DefaultTheme.SidebarItem[]
					} => Array.isArray(item.items) && item.items.length > 0,
				)
				.map((item) =>
					processSidebarSection(
						item,
						preparedFiles,
						domain,
						linksExtension,
						// Increase depth for nested sections to maintain proper heading levels
						depth + 1,
						item.base ?? section.base ?? base ?? '',
					),
				),
		),
	])

	// Filter out empty nested sections
	const nonEmptyNestedSections = nestedSections.filter((section) => section.trim() !== '')

	// Check if we have any content before adding section header
	const hasContent = linkItems.length > 0 || nonEmptyNestedSections.length > 0

	// Only add section header if there's actual content
	if (hasContent && section.text !== undefined) {
		sectionTOC += `${'#'.repeat(depth)} ${section.text}\n\n`
	}

	if (linkItems.length > 0) {
		sectionTOC += linkItems.join('')
	}

	// Add a blank line before nested sections if we have link items
	if (linkItems.length > 0 && nonEmptyNestedSections.length > 0) {
		sectionTOC += '\n'
	}

	// Add non-empty nested sections with appropriate spacing
	if (nonEmptyNestedSections.length > 0) {
		sectionTOC += nonEmptyNestedSections.join('\n')
	}

	return sectionTOC
}

/**
 * Flattens the sidebar configuration when it's an object with path keys.
 *
 * @param sidebarConfig - The sidebar configuration from VitePress.
 * @returns An array of sidebar items.
 */
function flattenSidebarConfig(sidebarConfig: DefaultTheme.Sidebar): DefaultTheme.SidebarItem[] {
	// If it's already an array, return as is
	if (Array.isArray(sidebarConfig)) {
		return sidebarConfig
	}

	// If it's an object with path keys, flatten it
	if (typeof sidebarConfig === 'object') {
		return Object.values(sidebarConfig).flat()
	}

	// If it's neither, return an empty array
	return []
}

/**
 * Options for generating a Table of Contents (TOC).
 */
export interface GenerateTOCOptions {
	/** Optional domain to prefix URLs with. */
	domain?: LlmstxtSettings['domain']

	/** Optional VitePress sidebar configuration. */
	sidebarConfig?: DefaultTheme.Sidebar

	/** The link extension for generated links. */
	linksExtension?: LinksExtension

	/** The base URL path from VitePress config.
	 *
	 * {@link VitePressConfig.base}
	 */
	base?: VitePressConfig['base']

	/**
	 * Optional directory filter to only include files within the specified directory.
	 * If not provided, all files will be included.
	 */
	directoryFilter?: string
}

/**
 * Generates a Table of Contents (TOC) for the provided prepared files.
 *
 * Each entry in the TOC is formatted as a markdown link to the corresponding
 * text file. If a VitePress sidebar configuration is provided, the TOC will be
 * organized into sections based on the sidebar structure, with heading levels (#, ##, ###)
 * reflecting the nesting depth of the sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param options - Options for generating the TOC.
 * @returns A string representing the formatted Table of Contents.
 */
export async function generateTOC(
	preparedFiles: PreparedFile[],
	options: GenerateTOCOptions,
): Promise<string> {
	const { domain, sidebarConfig, linksExtension, base, directoryFilter } = options
	let tableOfContent = ''

	// Filter files by directory if directoryFilter is provided
	const filteredFiles =
		typeof directoryFilter === 'string'
			? directoryFilter === '.'
				? preparedFiles // Root directory includes all files
				: preparedFiles.filter((file) => {
						const normalizedPath = transformToPosixPath(file.path)
						const normalizedFilter = transformToPosixPath(directoryFilter)
						return (
							normalizedPath.startsWith(`${normalizedFilter}/`) ||
							normalizedPath === normalizedFilter
						)
					})
			: preparedFiles

	// If sidebar configuration exists
	if (sidebarConfig) {
		// Flatten sidebar config if it's an object with path keys
		const flattenedSidebarConfig = flattenSidebarConfig(sidebarConfig)

		// Process each top-level section in the flattened sidebar
		if (flattenedSidebarConfig.length > 0) {
			// Process sections in parallel
			const sidebarSections = flattenedSidebarConfig.filter((section) => {
				// Only process sections with items
				return (
					typeof section.items === 'object' &&
					Array.isArray(section.items) &&
					section.items.length > 0
				)
			})
			const sectionResults = await Promise.all(
				sidebarSections.map((section) =>
					processSidebarSection(section, filteredFiles, domain, linksExtension, 3, base),
				),
			)

			tableOfContent += `${sectionResults.join('\n')}\n`

			// Find files that didn't match any section
			const allSidebarPaths = await collectPathsFromSidebarItems(sidebarSections)
			const unsortedFiles = filteredFiles.filter((file) => {
				const relativePath = `/${transformToPosixPath(stripExtPosix(file.path))}`
				return !allSidebarPaths.some((sidebarPath: string) => isPathMatch(relativePath, sidebarPath))
			})

			// Add files that didn't match any section
			if (unsortedFiles.length > 0) {
				tableOfContent += '### Other\n\n'

				const tocEntries = await Promise.all(
					unsortedFiles.map((file) => {
						const relativePath = file.path
						return generateTOCLink(file, domain, relativePath, linksExtension, base)
					}),
				)

				tableOfContent += tocEntries.join('')
			}

			// Return the completed TOC
			return tableOfContent
		}
	}

	// Process remaining files in parallel
	if (filteredFiles.length > 0) {
		const tocEntries = await Promise.all(
			filteredFiles.map((file) => {
				const relativePath = file.path
				return generateTOCLink(file, domain, relativePath, linksExtension, base)
			}),
		)

		tableOfContent += tocEntries.join('')
	}

	return tableOfContent
}
