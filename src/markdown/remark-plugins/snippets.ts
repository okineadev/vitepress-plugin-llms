import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

interface IncludeOptions {
	/**
	 * Source directory for resolving @ prefixed paths
	 * Defaults to process.cwd()
	 */
	srcDir?: string

	/**
	 * Maximum depth of nested includes to prevent infinite recursion
	 * Defaults to 10
	 */
	maxDepth?: number

	/**
	 * Whether to throw errors on missing files
	 * Defaults to false (silent failure like VitePress)
	 */
	throwOnMissingFile?: boolean
}

interface ParsedInclude {
	filepath: string
	region?: string
	lines?: string
}

/**
 * Regular expression to match include comments
 * Matches: <!--@include: path/to/file.md#region{1,10}-->
 */
const includeRegex = /<!--@include: (\S+)-->/gim

/**
 * Parse the include path and extract components
 */
function parseIncludePath(rawPath: string): ParsedInclude {
	const cleanPath = rawPath.trim()

	let filepath = cleanPath.startsWith('@') ? cleanPath.slice(1) : cleanPath

	// Extract region (#region-name)
	let region: string | undefined
	const regionMatch = filepath.match(/#([\w-]+)/)
	if (regionMatch) {
		region = regionMatch[1]
		filepath = filepath.replace(regionMatch[0], '')
	}

	// Extract line range ({1,10})
	let lines: string | undefined
	const linesMatch = filepath.match(/\{([^}]+)\}/)
	if (linesMatch) {
		lines = linesMatch[1]
		filepath = filepath.replace(linesMatch[0], '')
	}

	return { filepath: filepath.trim(), region, lines }
}

/**
 * Find region markers in content
 */
const regionMarkers = [
	{
		start: /^\s*<!--\s*#?region\s+([^-\s]+)(?:\s+(.*))?-->/,
		end: /^\s*<!--\s*#?endregion(?:\s+([^-\s]+))?(?:\s+(.*))?-->/,
	},
	{
		start: /^\s*\/\/\s*#?region\s+([^\s]+)(?:\s+(.*))?$/,
		end: /^\s*\/\/\s*#?endregion(?:\s+([^\s]+))?(?:\s+(.*))?$/,
	},
]

/**
 * Find region in content lines
 */
function findRegion(lines: string[], regionName: string): { start: number; end: number } | null {
	let chosen: { marker: (typeof regionMarkers)[number]; start: number } | null = null

	for (let i = 0; i < lines.length; i++) {
		for (const marker of regionMarkers) {
			const match = marker.start.exec(lines[i])
			if (match && match[1] === regionName) {
				chosen = { marker, start: i + 1 }
				break
			}
		}
		if (chosen) break
	}

	if (!chosen) return null

	let counter = 1
	for (let i = chosen.start; i < lines.length; i++) {
		const startMatch = chosen.marker.start.exec(lines[i])
		if (startMatch && startMatch[1] === regionName) {
			counter++
			continue
		}

		const endMatch = chosen.marker.end.exec(lines[i])
		if (endMatch && (endMatch[1] === regionName || !endMatch[1])) {
			if (--counter === 0) {
				return { start: chosen.start, end: i }
			}
		}
	}

	return null
}

/**
 * Find content by header anchor
 */
