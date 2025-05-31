import type { Plugin, ViteDevServer } from 'vite'

import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'
import { minimatch } from 'minimatch'
import pc from 'picocolors'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { remarkPlease } from './helpers/markdown'

import { remove } from 'unist-util-remove'

import { name as packageName } from '../package.json'

import { millify } from 'millify'
import { approximateTokenSize } from 'tokenx'
import { defaultLLMsTxtTemplate, fullTagRegex, unnecessaryFilesList } from './constants'
import viteDevServerMiddleware from './devserer-middleware'
import { generateLLMsFullTxt, generateLLMsTxt } from './helpers/index'
import log from './helpers/logger'
import { expandTemplate, extractTitle, generateMetadata, getHumanReadableSizeOf } from './helpers/utils'
import type { CustomTemplateVariables, LlmstxtSettings, PreparedFile, VitePressConfig } from './types'

const PLUGIN_NAME = packageName

/**
 * Resolves the actual filesystem path for a file, considering VitePress rewrites
 */
async function resolveActualFilePath(
	workDir: string,
	targetPath: string,
	config?: VitePressConfig,
): Promise<string | null> {
	// First try the direct path
	const directPath = path.resolve(workDir, targetPath)
	try {
		await fs.access(directPath)
		return directPath
	} catch {
		// File doesn't exist at direct path
	}

	// If we have rewrites config, try to find the original file
	const rewrites = config?.vitepress?.userConfig?.rewrites
	if (rewrites) {
		for (const [from, to] of Object.entries(rewrites)) {
			// Convert rewrite patterns to check if our target matches the 'to' pattern
			const toRegex = new RegExp(`^${to.replace(/:\w+\*/g, '(.*)')}$`)
			const match = targetPath.match(toRegex)

			if (match) {
				// Reconstruct the original path using the 'from' pattern
				let originalPath = from
				match.slice(1).forEach((capture, _) => {
					originalPath = originalPath.replace(/:rest\*|:\w+\*/g, capture)
				})

				const resolvedPath = path.resolve(workDir, originalPath)
				try {
					await fs.access(resolvedPath)
					return resolvedPath
				} catch {
					// Continue trying other patterns
				}
			}
		}
	}

	return null
}

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
		...userSettings,
	}

	// Store the resolved Vite config
	let config: VitePressConfig

	// Set to store all markdown file paths (actual filesystem paths)
	const mdFiles: Set<string> = new Set()

	// Flag to identify which build we're in
	let isSsrBuild = false

	return [
		{
			enforce: 'pre',
			name: `${PLUGIN_NAME}:llm-tags`,

			/**
			 * Processes each file that Vite transforms and collects markdown files.
			 *
			 * @param content - The file content.
			 * @param id - The file identifier (path).
			 * @returns null if the file is processed, otherwise returns the original content.
			 */
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

				// strip content between <llm-only> and </llm-only>
				const modifiedContent = content
					.replace(fullTagRegex('llm-only', 'g'), '')
					.replace(fullTagRegex('llm-exclude', 'g'), '$1')
				// remove <llm-exclude> tags, keep the content
				// modifiedContent = modifiedContent

				// Add markdown file path to our collection (store actual filesystem path)
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
				server.middlewares.use(viteDevServerMiddleware(config?.vitepress))
				log.info('Dev server configured for serving plain text docs for LLMs')
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

						const processedMarkdown = matter(String(await markdownProcessor.process(content)))

						// Extract title from frontmatter or use the first heading
						const title = extractTitle(processedMarkdown)?.trim() || 'Untitled'
						const filePath =
							path.basename(file) === 'index.md' && path.dirname(file) !== settings.workDir
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

							// Resolve the actual index.md path, considering rewrites
							const indexMdPath = await resolveActualFilePath(settings.workDir, 'index.md', config)

							const llmsTxt = await generateLLMsTxt(preparedFiles, {
								indexMd: indexMdPath || path.resolve(settings.workDir, 'index.md'), // fallback to original behavior
								srcDir: settings.workDir,
								LLMsTxtTemplate: settings.customLLMsTxtTemplate || defaultLLMsTxtTemplate,
								templateVariables,
								vitepressConfig: config?.vitepress?.userConfig,
								domain: settings.domain,
								sidebar: settings.sidebar,
								linksExtension: !settings.generateLLMFriendlyDocsForEachPage ? '.html' : undefined,
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
							log.info(`Generating full documentation bundle (${pc.cyan('llms-full.txt')})...`)

							const llmsFullTxt = await generateLLMsFullTxt(preparedFiles, {
								srcDir: settings.workDir,
								domain: settings.domain,
								linksExtension: !settings.generateLLMFriendlyDocsForEachPage ? '.html' : undefined,
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
								log.error(`Failed to process ${pc.cyan(relativePath)}: ${(error as Error).message}`)
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
