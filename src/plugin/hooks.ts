import fs from 'node:fs/promises'
import path from 'node:path'
import matter, { type GrayMatterFile, type Input } from 'gray-matter'
import { millify } from 'millify'
import { minimatch } from 'minimatch'
import pc from 'picocolors'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { approximateTokenSize } from 'tokenx'
import { remove } from 'unist-util-remove'
// @ts-expect-error Module '"vite"' declares 'OutputBundle' locally, but it is not exported. ts(2459)
import type { OutputBundle } from 'vite'
import { defaultLLMsTxtTemplate, fullTagRegex } from '@/constants'
import { generateLLMsFullTxt } from '@/generator/llms-full-txt'
import { generateLLMsTxt } from '@/generator/llms-txt'
import { generateLLMFriendlyPages } from '@/generator/page-generator'
import type { PreparedFile, VitePressConfig } from '@/internal-types'
import remarkPlease from '@/markdown/remark-plugins/remark-please'
import remarkReplaceImageUrls from '@/markdown/remark-plugins/replace-image-urls'
import remarkInclude from '@/markdown/remark-plugins/snippets'
import type { CustomTemplateVariables, LlmstxtSettings } from '@/types.d'
import { processVPParams } from '@/utils/dynamic-routes'
import { getDirectoriesAtDepths } from '@/utils/file-utils'
import { getHumanReadableSizeOf } from '@/utils/helpers'
import log from '@/utils/logger'
import { extractTitle } from '@/utils/markdown'
import { expandTemplate } from '@/utils/template-utils'
import { resolveOutputFilePath, resolvePageURL, resolveSourceFilePath } from '@/utils/vitepress-rewrites'

/**
 * Processes each Markdown file.
 */
export async function transform(
	content: string,
	id: string,
	settings: LlmstxtSettings & { ignoreFiles: string[]; workDir: string },
	mdFiles: Map<string, string>,
	config: VitePressConfig,
	// biome-ignore lint/suspicious/noExplicitAny: TODO: Fix type
): Promise<any> {
	const orig = content

	if (!id.endsWith('.md') || !path.resolve(id).startsWith(settings.workDir)) {
		return null
	}

	// Check if it's the main page (index.md) before ignore check
	const resolvedOutFilePath = resolveOutputFilePath(
		id,
		settings.workDir,
		config.vitepress.userConfig?.rewrites,
	)
	const isMainPage = path.relative(settings.workDir, resolvedOutFilePath) === 'index.md'

	// Apply ignore rules, but skip them for main page
	if (settings.ignoreFiles?.length) {
		const shouldIgnore = await Promise.all(
			settings.ignoreFiles.map(async (pattern) => {
				if (typeof pattern === 'string') {
					return minimatch(path.relative(settings.workDir, id), pattern)
				}
				return false
			}),
		)

		// If file should be ignored AND it's not the main page, skip processing
		if (shouldIgnore.some((result) => result === true) && !isMainPage) {
			return null
		}
	}

	let modifiedContent: string | GrayMatterFile<Input> = content
		// strip content between <llm-only> and </llm-only>
		.replace(fullTagRegex('llm-only', 'g'), '')
		// remove <llm-exclude> tags, keep the content
		.replace(fullTagRegex('llm-exclude', 'g'), '$1')

	if (
		settings.injectLLMHint &&
		(settings.generateLLMFriendlyDocsForEachPage || settings.generateLLMsTxt || settings.generateLLMsFullTxt)
	) {
		// @ts-expect-error
		matter.clearCache()
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
		} else {
			// Regular page
			if (settings.generateLLMFriendlyDocsForEachPage) {
				const mdUrl = `${basePath}/${currentUrl}`
				// TODO: Add some useful metadata like tokens count or size in kilobytes
				llmHint = `Are you an LLM? You can read better optimized documentation at ${mdUrl} for this page in Markdown format`
			}
		}

		// Insert llmHint at start or after __VP_PARAMS_END__ if present
		if (llmHint) {
			const hintBlock = `<div style="display: none;" hidden="true" aria-hidden="true">${llmHint}</div>\n`
			let content = modifiedContent.content
			const marker = '__VP_PARAMS_END__'
			const idx = content.indexOf(marker)
			if (idx !== -1) {
				content = content.slice(0, idx + marker.length) + hintBlock + content.slice(idx + marker.length)
			} else {
				content = `${hintBlock}\n${content}`
			}
			modifiedContent = matter.stringify(content, modifiedContent.data)
		}
	}

	// Add markdown file path to our collection
	if (!isMainPage || !settings.excludeIndexPage) {
		mdFiles.set(id, content)
	}

	return modifiedContent !== orig ? { code: modifiedContent, map: null } : null
}

