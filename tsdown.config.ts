import { defineConfig } from 'tsdown'

export default defineConfig({
	banner: '// Built with tsdown 🔨 (https://tsdown.dev)',
	copy: [
		{ from: 'src/vitepress-components/*.vue', to: 'dist/vitepress-components' },
		{ from: 'src/vitepress-components/icons', to: 'dist/vitepress-components' },
	],
	deps: { neverBundle: true },
	dts: { generator: 'oxc' },
	entry: [
		'src/index.ts',
		'src/vitepress-components/utils.ts',
		'src/vitepress-components/composables/copy-or-download-as-markdown-buttons.ts',
	],
	outputOptions: {
		comments: false,
		// `.js` instead of `.mjs`
		entryFileNames: '[name].js',
	},

	// oxlint-disable-next-line typescript/ban-ts-comment
	// @ts-expect-error
	// oxlint-disable-next-line node/no-process-env - The `BUNDLE_SOURCEMAPS` environment variable is used in `.github/workflows/ci.yml` to include sourcemaps in https://pkg.pr.new builds. ⚡
	sourcemap: Boolean(process.env.BUNDLE_SOURCEMAPS),
})
