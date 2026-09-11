// oxlint-disable-next-line import/no-named-default
import { type GrayMatterFile, type Input, default as matter } from '@11ty/gray-matter'
import { minimatch } from 'minimatch'
import path from 'node:path'

import type { VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { fullTagRegex } from '@/constants'
import { clearGrayMatterCache } from '@/utils/helpers'
import { resolveOutputFilePath, resolvePageURL } from '@/utils/vitepress-rewrites'

type TransformSettings = Required<LlmstxtSettings> & { ignoreFiles: string[]; workDir: string }

/**
 * Options for building and applying LLM hints.
 */
interface LLMHintOptions {
	settings: TransformSettings
	config: VitePressConfig
}

/**
 * Information about a Markdown file being processed.
 */
interface MarkdownFileInfo {
	id: string
	content: string
	isMainPage: boolean
}

/**
 * Returns true if the file should be excluded by an ignore pattern.
 *
 * @param id - The file path to check.
 * @param workDir - The base working directory.
 * @param ignoreFiles - An array of ignore patterns to test against.
 * @returns A promise that resolves to true if the file is ignored, false otherwise.
 */
async function isIgnored(id: string, workDir: string, ignoreFiles: string[]): Promise<boolean> {
	const relative = path.relative(workDir, id)
	const results = await Promise.all(
		ignoreFiles.map(async (pattern) =>
			// oxlint-disable-next-line unicorn/no-useless-promise-resolve-reject promise/no-return-wrap
			Promise.resolve(typeof pattern === 'string' ? minimatch(relative, pattern) : false),
		),
	)
	return results.some(Boolean)
}

/**
 * Strips `<llm-only>` blocks and unwraps `<llm-exclude>` wrappers.
 *
 * @param content - The Markdown content to process.
 * @returns The content with LLM-specific tags removed or unwrapped.
 */
function stripLLMTags(content: string): string {
	return content.replace(fullTagRegex('llm-only', 'g'), '').replace(fullTagRegex('llm-exclude', 'g'), '$1')
}

/**
 * Builds the hidden hint string shown to LLMs, or returns an empty string.
 *
 * @param isMainPage - A boolean indicating if the current file is the main index page.
 * @param resolvedOutFilePath - The resolved output file path for the current Markdown file.
 * @param options - Configuration options including settings and VitePress configuration.
 * @returns The generated hint string, or an empty string if no hints apply.
 */
// oxlint-disable-next-line max-statements
function buildLLMHint(isMainPage: boolean, resolvedOutFilePath: string, options: LLMHintOptions): string {
	const { settings, config } = options
	const base = config.base || '/'
	const basePath = base === '/' ? '' : base.replace(/\/$/u, '')

	if (isMainPage) {
		const notices: string[] = []
		if (settings.generateLLMsTxt) {
			notices.push(`${basePath}/llms.txt for optimized Markdown documentation`)
		}
		if (settings.generateLLMsFullTxt) {
			notices.push(`${basePath}/llms-full.txt for full documentation bundle`)
		}
		return notices.length > 0 ? `Are you an LLM? View ${notices.join(', or ')}` : ''
	}

	if (settings.generateLLMFriendlyDocsForEachPage) {
		const currentUrl = resolvePageURL(path.relative(settings.workDir, resolvedOutFilePath))
		return `Are you an LLM? You can read better optimized documentation at ${basePath}/${currentUrl} for this page in Markdown format`
	}

	return ''
}

/**
 * Injects a hidden hint block into content, after `__VP_PARAMS_END__` if present.
 *
 * @param content - The Markdown content where the hint will be injected.
 * @param hint - The hint string to inject.
 * @returns The modified content with the injected hint block.
 */
function injectHintBlock(content: string, hint: string): string {
	const hintBlock = `<div style="display: none;" hidden data-nosnippet>${hint}</div>\n`
	const marker = '__VP_PARAMS_END__'
	const idx = content.indexOf(marker)
	return idx === -1
		? `${hintBlock}\n${content}`
		: `${content.slice(0, idx + marker.length)}${hintBlock}\n${content.slice(idx + marker.length)}`
}

/**
 * Applies the LLM hint to content via gray-matter round-trip.
 *
 * @param content - The raw file content including frontmatter.
 * @param hint - The hint string to apply.
 * @returns The updated string with the hint injected inside the content body.
 */
function applyLLMHint(content: string, hint: string): string {
	clearGrayMatterCache()
	const parsed = matter(content)

	if (!hint) {
		return matter.stringify(parsed.content, parsed.data)
	}

	const updatedContent = injectHintBlock(parsed.content, hint)
	return matter.stringify(updatedContent, parsed.data)
}

/**
 * Checks whether a file path qualifies for transformation based on extension and working directory.
 *
 * @param id - The file path to evaluate.
 * @param workDir - The base working directory to ensure the file belongs to.
 * @returns True if the file should be transformed, otherwise false.
 */
function shouldTransformFile(id: string, workDir: string): boolean {
	return id.endsWith('.md') && path.resolve(id).startsWith(workDir)
}

/**
 * Optionally builds and applies an LLM hint to the content if settings dictate.
 *
 * @param content - The stripped Markdown content.
 * @param isMainPage - A boolean indicating if this is the main index page.
 * @param resolvedOutFilePath - The output path resolved for the current file.
 * @param options - Configuration options for hint generation.
 * @returns The content with the hint applied, or the original content if no hint is needed.
 */
// oxlint-disable-next-line max-params
function applyHintIfNeeded(
	content: string,
	isMainPage: boolean,
	resolvedOutFilePath: string,
	options: LLMHintOptions,
): string {
	const { settings } = options
	const needsHint =
		settings.injectLLMHint &&
		(settings.generateLLMFriendlyDocsForEachPage ||
			settings.generateLLMsTxt ||
			settings.generateLLMsFullTxt)

	if (!needsHint) {
		return content
	}

	const hint = buildLLMHint(isMainPage, resolvedOutFilePath, options)
	return applyLLMHint(content, hint)
}

/**
 * Adds the file to the Markdown collection map unless it's the index page and exclusion is enabled.
 *
 * @param file - The file information including path, content, and whether it's the main page.
 * @param settings - The transform settings dictating exclusion behavior.
 * @param mdFiles - The map collecting original markdown files.
 */
function addToCollection(
	file: MarkdownFileInfo,
	settings: TransformSettings,
	mdFiles: Map<string, string>,
): void {
	if (!file.isMainPage || !settings.excludeIndexPage) {
		mdFiles.set(file.id, file.content)
	}
}

// oxlint-disable-next-line max-params max-statements
async function transform(
	content: string,
	id: string,
	settings: TransformSettings,
	setIndexMdFile: (file: GrayMatterFile<Input>) => void,
	mdFiles: Map<string, string>,
	config: VitePressConfig,
): Promise<{ code: string; map: null } | null> {
	if (!shouldTransformFile(id, settings.workDir)) {
		// oxlint-disable-next-line unicorn/no-null
		return null
	}

	const resolvedOutFilePath = resolveOutputFilePath(
		id,
		settings.workDir,
		config.vitepress.userConfig.rewrites,
	)
	const isMainPage = path.relative(settings.workDir, resolvedOutFilePath) === 'index.md'

	if (isMainPage) {
		setIndexMdFile(matter(content))
	}

	if (
		settings.ignoreFiles.length > 0 &&
		!isMainPage &&
		(await isIgnored(id, settings.workDir, settings.ignoreFiles))
	) {
		// oxlint-disable-next-line unicorn/no-null
		return null
	}

	let modified = stripLLMTags(content)
	modified = applyHintIfNeeded(modified, isMainPage, resolvedOutFilePath, { config, settings })

	addToCollection({ content, id, isMainPage }, settings, mdFiles)

	// oxlint-disable-next-line unicorn/no-null
	return modified === content ? null : { code: modified, map: null }
}

export default transform
