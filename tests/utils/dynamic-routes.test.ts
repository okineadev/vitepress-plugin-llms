import { beforeEach, describe, expect, it, mock } from 'bun:test'
import dedent from 'dedent'
import matter from 'gray-matter'

// Mock node:fs/promises before importing
const mockReadFile = mock()

mock.module('node:fs/promises', () => ({
	default: {
		readFile: mockReadFile,
	},
	readFile: mockReadFile,
}))

import {
	processDynamicRoute,
	type ResolvedDynamicRoute,
	resolveDynamicRouteTitle,
} from '@/utils/dynamic-routes'

describe('resolveDynamicRouteTitle', () => {
	it('replaces $params.key references in title', () => {
		const processedMarkdown = matter('# {{ $params.pkg }}')
		const params = { pkg: 'vitepress' }

		const title = resolveDynamicRouteTitle(processedMarkdown, params)

		expect(title).toBe('vitepress')
	})

	it('replaces multiple param references', () => {
		const processedMarkdown = matter('# {{ $params.pkg }} v{{ $params.version }}')
		const params = { pkg: 'vitepress', version: '1.0.0' }

		const title = resolveDynamicRouteTitle(processedMarkdown, params)

		expect(title).toBe('vitepress v1.0.0')
	})

	it('handles spaces in template syntax', () => {
		const processedMarkdown = matter('# {{  $params.pkg  }}')
		const params = { pkg: 'vitepress' }

		const title = resolveDynamicRouteTitle(processedMarkdown, params)

		expect(title).toBe('vitepress')
	})

	it('replaces simple $params.key references without braces', () => {
		const processedMarkdown = matter('# $params.pkg')
		const params = { pkg: 'vitepress' }

		const title = resolveDynamicRouteTitle(processedMarkdown, params)

		expect(title).toBe('vitepress')
	})

	it('returns untitled when no title found', () => {
		const processedMarkdown = matter('')
		const params = {}

		const title = resolveDynamicRouteTitle(processedMarkdown, params)

		expect(title).toBe('Untitled')
	})

	it('returns original placeholder when param not found', () => {
		const processedMarkdown = matter('# {{ $params.missing }}')
		const params = { pkg: 'vitepress' }

		const title = resolveDynamicRouteTitle(processedMarkdown, params)

		expect(title).toBe('{{ $params.missing }}')
	})

	it('uses title from frontmatter with param replacement', () => {
		const processedMarkdown = matter(dedent`
			---
			title: "{{ $params.pkg }} Documentation"
			---

			# Content
		`)
		const params = { pkg: 'vitepress' }

		const title = resolveDynamicRouteTitle(processedMarkdown, params)

		expect(title).toBe('vitepress Documentation')
	})
})

