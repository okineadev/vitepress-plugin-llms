import { mock } from 'bun:test'
import logger from '../../../src/utils/logger'

/** Mocked {@link logger} for silencing logs in tests. */
export const mockedLogger = {
	default: {
		info: mock(),
		success: mock(),
		warn: mock(),
		error: mock(),
	},
}

export default mockedLogger
