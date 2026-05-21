import { ref, type Ref } from 'vue'

import { downloadFile, resolveMarkdownPageURL } from './utils'

export interface MarkdownAiProvider {
	readonly name: string
	readonly url: string
}

export interface UseCopyOrDownloadAsMarkdownButtonsOptions {
	readonly aiProviders?: readonly MarkdownAiProvider[]
	readonly animationDuration?: number
	readonly currentURL?: string
}

const defaultAnimationDuration = 2000

export const defaultAiProviders = [
	{ name: 'ChatGPT', url: 'https://chatgpt.com/?hints=search&prompt=' },
	{ name: 'Claude', url: 'https://claude.ai/new?q=' },
] as const satisfies readonly MarkdownAiProvider[]

const fetchMarkdown = async (markdownPageURL: string): Promise<string> => {
	const response = await fetch(markdownPageURL)
	return response.text()
}

const resolveCurrentURL = (currentURL?: string): string =>
	currentURL ?? globalThis.window.location.origin + globalThis.window.location.pathname

const resolveMarkdownFilename = (markdownPageURL: string): string =>
	markdownPageURL.split('/').pop() ?? 'page.md'

const scheduleReset = (state: Ref<boolean>, animationDuration: number): void => {
	setTimeout(() => {
		state.value = false
	}, animationDuration)
}

export function useCopyOrDownloadAsMarkdownButtons(options: UseCopyOrDownloadAsMarkdownButtonsOptions = {}): {
	aiProviders: readonly MarkdownAiProvider[]
	copied: ReturnType<typeof ref<boolean>>
	copyAsMarkdown: () => Promise<void>
	currentURL: string
	downloadMarkdown: () => Promise<void>
	downloaded: ReturnType<typeof ref<boolean>>
	markdownPageURL: string
	openInAI: (provider: MarkdownAiProvider) => void
	viewAsMarkdown: () => void
} {
	const aiProviders = options.aiProviders ?? defaultAiProviders
	const animationDuration = options.animationDuration ?? defaultAnimationDuration
	const currentURL = resolveCurrentURL(options.currentURL)
	const markdownPageURL = resolveMarkdownPageURL(currentURL)
	const copied = ref(false)
	const downloaded = ref(false)

	async function copyAsMarkdown(): Promise<void> {
		try {
			const text = await fetchMarkdown(markdownPageURL)
			await navigator.clipboard.writeText(text)

			copied.value = true
			scheduleReset(copied, animationDuration)
		} catch (error) {
			console.error('❌ Error:', error)
		}
	}

	function viewAsMarkdown(): void {
		globalThis.window.open(markdownPageURL, '_blank')
	}

	function openInAI(provider: MarkdownAiProvider): void {
		const prompt = `Read from ${markdownPageURL} so I can ask questions about it.`
		globalThis.window.open(provider.url + encodeURIComponent(prompt), '_blank')
	}

	async function downloadMarkdown(): Promise<void> {
		try {
			const text = await fetchMarkdown(markdownPageURL)
			const filename = resolveMarkdownFilename(markdownPageURL)

			downloadFile(filename, text, 'text/markdown')
			downloaded.value = true
			scheduleReset(downloaded, animationDuration)
		} catch (error) {
			console.error('❌ Error:', error)
		}
	}

	return {
		aiProviders,
		copied,
		copyAsMarkdown,
		currentURL,
		downloadMarkdown,
		downloaded,
		markdownPageURL,
		openInAI,
		viewAsMarkdown,
	}
}
