import { onMounted, ref, type Ref } from 'vue'

import { downloadFile, resolveMarkdownPageURL } from '../utils'

type MarkdownAiProviders = readonly MarkdownAiProvider[]

/**
 * Represents an AI provider that can open the current page as Markdown.
 */
export interface MarkdownAiProvider {
	/** Display name of the provider, e.g. `'ChatGPT'`. */
	readonly name: string
	/**
	 * Base URL used to open the provider with a pre-filled prompt.
	 * The encoded prompt string will be appended directly to this URL.
	 *
	 * @example 'https://claude.ai/new?q='
	 */
	readonly url: string
}

const defaultAnimationDuration = 2000

/**
 * The default list of AI providers bundled with the plugin:
 * **ChatGPT** and **Claude**.
 *
 * Pass this to {@link UseCopyOrDownloadAsMarkdownButtonsOptions.aiProviders}
 * as a base when you want to extend rather than replace the defaults.
 *
 * @example
 * ```ts
 * useCopyOrDownloadAsMarkdownButtons({
 *   aiProviders: [
 *     ...defaultAiProviders,
 *     { name: 'Gemini', url: 'https://gemini.google.com/app?q=' },
 *   ],
 * })
 * ```
 */
export const defaultAiProviders = [
	{ name: 'ChatGPT', url: 'https://chatgpt.com/?hints=search&prompt=' },
	{ name: 'Claude', url: 'https://claude.ai/new?q=' },
] as const satisfies readonly MarkdownAiProvider[]

type ResolvedMarkdownAiProviders<Providers extends MarkdownAiProviders | undefined> =
	Providers extends MarkdownAiProviders ? Providers : typeof defaultAiProviders

/**
 * Options for {@link useCopyOrDownloadAsMarkdownButtons}.
 */
export interface UseCopyOrDownloadAsMarkdownButtonsOptions<
	Providers extends MarkdownAiProviders | undefined = undefined,
> {
	/**
	 * List of AI providers shown in the dropdown.
	 * Defaults to {@link defaultAiProviders}.
	 */
	readonly aiProviders?: Providers
	/**
	 * Duration in milliseconds for which the `copied` / `downloaded`
	 * state remains `true` after a successful action.
	 * Reset scheduling uses this configured value when the composable is created.
	 *
	 * @default 2000
	 */
	readonly animationDuration?: number
	/**
	 * Override the current page URL used to derive the Markdown file URL.
	 * When omitted, `window.location.origin + window.location.pathname` is used.
	 *
	 * Useful in tests or non-browser environments.
	 */
	readonly currentURL?: string
}

/**
 * Return type of {@link useCopyOrDownloadAsMarkdownButtons}.
 */
export interface UseCopyOrDownloadAsMarkdownButtonsReturn<
	Providers extends MarkdownAiProviders = typeof defaultAiProviders,
> {
	/** List of AI providers passed via options, or {@link defaultAiProviders} if not specified. */
	aiProviders: Providers
	/** `true` for {@link UseCopyOrDownloadAsMarkdownButtonsOptions.animationDuration} ms after {@link copyAsMarkdown} succeeds, then reset using that configured duration. */
	copied: Ref<boolean>
	/** `true` for {@link UseCopyOrDownloadAsMarkdownButtonsOptions.animationDuration} ms after {@link downloadMarkdown} succeeds, then reset using that configured duration. */
	downloaded: Ref<boolean>
	/**
	 * The resolved URL of the current page.
	 * Empty string during SSR; populated in `onMounted`.
	 */
	currentURL: Readonly<Ref<string>>
	/**
	 * The resolved URL of the `.md` source file for the current page.
	 * Empty string during SSR; populated in `onMounted`.
	 */
	markdownPageURL: Readonly<Ref<string>>
	/** Fetches the page Markdown and writes it to the clipboard. */
	copyAsMarkdown: () => Promise<void>
	/** Fetches the page Markdown and triggers a file download. */
	downloadMarkdown: () => Promise<void>
	/** Opens the raw Markdown source of the current page in a new tab. */
	viewAsMarkdown: () => void
	/**
	 * Opens the given AI provider in a new tab with a pre-filled prompt
	 * that instructs it to read the Markdown source of the current page.
	 *
	 * @param provider - One of the entries from {@link aiProviders}.
	 */
	openInAI: (provider: Readonly<Providers[number]>) => void
}

