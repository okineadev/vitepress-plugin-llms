import matter from '@11ty/gray-matter'
import fs from 'node:fs'
import path from 'node:path'

import log from '@/utils/logger'

import type {
	LoadIncludeFileOptions,
	ProcessingOptions,
	ReadIncludeFileOptions,
	ResolveIncludeMatchOptions,
} from './types'

import { resolveIncludePath, stripMeta } from './path-utils'
import { includesRE, rangeRE, regionRE } from './patterns'
import { findRegion } from './regions'

/**
 * Applies region selection to file content, returning the matched region's lines.
 *
 * @param content - Full file content.
 * @param region - Matched region regex result.
 * @param includePath - File path used in warning messages.
 * @returns Sliced content for the region, or original content if region not found.
 */
function applyRegionFilter(content: string, region: RegExpExecArray, includePath: string): string {
	const [regionName] = region
	const lines = content.split(/\r?\n/u)
	const regionData = findRegion(lines, regionName.slice(1))
	if (regionData) {
		return lines.slice(regionData.start, regionData.end).join('\n')
	}
	log.warn(`[remark-include] Region '${regionName}' not found in ${includePath}`)
	return content
}

/**
 * Applies line-range selection to file content.
 * @param content - Full file content.
 * @param range - Matched range regex result containing start/end line numbers.
 * @returns The sliced content for the given line range.
 */
function applyRangeFilter(content: string, range: RegExpExecArray): string {
	const [, startLine, endLine] = range
	const lines = content.split(/\r?\n/u)
	return lines
		.slice(
			// oxlint-disable typescript/strict-boolean-expressions
			startLine ? Number(startLine) - 1 : undefined,
			endLine ? Number(endLine) : undefined,
			// oxlint-enable typescript/strict-boolean-expressions
		)
		.join('\n')
}

/**
 * Reads and filters the content of an include file applying region and range rules.
 * @param options - Options with the include path, region, range, and meta flag.
 * @returns Processed file content string.
 */
function readIncludeFile({ includePath, region, range, hasMeta }: ReadIncludeFileOptions): string {
	let content = fs.readFileSync(includePath, 'utf8')

	if (region) {
		content = applyRegionFilter(content, region, includePath)
	}

	if (range) {
		content = applyRangeFilter(content, range)
	}

	if (!hasMeta && path.extname(includePath) === '.md') {
		;({ content } = matter(content))
	}

	return content
}
/**
 * Validates that the include file exists, reads it, registers it, and recursively processes its includes.
 *
 * @param options - Options with the resolved path, region/range filters, meta flag, and processing context.
 * @returns The fully processed file content string.
 * @throws {Error} If the file does not exist.
 */
function loadIncludeFile({
	includePath,
	region,
	range,
	hasMeta,
	processingOptions,
}: LoadIncludeFileOptions): string {
	if (!fs.existsSync(includePath)) {
		throw new Error(`File not found: ${includePath}`)
	}

	const { filePath, includes, srcDir } = processingOptions
	const fileContent = readIncludeFile({ hasMeta, includePath, range, region })
	includes.push(includePath)

	// oxlint-disable-next-line no-use-before-define
	return processIncludes({ content: fileContent, filePath, includes, srcDir })
}

/**
 * Resolves and loads the content for a single include match, registering it in the includes list.
 * @returns The resolved (and recursively processed) file content, or the fallback string on error.
 */
function resolveIncludeMatch({ fallback, rawPath, processingOptions }: ResolveIncludeMatchOptions): string {
	const { srcDir, filePath } = processingOptions
	const range = rangeRE.exec(rawPath)
	const region = regionRE.exec(rawPath)
	const hasMeta = Boolean(region ?? range)
	const cleanPath = hasMeta ? stripMeta({ range, rawPath, region }) : rawPath

	try {
		const includePath = resolveIncludePath({ filePath, rawPath: cleanPath, srcDir })
		return loadIncludeFile({ hasMeta, includePath, processingOptions, range, region })
	} catch {
		log.warn(`[remark-include] Include file not found: ${cleanPath}`)
		return fallback
	}
}

/**
 * Processes `<!-- @include: -->` directives in markdown content recursively.
 * @param options - Processing options including source directory, content, file path, and includes list.
 * @returns The content string with all include directives replaced.
 */
function processIncludes(options: ProcessingOptions): string {
	return options.content.replace(includesRE, (fallback: string, rawPath: string) => {
		if (rawPath.length === 0) {
			return fallback
		}
		return resolveIncludeMatch({ fallback, processingOptions: options, rawPath })
	})
}

export default processIncludes
