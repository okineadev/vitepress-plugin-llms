import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import matter from 'gray-matter'
import {
	expandTemplate,
	extractTitle,
	generateLink,
	generateMetadata,
	getDirectoriesAtDepths,
	replaceTemplateVariable,
} from '../../src/helpers/utils'
import { sampleDomain } from '../resources'

const fakeIndexMd = matter(`\
---
title: My Awesome Title
---

# Some Heading

Content goes here`)

const fakeIndexMdWithoutTitle = matter(`\
---
description: Some description
author: John Doe
---

# Title From Heading

Content goes here`)

describe('replaceTemplateVariable', () => {
	it('replaces a single template variable', () => {
		const result = replaceTemplateVariable('Hello {name}!', 'name', 'Alice')
		expect(result).toBe('Hello Alice!')
	})

	it('uses fallback value when main value is empty', () => {
		const result = replaceTemplateVariable('Hello {name}!', 'name', '', 'User')
		expect(result).toBe('Hello User!')
	})

	it('removes variable if both value and fallback are empty', () => {
		const result = replaceTemplateVariable('Hello {name}!', 'name', '', '')
		expect(result).toBe('Hello !')
	})

	it('preserves extra new lines before variable', () => {
		const result = replaceTemplateVariable('Hello\n\n{name}!', 'name', 'Alice')
		expect(result).toBe('Hello\n\nAlice!')
	})
})

describe('expandTemplate', () => {
	it('replaces multiple template variables', () => {
		const template = 'Hello {name}, welcome to {place}!'
		const values = { name: 'Alice', place: 'Wonderland' }
		const result = expandTemplate(template, values)
		expect(result).toBe('Hello Alice, welcome to Wonderland!')
	})

	it('does not touch unused template variables', () => {
		const template = 'Hello {name}, welcome to {place}!'
		const values = { name: 'Alice' }
		const result = expandTemplate(template, values)
		expect(result).toBe('Hello Alice, welcome to {place}!')
	})
})

// Updated the test cases to fix argument mismatches for generateTOC, generateMetadata, generateLLMsTxt, and generateLLMsFullTxt

describe('generateMetadata', () => {
	const dummyMatter = matter('')
	it('should generate URL with domain when provided', () => {
		const result = generateMetadata(dummyMatter, {
			domain: sampleDomain,
			filePath: 'docs/guide',
		})

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
	})

	it('should generate URL without domain when domain is undefined', () => {
		const result = generateMetadata(dummyMatter, {
			filePath: 'docs/guide',
		})

		expect(result.url).toBe('/docs/guide.md')
	})

	it('should include description from frontmatter when available', () => {
		const result = generateMetadata(
			{
				...dummyMatter,
				data: {
					description: 'A comprehensive guide',
				},
			},
			{
				domain: sampleDomain,
				filePath: 'docs/guide',
			},
		)

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBe('A comprehensive guide')
	})

	it('should not include description when frontmatter description is empty', () => {
		const result = generateMetadata(dummyMatter, {
			domain: sampleDomain,
			filePath: 'docs/guide',
		})

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBeUndefined()
	})

	it('should not include description when frontmatter has no description', () => {
		const result = generateMetadata(dummyMatter, {
			domain: sampleDomain,
			filePath: 'docs/guide',
		})

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBeUndefined()
	})
})

describe('extractTitle', () => {
	it('extracts title from frontmatter', () => {
		expect(extractTitle(fakeIndexMd)).toBe('My Awesome Title')
	})

	it('extracts title from markdown heading when no frontmatter exists', () => {
		const markdown = matter('# My Markdown Title\nSome content here')
		expect(extractTitle(markdown)).toBe('My Markdown Title')
	})

	it('extracts title from markdown heading when frontmatter exists but has no title', () => {
		expect(extractTitle(fakeIndexMdWithoutTitle)).toBe('Title From Heading')
	})

	it('returns `undefined` when no frontmatter or markdown title exists', () => {
		const markdown = matter('Some content without any headings or frontmatter')
		expect(extractTitle(markdown)).toBeUndefined()
	})
})

describe('generateLink', () => {
	it('generates a link with domain, path, and extension', () => {
		const result = generateLink('docs/guide', sampleDomain, '.md')
		expect(result).toBe(`${sampleDomain}/docs/guide.md`)
	})

	it('generates a link without domain', () => {
		const result = generateLink('docs/guide', undefined, '.md')
		expect(result).toBe('/docs/guide.md')
	})

	it('generates a link without extension when cleanUrls is true', () => {
		const result = generateLink('docs/guide', sampleDomain, '.md', true)
		expect(result).toBe(`${sampleDomain}/docs/guide`)
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
