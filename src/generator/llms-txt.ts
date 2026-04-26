import type { GrayMatterFile, Input } from 'gray-matter'
import type { DefaultTheme } from 'vitepress'

import type { DeepReadonly, LinksExtension, PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { defaultLLMsTxtTemplate } from '@/constants'
import { generateTOC } from '@/generator/toc'
import { clearGrayMatterCache } from '@/utils/helpers'
import { extractTitle } from '@/utils/markdown'
import { expandTemplate } from '@/utils/template-utils'

/** Options for generating the `llms.txt` file. */
export interface GenerateLLMsTxtOptions {
	/** `index.md` file. */
	readonly indexMdFile: GrayMatterFile<Input>

	/** Template to use for generating `llms.txt`. */
	readonly LLMsTxtTemplate?: Readonly<LlmstxtSettings['customLLMsTxtTemplate']>

	/** Template variables for `customLLMsTxtTemplate`. */
	templateVariables?: LlmstxtSettings['customTemplateVariables']

	/** The VitePress configuration. */
	readonly vitepressConfig: Readonly<VitePressConfig['vitepress']['userConfig']>

	/** The base domain for the generated links. */
	readonly domain?: Readonly<LlmstxtSettings['domain']>

	/** The link extension for generated links. */
	readonly linksExtension?: Readonly<LinksExtension> | undefined

	/** Optional sidebar configuration for organizing the TOC. */
	sidebar?: DefaultTheme.Sidebar

	/**
	 * Optional directory filter to only include files within the specified directory. If not provided, all
	 * files will be included.
	 */
	readonly directoryFilter?: string | undefined
}

/**
 * Generates a LLMs.txt file with a table of contents and links to all documentation sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param options - Options for generating the `llms.txt` file.
 * @returns A string representing the content of the `llms.txt` file.
 */
export async function generateLLMsTxt(
	preparedFiles: DeepReadonly<PreparedFile[]>,
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
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

	templateVariables['title'] ??=
		// oxlint-disable typescript/no-unnecessary-condition
		indexMdFile.data['hero']?.name ?? // oxlint-disable-line typescript/no-unsafe-member-access
		indexMdFile.data['title'] ??
		vitepressConfig?.title ??
		vitepressConfig?.titleTemplate ??
		extractTitle(indexMdFile) ??
		'LLMs Documentation'

	templateVariables['description'] ??=
		// oxlint-disable typescript/no-unnecessary-condition typescript/no-unsafe-member-access
		indexMdFile.data?.['hero']?.text ??
		vitepressConfig?.description ??
		indexMdFile.data?.['description'] ??
		indexMdFile.data?.['titleTemplate']

	if (typeof templateVariables['description'] === 'string') {
		templateVariables['description'] = `> ${templateVariables['description']}`
	}

	templateVariables['details'] ??=
		indexMdFile.data?.['hero']?.['tagline'] ??
		indexMdFile.data['tagline'] ??
		(templateVariables['description'] === undefined &&
			'This file contains links to all documentation sections.')

	templateVariables['toc'] ??= await generateTOC(preparedFiles, {
		base: vitepressConfig.base,
		directoryFilter,
		domain,
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		sidebarConfig: sidebar ?? (vitepressConfig.themeConfig?.sidebar as DefaultTheme.Sidebar),
	})

	return expandTemplate(LLMsTxtTemplate, templateVariables)
}
