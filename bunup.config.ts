import { defineConfig, type DefineConfigItem } from 'bunup'
import { copy } from 'bunup/plugins'

export default defineConfig({
	entry: ['src/index.ts', 'src/vitepress-components/utils.ts'],
	// Generate declaration file (`.d.ts`)
	dts: {
		entry: ['src/index.ts'],
		splitting: true,
		resolve: false,
	},
	// @ts-expect-error
	// oxlint-disable-next-line typescript/strict-boolean-expressions
	sourcemap: process.env.PKG_PR_NEW ? 'external' : false,
	banner: '// Built with bunup (https://bunup.dev)',
	plugins: [
		copy('src/vitepress-components/*.vue').to('vitepress-components'),
		copy('src/vitepress-components/icons').to('vitepress-components'),
	],
}) as DefineConfigItem
