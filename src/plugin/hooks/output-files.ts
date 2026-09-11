// oxlint-disable import/prefer-default-export
import type { GrayMatterFile, Input } from '@11ty/gray-matter'
import type { DefaultTheme } from 'vitepress/theme'

import fs from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'

import type { PreparedFile, VitePressConfig } from '@/internal-types'
import type { LlmstxtSettings } from '@/types'

import { generateLLMsFullTxt } from '@/generator/llms-full-txt'
import { generateLLMsTxt } from '@/generator/llms-txt'
import { getDirectoriesAtDepths } from '@/utils/file-utils'
import { filterPreparedFiles, resolveIgnorePatterns } from '@/utils/ignore'
import log from '@/utils/logger'

import logGeneratedFile from './output-log'

interface OutputOptions {
	mdFilesKeys: string[]
	preparedFiles: PreparedFile[]
	outDir: string
	settings: Required<LlmstxtSettings>
	config: VitePressConfig
	indexMdFile: GrayMatterFile<Input>
	sidebar: DefaultTheme.Sidebar | undefined
}

interface FileOptions {
	files: PreparedFile[]
	directory: string
	full: boolean
}

async function generateContent(
	{ files, directory: directoryFilter, full }: FileOptions,
	{ settings, config, sidebar, indexMdFile }: OutputOptions,
): Promise<string> {
	const commonOptions = {
		directoryFilter,
		domain: settings.domain,
		linksExtension: settings.generateLLMFriendlyDocsForEachPage ? undefined : ('.html' as const),
		sidebar,
	}
	return full
		? generateLLMsFullTxt(files, { ...commonOptions, base: config.base })
		: generateLLMsTxt(files, {
				...commonOptions,
				LLMsTxtTemplate: settings.customLLMsTxtTemplate,
				indexMdFile,
				templateVariables: {
					description: settings.description,
					details: settings.details,
					title: settings.title,
					toc: settings.toc,
					...settings.customTemplateVariables,
				},
				vitepressConfig: config.vitepress.userConfig,
			})
}

async function writeOutputFile(
	{ files, directory, full }: FileOptions,
	options: OutputOptions,
): Promise<void> {
	const filename = full ? 'llms-full.txt' : 'llms.txt'
	const outputFileName = directory === '.' ? filename : path.join(directory, filename)
	const outputPath = path.resolve(options.outDir, outputFileName)
	await fs.mkdir(path.dirname(outputPath), { recursive: true })
	log.info(
		full
			? `Generating full documentation bundle (${pc.cyan(outputFileName)})...`
			: `Generating ${pc.cyan(outputFileName)}...`,
	)
	const content = await generateContent({ directory, files, full }, options)
	await fs.writeFile(outputPath, content, 'utf8')
	logGeneratedFile({ content, count: files.length, file: outputFileName, full })
}

function createTasks(full: boolean, options: OutputOptions): Promise<void>[] {
	const { mdFilesKeys, settings, preparedFiles } = options
	const perOutput = full ? settings.ignoreFilesPerOutput.llmsFullTxt : settings.ignoreFilesPerOutput.llmsTxt
	const patterns = resolveIgnorePatterns(settings.ignoreFiles, perOutput)
	const directories = getDirectoriesAtDepths(
		mdFilesKeys,
		settings.workDir,
		settings.experimental.depth ?? 1,
	)
	const files = filterPreparedFiles(preparedFiles, settings.workDir, patterns.positive, patterns.negative)
	return directories.map(async (directory) =>
		writeOutputFile({ directory: directory.relativePath, files, full }, options),
	)
}

export function createOutputTasks(options: OutputOptions): Promise<void>[] {
	return [
		...(options.settings.generateLLMsTxt ? createTasks(false, options) : []),
		...(options.settings.generateLLMsFullTxt ? createTasks(true, options) : []),
	]
}
