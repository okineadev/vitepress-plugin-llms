import type { Plugin, ViteDevServer } from 'vite'

import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'
import { minimatch } from 'minimatch'
import pc from 'picocolors'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { remarkPlease, vitePressPlease } from './helpers/markdown'

import { remove } from 'unist-util-remove'

import { name as packageName } from '../package.json'

import { millify } from 'millify'
import { approximateTokenSize } from 'tokenx'
import { defaultLLMsTxtTemplate } from './constants'
import { generateLLMsFullTxt, generateLLMsTxt } from './helpers/index'
import log from './helpers/logger'
import {
	expandTemplate,
	extractTitle,
	generateMetadata,
	getHumanReadableSizeOf,
	stripExt,
} from './helpers/utils'
import type {
	CustomTemplateVariables,
	LlmstxtSettings,
	PreparedFile,
	VitePressConfig,
} from './types'

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
function llmstxt(userSettings: LlmstxtSettings = {}): Plugin {
	// Create a settings object with defaults explicitly merged
	const settings: Omit<LlmstxtSettings, 'workDir'> & { workDir: string } = {
		generateLLMsTxt: true,
		generateLLMsFullTxt: true,
		generateLLMFriendlyDocsForEachPage: true,
		ignoreFiles: [],
		workDir: undefined as unknown as string,
		stripHTML: true,
		...userSettings,
	}

	// Store the resolved Vite config
	let config: VitePressConfig

	// Set to store all markdown file paths
	const mdFiles: Set<string> = new Set()

	// Flag to identify which build we're in
	let isSsrBuild = false

	return {
		name: PLUGIN_NAME,

		config(config) {
			const vitepressConfig = config as unknown as VitePressConfig
			if (vitepressConfig?.vitepress?.markdown) {
				vitepressConfig.vitepress.markdown.config = (md) =>
					md
						.use(vitePressPlease('unwrap', 'llm-exclude'))
						.use(vitePressPlease('remove', 'llm-only'))
			}
		},

		/** Resolves the Vite configuration and sets up the working directory. */
		configResolved(resolvedConfig) {
			config = resolvedConfig as VitePressConfig
			if (settings.workDir) {
				settings.workDir = path.resolve(
					config.vitepress.srcDir,
					settings.workDir as string,
				)
			} else {
				settings.workDir = config.vitepress.srcDir
			}

			// Detect if this is the SSR build
			isSsrBuild = !!resolvedConfig.build?.ssr

			log.info(
				`${pc.bold(PLUGIN_NAME)} initialized ${isSsrBuild ? pc.dim('(SSR build)') : pc.dim('(client build)')} with workDir: ${pc.cyan(settings.workDir as string)}`,
			)
		},

		/** Configures the development server to handle `llms.txt` and markdown files for LLMs. */
		async configureServer(server: ViteDevServer) {
			log.info('Dev server configured for serving plain text docs for LLMs')
			server.middlewares.use(async (req, res, next) => {
				if (req.url?.endsWith('.md') || req.url?.endsWith('.txt')) {
					try {
						// Try to read and serve the markdown file
						const filePath = path.resolve(
							config.vitepress?.outDir ?? 'dist',
							`${stripExt(req.url)}.md`,
						)
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
		 * Processes each file that Vite transforms and collects markdown files.
		 *
		 * @param _ - The file content (not used).
		 * @param id - The file identifier (path).
		 * @returns null if the file is processed, otherwise returns the original content.
		 */
		async transform(_, id: string) {
			if (!id.endsWith('.md')) {
				return null
			}

			// Skip files outside workDir if it's configured
			if (!id.startsWith(settings.workDir as string)) {
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

			// Add markdown file path to our collection
			mdFiles.add(id)
			// Return null to avoid modifying the file
			return null
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

					const processedMarkdown = matter(
						String(await markdownProcessor.process(content)),
					)

					// Extract title from frontmatter or use the first heading
					const title = extractTitle(processedMarkdown)?.trim() || 'Untitled'
					const filePath =
						path.basename(file) === 'index.md' &&
						path.dirname(file) !== settings.workDir
							? `${path.dirname(file)}.md`
							: file

					return { path: filePath, title, file: processedMarkdown }
				}),
			)

			// Sort files by title for better organization
			preparedFiles.sort((a, b) => a.title.localeCompare(b.title))

			const tasks: Promise<void>[] = []

			if (settings.generateLLMsTxt) {
				const llmsTxtPath = path.resolve(outDir, 'llms.txt')
				const templateVariables: CustomTemplateVariables = {
					title: settings.title,
					description: settings.description,
					details: settings.details,
					toc: settings.toc,
					...settings.customTemplateVariables,
				}

				tasks.push(
					(async () => {
						log.info(`Generating ${pc.cyan('llms.txt')}...`)

						const llmsTxt = await generateLLMsTxt(preparedFiles, {
							indexMd: path.resolve(settings.workDir, 'index.md'),
							srcDir: settings.workDir,
							LLMsTxtTemplate:
								settings.customLLMsTxtTemplate || defaultLLMsTxtTemplate,
							templateVariables,
							vitepressConfig: config?.vitepress?.userConfig,
							domain: settings.domain,
							sidebar: settings.sidebar,
							linksExtension: !settings.generateLLMFriendlyDocsForEachPage
								? '.html'
								: undefined,
							cleanUrls: config.cleanUrls,
						})

						await fs.writeFile(llmsTxtPath, llmsTxt, 'utf-8')

						log.success(
							expandTemplate(
								'Generated {file} (~{tokens} tokens, {size}) with {fileCount} documentation links',
								{
									file: pc.cyan('llms.txt'),
									tokens: pc.bold(millify(approximateTokenSize(llmsTxt))),
									size: pc.bold(getHumanReadableSizeOf(llmsTxt)),
									fileCount: pc.bold(fileCount.toString()),
								},
							),
						)
					})(),
				)
			}

			// Generate llms-full.txt - all content in one file
			if (settings.generateLLMsFullTxt) {
				const llmsFullTxtPath = path.resolve(outDir, 'llms-full.txt')

				tasks.push(
					(async () => {
						log.info(
							`Generating full documentation bundle (${pc.cyan('llms-full.txt')})...`,
						)

						const llmsFullTxt = await generateLLMsFullTxt(preparedFiles, {
							srcDir: settings.workDir,
							domain: settings.domain,
							linksExtension: !settings.generateLLMFriendlyDocsForEachPage
								? '.html'
								: undefined,
							cleanUrls: config.cleanUrls,
						})

						// Write content to llms-full.txt
						await fs.writeFile(llmsFullTxtPath, llmsFullTxt, 'utf-8')

						log.success(
							expandTemplate(
								'Generated {file} (~{tokens} tokens, {size}) with {fileCount} markdown files',
								{
									file: pc.cyan('llms-full.txt'),
									tokens: pc.bold(millify(approximateTokenSize(llmsFullTxt))),
									size: pc.bold(getHumanReadableSizeOf(llmsFullTxt)),
									fileCount: pc.bold(fileCount.toString()),
								},
							),
						)
					})(),
				)
			}

			if (settings.generateLLMFriendlyDocsForEachPage) {
				tasks.push(
					...preparedFiles.map(async (file) => {
						const relativePath = path.relative(settings.workDir, file.path)
						try {
							const mdFile = file.file
							const targetPath = path.resolve(outDir, relativePath)

							await fs.mkdir(path.dirname(targetPath), { recursive: true })

							await fs.writeFile(
								targetPath,
								matter.stringify(
									mdFile.content,
									await generateMetadata(mdFile, {
										domain: settings.domain,
										filePath: relativePath,
										linksExtension: '.md',
										cleanUrls: config.cleanUrls,
									}),
								),
							)

							log.success(`Processed ${pc.cyan(relativePath)}`)
						} catch (error) {
							log.error(
								`Failed to process ${pc.cyan(relativePath)}: ${(error as Error).message}`,
							)
						}
					}),
				)
			}

			if (tasks.length) {
				await Promise.all(tasks)
			}
		},
	}
}

export default llmstxt
