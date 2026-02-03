import { describe, expect, it } from 'bun:test'
import dedent from 'dedent'
import matter from 'gray-matter'

// oxlint-disable-next-line typescript/prefer-ts-expect-error typescript/ban-ts-comment
// @ts-ignore
import { processVPParams } from '@/utils/dynamic-routes'

const generateStringWithVPParams = (params: Record<string, string>, content: string) => {
	return `__VP_PARAMS_START${JSON.stringify(params)}__VP_PARAMS_END__${content}`
}

describe('processVPParams', () => {
	it('replaces $params.pkg references in title', () => {
		const markdown = generateStringWithVPParams({ pkg: 'vitepress' }, '# {{ $params.pkg }}')
		const title = processVPParams(markdown)
		expect(title).toBe('# vitepress')
	})

	it('replaces multiple param references', () => {
		const markdown = generateStringWithVPParams(
			{ pkg: 'vitepress', version: '1.0.0' },
			'# {{ $params.pkg }} v{{ $params.version }}',
		)
		const title = processVPParams(markdown)
		expect(title).toBe('# vitepress v1.0.0')
	})

	it('handles spaces in template syntax', () => {
		const markdown = generateStringWithVPParams({ pkg: 'vitepress' }, '# {{  $params.pkg  }}')
		const title = processVPParams(markdown)
		expect(title).toBe('# vitepress')
	})

	it('uses title from frontmatter with param replacement', () => {
		const markdown = generateStringWithVPParams(
			{ pkg: 'vitepress' },
			dedent`
			---
			title: "{{ $params.pkg }} Documentation"
			---

			# Content
		`,
		)
		const title = matter(processVPParams(markdown)).data['title']
		expect(title).toBe('vitepress Documentation')
	})
})
