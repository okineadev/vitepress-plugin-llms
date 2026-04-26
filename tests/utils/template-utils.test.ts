import { describe, expect, it } from 'bun:test'
import matter from 'gray-matter'

import { expandTemplate, generateMetadata, replaceTemplateVariable } from '@/utils/template-utils'

import { sampleDomain } from '../resources'

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
	const sampleMatter = matter('')
	it('should generate URL with domain when provided', () => {
		const result = generateMetadata(sampleMatter, {
			domain: sampleDomain,
			filePath: 'docs/guide',
		})

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
	})

	it('should generate URL without domain when domain is undefined', () => {
		const result = generateMetadata(sampleMatter, {
			filePath: 'docs/guide',
		})

		expect(result.url).toBe('/docs/guide.md')
	})

	it('should include description from frontmatter when available', () => {
		const result = generateMetadata(
			{
				...sampleMatter,
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
		const result = generateMetadata(sampleMatter, {
			domain: sampleDomain,
			filePath: 'docs/guide',
		})

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBeUndefined()
	})

	it('should not include description when frontmatter has no description', () => {
		const result = generateMetadata(sampleMatter, {
			domain: sampleDomain,
			filePath: 'docs/guide',
		})

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBeUndefined()
	})
})
