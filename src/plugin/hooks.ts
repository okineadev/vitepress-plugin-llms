import type { Node } from 'mdast'
import type { OutputBundle } from 'rollup'

import matter, { type GrayMatterFile, type Input } from 'gray-matter'
import { millify } from 'millify'
import { minimatch } from 'minimatch'
import fs from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { estimateTokenCount } from 'tokenx'
import { remove } from 'unist-util-remove'

import type { DeepReadonly, PreparedFile, VitePressConfig } from '@/internal-types'
import type { CustomTemplateVariables, LlmstxtSettings } from '@/types.d'

import { fullTagRegex } from '@/constants'
import { generateLLMsFullTxt } from '@/generator/llms-full-txt'
import { generateLLMsTxt } from '@/generator/llms-txt'
import { generateLLMFriendlyPages } from '@/generator/page-generator'
import remarkPlease from '@/markdown/remark-plugins/remark-please'
import remarkReplaceImageUrls from '@/markdown/remark-plugins/replace-image-urls'
import remarkInclude from '@/markdown/remark-plugins/snippets'
import { processVPParams } from '@/utils/dynamic-routes'
import { getDirectoriesAtDepths } from '@/utils/file-utils'
import { clearGrayMatterCache, getHumanReadableSizeOf } from '@/utils/helpers'
import { filterPreparedFiles, resolveIgnorePatterns } from '@/utils/ignore'
import log from '@/utils/logger'
import { extractTitle } from '@/utils/markdown'
import { expandTemplate } from '@/utils/template-utils'
import { resolveOutputFilePath, resolvePageURL } from '@/utils/vitepress-rewrites'

/** Processes each Markdown file. */
// oxlint-disable-next-line jsdoc/require-returns
export async function transform(
	// oxlint-disable-next-line jsdoc/require-param
	content: string,
	id: string,
	settings: DeepReadonly<Required<LlmstxtSettings> & { ignoreFiles: string[]; workDir: string }>,
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
	setIndexMdFile: (file: GrayMatterFile<Input>) => void,
	mdFiles: Readonly<Map<string, string>>,
	config: DeepReadonly<VitePressConfig>,
	// TODO: Fix type
): Promise<{ code: string; map: null } | null> {
	const orig = content

	if (!id.endsWith('.md') || !path.resolve(id).startsWith(settings.workDir)) {
		// oxlint-disable-next-line unicorn/no-null
		return null
	}

	// Check if it's the main page (index.md) before ignore check
	const resolvedOutFilePath = resolveOutputFilePath(
		id,
		settings.workDir,
		config.vitepress.userConfig.rewrites,
	)
	const isMainPage = path.relative(settings.workDir, resolvedOutFilePath) === 'index.md'

	if (isMainPage) {
		// Pick up index.md file for llms.txt generation
		setIndexMdFile(matter(content))
	}

	// Apply ignore rules, but skip them for main page
	if (settings.ignoreFiles.length > 0) {
		const shouldIgnore = await Promise.all(
			settings.ignoreFiles.map(async (pattern) => {
				if (typeof pattern === 'string') {
					return minimatch(path.relative(settings.workDir, id), pattern)
				}
				return false
			}),
		)

		// If file should be ignored AND it's not the main page, skip processing
		if (shouldIgnore.some(Boolean) && !isMainPage) {
			// oxlint-disable-next-line unicorn/no-null
			return null
		}
	}

	let modifiedContent: string | GrayMatterFile<Input> = content
		// Strip content between <llm-only> and </llm-only>
		.replace(fullTagRegex('llm-only', 'g'), '')
		// Remove <llm-exclude> tags, keep the content
		.replace(fullTagRegex('llm-exclude', 'g'), '$1')

	if (
		settings.injectLLMHint &&
		(settings.generateLLMFriendlyDocsForEachPage ||
			settings.generateLLMsTxt ||
			settings.generateLLMsFullTxt)
	) {
		clearGrayMatterCache()
		modifiedContent = matter(modifiedContent)

		// Generate hint for LLMs
		let llmHint = ''

		const currentUrl = resolvePageURL(path.relative(settings.workDir, resolvedOutFilePath))

		const base = config.base || '/'
		const basePath = base === '/' ? '' : base.replace(/\/$/, '')

		if (isMainPage) {
			const notices = []

			if (settings.generateLLMsTxt) {
				notices.push(`${basePath}/llms.txt for optimized Markdown documentation`)
			}

			if (settings.generateLLMsFullTxt) {
				notices.push(`${basePath}/llms-full.txt for full documentation bundle`)
			}

			if (notices.length > 0) {
				llmHint = `Are you an LLM? View ${notices.join(', or ')}`
			}
		} else if (settings.generateLLMFriendlyDocsForEachPage) {
			const mdUrl = `${basePath}/${currentUrl}`
			// TODO: Add some useful metadata like tokens count or size in kilobytes
			llmHint = `Are you an LLM? You can read better optimized documentation at ${mdUrl} for this page in Markdown format`
		}

		// Insert llmHint at start or after __VP_PARAMS_END__ if present
		if (llmHint) {
			const hintBlock = `<div style="display: none;" hidden="true" aria-hidden="true">${llmHint}</div>\n`
			// oxlint-disable-next-line no-shadow
			let { content } = modifiedContent
			const marker = '__VP_PARAMS_END__'
			const idx = content.indexOf(marker)
			content =
				idx === -1
					? `${hintBlock}\n${content}`
					: `${content.slice(0, idx + marker.length)}${hintBlock}\n${content.slice(idx + marker.length)}`
			modifiedContent = matter.stringify(content, modifiedContent.data)
		} else {
			// Ensure modifiedContent is converted back to string when no hint is generated,
			// Otherwise GrayMatterFile object causes src.replace is not a function
			modifiedContent = matter.stringify(modifiedContent.content, modifiedContent.data)
		}
	}

	// Add markdown file path to our collection
	if (!isMainPage || !settings.excludeIndexPage) {
		mdFiles.set(id, content)
	}

	// oxlint-disable-next-line unicorn/no-null
	return modifiedContent === orig ? null : { code: modifiedContent, map: null }
}

