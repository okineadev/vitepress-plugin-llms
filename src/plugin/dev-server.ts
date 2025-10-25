import fs from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'
import type { ViteDevServer } from 'vite'
import type { VitePressConfig } from '@/internal-types'
import { stripExt } from '@/utils/file-utils'
import log from '@/utils/logger'

/**
 * Configures the development server to handle `llms.txt` and markdown files for LLMs.
 */
export async function configureDevServer(server: ViteDevServer, config: VitePressConfig): Promise<void> {
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
			} catch (_error) {
				log.warn(`Failed to return ${pc.cyan(req.url)}: File not found`)
			}
		}

		// Pass to next middleware if not handled
		next()
	})
}
