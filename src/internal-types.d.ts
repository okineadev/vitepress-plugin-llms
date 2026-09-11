import type { GrayMatterFile } from '@11ty/gray-matter'
import type { ResolvedConfig } from 'vite'
import type { SiteConfig, UserConfig, DefaultTheme } from 'vitepress'

/** Represents a prepared file, including its title and path. */
export interface PreparedFile {
	/**
	 * The title of the file.
	 *
	 * @example
	 * 	'Guide'
	 */
	title: string

	/**
	 * The absolute path to the file.
	 *
	 * @example
	 * 	'guide/getting-started.md'
	 */
	path: string

	/**
	 * The prepared file itself.
	 *
	 * @example
	 * ```typescript
	 * {
	 *   data: {
	 *     title: 'Guide'
	 *   },
	 *   content: 'Content goes here'
	 *   orig: '---\ntitle: Guide\n---\n\nContent goes here'
	 * }
	 * ```
	 */
	file: GrayMatterFile<Input>
}

type TypedSiteConfig = Omit<SiteConfig, 'userConfig'> & {
	userConfig: UserConfig<DefaultTheme.Config>
}

export interface VitePressConfig
	extends Omit<UserConfig<DefaultTheme.Config>, keyof ResolvedConfig>, ResolvedConfig {
	vitepress: TypedSiteConfig
}

declare module 'vitepress' {
	interface SiteConfig<ThemeConfig> {
		userConfig: UserConfig<ThemeConfig>
	}
}

/** Represents the link extension options for generated links. */
export type LinksExtension = '.md' | '.html'

export type NotUndefined<T> = {
	[K in keyof T]-?: Exclude<T[K], undefined>
}

// Export type DeepReadonly<T> = T extends (...args: unknown) => unknown
// 	? T
// 	: T extends unknown[]
// 		? T[number][]
// 		: T extends object
// 			? { [K in keyof T]: T[K] }
// 			: T
