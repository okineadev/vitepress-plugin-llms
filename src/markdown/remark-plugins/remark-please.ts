import type { Parent, Root } from 'mdast'

import { type BuildVisitor, visit } from 'unist-util-visit'

import type { NotUndefined } from '@/internal-types'

import { fullTagRegex, tagRegex } from '@/constants'

type HtmlVisitorArgs = NotUndefined<Parameters<BuildVisitor<Root, 'html'>>>

interface PluginContext {
	intent: 'remove' | 'unwrap'
	tag: string
	fullTagRx: RegExp
}

interface NodePosition {
	node: HtmlVisitorArgs[0]
	index: number
	parent: Parent
}

function handleFullTag(ctx: PluginContext, pos: NodePosition): boolean {
	if (!ctx.fullTagRx.test(pos.node.value)) {
		return false
	}
	if (ctx.intent === 'remove') {
		pos.parent.children.splice(pos.index, 1)
	} else {
		const match = pos.node.value.match(ctx.fullTagRx)
		if (typeof match?.[1] === 'string') {
			pos.node.value = match[1].trim()
		}
	}
	return true
}

function findClosingTag(ctx: PluginContext, pos: NodePosition): number {
	return pos.parent.children.findIndex(
		(node, index) =>
			index > pos.index && node.type === 'html' && tagRegex(ctx.tag, 'closed').test(node.value),
	)
}

function handleSplitTag(ctx: PluginContext, pos: NodePosition): void {
	if (!tagRegex(ctx.tag, 'open').test(pos.node.value)) {
		return
	}
	const closeIndex = findClosingTag(ctx, pos)
	if (closeIndex === -1) {
		return
	}
	if (ctx.intent === 'remove') {
		pos.parent.children.splice(pos.index, closeIndex - pos.index + 1)
	} else {
		pos.parent.children.splice(closeIndex, 1)
		pos.parent.children.splice(pos.index, 1)
	}
}

function removeEmptyParagraphs(tree: Root): void {
	const paragraphsToRemove: { index: number; parent: Parent }[] = []
	visit(tree, 'paragraph', (node, index, parent) => {
		if (!parent || typeof index !== 'number') {
			return
		}
		const [firstChild] = node.children
		if (
			node.children.length === 0 ||
			(node.children.length === 1 && firstChild?.type === 'text' && firstChild.value.trim() === '')
		) {
			paragraphsToRemove.push({ index, parent })
		}
	})
	for (const { index, parent } of paragraphsToRemove.reverse()) {
		parent.children.splice(index, 1)
	}
}

function remarkPlease(intent: 'remove' | 'unwrap', tag: string) {
	return () =>
		(tree: Root): Root => {
			const ctx: PluginContext = { fullTagRx: fullTagRegex(tag), intent, tag }
			const nodesToProcess: HtmlVisitorArgs[] = []
			visit(tree, 'html', (node, index, parent) => {
				if (parent && typeof index === 'number') {
					nodesToProcess.push([node, index, parent])
				}
			})
			for (const [node, index, parent] of nodesToProcess.reverse()) {
				const pos = { index, node, parent }
				if (!handleFullTag(ctx, pos)) {
					handleSplitTag(ctx, pos)
				}
			}
			removeEmptyParagraphs(tree)
			return tree
		}
}

export default remarkPlease
