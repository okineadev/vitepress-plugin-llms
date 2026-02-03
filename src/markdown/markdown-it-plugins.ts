import type MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token.mjs'

// spell-checker:words Divyansh
/**
 * Markdown-it plugin that injects <CopyOrDownloadAsMarkdownButtons /> after the first H1 heading
 *
 * @param componentName - The name of the Vue component to inject
 * (default: `'CopyOrDownloadAsMarkdownButtons'`), useful when you need to
 * customize the name of a component if such a component is already registered
 * so as not to get confused with it
 *
 * @author [Divyansh Singh](https://github.com/brc-dd)
 */
export function copyOrDownloadAsMarkdownButtons(
	md: MarkdownIt,
	componentName = 'CopyOrDownloadAsMarkdownButtons',
): void {
	// oxlint-disable-next-line typescript/no-unsafe-assignment
	const orig = md.renderer.render.bind(md.renderer)

	md.renderer.render = (tokens, options, env) => {
		const len = tokens.length

		for (let i = 0; i < len; i++) {
			const open = tokens[i]
			if (open?.tag === 'h1' && open.type === 'heading_open') {
				const closeIndex = tokens.findIndex(
					(t, j) => j > i && t.tag === 'h1' && t.type === 'heading_close',
				)
				if (closeIndex !== -1) {
					const htmlToken = new Token('html_block', '', 0)
					htmlToken.content = `<${componentName} />`
					tokens.splice(closeIndex + 1, 0, htmlToken)
				}
				break
			}
		}

		// oxlint-disable-next-line typescript/no-unsafe-call typescript/no-unsafe-return
		return orig(tokens, options, env)
	}
}
