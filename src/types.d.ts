import type { SiteConfig, UserConfig } from 'vitepress'
import type { ResolvedConfig } from 'vite'

export interface LlmstxtSettings {
	/**
	 * Determines whether to generate the `llms-full.txt` which contains all the documentation in one file
	 *
	 * @default true
	 */
	generateLLMsFullTxt?: boolean

	/**
	 * Indicates whether to generate the `llms.txt` file, which contains a list of sections with corresponding links.
	 *
	 * @default true
	 */
	generateLLMsTxt?: boolean

	/**
	 * The directory from which files will be processed.
	 *
	 * This is useful for configuring the plugin to generate documentation for LLMs in a specific language.
	 *
	 * @example
	 * ```typescript
	 * llmstxt({
	 *     // Generate documentation for LLMs from English documentation only
	 *     workDir: 'en'
	 * })
	 * ```
	 *
	 * @default vitepress.srcDir
	 */
	workDir?: string

	/**
	 * An array of file path patterns to be ignored during processing.
	 *
	 * This is useful for excluding certain files from LLMs, such as those not related to documentation (e.g., sponsors, team, etc.).
	 *
	 * @example
	 * ```typescript
	 * llmstxt({
	 *     ignoreFiles: [
	 *         'about/team/*',
	 *         'sponsor/*'
	 *         // ...
	 *     ]
	 * })
	 * ```
	 *
	 * @default []
	 */
	ignoreFiles?: string[]

	/**
	 * A custom template for the `llms.txt` file, allowing for a personalized order of elements.
	 *
	 * Available template elements include:
	 *
	 * - `{title}`: The title extracted from the frontmatter or the first h1 heading in the main document (`index.md`).
	 * - `{description}`: The description.
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
	 * ## Table of Contents
	 *
	 * {toc}
	 * ```
	 */
	customLLMsTxtTemplate?: string

	/**
	 * Custom variables for {@link LlmstxtSettings.customLLMsTxtTemplate | `customLLMsTxtTemplate`}.
	 *
	 * With this option you can edit or add variables to the template.
	 *
	 * You can change the title in `llms.txt` without having to change the template:
	 *
	 * @example
	 * ```typescript
	 * llmstxt({
	 *     customTemplateVariables: {
	 *         title: 'Very custom title',
	 *     }
	 * })
	 * ```
	 *
	 * You can also combine this with a custom template:
	 *
	 * @example
	 * ```typescript
	 * llmstxt({
	 *     customLLMsTxtTemplate: '# {title}\n\n{foo}',
	 *     customTemplateVariables: {
	 *         foo: 'Very custom title',
	 *     }
	 * })
	 * ```
	 */
	customTemplateVariables?: {
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
		 * An automatically generated **T**able **O**f **C**ontents.
		 *
		 * @example
		 * ```markdown
		 * - [My Title](/index.md)
		 * - [My Title 2](/guide.md)
		 * ```
		 */
		toc?: string
		/** Any custom variable */
		// biome-ignore lint/suspicious/noExplicitAny: Let there be any types
		[key: string]: any
	}
}

/**
 * Represents a prepared file, including its title and path.
 */
export type PreparedFile = {
	/**
	 * The title of the file.
	 *
	 * @example 'Guide'
	 */
	title: string

	/**
	 * The absolute path to the file.
	 *
	 * @example 'guide/getting-started.md'
	 */
	path: string
}

interface VitePressConfig
	extends Omit<UserConfig, keyof ResolvedConfig>,
		ResolvedConfig {
	vitepress: SiteConfig
}
