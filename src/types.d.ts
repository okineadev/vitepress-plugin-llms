import type { UserConfig } from 'vite'

export interface LlmstxtSettings {
	/**
	 * Determines whether to generate the `llms-full.txt` which contains all the documentation in one file
	 *
	 * @default true
	 */
	generateLLMsFullTxt?: boolean
	/**
	 * Determines whether to generate the `llms.txt` which contains a list of sections with links
	 *
	 * @default true
	 */
	generateLLMsTxt?: boolean
	/**
	 * An array of strings representing file paths to be ignored
	 *
	 * @default []
	 */
	ignoreFiles?: string[]
}

/**
 * Represents a prepared file with its title and path.
 */
export type PreparedFile = {
	/**
	 * The title of the file
	 *
	 * @example 'Guide'
	 */
	title: string

	/**
	 * The absolute path to the file
	 *
	 * @example 'guide/getting-started.md'
	 */
	path: string
}

/**
 * Configuration interface for VitePress, extending the UserConfig from Vite.
 */
interface VitePressConfig extends UserConfig {
	/** The **VitePress** configuration */
	vitepress: {
		/** The directory where the output files will be generated */
		outDir: string
	}
}
