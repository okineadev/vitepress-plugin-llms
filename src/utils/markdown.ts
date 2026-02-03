import type { GrayMatterFile, Input } from 'gray-matter'

import markdownTitle from 'markdown-title'

/**
 * Extracts the title from a markdown file's frontmatter or first heading.
 *
 * @param file - The markdown file to extract the title from.
 * @returns The extracted title, or `undefined` if no title is found.
 */
export function extractTitle(file: GrayMatterFile<Input>): string | undefined {
	return (
		((file.data?.['title'] ?? file.data?.['titleTemplate']) as string | undefined) ??
		markdownTitle(file.content)
	)
}
