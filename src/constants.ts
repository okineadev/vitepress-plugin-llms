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

/**
 * Creates a regular expression pattern to match HTML/XML-like tags with the specified tag name
 *
 * @param tagName - The name of the tag to match. Can be either a string or RegExp
 * @param flags - Optional regex flags (e.g., 'g' for global, 'i' for case-insensitive)
 * @returns A RegExp that matches content between opening and closing tags
 *
 * @example
 * ```ts
 * const regex = tagRegex('script'); // matches <script>any content</script>
 * const regexWithFlags = tagRegex('div', 'g'); // matches all <div>content</div> globally
 * ```
 */
export const tagRegex = (tagName: RegExp | string, flags?: string) =>
	new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, flags)
