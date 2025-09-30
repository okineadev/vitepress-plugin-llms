import type { Paragraph, Parent, Root } from 'mdast'
import { type BuildVisitor, visit } from 'unist-util-visit'
import { fullTagRegex, tagRegex } from '@/constants'
import type { NotUndefined } from '@/internal-types'

/**
 * Creates a remark plugin that either removes or unwraps specified HTML tags from markdown AST.
 *
 * @param intent - Specifies whether to 'remove' the tag and its content completely, or 'unwrap' to keep the content but remove the tags
 * @param tag - The HTML tag name to process (e.g., 'div', 'span', etc.)
 *
 * @returns A function that can be used as a remark plugin
 */
function remarkPlease(intent: 'remove' | 'unwrap', tag: string) {
	return () =>
		(tree: Root): Root => {
			const ourFullTagRegex = fullTagRegex(tag)

			// First pass: collect all HTML nodes to process
			const nodesToProcess: NotUndefined<Parameters<BuildVisitor<Root, 'html'>>>[] = []
			visit(tree, 'html', (node, index, parent) => {
				if (!parent || typeof index !== 'number') return
				nodesToProcess.push([node, index, parent])
			})

			// Track which paragraph nodes become empty
			const emptyParagraphs = new Set<{ node: Paragraph; parent: Parent }>()

			// Second pass: process nodes in reverse order
			for (const [node, index, parent] of nodesToProcess.reverse()) {
				// Case 1: The entire content is in one HTML node
				if (ourFullTagRegex.test(node.value)) {
					if (intent === 'remove') {
						parent.children.splice(index, 1)
						if (parent.type === 'paragraph' && parent.children.length === 0) {
							emptyParagraphs.add({ node: parent, parent })
						}
						continue
					}
					if (intent === 'unwrap') {
						const match = node.value.match(ourFullTagRegex)
						if (match?.[1]) {
							// Replace the node with its inner content
							node.value = match[1].trim()
						}
						continue
					}
				}

				// Case 2: Opening and closing tags are separate nodes
				if (tagRegex(tag, 'open').test(node.value)) {
					// Find the closing tag
					let closeIndex = index + 1
					while (closeIndex < parent.children.length) {
						const closeNode = parent.children[closeIndex]
						if (closeNode && closeNode.type === 'html' && tagRegex(tag, 'closed').test(closeNode.value)) {
							break
						}
						closeIndex++
					}

					if (closeIndex < parent.children.length) {
						if (intent === 'remove') {
							// Remove all nodes from opening to closing tag (inclusive)
							parent.children.splice(index, closeIndex - index + 1)
							if (parent.type === 'paragraph' && parent.children.length === 0) {
								emptyParagraphs.add({ node: parent, parent })
							}
						} else if (intent === 'unwrap') {
							// Keep the content between tags, remove only the HTML tag nodes
							parent.children.splice(closeIndex, 1) // Remove closing tag
							parent.children.splice(index, 1) // Remove opening tag
						}
					}
				}
			}

			// Warning: Vibe-coded, be careful.

			// Final pass: collect and remove empty paragraph nodes
			const paragraphsToRemove: Array<{ index: number; parent: Parent }> = []

			// First mark paragraphs that were emptied during tag removal
			for (const { node, parent } of emptyParagraphs) {
				const index = parent.children.indexOf(node)
				if (index !== -1) {
					paragraphsToRemove.push({ index, parent })
				}
			}

			// Then check for any other empty paragraphs (only whitespace or no children)
			visit(tree, 'paragraph', (node, index, parent) => {
				if (!parent || typeof index !== 'number') return

				const firstChild = node.children[0]
				const isEmpty =
					node.children.length === 0 ||
					(node.children.length === 1 && firstChild?.type === 'text' && firstChild.value.trim() === '')

				if (isEmpty) {
					paragraphsToRemove.push({ index, parent })
				}
			})

			// Remove empty paragraphs in reverse order to maintain correct indices
			for (const { index, parent } of paragraphsToRemove.reverse()) {
				parent.children.splice(index, 1)
			}

			return tree
		}
}

export default remarkPlease
