import type { Plugin, ViteDevServer } from 'vite'

import fs from 'node:fs'
import path from 'node:path'

import pc from 'picocolors'
import log from './logger'
import { extractTitle } from './helpers'

interface llmstxtSettings {
	/**
	 * Determines whether to generate the `llms-full.txt` which contains all the documentation in one file.
	 *
	 * @default true
	 */
	generateLLMsFullTxt: boolean
	/**
	 * Determines whether to generate the `llms.txt` which contains a list of sections with links.
	 *
	 * @default true
	 */
	generateLLMsTxt: boolean
}

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
		name: 'vite-plugin-llmstxt',
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

			// Structure to store file information for llms.txt
			const fileInfos = []

			// Copy all markdown files to output directory
			for (let i = 0; i < mdFilesList.length; i++) {
				const file = mdFilesList[i]
				const fileName = path.basename(file)
				const targetPath = path.resolve(config.vitepress.outDir, fileName)
				const fileNameWithoutExt = path.basename(file, '.md')

				try {
					// Read file content
					const content = fs.readFileSync(file, 'utf-8')
					const title = extractTitle(content)

					// Store file info for llms.txt
					fileInfos.push({
						title,
						fileName: fileNameWithoutExt,
						content,
					})

					// Copy file to output directory
					fs.copyFileSync(file, targetPath)
					log.success(`Copied ${pc.cyan(fileName)} to output directory`)
				} catch (error) {
					// @ts-ignore
					log.error(`Failed to copy ${pc.cyan(fileName)}: ${error.message}`)
				}
			}

			// Generate llms.txt - table of contents with links
			if (settings.generateLLMsTxt) {
				const llmsTxtPath = path.resolve(config.vitepress.outDir, 'llms.txt')

				let llmsTxtContent =
					'# LLMs Documentation\n\nThis file contains links to all documentation sections. Each link ends with .txt for LLM processing.\n\n'

				// Sort files by title for better organization
				fileInfos.sort((a, b) => a.title.localeCompare(b.title))

				// Add table of contents
				llmsTxtContent += '## Table of Contents\n\n'

				for (const fileInfo of fileInfos) {
					llmsTxtContent += `- [${fileInfo.title}](${fileInfo.fileName}.txt)\n`
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
				for (let i = 0; i < fileInfos.length; i++) {
					const fileInfo = fileInfos[i]

					llmsFullTxtFileContent += fileInfo.content

					// Add newline for all but the last item
					if (i < fileInfos.length - 1) {
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
