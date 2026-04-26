// oxlint-disable import/prefer-default-export
import type MarkdownIt from 'markdown-it'

import Token from 'markdown-it/lib/token.mjs' // 🩼

// Spell-checker:words Divyansh
/**
 * Markdown-it plugin that injects `<CopyOrDownloadAsMarkdownButtons />` after the first H1 heading
 *
 * @author [Divyansh Singh](https://github.com/brc-dd)
 * @param componentName - The name of the Vue component to inject (default:
 *   `'CopyOrDownloadAsMarkdownButtons'`), useful when you need to customize the name of a component if such a
 *   component is already registered so as not to get confused with it
 */
export function copyOrDownloadAsMarkdownButtons(
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
	md: MarkdownIt,
	componentName = 'CopyOrDownloadAsMarkdownButtons',
): void {
	const orig = md.renderer.render.bind(md.renderer)

	md.renderer.render = (tokens, options, env): string => {
		const len = tokens.length

		for (let i = 0; i < len; i += 1) {
			const open = tokens[i]
			if (open?.tag === 'h1' && open.type === 'heading_open') {
				const closeIndex = tokens.findIndex(
					(token, j) => j > i && token.tag === 'h1' && token.type === 'heading_close',
				)
				if (closeIndex !== -1) {
					const htmlToken = new Token('html_block', '', 0)
					htmlToken.content = `<${componentName} />`
					tokens.splice(closeIndex + 1, 0, htmlToken)
				}
				break
			}
		}

		return orig(tokens, options, env)
	}
}
