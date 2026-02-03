import type { GrayMatterFile } from 'gray-matter'
import type { ResolvedConfig } from 'vite'
import type { SiteConfig, UserConfig } from 'vitepress'

/** Represents a prepared file, including its title and path. */
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

	/**
	 * The prepared file itself.
	 *
	 * @example
	 * ```typescript
	 * {
	 *   data: {
	 *      title: 'Guide'
	 *   },
	 *   content: 'Content goes here'
	 *   orig: '---\ntitle: Guide\n---\n\nContent goes here'
	 * }
	 * ```
	 */
	file: GrayMatterFile<Input>
}

export interface VitePressConfig extends Omit<UserConfig, keyof ResolvedConfig>, ResolvedConfig {
	vitepress: SiteConfig
}

/** Represents the link extension options for generated links. */
export type LinksExtension = '.md' | '.html'

export type NotUndefined<T> = {
	[K in keyof T]-?: Exclude<T[K], undefined>
}
