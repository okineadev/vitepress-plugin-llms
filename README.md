# 🤖 vite-plugin-llmstxt

> A VitePress plugin for generating LLM-friendly documentation in lightweight Markdown format.

> [!WARNING]
> 🚧 This plugin is in **active development** and is not recommended for production use yet. Expect breaking changes.

## 📦 Installation

```bash
bun install vite-plugin-llmstxt --dev
npm install vite-plugin-llmstxt --save-dev
```

## 🛠️ Usage

In your `.vitepress/config.ts`:

```ts
import { defineConfig } from "vitepress";
import llmstxt from "vite-plugin-llmstxt";

export default defineConfig({
	vite: {
		plugins: [llmstxt()],
	},
});
```

## 🚀 Why vite-plugin-llmstxt?

LLMs (Large Language Models) are great at processing text, but traditional documentation formats can be too heavy and cluttered. `vite-plugin-llmstxt` generates raw Markdown documentation that LLMs can efficiently process. This plugin supports two outputs:

-   **`llms.txt`** - A table of contents with links to each section.
-   **`llms-full.txt`** - A single file containing the entire documentation for optimal LLM ingestion.
-   **`somesection/installation.md`** - A version of the documentation for LLMs is generated for each page

### ✅ Key Features

-   ⚡️ Very easy integration with VitePress
-   📝 Outputs `llms.txt` with section links.
-   📖 Outputs `llms-full.txt` with all content in one file.

## 📖 llmstxt.org Standard

This plugin follows the [llmstxt.org](https://llmstxt.org/) standard, which defines the best practices for LLM-friendly documentation.

## 📜 License

MIT License © 2025 Yurii Bogdan
