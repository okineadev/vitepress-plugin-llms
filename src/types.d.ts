import type { DefaultTheme } from 'vitepress'

import { unnecessaryFilesList } from '@/constants'

interface TemplateVariables {
	/**
	 * The title extracted from the frontmatter or the first h1 heading in the main document (`index.md`).
	 *
	 * @example 'Awesome tool'
	 */
	title?: string

	/**
	 * The description.
	 *
	 * @example 'Blazing fast build tool'
	 */
	description?: string

	/**
	 * The details.
	 *
	 * @example 'A multi-user version of the notebook designed for companies, classrooms and research labs'
	 */
	details?: string

	// Spell-checker:disable
	/**
	 * An automatically generated **T**able **O**f **C**ontents.
	 *
	 * @example
	 * ```markdown
	 * - [Title](/foo.md): Lorem ipsum dolor sit amet, consectetur adipiscing elit.
	 * - [Title 2](/bar/baz.md): Cras vel nibh id ipsum pharetra efficitur.
	 * ```
	 */
	// Spell-checker:enable
	toc?: string
}

type CustomTemplateVariables = Record<string, string | undefined>

export interface LlmstxtSettings extends TemplateVariables {
	/**
	 * The domain that will be appended to the beginning of URLs in `llms.txt` and in the context of other files
	 *
	 * ---
	 *
	 * Domain attachment is not yet agreed upon (since it depends on the AI ​​whether it can resolve the relative paths that are currently there), but if you want you can add it
	 *
	 * ℹ️ **Note**: Domain cannot end with `/`.
	 *
	 * Without a {@link LlmstxtSettings.domain | `domain`}:
	 * ```markdown
	 * - [Title](/foo/bar.md)
	 * ```
	 *
	 * With a {@link LlmstxtSettings.domain | `domain`}:
	 * ```markdown
	 * - [Title](https://example.com/foo/bar.md)
	 * ```
	 *
	 * @example
	 * llmstxt({ domain: 'https://example.com' })
	 */
	domain?: string

	/**
	 * Indicates whether to generate the `llms.txt` file, which contains a list of sections with corresponding links.
	 *
	 * @default true
	 */
	generateLLMsTxt?: boolean

	/**
	 * Determines whether to generate the `llms-full.txt` which contains all the documentation in one file.
	 *
	 * @default true
	 */
	generateLLMsFullTxt?: boolean

	/**
	 * Determines whether to generate an LLM-friendly version of the documentation for each page on the website.
	 *
	 * @default true
	 */
	generateLLMFriendlyDocsForEachPage?: boolean

	/**
	 * Whether to strip HTML tags from Markdown files.
	 *
	 * @default true
	 */
	stripHTML?: boolean

	/**
	 * Whether to insert invisible text with a reference to LLM-Friendly documentation for LLMs on every page.
	 *
	 * Could significantly advance the use of LLM-Friendly documentation in regular chats (possibly).
	 *
	 * ---
	 *
	 * It inserts text on each page that is invisible to humans but visible to machines (thanks to the CSS property `display: none`), in simple sections it looks like this:
	 *
	 * ```plaintext
	 * Are you an LLM? You can read better optimized documentation at /guide/what-is-vitepress.md for this page in Markdown format
	 * ```
	 *
	 * On the main page it will look like this:
	 *
	 * ```plaintext
	 * Are you an LLM? View /llms.txt for optimized Markdown documentation, or /llms-full.txt for full documentation bundle
	 * ```
	 *
	 * @default true
	 */
	injectLLMHint?: boolean

	/**
	 * The directory from which files will be processed.
	 *
	 * ---
	 *
	 * This is useful for configuring the plugin to generate documentation for LLMs in a specific language.
	 *
	 * @example
	 * llmstxt({
	 *     // Generate documentation for LLMs from English documentation only
	 *     workDir: 'en'
	 * })
	 *
	 * @default vitepress.srcDir
	 */
	workDir?: string

	/**
	 * An array of file path patterns to be ignored during processing.
	 *
	 * ---
	 *
	 * This is useful for excluding certain files from LLMs, such as those not related to documentation (e.g., sponsors, team, etc.).
	 *
	 * @example
	 * llmstxt({
	 *     ignoreFiles: [
	 *         'about/team/*',
	 *         'sponsor/*'
	 *         // ...
	 *     ]
	 * })
	 *
	 * @default []
	 */
	ignoreFiles?: string[]

