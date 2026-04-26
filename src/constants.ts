/** Default template for the `llms.txt` file. */
export const defaultLLMsTxtTemplate = `\
# {title}

{description}

{details}

## Table of Contents

{toc}`

/** List of unnecessary files grouped by category. */
// oxlint-disable-next-line sort-keys
export const unnecessaryFilesList = {
	/** `index.md` */
	indexPage: ['index.md'],
	/** Blogs */
	blogs: ['blog/*', 'blog.md'],
	/** Pages about team */
	team: ['team.md'],
	/** `README.md` */
	readmeMd: ['README.md'],
} as const
unnecessaryFilesList satisfies Record<string, readonly string[]>

export const tagRegex = (tag: string, type: 'open' | 'closed', flags?: string): RegExp =>
	new RegExp(`<${type === 'open' ? '' : '/'}${tag}>`, flags)

/**
 * Generates a regular expression that matches a complete custom tag, including its content.
 *
 * The resulting RegExp matches an opening tag, captures everything inside (non-greedily), and then matches
 * the corresponding closing tag. The tag name is provided as an argument.
 *
 * @example
 * const regex = fullTagRegex('note')
 * const input = '<note>This is a note</note>'
 * const match = input.match(regex)
 * console.log(match?.[1]) // "This is a note"
 *
 * @param tag - The name of the tag to match (e.g., "note" will match <note>...</note>).
 * @returns A RegExp that captures the entire tag block including its inner content.
 */
export const fullTagRegex = (tag: string, flags?: string): RegExp =>
	new RegExp(`${tagRegex(tag, 'open').source}([\\s\\S]*?)${tagRegex(tag, 'closed').source}`, flags)
