// oxlint-disable max-lines
import type { DefaultTheme } from 'vitepress'

import path from 'node:path'

import type { LinksExtension, PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { stripExtPosix, transformToPosixPath } from '@/utils/file-utils'
import log from '@/utils/logger'
import { generateLink } from '@/utils/template-utils'

interface GenerateTOCLinkOptions {
	domain: LlmstxtSettings['domain']
	relativePath: string
	extension?: LinksExtension | undefined
	base?: string | undefined
}

/**
 * Generates a Markdown-formatted table of contents (TOC) link for a given file.
 *
 * @param file - The prepared file.
 * @param options - Configuration for link generation.
 * @param options.domain - The base domain for the generated link.
 * @param options.relativePath - The relative path of the file, which is converted to a `.md` link.
 * @param options.extension - The link extension for the generated link (default is `.md`).
 * @param options.base - The base URL path from VitePress config.
 * @returns The formatted TOC entry as a Markdown list item.
 */
export const generateTOCLink = (file: PreparedFile, options: GenerateTOCLinkOptions): string => {
	const { domain, relativePath, extension, base } = options
	const { description }: { description?: string } = file.file.data
	return `- [${file.title}](${generateLink(stripExtPosix(relativePath), { base, domain, extension: extension ?? '.md' })})${typeof description === 'string' ? `: ${description.trim()}` : ''}\n`
}
/**
 * Recursively collects all paths from sidebar items.
 *
 * @param items - Array of sidebar items to process
 * @param base - Base path used to resolve relative links (default: empty string)
 * @returns Array of resolved paths collected from the sidebar items
 */
export async function collectPathsFromSidebarItems(
	items: DefaultTheme.SidebarItem[],
	base = '',
): Promise<string[]> {
	return Promise.all(
		items.map(async (item) => {
			const paths: string[] = []

			if (typeof item.link === 'string') {
				paths.push((item.base ?? base) + item.link)
			}

			// Recursively add paths from nested items
			if (item.items && Array.isArray(item.items)) {
				// oxlint-disable-next-line typescript/no-unnecessary-condition
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

interface ResolveLeafItemsOptions {
	sectionBase: string
	base: string
	domain?: LlmstxtSettings['domain']
	linksExtension?: LinksExtension
}

/**
 * Resolves leaf sidebar items (those with a `link`) into TOC link strings.
 * Items that have no matching prepared file are skipped with a warning.
 *
 * @param items - Sidebar items to process
 * @param preparedFiles - Preprocessed file metadata used for matching links
 * @param options - Configuration for link resolution
 * @param options.sectionBase - Base path defined at the current section level
 * @param options.base - Global/base fallback path for resolving links
 * @param options.domain - Optional domain used for absolute URL generation
 * @param options.linksExtension - Optional extension to append to generated links
 * @returns Array of resolved TOC link strings
 */
async function resolveLeafItems(
	items: DefaultTheme.SidebarItem[],
	preparedFiles: PreparedFile[],
	options: ResolveLeafItemsOptions,
): Promise<string[]> {
	const { sectionBase, base, domain, linksExtension } = options

	const leafItems = items.filter(
		(item): item is DefaultTheme.SidebarItem & { link: string } => typeof item.link === 'string',
	)

	const resolved = await Promise.all(
		leafItems.map(async (item): Promise<string | undefined> => {
			const normalizedItemLink = normalizeLinkPath(
				path.posix.join(base, item.base ?? sectionBase, item.link),
			)
			const basePrefix = base.endsWith('/') ? base : `${base}/`
			const matchingFile = preparedFiles.find((file) => {
				const relativePath = `${basePrefix}${transformToPosixPath(stripExtPosix(file.path))}`
				return isPathMatch(relativePath, normalizedItemLink)
			})

			if (matchingFile) {
				return generateTOCLink(matchingFile, {
					base,
					domain,
					extension: linksExtension,
					relativePath: matchingFile.path,
				})
			}

			log.warn(
				`No matching file found for sidebar link: ${item.link} (normalized: ${normalizedItemLink})`,
			)
			return undefined
		}),
	)

	return resolved.filter((item): item is string => item !== undefined)
}

/**
 * Builds a markdown header for a section.
 *
 * @param sectionText - Section title
 * @param depth - Header depth level
 * @returns Header string or empty string
 */
function buildHeader(sectionText: string | undefined, depth: number): string {
	// oxlint-disable-next-line no-negated-condition
	return sectionText !== undefined ? `${'#'.repeat(depth)} ${sectionText}\n\n` : ''
}

/**
 * Assembles the final TOC string from links and nested sections.
 *
 * @param linkItems - Flat list of links
 * @param nestedSections - Nested section strings
 * @returns Combined content string
 */
function buildContent(linkItems: string[], nestedSections: string[]): string {
	let content = ''

	if (linkItems.length > 0) {
		content += linkItems.join('')
	}

	if (linkItems.length > 0 && nestedSections.length > 0) {
		content += '\n'
	}

	if (nestedSections.length > 0) {
		content += nestedSections.join('\n')
	}

	return content
}

interface SectionContent {
	linkItems: string[]
	nestedSections: string[]
}

/**
 * Assembles the final TOC string from a section header, leaf links, and nested sub-sections.
 *
 * @param sectionText - Section title
 * @param depth - Header depth level
 * @param content - Flat link list and nested section strings that form the section body
 * @returns Final TOC string
 */
function assembleSectionTOC(sectionText: string | undefined, depth: number, content: SectionContent): string {
	const { linkItems, nestedSections } = content
	const hasContent = linkItems.length > 0 || nestedSections.length > 0
	if (!hasContent) {
		return ''
	}

	return buildHeader(sectionText, depth) + buildContent(linkItems, nestedSections)
}

interface ResolveNestedSectionsOptions {
	sectionBase: string
	base: string
	depth: number
	domain?: LlmstxtSettings['domain']
	linksExtension?: LinksExtension | undefined
}

/**
 * Recursively processes nested sidebar items into TOC sections.
 *
 * Filters only items that contain children, processes them via
 * {@link processSidebarSection}, and removes empty results.
 *
 * @param items - Sidebar items to inspect for nested sections
 * @param preparedFiles - Preprocessed file metadata used to resolve links
 * @param options - Configuration for link resolution and heading depth
 * @param options.sectionBase - Base path defined at the current section level
 * @param options.base - Global/base fallback path for resolving links
 * @param options.depth - Current heading depth level
 * @param options.domain - Optional domain used for absolute URL generation
 * @param options.linksExtension - Optional extension to append to generated links
 * @returns Array of non-empty TOC strings for nested sections
 */
async function resolveNestedSections(
	items: DefaultTheme.SidebarItem[],
	preparedFiles: PreparedFile[],
	options: ResolveNestedSectionsOptions,
): Promise<string[]> {
	const { sectionBase, base, depth, domain, linksExtension } = options

	const nestedItems = items.filter(
		(item): item is DefaultTheme.SidebarItem & { items: DefaultTheme.SidebarItem[] } =>
			Array.isArray(item.items) && item.items.length > 0,
	)

	const results = await Promise.all(
		nestedItems.map(async (item) =>
			// oxlint-disable-next-line no-use-before-define
			processSidebarSection(item, preparedFiles, {
				// oxlint-disable-next-line typescript/no-unnecessary-condition
				base: item.base ?? sectionBase ?? base ?? '',
				// Increase depth for nested sections to maintain proper heading levels
				depth: depth + 1,
				domain,
				linksExtension,
			}),
		),
	)

	return results.filter((section_) => section_.trim() !== '')
}

interface ProcessSidebarSectionOptions {
	domain?: LlmstxtSettings['domain']
	linksExtension?: LinksExtension | undefined
	depth?: number
	base?: string
}

/**
 * Processes a sidebar section and converts it into a TOC string.
 *
 * Resolves both direct link items and nested sections recursively,
 * then combines them into a formatted markdown structure.
 *
 * @param section - Sidebar section to process
 * @param preparedFiles - Preprocessed file metadata used to resolve links
 * @param options - Additional options for processing the section
 * @param options.domain - Optional domain used for absolute URL generation
 * @param options.linksExtension - Optional extension to append to generated links
 * @param options.depth - Current heading depth level (default: 3)
 * @param options.base - Base path used for resolving relative links
 * @returns A markdown-formatted TOC string for the section, or empty string if no content
 */
async function processSidebarSection(
	section: DefaultTheme.SidebarItem,
	preparedFiles: PreparedFile[],
	options: ProcessSidebarSectionOptions = {},
): Promise<string> {
	if (!section.items || !Array.isArray(section.items)) {
		return ''
	}

	const {
		domain,
		linksExtension,
		// oxlint-disable-next-line no-magic-numbers
		depth = 3,
		base = '',
	} = options

	const sectionBase = section.base ?? ''

	const [linkItems, nonEmptyNestedSections] = await Promise.all([
		resolveLeafItems(section.items, preparedFiles, { base, domain, linksExtension, sectionBase }),
		resolveNestedSections(section.items, preparedFiles, {
			base,
			depth,
			domain,
			linksExtension,
			sectionBase,
		}),
	])

	return assembleSectionTOC(section.text, depth, { linkItems, nestedSections: nonEmptyNestedSections })
}

/** Options for generating a Table of Contents (TOC). */
export interface GenerateTOCOptions {
	/** Optional domain to prefix URLs with. */
	domain?: LlmstxtSettings['domain']

	/** Optional VitePress sidebar configuration. */
	sidebarConfig?: DefaultTheme.Sidebar

	/** The link extension for generated links. */
	linksExtension?: LinksExtension

	/**
	 * The base URL path from VitePress config.
	 *
	 * {@link VitePressConfig.base}
	 */
	base?: VitePressConfig['base'] | undefined

	/**
	 * Optional directory filter to only include files within the specified directory. If not provided, all
	 * files will be included.
	 */
	directoryFilter?: string | undefined
}

/**
 * Filters prepared files based on a directory filter.
 *
 * @param preparedFiles - All prepared files
 * @param directoryFilter - Optional directory filter
 * @returns Filtered list of files
 */
function filterFiles(preparedFiles: PreparedFile[], directoryFilter?: string): PreparedFile[] {
	if (typeof directoryFilter !== 'string') {
		return preparedFiles
	}

	if (directoryFilter === '.') {
		return preparedFiles
	}

	const normalizedFilter = transformToPosixPath(directoryFilter)

	return preparedFiles.filter((file) => {
		const normalizedPath = transformToPosixPath(file.path)
		return normalizedPath.startsWith(`${normalizedFilter}/`) || normalizedPath === normalizedFilter
	})
}

interface GenerateFileEntriesOptions {
	domain?: LlmstxtSettings['domain']
	linksExtension?: LinksExtension
	base?: string
}

async function generateFileEntries(
	files: PreparedFile[],
	{ domain, linksExtension, base = '' }: GenerateFileEntriesOptions,
): Promise<string[]> {
	return Promise.all(
		files.map(async (file) =>
			generateTOCLink(file, { base, domain, extension: linksExtension, relativePath: file.path }),
		),
	)
}

/**
 * Finds files that are not included in sidebar paths.
 *
 * @param files - Files to check
 * @param sidebarPaths - Paths extracted from sidebar
 * @returns Files not present in sidebar
 */
function findUnsortedFiles(files: PreparedFile[], sidebarPaths: string[]): PreparedFile[] {
	return files.filter((file) => {
		const relativePath = `/${transformToPosixPath(stripExtPosix(file.path))}`
		return !sidebarPaths.some((sidebarPath) => isPathMatch(relativePath, sidebarPath))
	})
}

function getSidebarSections(sidebar: DefaultTheme.SidebarItem[]): DefaultTheme.SidebarItem[] {
	return sidebar.filter((section) => Array.isArray(section.items) && section.items.length > 0)
}

async function generateSectionTOC({
	sections,
	files,
	domain,
	linksExtension,
	base,
}: GenerateSectionTOCOptions): Promise<string> {
	const results = await Promise.all(
		sections.map(async (section) =>
			processSidebarSection(section, files, { base, depth: 3, domain, linksExtension }),
		),
	)

	return `${results.join('\n')}\n`
}

/**
 * Flattens the sidebar configuration when it's an object with path keys.
 *
 * @param sidebarConfig - The sidebar configuration from VitePress.
 * @returns An array of sidebar items.
 */
export function flattenSidebarConfig(sidebarConfig: DefaultTheme.Sidebar): DefaultTheme.SidebarItem[] {
	// If it's already an array, return as is
	if (Array.isArray(sidebarConfig)) {
		return sidebarConfig as DefaultTheme.SidebarItem[]
	}

	// If it's an object with path keys, flatten it
	if (typeof sidebarConfig === 'object') {
		return Object.values(sidebarConfig).flat()
	}

	// If it's neither, return an empty array
	return []
}

interface GenerateSidebarTOCOptions {
	sidebarConfig: DefaultTheme.Sidebar
	files: PreparedFile[]

	domain?: LlmstxtSettings['domain']
	linksExtension?: LinksExtension

	base?: string
}

interface GenerateSectionTOCOptions extends Omit<GenerateSidebarTOCOptions, 'sidebarConfig'> {
	sections: DefaultTheme.SidebarItem[]
}

async function generateOtherSectionTOC({
	sections,
	files,
	domain,
	linksExtension,
	base,
}: GenerateSectionTOCOptions): Promise<string> {
	const sidebarPaths = await collectPathsFromSidebarItems(sections)

	const unsortedFiles = findUnsortedFiles(files, sidebarPaths)

	if (unsortedFiles.length === 0) {
		return ''
	}

	const entries = await generateFileEntries(unsortedFiles, { base, domain, linksExtension })

	return `### Other\n\n${entries.join('')}`
}

/**
 * Generates TOC content based on sidebar configuration.
 *
 * @param options - Function options
 * @param options.sidebarConfig - Sidebar configuration
 * @param options.files - Filtered files
 * @param options.domain - Optional domain
 * @param options.linksExtension - Optional link extension
 * @param options.base - Base path
 *
 * @returns TOC string or empty string if sidebar is empty
 */
async function generateSidebarTOC({
	sidebarConfig,
	files,
	domain,
	linksExtension,
	base = '',
}: GenerateSidebarTOCOptions): Promise<string> {
	const flattenedSidebar = flattenSidebarConfig(sidebarConfig)

	if (flattenedSidebar.length === 0) {
		return ''
	}

	const sections = getSidebarSections(flattenedSidebar)

	const sectionTOC = await generateSectionTOC({
		base,
		domain,
		files,
		linksExtension,
		sections,
	})

	const otherSectionTOC = await generateOtherSectionTOC({
		base,
		domain,
		files,
		linksExtension,
		sections,
	})

	return `${sectionTOC}${otherSectionTOC}`
}

/**
 * Generates a Table of Contents (TOC) for the provided prepared files.
 *
 * If a sidebar configuration is provided, the TOC is structured according
 * to it. Otherwise, a flat TOC is generated.
 *
 * @param preparedFiles - Prepared file metadata
 * @param options - TOC generation options
 * @returns Markdown-formatted TOC string
 */
export async function generateTOC(
	preparedFiles: PreparedFile[],
	options: GenerateTOCOptions,
): Promise<string> {
	const { domain, sidebarConfig, linksExtension, base, directoryFilter } = options

	const filteredFiles = filterFiles(preparedFiles, directoryFilter)

	if (sidebarConfig) {
		const sidebarTOC = await generateSidebarTOC({
			base,
			domain,
			files: filteredFiles,
			linksExtension,
			sidebarConfig,
		})

		if (sidebarTOC) {
			return sidebarTOC
		}
	}

	const entries = await generateFileEntries(filteredFiles, { base, domain, linksExtension })

	return entries.join('')
}
