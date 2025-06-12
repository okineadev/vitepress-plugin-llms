/** Default template for the `llms.txt` file. */
export const defaultLLMsTxtTemplate = `\
# {title}

{description}

{details}

## Table of Contents

{toc}`

/** List of unnecessary files grouped by category. */
export const unnecessaryFilesList = {
	/** `index.md` */
	indexPage: ['index.md'],
	/** Blogs */
	blogs: ['blog/*', 'blog.md'],
	/** Pages about team */
	team: ['team.md'],
} as const satisfies Record<string, readonly string[]>

export const tagRegex = (tag: RegExp | string, type: 'open' | 'closed', flags?: string) =>
	new RegExp(`<${type === 'open' ? '' : '/'}${tag}>`, flags)

/**
 * Generates a regular expression that matches a complete custom tag, including its content.
 *
 * The resulting RegExp matches an opening tag, captures everything inside (non-greedily),
 * and then matches the corresponding closing tag. The tag name is provided as an argument.
 *
 * @param tag - The name of the tag to match (e.g., "note" will match <note>...</note>).
 * @returns A RegExp that captures the entire tag block including its inner content.
 *
 * @example
 * ```ts
 * const regex = fullTagRegex('note');
 * const input = '<note>This is a note</note>';
 * const match = input.match(regex);
 * console.log(match?.[1]); // "This is a note"
 * ```
 */
export const fullTagRegex = (tag: RegExp | string, flags?: string) =>
	new RegExp(`${tagRegex(tag, 'open').source}([\\s\\S]*?)${tagRegex(tag, 'closed').source}`, flags)
