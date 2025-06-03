import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import type { ViteDevServer } from 'vite'
import type { Plugin } from 'vitepress'
import { mockedFs } from './mocks/fs'
import { fakeMarkdownDocument } from './resources'

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
	})
})
