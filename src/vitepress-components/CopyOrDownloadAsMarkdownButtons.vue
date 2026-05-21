<template>
	<div class="markdown-copy-buttons">
		<div class="markdown-copy-buttons-inner">
			<div class="dropdown-container" ref="dropdownContainer">
				<!-- Main button -->
				<div class="dropdown-trigger">
					<!-- Copy area -->
					<button class="copy-page" @click="handleCopyAsMarkdown">
						<span v-html="copied ? iconCheck : iconCopy" class="icon"></span>
						<span class="label">
							{{ copied ? 'Copied' : 'Copy page' }}
						</span>
					</button>

					<span class="divider"></span>

					<!-- Chevron area -->
					<button class="chevron-wrapper" @click.stop="toggleDropdown">
						<span v-html="iconChevron" class="icon chevron" :class="{ open: isOpen }"></span>
					</button>
				</div>

				<!-- Dropdown -->
				<div v-if="isRendered" ref="dropdownMenu" class="dropdown-menu" :class="{ open: isOpen }">
					<button class="dropdown-item" @click="handleViewAsMarkdown">
						<span v-html="iconMarkdown" class="icon"></span>
						View as Markdown
						<span v-html="iconExternal" class="icon external"></span>
					</button>

					<button
						v-for="provider in aiProviders"
						:key="provider.name"
						class="dropdown-item"
						@click="handleOpenInAI(provider)"
					>
						<span v-html="resolveProviderIcon(provider)" class="icon"></span>
						Open in {{ provider.name }}
						<span v-html="iconExternal" class="icon external"></span>
					</button>
				</div>
			</div>

			<!-- Download button -->
			<button class="download-btn" @click="downloadMarkdown">
				<span v-html="downloaded ? iconCheck : iconDownload" class="icon"></span>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import iconChatGPT from './icons/chatgpt.svg?raw'
import iconCheck from './icons/check.svg?raw'
import iconChevron from './icons/chevron.svg?raw'
import iconClaude from './icons/claude.svg?raw'
import iconCopy from './icons/copy.svg?raw'
import iconDownload from './icons/download.svg?raw'
import iconExternal from './icons/external.svg?raw'
import iconMarkdown from './icons/markdown.svg?raw'
import {
	type MarkdownAiProvider,
	useCopyOrDownloadAsMarkdownButtons,
} from './use-copy-or-download-as-markdown-buttons'

const isOpen = ref(false)
const dropdownContainer = ref<HTMLElement | undefined>()
const isRendered = ref(false)
const dropdownMenu = ref<HTMLElement | undefined>()

const { aiProviders, copied, copyAsMarkdown, downloadMarkdown, downloaded, openInAI, viewAsMarkdown } =
	useCopyOrDownloadAsMarkdownButtons()

const aiProviderIcons: Record<string, string> = {
	ChatGPT: iconChatGPT,
	Claude: iconClaude,
}

function closeDropdown(): void {
	if (!isOpen.value) {
		isRendered.value = false
		return
	}

	isOpen.value = false

	const el = dropdownMenu.value
	if (!el) {
		isRendered.value = false
		return
	}

	const onEnd = (): void => {
		isRendered.value = false
		el.removeEventListener('transitionend', onEnd)
	}

	el.addEventListener('transitionend', onEnd)
}

function toggleDropdown(): void {
	if (isOpen.value) {
		closeDropdown()
	} else {
		isRendered.value = true
		requestAnimationFrame(() => {
			isOpen.value = true
		})
	}
}

function resolveProviderIcon(provider: MarkdownAiProvider): string {
	return aiProviderIcons[provider.name] ?? iconExternal
}

async function handleCopyAsMarkdown(): Promise<void> {
	await copyAsMarkdown()
	closeDropdown()
}

function handleViewAsMarkdown(): void {
	viewAsMarkdown()
	closeDropdown()
}

function handleOpenInAI(provider: MarkdownAiProvider): void {
	openInAI(provider)
	closeDropdown()
}

function handleClickOutside(event: MouseEvent): void {
	if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
		closeDropdown()
	}
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.markdown-copy-buttons {
	width: 100%;
	display: flex;
	margin-bottom: 16px;
}

.markdown-copy-buttons-inner {
	margin: 16px 0;
	display: flex;
	gap: 8px;
	position: relative;
}

.dropdown-container {
	position: relative;
}

.dropdown-trigger {
	display: flex;
	align-items: stretch;
	background: transparent;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	color: var(--vp-c-text-1);
	font-size: 14px;
	padding: 0;
	overflow: hidden;
}

.copy-page {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	cursor: pointer;
	white-space: nowrap;
	background: transparent;
	border: none;
}

.label {
	white-space: nowrap;
}

.divider {
	width: 1px;
	height: 25px;
	align-self: center;
	background: var(--vp-c-divider);
	opacity: 0.6;
}

.chevron-wrapper {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 12px;
	cursor: pointer;
	background: transparent;
	border: none;
}

.dropdown-menu {
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	min-width: 240px;
	background: var(--vp-c-bg-elv);
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	overflow: hidden;
	z-index: 100;
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);

	opacity: 0;
	transform: translateY(-6px) scale(0.96);
	pointer-events: none;
}

.dropdown-menu.open {
	opacity: 1;
	transform: translateY(0) scale(1);
	pointer-events: auto;
}

.dropdown-item {
	position: relative;
	width: 100%;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 16px;
	background: transparent;
	border: none;
	color: var(--vp-c-text-1);
	font-size: 14px;
	cursor: pointer;
	text-align: left;
}

.dropdown-item .icon.external {
	margin-left: auto;
	opacity: 0.6;
}

.download-btn {
	display: flex;
	align-items: center;
	padding: 8px 12px;
	background: transparent;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	color: var(--vp-c-text-1);
	cursor: pointer;
}

.icon {
	width: 18px;
	height: 18px;
}

.chevron.open {
	transform: rotate(180deg);
}

.dropdown-item:hover .icon.external {
	opacity: 1;
	transform: translateX(2px);
}

@media (prefers-reduced-motion: no-preference) {
	.dropdown-menu {
		transition:
			opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: top;
	}

	/* Hover zones */
	.copy-page:hover,
	.chevron-wrapper:hover,
	.download-btn:hover {
		background: var(--vp-c-bg-soft);
	}

	.dropdown-trigger,
	.copy-page,
	.chevron-wrapper,
	.dropdown-item,
	.dropdown-item .icon.external,
	.download-btn {
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.dropdown-trigger:hover,
	.download-btn:hover {
		border-color: var(--vp-c-brand-1);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.dropdown-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		width: 0;
		height: 100%;
		background: var(--vp-c-brand-1);
		transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.dropdown-item:hover {
		padding-left: 20px;
	}

	.dropdown-item:hover::before {
		width: 3px;
	}

	.chevron {
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}
}
</style>
