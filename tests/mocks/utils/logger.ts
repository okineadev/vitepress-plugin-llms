import { mock } from 'bun:test'
// oxlint-disable-next-line typescript/prefer-ts-expect-error typescript/ban-ts-comment
// @ts-ignore
// oxlint-disable-next-line no-unused-vars
import logger from '@/utils/logger'

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
