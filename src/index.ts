import type { Plugin, ViteDevServer } from 'vite'

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

import { name as packageName } from '../package.json'

import { defaultLLMsTxtTemplate, fullTagRegex, unnecessaryFilesList } from './constants'
import { generateLLMsFullTxt, generateLLMsTxt } from './helpers/index'
import log from './helpers/logger'
import { remarkPlease } from './helpers/markdown'
import {
	expandTemplate,
	extractTitle,
	generateMetadata,
	getDirectoriesAtDepths,
	getHumanReadableSizeOf,
	resolveOutputFilePath,
	stripExt,
} from './helpers/utils'
import type { CustomTemplateVariables, LlmstxtSettings, PreparedFile, VitePressConfig } from './types'

const PLUGIN_NAME = packageName

/**
 * [VitePress](http://vitepress.dev/) plugin for generating raw documentation
 * for **LLMs** in Markdown format which is much lighter and more efficient for LLMs
 *
 * @param [userSettings={}] - Plugin settings.
 *
 * @see https://github.com/okineadev/vitepress-plugin-llms
 * @see https://llmstxt.org/
 */
function llmstxt(userSettings: LlmstxtSettings = {}): [Plugin, Plugin] {
	// Create a settings object with defaults explicitly merged
	const settings: Omit<LlmstxtSettings, 'ignoreFiles' | 'workDir'> & {
		ignoreFiles: string[]
		workDir: string
	} = {
		generateLLMsTxt: true,
		generateLLMsFullTxt: true,
		generateLLMFriendlyDocsForEachPage: true,
		ignoreFiles: [],
		excludeUnnecessaryFiles: true,
		excludeIndexPage: true,
		excludeBlog: true,
		excludeTeam: true,
		workDir: undefined as unknown as string,
		stripHTML: true,
		experimental: {
			depth: 1,
			...userSettings.experimental,
		},
		...userSettings,
	}

	// Store the resolved Vite config
	let config: VitePressConfig

	// Set to store all markdown file paths
	const mdFiles: Set<string> = new Set()

	// Flag to identify which build we're in
	let isSsrBuild = false

	return [
		{
			enforce: 'pre',
			name: `${PLUGIN_NAME}:llm-tags`,

			/** Processes each Markdown file */
			async transform(content, id) {
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
					settings.workDir = config.vitepress.srcDir
				}

				if (settings.excludeUnnecessaryFiles) {
					settings.excludeIndexPage && settings.ignoreFiles.push(...unnecessaryFilesList.indexPage)
					settings.excludeBlog && settings.ignoreFiles.push(...unnecessaryFilesList.blogs)
					settings.excludeTeam && settings.ignoreFiles.push(...unnecessaryFilesList.team)
				}

				// Detect if this is the SSR build
				isSsrBuild = !!resolvedConfig.build?.ssr

				log.info(
					`${pc.bold(PLUGIN_NAME)} initialized ${isSsrBuild ? pc.dim('(SSR build)') : pc.dim('(client build)')} with workDir: ${pc.cyan(settings.workDir)}`,
				)
			},

			/** Configures the development server to handle `llms.txt` and markdown files for LLMs. */
			async configureServer(server: ViteDevServer) {
				log.info('Dev server configured for serving plain text docs for LLMs')
				server.middlewares.use(async (req, res, next) => {
					if (req.url?.endsWith('.md') || req.url?.endsWith('.txt')) {
						try {
							// Try to read and serve the markdown file
							const filePath = path.resolve(config.vitepress?.outDir ?? 'dist', `${stripExt(req.url)}.md`)
							const content = await fs.readFile(filePath, 'utf-8')
							res.setHeader('Content-Type', 'text/plain; charset=utf-8')
							res.end(content)
							return
						} catch (e) {
							// If file doesn't exist or can't be read, continue to next middleware
							log.warn(`Failed to return ${pc.cyan(req.url)}: File not found`)
							next()
						}
					}

					// Pass to next middleware if not handled
					next()
				})
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
			async generateBundle() {
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

				log.info(
					`Processing ${pc.bold(fileCount.toString())} markdown files from ${pc.cyan(settings.workDir)}`,
				)

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
									cleanUrls: config.cleanUrls,
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
								const outputFileName = isRoot
									? 'llms-full.txt'
									: path.join(directory.relativePath, 'llms-full.txt')
								const llmsFullTxtPath = path.resolve(outDir, outputFileName)

								// Create directory if needed
								await fs.mkdir(path.dirname(llmsFullTxtPath), { recursive: true })

								log.info(`Generating full documentation bundle (${pc.cyan(outputFileName)})...`)

								const llmsFullTxt = await generateLLMsFullTxt(preparedFiles, {
									domain: settings.domain,
									linksExtension: !settings.generateLLMFriendlyDocsForEachPage ? '.html' : undefined,
									cleanUrls: config.cleanUrls,
									directoryFilter,
								})

								// Write content to llms-full.txt
								await fs.writeFile(llmsFullTxtPath, llmsFullTxt, 'utf-8')

								log.success(
									expandTemplate(
										'Generated {file} (~{tokens} tokens, {size}) with {fileCount} markdown files',
										{
											file: pc.cyan(outputFileName),
											tokens: pc.bold(millify(approximateTokenSize(llmsFullTxt))),
											size: pc.bold(getHumanReadableSizeOf(llmsFullTxt)),
											fileCount: pc.bold(fileCount.toString()),
										},
									),
								)
							})(),
						),
					)
				}

				if (settings.generateLLMFriendlyDocsForEachPage) {
					tasks.push(
						...preparedFiles.map(async (file) => {
							try {
								const mdFile = file.file
								const targetPath = path.resolve(outDir, file.path)

								await fs.mkdir(path.dirname(targetPath), { recursive: true })

								await fs.writeFile(
									targetPath,
									matter.stringify(
										mdFile.content,
										await generateMetadata(mdFile, {
											domain: settings.domain,
											filePath: file.path,
											linksExtension: '.md',
											cleanUrls: config.cleanUrls,
										}),
									),
								)

								log.success(`Processed ${pc.cyan(file.path)}`)
							} catch (error) {
								log.error(`Failed to process ${pc.cyan(file.path)}: ${(error as Error).message}`)
							}
						}),
					)
				}

				if (tasks.length) {
					await Promise.all(tasks)
				}
			},
		},
	]
}

export default llmstxt
