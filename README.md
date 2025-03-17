# 📜 vitepress-plugin-llms

> A [VitePress](https://vitepress.dev/) plugin for generating LLM-friendly documentation in lightweight Markdown format.

> [!IMPORTANT]
> 🚧 This plugin is in **active development** and is not recommended for production use yet. Expect breaking changes.

## 📦 Installation

```bash
bun install vitepress-plugin-llms --dev
npm install vitepress-plugin-llms --save-dev
```

## 🛠️ Usage

Add the Vite plugin to your VitePress configuration (`.vitepress/config.ts`):

```ts
import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

export default defineConfig({
	vite: {
		plugins: [llmstxt()],
	},
});
```

Done!

Now, thanks to this plugin, the LLM version of the website documentation is automatically generated

### Plugin Settings

#### `generateLLMsFullTxt`

- **Description**: Determines whether to generate the `llms-full.txt` which contains all the documentation in one file.
- **Default**: `true`

#### `generateLLMsTxt`

- **Description**: Determines whether to generate the `llms.txt` which contains a list of sections with links.
- **Default**: `true`

## 🚀 Why `vitepress-plugin-llms`?

LLMs (Large Language Models) are great at processing text, but traditional documentation formats can be too heavy and cluttered. `vitepress-plugin-llms` generates raw Markdown documentation that LLMs can efficiently process

The file structure in `.vitepress/dist` folder will be as follows:

```plaintext
.vitepress/dist
├── ...
├── llms-full.txt            // A file where all the website documentation is compiled into one file
├── llms.txt                 // The main file for LLMs with all links to all sections of the documentation for LLMs
├── markdown-examples.html   // A human-friendly version of `markdown-examples` section in HTML format
└── markdown-examples.md     // A LLM-friendly version of `markdown-examples` section in Markdown format
```

### ✅ Key Features

-   ⚡️ Easy integration with VitePress
-   🤖 An LLM-friendly version is generated for each page
-   📝 Outputs `llms.txt` with section links
-   📖 Outputs `llms-full.txt` with all content in one file

## 📖 llmstxt.org Standard

This plugin follows the [llmstxt.org](https://llmstxt.org/) standard, which defines the best practices for LLM-friendly documentation.

## ❤️ Support

If you like this project, consider supporting it by starring ⭐ it on GitHub, sharing it with your friends, or [buying me a coffee ☕](https://github.com/okineadev/vitepress-plugin-llms?sponsor=1)

## 📜 License

[MIT License](./LICENSE) © 2025-present [Yurii Bogdan](https://github.com/okineadev)
