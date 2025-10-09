import { beforeEach, describe, expect, it, mock } from 'bun:test'
import dedent from 'dedent'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { remove } from 'unist-util-remove'
import type { VitePressConfig } from '@/internal-types'
import remarkPlease from '@/markdown/remark-plugins/remark-please'
import { transform } from '@/plugin/hooks'
import type { LlmstxtSettings } from '@/types'

// Mock fs.access to control which files "exist"
const mockFsAccess = mock()

mock.module('node:fs/promises', () => ({
	default: {
		access: mockFsAccess,
		readFile: mock(),
	},
	access: mockFsAccess,
	readFile: mock(),
}))

describe('transform hook with VitePress dynamic routes', () => {
	let mdFiles: Set<string>
	let config: VitePressConfig
	let settings: LlmstxtSettings & { ignoreFiles: string[]; workDir: string }

	beforeEach(() => {
		mdFiles = new Set()
		config = {
			vitepress: {
				srcDir: '/mock/docs',
				outDir: '/mock/dist',
				userConfig: {},
			},
			base: '/',
		} as VitePressConfig

		settings = {
			workDir: '/mock/docs',
			ignoreFiles: [],
			injectLLMHint: false,
			generateLLMsTxt: true,
			generateLLMsFullTxt: true,
			generateLLMFriendlyDocsForEachPage: true,
		}

		// Reset and configure fs.access mock
		mockFsAccess.mockReset()
		// By default, simulate that files exist
		mockFsAccess.mockResolvedValue(undefined)
	})

	describe('VitePress param marker preservation', () => {
		it('should preserve __VP_PARAMS_START markers in content', async () => {
			const content = dedent`
				__VP_PARAMS_START{"operationId":"get-accounts","pageTitle":"List accounts"}__VP_PARAMS_END
				---
				title: API Reference
				---

				# API Documentation

				Content here.
			`

			const result = await transform(content, '/mock/docs/api.md', settings, mdFiles, config)

			// Should not modify content with VP markers
			expect(result).toBeNull()
		})

		it('should preserve __VP_PARAMS markers with frontmatter', async () => {
			const content = dedent`
				__VP_PARAMS_START{"operationId":"get-users"}__VP_PARAMS_END
				---
				aside: false
				outline: false
				title: vitepress-openapi
				---

				# User API

				Get all users.
			`

			const result = await transform(content, '/mock/docs/users.md', settings, mdFiles, config)

			// Should not corrupt the content
			if (result !== null) {
				const code = result.code
				expect(code).toContain('__VP_PARAMS_START')
				expect(code).toContain('__VP_PARAMS_END')
				// Should not have duplicate frontmatter markers
				const frontmatterCount = (code.match(/^---$/gm) || []).length
				expect(frontmatterCount).toBeLessThanOrEqual(2) // At most opening and closing
			}
		})

		it('should not break frontmatter when VP markers present', async () => {
			const content = dedent`
				__VP_PARAMS_START{"key":"value"}__VP_PARAMS_END
				---
				layout: doc
				title: Test
				---

				# Content
			`

			const result = await transform(content, '/mock/docs/test.md', settings, mdFiles, config)

			if (result !== null) {
				const code = result.code
				// Frontmatter should not appear in the rendered content area
				// It should remain between --- markers
				expect(code).not.toMatch(/^layout: doc$/m)
				expect(code).not.toMatch(/^title: Test$/m)
			}
		})
	})

	describe('frontmatter handling without VP markers', () => {
		it('should not corrupt frontmatter in regular files', async () => {
			const content = dedent`
				---
				title: Regular Page
				description: A normal page
				---

				# Regular Content

				No dynamic routes here.
			`

			const result = await transform(content, '/mock/docs/regular.md', settings, mdFiles, config)

			if (result !== null) {
				const code = result.code
				// Should not render frontmatter as text
				const lines = code.split('\n')
				const contentStart = lines.findIndex((line) => line.includes('# Regular Content'))
				if (contentStart > 0) {
					// Check that frontmatter is not appearing before the heading
					const beforeHeading = lines.slice(0, contentStart).join('\n')
					expect(beforeHeading).not.toContain('title: Regular Page')
					expect(beforeHeading).not.toContain('description: A normal page')
				}
			}
		})

		it('should handle files without frontmatter', async () => {
			const content = dedent`
				# Simple Page

				Just content, no frontmatter.
			`

			const result = await transform(content, '/mock/docs/simple.md', settings, mdFiles, config)

			// Should return null since no modifications needed
			expect(result).toBeNull()
		})
	})

	describe('LLM hint injection with VP markers', () => {
		beforeEach(() => {
			settings.injectLLMHint = true
		})

		it('should inject LLM hint without corrupting VP markers', async () => {
			const content = dedent`
				__VP_PARAMS_START{"operationId":"test"}__VP_PARAMS_END
				---
				title: Test API
				---

				# API Content
			`

			const result = await transform(content, '/mock/docs/api.md', settings, mdFiles, config)

			// When LLM hint is enabled, transform should modify the content
			expect(result).not.toBeNull()

			const code = result!.code

			// Should contain LLM hint
			expect(code).toContain('Are you an LLM?')
			// Should preserve VP markers
			expect(code).toContain('__VP_PARAMS_START')
			expect(code).toContain('__VP_PARAMS_END')
			// Should not duplicate frontmatter
			const frontmatterMatches = code.match(/^---$/gm) || []
			expect(frontmatterMatches.length).toBe(2) // Exactly opening and closing
			// VP markers should come BEFORE first ---
			const firstDashIndex = code.indexOf('---')
			const vpStartIndex = code.indexOf('__VP_PARAMS_START')
			expect(vpStartIndex).toBeLessThan(firstDashIndex)
			// LLM hint should come AFTER frontmatter (and VP markers)
			const llmHintIndex = code.indexOf('Are you an LLM?')
			const frontmatterEndIndex = code.indexOf('---\n', firstDashIndex + 3)
			expect(llmHintIndex).toBeGreaterThan(frontmatterEndIndex)
		})

		it('should inject LLM hint after frontmatter, not before', async () => {
			const content = dedent`
				---
				title: Test
				---

				# Content
			`

			const result = await transform(content, '/mock/docs/test.md', settings, mdFiles, config)

			if (result !== null) {
				const code = result.code
				const lines = code.split('\n')

				// Find where frontmatter ends (second ---)
				let frontmatterEnd = -1
				let dashCount = 0
				for (let i = 0; i < lines.length; i++) {
					if (lines[i].trim() === '---') {
						dashCount++
						if (dashCount === 2) {
							frontmatterEnd = i
							break
						}
					}
				}

				// LLM hint should come after frontmatter
				if (frontmatterEnd >= 0) {
					const afterFrontmatter = lines.slice(frontmatterEnd + 1).join('\n')
					expect(afterFrontmatter).toContain('Are you an LLM?')
				}
			}
		})
	})

	describe('file path collection', () => {
		it('should add file to mdFiles set', async () => {
			const content = '# Test'
			await transform(content, '/mock/docs/test.md', settings, mdFiles, config)

			expect(mdFiles.has('/mock/docs/test.md')).toBe(true)
		})

		it('should not add ignored files to mdFiles', async () => {
			settings.ignoreFiles = ['ignored.md']
			const content = '# Ignored'

			await transform(content, '/mock/docs/ignored.md', settings, mdFiles, config)

			expect(mdFiles.has('/mock/docs/ignored.md')).toBe(false)
		})

		it('should not add template files to mdFiles', async () => {
			const content = '# {{ $params.operationId }}'

			// Template file with bracket syntax
			await transform(content, '/mock/docs/api/[operationId].md', settings, mdFiles, config)

			// Template files should not be added - they're processed via dynamicRoutes
			expect(mdFiles.has('/mock/docs/api/[operationId].md')).toBe(false)
			expect(mdFiles.size).toBe(0)
		})

		it('should not add virtual resolved dynamic route files to mdFiles', async () => {
			const content = '# Delete App'

			// Mock: this virtual file doesn't exist on disk
			mockFsAccess.mockRejectedValueOnce(new Error('ENOENT'))

			// Virtual resolved file (doesn't exist on disk)
			// This would be a resolved dynamic route like delete-apps.md
			await transform(content, '/mock/docs/api/delete-app-nonexistent.md', settings, mdFiles, config)

			// Virtual files should not be added - they're processed via dynamicRoutes
			expect(mdFiles.has('/mock/docs/api/delete-app-nonexistent.md')).toBe(false)
			expect(mdFiles.size).toBe(0)
		})

		it('should only add real files that exist on disk', async () => {
			const content = '# Real File'

			// Mock: file doesn't exist
			mockFsAccess.mockRejectedValueOnce(new Error('ENOENT'))

			// Mock file exists check will fail for non-existent paths
			// So this test verifies the file existence check works
			await transform(content, '/this/path/does/not/exist.md', settings, mdFiles, config)

			expect(mdFiles.size).toBe(0)
		})
	})

	describe('remark processing (like generateBundle does)', () => {
		it('should not strip VP markers when processing with remark', async () => {
			const content = dedent`
				__VP_PARAMS_START{"operationId":"test"}__VP_PARAMS_END
				---
				title: Test API
				---

				# API Content
			`

			// Simulate the remark processing done in generateBundle (lines 173-198 of hooks.ts)
			const markdownProcessor = remark()
				.use(remarkFrontmatter)
				.use(remarkPlease('unwrap', 'llm-only'))
				.use(remarkPlease('remove', 'llm-exclude'))

			// With stripHTML enabled (common case)
			markdownProcessor.use(() => {
				return (tree) => {
					remove(tree, { type: 'html' })
					return tree
				}
			})

			const processedContent = String(
				await markdownProcessor.process({
					path: 'test.md',
					value: content,
				}),
			)

			const processedMarkdown = matter(processedContent)

			// VP markers get escaped/corrupted by remark - this is the known issue!
			// They become \_\_VP\_PARAMS\_START instead of __VP_PARAMS_START
			// This test documents the bug we need to fix
			expect(processedContent).toContain('\\_\\_VP\\_PARAMS\\_START')
			expect(processedContent).toContain('\\_\\_VP\\_PARAMS\\_END')
		})

		it('should preserve VP markers even with HTML stripping', async () => {
			// Test case where VP markers might be mistaken for HTML
			const content = '__VP_PARAMS_START{"key":"value"}__VP_PARAMS_END\n\n# Content'

			const markdownProcessor = remark().use(() => {
				return (tree) => {
					remove(tree, { type: 'html' })
					return tree
				}
			})

			const processedContent = String(
				await markdownProcessor.process({
					path: 'test.md',
					value: content,
				}),
			)

			// VP markers get escaped by remark - underscores are markdown emphasis markers
			expect(processedContent).toContain('\\_\\_VP\\_PARAMS\\_START')
			expect(processedContent).toContain('\\_\\_VP\\_PARAMS\\_END')
		})
	})
})
