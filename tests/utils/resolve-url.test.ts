import { describe, expect, it } from 'bun:test'
import { resolvePageURL } from '@/utils/vitepress-rewrites'
import { resolveMarkdownPageURL } from '@/vitepress-components/utils'

describe('resolvePageURL', () => {
	it('returns the same for index.md', () => {
		expect(resolvePageURL('index.md')).toBe('index.md')
		expect(resolvePageURL('/index.md')).toBe('/index.md')
	})

	it('changes /foo/index.md to /foo.md', () => {
		expect(resolvePageURL('/foo/index.md')).toBe('/foo.md')
		expect(resolvePageURL('foo/index.md')).toBe('foo.md')
	})

	it('does not change other .md files', () => {
		expect(resolvePageURL('foo/bar.md')).toBe('foo/bar.md')
		expect(resolvePageURL('/bar.md')).toBe('/bar.md')
	})
})

describe('resolveMarkdownPageURL', () => {
	const origin = 'https://example.com'
	global.window = Object.create({})
	Object.defineProperty(window, 'location', {
		value: { origin },
		writable: true,
	})

	it('appends /index.md for root URL', () => {
		expect(resolveMarkdownPageURL(origin)).toBe(`${origin}/index.md`)
	})

	it('appends .md for non-root URLs', () => {
		expect(resolveMarkdownPageURL(`${origin}/foo`)).toBe(`${origin}/foo.md`)
		expect(resolveMarkdownPageURL(`${origin}/bar/baz`)).toBe(`${origin}/bar/baz.md`)
	})
})
