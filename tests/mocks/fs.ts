import { mock } from 'bun:test'
import fakeMarkdownDocument from '../test-assets/markdown-document.md'

/**
 * Mocked filesystem module for testing purposes
 *
 * @remarks Contains mock implementations of common `fs` operations
 */
export const mockedFs = {
	default: {
		access: mock((): Promise<void> => Promise.resolve()),
		mkdir: mock(),
		readFile: mock((): Promise<string> => Promise.resolve(fakeMarkdownDocument)),
		writeFile: mock(),
	},
}

export default mockedFs
