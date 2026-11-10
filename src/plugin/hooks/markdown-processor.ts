import type { Node, Root } from 'mdast'
import type { Processor } from 'unified'

import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { remove } from 'unist-util-remove'

import remarkPlease from '@/markdown/remark-plugins/remark-please'
import remarkReplaceImageUrls from '@/markdown/remark-plugins/replace-image-urls'
import remarkInclude from '@/markdown/remark-plugins/snippets'

function createMarkdownProcessor(
	workDir: string,
	imageMap: Map<string, string>,
	stripHTML: boolean,
): Processor<Root, Root, Root, Root, string> {
	const processor = remark()
		.use(remarkFrontmatter)
		.use(remarkInclude({ srcDir: workDir }))
		.use(remarkPlease('unwrap', 'llm-only'))
		.use(remarkPlease('remove', 'llm-exclude'))
		.use(remarkReplaceImageUrls(imageMap))
	if (stripHTML) {
		processor.use(() => (tree): Node => {
			remove(tree, { type: 'html' })
			return tree
		})
	}
	return processor
}

export default createMarkdownProcessor
