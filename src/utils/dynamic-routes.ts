import fs from 'node:fs/promises'
import path from 'node:path'
import matter, { type GrayMatterFile, type Input } from 'gray-matter'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { remove } from 'unist-util-remove'
import type { PreparedFile } from '@/internal-types'
import remarkPlease from '@/markdown/remark-plugins/remark-please'
import remarkReplaceImageUrls from '@/markdown/remark-plugins/replace-image-urls'
import remarkInclude from '@/markdown/remark-plugins/snippets'
import { extractTitle } from '@/utils/markdown'

/**
 * Represents a resolved dynamic route from VitePress.
 * This interface matches VitePress's internal ResolvedRouteConfig.
 */
export interface ResolvedDynamicRoute {
	/**
	 * The raw route template (relative to src root), e.g. 'foo/[bar].md'
	 */
	route: string

	/**
	 * The actual path with params resolved (relative to src root), e.g. 'foo/1.md'
	 */
	path: string

	/**
	 * Absolute filesystem path to the generated page
	 */
	fullPath: string

	/**
	 * Path to the paths loader module (.paths.js/ts)
	 */
	loaderPath: string

	/**
	 * Route parameters that were used to generate this route
	 */
	params: Record<string, string>

	/**
	 * Optional raw content (Markdown or HTML) to inject into the template
	 * Used for CMS integration
	 */
	content?: string
}

/**
 * Options for processing dynamic routes
 */
export interface ProcessDynamicRoutesOptions {
	/** The working directory (VitePress srcDir) */
	workDir: string

	/** Whether to strip HTML tags */
	stripHTML?: boolean

	/** Image map for replacing image URLs */
	imageMap?: Map<string, string>

	/** Configuration rewrites from VitePress */
	rewrites?: Record<string, string> | ((id: string) => string)
}

/**
 * Processes a single dynamic route and returns a PreparedFile.
 *
 * @param route - The resolved dynamic route from VitePress
 * @param options - Processing options
 * @returns A PreparedFile ready for inclusion in llms.txt generation
 */
export async function processDynamicRoute(
	route: ResolvedDynamicRoute,
	options: ProcessDynamicRoutesOptions,
): Promise<PreparedFile> {
	const { workDir, stripHTML = true, imageMap = new Map() } = options

	// Load the template file content
	const templatePath = path.resolve(workDir, route.route)
	let content = await fs.readFile(templatePath, 'utf-8')

	// Inject raw content if provided (CMS integration pattern)
	if (route.content) {
		content = content.replace(
			/<!--\s*@content\s*-->/,
			// Escape dollar signs in replacement string
			route.content.replace(/\$/g, '$$$'),
		)
	}

	// Process the markdown content
	const markdownProcessor = remark()
		.use(remarkFrontmatter)
		.use(remarkInclude({ srcDir: workDir }))
		.use(remarkPlease('unwrap', 'llm-only'))
		.use(remarkPlease('remove', 'llm-exclude'))
		.use(remarkReplaceImageUrls(imageMap))

	if (stripHTML) {
		markdownProcessor.use(() => {
			return (tree) => {
				remove(tree, { type: 'html' })
				return tree
			}
		})
	}

	const processedMarkdown = matter(
		String(
			await markdownProcessor.process({
				cwd: workDir,
				path: templatePath,
				value: content,
			}),
		),
	)

	// Extract title, replacing param placeholders if needed
	const title = resolveDynamicRouteTitle(processedMarkdown, route.params)

	// Determine the file path for the generated route
	// Handle index.md cases similar to regular files
	const filePath =
		path.basename(route.path) === 'index.md' &&
		path.dirname(route.path) !== '.' &&
		path.dirname(route.path) !== ''
			? `${path.dirname(route.path)}.md`
			: route.path

	return {
		path: filePath,
		title,
		file: processedMarkdown,
	}
}

/**
 * Resolves the title for a dynamic route, replacing param placeholders.
 *
 * Handles Vue template syntax like {{ $params.pkg }} in titles.
 *
 * @param processedMarkdown - The processed markdown with frontmatter
 * @param params - The route parameters
 * @returns The resolved title
 */
export function resolveDynamicRouteTitle(
	processedMarkdown: GrayMatterFile<Input>,
	params: Record<string, string>,
): string {
	let title = extractTitle(processedMarkdown)?.trim() || 'Untitled'

	// Replace Vue template param references: {{ $params.key }}
	title = title.replace(/\{\{\s*\$params\.(\w+)\s*\}\}/g, (_match, paramKey) => {
		return params[paramKey] || _match
	})

	// Also replace simple param references if they exist
	for (const [key, value] of Object.entries(params)) {
		title = title.replace(new RegExp(`\\$params\\.${key}`, 'g'), value)
	}

	return title
}

/**
 * Processes all dynamic routes from VitePress config.
 *
 * @param dynamicRoutes - Array of resolved dynamic routes from VitePress
 * @param options - Processing options
 * @returns Array of PreparedFiles for all dynamic routes
 */
export async function processDynamicRoutes(
	dynamicRoutes: ResolvedDynamicRoute[],
	options: ProcessDynamicRoutesOptions,
): Promise<PreparedFile[]> {
	const results = await Promise.all(dynamicRoutes.map((route) => processDynamicRoute(route, options)))

	return results
}
