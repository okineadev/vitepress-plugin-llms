// oxlint-disable import/prefer-default-export
import type { GrayMatterFile, Input } from 'gray-matter'

import markdownTitle from 'markdown-title'

/**
 * Extracts the title from a markdown file's frontmatter or first heading.
 *
 * @param file - The markdown file to extract the title from.
 * @returns The extracted title, or `undefined` if no title is found.
 */
// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
export function extractTitle(file: GrayMatterFile<Input>): string | undefined {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return (file.data['title'] ?? file.data['titleTemplate'] ?? markdownTitle(file.content)) as
		| string
		| undefined
}
