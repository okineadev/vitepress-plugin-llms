import { describe, expect, it } from 'bun:test'

import type { PreparedFile } from '@/internal-types'

import { filterPreparedFiles, isIgnored, resolveIgnorePatterns } from '@/utils/ignore'

function makeFile(filePath: string): PreparedFile {
	return { file: {} as PreparedFile['file'], path: filePath, title: filePath }
}

describe('resolveIgnorePatterns', () => {
	it('returns global patterns unchanged when perOutput is empty', () => {
		const { positive, negative } = resolveIgnorePatterns(['team/*', 'blog/*'], [])
		expect(positive).toEqual(['team/*', 'blog/*'])
		expect(negative).toEqual([])
	})

	it('merges additive perOutput patterns with global', () => {
		const { positive, negative } = resolveIgnorePatterns(['team/*'], ['changelog.md', 'sponsors/*'])
		expect(positive).toEqual(['team/*', 'changelog.md', 'sponsors/*'])
		expect(negative).toEqual([])
	})

	it('extracts negation patterns from perOutput into negative list', () => {
		const { negative } = resolveIgnorePatterns(['team/*', 'blog/*'], ['!team/*'])
		expect(negative).toEqual(['team/*'])
	})

	it('removes globally ignored pattern when it is negated by perOutput', () => {
		const { positive } = resolveIgnorePatterns(['team/*', 'blog/*'], ['!team/*'])
		// Team/* should be removed from the positive list
		expect(positive).not.toContain('team/*')
		expect(positive).toContain('blog/*')
	})

	it('handles mixed negation and additive patterns together', () => {
		const { positive, negative } = resolveIgnorePatterns(
			['team/*', 'blog/*', 'api/reference/*'],
			['!api/reference/*', 'changelog.md'],
		)
		expect(positive).toEqual(['team/*', 'blog/*', 'changelog.md'])
		expect(negative).toEqual(['api/reference/*'])
	})

	it('returns empty positive and negative when both inputs are empty', () => {
		const { positive, negative } = resolveIgnorePatterns([], [])
		expect(positive).toEqual([])
		expect(negative).toEqual([])
	})

	it('handles perOutput with only negations and no global patterns', () => {
		const { positive, negative } = resolveIgnorePatterns([], ['!team/*'])
		// Nothing to remove from global, but negative is populated
		expect(positive).toEqual([])
		expect(negative).toEqual(['team/*'])
	})

	it('does not remove a global pattern that is not exactly matched by negation', () => {
		// 'team/*' negation should not remove 'team/**'
		const { positive } = resolveIgnorePatterns(['team/**'], ['!team/*'])
		expect(positive).toContain('team/**')
	})
})

describe('isIgnored', () => {
	it('returns false when positive patterns list is empty', () => {
		expect(isIgnored('team/alice.md', [], [])).toBe(false)
	})

	it('returns true when file matches a positive pattern and there are no negations', () => {
		expect(isIgnored('team/alice.md', ['team/*'], [])).toBe(true)
	})

	it('returns false when file does not match any positive pattern', () => {
		expect(isIgnored('guide/intro.md', ['team/*'], [])).toBe(false)
	})

	it('returns false when file matches positive but also matches negative (un-ignored)', () => {
		expect(isIgnored('team/alice.md', ['team/*'], ['team/alice.md'])).toBe(false)
	})

	it('returns true for a file that matches positive but a sibling file matches negative', () => {
		// `team/bob.md` is NOT in the negative list, so it stays ignored
		expect(isIgnored('team/bob.md', ['team/*'], ['team/alice.md'])).toBe(true)
	})

	it('supports glob patterns in positive list', () => {
		expect(isIgnored('api/reference/index.md', ['api/reference/*'], [])).toBe(true)
		expect(isIgnored('api/guide/index.md', ['api/reference/*'], [])).toBe(false)
	})

	it('supports glob patterns in negative list', () => {
		// All of api/reference/* is globally ignored, but negation lifts the whole subtree
		expect(isIgnored('api/reference/index.md', ['api/reference/*'], ['api/reference/*'])).toBe(false)
	})

	it('supports double-star glob patterns', () => {
		expect(isIgnored('pages/guide/nested/deep.md', ['**/guide/**'], [])).toBe(true)
		expect(isIgnored('pages/other/page.md', ['**/guide/**'], [])).toBe(false)
	})
})

describe('filterPreparedFiles', () => {
	const workDir = '/docs'

	it('returns all files when both pattern lists are empty', () => {
		const files = [makeFile('guide/intro.md'), makeFile('api/ref.md')]
		expect(filterPreparedFiles(files, workDir, [], [])).toHaveLength(2)
	})

	it('removes files that match positive patterns', () => {
		const files = [makeFile('team/alice.md'), makeFile('guide/intro.md')]
		const result = filterPreparedFiles(files, workDir, ['team/*'], [])
		expect(result).toHaveLength(1)
		expect(result[0]?.path).toBe('guide/intro.md')
	})

	it('keeps files that match both positive and negative patterns (un-ignored)', () => {
		const files = [makeFile('team/alice.md'), makeFile('team/bob.md')]
		const result = filterPreparedFiles(files, workDir, ['team/*'], ['team/alice.md'])
		expect(result).toHaveLength(1)
		expect(result[0]?.path).toBe('team/alice.md')
	})

	it('handles absolute file paths by computing relative path from workDir', () => {
		const files = [makeFile('/docs/team/alice.md'), makeFile('/docs/guide/intro.md')]
		const result = filterPreparedFiles(files, workDir, ['team/*'], [])
		expect(result).toHaveLength(1)
		expect(result[0]?.path).toBe('/docs/guide/intro.md')
	})

	it('keeps all files when no positive patterns match any file', () => {
		const files = [makeFile('guide/intro.md'), makeFile('api/ref.md')]
		const result = filterPreparedFiles(files, workDir, ['team/*'], [])
		expect(result).toHaveLength(2)
	})

	it('removes multiple files matching a glob pattern', () => {
		const files = [
			makeFile('api/reference/a.md'),
			makeFile('api/reference/b.md'),
			makeFile('api/guide/intro.md'),
		]
		const result = filterPreparedFiles(files, workDir, ['api/reference/*'], [])
		expect(result).toHaveLength(1)
		expect(result[0]?.path).toBe('api/guide/intro.md')
	})

	it('un-ignores an entire subdirectory via glob negation', () => {
		const files = [
			makeFile('api/reference/a.md'),
			makeFile('api/reference/b.md'),
			makeFile('team/alice.md'),
		]
		// Globally ignore api/reference/*, but lift it via negation
		const result = filterPreparedFiles(files, workDir, ['api/reference/*', 'team/*'], ['api/reference/*'])
		// `team/alice.md` stays ignored; api/reference/* is un-ignored
		expect(result).toHaveLength(2)
		expect(result.map((f) => f.path)).not.toContain('team/alice.md')
	})
})