	/**
	 * Per-output ignore patterns that are **merged** with the global {@link LlmstxtSettings.ignoreFiles | `ignoreFiles`}.
	 *
	 * ---
	 *
	 * Use this when you want to exclude files from specific outputs only.
	 * Global `ignoreFiles` always applies to all outputs — these extend it per target.
	 *
	 * @example
	 * llmstxt({
	 *     // Excluded from ALL outputs
	 *     ignoreFiles: ['team/*', 'blog/*'],
	 *
	 *     // Additionally excluded only from specific outputs
	 *     ignoreFilesPerOutput: {
	 *         // llms.txt is a summary — skip verbose API reference
	 *         llmsTxt: ['api/reference/*'],
	 *         // full bundle includes everything except sponsors
	 *         llmsFullTxt: ['sponsors/*'],
	 *         // individual pages — skip internal/dev docs
	 *         pages: ['internal/*', 'dev/*'],
	 *     }
	 * })
	 */
	ignoreFilesPerOutput?: {
		/**
		 * Additional patterns to ignore when generating `llms.txt`.
		 *
		 * ---
		 *
		 * Merged with global {@link LlmstxtSettings.ignoreFiles | `ignoreFiles`}.
		 *
		 * Supports `!`-prefixed negation patterns.
		 *
		 * @default []
		 */
		llmsTxt?: string[]

		/**
		 * Additional patterns to ignore when generating `llms-full.txt`.
		 *
		 * ---
		 *
		 * Merged with global {@link LlmstxtSettings.ignoreFiles | `ignoreFiles`}.
		 *
		 * Supports `!`-prefixed negation patterns.
		 *
		 * @default []
		 */
		llmsFullTxt?: string[]

		/**
		 * Additional patterns to ignore when generating per-page LLM-friendly docs.
		 *
		 * ---
		 *
		 * Merged with global {@link LlmstxtSettings.ignoreFiles | `ignoreFiles`}.
		 *
		 * Supports `!`-prefixed negation patterns.
		 *
		 * @default []
		 */
		pages?: string[]
	}

	/**
	 * Whether to exclude unnecessary files (such as blog, sponsor or team information) that LLM does not need at all to save tokens ♻️
	 *
	 * ---
	 *
	 * You can granularly disable certain page presets, see these options:
	 *
	 * - {@link LlmstxtSettings.excludeIndexPage | `excludeIndexPage`}
	 * - {@link LlmstxtSettings.excludeBlog | `excludeBlog`}
	 * - {@link LlmstxtSettings.excludeTeam | `excludeTeam`}
	 *
	 * @see {@link unnecessaryFilesList} for the list of files that will be excluded
	 *
	 * @default true
	 */
	excludeUnnecessaryFiles?: boolean

	/**
	 * Whether to exclude the `/index.md` page which usually has no content
	 *
	 * @see {@link unnecessaryFilesList.indexPage}
	 *
	 * @default true
	 */
	excludeIndexPage?: boolean

	/**
	 * Whether to exclude blog content
	 *
	 * @see {@link unnecessaryFilesList.blogs}
	 *
	 * @default true
	 */
	excludeBlog?: boolean

	/**
	 * Whether to exclude information about a team that usually does not provide practical information
	 *
	 * @see {@link unnecessaryFilesList.team}
	 *
	 * @default true
	 */
	excludeTeam?: boolean

	// Spell-checker:disable
	/**
	 * A custom template for the `llms.txt` file, allowing for a personalized order of elements.
	 *
	 * ---
	 *
	 * Available template elements include:
	 *
	 * - `{title}`: The title extracted from the frontmatter or the first h1 heading in the main document (`index.md`).
	 * - `{description}`: The description.
	 * - `{details}`: The details.
	 * - `{toc}`: An automatically generated **T**able **O**f **C**ontents.
	 *
	 * You can also add custom variables using the {@link LlmstxtSettings.customTemplateVariables | `customTemplateVariables`} parameter
	 *
	 * @default
	 * ```markdown
	 * # {title}
	 *
	 * > {description}
	 *
	 * {details}
	 *
	 * ## Table of Contents
	 *
	 * {toc}
	 * ```
	 */
	// Spell-checker:enable
	customLLMsTxtTemplate?: string

	/**
	 * Custom variables for {@link LlmstxtSettings.customLLMsTxtTemplate | `customLLMsTxtTemplate`}.
	 *
	 * ---
	 *
	 * With this option you can edit or add variables to the template.
	 *
	 * You can change the title in `llms.txt` without having to change the template:
	 *
	 * @example
	 * llmstxt({
	 *     customTemplateVariables: {
	 *         title: 'Very custom title',
	 *     }
	 * })
	 *
	 * You can also combine this with a custom template:
	 *
	 * @example
	 * llmstxt({
	 *     customLLMsTxtTemplate: '# {title}\n\n{foo}',
	 *     customTemplateVariables: {
	 *         foo: 'Very custom title',
	 *     }
	 * })
	 */
	customTemplateVariables?: CustomTemplateVariables

	/**
	 * VitePress {@link DefaultTheme.Sidebar | Sidebar}
	 *
	 * ---
	 *
	 * Here you can insert your {@link DefaultTheme.Sidebar | `sidebar`} if it is not in the VitePress configuration
	 *
	 * Usually this parameter is used in rare cases
	 */
	sidebar?:
		| DefaultTheme.Sidebar
		| ((
				// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
				configSidebar: DefaultTheme.Sidebar | undefined,
		  ) => DefaultTheme.Sidebar | undefined | Promise<DefaultTheme.Sidebar | undefined>)

	/**
	 * 🧪 Experimental features that may change in future versions.
	 *
	 * @experimental
	 */
	experimental?: {
		/**
		 * Determines how many directory levels deep to generate `llms.txt` files.
		 *
		 * ---
		 *
		 * - `1` (default): Generate `llms.txt` only in the root directory
		 * - `2`: Generate `llms.txt` in the root and first-level subdirectories
		 * - `3`: Generate `llms.txt` in the root, first-level, and second-level subdirectories
		 * - And so on...
		 *
		 * Each `llms.txt` file will contain content relevant to its directory and subdirectories.
		 *
		 * @default 1
		 * @experimental
		 */
		depth?: number
	}
}
