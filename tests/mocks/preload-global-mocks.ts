import { mock } from 'bun:test'
import mockedLogger from './utils/logger'

mock.module('@/utils/logger', () => mockedLogger)
