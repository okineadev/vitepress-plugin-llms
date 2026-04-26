import type { DefaultTheme } from 'vitepress'

import matter from 'gray-matter'
import path from 'node:path'

import type { DeepReadonly, LinksExtension, PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { collectPathsFromSidebarItems, flattenSidebarConfig, isPathMatch } from '@/generator/toc'
import { stripExtPosix, transformToPosixPath } from '@/utils/file-utils'
import { generateMetadata } from '@/utils/template-utils'

/** Options for generating the `llms-full.txt` file. */
export interface GenerateLLMsFullTxtOptions {
	/** The base domain for the generated links. */
	readonly domain?: LlmstxtSettings['domain']

	/** The link extension for generated links. */
	readonly linksExtension?: LinksExtension

	/**
	 * The base URL path from VitePress config.
	 *
	 * {@link VitePressConfig.base}
	 */
	readonly base?: VitePressConfig['base']

	/**
	 * Optional directory filter to only include files within the specified directory. If not provided, all
	 * files will be included.
	 */
	readonly directoryFilter?: string

	/**
	 * Optional VitePress sidebar configuration used to order file sections the same way as `llms.txt`.
	 * When provided, files are emitted in sidebar order; unmatched files are appended at the end.
	 */
	readonly sidebar?: DefaultTheme.Sidebar
}

/**
 * Re-orders `files` so that entries appear in the same order as they do in the VitePress sidebar.
 * Files that are not referenced by the sidebar are appended at the end, preserving their relative order.
 *
 * @param files - The files to reorder.
 * @param sidebar - The VitePress sidebar configuration.
 * @returns A new array with files in sidebar order.
 */
async function sortFilesBySidebar(
	files: DeepReadonly<PreparedFile[]>,
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
	sidebar: DefaultTheme.Sidebar,
): Promise<DeepReadonly<PreparedFile[]>> {
	const flatSidebar = flattenSidebarConfig(sidebar)
	const sidebarPaths = await collectPathsFromSidebarItems(flatSidebar)

	const ordered: DeepReadonly<PreparedFile>[] = []
	const seen = new Set<string>()

	// Walk sidebar paths in order and pick matching files
	for (const sidebarPath of sidebarPaths) {
		const match = files.find((file) => {
			const relativePath = `/${transformToPosixPath(stripExtPosix(file.path))}`
			return isPathMatch(relativePath, sidebarPath)
		})

		if (match && !seen.has(match.path)) {
			ordered.push(match)
			seen.add(match.path)
		}
	}

	// Append files that were not referenced by the sidebar
	for (const file of files) {
		if (!seen.has(file.path)) {
			ordered.push(file)
		}
	}

	return ordered
}

/**
 * Generates a `llms-full.txt` file content with all documentation in one file.
 * When a `sidebar` option is provided the sections are emitted in sidebar order,
 * matching the order used by `llms.txt`.
 *
 * @param preparedFiles - An array of prepared files.
 * @param options - Options for generating the `llms-full.txt` file.
 * @returns A string representing the full content of the LLMs.txt file.
 */
export async function generateLLMsFullTxt(
	preparedFiles: DeepReadonly<PreparedFile[]>,
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
	options: Readonly<GenerateLLMsFullTxtOptions>,
): Promise<string> {
	const { domain, linksExtension, base, directoryFilter, sidebar } = options

	// Filter files by directory if directoryFilter is provided
	let filteredFiles = preparedFiles

	if (typeof directoryFilter === 'string') {
		filteredFiles =
			directoryFilter === '.'
				? preparedFiles
				: preparedFiles.filter((file) => {
						const relativePath = file.path

						return (
							relativePath.startsWith(directoryFilter + path.sep) ||
							relativePath === directoryFilter
						)
					})
	}

	// Re-order files to match sidebar order (same as llms.txt) when sidebar is provided
	if (sidebar) {
		filteredFiles = await sortFilesBySidebar(filteredFiles, sidebar)
	}

	const fileContents = await Promise.all(
		filteredFiles.map(async (file) => {
			// File.path is already relative to outDir, so use it directly
			const metadata = generateMetadata(file.file, {
				base,
				domain,
				filePath: file.path,
				linksExtension,
			})

			return matter.stringify(file.file.content, metadata)
		}),
	)

	return fileContents.join('\n---\n\n')
}
