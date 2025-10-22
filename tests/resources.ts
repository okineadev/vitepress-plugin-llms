import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import type { PreparedFile } from '@/internal-types'
import fakeGettingStartedMd from './test-assets/getting-started.md'
import fakeIndexMd from './test-assets/index.md'
import fakeMarkdownDocument from './test-assets/markdown-document.md'
import fakeQuickstartMd from './test-assets/quickstart.md'

export const outDir = 'dist'

export const sampleDomain = 'https://example.com'

export const fakeCustomLlmsTxtTemplate = '# Custom title\n\n> Custom description\n\n## TOC\n\n{toc}'

export const sampleVitePressSidebar: DefaultTheme.Sidebar = [
	{
		text: 'Test Section',
		items: [{ text: 'Getting Started', link: '/test/getting-started' }],
	},
	{
		text: 'Quickstart Section',
		items: [{ text: 'Quickstart', link: '/test/quickstart' }],
	},
]

export const sampleObjectVitePressSidebar: DefaultTheme.Sidebar = {
	'/': [
		{
			text: 'Getting Started',
			items: [{ text: 'Introduction', link: '/test/getting-started' }],
		},
	],
	'/api/': [
		{
			text: 'API Reference',
			items: [{ text: 'Quickstart', link: '/test/quickstart' }],
		},
	],
}

export const sampleObjectVitePressSidebarWithBase: DefaultTheme.Sidebar = {
	'/': [
		{
			text: 'Getting Started',
			base: '/test',
			items: [
				{ text: 'Introduction', link: '/getting-started' },
				{
					text: 'Index',
					base: '/',
					link: '/index',
				},
			],
		},
	],
	'/api/': [
		{
			text: 'API Reference',
			base: '/test',
			items: [
				{
					text: 'Other section',
					link: '/other',
				},
			],
		},
	],
	'/tutorials/': [
		{
			text: 'Tutorials',
			items: [
				{
					text: 'Quickstart',
					link: '/test/quickstart',
				},
			],
		},
	],
}

export const sampleObjectVitePressSidebarWithCommonPrefix: DefaultTheme.Sidebar = {
	'/blog': [
		{
			text: 'Blog Started',
			items: [
				{ text: 'Version 1.0', link: '/blog/v1' },
				{ text: 'Version 1.1', link: '/blog/v1.1' },
			],
		},
	],
}

export const sampleObjectVitePressSidebarWithoutSections: DefaultTheme.Sidebar = [
	{ text: 'Getting Started', link: '/test/getting-started' },
	{ text: 'Quickstart', link: '/test/quickstart' },
]

export const fooMdSample: PreparedFile = {
	title: 'Title',
	path: 'foo.md',
	file: matter(''),
}

export const preparedFilesSample: PreparedFile[] = [
	{
		title: 'Some cool tool',
		path: 'index.md',
		file: matter(fakeIndexMd),
	},
	{
		title: 'Getting started',
		path: 'test/getting-started.md',
		file: matter(fakeGettingStartedMd),
	},
	{
		title: 'Quickstart',
		path: 'test/quickstart.md',
		file: matter(fakeQuickstartMd),
	},
	{
		title: 'Some other section',
		path: 'test/other.md',
		file: matter(fakeMarkdownDocument),
	},
]

export const preparedFilesWithCommonPrefixSample: PreparedFile[] = [
	{
		title: 'First version',
		path: 'blog/v1.md',
		file: matter(fakeIndexMd),
	},
	{
		title: 'New features!',
		path: 'blog/v1.1.md',
		file: matter(fakeGettingStartedMd),
	},
]
