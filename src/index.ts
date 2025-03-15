import type { Plugin, ViteDevServer } from 'vite'

import * as fs from 'node:fs'
import * as path from 'node:path'

import pc from 'picocolors'
import { extractTitle, stripExt } from './helpers'
import log from './logger'
import type { llmstxtSettings } from './types'

/**
 * [VitePress](http://vitepress.dev/) plugin for generating raw documentation
 * for **LLMs** in Markdown format which is much lighter and more efficient for LLMs
 *
 * @see https://llmstxt.org/
 */
export default function llmstxt(
	settings: llmstxtSettings = {
		generateLLMsFullTxt: true,
		generateLLMsTxt: true,
	},
): Plugin {
	// Store the resolved Vite config
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	let config: any

	// Set to store all markdown files paths
	const mdFiles: Set<string> = new Set()

	// Flag to identify which build we're in
	let isSsrBuild = false

	return {
		name: 'vitepress-plugin-llms',
		enforce: 'post', // Run after other plugins

		configResolved(resolvedConfig) {
			config = resolvedConfig
			// Detect if this is the SSR build
			isSsrBuild = !!resolvedConfig.build?.ssr
			log.info(
				`Plugin initialized ${isSsrBuild ? pc.dim('(SSR build)') : pc.dim('(client build)')}`,
			)
		},

		/** Configure the development server to handle llms.txt and markdown files for LLMs */
		configureServer(server: ViteDevServer) {
			log.info('Development server configured to serve markdown files')
			server.middlewares.use((req, res, next) => {
				if (req.url?.endsWith('.md') || req.url?.endsWith('.txt')) {
					try {
						// Try to read and serve the markdown file
						const filePath = path.join(
							config.vitepress?.outDir,
							`${path.basename(req.url, path.extname(req.url))}.md`,
						)
						const content = fs.readFileSync(filePath, 'utf-8')
						res.setHeader('Content-Type', 'text/markdown')
						res.end(content)
						return
					} catch (e) {
						// If file doesn't exist or can't be read, continue to next middleware
						next()
					}
				}

				// Pass to next middleware if not handled
				next()
			})
		},

		/**
		 * Reset the collection of markdown files when build starts
		 * This ensures we don't include stale data from previous builds
		 */
		buildStart() {
			mdFiles.clear()
			log.info('Build started, file collection cleared')
		},

		/**
		 * Process each file that Vite transforms
		 * Collect markdown files regardless of build type
		 */
		transform(_, id) {
			if (id.endsWith('.md')) {
				// Add markdown file path to our collection
				mdFiles.add(id)
				// Return null to avoid modifying the file
				return null
			}
		},

		/**
		 * Run ONLY in the client build (not SSR) after completion
		 * This ensures the processing happens exactly once
		 */
		generateBundle() {
			// Skip processing during SSR build
			if (isSsrBuild) {
				log.info('Skipping file generation in SSR build')
				return
			}

			// Create output directory if it doesn't exist
			if (!fs.existsSync(config.vitepress.outDir)) {
				log.info(
					`Creating output directory: ${pc.cyan(config.vitepress.outDir)}`,
				)
				fs.mkdirSync(config.vitepress.outDir, { recursive: true })
			}

			const mdFilesList = Array.from(mdFiles)
			const fileCount = mdFilesList.length

			// Skip if no files found
			if (fileCount === 0) {
				log.warn('No markdown files found to process')
				return
			}

			log.info(`Processing ${pc.bold(fileCount.toString())} markdown files...`)

			const preparedFiles = []

			// Copy all markdown files to output directory
			for (const file of mdFilesList) {
				const fileName = path.basename(file)
				const targetPath = path.resolve(config.vitepress.outDir, fileName)
				// const fileNameWithoutExt = path.basename(file, '.md')

				try {
					const content = fs.readFileSync(file, 'utf-8')
					const title = extractTitle(content)
					const fileName = path.basename(file)

					preparedFiles.push({ title, fileName })

					// Copy file to output directory
					fs.copyFileSync(file, targetPath)
					log.success(`Copied ${pc.cyan(fileName)} to output directory`)
				} catch (error) {
					// @ts-ignore
					log.error(`Failed to copy ${pc.cyan(fileName)}: ${error.message}`)
				}
			}

			// Sort files by title for better organization
			preparedFiles.sort((a, b) => a.title.localeCompare(b.title))

			// Generate llms.txt - table of contents with links
			if (settings.generateLLMsTxt) {
				const llmsTxtPath = path.resolve(config.vitepress.outDir, 'llms.txt')

				let llmsTxtContent =
					'# LLMs Documentation\n\nThis file contains links to all documentation sections.\n\n'

				// Add table of contents
				llmsTxtContent += '## Table of Contents\n\n'

				for (const file of preparedFiles) {
					llmsTxtContent += `- [${file.title}](/${stripExt(file.fileName)}.txt)\n`
				}

				// Write content to llms.txt
				fs.writeFileSync(llmsTxtPath, llmsTxtContent, 'utf-8')
				log.success(
					`Generated ${pc.cyan('llms.txt')} with ${pc.bold(fileCount.toString())} documentation sections`,
				)
			}

			// Generate llms-full.txt - all content in one file
			if (settings.generateLLMsFullTxt) {
				const llmsFullTxtPath = path.resolve(
					config.vitepress.outDir,
					'llms-full.txt',
				)
				let llmsFullTxtFileContent = ''

				log.info(`Generating ${pc.cyan('llms-full.txt')}...`)

				// Build content string using for loop
				for (const file of preparedFiles) {
					llmsFullTxtFileContent += fs.readFileSync(
						path.resolve(config.vitepress.outDir, file.fileName),
					)

					// Add newline for all but the last item
					if (preparedFiles.lastIndexOf(file) !== preparedFiles.length - 1) {
						llmsFullTxtFileContent += '\n---\n\n'
					}
				}

				// Write content to llms-full.txt
				fs.writeFileSync(llmsFullTxtPath, llmsFullTxtFileContent, 'utf-8')
				log.success(
					`Generated ${pc.cyan('llms-full.txt')} with ${pc.bold(fileCount.toString())} markdown files`,
				)
			}
		},
	}
}
