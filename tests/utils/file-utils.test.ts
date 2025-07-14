import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { getDirectoriesAtDepths } from '@/utils/file-utils'
import { cleanUrl } from '@/utils/shared'
import { generateLink } from '@/utils/template-utils'
import { sampleDomain } from '../resources'

describe('generateLink', () => {
	it('generates a link with domain, path, and extension', () => {
		const result = generateLink('docs/guide', sampleDomain, '.md')
		expect(result).toBe(`${sampleDomain}/docs/guide.md`)
	})

	it('generates a link without domain', () => {
		const result = generateLink('docs/guide', undefined, '.md')
		expect(result).toBe('/docs/guide.md')
	})

	it('generates a link with base URL', () => {
		const result = generateLink('docs/guide', sampleDomain, '.md', '/awesomeproject')
		expect(result).toBe(`${sampleDomain}/awesomeproject/docs/guide.md`)
	})

	it('generates a link with base URL without domain', () => {
		const result = generateLink('docs/guide', undefined, '.md', '/awesomeproject')
		expect(result).toBe('/awesomeproject/docs/guide.md')
	})

	it('handles base URL without leading slash', () => {
		const result = generateLink('docs/guide', sampleDomain, '.md', 'awesomeproject')
		expect(result).toBe(`${sampleDomain}/awesomeproject/docs/guide.md`)
	})

	it('handles base URL with trailing slash', () => {
		const result = generateLink('docs/guide', sampleDomain, '.md', '/awesomeproject/')
		expect(result).toBe(`${sampleDomain}/awesomeproject/docs/guide.md`)
	})
})

describe('cleanUrl', () => {
	it('removes file extension from pathname', () => {
		expect(cleanUrl('https://example.com/docs/page.md')).toBe('https://example.com/docs/page.md')
		expect(cleanUrl('https://example.com/docs/page.html')).toBe('https://example.com/docs/page')
	})

	it('removes trailing slash', () => {
		expect(cleanUrl('https://example.com/docs/')).toBe('https://example.com/docs')
	})

	it('removes query and hash fragments', () => {
		expect(cleanUrl('https://example.com/docs/page.md?foo=bar')).toBe('https://example.com/docs/page.md')
		expect(cleanUrl('https://example.com/docs/page.md#section')).toBe('https://example.com/docs/page.md')
	})

	it('handles URLs without extension or with dots in directory', () => {
		expect(cleanUrl('https://example.com/docs.v1/page')).toBe('https://example.com/docs.v1/page')
		expect(cleanUrl('https://example.com/docs.v1/page.md')).toBe('https://example.com/docs.v1/page.md')
		expect(cleanUrl('https://example.com/docs.v1.2/')).toBe('https://example.com/docs.v1.2')
	})
})

describe('getDirectoriesAtDepths', () => {
	const baseDir = '/docs'

	it('should return only root directory when depth is 1', () => {
		const files = [
			'/docs/index.md',
			'/docs/guide/getting-started.md',
			'/docs/api/reference.md',
			'/docs/api/advanced/config.md',
		]

		const result = getDirectoriesAtDepths(files, baseDir, 1)

		expect(result).toEqual([
			{
				path: baseDir,
				depth: 1,
				relativePath: '.',
			},
		])
	})

	it('should return root and first-level directories when depth is 2', () => {
		const files = [
			'/docs/index.md',
			'/docs/guide/getting-started.md',
			'/docs/api/reference.md',
			'/docs/api/advanced/config.md',
		]

		const result = getDirectoriesAtDepths(files, baseDir, 2)

		expect(result).toEqual([
			{
				path: baseDir,
				depth: 1,
				relativePath: '.',
			},
			{
				path: path.resolve(baseDir, 'api'),
				depth: 2,
				relativePath: 'api',
			},
			{
				path: path.resolve(baseDir, 'guide'),
				depth: 2,
				relativePath: 'guide',
			},
		])
	})

	it('should return directories up to specified depth', () => {
		const files = [
			'/docs/index.md',
			'/docs/guide/getting-started.md',
			'/docs/api/reference.md',
			'/docs/api/advanced/config.md',
			'/docs/api/advanced/nested/deep.md',
		]

		const result = getDirectoriesAtDepths(files, baseDir, 3)

		expect(result).toEqual([
			{
				path: baseDir,
				depth: 1,
				relativePath: '.',
			},
			{
				path: path.resolve(baseDir, 'api'),
				depth: 2,
				relativePath: 'api',
			},
			{
				path: path.resolve(baseDir, 'guide'),
				depth: 2,
				relativePath: 'guide',
			},
			{
				path: path.resolve(baseDir, 'api', 'advanced'),
				depth: 3,
				relativePath: path.join('api', 'advanced'),
			},
		])
	})

	it('should handle files without subdirectories', () => {
		const files = ['/docs/index.md', '/docs/readme.md']

		const result = getDirectoriesAtDepths(files, baseDir, 2)

		expect(result).toEqual([
			{
				path: baseDir,
				depth: 1,
				relativePath: '.',
			},
		])
	})

	it('should deduplicate directories correctly', () => {
		const files = ['/docs/guide/file1.md', '/docs/guide/file2.md', '/docs/guide/file3.md']

		const result = getDirectoriesAtDepths(files, baseDir, 2)

		expect(result).toEqual([
			{
				path: baseDir,
				depth: 1,
				relativePath: '.',
			},
			{
				path: path.resolve(baseDir, 'guide'),
				depth: 2,
				relativePath: 'guide',
			},
		])
	})

	it('should sort results by depth then by path', () => {
		const files = ['/docs/zebra/file.md', '/docs/alpha/file.md', '/docs/beta/nested/file.md']

		const result = getDirectoriesAtDepths(files, baseDir, 3)

		expect(result).toEqual([
			{
				path: baseDir,
				depth: 1,
				relativePath: '.',
			},
			{
				path: path.resolve(baseDir, 'alpha'),
				depth: 2,
				relativePath: 'alpha',
			},
			{
				path: path.resolve(baseDir, 'beta'),
				depth: 2,
				relativePath: 'beta',
			},
			{
				path: path.resolve(baseDir, 'zebra'),
				depth: 2,
				relativePath: 'zebra',
			},
			{
				path: path.resolve(baseDir, 'beta', 'nested'),
				depth: 3,
				relativePath: path.join('beta', 'nested'),
			},
		])
	})
})
