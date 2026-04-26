import { mock } from 'bun:test'

// oxlint-disable-next-line no-unused-vars
import logger from '@/utils/logger'

/** Mocked {@link logger} for silencing logs in tests. */
const mockedLogger = {
	default: {
		error: mock(),
		info: mock(),
		success: mock(),
		warn: mock(),
	},
}

export default mockedLogger
