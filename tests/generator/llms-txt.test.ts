import { afterAll, describe, expect, it, mock } from 'bun:test'
import path from 'node:path'

import { defaultLLMsTxtTemplate } from '@/constants'

import mockedFs from '../mocks/fs'

mock.module('node:fs/promises', () => mockedFs)

const { readFile } = mockedFs.default

import {
	generateLLMsTxt,
	// @ts-ignore
} from '@/generator/llms-txt'
import { fakeCustomLlmsTxtTemplate, outDir, preparedFilesSample } from '../resources'
import fakeIndexMd from '../test-assets/index.md'

describe('generateLLMsTxt', () => {
	readFile.mockReturnValue(Promise.resolve(fakeIndexMd))
	afterAll(() => readFile.mockReset())

	it('generates a `llms.txt` file', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample.slice(1), {
				indexMd: path.join(outDir, 'index.md'),
				outDir: outDir,
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				templateVariables: {},
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})

	it('works correctly with base config of vitepress', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample.slice(1), {
				indexMd: path.join(outDir, 'index.md'),
				outDir: outDir,
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				templateVariables: {},
				vitepressConfig: {
					base: '/docs/',
				},
			}),
		).toMatchSnapshot()
	})

	it('works correctly with a custom template', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample.slice(1), {
				indexMd: path.join(outDir, 'index.md'),
				outDir: path.join(outDir),
				LLMsTxtTemplate: fakeCustomLlmsTxtTemplate,
				templateVariables: {},
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template variables', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample, {
				indexMd: path.join(outDir, 'index.md'),
				outDir: outDir,
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				templateVariables: { title: 'foo', description: 'bar', toc: 'zoo' },
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})

	it('works correctly with a custom template and variables', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample, {
				indexMd: path.join(outDir, 'index.md'),
				outDir: outDir,
				LLMsTxtTemplate: '# {foo}\n\n**{bar}**\n\n{zoo}',
				templateVariables: { title: 'foo', description: 'bar', toc: 'zoo' },
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})
})
