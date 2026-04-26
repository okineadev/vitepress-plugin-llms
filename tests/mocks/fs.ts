import { mock } from 'bun:test'

import fakeMarkdownDocument from '../test-assets/markdown-document.md'

/**
 * Mocked filesystem module for testing purposes
 *
 * @remarks
 *   Contains mock implementations of common `fs` operations
 */
const mockedFs = {
	default: {
		access: mock(async (): Promise<void> => {
			/* Mock */
		}),
		mkdir: mock(),
		readFile: mock(async (/* Abstraction */ _filePath: string): Promise<string> => fakeMarkdownDocument),
		writeFile: mock(),
	},
}

export default mockedFs
