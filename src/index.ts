import type { ViteDevServer, Plugin } from 'vite'

import fs from 'node:fs'
import path from 'node:path'

import pc from 'picocolors'
import {
	extractTitle,
	generateLLMsFullTxt,
	generateLLMsTxt,
	stripExt,
} from './helpers'
import log from './logger'
import type { LlmstxtSettings, PreparedFile, VitePressConfig } from './types'

/**
 * [VitePress](http://vitepress.dev/) plugin for generating raw documentation
 * for **LLMs** in Markdown format which is much lighter and more efficient for LLMs
 *
 * @see https://llmstxt.org/
 */
export default function llmstxt(
	settings: LlmstxtSettings = {
		generateLLMsFullTxt: true,
		generateLLMsTxt: true,
		ignoreFiles: [],
	},
): Plugin {
	// Store the resolved Vite config
	let config: VitePressConfig

	// Set to store all markdown files paths
	const mdFiles: Set<string> = new Set()

	// Flag to identify which build we're in
	let isSsrBuild = false

	return {
		name: 'vitepress-plugin-llms',
		enforce: 'post', // Run after other plugins

		configResolved(resolvedConfig) {
			config = resolvedConfig as unknown as VitePressConfig
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
						const filePath = path.resolve(
							config.vitepress?.outDir ?? 'dist',
							`${stripExt(req.url)}.md`,
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
		transform(_, id: string) {
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

			const outDir = config.vitepress?.outDir ?? 'dist'

			// Create output directory if it doesn't exist
			if (!fs.existsSync(outDir)) {
				log.info(`Creating output directory: ${pc.cyan(outDir)}`)
				fs.mkdirSync(outDir, { recursive: true })
			}

			const mdFilesList = Array.from(mdFiles)
			const fileCount = mdFilesList.length

			// Skip if no files found
			if (fileCount === 0) {
				log.warn('No markdown files found to process')
				return
			}

			log.info(`Processing ${pc.bold(fileCount.toString())} markdown files...`)

			const preparedFiles: PreparedFile[] = []

			// Copy all markdown files to output directory
			for (const file of mdFilesList) {
				if (settings.ignoreFiles?.includes(file)) {
					log.info(`Ignoring file: ${pc.cyan(file)}`)
					continue
				}

				const relativePath = path.relative(process.cwd(), file)
				const targetPath = path.resolve(outDir, relativePath)

				try {
					const content = fs.readFileSync(file, 'utf-8')
					const title = extractTitle(content)

					preparedFiles.push({ title, path: file })

					// Ensure target directory exists
					fs.mkdirSync(path.dirname(targetPath), { recursive: true })

					// Copy file to output directory
					fs.copyFileSync(file, targetPath)
					log.success(`Copied ${pc.cyan(relativePath)} to output directory`)
				} catch (error) {
					// @ts-ignore
					log.error(`Failed to copy ${pc.cyan(relativePath)}: ${error.message}`)
				}
			}

			// Sort files by title for better organization
			preparedFiles.sort((a, b) => a.title.localeCompare(b.title))

			// Generate llms.txt - table of contents with links
			if (settings.generateLLMsTxt) {
				const llmsTxtPath = path.resolve(outDir, 'llms.txt')

				const llmsTxt = generateLLMsTxt(preparedFiles)

				fs.writeFileSync(llmsTxtPath, llmsTxt, 'utf-8')
				log.success(
					`Generated ${pc.cyan('llms.txt')} with ${pc.bold(fileCount.toString())} documentation sections`,
				)
			}

			// Generate llms-full.txt - all content in one file
			if (settings.generateLLMsFullTxt) {
				const llmsFullTxtPath = path.resolve(outDir, 'llms-full.txt')

				log.info(`Generating ${pc.cyan('llms-full.txt')}...`)

				const llmsFullTxt = generateLLMsFullTxt(preparedFiles)

				// Write content to llms-full.txt
				fs.writeFileSync(llmsFullTxtPath, llmsFullTxt, 'utf-8')
				log.success(
					`Generated ${pc.cyan('llms-full.txt')} with ${pc.bold(fileCount.toString())} markdown files`,
				)
			}
		},
	}
}
