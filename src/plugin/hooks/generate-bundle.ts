// Spell-checker:words describedby
import type { GrayMatterFile, Input } from '@11ty/gray-matter'
import type { OutputBundle } from 'rollup'
import type { DefaultTheme, HeadConfig, SiteConfig } from 'vitepress'

import fs from 'node:fs/promises'
import pc from 'picocolors'

import type { PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { generateLLMFriendlyPages } from '@/generator/page-generator'
import { filterPreparedFiles, resolveIgnorePatterns } from '@/utils/ignore'
import log from '@/utils/logger'
import { resolvePageURL } from '@/utils/vitepress-rewrites'

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

/**
 * Registers an asynchronous head hook for Markdown and llms.txt discovery links.
 * @param config - VitePress configuration, including any existing head hook.
 * @param pagesFiles - Pages included in per-page Markdown generation.
 * @param generateLLMsTxt - Whether to add a link to llms.txt.
 */
function configureDiscoveryLinks(
	config: SiteConfig,
	pagesFiles: PreparedFile[],
	generateLLMsTxt: boolean,
): void {
	const { transformHead } = config
	/**
	 * Adds discovery links to the existing page head.
	 * @param context - The page being rendered.
	 * @returns Existing head entries and discovery links.
	 */
	config.transformHead = async (context): Promise<HeadConfig[]> => {
		const head = [...((await transformHead?.(context)) ?? [])]
		const basePath = context.siteData.base.replace(/\/$/u, '')
		const pagePath = resolvePageURL(context.page)
		if (pagesFiles.some((file) => file.path === pagePath)) {
			head.push(['link', { href: `${basePath}/${pagePath}`, rel: 'alternate', type: 'text/markdown' }])
		}
		if (generateLLMsTxt) {
			head.push(['link', { href: `${basePath}/llms.txt`, rel: 'describedby' }])
		}
		return head
	}
}

/** Runs only in the client build after completion, ensuring processing happens exactly once. */
// oxlint-disable-next-line max-statements max-lines-per-function
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
	const patterns = resolveIgnorePatterns(settings.ignoreFiles, settings.ignoreFilesPerOutput.pages)
	const pagesFiles = settings.generateLLMFriendlyDocsForEachPage
		? filterPreparedFiles(preparedFiles, settings.workDir, patterns.positive, patterns.negative)
		: []
	if (settings.generateLLMFriendlyDocsForEachPage) {
		tasks.push(
			generateLLMFriendlyPages(pagesFiles, outDir, {
				base: config.base,
				domain: settings.domain,
			}),
		)
	}

	configureDiscoveryLinks(config.vitepress, pagesFiles, settings.generateLLMsTxt)

	if (tasks.length > 0) {
		await Promise.all(tasks)
	}
}

export default generateBundle
