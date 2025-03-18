import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test'
import type { Plugin, ViteDevServer, UserConfig } from 'vite'

// Mock the fs module before it's imported by the module under test
const existsSync = mock(() => true)
const mkdirSync = mock()
const readFileSync = mock(() => '')
const copyFileSync = mock()
const writeFileSync = mock()

mock.module('node:fs', () => ({
	default: {
		existsSync,
		mkdirSync,
		readFileSync,
		copyFileSync,
		writeFileSync,
	},
}))

// Mock the logger to prevent output
mock.module('../src/logger', () => ({
	default: {
		info: mock(),
		success: mock(),
		warn: mock(),
		error: mock(),
	},
}))

// Import the module under test AFTER mocking its dependencies
// @ts-ignore
import llmstxt from '../src/index'
import path from 'node:path'
import type { VitePressConfig } from '../src/types'

describe('llmstxt plugin', () => {
	let plugin: Plugin
	let mockConfig: VitePressConfig
	let mockServer: ViteDevServer

	beforeEach(() => {
		// Reset mock call counts
		mkdirSync.mockReset()
		copyFileSync.mockReset()
		writeFileSync.mockReset()

		// Setup mock config
		mockConfig = {
			vitepress: {
				outDir: 'dist',
			},
			build: {
				ssr: false,
			},
		} as UserConfig & { vitepress: { outDir: string } }

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
			plugin.configureServer(mockServer)
			const spyMiddlewaresUse = spyOn(mockServer.middlewares, 'use')
			expect(spyMiddlewaresUse).toHaveBeenCalled()
		})
	})

	describe('transform', () => {
		it('should collect markdown files', () => {
			// @ts-ignore
			const result = plugin.transform(0, 'test.md')
			expect(result).toBeNull()
		})

		it('should not collect non-markdown files', () => {
			// @ts-ignore
			const result = plugin.transform(0, 'test.ts')
			expect(result).toBeUndefined()
		})
	})

	describe('generateBundle', () => {
		it('should skip processing in SSR build', () => {
			const ssrConfig = { ...mockConfig, build: { ssr: true } }
			// @ts-ignore
			plugin.configResolved(ssrConfig)
			// @ts-ignore
			plugin.generateBundle()
			expect(writeFileSync).not.toHaveBeenCalled()
		})

		it('should create output directory if it does not exist', () => {
			existsSync.mockImplementationOnce(() => false)

			// @ts-ignore
			plugin.configResolved(mockConfig)
			// @ts-ignore
			plugin.generateBundle()

			expect(mkdirSync).toHaveBeenCalledWith('dist', { recursive: true })
		})

		it('should process markdown files and generate output files', () => {
			plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMsTxt: false })
			// @ts-ignore
			plugin.configResolved(mockConfig)
			// @ts-ignore
			plugin.transform(0, 'test.md')
			// @ts-ignore
			plugin.transform(0, 'test/test.md')
			// @ts-ignore
			plugin.generateBundle()

			// Verify that files were written
			expect(copyFileSync).toHaveBeenCalledTimes(2)
			expect(copyFileSync).toHaveBeenNthCalledWith(
				1,
				'test.md',
				path.resolve(mockConfig.vitepress.outDir, 'test.md'),
			)
			expect(copyFileSync).toHaveBeenNthCalledWith(
				2,
				'test/test.md',
				path.resolve(mockConfig.vitepress.outDir, 'test', 'test.md'),
			)
		})

		it('should ignore files specified in ignoreFiles option', () => {
			plugin = llmstxt({
				generateLLMsFullTxt: false,
				generateLLMsTxt: false,
				ignoreFiles: ['test.md'],
			})
			// @ts-ignore
			plugin.configResolved(mockConfig)
			// @ts-ignore
			plugin.transform(0, 'test.md')
			// @ts-ignore
			plugin.transform(0, 'test/test.md')
			// @ts-ignore
			plugin.generateBundle()

			// Verify that only non-ignored files were written
			expect(copyFileSync).toHaveBeenCalledTimes(1)
			expect(copyFileSync).toHaveBeenCalledWith(
				'test/test.md',
				path.resolve(mockConfig.vitepress.outDir, 'test', 'test.md'),
			)
		})
	})
})
