// oxlint-disable import/prefer-default-export
import type MarkdownIt from 'markdown-it'

import Token from 'markdown-it/lib/token.mjs' // 🩼

/**
 * Options for the copyOrDownloadAsMarkdownButtons markdown-it plugin
 */
export interface CopyOrDownloadAsMarkdownButtonsPluginOptions {
	/**
	 * The name of the Vue component to inject
	 * @default 'CopyOrDownloadAsMarkdownButtons'
	 */
	componentName?: string
	/**
	 * Whether to show the download button
	 * @default true
	 */
	showDownload?: boolean
}

// Spell-checker:words Divyansh
/**
 * Markdown-it plugin that injects `<CopyOrDownloadAsMarkdownButtons />` after the first H1 heading
 *
 * @author [Divyansh Singh](https://github.com/brc-dd)
 * @param md - The markdown-it instance to extend with the plugin.
 * @param options - Plugin options. Can be a string (component name) for backward compatibility or an
 *   object with `componentName` and `showDownload` properties. Useful when you need to customize the
 *   component name or hide the download button.
 */
export function copyOrDownloadAsMarkdownButtons(
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- `md` is intentionally mutated via `md.renderer.render`
	md: MarkdownIt,
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- options object is normalized and not mutated
	options: CopyOrDownloadAsMarkdownButtonsPluginOptions | string = 'CopyOrDownloadAsMarkdownButtons',
): void {
	// Handle backward compatibility: support both string and object parameter
	const opts: CopyOrDownloadAsMarkdownButtonsPluginOptions =
		typeof options === 'string' ? { componentName: options } : options

	const componentName = opts.componentName ?? 'CopyOrDownloadAsMarkdownButtons'
	const showDownload = opts.showDownload ?? true

	const orig = md.renderer.render.bind(md.renderer)

	md.renderer.render = (tokens, renderOptions, env): string => {
		const len = tokens.length

		for (let i = 0; i < len; i += 1) {
			const open = tokens[i]
			if (open?.tag === 'h1' && open.type === 'heading_open') {
				const closeIndex = tokens.findIndex(
					(token, j) => j > i && token.tag === 'h1' && token.type === 'heading_close',
				)
				if (closeIndex !== -1) {
					const htmlToken = new Token('html_block', '', 0)
					// Generate component tag with props
					htmlToken.content = showDownload
						? `<${componentName} />`
						: `<${componentName} :show-download="false" />`
					tokens.splice(closeIndex + 1, 0, htmlToken)
				}
				break
			}
		}

		return orig(tokens, renderOptions, env)
	}
}
