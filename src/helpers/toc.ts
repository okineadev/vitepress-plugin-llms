import path from 'node:path'
import type { DefaultTheme } from 'vitepress'
import type { LinksExtension, LlmstxtSettings, PreparedFile, VitePressConfig } from '../types'
import { generateLink, stripExtPosix } from './utils'

/**
 * Generates a Markdown-formatted table of contents (TOC) link for a given file.
 *
 * @param file - The prepared file.
 * @param domain - The base domain for the generated link.
 * @param relativePath - The relative path of the file, which is converted to a `.md` link.
 * @param extension - The link extension for the generated link (default is `.md`).
 * @param cleanUrls - Whether to use clean URLs (without the extension).
 * @returns The formatted TOC entry as a Markdown list item.
 */
export const generateTOCLink = (
	file: PreparedFile,
	domain: LlmstxtSettings['domain'],
	relativePath: string,
	extension?: LinksExtension,
	cleanUrls: VitePressConfig['cleanUrls'] = false,
) => {
	const description: string = file.file.data.description
	return `- [${file.title}](${generateLink(stripExtPosix(relativePath), domain, extension ?? '.md', cleanUrls)})${description ? `: ${description.trim()}` : ''}\n`
}

/**
 * Recursively collects all paths from sidebar items.
 *
 * @param items - Array of sidebar items to process.
 * @returns Array of paths collected from the sidebar items.
 */
async function collectPathsFromSidebarItems(items: DefaultTheme.SidebarItem[], base = ''): Promise<string[]> {
	return Promise.all(
		items.map(async (item) => {
			const paths: string[] = []

			if (item.link) {
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

	return normalizedFilePath === normalizedSidebarPath || normalizedFilePath === `${normalizedSidebarPath}.md`
}

/**
 * Processes sidebar items and generates TOC entries in the exact order they appear in sidebar config
 *
 * @param section - A sidebar section
 * @param preparedFiles - An array of prepared files
 * @param srcDir - The VitePress source directory
 * @param domain - Optional domain to prefix URLs with
 * @param linksExtension - The link extension for generated links.
 * @param depth - Current depth level for headings
 * @returns A string representing the formatted section of the TOC
 */
async function processSidebarSection(
	section: DefaultTheme.SidebarItem,
	preparedFiles: PreparedFile[],
	srcDir: VitePressConfig['vitepress']['srcDir'],
	domain?: LlmstxtSettings['domain'],
	linksExtension?: LinksExtension,
	cleanUrls?: VitePressConfig['cleanUrls'],
	depth = 3,
	base = '',
): Promise<string> {
	let sectionTOC = ''

	// Process items in this section
	if (section.items && Array.isArray(section.items)) {
		const [linkItems, nestedSections] = await Promise.all([
			Promise.all(
				section.items
					.filter(
						(item): item is DefaultTheme.SidebarItem & { link: string } => typeof item.link === 'string',
					)
					.map(async (item) => {
						// Normalize the link path for matching
						const normalizedItemLink = normalizeLinkPath(
							(item.base ?? section.base ?? base ?? '') + item.link,
						)
						const matchingFile = preparedFiles.find((file) => {
							const relativePath = `/${stripExtPosix(path.relative(srcDir, file.path))}`
							return isPathMatch(relativePath, normalizedItemLink)
						})

						if (matchingFile) {
							const relativePath = path.relative(srcDir, matchingFile.path)
							return generateTOCLink(matchingFile, domain, relativePath, linksExtension, cleanUrls)
						}
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
							srcDir,
							domain,
							linksExtension,
							cleanUrls,
							// Increase depth for nested sections to maintaint proper heading levels
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
		if (hasContent && section.text) {
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
	/**
	 * The VitePress source directory.
	 */
	srcDir: VitePressConfig['vitepress']['srcDir']

	/**
	 * Optional domain to prefix URLs with.
	 */
	domain?: LlmstxtSettings['domain']

	/**
	 * Optional VitePress sidebar configuration.
	 */
	sidebarConfig?: DefaultTheme.Sidebar

	/** The link extension for generated links. */
	linksExtension?: LinksExtension

	/** Whether to use clean URLs (without the extension). */
	cleanUrls?: VitePressConfig['cleanUrls']
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
	const { srcDir, domain, sidebarConfig, linksExtension, cleanUrls } = options
	let tableOfContent = ''

	// If sidebar configuration exists
	if (sidebarConfig) {
		// Flatten sidebar config if it's an object with path keys
		const flattenedSidebarConfig = flattenSidebarConfig(sidebarConfig)

		// Process each top-level section in the flattened sidebar
		if (flattenedSidebarConfig.length > 0) {
			// Process sections in parallel
			const sectionResults = await Promise.all(
				flattenedSidebarConfig.map((section) =>
					processSidebarSection(section, preparedFiles, srcDir, domain, linksExtension, cleanUrls),
				),
			)

			tableOfContent += `${sectionResults.join('\n')}\n`

			// Find files that didn't match any section
			const allSidebarPaths = await collectPathsFromSidebarItems(flattenedSidebarConfig)
			const unsortedFiles = preparedFiles.filter((file) => {
				const relativePath = `/${stripExtPosix(path.relative(srcDir, file.path))}`
				return !allSidebarPaths.some((sidebarPath: string) => isPathMatch(relativePath, sidebarPath))
			})

			// Add files that didn't match any section
			if (unsortedFiles.length > 0) {
				tableOfContent += '### Other\n\n'

				const tocEntries: string[] = []
				await Promise.all(
					unsortedFiles.map(async (file) => {
						const relativePath = path.relative(srcDir, file.path)
						tocEntries.push(generateTOCLink(file, domain, relativePath, linksExtension, cleanUrls))
					}),
				)
				tableOfContent += tocEntries.join('')
			}

			// Return the completed TOC
			return tableOfContent
		}
	}

	// Process remaining files in parallel
	if (preparedFiles.length > 0) {
		const tocEntries = await Promise.all(
			preparedFiles.map(async (file) => {
				const relativePath = path.relative(srcDir, file.path)
				return generateTOCLink(file, domain, relativePath, linksExtension, cleanUrls)
			}),
		)

		tableOfContent += tocEntries.join('')
	}

	return tableOfContent
}
