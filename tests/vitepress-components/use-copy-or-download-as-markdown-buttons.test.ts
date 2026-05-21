import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import {
	defaultAiProviders,
	useCopyOrDownloadAsMarkdownButtons,
} from '@/vitepress-components/use-copy-or-download-as-markdown-buttons'

describe('useCopyOrDownloadAsMarkdownButtons', () => {
	const origin = 'https://example.com'
	const pathname = '/docs/page'

	const originalDocument = globalThis.document
	const originalFetch = globalThis.fetch
	const originalLocation = globalThis.location
	const originalNavigator = globalThis.navigator
	const originalWindow = globalThis.window
	const originalCreateObjectURL = globalThis.URL.createObjectURL.bind(globalThis.URL)
	const originalRevokeObjectURL = globalThis.URL.revokeObjectURL.bind(globalThis.URL)

	let anchor: { click: ReturnType<typeof mock>; download?: string; href?: string }
	let open: ReturnType<typeof mock>
	let writeText: ReturnType<typeof mock>

	beforeEach(() => {
		anchor = { click: mock(Boolean) }
		open = mock(Boolean)
		writeText = mock(() => Promise.resolve())

		globalThis.fetch = mock(async () => new Response('# Hello from markdown')) as unknown as typeof fetch
		globalThis.window = {
			location: {
				origin,
				pathname,
			},
			open,
		} as unknown as Window & typeof globalThis

		Object.defineProperty(globalThis, 'location', {
			configurable: true,
			value: { origin },
		})

		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { clipboard: { writeText } },
		})

		Object.defineProperty(globalThis, 'document', {
			configurable: true,
			value: {
				createElement: mock(() => anchor),
			},
		})

		globalThis.URL.createObjectURL = mock(() => 'blob:markdown')
		globalThis.URL.revokeObjectURL = mock(Boolean)
	})

	afterEach(() => {
		globalThis.fetch = originalFetch
		Object.defineProperty(globalThis, 'location', {
			configurable: true,
			value: originalLocation,
		})
		globalThis.window = originalWindow
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: originalNavigator,
		})
		Object.defineProperty(globalThis, 'document', {
			configurable: true,
			value: originalDocument,
		})
		globalThis.URL.createObjectURL = originalCreateObjectURL
		globalThis.URL.revokeObjectURL = originalRevokeObjectURL
	})

	it('copies the markdown page contents', async () => {
		const buttons = useCopyOrDownloadAsMarkdownButtons({ animationDuration: 1 })

		expect(buttons.markdownPageURL).toBe(`${origin}${pathname}.md`)

		await buttons.copyAsMarkdown()

		expect(writeText).toHaveBeenCalledWith('# Hello from markdown')
		expect(buttons.copied.value).toBe(true)

		await Bun.sleep(10)

		expect(buttons.copied.value).toBe(false)
	})

	it('opens the markdown page and AI provider links', () => {
		const buttons = useCopyOrDownloadAsMarkdownButtons()

		buttons.viewAsMarkdown()
		buttons.openInAI(defaultAiProviders[0])

		expect(open).toHaveBeenNthCalledWith(1, `${origin}${pathname}.md`, '_blank')
		expect(open).toHaveBeenNthCalledWith(
			2,
			`${defaultAiProviders[0].url}${encodeURIComponent(
				`Read from ${origin}${pathname}.md so I can ask questions about it.`,
			)}`,
			'_blank',
		)
	})

	it('downloads the markdown file', async () => {
		const buttons = useCopyOrDownloadAsMarkdownButtons({ animationDuration: 1 })

		await buttons.downloadMarkdown()

		expect(anchor.click).toHaveBeenCalledTimes(1)
		expect(anchor.download).toBe('page.md')
		expect(anchor.href).toBe('blob:markdown')
		expect(buttons.downloaded.value).toBe(true)

		await Bun.sleep(10)

		expect(buttons.downloaded.value).toBe(false)
	})
})
