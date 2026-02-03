import { beforeEach, describe, expect, it, mock } from 'bun:test'
import path from 'node:path'
import type { PreparedFile } from '@/internal-types'
import mockedFs from '../mocks/fs'
import { outDir, preparedFilesSample } from '../resources'

const { mkdir, writeFile } = mockedFs.default

mock.module('node:fs/promises', () => mockedFs)

import {
	generateLLMFriendlyPages,
	// @ts-ignore
} from '@/generator/page-generator'

describe('generateLLMFriendlyPages', () => {
	beforeEach(() => {
		mkdir.mockReset()
		writeFile.mockReset()
	})

	it('should generate LLM friendly pages for each prepared file', async () => {
		const preparedFiles = preparedFilesSample.slice(1)
		await generateLLMFriendlyPages(preparedFiles, outDir, 'https://example.com')

		expect(mkdir).toHaveBeenCalledTimes(preparedFiles.length)
		expect(writeFile).toHaveBeenCalledTimes(preparedFiles.length)

		const firstCallArgs = writeFile.mock.calls[0] as [string, string]
		expect(firstCallArgs[0]).toBe(path.resolve(outDir, (preparedFiles[0] as PreparedFile).path))
		expect(firstCallArgs[1]).toContain("url: 'https://example.com/test/getting-started.md'")
	})
})
