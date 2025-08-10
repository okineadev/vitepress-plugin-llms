import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { remark } from 'remark'

// Mock node:fs before importing the plugin
const mockExistsSync = mock(() => true)
const mockReadFileSync = mock(() => 'Included content from file')
const mockStatSync = mock(() => ({ isFile: () => true }))

mock.module('node:fs', () => ({
	default: {
		existsSync: mockExistsSync,
		readFileSync: mockReadFileSync,
		statSync: mockStatSync,
	},
	existsSync: mockExistsSync,
	readFileSync: mockReadFileSync,
	statSync: mockStatSync,
}))

// Import after mocking
import remarkInclude from '../../../src/markdown/remark-plugins/snippets'

describe('remark-include simple test', () => {
	beforeEach(() => {
		mockExistsSync.mockReset()
		mockReadFileSync.mockReset()
		mockStatSync.mockReset()

		mockExistsSync.mockReturnValue(true)
		mockStatSync.mockReturnValue({ isFile: () => true })
	})

	it('should process basic include', async () => {
		mockReadFileSync.mockReturnValueOnce('Hello from included file!')

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '# Main\n<!--@include: ./test.md-->\n# End'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toContain('Hello from included file!')
		expect(output).not.toContain('<!--@include:')
		expect(mockExistsSync).toHaveBeenCalledTimes(1)
		expect(mockReadFileSync).toHaveBeenCalledTimes(1)
	})

	it('should handle missing files', async () => {
		mockExistsSync.mockReturnValue(false)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '# Main\n<!--@include: ./missing.md-->\n# End'
		const result = await processor.process(markdown)

		const output = String(result)
		// Should keep the original include comment when file is missing
		expect(output).toContain('<!--@include: ./missing.md-->')
	})

	it('should handle line ranges', async () => {
		const fileContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
		mockReadFileSync.mockReturnValue(fileContent)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<!--@include: ./test.md{2,4}-->'
		const result = await processor.process(markdown)

		const output = String(result)

		expect(output).toContain('Line 2')
		expect(output).toContain('Line 3')
		expect(output).toContain('Line 4')
		expect(output).not.toContain('Line 1')
		expect(output).not.toContain('Line 5')
	})

	it('should handle regions', async () => {
		const fileContent = `Before region
<!-- #region test -->
Inside region content
<!-- #endregion test -->
After region`

		mockReadFileSync.mockReturnValue(fileContent)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<!--@include: ./test.md#test-->'
		const result = await processor.process(markdown)

		const output = String(result)

		expect(output).toContain('Inside region content')
		expect(output).not.toContain('Before region')
		expect(output).not.toContain('After region')
	})

	it('should handle @ prefix', async () => {
		mockReadFileSync.mockReturnValue('Content from source root')

		const processor = remark().use(
			remarkInclude({
				srcDir: '/source/root',
			}),
		)

		const markdown = '<!--@include: @/config/file.md-->'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toContain('Content from source root')

		// Check that the path was resolved from srcDir
		expect(mockReadFileSync).toHaveBeenCalledWith(
			expect.stringContaining('/source/root/config/file.md'),
			'utf-8',
		)
	})
})
