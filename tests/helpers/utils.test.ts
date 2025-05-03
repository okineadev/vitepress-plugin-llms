import { describe, expect, it } from 'bun:test'
import matter from 'gray-matter'
import {
	expandTemplate,
	extractTitle,
	generateLink,
	generateMetadata,
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
	it('should generate URL with domain when provided', async () => {
		const result = await generateMetadata(dummyMatter, {
			domain: sampleDomain,
			filePath: 'docs/guide',
		})

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
	})

	it('should generate URL without domain when domain is undefined', async () => {
		const result = await generateMetadata(dummyMatter, {
			filePath: 'docs/guide',
		})

		expect(result.url).toBe('/docs/guide.md')
	})

	it('should include description from frontmatter when available', async () => {
		const result = await generateMetadata(
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

	it('should not include description when frontmatter description is empty', async () => {
		const result = await generateMetadata(dummyMatter, {
			domain: sampleDomain,
			filePath: 'docs/guide',
		})

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBeUndefined()
	})

	it('should not include description when frontmatter has no description', async () => {
		const result = await generateMetadata(dummyMatter, {
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
