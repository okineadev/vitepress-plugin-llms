import { describe, expect, it } from 'bun:test'

import {
	generateLLMsFullTxt,
	// oxlint-disable-next-line typescript/prefer-ts-expect-error typescript/ban-ts-comment
	// @ts-ignore
} from '@/generator/llms-full-txt'
import { preparedFilesSample, sampleDomain } from '../resources'

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
})
