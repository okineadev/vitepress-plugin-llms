import type { GrayMatterFile, Input } from '@11ty/gray-matter'
import type { OutputBundle } from 'rollup'
import type { DefaultTheme } from 'vitepress'

import fs from 'node:fs/promises'
import pc from 'picocolors'

import type { VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { generateLLMFriendlyPages } from '@/generator/page-generator'
import { filterPreparedFiles, resolveIgnorePatterns } from '@/utils/ignore'
import log from '@/utils/logger'

import { createOutputTasks } from './output-files'
import prepareMarkdownFiles from './prepare-markdown'

async function ensureOutputDir(outDir: string): Promise<void> {
	try {
		await fs.access(outDir)
	} catch {
		log.info(`Creating output directory: ${pc.cyan(outDir)}`)
		await fs.mkdir(outDir, { recursive: true })
	}
}

interface BundleOptions {
	bundle: OutputBundle
	settings: Required<LlmstxtSettings> & { ignoreFiles: string[]; workDir: string }
	config: VitePressConfig
	indexMdFile: GrayMatterFile<Input>
	mdFiles: Map<string, string>
}

async function resolveSidebar(
	sidebar: LlmstxtSettings['sidebar'],
	config: VitePressConfig,
): Promise<DefaultTheme.Sidebar | undefined> {
	const configuredSidebar = config.vitepress.userConfig.themeConfig?.sidebar
	return typeof sidebar === 'function' ? sidebar(configuredSidebar) : (sidebar ?? configuredSidebar)
}

/** Runs only in the client build after completion, ensuring processing happens exactly once. */
// oxlint-disable-next-line max-statements
async function generateBundle({
	bundle,
	settings,
	config,
	indexMdFile,
	mdFiles,
}: BundleOptions): Promise<void> {
	const sidebar = await resolveSidebar(settings.sidebar, config)
	const outDir = config.vitepress.outDir || 'dist'
	await ensureOutputDir(outDir)

	if (mdFiles.size === 0) {
		log.error(
			`No markdown files found to process. Check your \`${pc.bold('workDir')}\` and \`${pc.bold('ignoreFiles')}\` settings.`,
		)
		return
	}

	log.info(
		`Processing ${pc.bold(mdFiles.size.toString())} markdown files from ${pc.cyan(settings.workDir)}`,
	)
	const preparedFiles = await prepareMarkdownFiles({ bundle, config, mdFiles, settings })
	preparedFiles.sort((one, another) => one.title.localeCompare(another.title))
	const tasks = createOutputTasks({
		config,
		indexMdFile,
		mdFilesKeys: [...mdFiles.keys()],
		outDir,
		preparedFiles,
		settings,
		sidebar,
	})
	if (settings.generateLLMFriendlyDocsForEachPage) {
		const patterns = resolveIgnorePatterns(settings.ignoreFiles, settings.ignoreFilesPerOutput.pages)
		const pagesFiles = filterPreparedFiles(
			preparedFiles,
			settings.workDir,
			patterns.positive,
			patterns.negative,
		)
		tasks.push(
			generateLLMFriendlyPages(pagesFiles, outDir, { base: config.base, domain: settings.domain }),
		)
	}

	if (tasks.length > 0) {
		await Promise.all(tasks)
	}
}

export default generateBundle
