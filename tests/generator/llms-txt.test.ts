import { afterAll, describe, expect, it, mock } from 'bun:test'

import { defaultLLMsTxtTemplate } from '@/constants'

import mockedFs from '../mocks/fs'

await mock.module('node:fs/promises', () => mockedFs)

const { readFile } = mockedFs.default

import matter from 'gray-matter'

import {
	generateLLMsTxt,
	// oxlint-disable-next-line typescript/prefer-ts-expect-error typescript/ban-ts-comment
	// @ts-ignore
} from '@/generator/llms-txt'

import { fakeCustomLlmsTxtTemplate, preparedFilesSample } from '../resources'
import fakeIndexMd from '../test-assets/index.md'

describe('generateLLMsTxt', () => {
	readFile.mockReturnValue(Promise.resolve(fakeIndexMd))
	afterAll(() => readFile.mockReset())

	it.serial('generates a `llms.txt` file', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample.slice(1), {
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				indexMdFile: matter(fakeIndexMd),
				templateVariables: {},
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})

	it.serial('works correctly with base config of vitepress', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample.slice(1), {
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				indexMdFile: matter(fakeIndexMd),
				templateVariables: {},
				vitepressConfig: {
					base: '/docs/',
				},
			}),
		).toMatchSnapshot()
	})

	it.serial('works correctly with a custom template', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample.slice(1), {
				LLMsTxtTemplate: fakeCustomLlmsTxtTemplate,
				indexMdFile: matter(fakeIndexMd),
				templateVariables: {},
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})
	it.serial('works correctly with a custom template variables', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample, {
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				indexMdFile: matter(fakeIndexMd),
				templateVariables: { description: 'bar', title: 'foo', toc: 'zoo' },
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})

	it.serial('works correctly with a custom template and variables', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample, {
				LLMsTxtTemplate: '# {foo}\n\n**{bar}**\n\n{zoo}',
				indexMdFile: matter(fakeIndexMd),
				templateVariables: { description: 'bar', title: 'foo', toc: 'zoo' },
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})
})
