import { defineConfig } from 'bunup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	// Generate declaration file (.d.ts)
	dts: true,
	minify: true,
	banner: '// Built with bunup',
	clean: true,
})
