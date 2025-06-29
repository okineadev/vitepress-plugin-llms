import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { millify } from 'millify'
import { minimatch } from 'minimatch'
import pc from 'picocolors'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { approximateTokenSize } from 'tokenx'
import { remove } from 'unist-util-remove'
// @ts-expect-error
import type { OutputBundle, PluginContext } from 'vite'
import { defaultLLMsTxtTemplate, fullTagRegex } from '../constants'
import { generateLLMFriendlyPages, generateLLMsFullTxt, generateLLMsTxt } from '../generator'
import { remarkPlease, remarkReplaceImageUrls } from '../markdown'
import type { CustomTemplateVariables, LlmstxtSettings, PreparedFile, VitePressConfig } from '../types.d'
import {
	expandTemplate,
	extractTitle,
	getDirectoriesAtDepths,
	getHumanReadableSizeOf,
	log,
	resolveOutputFilePath,
} from '../utils'

/**
 * Processes each Markdown file.
 */
export async function transform(
	content: string,
	id: string,
	settings: LlmstxtSettings & { ignoreFiles: string[]; workDir: string },
	mdFiles: Set<string>,
	// TODO: Fix type
): Promise<any> {
	const orig = content

	if (!id.endsWith('.md') || !id.startsWith(settings.workDir)) {
		return null
	}

	if (settings.ignoreFiles?.length) {
		const shouldIgnore = await Promise.all(
			settings.ignoreFiles.map(async (pattern) => {
				if (typeof pattern === 'string') {
					return minimatch(path.relative(settings.workDir, id), pattern)
				}
				return false
			}),
		)

		if (shouldIgnore.some((result) => result === true)) {
			return null
		}
	}

	const modifiedContent = content
		// strip content between <llm-only> and </llm-only>
		.replace(fullTagRegex('llm-only', 'g'), '')
		// remove <llm-exclude> tags, keep the content
		.replace(fullTagRegex('llm-exclude', 'g'), '$1')

	// Add markdown file path to our collection
	mdFiles.add(id)

	return modifiedContent !== orig ? { code: modifiedContent, map: null } : null
}

/**
 * Runs only in the client build (not SSR) after completion.
 * This ensures the processing happens exactly once.
 */
export async function generateBundle(
	_options: Readonly<PluginContext>,
	bundle: OutputBundle,
	settings: LlmstxtSettings & { ignoreFiles: string[]; workDir: string },
	config: VitePressConfig,
	mdFiles: Set<string>,
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

	const mdFilesList = Array.from(mdFiles)
	const fileCount = mdFilesList.length

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

	const preparedFiles: PreparedFile[] = await Promise.all(
		mdFilesList.map(async (file) => {
			const resolvedOutFilePath = path.relative(
				settings.workDir,
				resolveOutputFilePath(
					file,
					settings.workDir,
					// @ts-ignore
					config.vitepress.rewrites,
				),
			)

			const content = await fs.readFile(file, 'utf-8')

			const markdownProcessor = remark()
				.use(remarkFrontmatter)
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

			const processedMarkdown = matter(String(await markdownProcessor.process(content)))

			// Extract title from frontmatter or use the first heading
			const title = extractTitle(processedMarkdown)?.trim() || 'Untitled'

			const filePath =
				path.basename(resolvedOutFilePath) === 'index.md' &&
				path.dirname(resolvedOutFilePath) !== settings.workDir
					? `${path.dirname(resolvedOutFilePath)}.md`
					: resolvedOutFilePath

			return { path: filePath, title, file: processedMarkdown }
		}),
	)

	// Sort files by title for better organization
	preparedFiles.sort((a, b) => a.title.localeCompare(b.title))

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
			mdFilesList,
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
							resolveOutputFilePath(
								'index.md',
								settings.workDir,
								// @ts-ignore
								config.vitepress.rewrites,
							),
						),
						outDir: settings.workDir,
						LLMsTxtTemplate: settings.customLLMsTxtTemplate || defaultLLMsTxtTemplate,
						templateVariables,
						vitepressConfig: config?.vitepress?.userConfig,
						domain: settings.domain,
						sidebar: resolvedSidebar,
						linksExtension: !settings.generateLLMFriendlyDocsForEachPage ? '.html' : undefined,
						cleanUrls: config.vitepress.cleanUrls,
						base: config.base,
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
			mdFilesList,
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
						cleanUrls: config.vitepress.cleanUrls,
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
		tasks.push(
			generateLLMFriendlyPages(
				preparedFiles,
				outDir,
				settings.domain,
				config.vitepress.cleanUrls,
				config.base,
			),
		)
	}

	if (tasks.length) {
		await Promise.all(tasks)
	}
}
