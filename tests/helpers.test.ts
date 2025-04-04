import { describe, expect, it, mock } from 'bun:test'
import matter from 'gray-matter'
import {
	fakeCustomLlmsTxtTemplate,
	fakeGettingStartedMd,
	fakeIndexMd,
	fakeMarkdownDocument,
	fakeQuickstartMd,
	sampleDomain,
	sampleObjectVitePressSidebar,
	sampleVitePressSidebar,
} from './resources'

const srcDir = 'docs'

const readFile = mock(async (path) =>
	path === `${srcDir}/index.md` ? fakeIndexMd : fakeMarkdownDocument,
)

mock.module('node:fs/promises', () => ({
	default: { readFile },
}))

import {
	generateLLMsFullTxt,
	generateLLMsTxt,
	// @ts-ignore
} from '../src/helpers'

import { generateTOC } from '../src/helpers/toc'
import {
	expandTemplate,
	generateMetadata,
	replaceTemplateVariable,
} from '../src/helpers/utils'

// @ts-ignore
import { defaultLLMsTxtTemplate } from '../src/constants'
import type { PreparedFile, VitePressConfig } from '../src/types'

const fooMdSample = {
	title: 'Title',
	path: `${srcDir}/foo.md`,
	file: matter(''),
}

const preparedFilesSample: PreparedFile[] = [
	{
		title: 'Some cool tool',
		path: `${srcDir}/index.md`,
		file: matter(fakeIndexMd),
	},
	{
		title: 'Getting started',
		path: `${srcDir}/test/getting-started.md`,
		file: matter(fakeGettingStartedMd),
	},
	{
		title: 'Quickstart',
		path: `${srcDir}/test/quickstart.md`,
		file: matter(fakeQuickstartMd),
	},
	{
		title: 'Some other section',
		path: `${srcDir}/test/other.md`,
		file: matter(fakeMarkdownDocument),
	},
]

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

describe('generateTOC', () => {
	it('generates a table of contents', async () => {
		expect(await generateTOC([fooMdSample], srcDir)).toBe(
			'- [Title](/foo.md)\n',
		)
	})

	it('correctly attaches the domain', async () => {
		expect(await generateTOC([fooMdSample], srcDir, sampleDomain)).toBe(
			`- [Title](${sampleDomain}/foo.md)\n`,
		)
	})

	it('correctly generates TOC with link descriptions', async () => {
		expect(await generateTOC(preparedFilesSample.slice(1), srcDir)).toBe(
			'- [Getting started](/test/getting-started.md): Instructions on how to get started with the tool\n- [Quickstart](/test/quickstart.md): Instructions for quick project initialization\n- [Some other section](/test/other.md)\n',
		)
	})

	it('organizes TOC based on sidebar configuration', async () => {
		const files = preparedFilesSample.slice(1)
		const toc = await generateTOC(
			files,
			srcDir,
			undefined,
			sampleVitePressSidebar,
		)

		expect(toc).toMatchSnapshot()
	})

	it('handles object-based sidebar configuration correctly', async () => {
		const files = preparedFilesSample.slice(1)
		const toc = await generateTOC(
			files,
			srcDir,
			undefined,
			sampleObjectVitePressSidebar,
		)

		expect(toc).toMatchSnapshot()
	})
})

describe('generateMetadata', () => {
	const dummyMatter = matter('')
	it('should generate URL with domain when provided', () => {
		const result = generateMetadata(dummyMatter, sampleDomain, 'docs/guide')

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
	})

	it('should generate URL without domain when domain is undefined', () => {
		const result = generateMetadata(dummyMatter, undefined, 'docs/guide')

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
			sampleDomain,
			'docs/guide',
		)

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBe('A comprehensive guide')
	})

	it('should not include description when frontmatter description is empty', () => {
		const result = generateMetadata(dummyMatter, sampleDomain, 'docs/guide')

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBeUndefined()
	})

	it('should not include description when frontmatter has no description', () => {
		const result = generateMetadata(dummyMatter, sampleDomain, 'docs/guide')

		expect(result.url).toBe(`${sampleDomain}/docs/guide.md`)
		expect(result.description).toBeUndefined()
	})
})

describe('generateLLMsTxt', () => {
	it('generates a `llms.txt` file', async () => {
		expect(
			await generateLLMsTxt(
				preparedFilesSample.slice(1),
				`${srcDir}/index.md`,
				srcDir,
				defaultLLMsTxtTemplate,
				{},
				{} as VitePressConfig,
			),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template', async () => {
		expect(
			await generateLLMsTxt(
				preparedFilesSample.slice(1),
				`${srcDir}/index.md`,
				srcDir,
				fakeCustomLlmsTxtTemplate,
				{},
				{} as VitePressConfig,
			),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template variables', async () => {
		expect(
			await generateLLMsTxt(
				preparedFilesSample,
				`${srcDir}/index.md`,
				srcDir,
				defaultLLMsTxtTemplate,
				{ title: 'foo', description: 'bar', toc: 'zoo' },
				{} as VitePressConfig,
			),
		).toMatchSnapshot()
	})

	it('works correctly with a custom template and variables', async () => {
		expect(
			await generateLLMsTxt(
				preparedFilesSample,
				`${srcDir}/index.md`,
				srcDir,
				'# {foo}\n\n**{bar}**\n\n{zoo}',
				{ title: 'foo', description: 'bar', toc: 'zoo' },
				{} as VitePressConfig,
			),
		).toMatchSnapshot()
	})
})

describe('generateLLMsFullTxt', () => {
	it('generates a `llms-full.txt` file', async () => {
		expect(
			await generateLLMsFullTxt(preparedFilesSample.slice(1), srcDir),
		).toMatchSnapshot()
	})

	it('correctly attaches the domain to URLs in context', async () => {
		expect(
			await generateLLMsFullTxt(
				preparedFilesSample.slice(1),
				srcDir,
				sampleDomain,
			),
		).toMatchSnapshot()
	})
})
