import type { Code, Root, RootContent } from 'mdast'
import type { VFile } from 'vfile'

import { fromMarkdown } from 'mdast-util-from-markdown'
import { visit } from 'unist-util-visit'

import type { IncludeOptions } from './types'

import processIncludes from './includes'
import { includesRE, snippetRE } from './patterns'
import processSnippets from './snippets'

export type { IncludeOptions }

/** Remark plugin for markdown file inclusion and code snippets (VitePress-style) */
// oxlint-disable-next-line jsdoc/require-returns
function remarkInclude({ srcDir }: IncludeOptions) {
	return () =>
		(tree: Root, file: VFile): void => {
			const includes: string[] = []

			// oxlint-disable-next-line max-statements
			visit(tree, (node, index, parent) => {
				if (parent === undefined || typeof index !== 'number') {
					return
				}

				const isIncludeNode = node.type === 'html' && includesRE.test(node.value)
				const isSnippetNode = node.type === 'text' && snippetRE.test(node.value)

				if (isIncludeNode || isSnippetNode) {
					let processedValue: Code | string | undefined

					if (isIncludeNode) {
						processedValue = processIncludes({
							content: node.value,
							filePath: file.path,
							includes,
							srcDir,
						})
					} else if (isSnippetNode) {
						processedValue = processSnippets({
							content: node.value,
							filePath: file.path,
							includes,
							srcDir,
						})
					}

					if (processedValue !== undefined) {
						if (typeof processedValue === 'string') {
							if (processedValue !== (node as { value: string }).value) {
								parent.children.splice(index, 1, ...fromMarkdown(processedValue).children)
							}
						} else {
							parent.children.splice(index, 1, processedValue as RootContent)
						}
					}
				}
			})

			file.data['includes'] = includes
		}
}

export default remarkInclude
