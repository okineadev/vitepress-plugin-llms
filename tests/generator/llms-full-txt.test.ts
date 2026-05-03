import { describe, expect, it } from 'bun:test'

import {
	generateLLMsFullTxt,
	// oxlint-disable-next-line typescript/prefer-ts-expect-error typescript/ban-ts-comment
	// @ts-ignore
} from '@/generator/llms-full-txt'

import {
	preparedFilesSample,
	preparedFilesWithCommonPrefixSample,
	sampleDomain,
	sampleObjectVitePressSidebar,
	sampleObjectVitePressSidebarWithBase,
	sampleVitePressSidebar,
} from '../resources'

describe('generateLLMsFullTxt', () => {
	it.serial('generates a `llms-full.txt` file', async () => {
		expect(await generateLLMsFullTxt(preparedFilesSample.slice(1), {})).toMatchSnapshot()
	})

	it.serial('correctly attaches the domain to URLs in context', async () => {
		expect(
			await generateLLMsFullTxt(preparedFilesSample.slice(1), {
				domain: sampleDomain,
			}),
		).toMatchSnapshot()
	})

	it.serial('orders sections according to the VitePress sidebar (array sidebar)', async () => {
		const result = await generateLLMsFullTxt(preparedFilesSample.slice(1), {
			sidebar: sampleVitePressSidebar,
		})
		expect(result).toMatchSnapshot()
	})

	it.serial('orders sections according to the VitePress sidebar (object sidebar)', async () => {
		const result = await generateLLMsFullTxt(preparedFilesSample.slice(1), {
			sidebar: sampleObjectVitePressSidebar,
		})
		expect(result).toMatchSnapshot()
	})

	it.serial('orders sections with object sidebar that uses base paths', async () => {
		const result = await generateLLMsFullTxt(preparedFilesSample.slice(1), {
			sidebar: sampleObjectVitePressSidebarWithBase,
		})

		expect(result).toMatchSnapshot()
	})

	it.serial('appends files not referenced by the sidebar at the end', async () => {
		const result = await generateLLMsFullTxt(preparedFilesSample.slice(1), {
			sidebar: sampleVitePressSidebar,
		})

		expect(result).toMatchSnapshot()
	})

	it.serial('works correctly with common-prefix sidebar', async () => {
		const result = await generateLLMsFullTxt(preparedFilesWithCommonPrefixSample, {
			sidebar: {
				'/blog': [
					{
						items: [
							{ link: '/blog/v1', text: 'Version 1.0' },
							{ link: '/blog/v1.1', text: 'Version 1.1' },
						],
						text: 'Blog',
					},
				],
			},
		})

		expect(result).toMatchSnapshot()
	})
})
