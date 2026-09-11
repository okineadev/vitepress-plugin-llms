import type { GrayMatterFile, Input } from '@11ty/gray-matter'
import type { DefaultTheme } from 'vitepress'

import type { LinksExtension, PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { defaultLLMsTxtTemplate } from '@/constants'
import { generateTOC } from '@/generator/toc'
import { clearGrayMatterCache } from '@/utils/helpers'
import { extractTitle } from '@/utils/markdown'
import { expandTemplate } from '@/utils/template-utils'

/** Options for generating the `llms.txt` file. */
export interface GenerateLLMsTxtOptions {
	/** `index.md` file. */
	indexMdFile: GrayMatterFile<Input>

	/** Template to use for generating `llms.txt`. */
	LLMsTxtTemplate?: LlmstxtSettings['customLLMsTxtTemplate']

	/** Template variables for `customLLMsTxtTemplate`. */
	templateVariables?: LlmstxtSettings['customTemplateVariables']

	/** The VitePress configuration. */
	vitepressConfig: VitePressConfig['vitepress']['userConfig']

	/** The base domain for the generated links. */
	domain?: LlmstxtSettings['domain']

	/** The link extension for generated links. */
	linksExtension?: LinksExtension | undefined

	/** Optional sidebar configuration for organizing the TOC. */
	sidebar?: DefaultTheme.Sidebar

	/**
	 * Optional directory filter to only include files within the specified directory. If not provided, all
	 * files will be included.
	 */
	directoryFilter?: string | undefined
}

function resolveTemplateVariables({
	indexMdFile,
	templateVariables = {},
	vitepressConfig,
}: GenerateLLMsTxtOptions): NonNullable<LlmstxtSettings['customTemplateVariables']> {
	const variables = { ...templateVariables }
	variables['title'] ??=
		// oxlint-disable-next-line typescript/no-unsafe-member-access
		indexMdFile.data['hero']?.name ??
		indexMdFile.data['title'] ??
		vitepressConfig.title ??
		vitepressConfig.titleTemplate ??
		extractTitle(indexMdFile) ??
		'LLMs Documentation'
	variables['description'] ??=
		// oxlint-disable-next-line typescript/no-unsafe-member-access
		indexMdFile.data['hero']?.text ??
		vitepressConfig.description ??
		indexMdFile.data['description'] ??
		indexMdFile.data['titleTemplate']
	if (typeof variables['description'] === 'string') {
		variables['description'] = `> ${variables['description']}`
	}
	variables['details'] ??=
		// oxlint-disable-next-line typescript/no-unsafe-member-access
		indexMdFile.data['hero']?.['tagline'] ??
		indexMdFile.data['tagline'] ??
		(variables['description'] === undefined && 'This file contains links to all documentation sections.')
	return variables
}

/**
 * Generates a LLMs.txt file with a table of contents and links to all documentation sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param options - Options for generating the `llms.txt` file.
 * @param options.indexMdFile - The index markdown file object.
 * @param options.LLMsTxtTemplate - Custom template string for the file.
 * @param options.templateVariables - Variables to inject into the template.
 * @param options.vitepressConfig - The VitePress configuration object.
 * @param options.domain - The base domain for absolute URLs.
 * @param options.sidebar - Custom sidebar configuration.
 * @param options.directoryFilter - Filter function or pattern for files.
 * @returns A string representing the content of the `llms.txt` file.
 */
export async function generateLLMsTxt(
	preparedFiles: PreparedFile[],
	{
		indexMdFile,
		LLMsTxtTemplate = defaultLLMsTxtTemplate,
		templateVariables = {},
		vitepressConfig,
		domain,
		sidebar,
		directoryFilter,
	}: GenerateLLMsTxtOptions,
): Promise<string> {
	clearGrayMatterCache()

	const variables = resolveTemplateVariables({ indexMdFile, templateVariables, vitepressConfig })

	variables['toc'] ??= await generateTOC(preparedFiles, {
		base: vitepressConfig.base,
		directoryFilter,
		domain,
		sidebarConfig: sidebar ?? vitepressConfig.themeConfig?.sidebar,
	})

	return expandTemplate(LLMsTxtTemplate, variables)
}
