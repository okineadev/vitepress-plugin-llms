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
