import type { Configuration } from 'lint-staged'

export default {
	'*.{ts,vue}': () => ['bun run lint', 'bun run lint:tsc'],
	'*': ['bun run format --no-errors-on-unmatched', 'cspell --no-error-on-empty'],
} as Configuration