function findByAnchor(content: string, anchorId: string): string | null {
	const lines = content.split('\n')
	let startIndex = -1
	let headerLevel = 0

	// Find the header with the matching anchor
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		// Check for explicit anchor: ## Header {#custom-id}
		const explicitAnchorMatch = line.match(/^(#{1,6})\s+(.+?)\s*\{#([^}]+)\}/)
		if (explicitAnchorMatch && explicitAnchorMatch[3] === anchorId) {
			startIndex = i + 1
			headerLevel = explicitAnchorMatch[1].length
			break
		}

		// Check for generated anchor from header text
		const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
		if (headerMatch) {
			const generatedId = headerMatch[2]
				.toLowerCase()
				.replace(/[^\w\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/--+/g, '-')
				.trim()

			if (generatedId === anchorId) {
				startIndex = i + 1
				headerLevel = headerMatch[1].length
				break
			}
		}
	}

	if (startIndex === -1) return null

	// Find the end of this section (next header at same or higher level)
	let endIndex = lines.length
	for (let i = startIndex; i < lines.length; i++) {
		const line = lines[i].trim()
		const headerMatch = line.match(/^(#{1,6})\s+/)
		if (headerMatch && headerMatch[1].length <= headerLevel) {
			endIndex = i
			break
		}
	}

	return lines.slice(startIndex, endIndex).join('\n')
}

/**
 * Apply line range selection
 */
function applyLineRange(content: string, lineRange: string): string {
	const lines = content.split('\n')

	if (lineRange.includes(',')) {
		const [startStr, endStr] = lineRange.split(',')
		const start = startStr ? parseInt(startStr) - 1 : 0
		const end = endStr ? parseInt(endStr) : lines.length

		return lines.slice(Math.max(0, start), Math.max(0, end)).join('\n')
	}

	// Single line number
	const lineNum = parseInt(lineRange) - 1
	return lines[lineNum] || ''
}

/**
 * Dedent content (remove common leading whitespace)
 */
function dedent(text: string): string {
	const lines = text.split('\n')

	const minIndentLength = lines.reduce((acc, line) => {
		if (line.trim() === '') return acc // Skip empty lines

		for (let i = 0; i < line.length; i++) {
			if (line[i] !== ' ' && line[i] !== '\t') {
				return Math.min(i, acc)
			}
		}
		return acc
	}, Infinity)

	if (minIndentLength < Infinity && minIndentLength > 0) {
		return lines.map((x) => x.slice(minIndentLength)).join('\n')
	}

	return text
}

/**
 * Process includes recursively
 */
function processIncludes(
	content: string,
	currentPath: string,
	options: Required<IncludeOptions>,
	depth = 0,
	processedFiles = new Set<string>(),
): string {
	if (depth > options.maxDepth) {
		console.warn(`[remark-include] Maximum include depth (${options.maxDepth}) exceeded`)
		return content
	}

	return content.replace(includeRegex, (match, includePath: string) => {
		try {
			const parsed = parseIncludePath(includePath)
			let resolvedPath: string

			// Handle @ prefix (source root)
			if (includePath.trim().startsWith('@')) {
				resolvedPath = path.resolve(options.srcDir, parsed.filepath.substring(1))
			} else {
				resolvedPath = path.resolve(path.dirname(currentPath), parsed.filepath)
			}

			// Check for circular includes
			const normalizedPath = path.normalize(resolvedPath)
			if (processedFiles.has(normalizedPath)) {
				console.warn(`[remark-include] Circular include detected: ${normalizedPath}`)
				return match // Return original include comment
			}

			// Check if file exists
			if (!fs.existsSync(resolvedPath)) {
				const error = `Include file not found: ${resolvedPath}`
				if (options.throwOnMissingFile) {
					throw new Error(error)
				}
				console.warn(`[remark-include] ${error}`)
				return match // Return original include comment
			}

			// Read file content
			let fileContent = fs.readFileSync(resolvedPath, 'utf-8')

			// Parse frontmatter if present
			const parsed_matter = matter(fileContent)
			fileContent = parsed_matter.content

			// Process region selection
			if (parsed.region) {
				const lines = fileContent.split('\n')
				const region = findRegion(lines, parsed.region)

				if (region) {
					fileContent = dedent(lines.slice(region.start, region.end).join('\n'))
				} else {
					// Try anchor-based selection
					const anchorContent = findByAnchor(fileContent, parsed.region)
					if (anchorContent) {
						fileContent = anchorContent
					} else {
						console.warn(`[remark-include] Region or anchor '${parsed.region}' not found in ${resolvedPath}`)
					}
				}
			}

			// Apply line range selection
			if (parsed.lines) {
				fileContent = applyLineRange(fileContent, parsed.lines)
			}

			// Track processed files for circular detection
			const newProcessedFiles = new Set([...processedFiles, normalizedPath])

			// Recursively process includes in the included content
			return processIncludes(fileContent, resolvedPath, options, depth + 1, newProcessedFiles)
		} catch (error) {
			const errorMsg = `[remark-include] Error processing include '${includePath}': ${error instanceof Error ? error.message : String(error)}`

			if (options.throwOnMissingFile) {
				throw new Error(errorMsg)
			}

			console.warn(errorMsg)
			return match // Return original include comment on error
		}
	})
}

/**
 * Remark plugin for markdown file inclusion
 */
function remarkInclude(options: IncludeOptions = {}) {
	const opts: Required<IncludeOptions> = {
		srcDir: options.srcDir || process.cwd(),
		maxDepth: options.maxDepth || 10,
		throwOnMissingFile: options.throwOnMissingFile || false,
	}

	return () =>
		(tree: Root, file: any): void => {
			const currentPath = file.path || file.history?.[0] || process.cwd()

			visit(tree, (node: any, index, parent) => {
				if (!parent || typeof index !== 'number') return

				// Process HTML nodes (where comments live)
				if (node.type === 'html') {
					includeRegex.lastIndex = 0
					const processedValue = processIncludes(node.value, currentPath, opts)

					if (processedValue !== node.value) {
						// If the processed content doesn't contain include comments anymore,
						// it means we successfully processed them
						if (!processedValue.includes('<!--@include:')) {
							// Create a new text node with the processed content
							const newNode = {
								type: 'text',
								value: processedValue,
							}
							parent.children[index] = newNode
						} else {
							// Still has includes, update the value
							node.value = processedValue
						}
					}
				}

				// Process text nodes as well
				if (node.type === 'text' && includeRegex.test(node.value)) {
					includeRegex.lastIndex = 0
					const processedValue = processIncludes(node.value, currentPath, opts)

					if (processedValue !== node.value) {
						node.value = processedValue
					}
				}
			})
		}
}

export default remarkInclude
