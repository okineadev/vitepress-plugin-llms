import { beforeEach, describe, expect, it, mock } from 'bun:test'
import path from 'node:path'
import { mockedFs } from '../mocks/fs'
import { outDir, preparedFilesSample } from '../resources'

const { mkdir, writeFile } = mockedFs.default

mock.module('node:fs/promises', () => mockedFs)

import { generateLLMFriendlyPages } from '../../src/generator'

describe('generateLLMFriendlyPages', () => {
	beforeEach(() => {
		mkdir.mockReset()
		writeFile.mockReset()
	})
	it('should generate LLM friendly pages for each prepared file', async () => {
		const preparedFiles = preparedFilesSample.slice(1)
		await generateLLMFriendlyPages(preparedFiles, outDir, 'https://example.com', false)

		// console.log(writeFile.mock.calls)
		// console.log(preparedFilesSample)

		expect(mkdir).toHaveBeenCalledTimes(preparedFiles.length)
		expect(writeFile).toHaveBeenCalledTimes(preparedFiles.length)

		// You can add more specific assertions here if needed, e.g., checking content or paths
		// For example, check the first call to writeFile
		const firstCallArgs = writeFile.mock.calls[0]
		expect(firstCallArgs[0]).toBe(path.resolve(outDir, preparedFiles[0].path))
		expect(firstCallArgs[1]).toContain("url: 'https://example.com/test/getting-started.md'")
	})
})
