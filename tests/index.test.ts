import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import type { ViteDevServer } from 'vite'
import type { Plugin } from 'vitepress'
import { mockedFs } from './mocks/fs'
import fakeMarkdownDocument from './test-assets/markdown-document.md' with { type: 'text' }

mock.module('node:fs/promises', () => mockedFs)
const { access, mkdir, writeFile } = mockedFs.default

// Mock the logger to prevent output
mock.module('../src/helpers/logger', () => ({
	default: {
		info: mock(),
		success: mock(),
		warn: mock(),
		error: mock(),
	},
}))

import path from 'node:path'
// Import the module under test AFTER mocking its dependencies
// @ts-ignore
import llmstxt from '../src/index'
import type { VitePressConfig } from '../src/types'

describe('llmstxt plugin', () => {
	let plugin: [Plugin, Plugin]
	let mockConfig: VitePressConfig
	let mockServer: ViteDevServer

	beforeEach(() => {
		// Reset mock call counts
		mkdir.mockReset()
		writeFile.mockReset()

		// Setup mock config
		mockConfig = {
			vitepress: {
				outDir: 'dist',
				srcDir: 'docs',
			},
			build: {
				ssr: false,
			},
		} as VitePressConfig

		// Setup mock server
		mockServer = {
			middlewares: {
				use: mock(),
			},
		} as unknown as ViteDevServer

		// Initialize plugin
		plugin = llmstxt()
	})

	describe('configureServer', () => {
		it('should configure server middleware', () => {
			// @ts-ignore
			plugin[1].configureServer(mockServer)
			const spyMiddlewaresUse = spyOn(mockServer.middlewares, 'use')
			expect(spyMiddlewaresUse).toHaveBeenCalled()
		})
	})

	describe('transform', () => {
		it('should collect markdown files', async () => {
			// @ts-ignore
			const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/test.md')
			expect(result).toBeNull()
		})

		it('should not collect non-markdown files', async () => {
			// @ts-ignore
			const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/test.ts')
			expect(result).toBeNull()
		})
	})

	describe('generateBundle', () => {
		it('should skip processing in SSR build', () => {
			const ssrConfig = { ...mockConfig, build: { ssr: true } }
			// @ts-ignore
			plugin[1].configResolved(ssrConfig)
			// @ts-ignore
			plugin[1].generateBundle()
			expect(writeFile).not.toHaveBeenCalled()
		})

		it('should create output directory if it does not exist', async () => {
			access.mockImplementationOnce(async () => {
				throw new Error()
			})

			// @ts-ignore
			plugin[1].configResolved(mockConfig)
			// @ts-ignore
			await plugin[1].generateBundle()

			expect(mkdir).toHaveBeenCalledWith('dist', { recursive: true })
		})

		it('should process markdown files and generate output files', async () => {
			plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMsTxt: false })
			// @ts-ignore
			plugin[1].configResolved(mockConfig)
			await Promise.all([
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/test.md'),
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/test/test.md'),
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/guide/index.md'),
			])
			// @ts-ignore
			await plugin[1].generateBundle()

			// Verify that files were written
			expect(writeFile).toHaveBeenCalledTimes(3)
			expect(writeFile).nthCalledWith(
				1,
				path.resolve(mockConfig.vitepress.outDir, 'test.md'),
				'---\nurl: /test.md\n---\n# Some cool stuff\n',
			)
			expect(writeFile).nthCalledWith(
				2,
				path.resolve(mockConfig.vitepress.outDir, 'test', 'test.md'),
				'---\nurl: /test/test.md\n---\n# Some cool stuff\n',
			)
			expect(writeFile).nthCalledWith(
				3,
				path.resolve(mockConfig.vitepress.outDir, 'guide.md'),
				'---\nurl: /guide.md\n---\n# Some cool stuff\n',
			)
		})

		it('should ignore files specified in ignoreFiles option', async () => {
			plugin = llmstxt({
				generateLLMsFullTxt: false,
				generateLLMsTxt: false,
				ignoreFiles: ['test/*.md'],
			})
			// @ts-ignore
			plugin[1].configResolved(mockConfig)
			await Promise.all([
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/test.md'),
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/test/test.md'),
			])
			// @ts-ignore
			await plugin[1].generateBundle()

			// Verify that only non-ignored files were written
			expect(writeFile).toHaveBeenCalledTimes(1)
			expect(writeFile).toBeCalledWith(
				// docs/test.md
				path.resolve(mockConfig.vitepress.outDir, 'test.md'),
				'---\nurl: /test.md\n---\n# Some cool stuff\n',
			)
		})

		it('does not add links with `.md` extension in `llms.txt` if `generateLLMFriendlyDocsForEachPage` option is disabled', async () => {
			plugin = llmstxt({
				generateLLMsFullTxt: false,
				generateLLMFriendlyDocsForEachPage: false,
			})
			// @ts-ignore
			plugin[1].configResolved(mockConfig)
			await Promise.all([
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/test.md'),
			])
			// @ts-ignore
			await plugin[1].generateBundle()

			expect(writeFile).toHaveBeenCalledTimes(1)
			expect(writeFile.mock?.lastCall?.[1]).toMatchSnapshot()
		})

		it('does not add links with `.md` extension in `llms-full.txt` if `generateLLMFriendlyDocsForEachPage` option is disabled', async () => {
			plugin = llmstxt({
				generateLLMsTxt: false,
				generateLLMFriendlyDocsForEachPage: false,
			})
			// @ts-ignore
			plugin[1].configResolved(mockConfig)
			await Promise.all([
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/test.md'),
			])
			// @ts-ignore
			await plugin[1].generateBundle()

			expect(writeFile).toHaveBeenCalledTimes(1)
			expect(writeFile.mock?.lastCall?.[1]).toMatchSnapshot()
		})

		describe('rewrites handling', () => {
			it('should apply simple rewrites to file paths', async () => {
				const configWithRewrites = {
					...mockConfig,
					vitepress: {
						...mockConfig.vitepress,
						rewrites: {
							'docs/guide/index.md': 'guide.md',
							'docs/api/reference.md': 'api.md',
						},
					},
				}

				plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMsTxt: false })
				// @ts-ignore
				plugin[1].configResolved(configWithRewrites)

				await Promise.all([
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/guide/index.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/reference.md'),
				])
				// @ts-ignore
				await plugin[1].generateBundle()

				expect(writeFile).toHaveBeenCalledTimes(2)

				expect(writeFile).nthCalledWith(
					1,
					path.resolve(mockConfig.vitepress.outDir, 'guide.md'),
					'---\nurl: /guide.md\n---\n# Some cool stuff\n',
				)
				expect(writeFile).nthCalledWith(
					2,
					path.resolve(mockConfig.vitepress.outDir, 'api.md'),
					'---\nurl: /api.md\n---\n# Some cool stuff\n',
				)
			})

			it('should handle wildcard rewrites with :path parameter', async () => {
				const configWithWildcardRewrites = {
					...mockConfig,
					vitepress: {
						...mockConfig.vitepress,
						rewrites: {
							'docs/guide/:path(.*)': 'guide/:path',
						},
					},
				}

				plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMsTxt: false })
				// @ts-ignore
				plugin[1].configResolved(configWithWildcardRewrites)

				// @ts-ignore
				await plugin[0].transform(fakeMarkdownDocument, 'docs/guide/installation.md')
				// @ts-ignore
				await plugin[1].generateBundle()

				expect(writeFile).toHaveBeenCalledWith(
					path.resolve(mockConfig.vitepress.outDir, 'guide', 'installation.md'),
					'---\nurl: /guide/installation.md\n---\n# Some cool stuff\n',
				)
			})

			it('should preserve original paths when no rewrites match', async () => {
				const configWithRewrites = {
					...mockConfig,
					vitepress: {
						...mockConfig.vitepress,
						rewrites: {
							'docs/guide/index.md': 'guide.md',
						},
					},
				}

				plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMsTxt: false })
				// @ts-ignore
				plugin[1].configResolved(configWithRewrites)

				// @ts-ignore
				await plugin[0].transform(fakeMarkdownDocument, 'docs/other/page.md')
				// @ts-ignore
				await plugin[1].generateBundle()

				expect(writeFile).toHaveBeenCalledTimes(1)

				expect(writeFile).nthCalledWith(
					1,
					path.resolve(mockConfig.vitepress.outDir, 'other', 'page.md'),
					'---\nurl: /other/page.md\n---\n# Some cool stuff\n',
				)
			})

			it('should apply rewrites correctly in llms.txt links', async () => {
				const configWithRewrites = {
					...mockConfig,
					vitepress: {
						...mockConfig.vitepress,
						rewrites: {
							'docs/guide/index.md': 'guide.md',
						},
					},
				}

				plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMFriendlyDocsForEachPage: false })
				// @ts-ignore
				plugin[1].configResolved(configWithRewrites)

				// @ts-ignore
				await plugin[0].transform(fakeMarkdownDocument, 'docs/guide/index.md')
				// @ts-ignore
				await plugin[1].generateBundle()

				expect(writeFile).toBeCalledTimes(1)

				const result = writeFile.mock.calls[0][1]

				expect(result).toContain('/guide.html')
				expect(result).not.toContain('/guide/index.html')
			})
		})

		describe('experimental depth option', () => {
			it('should generate llms.txt only in root when depth is 1 (default)', async () => {
				plugin = llmstxt({
					generateLLMsFullTxt: false,
					generateLLMFriendlyDocsForEachPage: false,
					experimental: { depth: 1 },
				})
				// @ts-ignore
				plugin[1].configResolved(mockConfig)
				await Promise.all([
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/test.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/guide/test.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/reference.md'),
				])
				// @ts-ignore
				await plugin[1].generateBundle()

				// Should only generate root llms.txt
				expect(writeFile).toHaveBeenCalledTimes(1)
				const calls = writeFile.mock.calls.map((call) => call[0] as string)
				expect(calls.some((filepath) => filepath.endsWith(path.join('dist', 'llms.txt')))).toBe(true)
			})

			it('should generate llms.txt in root and first-level subdirectories when depth is 2', async () => {
				plugin = llmstxt({
					generateLLMsFullTxt: false,
					generateLLMFriendlyDocsForEachPage: false,
					experimental: { depth: 2 },
				})
				// @ts-ignore
				plugin[1].configResolved(mockConfig)
				await Promise.all([
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/test.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/guide/test.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/reference.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/advanced/config.md'),
				])
				// @ts-ignore
				await plugin[1].generateBundle()

				// Should generate root llms.txt + subdirectory llms.txt files
				expect(writeFile).toHaveBeenCalledTimes(3)
				const calls = writeFile.mock.calls.map((call) => call[0] as string)
				expect(calls.some((filepath) => filepath.endsWith(path.join('dist', 'llms.txt')))).toBe(true) // root
				expect(calls.some((filepath) => filepath.endsWith(path.join('guide', 'llms.txt')))).toBe(true)
				expect(calls.some((filepath) => filepath.endsWith(path.join('api', 'llms.txt')))).toBe(true)
			})

			it('should generate llms.txt files up to specified depth level', async () => {
				plugin = llmstxt({
					generateLLMsFullTxt: false,
					generateLLMFriendlyDocsForEachPage: false,
					experimental: { depth: 3 },
				})
				// @ts-ignore
				plugin[1].configResolved(mockConfig)
				await Promise.all([
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/test.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/guide/test.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/reference.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/advanced/config.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/advanced/nested/deep.md'),
				])
				// @ts-ignore
				await plugin[1].generateBundle()

				// Should generate files at root, first-level, and second-level directories
				expect(writeFile).toHaveBeenCalledTimes(4)
				const calls = writeFile.mock.calls.map((call) => call[0] as string)
				expect(calls.some((filepath) => filepath.endsWith(path.join('dist', 'llms.txt')))).toBe(true) // root
				expect(calls.some((filepath) => filepath.endsWith(path.join('guide', 'llms.txt')))).toBe(true)
				expect(calls.some((filepath) => filepath.endsWith(path.join('api', 'llms.txt')))).toBe(true)
				expect(calls.some((filepath) => filepath.endsWith(path.join('api', 'advanced', 'llms.txt')))).toBe(
					true,
				)
			})

			it('should filter content correctly for each directory level', async () => {
				plugin = llmstxt({
					generateLLMsFullTxt: false,
					generateLLMFriendlyDocsForEachPage: false,
					experimental: { depth: 2 },
				})
				// @ts-ignore
				plugin[1].configResolved(mockConfig)
				await Promise.all([
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/root-file.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/guide/getting-started.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/reference.md'),
				])
				// @ts-ignore
				await plugin[1].generateBundle()

				expect(writeFile).toHaveBeenCalledTimes(3)

				// Check that root llms.txt contains all files
				const rootLlmsTxt = writeFile.mock.calls.find(
					(call) => call[0] === path.resolve(process.cwd(), mockConfig.vitepress.outDir, 'llms.txt'),
				)?.[1] as string
				expect(rootLlmsTxt).toContain('root-file')
				expect(rootLlmsTxt).toContain('getting-started')
				expect(rootLlmsTxt).toContain('reference')

				// Check that guide llms.txt only contains guide files
				const guideLlmsTxt = writeFile.mock.calls.find(
					(call) => call[0] === path.resolve(process.cwd(), mockConfig.vitepress.outDir, 'guide', 'llms.txt'),
				)?.[1] as string
				expect(guideLlmsTxt).toContain('getting-started')
				expect(guideLlmsTxt).not.toContain('root-file')
				expect(guideLlmsTxt).not.toContain('reference')

				// Check that api llms.txt only contains api files
				const apiLlmsTxt = writeFile.mock.calls.find(
					(call) => call[0] === path.resolve(process.cwd(), mockConfig.vitepress.outDir, 'api', 'llms.txt'),
				)?.[1] as string
				expect(apiLlmsTxt).toContain('reference')
				expect(apiLlmsTxt).not.toContain('root-file')
				expect(apiLlmsTxt).not.toContain('getting-started')
			})

			it('should generate both llms.txt and llms-full.txt at each depth level', async () => {
				plugin = llmstxt({
					generateLLMFriendlyDocsForEachPage: false,
					experimental: { depth: 2 },
				})
				// @ts-ignore
				plugin[1].configResolved(mockConfig)
				await Promise.all([
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/root-file.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/guide/getting-started.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/reference.md'),
				])
				// @ts-ignore
				await plugin[1].generateBundle()

				// Should generate 6 files: 3 llms.txt + 3 llms-full.txt (root, guide, api)
				expect(writeFile).toHaveBeenCalledTimes(6)
				const calls = writeFile.mock.calls.map((call) => call[0] as string)

				// Check llms.txt files
				expect(calls.some((filepath) => filepath.endsWith(path.join('dist', 'llms.txt')))).toBe(true) // root
				expect(calls.some((filepath) => filepath.endsWith(path.join('guide', 'llms.txt')))).toBe(true)
				expect(calls.some((filepath) => filepath.endsWith(path.join('api', 'llms.txt')))).toBe(true)

				// Check llms-full.txt files
				expect(calls.some((filepath) => filepath.endsWith(path.join('dist', 'llms-full.txt')))).toBe(true) // root
				expect(calls.some((filepath) => filepath.endsWith(path.join('guide', 'llms-full.txt')))).toBe(true)
				expect(calls.some((filepath) => filepath.endsWith(path.join('api', 'llms-full.txt')))).toBe(true)
			})

			it('should filter llms-full.txt content correctly for each directory', async () => {
				plugin = llmstxt({
					generateLLMsTxt: false,
					generateLLMFriendlyDocsForEachPage: false,
					experimental: { depth: 2 },
				})
				// @ts-ignore
				plugin[1].configResolved(mockConfig)
				await Promise.all([
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/root-file.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/guide/getting-started.md'),
					// @ts-ignore
					plugin[0].transform(fakeMarkdownDocument, 'docs/api/reference.md'),
				])
				// @ts-ignore
				await plugin[1].generateBundle()

				expect(writeFile).toHaveBeenCalledTimes(3)

				// Check that root llms-full.txt contains all files
				const rootLlmsFullTxt = writeFile.mock.calls.find(
					(call) => call[0] === path.resolve(process.cwd(), mockConfig.vitepress.outDir, 'llms-full.txt'),
				)?.[1] as string
				expect(rootLlmsFullTxt).toContain('root-file')
				expect(rootLlmsFullTxt).toContain('getting-started')
				expect(rootLlmsFullTxt).toContain('reference')

				// Check that guide llms-full.txt only contains guide files
				const guideLlmsFullTxt = writeFile.mock.calls.find(
					(call) =>
						call[0] === path.resolve(process.cwd(), mockConfig.vitepress.outDir, 'guide', 'llms-full.txt'),
				)?.[1] as string
				expect(guideLlmsFullTxt).toContain('getting-started')
				expect(guideLlmsFullTxt).not.toContain('root-file')
				expect(guideLlmsFullTxt).not.toContain('reference')

				// Check that api llms-full.txt only contains api files
				const apiLlmsFullTxt = writeFile.mock.calls.find(
					(call) =>
						call[0] === path.resolve(process.cwd(), mockConfig.vitepress.outDir, 'api', 'llms-full.txt'),
				)?.[1] as string
				expect(apiLlmsFullTxt).toContain('reference')
				expect(apiLlmsFullTxt).not.toContain('root-file')
				expect(apiLlmsFullTxt).not.toContain('getting-started')
			})
		})
	})
})
