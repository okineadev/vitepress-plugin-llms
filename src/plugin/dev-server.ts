import type { Connect, ViteDevServer } from 'vite'

import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'

import type { VitePressConfig } from '@/internal-types'

import { stripExt } from '@/utils/file-utils'
import log from '@/utils/logger'

/** Configures the development server to handle `llms.txt` and markdown files for LLMs. */
// oxlint-disable-next-line require-await typescript/prefer-readonly-parameter-types jsdoc/require-param
function configureDevServer(server: ViteDevServer, config: VitePressConfig): void {
	log.info('Dev server configured for serving plain text docs for LLMs')
	server.middlewares.use(
		// @ts-expect-error
		// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
		(req: Omit<Connect.IncomingMessage, 'url'> & { url: string }, res, next): void => {
			if (req.url.endsWith('.md') || req.url.endsWith('.txt')) {
				try {
					// `req.url` is absolute and includes the site base (e.g. `/base/guide/page.md`),
					// so strip the base before resolving it against the output directory
					const base = config.base || '/'
					const urlWithoutBase = req.url.startsWith(base) ? req.url.slice(base.length) : req.url
					const outDir = config.vitepress.outDir || 'dist'

					// Serve the requested file as-is if it exists (e.g. `llms.txt`, `llms-full.txt`),
					// otherwise try to serve the markdown version of the requested page
					const requestedPath = path.join(outDir, urlWithoutBase)
					const filePath = fs.existsSync(requestedPath)
						? requestedPath
						: path.join(outDir, `${stripExt(urlWithoutBase)}.md`)
					const content = fs.readFileSync(filePath, 'utf8')
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

export default configureDevServer
