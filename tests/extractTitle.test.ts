import { describe, expect, it } from 'bun:test'
// @ts-ignore
import { extractTitle } from '../src/helpers'
import type { VitePressConfig } from '../src/types'

const fakeIndexMd = `\
---
title: My Awesome Title
---
# Some Heading
Content goes here`

const fakeIndexMdWithoutTitle = `\
---
description: Some description
author: John Doe
---
# Title From Heading
Content goes here`

describe('extractTitle', () => {
	it('extracts title from frontmatter', () => {
		expect(extractTitle(fakeIndexMd, {} as VitePressConfig)).toBe(
			'My Awesome Title',
		)
	})

	it('extracts title from markdown heading when no frontmatter exists', () => {
		const markdown = '# My Markdown Title\nSome content here'
		expect(extractTitle(markdown, {} as VitePressConfig)).toBe(
			'My Markdown Title',
		)
	})

	it('extracts title from markdown heading when frontmatter exists but has no title', () => {
		expect(extractTitle(fakeIndexMdWithoutTitle, {} as VitePressConfig)).toBe(
			'Title From Heading',
		)
	})

	it('returns `undefined` when no frontmatter or markdown title exists', () => {
		const markdown = 'Some content without any headings or frontmatter'
		expect(extractTitle(markdown, {} as VitePressConfig)).toBeUndefined()
	})
})