describe('processDynamicRoute', () => {
	const mockWorkDir = '/mock/docs'

	beforeEach(() => {
		// Reset mocks before each test
		mockReadFile.mockReset()
	})

	it('processes a basic dynamic route with params', async () => {
		// Mock file system
		mockReadFile.mockResolvedValueOnce('# {{ $params.pkg }}\n\nDocumentation for {{ $params.pkg }}')

		const route: ResolvedDynamicRoute = {
			route: 'packages/[pkg].md',
			path: 'packages/vitepress.md',
			fullPath: `${mockWorkDir}/packages/vitepress.md`,
			loaderPath: `${mockWorkDir}/packages/[pkg].paths.js`,
			params: { pkg: 'vitepress' },
		}

		const result = await processDynamicRoute(route, {
			workDir: mockWorkDir,
			stripHTML: true,
		})

		expect(result.path).toBe('packages/vitepress.md')
		expect(result.title).toBe('vitepress')
		// Content keeps Vue template syntax - it's not replaced in markdown content
		expect(result.file.content).toContain('{{ $params.pkg }}')
	})

	it('injects content from CMS when provided', async () => {
		mockReadFile.mockResolvedValueOnce('# {{ $params.title }}\n\n<!-- @content -->')

		const route: ResolvedDynamicRoute = {
			route: 'blog/[id].md',
			path: 'blog/post-1.md',
			fullPath: `${mockWorkDir}/blog/post-1.md`,
			loaderPath: `${mockWorkDir}/blog/[id].paths.js`,
			params: { id: 'post-1', title: 'My Blog Post' },
			content: '## Custom Content\n\nThis is from CMS',
		}

		const result = await processDynamicRoute(route, {
			workDir: mockWorkDir,
			stripHTML: true,
		})

		expect(result.title).toBe('My Blog Post')
		expect(result.file.content).toContain('## Custom Content')
		expect(result.file.content).toContain('This is from CMS')
		expect(result.file.content).not.toContain('<!-- @content -->')
	})

	it('handles index.md in subdirectory', async () => {
		mockReadFile.mockResolvedValueOnce('# {{ $params.pkg }}')

		const route: ResolvedDynamicRoute = {
			route: 'packages/[pkg]/index.md',
			path: 'packages/vitepress/index.md',
			fullPath: `${mockWorkDir}/packages/vitepress/index.md`,
			loaderPath: `${mockWorkDir}/packages/[pkg]/index.paths.js`,
			params: { pkg: 'vitepress' },
		}

		const result = await processDynamicRoute(route, {
			workDir: mockWorkDir,
			stripHTML: true,
		})

		// index.md in subdirectories should be converted to directory.md
		expect(result.path).toBe('packages/vitepress.md')
		expect(result.title).toBe('vitepress')
	})

	it('handles multiple params in route', async () => {
		mockReadFile.mockResolvedValueOnce('# {{ $params.pkg }} v{{ $params.version }}')

		const route: ResolvedDynamicRoute = {
			route: 'packages/[pkg]-[version].md',
			path: 'packages/vitepress-1.0.0.md',
			fullPath: `${mockWorkDir}/packages/vitepress-1.0.0.md`,
			loaderPath: `${mockWorkDir}/packages/[pkg]-[version].paths.js`,
			params: { pkg: 'vitepress', version: '1.0.0' },
		}

		const result = await processDynamicRoute(route, {
			workDir: mockWorkDir,
			stripHTML: true,
		})

		expect(result.path).toBe('packages/vitepress-1.0.0.md')
		expect(result.title).toBe('vitepress v1.0.0')
	})

	it('strips HTML when stripHTML option is enabled', async () => {
		mockReadFile.mockResolvedValueOnce(dedent`
			# Test

			<div>HTML content</div>

			Regular content
		`)

		const route: ResolvedDynamicRoute = {
			route: 'test/[id].md',
			path: 'test/1.md',
			fullPath: `${mockWorkDir}/test/1.md`,
			loaderPath: `${mockWorkDir}/test/[id].paths.js`,
			params: { id: '1' },
		}

		const result = await processDynamicRoute(route, {
			workDir: mockWorkDir,
			stripHTML: true,
		})

		expect(result.file.content).not.toContain('<div>')
		expect(result.file.content).not.toContain('</div>')
		expect(result.file.content).toContain('Regular content')
	})

	it('preserves HTML when stripHTML option is disabled', async () => {
		mockReadFile.mockResolvedValueOnce(dedent`
			# Test

			<div>HTML content</div>

			Regular content
		`)

		const route: ResolvedDynamicRoute = {
			route: 'test/[id].md',
			path: 'test/1.md',
			fullPath: `${mockWorkDir}/test/1.md`,
			loaderPath: `${mockWorkDir}/test/[id].paths.js`,
			params: { id: '1' },
		}

		const result = await processDynamicRoute(route, {
			workDir: mockWorkDir,
			stripHTML: false,
		})

		expect(result.file.content).toContain('<div>HTML content</div>')
		expect(result.file.content).toContain('Regular content')
	})

	it('processes llm-only and llm-exclude tags', async () => {
		mockReadFile.mockResolvedValueOnce(dedent`
			# Test

			<llm-only>
			This is for LLMs only
			</llm-only>

			<llm-exclude>
			This is for humans only
			</llm-exclude>

			Regular content
		`)

		const route: ResolvedDynamicRoute = {
			route: 'test/[id].md',
			path: 'test/1.md',
			fullPath: `${mockWorkDir}/test/1.md`,
			loaderPath: `${mockWorkDir}/test/[id].paths.js`,
			params: { id: '1' },
		}

		const result = await processDynamicRoute(route, {
			workDir: mockWorkDir,
			stripHTML: true,
		})

		// The remark-please plugin processes these tags:
		// - llm-only: content is unwrapped (tags removed, content kept)
		// - llm-exclude: content is removed entirely (including tags)

		// Note: The remarkPlease plugin processes these tags during markdown parsing
		// In test output, we can see the tags and content are being processed
		// Let's verify the processing happened correctly
		const content = result.file.content

		// llm-exclude content should be completely removed
		expect(content).not.toContain('This is for humans only')
		expect(content).not.toContain('<llm-exclude>')

		// Regular content must remain
		expect(content).toContain('Regular content')

		// The llm-only content should be present but may be formatted differently by remark
		// Check that the tags are gone at minimum
		expect(content).not.toContain('<llm-only>')
	})

	it('escapes dollar signs correctly in CMS content injection', async () => {
		mockReadFile.mockResolvedValueOnce('# Title\n\n<!-- @content -->')

		const route: ResolvedDynamicRoute = {
			route: 'blog/[id].md',
			path: 'blog/post-1.md',
			fullPath: `${mockWorkDir}/blog/post-1.md`,
			loaderPath: `${mockWorkDir}/blog/[id].paths.js`,
			params: { id: 'post-1' },
			content: 'Price: $100 and $200',
		}

		const result = await processDynamicRoute(route, {
			workDir: mockWorkDir,
			stripHTML: true,
		})

		// Dollar signs should be preserved correctly
		expect(result.file.content).toContain('Price: $100 and $200')
	})
})
