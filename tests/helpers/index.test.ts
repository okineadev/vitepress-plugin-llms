import { describe, expect, it, mock } from 'bun:test'

import { defaultLLMsTxtTemplate } from '../../src/constants'

import { mockedFs } from '../mocks/fs'

mockedFs.default.readFile.mockReturnValue(Promise.resolve(fakeIndexMd))

mock.module('node:fs/promises', () => mockedFs)

import {
	generateLLMsFullTxt,
	generateLLMsTxt,
	// @ts-ignore
} from '../../src/helpers'
import {
	fakeCustomLlmsTxtTemplate,
	fakeIndexMd,
	outDir,
	preparedFilesSample,
	sampleDomain,
} from '../resources'

describe('generateLLMsTxt', () => {
	it('generates a `llms.txt` file', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample.slice(1), {
				indexMd: `${outDir}/index.md`,
				outDir: outDir,
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				templateVariables: {},
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample.slice(1), {
				indexMd: `${outDir}/index.md`,
				outDir: outDir,
				LLMsTxtTemplate: fakeCustomLlmsTxtTemplate,
				templateVariables: {},
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template variables', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample, {
				indexMd: `${outDir}/index.md`,
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
				indexMd: `${outDir}/index.md`,
				outDir: outDir,
				LLMsTxtTemplate: '# {foo}\n\n**{bar}**\n\n{zoo}',
				templateVariables: { title: 'foo', description: 'bar', toc: 'zoo' },
				vitepressConfig: {},
			}),
		).toMatchSnapshot()
	})
})

describe('generateLLMsFullTxt', () => {
	it('generates a `llms-full.txt` file', async () => {
		expect(await generateLLMsFullTxt(preparedFilesSample.slice(1), {})).toMatchSnapshot()
	})

	it('correctly attaches the domain to URLs in context', async () => {
		expect(
			await generateLLMsFullTxt(preparedFilesSample.slice(1), {
				domain: sampleDomain,
			}),
		).toMatchSnapshot()
	})
})