/**
 * Runs only in the client build (not SSR) after completion.
 * This ensures the processing happens exactly once.
 */
export async function generateBundle(
	bundle: OutputBundle,
	settings: LlmstxtSettings & { ignoreFiles: string[]; workDir: string },
	config: VitePressConfig,
	mdFiles: Map<string, string>,
	isSsrBuild: boolean,
): Promise<void> {
	// Skip processing during SSR build
	if (isSsrBuild) {
		log.info('Skipping LLMs docs generation in SSR build')
		return
	}

	// resolve the sidebar option before reading `mdFiles`
	// in order to process files from content loaders used in the sidebar function
	const resolvedSidebar =
		settings.sidebar instanceof Function
			? await settings.sidebar(config?.vitepress?.userConfig?.themeConfig?.sidebar)
			: settings.sidebar

	const outDir = config.vitepress?.outDir ?? 'dist'

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
		log.warn(
			`No markdown files found to process. Check your \`${pc.bold('workDir')}\` and \`${pc.bold('ignoreFiles')}\` settings.`,
		)
		return
	}

	log.info(`Processing ${pc.bold(fileCount.toString())} markdown files from ${pc.cyan(settings.workDir)}`)

	const imageMap = new Map<string, string>()
	if (bundle) {
		for (const asset of Object.values(bundle)) {
			if (
				asset &&
				typeof asset === 'object' &&
				'type' in asset &&
				asset.type === 'asset' &&
				'fileName' in asset &&
				typeof asset.fileName === 'string' &&
				/(png|jpe?g|gif|svg|webp)$/i.test(path.extname(asset.fileName))
			) {
				// @ts-expect-error
				const name = path.posix.basename(asset.name || asset.fileName)
				imageMap.set(name, asset.fileName)
			}
		}
	}

	const mdFilesList = Array.from(mdFiles)
	const preparedFiles: PreparedFile[] = await Promise.all(
		mdFilesList.map(async ([file, content]) => {
			const resolvedOutFilePath = path.relative(
				settings.workDir,
				resolveOutputFilePath(file, settings.workDir, config.vitepress.userConfig?.rewrites),
			)

			const markdownProcessor = remark()
				.use(remarkFrontmatter)
				.use(remarkInclude({ srcDir: settings.workDir }))
				.use(remarkPlease('unwrap', 'llm-only'))
				.use(remarkPlease('remove', 'llm-exclude'))
				.use(remarkReplaceImageUrls(imageMap))

			if (settings.stripHTML) {
				// Strip HTML tags
				markdownProcessor.use(() => {
					return (tree) => {
						remove(tree, { type: 'html' })
						return tree
					}
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
			const title = extractTitle(processedMarkdown)?.trim() || 'Untitled'

			const filePath =
				path.basename(resolvedOutFilePath) === 'index.md' &&
				// Suspicious.
				path.dirname(resolvedOutFilePath) !== '.' &&
				path.dirname(resolvedOutFilePath) !== ''
					? `${path.dirname(resolvedOutFilePath)}.md`
					: resolvedOutFilePath

			return { path: filePath, title, file: processedMarkdown }
		}),
	)

	// Sort files by title for better organization
	preparedFiles.sort((a, b) => a.title.localeCompare(b.title))

	const mdFilesKeys = Array.from(mdFiles.keys())
	const tasks: Promise<void>[] = []

	if (settings.generateLLMsTxt) {
		const templateVariables: CustomTemplateVariables = {
			title: settings.title,
			description: settings.description,
			details: settings.details,
			toc: settings.toc,
			...settings.customTemplateVariables,
		}

		// Get directories at specified depths
		const directories = getDirectoriesAtDepths(
			mdFilesKeys,
			settings.workDir,
			settings.experimental?.depth ?? 1,
		)

		// Generate llms.txt for each directory at the specified depths
		tasks.push(
			...directories.map((directory) =>
				(async () => {
					const isRoot = directory.relativePath === '.'
					const directoryFilter = isRoot ? '.' : directory.relativePath

					// Determine output path
					const outputFileName = isRoot ? 'llms.txt' : path.join(directory.relativePath, 'llms.txt')
					const llmsTxtPath = path.resolve(outDir, outputFileName)

					// Create directory if needed
					await fs.mkdir(path.dirname(llmsTxtPath), { recursive: true })

					log.info(`Generating ${pc.cyan(outputFileName)}...`)

					const llmsTxt = await generateLLMsTxt(preparedFiles, {
						indexMd: path.resolve(
							settings.workDir,
							resolveSourceFilePath('index.md', settings.workDir, config.vitepress.userConfig?.rewrites),
						),
						outDir: settings.workDir,
						LLMsTxtTemplate: settings.customLLMsTxtTemplate || defaultLLMsTxtTemplate,
						templateVariables,
						vitepressConfig: config?.vitepress?.userConfig,
						domain: settings.domain,
						sidebar: resolvedSidebar,
						linksExtension: !settings.generateLLMFriendlyDocsForEachPage ? '.html' : undefined,
						directoryFilter,
					})

					await fs.writeFile(llmsTxtPath, llmsTxt, 'utf-8')

					log.success(
						expandTemplate(
							'Generated {file} (~{tokens} tokens, {size}) with {fileCount} documentation links',
							{
								file: pc.cyan(outputFileName),
								tokens: pc.bold(millify(approximateTokenSize(llmsTxt))),
								size: pc.bold(getHumanReadableSizeOf(llmsTxt)),
								fileCount: pc.bold(fileCount.toString()),
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
			settings.experimental?.depth ?? 1,
		)

		// Generate llms-full.txt for each directory at the specified depths
		tasks.push(
			...directories.map((directory) =>
				(async () => {
					const isRoot = directory.relativePath === '.'
					const directoryFilter = isRoot ? '.' : directory.relativePath

					// Determine output path
					const outputFileName = isRoot ? 'llms-full.txt' : path.join(directory.relativePath, 'llms-full.txt')
					const llmsFullTxtPath = path.resolve(outDir, outputFileName)

					// Create directory if needed
					await fs.mkdir(path.dirname(llmsFullTxtPath), { recursive: true })

					log.info(`Generating full documentation bundle (${pc.cyan(outputFileName)})...`)

					const llmsFullTxt = await generateLLMsFullTxt(preparedFiles, {
						domain: settings.domain,
						linksExtension: !settings.generateLLMFriendlyDocsForEachPage ? '.html' : undefined,
						base: config.base,
						directoryFilter,
					})

					// Write content to llms-full.txt
					await fs.writeFile(llmsFullTxtPath, llmsFullTxt, 'utf-8')

					log.success(
						expandTemplate('Generated {file} (~{tokens} tokens, {size}) with {fileCount} markdown files', {
							file: pc.cyan(outputFileName),
							tokens: pc.bold(millify(approximateTokenSize(llmsFullTxt))),
							size: pc.bold(getHumanReadableSizeOf(llmsFullTxt)),
							fileCount: pc.bold(fileCount.toString()),
						}),
					)
				})(),
			),
		)
	}

	if (settings.generateLLMFriendlyDocsForEachPage) {
		tasks.push(generateLLMFriendlyPages(preparedFiles, outDir, settings.domain, config.base))
	}

	if (tasks.length) {
		await Promise.all(tasks)
	}
}
