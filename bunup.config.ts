import { type DefineConfigItem, defineConfig } from 'bunup'
import { copy } from 'bunup/plugins'

// 🩼
type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export default defineConfig({
	banner: '// Built with bunup (https://bunup.dev)',
	dts: {
		resolve: false,
		splitting: true,
	},
	entry: ['src/index.ts', 'src/vitepress-components/utils.ts'],
	plugins: [
		copy('src/vitepress-components/*.vue').to('vitepress-components'),
		copy('src/vitepress-components/icons').to('vitepress-components'),
	],
	// @ts-expect-error - The `BUNDLE_SOURCEMAPS` environment variable is used in `.github/workflows/ci.yml` to include sourcemaps in https://pkg.pr.new builds. ⚡
	// oxlint-disable-next-line typescript/strict-boolean-expressions node/no-process-env
	sourcemap: process.env.BUNDLE_SOURCEMAPS ? 'external' : false,
}) as DefineConfigItem | WithRequired<DefineConfigItem, 'name'>[]
