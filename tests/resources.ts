import type { DefaultTheme } from 'vitepress'

import matter from 'gray-matter'

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
		items: [{ link: '/test/getting-started', text: 'Getting Started' }],
		text: 'Test Section',
	},
	{
		items: [{ link: '/test/quickstart', text: 'Quickstart' }],
		text: 'Quickstart Section',
	},
]

export const sampleObjectVitePressSidebar: DefaultTheme.Sidebar = {
	'/': [
		{
			items: [{ link: '/test/getting-started', text: 'Introduction' }],
			text: 'Getting Started',
		},
	],
	'/api/': [
		{
			items: [{ link: '/test/quickstart', text: 'Quickstart' }],
			text: 'API Reference',
		},
	],
}

export const sampleObjectVitePressSidebarWithBase: DefaultTheme.Sidebar = {
	'/': [
		{
			base: '/test',
			items: [
				{ link: '/getting-started', text: 'Introduction' },
				{
					base: '/',
					link: '/index',
					text: 'Index',
				},
			],
			text: 'Getting Started',
		},
	],
	'/api/': [
		{
			base: '/test',
			items: [
				{
					link: '/other',
					text: 'Other section',
				},
			],
			text: 'API Reference',
		},
	],
	'/tutorials/': [
		{
			items: [
				{
					link: '/test/quickstart',
					text: 'Quickstart',
				},
			],
			text: 'Tutorials',
		},
	],
}

export const sampleObjectVitePressSidebarWithCommonPrefix: DefaultTheme.Sidebar = {
	'/blog': [
		{
			items: [
				{ link: '/blog/v1', text: 'Version 1.0' },
				{ link: '/blog/v1.1', text: 'Version 1.1' },
			],
			text: 'Blog Started',
		},
	],
}

export const sampleObjectVitePressSidebarWithoutSections: DefaultTheme.Sidebar = [
	{ link: '/test/getting-started', text: 'Getting Started' },
	{ link: '/test/quickstart', text: 'Quickstart' },
]

export const fooMdSample: PreparedFile = {
	file: matter(''),
	path: 'foo.md',
	title: 'Title',
}

export const preparedFilesSample: PreparedFile[] = [
	{
		file: matter(fakeIndexMd),
		path: 'index.md',
		title: 'Some cool tool',
	},
	{
		file: matter(fakeGettingStartedMd),
		path: 'test/getting-started.md',
		title: 'Getting started',
	},
	{
		file: matter(fakeQuickstartMd),
		path: 'test/quickstart.md',
		title: 'Quickstart',
	},
	{
		file: matter(fakeMarkdownDocument),
		path: 'test/other.md',
		title: 'Some other section',
	},
]

export const preparedFilesWithCommonPrefixSample: PreparedFile[] = [
	{
		file: matter(fakeIndexMd),
		path: 'blog/v1.md',
		title: 'First version',
	},
	{
		file: matter(fakeGettingStartedMd),
		path: 'blog/v1.1.md',
		title: 'New features!',
	},
]
