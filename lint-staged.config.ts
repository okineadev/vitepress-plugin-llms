import type { Configuration } from 'lint-staged'

const config: Configuration = {
	'*.{ts,vue}': () => ['bun run lint'],
	'*': ['bun run format --no-error-on-unmatched-pattern', 'cspell --no-error-on-empty'],
}

export default config
