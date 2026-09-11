export interface IncludeOptions {
	/** Source directory for resolving @ prefixed paths */
	srcDir: string
}

export interface ProcessingOptions extends IncludeOptions {
	content: string
	filePath: string
	includes: string[]
}

export interface ResolveIncludePathOptions {
	/** The raw include path string, possibly `@`-prefixed. */
	rawPath: string
	/** Source root for resolving `@`-prefixed paths. */
	srcDir: string
	/** The current file path for resolving relative paths. */
	filePath: string
}

export interface StripMetaOptions {
	/** The include path possibly containing region/range meta info. */
	rawPath: string
	/** Matched region regex result. */
	region: RegExpExecArray | null
	/** Matched range regex result. */
	range: RegExpExecArray | null
}

export interface ReadIncludeFileOptions {
	/** Absolute path to the file to read. */
	includePath: string
	/** Matched region regex result, or null if absent. */
	region: RegExpExecArray | null
	/** Matched range regex result, or null if absent. */
	range: RegExpExecArray | null
	/** Whether any meta info is present - controls frontmatter stripping. */
	hasMeta: boolean
}

export interface ResolveIncludeMatchOptions {
	/** The original matched string, returned unchanged on failure. */
	fallback: string
	/** The raw include path extracted from the directive. */
	rawPath: string
	/** Processing options passed down from processIncludes. */
	processingOptions: ProcessingOptions
}

export interface LoadIncludeFileOptions {
	/** Resolved absolute path to the include file. */
	includePath: string
	/** Matched region regex result, or null if absent. */
	region: RegExpExecArray | null
	/** Matched range regex result, or null if absent. */
	range: RegExpExecArray | null
	/** Whether any meta info is present - controls frontmatter stripping. */
	hasMeta: boolean
	/** Processing options for recursive include resolution. */
	processingOptions: ProcessingOptions
}

export interface BuildSnippetNodeOptions {
	/** Absolute path to the snippet file. */
	snippetPath: string
	/** Region selector string including the `#` prefix, or empty string if absent. */
	region: string
	/** Parsed raw path token with lang, extension, lines, title, and attrs. */
	token: {
		attrs: string
		extension: string
		filepath: string
		lang: string
		lines: string
		region: string
		title: string
	}
	/** Mutable list to register the resolved snippet path into. */
	includes: string[]
}

export interface ResolveSnippetPathOptions {
	/** The cleaned (trimmed) raw path string, possibly `@`-prefixed. */
	cleanPath: string
	/** The filepath component from the parsed token. */
	tokenFilePath: string
	/** The current markdown file path for relative resolution. */
	filePath: string
	/** Source root for `@`-prefixed paths. */
	srcDir: string
}
