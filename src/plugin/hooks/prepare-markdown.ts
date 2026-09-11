import type { OutputBundle } from 'rollup'

import matter from '@11ty/gray-matter'
import path from 'node:path'

import type { PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { processVPParams } from '@/utils/dynamic-routes'
import { extractTitle } from '@/utils/markdown'
import { resolveOutputFilePath } from '@/utils/vitepress-rewrites'

import createMarkdownProcessor from './markdown-processor'

function extractImageMap(bundle: OutputBundle): Map<string, string> {
	const imageMap = new Map<string, string>()
	if (typeof bundle !== 'object') {
		return imageMap
	}
	for (const asset of Object.values(bundle)) {
		if (/(?:png|jpe?g|gif|svg|webp)$/iu.test(path.extname(asset.fileName))) {
			const name = path.posix.basename(asset.fileName)
			imageMap.set(name, asset.fileName)
		}
	}
	return imageMap
}

function resolvePagePath(file: string, workDir: string, config: VitePressConfig): string {
	const resolved = path.relative(
		workDir,
		resolveOutputFilePath(file, workDir, config.vitepress.userConfig.rewrites),
	)
	const directory = path.dirname(resolved)
	return path.basename(resolved) === 'index.md' && directory !== '.' && directory !== ''
		? `${directory}.md`
		: resolved
}

async function prepareMarkdownFiles({
	bundle,
	mdFiles,
	settings,
	config,
}: {
	bundle: OutputBundle
	mdFiles: Map<string, string>
	settings: Required<LlmstxtSettings>
	config: VitePressConfig
}): Promise<PreparedFile[]> {
	const imageMap = extractImageMap(bundle)
	return Promise.all(
		[...mdFiles].map(async ([file, content]) => {
			const processor = createMarkdownProcessor(settings.workDir, imageMap, settings.stripHTML)
			const processed = await processor.process({
				cwd: settings.workDir,
				path: file,
				value: processVPParams(content),
			})
			const processedMarkdown = matter(String(processed))
			const title = extractTitle(processedMarkdown)?.trim() ?? 'Untitled'
			return { file: processedMarkdown, path: resolvePagePath(file, settings.workDir, config), title }
		}),
	)
}

export default prepareMarkdownFiles
