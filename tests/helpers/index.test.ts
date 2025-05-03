import { describe, expect, it, mock } from 'bun:test'

import { defaultLLMsTxtTemplate } from '../../src/constants'
import type { VitePressConfig } from '../../src/types'

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
	preparedFilesSample,
	sampleDomain,
	srcDir,
} from '../resources'

describe('generateLLMsTxt', () => {
	it('generates a `llms.txt` file', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample({ srcDir }).slice(1), {
				indexMd: `${srcDir}/index.md`,
				srcDir,
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				templateVariables: {},
				vitepressConfig: {} as VitePressConfig,
			}),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample({ srcDir }).slice(1), {
				indexMd: `${srcDir}/index.md`,
				srcDir,
				LLMsTxtTemplate: fakeCustomLlmsTxtTemplate,
				templateVariables: {},
				vitepressConfig: {} as VitePressConfig,
			}),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template variables', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample({ srcDir }), {
				indexMd: `${srcDir}/index.md`,
				srcDir,
				LLMsTxtTemplate: defaultLLMsTxtTemplate,
				templateVariables: { title: 'foo', description: 'bar', toc: 'zoo' },
				vitepressConfig: {} as VitePressConfig,
			}),
		).toMatchSnapshot()
	})

	it('works correctly with a custom template and variables', async () => {
		expect(
			await generateLLMsTxt(preparedFilesSample({ srcDir }), {
				indexMd: `${srcDir}/index.md`,
				srcDir,
				LLMsTxtTemplate: '# {foo}\n\n**{bar}**\n\n{zoo}',
				templateVariables: { title: 'foo', description: 'bar', toc: 'zoo' },
				vitepressConfig: {} as VitePressConfig,
			}),
		).toMatchSnapshot()
	})
})

describe('generateLLMsFullTxt', () => {
	it('generates a `llms-full.txt` file', async () => {
		expect(
			await generateLLMsFullTxt(preparedFilesSample({ srcDir }).slice(1), {
				srcDir,
			}),
		).toMatchSnapshot()
	})

	it('correctly attaches the domain to URLs in context', async () => {
		expect(
			await generateLLMsFullTxt(preparedFilesSample({ srcDir }).slice(1), {
				srcDir,
				domain: sampleDomain,
			}),
		).toMatchSnapshot()
	})
})
