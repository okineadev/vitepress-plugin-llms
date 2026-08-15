import { describe, expect, it } from 'bun:test'
import MarkdownIt from 'markdown-it'

import { copyOrDownloadAsMarkdownButtons } from '@/markdown/markdown-it-plugins'

describe('copyOrDownloadAsMarkdownButtons', () => {
	const md = new MarkdownIt()

	it('should inject component after H1 with default options', () => {
		md.use(copyOrDownloadAsMarkdownButtons)
		const result = md.render('# Test Heading\n\nSome content')
		expect(result).toContain('<CopyOrDownloadAsMarkdownButtons />')
		expect(result).toContain('<h1>Test Heading</h1>')
	})

	it('should support string parameter for custom component name', () => {
		const mdCustom = new MarkdownIt()
		mdCustom.use(copyOrDownloadAsMarkdownButtons, 'CustomComponent')
		const result = mdCustom.render('# Test\n\nContent')
		expect(result).toContain('<CustomComponent />')
	})

	it('should support object parameter with showDownload: false', () => {
		const mdNoDownload = new MarkdownIt()
		mdNoDownload.use(copyOrDownloadAsMarkdownButtons, { showDownload: false })
		const result = mdNoDownload.render('# Test\n\nContent')
		expect(result).toContain('<CopyOrDownloadAsMarkdownButtons :show-download="false" />')
	})

	it('should support object parameter with custom component name and showDownload: false', () => {
		const mdCustom = new MarkdownIt()
		mdCustom.use(copyOrDownloadAsMarkdownButtons, {
			componentName: 'MyButtons',
			showDownload: false,
		})
		const result = mdCustom.render('# Test\n\nContent')
		expect(result).toContain('<MyButtons :show-download="false" />')
	})

	it('should support object parameter with showDownload: true (default)', () => {
		const mdWithDownload = new MarkdownIt()
		mdWithDownload.use(copyOrDownloadAsMarkdownButtons, { showDownload: true })
		const result = mdWithDownload.render('# Test\n\nContent')
		expect(result).toContain('<CopyOrDownloadAsMarkdownButtons />')
		expect(result).not.toContain(':show-download')
	})

	it('should not inject component if there is no H1', () => {
		const mdNoH1 = new MarkdownIt()
		mdNoH1.use(copyOrDownloadAsMarkdownButtons)
		const result = mdNoH1.render('Just some text\n\nNo heading here')
		expect(result).not.toContain('CopyOrDownloadAsMarkdownButtons')
	})

	it('should only inject after first H1', () => {
		const mdMultipleH1 = new MarkdownIt()
		mdMultipleH1.use(copyOrDownloadAsMarkdownButtons)
		const result = mdMultipleH1.render('# First\n\n## Second\n\n# Third')
		const matches = result.match(/CopyOrDownloadAsMarkdownButtons/g)
		expect(matches).toHaveLength(1)
	})
})
