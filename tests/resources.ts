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

export const sampleVitePressSidebar = [
	{
		items: [{ link: '/test/getting-started', text: 'Getting Started' }],
		text: 'Test Section',
	},
	{
		items: [{ link: '/test/quickstart', text: 'Quickstart' }],
		text: 'Quickstart Section',
	},
] as const satisfies DefaultTheme.Sidebar

export const sampleObjectVitePressSidebar = {
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

export const sampleObjectVitePressSidebarWithBase = {
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
} as const satisfies DefaultTheme.Sidebar

export const sampleObjectVitePressSidebarWithCommonPrefix = {
	'/blog': [
		{
			items: [
				{ link: '/blog/v1', text: 'Version 1.0' },
				{ link: '/blog/v1.1', text: 'Version 1.1' },
			],
			text: 'Blog Started',
		},
	],
} as const satisfies DefaultTheme.Sidebar

export const sampleObjectVitePressSidebarWithoutSections = [
	{ link: '/test/getting-started', text: 'Getting Started' },
	{ link: '/test/quickstart', text: 'Quickstart' },
] as const satisfies DefaultTheme.Sidebar

export const fooMdSample = {
	file: matter(''),
	path: 'foo.md',
	title: 'Title',
} as const satisfies PreparedFile

export const preparedFilesSample = [
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
] as const satisfies PreparedFile[]

export const preparedFilesWithCommonPrefixSample = [
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
] as const satisfies PreparedFile[]
