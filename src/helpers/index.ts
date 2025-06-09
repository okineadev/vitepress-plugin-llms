import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'

import type { DefaultTheme } from 'vitepress'
import { defaultLLMsTxtTemplate } from '../constants'
import type { LinksExtension, LlmstxtSettings, PreparedFile, VitePressConfig } from '../types'
import { generateTOC } from './toc'
import { expandTemplate, extractTitle, generateMetadata } from './utils'

/**
 * Options for generating the `llms.txt` file.
 */
export interface GenerateLLMsTxtOptions {
	/** Path to the main documentation file `index.md`.*/
	indexMd: string

	/** The output directory for the files. */
	outDir: string

	/** Template to use for generating `llms.txt`. */
	LLMsTxtTemplate?: LlmstxtSettings['customLLMsTxtTemplate']

	/** Template variables for `customLLMsTxtTemplate`. */
	templateVariables?: LlmstxtSettings['customTemplateVariables']

	/** The VitePress configuration. */
	vitepressConfig?: VitePressConfig['vitepress']['userConfig']

	/** The base domain for the generated links. */
	domain?: LlmstxtSettings['domain']

	/** The link extension for generated links. */
	linksExtension?: LinksExtension

	/** Whether to use clean URLs (without the extension). */
	cleanUrls?: VitePressConfig['cleanUrls']

	/** Optional sidebar configuration for organizing the TOC. */
	sidebar?: DefaultTheme.Sidebar

	/**
	 * Optional directory filter to only include files within the specified directory.
	 * If not provided, all files will be included.
	 */
	directoryFilter?: string
}

/**
 * Generates a LLMs.txt file with a table of contents and links to all documentation sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param options - Options for generating the `llms.txt` file.
 * @returns A string representing the content of the `llms.txt` file.
 *
 * @example
 * ```markdown
 * # Shadcn for Vue
 *
 * > Beautifully designed components built with Radix Vue and Tailwind CSS.
 *
 * ## Table of Contents
 *
 * - [Getting started](/docs/getting-started.md)
 * - [About](/docs/about.md)
 * - ...
 * ```
 *
 * @see https://llmstxt.org/#format
 */
export async function generateLLMsTxt(
	preparedFiles: PreparedFile[],
	{
		indexMd,
		outDir,
		LLMsTxtTemplate = defaultLLMsTxtTemplate,
		templateVariables = {},
		vitepressConfig,
		domain,
		sidebar,
		linksExtension,
		cleanUrls,
		directoryFilter,
	}: GenerateLLMsTxtOptions,
): Promise<string> {
	// @ts-expect-error
	matter.clearCache()

	const indexMdContent = await fs.readFile(indexMd, 'utf-8')
	const indexMdFile = matter(indexMdContent)

	templateVariables.title ??=
		indexMdFile.data?.hero?.name ||
		indexMdFile.data?.title ||
		vitepressConfig?.title ||
		vitepressConfig?.titleTemplate ||
		extractTitle(indexMdFile) ||
		'LLMs Documentation'

	templateVariables.description ??=
		indexMdFile.data?.hero?.text ||
		vitepressConfig?.description ||
		indexMdFile?.data?.description ||
		indexMdFile.data?.titleTemplate

	if (templateVariables.description) {
		templateVariables.description = `> ${templateVariables.description}`
	}

	templateVariables.details ??=
		indexMdFile.data?.hero?.tagline ||
		indexMdFile.data?.tagline ||
		(!templateVariables.description && 'This file contains links to all documentation sections.')

	templateVariables.toc ??= await generateTOC(preparedFiles, {
		outDir,
		domain,
		sidebarConfig: sidebar || vitepressConfig?.themeConfig?.sidebar,
		linksExtension,
		cleanUrls,
		directoryFilter,
	})

	return expandTemplate(LLMsTxtTemplate, templateVariables)
}

/**
 * Options for generating the `llms-full.txt` file.
 */
export interface GenerateLLMsFullTxtOptions {
	/** The base domain for the generated links. */
	domain?: LlmstxtSettings['domain']

	/** The link extension for generated links. */
	linksExtension?: LinksExtension

	/** Whether to use clean URLs (without the extension). */
	cleanUrls?: VitePressConfig['cleanUrls']

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
) {
	const { domain, linksExtension, cleanUrls, directoryFilter } = options

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
			})

			return matter.stringify(file.file.content, metadata)
		}),
	)

	return fileContents.join('\n---\n\n')
}
