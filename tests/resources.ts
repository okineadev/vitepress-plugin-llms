import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import type { LlmstxtSettings, PreparedFile } from '../src/types'

export const srcDir = 'docs'

const blah = 'blah blah blah...'
export const sampleDomain = 'https://example.com'

export const fakeIndexMd = `\
---
title: Some cool tool
description: Blazing fast frontend tool
---`

export const fakeGettingStartedMd = `\
---
title: Getting started
description: Instructions on how to get started with the tool
---

# Installation

${blah}`

export const fakeQuickstartMd = `\
---
title: Quickstart
description: Instructions for quick project initialization
---

# Project initialization

${blah}`

export const fakeMarkdownDocument = '# Some cool stuff'
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

export const fooMdSample = ({
	srcDir = 'docs',
}: {
	srcDir?: LlmstxtSettings['workDir']
}): PreparedFile => ({
	title: 'Title',
	path: `${srcDir}/foo.md`,
	file: matter(''),
})

export const preparedFilesSample = ({
	srcDir = 'docs',
}: {
	srcDir?: LlmstxtSettings['workDir']
}): PreparedFile[] => [
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

export const preparedFilesWithCommonPrefixSample = ({
	srcDir = 'docs',
}: {
	srcDir?: LlmstxtSettings['workDir']
}): PreparedFile[] => [
	{
		title: 'First version',
		path: `${srcDir}/blog/v1.md`,
		file: matter(fakeIndexMd),
	},
	{
		title: 'New features!',
		path: `${srcDir}/blog/v1.1.md`,
		file: matter(fakeGettingStartedMd),
	},
]
