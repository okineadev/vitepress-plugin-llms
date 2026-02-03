import { beforeEach, describe, expect, it } from 'bun:test'
import { remark } from 'remark'
// oxlint-disable-next-line typescript/prefer-ts-expect-error typescript/ban-ts-comment
// @ts-ignore
import remarkPlease from '@/markdown/remark-plugins/remark-please'

describe('remarkPlease', () => {
	let remarkProcessor: typeof remark

	beforeEach(() => {
		remarkProcessor = remark()
	})

	describe('unwrap', () => {
		it('should unwrap content from a single HTML node', async () => {
			const testString = '<llm-only>Special text for LLMs</llm-only>'

			remarkProcessor.use(remarkPlease('unwrap', 'llm-only'))

			const file = await remarkProcessor.process(testString)
			const result = String(file)

			expect(result).toBe('Special text for LLMs\n')
		})

		it('should unwrap content between separate HTML nodes', async () => {
			const testString = '<llm-only>\n\n## Special section for LLMs\n\n</llm-only>'

			remarkProcessor.use(remarkPlease('unwrap', 'llm-only'))

			const file = await remarkProcessor.process(testString)
			const result = String(file)

			expect(result).toBe('## Special section for LLMs\n')
		})

		it('should handle multiple blocks of content', async () => {
			const testString =
				'<llm-only>First block</llm-only>\n\nRegular content\n\n<llm-only>Second block</llm-only>'

			remarkProcessor.use(remarkPlease('unwrap', 'llm-only'))

			const file = await remarkProcessor.process(testString)
			const result = String(file)

			expect(result).toBe('First block\n\nRegular content\n\nSecond block\n')
		})
	})

	describe('remove', () => {
		it('should remove a single HTML node with content', async () => {
			const testString = '<llm-exclude>\n## Section to remove\n</llm-exclude>'

			remarkProcessor.use(remarkPlease('remove', 'llm-exclude'))

			const file = await remarkProcessor.process(testString)
			const result = String(file)

			expect(result).toBeEmpty()
		})

		it('should remove content between separate HTML nodes', async () => {
			const testString = '<llm-exclude>\n\n## Section to remove\n\n</llm-exclude>'

			remarkProcessor.use(remarkPlease('remove', 'llm-exclude'))

			const file = await remarkProcessor.process(testString)
			const result = String(file)

			expect(result).toBeEmpty()
		})

		it('should remove multiple blocks', async () => {
			const testString =
				'<llm-exclude>First block to remove</llm-exclude>\n\nKeep this content\n\n<llm-exclude>Second block to remove</llm-exclude>\n\n<llm-exclude>Third block to remove</llm-exclude>'

			remarkProcessor.use(remarkPlease('remove', 'llm-exclude'))

			const file = await remarkProcessor.process(testString)
			const result = String(file)

			expect(result).toBe('Keep this content\n')
		})
	})
})
