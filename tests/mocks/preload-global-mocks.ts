import { mock } from 'bun:test'

import mockedLogger from './utils/logger'

await mock.module('@/utils/logger', () => mockedLogger)