const fetchMarkdown = async (markdownPageURL: string): Promise<string> => {
	const response = await fetch(markdownPageURL)
	return response.text()
}

const resolveMarkdownFilename = (markdownPageURL: string): string =>
	markdownPageURL.split('/').pop() ?? 'page.md'

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types
const scheduleReset = (state: Ref<boolean>, animationDuration: number): void => {
	setTimeout(() => {
		state.value = false
	}, animationDuration)
}

/**
 * Composable that exposes the core logic of the "Copy / Download as Markdown"
 * button group, so you can build a completely custom UI on top of it.
 *
 * @param options - Optional configuration. See {@link UseCopyOrDownloadAsMarkdownButtonsOptions}.
 * @returns Reactive state and action handlers typed as {@link UseCopyOrDownloadAsMarkdownButtonsReturn}.
 *
 * @example Basic usage — copy button with feedback
 * ```vue
 * <script setup lang="ts">
 * import { useCopyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'
 *
 * const { copied, copyAsMarkdown } = useCopyOrDownloadAsMarkdownButtons()
 * </script>
 *
 * <template>
 *   <button @click="copyAsMarkdown">
 *     {{ copied ? 'Copied!' : 'Copy as Markdown' }}
 *   </button>
 * </template>
 * ```
 *
 * @example Custom AI providers
 * ```ts
 * const { openInAI } = useCopyOrDownloadAsMarkdownButtons({
 *   aiProviders: [
 *     { name: 'Gemini', url: 'https://gemini.google.com/app?q=' },
 *   ],
 * })
 * ```
 */
// oxlint-disable-next-line max-statements max-lines-per-function
export function useCopyOrDownloadAsMarkdownButtons<
	const Providers extends MarkdownAiProviders | undefined = undefined,
>(
	options: UseCopyOrDownloadAsMarkdownButtonsOptions<Providers> = {},
): UseCopyOrDownloadAsMarkdownButtonsReturn<ResolvedMarkdownAiProviders<Providers>> {
	// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
	const aiProviders = (options.aiProviders ?? defaultAiProviders) as ResolvedMarkdownAiProviders<Providers>
	const animationDuration = options.animationDuration ?? defaultAnimationDuration

	const copied = ref(false)
	const downloaded = ref(false)
	const currentURL = ref('')
	const markdownPageURL = ref('')

	onMounted(() => {
		currentURL.value = options.currentURL ?? globalThis.location.origin + globalThis.location.pathname
		markdownPageURL.value = resolveMarkdownPageURL(currentURL.value)
	})

	async function copyAsMarkdown(): Promise<void> {
		try {
			const text = await fetchMarkdown(markdownPageURL.value)
			await navigator.clipboard.writeText(text)
			copied.value = true
		} catch (error) {
			console.error('❌ Error:', error)
		} finally {
			scheduleReset(copied, animationDuration)
		}
	}

	async function downloadMarkdown(): Promise<void> {
		try {
			const text = await fetchMarkdown(markdownPageURL.value)
			const filename = resolveMarkdownFilename(markdownPageURL.value)
			downloadFile(filename, text, 'text/markdown')
			downloaded.value = true
		} catch (error) {
			console.error('❌ Error:', error)
		} finally {
			scheduleReset(downloaded, animationDuration)
		}
	}

	function viewAsMarkdown(): void {
		window.open(markdownPageURL.value, '_blank')
	}

	function openInAI(provider: ResolvedMarkdownAiProviders<Providers>[number]): void {
		const prompt = `Read from ${markdownPageURL.value} so I can ask questions about it.`
		window.open(provider.url + encodeURIComponent(prompt), '_blank')
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
