import type { Configuration } from 'lint-staged'

const config: Configuration = {
	'*': ['bun run format --no-error-on-unmatched-pattern', 'cspell --no-error-on-empty'],
	'*.{ts,vue}': () => ['bun run lint'],
}

export default config
