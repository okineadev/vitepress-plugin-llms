import type { Configuration } from 'lint-staged'

const config: Configuration = {
	'*.{ts,vue}': () => ['bun run lint', 'bun run lint:tsc'],
	'*': ['bun run format --no-errors-on-unmatched', 'cspell --no-error-on-empty'],
}

export default config