/** Runs only in the client build (not SSR) after completion. This ensures the processing happens exactly once. */

export async function generateBundle(
	// oxlint-disable-next-line jsdoc/require-param
	bundle: DeepReadonly<OutputBundle>,
	// oxlint-disable typescript/prefer-readonly-parameter-types
	settings: Required<LlmstxtSettings> & { ignoreFiles: string[]; workDir: string },
	config: VitePressConfig,
	indexMdFile: GrayMatterFile<Input>,
	// oxlint-enable typescript/prefer-readonly-parameter-types
	mdFiles: DeepReadonly<Map<string, string>>,
): Promise<void> {
	// Resolve the sidebar option before reading `mdFiles`
	// In order to process files from content loaders used in the sidebar function
	const resolvedSidebar =
		typeof settings.sidebar === 'function'
			? await settings.sidebar(config.vitepress.userConfig.themeConfig?.sidebar)
			: settings.sidebar

	const outDir = config.vitepress.outDir || 'dist'

	// Create output directory if it doesn't exist
	try {
		await fs.access(outDir)
	} catch {
		log.info(`Creating output directory: ${pc.cyan(outDir)}`)
		await fs.mkdir(outDir, { recursive: true })
	}

	const fileCount = mdFiles.size

	// Skip if no files found
	if (fileCount === 0) {
		log.error(
			`No markdown files found to process. Check your \`${pc.bold('workDir')}\` and \`${pc.bold('ignoreFiles')}\` settings.`,
		)
		return
	}

	log.info(`Processing ${pc.bold(fileCount.toString())} markdown files from ${pc.cyan(settings.workDir)}`)

	const imageMap = new Map<string, string>()
	if (typeof bundle === 'object') {
		for (const asset of Object.values(bundle)) {
			if (/(png|jpe?g|gif|svg|webp)$/i.test(path.extname(asset.fileName))) {
				const name = path.posix.basename(asset.fileName)
				imageMap.set(name, asset.fileName)
			}
		}
	}

	const mdFilesList = [...mdFiles]
	const preparedFiles: PreparedFile[] = await Promise.all(
		mdFilesList.map(async ([file, content]: Readonly<[Readonly<string>, Readonly<string>]>) => {
			const resolvedOutFilePath = path.relative(
				settings.workDir,
				resolveOutputFilePath(file, settings.workDir, config.vitepress.userConfig.rewrites),
			)

			const markdownProcessor = remark()
				.use(remarkFrontmatter)
				.use(remarkInclude({ srcDir: settings.workDir }))
				.use(remarkPlease('unwrap', 'llm-only'))
				.use(remarkPlease('remove', 'llm-exclude'))
				.use(remarkReplaceImageUrls(imageMap))

			if (settings.stripHTML) {
				// Strip HTML tags
				markdownProcessor.use(() => (tree): Node => {
					remove(tree, { type: 'html' })
					return tree
				})
			}

			content = processVPParams(content)

			const processedMarkdown = matter(
				String(
					await markdownProcessor.process({
						cwd: settings.workDir,
						path: file,
						value: content,
					}),
				),
			)

			// Extract title from frontmatter or use the first heading
			const title = extractTitle(processedMarkdown)?.trim() ?? 'Untitled'

			const filePath =
				path.basename(resolvedOutFilePath) === 'index.md' &&
				// Suspicious.
				path.dirname(resolvedOutFilePath) !== '.' &&
				path.dirname(resolvedOutFilePath) !== ''
					? `${path.dirname(resolvedOutFilePath)}.md`
					: resolvedOutFilePath

			return { file: processedMarkdown, path: filePath, title }
		}),
	)

	// Sort files by title for better organization
	preparedFiles.sort((one, another) => one.title.localeCompare(another.title))

	// Pre-resolve per-output ignore patterns (merged with global ignoreFiles)
	const perOutput = settings.ignoreFilesPerOutput

	const llmsTxtPatterns = resolveIgnorePatterns(settings.ignoreFiles, perOutput.llmsTxt)
	const llmsFullTxtPatterns = resolveIgnorePatterns(settings.ignoreFiles, perOutput.llmsFullTxt)
	const pagesPatterns = resolveIgnorePatterns(settings.ignoreFiles, perOutput.pages)

	const mdFilesKeys = [...mdFiles.keys()]
	const tasks: Promise<void>[] = []

	if (settings.generateLLMsTxt) {
		const templateVariables: CustomTemplateVariables = {
			description: settings.description,
			details: settings.details,
			title: settings.title,
			toc: settings.toc,
			...settings.customTemplateVariables,
		}

		// Get directories at specified depths
		const directories = getDirectoriesAtDepths(
			mdFilesKeys,
			settings.workDir,
			settings.experimental.depth ?? 1,
		)

		// Apply per-output filtering for llms.txt
		const llmsTxtFiles = filterPreparedFiles(
			preparedFiles,
			settings.workDir,
			llmsTxtPatterns.positive,
			llmsTxtPatterns.negative,
		)

		// Generate llms.txt for each directory at the specified depths
		tasks.push(
			...directories.map(async (directory: Readonly<ReturnType<typeof getDirectoriesAtDepths>[0]>) =>
				(async (): Promise<void> => {
					const isRoot = directory.relativePath === '.'
					const directoryFilter = isRoot ? '.' : directory.relativePath

					// Determine output path
					const outputFileName = isRoot ? 'llms.txt' : path.join(directory.relativePath, 'llms.txt')
					const llmsTxtPath = path.resolve(outDir, outputFileName)

					// Create directory if needed
					await fs.mkdir(path.dirname(llmsTxtPath), { recursive: true })

					log.info(`Generating ${pc.cyan(outputFileName)}...`)

					const llmsTxt = await generateLLMsTxt(llmsTxtFiles, {
						LLMsTxtTemplate: settings.customLLMsTxtTemplate,
						directoryFilter,
						domain: settings.domain,
						indexMdFile,
						linksExtension: settings.generateLLMFriendlyDocsForEachPage ? undefined : '.html',
						sidebar: resolvedSidebar,
						templateVariables,
						vitepressConfig: config.vitepress.userConfig,
					})

					await fs.writeFile(llmsTxtPath, llmsTxt, 'utf8')

					log.success(
						expandTemplate(
							'Generated {file} (~{tokens} tokens, {size}) with {fileCount} documentation links',
							{
								file: pc.cyan(outputFileName),
								fileCount: pc.bold(llmsTxtFiles.length.toString()),
								size: pc.bold(getHumanReadableSizeOf(llmsTxt)),
								tokens: pc.bold(millify(estimateTokenCount(llmsTxt))),
							},
						),
					)
				})(),
			),
		)
	}

	// Generate llms-full.txt - all content in one file
	if (settings.generateLLMsFullTxt) {
		// Get directories at specified depths for llms-full.txt as well
		const directories = getDirectoriesAtDepths(
			mdFilesKeys,
			settings.workDir,
			settings.experimental.depth ?? 1,
		)

		// Apply per-output filtering for llms-full.txt
		const llmsFullTxtFiles = filterPreparedFiles(
			preparedFiles,
			settings.workDir,
			llmsFullTxtPatterns.positive,
			llmsFullTxtPatterns.negative,
		)

		// Generate llms-full.txt for each directory at the specified depths
		tasks.push(
			...directories.map(async (directory: Readonly<ReturnType<typeof getDirectoriesAtDepths>[0]>) =>
				(async (): Promise<void> => {
					const isRoot = directory.relativePath === '.'
					const directoryFilter = isRoot ? '.' : directory.relativePath

					// Determine output path
					const outputFileName = isRoot
						? 'llms-full.txt'
						: path.join(directory.relativePath, 'llms-full.txt')
					const llmsFullTxtPath = path.resolve(outDir, outputFileName)

					// Create directory if needed
					await fs.mkdir(path.dirname(llmsFullTxtPath), { recursive: true })

					log.info(`Generating full documentation bundle (${pc.cyan(outputFileName)})...`)

					const llmsFullTxt = await generateLLMsFullTxt(llmsFullTxtFiles, {
						base: config.base,
						directoryFilter,
						domain: settings.domain,
						linksExtension: settings.generateLLMFriendlyDocsForEachPage ? undefined : '.html',
						sidebar: resolvedSidebar,
					})

					// Write content to llms-full.txt
					await fs.writeFile(llmsFullTxtPath, llmsFullTxt, 'utf8')

					log.success(
						expandTemplate(
							'Generated {file} (~{tokens} tokens, {size}) with {fileCount} markdown files',
							{
								file: pc.cyan(outputFileName),
								fileCount: pc.bold(llmsFullTxtFiles.length.toString()),
								size: pc.bold(getHumanReadableSizeOf(llmsFullTxt)),
								tokens: pc.bold(millify(estimateTokenCount(llmsFullTxt))),
							},
						),
					)
				})(),
			),
		)
	}

	if (settings.generateLLMFriendlyDocsForEachPage) {
		// Apply per-output filtering for individual pages
		const pagesFiles = filterPreparedFiles(
			preparedFiles,
			settings.workDir,
			pagesPatterns.positive,
			pagesPatterns.negative,
		)

		tasks.push(generateLLMFriendlyPages(pagesFiles, outDir, settings.domain, config.base))
	}

	if (tasks.length > 0) {
		await Promise.all(tasks)
	}
}
