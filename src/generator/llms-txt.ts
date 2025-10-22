import fs from 'node:fs/promises'
import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import { defaultLLMsTxtTemplate } from '@/constants'
import { generateTOC } from '@/generator/toc'
import type { LinksExtension, PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'
import { extractTitle } from '@/utils/markdown'
import { expandTemplate } from '@/utils/template-utils'

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
	vitepressConfig: VitePressConfig['vitepress']['userConfig']

	/** The base domain for the generated links. */
	domain?: LlmstxtSettings['domain']

	/** The link extension for generated links. */
	linksExtension?: LinksExtension

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
		directoryFilter,
	}: GenerateLLMsTxtOptions,
): Promise<string> {
	// @ts-expect-error
	matter.clearCache()

	const indexMdContent = await fs.readFile(indexMd, 'utf-8')
	const indexMdFile = matter(indexMdContent)

	templateVariables.title ??=
		indexMdFile.data?.['hero']?.name ||
		indexMdFile.data?.['title'] ||
		vitepressConfig?.title ||
		vitepressConfig?.titleTemplate ||
		extractTitle(indexMdFile) ||
		'LLMs Documentation'

	templateVariables.description ??=
		indexMdFile.data?.['hero']?.text ||
		vitepressConfig?.description ||
		indexMdFile?.data?.['description'] ||
		indexMdFile.data?.['titleTemplate']

	if (templateVariables.description) {
		templateVariables.description = `> ${templateVariables.description}`
	}

	templateVariables.details ??=
		indexMdFile.data?.['hero']?.tagline ||
		indexMdFile.data?.['tagline'] ||
		(!templateVariables.description && 'This file contains links to all documentation sections.')

	templateVariables.toc ??= await generateTOC(preparedFiles, {
		outDir,
		domain,
		sidebarConfig: sidebar || vitepressConfig?.themeConfig?.sidebar,
		directoryFilter,
		base: vitepressConfig?.base,
	})

	return expandTemplate(LLMsTxtTemplate, templateVariables)
}
