import type { GrayMatterFile, Input } from 'gray-matter'
import type { OutputBundle } from 'rollup'
import type { Plugin, ViteDevServer } from 'vite'

import path from 'node:path'
import pc from 'picocolors'

import type { DeepReadonly, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { name as packageName } from '@/../package.json'
import { defaultLLMsTxtTemplate, unnecessaryFilesList } from '@/constants'
import configureDevServer from '@/plugin/dev-server'
import { generateBundle, transform } from '@/plugin/hooks'
import log from '@/utils/logger'

const PLUGIN_NAME = packageName

//#region Plugin
/**
 * [VitePress](http://vitepress.dev/) plugin for generating raw documentation for **LLMs** in Markdown format
 * which is much lighter and more efficient for LLMs
 *
 * @param userSettings - Plugin settings.
 * @see https://github.com/okineadev/vitepress-plugin-llms
 * @see https://llmstxt.org/
 */
// oxlint-disable-next-line typescript/prefer-readonly-parameter-types jsdoc/require-returns
export function llmstxt(userSettings: LlmstxtSettings = {}): [Plugin, Plugin] {
	// Create a settings object with defaults explicitly merged
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const settings: Required<LlmstxtSettings> = {
		customLLMsTxtTemplate: defaultLLMsTxtTemplate,
		excludeBlog: true,
		excludeIndexPage: true,
		excludeTeam: true,
		excludeUnnecessaryFiles: true,
		experimental: {
			depth: 1,
			...userSettings.experimental,
		},
		generateLLMFriendlyDocsForEachPage: true,
		generateLLMsFullTxt: true,
		generateLLMsTxt: true,
		ignoreFiles: [],
		ignoreFilesPerOutput: {},
		injectLLMHint: true,
		stripHTML: true,
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		workDir: undefined as unknown as string,
		...userSettings,
	} as Required<LlmstxtSettings>

	// Store the resolved Vite config
	let config: VitePressConfig

	// Map to store all markdown files content
	const mdFiles = new Map<string, string>()

	// Stores the parsed index.md file
	let indexMdFile: GrayMatterFile<Input> | undefined = undefined

	// Flag to identify which build we're in
	let isSsrBuild = false

	return [
		{
			enforce: 'pre',
			name: `${PLUGIN_NAME}:llm-tags`,

			/** Processes each Markdown file */
			// oxlint-disable-next-line jsdoc/require-param jsdoc/require-returns
			async transform(content, id) {
				return transform(
					content,
					id,
					settings,
					(file) => {
						indexMdFile = file
					},
					mdFiles,
					config,
				)
			},
		},
		// oxlint-disable-next-line sort-keys
		{
			name: PLUGIN_NAME,
			// Run after all other plugins
			enforce: 'post',

			/** Resolves the Vite configuration and sets up the working directory. */
			// oxlint-disable-next-line jsdoc/require-param
			configResolved(resolvedConfig) {
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion
				config = resolvedConfig as Readonly<VitePressConfig>

				settings.workDir = settings.workDir
					? path.resolve(config.vitepress.srcDir, settings.workDir)
					: path.resolve(config.vitepress.srcDir)

				if (settings.excludeUnnecessaryFiles) {
					settings.excludeIndexPage && settings.ignoreFiles.push(...unnecessaryFilesList.indexPage)
					settings.excludeBlog && settings.ignoreFiles.push(...unnecessaryFilesList.blogs)
					settings.excludeTeam && settings.ignoreFiles.push(...unnecessaryFilesList.team)
				}

				// Detect if this is the SSR build
				isSsrBuild = Boolean(resolvedConfig.build.ssr)

				log.info(
					`${pc.bold(PLUGIN_NAME)} initialized ${isSsrBuild ? pc.dim('(SSR build)') : pc.dim('(client build)')} with workDir: ${pc.cyan(settings.workDir)}`,
				)
			},

			/** Configures the development server to handle `llms.txt` and markdown files for LLMs. */
			// oxlint-disable-next-line typescript/prefer-readonly-parameter-types jsdoc/require-param
			configureServer(server: ViteDevServer) {
				configureDevServer(server, config)
			},

			/**
			 * Resets the collection of markdown files when the build starts. This ensures we don't include
			 * stale data from previous builds.
			 */
			buildStart() {
				mdFiles.clear()
				log.info('Build started, file collection cleared')
			},

			/**
			 * Runs only in the client build (not SSR) after completion. This ensures the processing happens
			 * exactly once.
			 */
			// oxlint-disable-next-line jsdoc/require-param
			async generateBundle(_options, bundle: DeepReadonly<OutputBundle>) {
				// Skip processing during SSR build
				if (isSsrBuild) {
					log.info('Skipping LLMs docs generation in SSR build')
					return
				}
				if (settings.generateLLMsTxt && indexMdFile === undefined) {
					throw new Error('index.md file was not found during build')
				} else {
					await generateBundle(
						bundle,
						settings,
						config,
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion
						indexMdFile as GrayMatterFile<Input>,
						mdFiles,
					)
				}
			},
		},
	]
}

export default llmstxt

//#endregion
