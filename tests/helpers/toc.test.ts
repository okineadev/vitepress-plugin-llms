import { describe, expect, it } from 'bun:test'
import type { DefaultTheme } from 'vitepress'
import {
	generateTOC,
	generateTOCLink,
	isPathMatch,
	normalizeLinkPath,
} from '../../src/helpers/toc'
import {
	fooMdSample,
	preparedFilesSample,
	sampleDomain,
	sampleObjectVitePressSidebar,
	sampleVitePressSidebar,
	srcDir,
} from '../resources'

describe('generateTOC', () => {
	it('generates a table of contents', async () => {
		expect(await generateTOC([fooMdSample({ srcDir })], { srcDir })).toBe(
			'- [Title](/foo.md)\n',
		)
	})

	it('correctly attaches the domain', async () => {
		expect(
			await generateTOC([fooMdSample({ srcDir })], {
				srcDir,
				domain: sampleDomain,
			}),
		).toBe(`- [Title](${sampleDomain}/foo.md)\n`)
	})

	it('correctly generates TOC with link descriptions', async () => {
		expect(
			await generateTOC(preparedFilesSample({ srcDir }).slice(1), { srcDir }),
		).toBe(
			'- [Getting started](/test/getting-started.md): Instructions on how to get started with the tool\n- [Quickstart](/test/quickstart.md): Instructions for quick project initialization\n- [Some other section](/test/other.md)\n',
		)
	})

	it('organizes TOC based on sidebar configuration', async () => {
		const files = preparedFilesSample({ srcDir }).slice(1)
		const toc = await generateTOC(files, {
			srcDir,
			sidebarConfig: sampleVitePressSidebar,
		})

		expect(toc).toMatchSnapshot()
	})

	it('handles object-based sidebar configuration correctly', async () => {
		const files = preparedFilesSample({ srcDir }).slice(1)
		const toc = await generateTOC(files, {
			srcDir,
			sidebarConfig: sampleObjectVitePressSidebar,
		})

		expect(toc).toMatchSnapshot()
	})

	it('appends the specified `linksExtension` to the generated links', async () => {
		const toc = await generateTOC(preparedFilesSample({ srcDir }).slice(1), {
			srcDir,
			linksExtension: '.html',
		})

		expect(toc).toMatchSnapshot()
	})

	it('does not generate empty sections', async () => {
		// Create a sidebar with an empty section
		const sidebarWithEmptySection: DefaultTheme.Sidebar = [
			{
				text: 'Empty Section',
				items: [], // No items in this section
			},
			{
				text: 'Test Section',
				items: [{ text: 'Getting Started', link: '/test/getting-started' }],
			},
		]

		const toc = await generateTOC(preparedFilesSample({ srcDir }).slice(1), {
			srcDir,
			sidebarConfig: sidebarWithEmptySection,
		})

		// The empty section should not appear in the TOC
		expect(toc).not.toContain('### Empty Section')
		// But the non-empty section should still be there
		expect(toc).toContain('### Test Section')
	})

	it('does not generate nested empty sections', async () => {
		// Create a sidebar with nested empty sections
		const sidebarWithNestedEmptySections: DefaultTheme.Sidebar = [
			{
				text: 'API',
				items: [
					{
						text: 'Components',
						items: [], // Empty nested section
					},
					{
						text: 'Interfaces',
						items: [], // Another empty nested section
					},
				],
			},
			{
				text: 'Test Section',
				items: [{ text: 'Getting Started', link: '/test/getting-started' }],
			},
		]

		const toc = await generateTOC(preparedFilesSample({ srcDir }).slice(1), {
			srcDir,
			sidebarConfig: sidebarWithNestedEmptySections,
		})

		// The empty parent section should not appear
		expect(toc).not.toContain('### API')
		// Nested empty sections should not appear
		expect(toc).not.toContain('#### Components')
		expect(toc).not.toContain('#### Interfaces')
		// But the non-empty section should still be there
		expect(toc).toContain('### Test Section')
	})

	it('does not generate sections with non-matching files', async () => {
		// Create a sidebar with links to files that don't exist in preparedFiles
		const sidebarWithNonMatchingFiles: DefaultTheme.Sidebar = [
			{
				text: 'Non-matching Section',
				items: [
					{ text: 'Non-existent', link: '/test/non-existent' },
					{ text: 'Another Missing', link: '/test/missing' },
				],
			},
			{
				text: 'Test Section',
				items: [{ text: 'Getting Started', link: '/test/getting-started' }],
			},
		]

		const toc = await generateTOC(preparedFilesSample({ srcDir }).slice(1), {
			srcDir,
			sidebarConfig: sidebarWithNonMatchingFiles,
		})

		// The section with non-matching files should not appear
		expect(toc).not.toContain('### Non-matching Section')
		// But the section with matching files should still be there
		expect(toc).toContain('### Test Section')
	})
})

describe('generateTOCLink', () => {
	it('generates a TOC link with description', () => {
		const result = generateTOCLink(
			fooMdSample({ srcDir }),
			sampleDomain,
			`${srcDir}/path`,
			'.md',
		)
		expect(result).toBe(`- [Title](${sampleDomain}/${srcDir}/path.md)\n`)
	})

	it('generates a TOC link without description', () => {
		const result = generateTOCLink(
			fooMdSample({ srcDir }),
			sampleDomain,
			`${srcDir}/path`,
			'.md',
		)
		expect(result).toBe(`- [Title](${sampleDomain}/${srcDir}/path.md)\n`)
	})
})

describe('normalizeLinkPath', () => {
	it('normalizes a path with index.md', () => {
		const result = normalizeLinkPath('docs/index.md')
		expect(result).toBe('docs')
	})

	it('normalizes a regular path', () => {
		const result = normalizeLinkPath('docs/guide.md')
		expect(result).toBe('docs/guide')
	})
})

describe('isPathMatch', () => {
	it('matches identical paths', () => {
		const result = isPathMatch('docs/guide.md', 'docs/guide')
		expect(result).toBe(true)
	})

	it('matches paths with .md extension', () => {
		const result = isPathMatch('docs/guide.md', 'docs/guide')
		expect(result).toBe(true)
	})

	it('does not match different paths', () => {
		const result = isPathMatch('docs/guide.md', 'docs/tutorial')
		expect(result).toBe(false)
	})
})
