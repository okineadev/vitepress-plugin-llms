import { defineConfig } from 'oxlint'

export default defineConfig({
	categories: {
		correctness: 'warn',
		nursery: 'warn',
		pedantic: 'warn',
		perf: 'warn',
		restriction: 'warn',
		style: 'warn',
		suspicious: 'warn',
	},
	jsPlugins: ['eslint-plugin-perfectionist'],
	options: {
		reportUnusedDisableDirectives: 'warn',
		typeAware: true,
		typeCheck: true,
	},
	overrides: [
		{
			files: ['tests/**/*.ts'],
			rules: {
				'id-length': 'off',
				'max-lines': 'off',
				'max-lines-per-function': 'off',
				'max-statements': 'off',
				'no-magic-numbers': 'off',
				'no-shadow': 'off',
				'no-unsafe-type-assertion': 'off',
				'typescript/ban-ts-comment': ['warn', { 'ts-expect-error': false }],
				'typescript/no-unsafe-assignment': 'off',
				'typescript/no-unsafe-member-access': 'off',
			},
		},
		{
			files: ['**/*.vue'],
			plugins: ['vue'],
			rules: {
				'eslint-plugin-unicorn/filename-case': ['warn', { case: 'pascalCase' }],
				'import/no-nodejs-modules': 'error',
			},
		},
	],
	plugins: ['import', 'jsdoc', 'promise', 'node', 'oxc', 'unicorn', 'eslint', 'typescript'],
	rules: {
		'func-style': [
			'warn',
			'declaration',
			{
				allowArrowFunctions: true,
			},
		],
		'id-length': [
			'warn',
			{
				exceptions: [
					// Types
					'T',
					'K',
					// `for` loop variables
					'i',
					'j',
					// Dummy param
					'_',
				],
			},
		],
		'import/consistent-type-specifier-style': 'off',
		'import/exports-last': 'off',
		'import/first': 'off',
		'import/group-exports': 'off',
		'import/no-default-export': 'off',
		'import/no-named-export': 'off',
		'import/no-nodejs-modules': 'off',
		'import/no-relative-parent-imports': 'off',
		'import/unambiguous': 'off',
		'init-declarations': 'off',
		'jsdoc/check-tag-names': [
			'error',
			{ definedTags: ['experimental', 'remarks', 'constant'], typed: true },
		],
		'jsdoc/require-param-type': 'off',
		'jsdoc/require-returns-type': 'off',
		'no-console': 'off',
		'no-inline-comments': 'off',
		'no-magic-numbers': [
			'warn',
			{
				ignore: [-1, 0, 1],
				ignoreTypeIndexes: true,
			},
		],
		'no-param-reassign': 'off',
		'no-ternary': 'off',
		'no-undef': 'off',
		'no-undefined': 'off',
		'no-unused-expressions': [
			'warn',
			{
				allowShortCircuit: true,
			},
		],
		'no-warning-comments': 'off',
		'oxc/no-async-await': 'off',
		'oxc/no-optional-chaining': 'off',
		'oxc/no-rest-spread-properties': 'off',
		'perfectionist/sort-imports': ['warn', { type: 'alphabetical' }],
		'require-await': 'off',
		'sort-imports': 'off',
		'sort-keys': [
			'warn',
			'asc',
			{
				natural: true,
			},
		],
		'typescript/no-non-null-assertion': 'off',
		'typescript/non-nullable-type-assertion-style': 'off',
		'typescript/prefer-readonly-parameter-types': [
			'warn',
			{
				ignoreInferredTypes: true,
			},
		],
		'typescript/require-await': 'off',
		// Always false positives
		'unicorn/no-abusive-eslint-disable': 'off',
	},
})
