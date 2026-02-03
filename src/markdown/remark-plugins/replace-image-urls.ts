import path from 'node:path'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * A Remark plugin that replaces image URLs with their hashed equivalents.
 *
 * @param map - Map of original image file names to hashed file paths.
 * @returns A remark plugin that rewrites image URLs.
 */
function remarkReplaceImageUrls(map: Map<string, string>) {
	return () =>
		(tree: Root): void => {
			visit(tree, 'image', (node) => {
				const original = path.posix.basename(node.url)
				const hashed = map.get(original)
				if (hashed !== undefined) {
					node.url = `/${hashed}`
				}
			})
		}
}

export default remarkReplaceImageUrls
