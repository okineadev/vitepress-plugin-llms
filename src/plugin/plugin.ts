import path from 'node:path'
import pc from 'picocolors'
import type { Plugin, ViteDevServer } from 'vite'
import { name as packageName } from '@/../package.json'
import { unnecessaryFilesList } from '@/constants'
import type { VitePressConfig } from '@/internal-types'
import { configureDevServer } from '@/plugin/dev-server'
import { generateBundle, transform } from '@/plugin/hooks'
import type { LlmstxtSettings } from '@/types'
import log from '@/utils/logger'

const PLUGIN_NAME = packageName

//#region Plugin
/**
 * [VitePress](http://vitepress.dev/) plugin for generating raw documentation
 * for **LLMs** in Markdown format which is much lighter and more efficient for LLMs
 *
 * @param [userSettings={}] - Plugin settings.
 *
 * @see https://github.com/okineadev/vitepress-plugin-llms
 * @see https://llmstxt.org/
 */
export function llmstxt(userSettings: LlmstxtSettings = {}): [Plugin, Plugin] {
	// Create a settings object with defaults explicitly merged
	const settings: Required<LlmstxtSettings> = {
		generateLLMsTxt: true,
		generateLLMsFullTxt: true,
		generateLLMFriendlyDocsForEachPage: true,
		ignoreFiles: [],
		excludeUnnecessaryFiles: true,
		excludeIndexPage: true,
		excludeBlog: true,
		excludeTeam: true,
		injectLLMHint: true,
		workDir: undefined as unknown as string,
		stripHTML: true,
		experimental: {
			depth: 1,
			...userSettings.experimental,
		},
		...userSettings,
	} as Required<LlmstxtSettings>

	// Store the resolved Vite config
	let config: VitePressConfig

	// Map to store all markdown files content
	const mdFiles: Map<string, string> = new Map()

	// Flag to identify which build we're in
	let isSsrBuild = false

	return [
		{
			enforce: 'pre',
			name: `${PLUGIN_NAME}:llm-tags`,

			/** Processes each Markdown file */
			transform(content, id) {
				return transform(content, id, settings, mdFiles, config)
			},
		},
		{
			name: PLUGIN_NAME,
			// Run after all other plugins
			enforce: 'post',

			/** Resolves the Vite configuration and sets up the working directory. */
			configResolved(resolvedConfig) {
				config = resolvedConfig as VitePressConfig
				if (settings.workDir) {
					settings.workDir = path.resolve(config.vitepress.srcDir, settings.workDir)
				} else {
					settings.workDir = path.resolve(config.vitepress.srcDir)
				}

				if (settings.excludeUnnecessaryFiles) {
					settings.excludeIndexPage && settings.ignoreFiles.push(...unnecessaryFilesList.indexPage)
					settings.excludeBlog && settings.ignoreFiles.push(...unnecessaryFilesList.blogs)
					settings.excludeTeam && settings.ignoreFiles.push(...unnecessaryFilesList.team)
				}

				// Detect if this is the SSR build
				isSsrBuild = Boolean(resolvedConfig.build?.ssr)

				log.info(
					`${pc.bold(PLUGIN_NAME)} initialized ${isSsrBuild ? pc.dim('(SSR build)') : pc.dim('(client build)')} with workDir: ${pc.cyan(settings.workDir)}`,
				)
			},

			/** Configures the development server to handle `llms.txt` and markdown files for LLMs. */
			async configureServer(server: ViteDevServer) {
				await configureDevServer(server, config)
			},

			/**
			 * Resets the collection of markdown files when the build starts.
			 * This ensures we don't include stale data from previous builds.
			 */
			buildStart() {
				mdFiles.clear()
				log.info('Build started, file collection cleared')
			},

			/**
			 * Runs only in the client build (not SSR) after completion.
			 * This ensures the processing happens exactly once.
			 */
			async generateBundle(_options, bundle) {
				await generateBundle(bundle, settings, config, mdFiles, isSsrBuild)
			},
		},
	]
}

export default llmstxt

//#endregion
