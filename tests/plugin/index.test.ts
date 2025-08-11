// spell-checker:words awesomeproject myproject otherdocs

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import type { ViteDevServer } from 'vite'
import type { Plugin } from 'vitepress'
import mockedFs from '../mocks/fs'
import mockedLogger from '../mocks/utils/logger'

import fakeMarkdownDocument from '../test-assets/markdown-document.md' with { type: 'text' }

const { access, mkdir, writeFile, readFile } = mockedFs.default

mock.module('node:fs/promises', () => mockedFs)

// Mock the logger to prevent logs in tests
mock.module('@/utils/logger', () => mockedLogger)

import path from 'node:path'
import type { VitePressConfig } from '@/internal-types'
// Import the module under test AFTER mocking its dependencies
// @ts-ignore
import { llmstxt } from '@/plugin/plugin'

describe('llmstxt plugin', () => {
	let plugin: [Plugin, Plugin]
	let mockConfig: VitePressConfig
	let mockServer: ViteDevServer

	beforeEach(() => {
		// Reset mock call counts
		access.mockReset()
		mkdir.mockReset()
		writeFile.mockReset()
		readFile.mockReturnValue(Promise.resolve(fakeMarkdownDocument))

		// Setup mock config
		mockConfig = {
			vitepress: {
				outDir: path.resolve('dist'),
				srcDir: path.resolve('docs'),
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

	afterEach(() => readFile.mockReset())

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

		// Add these tests to the existing describe('transform', () => { ... }) block

		describe('LLM hint injection', () => {
			it('should inject LLM hint for main page when generateLLMsTxt is enabled', async () => {
				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMsTxt: true,
					generateLLMsFullTxt: false,
					generateLLMFriendlyDocsForEachPage: false,
				})

				// @ts-ignore
				plugin[1].configResolved(mockConfig)

				// @ts-ignore
				const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/index.md')

				expect(result).not.toBeNull()
				expect(result.code).toMatchSnapshot()
			})

			it('should inject LLM hint for main page when generateLLMsFullTxt is enabled', async () => {
				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMsTxt: false,
					generateLLMsFullTxt: true,
					generateLLMFriendlyDocsForEachPage: false,
				})

				// @ts-ignore
				plugin[1].configResolved(mockConfig)

				// @ts-ignore
				const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/index.md')

				expect(result).not.toBeNull()
				expect(result.code).toContain('Are you an LLM? View /llms-full.txt for full documentation bundle')
			})

			it('should inject LLM hint for main page when both generateLLMsTxt and generateLLMsFullTxt are enabled', async () => {
				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMsTxt: true,
					generateLLMsFullTxt: true,
					generateLLMFriendlyDocsForEachPage: false,
				})

				// @ts-ignore
				plugin[1].configResolved(mockConfig)

				// @ts-ignore
				const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/index.md')

				expect(result).not.toBeNull()
				expect(result.code).toContain(
					'Are you an LLM? View /llms.txt for optimized Markdown documentation, or /llms-full.txt for full documentation bundle',
				)
			})

			it('should inject LLM hint for regular page when generateLLMFriendlyDocsForEachPage is enabled', async () => {
				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMsTxt: false,
					generateLLMsFullTxt: false,
					generateLLMFriendlyDocsForEachPage: true,
				})

				// @ts-ignore
				plugin[1].configResolved(mockConfig)

				// @ts-ignore
				const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/test.md')

				expect(result).not.toBeNull()
				expect(result.code).toContain(
					'Are you an LLM? You can read better optimized documentation at /test.md for this page in Markdown format',
				)
			})

			it('should respect base path in LLM hints', async () => {
				const configWithBase = {
					...mockConfig,
					base: '/myproject/',
				}

				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMsTxt: true,
					generateLLMsFullTxt: false,
					generateLLMFriendlyDocsForEachPage: true,
				})

				// @ts-ignore
				plugin[1].configResolved(configWithBase)

				// Test main page
				// @ts-ignore
				const mainResult = await plugin[0].transform(fakeMarkdownDocument, 'docs/index.md')
				expect(mainResult.code).toContain(
					'Are you an LLM? View /myproject/llms.txt for optimized Markdown documentation',
				)

				// Test regular page
				// @ts-ignore
				const pageResult = await plugin[0].transform(fakeMarkdownDocument, 'docs/test.md')
				expect(pageResult.code).toContain(
					'Are you an LLM? You can read better optimized documentation at /myproject/test.md for this page in Markdown format',
				)
			})

			it('should not inject LLM hint when injectLLMHint is disabled', async () => {
				const plugin = llmstxt({
					injectLLMHint: false,
					generateLLMsTxt: true,
					generateLLMsFullTxt: true,
					generateLLMFriendlyDocsForEachPage: true,
				})

				// @ts-ignore
				plugin[1].configResolved(mockConfig)

				// @ts-ignore
				const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/index.md')

				// Should return null since no content modification occurred
				expect(result).toBeNull()
			})

			it('should not inject LLM hint when no generation options are enabled', async () => {
				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMsTxt: false,
					generateLLMsFullTxt: false,
					generateLLMFriendlyDocsForEachPage: false,
				})

				// @ts-ignore
				plugin[1].configResolved(mockConfig)

				// @ts-ignore
				const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/index.md')

				// Should return null since no LLM hint should be generated
				expect(result).toBeNull()
			})

			it('should handle index.md correctly in LLM hints', async () => {
				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMFriendlyDocsForEachPage: true,
				})

				// @ts-ignore
				plugin[1].configResolved(mockConfig)

				// @ts-ignore
				const result = await plugin[0].transform(fakeMarkdownDocument, 'docs/guide/index.md')

				expect(result.code).toContain(
					'Are you an LLM? You can read better optimized documentation at /guide.md for this page in Markdown format',
				)
			})

			it('should handle rewrites correctly in LLM hints', async () => {
				const configWithRewrites = {
					...mockConfig,
					vitepress: {
						...mockConfig.vitepress,
						userConfig: {
							rewrites: {
								'docs/guide/src/index.md': 'guide/index.md',
								'docs/guide/src/foo.md': 'guide/foo.md',
							},
						},
					},
				}

				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMFriendlyDocsForEachPage: true,
				})

				// @ts-ignore
				plugin[1].configResolved(configWithRewrites)

				// @ts-ignore
				const result1 = await plugin[0].transform(fakeMarkdownDocument, 'docs/guide/src/index.md')
				expect(result1.code).toContain(
					'Are you an LLM? You can read better optimized documentation at /guide.md for this page in Markdown format',
				)

				// @ts-ignore
				const result2 = await plugin[0].transform(fakeMarkdownDocument, 'docs/guide/src/foo.md')
				expect(result2.code).toContain(
					'Are you an LLM? You can read better optimized documentation at /guide/foo.md for this page in Markdown format',
				)
			})

			it('should preserve frontmatter when injecting LLM hint', async () => {
				const contentWithFrontmatter = `---
title: Test Page
description: A test page
---

# Test Content

This is a test page.`

				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMFriendlyDocsForEachPage: true,
				})

				// @ts-ignore
				plugin[1].configResolved(mockConfig)

				// @ts-ignore
				const result = await plugin[0].transform(contentWithFrontmatter, 'docs/test.md')

				expect(result.code).toContain('---')
				expect(result.code).toContain('title: Test Page')
				expect(result.code).toContain('description: A test page')
				expect(result.code).toContain('Are you an LLM?')
				expect(result.code).toContain('# Test Content')
			})

			it('should handle root base path correctly', async () => {
				const configWithRootBase = {
					...mockConfig,
					base: '/',
				}

				const plugin = llmstxt({
					injectLLMHint: true,
					generateLLMsTxt: true,
					generateLLMFriendlyDocsForEachPage: true,
				})

				// @ts-ignore
				plugin[1].configResolved(configWithRootBase)

				// Test main page
				// @ts-ignore
				const mainResult = await plugin[0].transform(fakeMarkdownDocument, 'docs/index.md')
				expect(mainResult.code).toContain(
					'Are you an LLM? View /llms.txt for optimized Markdown documentation',
				)

				// Test regular page
				// @ts-ignore
				const pageResult = await plugin[0].transform(fakeMarkdownDocument, 'docs/test.md')
				expect(pageResult.code).toContain(
					'Are you an LLM? You can read better optimized documentation at /test.md for this page in Markdown format',
				)
			})
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

			expect(mkdir).toHaveBeenCalledWith(path.resolve('dist'), { recursive: true })
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

		it('should respect vitepress base option when generating output paths', async () => {
			const configWithBase = {
				...mockConfig,
				base: 'awesomeproject',
				vitepress: {
					...mockConfig.vitepress,
				},
			}

			plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMsTxt: false })
			// @ts-ignore
			plugin[1].configResolved(configWithBase)
			await Promise.all([
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/test.md'),
				// @ts-ignore
				plugin[0].transform(fakeMarkdownDocument, 'docs/guide/index.md'),
			])
			// @ts-ignore
			await plugin[1].generateBundle()

			// Should generate files with correct url frontmatter including base
			expect(writeFile).toHaveBeenCalledTimes(2)
			expect(writeFile).nthCalledWith(
				1,
				path.resolve(configWithBase.vitepress.outDir, 'test.md'),
				'---\nurl: /awesomeproject/test.md\n---\n# Some cool stuff\n',
			)
			expect(writeFile).nthCalledWith(
				2,
				path.resolve(configWithBase.vitepress.outDir, 'guide.md'),
				'---\nurl: /awesomeproject/guide.md\n---\n# Some cool stuff\n',
			)
		})

		describe('rewrites handling', () => {
			it('should apply simple rewrites to file paths', async () => {
				const configWithRewrites = {
					...mockConfig,
					vitepress: {
						...mockConfig.vitepress,
						userConfig: {
							rewrites: {
								'docs/guide/index.md': 'guide.md',
								'docs/api/reference.md': 'api.md',
							},
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

				expect(result).toContain('/guide.md')
				expect(result).not.toContain('/guide/index.md')
			})

			it('can use `index.md` which is specified in `rewrites` rules', async () => {
				const configWithRewrites = {
					...mockConfig,
					vitepress: {
						...mockConfig.vitepress,
						srcDir: path.resolve(mockConfig.vitepress.srcDir, '..'),
						userConfig: {
							rewrites: {
								'otherdocs/index.md': 'index.md',
							},
						},
					},
				}

				plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMFriendlyDocsForEachPage: false })
				// @ts-ignore
				plugin[1].configResolved(configWithRewrites)

				// @ts-ignore
				await plugin[0].transform(fakeMarkdownDocument, 'docs/page.md')
				// @ts-ignore
				await plugin[0].transform(fakeMarkdownDocument, 'otherdocs/page.md')
				// @ts-ignore
				await plugin[1].generateBundle()

				expect(readFile).toHaveBeenCalledTimes(3)

				expect((readFile.mock.calls as unknown as string[][])[2][0]).toBe(
					path.resolve('otherdocs', 'index.md'),
				)
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
