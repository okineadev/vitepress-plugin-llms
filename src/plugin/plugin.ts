import type { GrayMatterFile, Input } from '@11ty/gray-matter'
import type { OutputBundle } from 'rollup'
import type { Plugin, ResolvedConfig } from 'vite'

import path from 'node:path'
import pc from 'picocolors'

import type { VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { name as packageName } from '@/../package.json'
import { defaultLLMsTxtTemplate, unnecessaryFilesList } from '@/constants'
import configureDevServer from '@/plugin/dev-server'
import { generateBundle, transform } from '@/plugin/hooks'
import log from '@/utils/logger'

interface PluginState {
	config: VitePressConfig
	indexMdFile: GrayMatterFile<Input> | undefined
	isSsrBuild: boolean
	mdFiles: Map<string, string>
	settings: Required<LlmstxtSettings>
}

function resolveSettings(userSettings: LlmstxtSettings): Required<LlmstxtSettings> {
	// Optional template values and the working directory are resolved during the build.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		customLLMsTxtTemplate: defaultLLMsTxtTemplate,
		excludeBlog: true,
		excludeIndexPage: true,
		excludeTeam: true,
		excludeUnnecessaryFiles: true,
		experimental: { depth: 1, ...userSettings.experimental },
		generateLLMFriendlyDocsForEachPage: true,
		generateLLMsFullTxt: true,
		generateLLMsTxt: true,
		ignoreFiles: [],
		ignoreFilesPerOutput: {},
		injectLLMHint: true,
		stripHTML: true,
		workDir: undefined,
		...userSettings,
	} as Required<LlmstxtSettings>
}

function configureBuild(state: PluginState, resolvedConfig: ResolvedConfig): void {
	// VitePress adds its configuration to Vite's resolved config.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	state.config = resolvedConfig as VitePressConfig
	const { settings, config } = state
	settings.workDir = settings.workDir
		? path.resolve(config.vitepress.srcDir, settings.workDir)
		: path.resolve(config.vitepress.srcDir)
	if (settings.excludeUnnecessaryFiles) {
		settings.excludeIndexPage && settings.ignoreFiles.push(...unnecessaryFilesList.indexPage)
		settings.excludeBlog && settings.ignoreFiles.push(...unnecessaryFilesList.blogs)
		settings.excludeTeam && settings.ignoreFiles.push(...unnecessaryFilesList.team)
	}
	state.isSsrBuild = Boolean(resolvedConfig.build.ssr)
	log.info(
		`${pc.bold(packageName)} initialized ${state.isSsrBuild ? pc.dim('(SSR build)') : pc.dim('(client build)')} with workDir: ${pc.cyan(settings.workDir)}`,
	)
}

async function generateBuildBundle(state: PluginState, bundle: OutputBundle): Promise<void> {
	if (state.isSsrBuild) {
		log.info('Skipping LLMs docs generation in SSR build')
		return
	}
	if (state.settings.generateLLMsTxt && state.indexMdFile === undefined) {
		throw new Error('index.md file was not found during build')
	}
	await generateBundle({
		bundle,
		config: state.config,
		// The index is only required when llms.txt generation is enabled.
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		indexMdFile: state.indexMdFile as GrayMatterFile<Input>,
		mdFiles: state.mdFiles,
		settings: state.settings,
	})
}

function createBuildPlugin(state: PluginState): Plugin {
	return {
		buildStart() {
			state.mdFiles.clear()
			log.info('Build started, file collection cleared')
		},
		configResolved(resolvedConfig) {
			configureBuild(state, resolvedConfig)
		},
		configureServer(server) {
			configureDevServer(server, state.config)
		},
		enforce: 'post',
		async generateBundle(_options, bundle) {
			await generateBuildBundle(state, bundle)
		},
		name: packageName,
	}
}

/**
 * VitePress plugin for generating lightweight Markdown documentation for LLMs.
 * @param userSettings - Plugin settings.
 * @returns The Markdown transform and documentation generation plugins.
 * @see https://github.com/okineadev/vitepress-plugin-llms
 * @see https://llmstxt.org/
 */
function llmstxt(userSettings: LlmstxtSettings = {}): [Plugin, Plugin] {
	const state: PluginState = {
		// Vite invokes configResolved before transform or server hooks.
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		config: undefined as unknown as VitePressConfig,
		indexMdFile: undefined,
		isSsrBuild: false,
		mdFiles: new Map(),
		settings: resolveSettings(userSettings),
	}
	return [
		{
			enforce: 'pre',
			name: `${packageName}:llm-tags`,
			async transform(content, id) {
				return transform(
					content,
					id,
					state.settings,
					(file) => {
						state.indexMdFile = file
					},
					state.mdFiles,
					state.config,
				)
			},
		},
		createBuildPlugin(state),
	]
}

export default llmstxt
