import path from 'node:path'
import matter from 'gray-matter'
import type { LinksExtension, LlmstxtSettings, PreparedFile, VitePressConfig } from '../types'
import { generateMetadata } from '../utils'

/**
 * Options for generating the `llms-full.txt` file.
 */
export interface GenerateLLMsFullTxtOptions {
	/** The base domain for the generated links. */
	domain?: LlmstxtSettings['domain']

	/** The link extension for generated links. */
	linksExtension?: LinksExtension

	/** Whether to use clean URLs (without the extension). VitePressConfig['cleanUrls'] */
	cleanUrls?: boolean

	/** The base URL path from VitePress config. VitePressConfig['base'] */
	base?: string

	/**
	 * Optional directory filter to only include files within the specified directory.
	 * If not provided, all files will be included.
	 */
	directoryFilter?: string
}

/**
 * Generates a `llms-full.txt` file content with all documentation in one file.
 *
 * @param preparedFiles - An array of prepared files.
 * @param options - Options for generating the `llms-full.txt` file.
 * @returns A string representing the full content of the LLMs.txt file.
 */
export async function generateLLMsFullTxt(
	preparedFiles: PreparedFile[],
	options: GenerateLLMsFullTxtOptions,
): Promise<string> {
	const { domain, linksExtension, cleanUrls, base, directoryFilter } = options

	// Filter files by directory if directoryFilter is provided
	const filteredFiles = directoryFilter
		? directoryFilter === '.'
			? preparedFiles // Root directory includes all files
			: preparedFiles.filter((file) => {
					const relativePath = file.path
					return relativePath.startsWith(directoryFilter + path.sep) || relativePath === directoryFilter
				})
		: preparedFiles

	const fileContents = await Promise.all(
		filteredFiles.map(async (file) => {
			// file.path is already relative to outDir, so use it directly
			const metadata = await generateMetadata(file.file, {
				domain,
				filePath: file.path,
				linksExtension,
				cleanUrls,
				base,
			})

			return matter.stringify(file.file.content, metadata)
		}),
	)

	return fileContents.join('\n---\n\n')
}
