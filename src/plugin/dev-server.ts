import fs from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'
import type { Connect, ViteDevServer } from 'vite'
import type { VitePressConfig } from '@/internal-types'
import { stripExt } from '@/utils/file-utils'
import log from '@/utils/logger'

/**
 * Configures the development server to handle `llms.txt` and markdown files for LLMs.
 */
// oxlint-disable-next-line require-await
export async function configureDevServer(server: ViteDevServer, config: VitePressConfig): Promise<void> {
	log.info('Dev server configured for serving plain text docs for LLMs')
	// oxlint-disable-next-line typescript/no-misused-promises
	server.middlewares.use(
		// @ts-expect-error
		// oxlint-disable-next-line typescript/no-misused-promises
		async (req: Omit<Connect.IncomingMessage, 'url'> & { url: string }, res, next) => {
			if (req.url.endsWith('.md') || req.url.endsWith('.txt')) {
				try {
					// Try to read and serve the markdown file
					const filePath = path.resolve(config.vitepress?.outDir ?? 'dist', `${stripExt(req.url)}.md`)
					const content = await fs.readFile(filePath, 'utf-8')
					res.setHeader('Content-Type', 'text/plain; charset=utf-8')
					res.end(content)
					return
				} catch {
					log.warn(`Failed to return ${pc.cyan(req.url)}: File not found`)
				}
			}

			// Pass to next middleware if not handled
			next()
		},
	)
}
