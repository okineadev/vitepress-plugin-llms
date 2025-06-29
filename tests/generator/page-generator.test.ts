import { beforeEach, describe, expect, it, mock } from 'bun:test'
import path from 'node:path'
import mockedFs from '../mocks/fs'
import mockedLogger from '../mocks/utils/logger'
import { outDir, preparedFilesSample } from '../resources'

const { mkdir, writeFile } = mockedFs.default

mock.module('node:fs/promises', () => mockedFs)
mock.module('../../src/utils/logger', () => mockedLogger)

import { generateLLMFriendlyPages } from '../../src/generator'

describe('generateLLMFriendlyPages', () => {
	beforeEach(() => {
		mkdir.mockReset()
		writeFile.mockReset()
	})
	it('should generate LLM friendly pages for each prepared file', async () => {
		const preparedFiles = preparedFilesSample.slice(1)
		await generateLLMFriendlyPages(preparedFiles, outDir, 'https://example.com', false)

		expect(mkdir).toHaveBeenCalledTimes(preparedFiles.length)
		expect(writeFile).toHaveBeenCalledTimes(preparedFiles.length)

		const firstCallArgs = writeFile.mock.calls[0]
		expect(firstCallArgs[0]).toBe(path.resolve(outDir, preparedFiles[0].path))
		expect(firstCallArgs[1]).toContain("url: 'https://example.com/test/getting-started.md'")
	})
})
