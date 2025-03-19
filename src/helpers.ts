import fs from 'node:fs'
import path from 'node:path'
import type { PreparedFile } from './types'

/**
 * Strip file extension
 *
 * @param filepath - The path to the file
 * @returns The filename without the extension
 */
export const stripExt = (filepath: string) =>
	path.join(
		path.dirname(filepath),
		path.basename(filepath, path.extname(filepath)),
	)

/**
 * Generates a Table of Contents (TOC) for the provided prepared files.
 *
 * Each entry in the TOC is formatted as a markdown link to the corresponding
 * text file
 *
 * @param preparedFiles - An array of prepared files
 * @returns A string representing the formatted Table of Contents.
 */
export function generateTOC(preparedFiles: PreparedFile[]) {
	let tableOfContent = ''

	for (const file of preparedFiles) {
		const relativePath = path.relative(process.cwd(), file.path)
		tableOfContent += `- [${file.title}](/${path.posix.resolve(stripExt(relativePath))}.md)\n`
	}

	return tableOfContent
}

/**
 * Generates a LLMs.txt file with a table of contents and links to all documentation sections.
 *
 * @param preparedFiles - An array of prepared files
 * @returns A string representing the llms.txt` file content.
 *
 * @see https://llmstxt.org
 */
export function generateLLMsTxt(preparedFiles: PreparedFile[]) {
	const llmsTxtContent = `\
# LLMs Documentation

This file contains links to all documentation sections.

## Table of Contents

${generateTOC(preparedFiles)}`

	return llmsTxtContent
}

export function generateLLMsFullTxt(preparedFiles: PreparedFile[]) {
	const llmsFullTxtContent = preparedFiles
		.map((file) => fs.readFileSync(file.path, 'utf-8'))
		.join('\n---\n\n')

	return llmsFullTxtContent
}

/**
 * Extracts the title from a markdown file.
 *
 * @param content - The content of the markdown file
 * @returns The title of the markdown file
 */
export function extractTitle(content: string): string {
	// Look for first # heading
	const titleMatch = content.match(/^#\s+(.+)$/m)
	if (titleMatch?.[1]) {
		return titleMatch[1].trim()
	}

	// If no h1 heading, try to find the first line with content
	const lines = content.split('\n').map((line) => line.trim())
	for (const line of lines) {
		if (line && !line.startsWith('#') && !line.startsWith('---')) {
			return line.substring(0, 50) + (line.length > 50 ? '...' : '')
		}
	}

	// Fallback to filename if no title found
	return 'Untitled section'
}
