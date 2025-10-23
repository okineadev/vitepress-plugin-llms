import { describe, expect, it } from 'bun:test'
import type { DefaultTheme } from 'vitepress'
import { generateTOC, generateTOCLink, isPathMatch, normalizeLinkPath } from '@/generator/toc'
import {
	fooMdSample,
	outDir,
	preparedFilesSample,
	preparedFilesWithCommonPrefixSample,
	sampleDomain,
	sampleObjectVitePressSidebar,
	sampleObjectVitePressSidebarWithBase,
	sampleObjectVitePressSidebarWithCommonPrefix,
	sampleObjectVitePressSidebarWithoutSections,
	sampleVitePressSidebar,
} from '../resources'

describe('generateTOC', () => {
	it('generates a table of contents', async () => {
		expect(await generateTOC([fooMdSample], { outDir })).toBe('- [Title](/foo.md)\n')
	})

	it('correctly attaches the domain', async () => {
		expect(
			await generateTOC([fooMdSample], {
				outDir,
				domain: sampleDomain,
			}),
		).toBe(`- [Title](${sampleDomain}/foo.md)\n`)
	})

	it('correctly generates TOC with link descriptions', async () => {
		expect(await generateTOC(preparedFilesSample.slice(1), { outDir })).toBe(
			'- [Getting started](/test/getting-started.md): Instructions on how to get started with the tool\n- [Quickstart](/test/quickstart.md): Instructions for quick project initialization\n- [Some other section](/test/other.md)\n',
		)
	})

	it('organizes TOC based on sidebar configuration', async () => {
		const files = preparedFilesSample.slice(1)
		const toc = await generateTOC(files, {
			outDir,
			sidebarConfig: sampleVitePressSidebar,
		})

		expect(toc).toMatchSnapshot()
	})

	it('handles object-based sidebar configuration correctly', async () => {
		const files = preparedFilesSample.slice(1)
		const toc = await generateTOC(files, {
			outDir,
			sidebarConfig: sampleObjectVitePressSidebar,
		})

		expect(toc).toMatchSnapshot()
	})

	it('handles object-based sidebar with base options configuration correctly', async () => {
		const files = preparedFilesSample
		const toc = await generateTOC(files, {
			outDir,
			sidebarConfig: sampleObjectVitePressSidebarWithBase,
		})

		expect(toc).toMatchSnapshot()
	})

	it('appends the specified `linksExtension` to the generated links', async () => {
		const toc = await generateTOC(preparedFilesSample.slice(1), {
			outDir,
			linksExtension: '.html',
		})

		expect(toc).toMatchSnapshot()
	})

	it('correctly generates TOC with links that are not in any section', async () => {
		expect(
			await generateTOC(preparedFilesSample.slice(1), {
				outDir,
				sidebarConfig: sampleObjectVitePressSidebarWithoutSections,
			}),
		).toMatchSnapshot()
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

		const toc = await generateTOC(preparedFilesSample.slice(1), {
			outDir,
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

		const toc = await generateTOC(preparedFilesSample.slice(1), {
			outDir,
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

		const toc = await generateTOC(preparedFilesSample.slice(1), {
			outDir,
			sidebarConfig: sidebarWithNonMatchingFiles,
		})

		// The section with non-matching files should not appear
		expect(toc).not.toContain('### Non-matching Section')
		// But the section with matching files should still be there
		expect(toc).toContain('### Test Section')
	})

	it('resolves paths with common prefixes correctly', async () => {
		const toc = await generateTOC(preparedFilesWithCommonPrefixSample, {
			outDir,
			sidebarConfig: sampleObjectVitePressSidebarWithCommonPrefix,
		})

		expect(toc).toMatchSnapshot()
	})

	it('resolves paths with base options', async () => {
		const toc = await generateTOC(preparedFilesWithCommonPrefixSample, {
			outDir,
			base: '/docs',
			sidebarConfig: sampleObjectVitePressSidebarWithCommonPrefix,
		})

		expect(toc).toMatchSnapshot()
	})

	it('resolves paths with base options and base sections', async () => {
		const toc = await generateTOC(preparedFilesSample, {
			outDir,
			base: '/docs',
			sidebarConfig: sampleObjectVitePressSidebarWithBase,
		})

		expect(toc).toMatchSnapshot()
	})
})

describe('generateTOCLink', () => {
	it('generates a TOC link with description', () => {
		const result = generateTOCLink(fooMdSample, sampleDomain, `${outDir}/path`, '.md')
		expect(result).toBe(`- [Title](${sampleDomain}/${outDir}/path.md)\n`)
	})

	it('generates a TOC link without description', () => {
		const result = generateTOCLink(fooMdSample, sampleDomain, `${outDir}/path`, '.md')
		expect(result).toBe(`- [Title](${sampleDomain}/${outDir}/path.md)\n`)
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

describe('generateTOC with directoryFilter', () => {
	it('should include all files when directoryFilter is "." (root)', async () => {
		const result = await generateTOC(preparedFilesSample, {
			outDir,
			directoryFilter: '.',
		})
		expect(result).toMatchSnapshot()
	})

	it('should filter files by directory when directoryFilter is specified', async () => {
		const result = await generateTOC(preparedFilesSample, {
			outDir,
			directoryFilter: 'test',
		})

		expect(result).toMatchSnapshot()
	})

	it('should return empty TOC when no files match directoryFilter', async () => {
		const result = await generateTOC(preparedFilesSample, {
			outDir,
			directoryFilter: 'nonexistent',
		})

		expect(result).toBe('')
	})
})
