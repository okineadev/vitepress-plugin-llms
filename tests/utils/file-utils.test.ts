import { describe, expect, it } from 'bun:test'
import matter from 'gray-matter'
import { extractTitle } from '../../src/utils'

const fakeIndexMd = matter(`\
---
title: My Awesome Title
---

# Some Heading

Content goes here`)

const fakeIndexMdWithoutTitle = matter(`\
---
description: Some description
author: John Doe
---

# Title From Heading

Content goes here`)

describe('extractTitle', () => {
	it('extracts title from frontmatter', () => {
		expect(extractTitle(fakeIndexMd)).toBe('My Awesome Title')
	})

	it('extracts title from markdown heading when no frontmatter exists', () => {
		const markdown = matter('# My Markdown Title\nSome content here')
		expect(extractTitle(markdown)).toBe('My Markdown Title')
	})

	it('extracts title from markdown heading when frontmatter exists but has no title', () => {
		expect(extractTitle(fakeIndexMdWithoutTitle)).toBe('Title From Heading')
	})

	it('returns `undefined` when no frontmatter or markdown title exists', () => {
		const markdown = matter('Some content without any headings or frontmatter')
		expect(extractTitle(markdown)).toBeUndefined()
	})
})
