<!-- markdownlint-capture -->
<!-- markdownlint-disable no-inline-html heading-start-left first-line-h1 -->
<div align="center">
  <b>Is this plugin useful for your site? Consider <a href="https://github.com/sponsors/okineadev">sponsoring the developer</a> to support the project's development 😺</b>
  <br><br>
  <a href="https://npmjs.com/package/vitepress-plugin-llms">
    <!-- https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#specifying-the-theme-an-image-is-shown-to -->
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
      <source media="(prefers-color-scheme: light)" srcset="assets/hero-light.png">
      <img src="assets/hero-dark.png" alt="Banner">
    </picture>
  </a>

<!-- prettier-ignore-start -->
  # 📜 vitepress-plugin-llms

  [![NPM Downloads](https://img.shields.io/npm/dw/vitepress-plugin-llms?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNNDgwLTMyMCAyODAtNTIwbDU2LTU4IDEwNCAxMDR2LTMyNmg4MHYzMjZsMTA0LTEwNCA1NiA1OC0yMDAgMjAwWk0xNjAtMTYwdi0yMDBoODB2MTIwaDQ4MHYtMTIwaDgwdjIwMEgxNjBaIi8%2BPC9zdmc%2B&labelColor=FAFAFA&color=212121)](https://www.npmjs.com/package/vitepress-plugin-llms) [![NPM Version](https://img.shields.io/npm/v/vitepress-plugin-llms?logo=npm&logoColor=212121&label=version&labelColor=FAFAFA&color=212121)](https://npmjs.com/package/vitepress-plugin-llms) [![Tests Status](https://img.shields.io/github/actions/workflow/status/okineadev/vitepress-plugin-llms/ci.yml?label=tests&labelColor=212121)](https://github.com/okineadev/vitepress-plugin-llms/actions/workflows/ci.yml) [![Built with Bun](https://img.shields.io/badge/Built_with-Bun-fbf0df?logo=bun&labelColor=212121)](https://bun.sh) [![Formatted with oxfmt](https://img.shields.io/badge/Formatted_with-oxfmt-32f3e9?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxZW0nIGhlaWdodD0nMWVtJyB2aWV3Qm94PScwIDAgMzIgMzInPjxtYXNrIGlkPSdTVkdPN3A4SGVPRCc%2BPHBhdGggZmlsbD0nI2ZmZicgZD0nTTQ0LjkyIDcuNTZhMi4yNiAyLjI2IDAgMCAwIDIuMjYgMi4yNmg4LjU4YzEgMCAxLjUxIDEuMjIuOCAxLjkzTDQ1LjU4IDIyLjczYy0uNDMuNDItLjY3IDEtLjY3IDEuNnYzLjc2YzAgMS41NiAxLjU1IDIuNjQgMi45MiAxLjlhMjAgMjAgMCAwIDAgMy44Ny0yLjczYTEuMiAxLjIgMCAwIDEgMS42Mi4wMmw4IDhhMS4xIDEuMSAwIDAgMS0uMDEgMS41OWMtNi4wNyA1LjY3LTE0LjIyIDkuMTUtMjMuMTggOS4xNVMyMSA0Mi41NCAxNC45NCAzNi44N2ExLjEgMS4xIDAgMCAxLS4wMS0xLjU5bDgtOGExLjIgMS4yIDAgMCAxIDEuNjItLjAyYTIwIDIwIDAgMCAwIDMuODcgMi43M2MxLjM3Ljc0IDIuOTItLjM0IDIuOTItMS45di0zLjc2YzAtLjYtLjI0LTEuMTgtLjY2LTEuNkwxOS42OSAxMS43NWMtLjcxLS43MS0uMi0xLjkzLjgtMS45M2g4LjU4YTIuMjYgMi4yNiAwIDAgMCAyLjI3LTIuMjZWMS45YzAtLjYzLjUtMS4xMyAxLjEzLTEuMTNoMTEuM2MuNjMgMCAxLjE0LjUgMS4xNCAxLjEzeicvPjwvbWFzaz48ZyBmaWxsPSdub25lJz48ZyBtYXNrPSd1cmwoI1NWR083cDhIZU9EKScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMSA2Ljgpc2NhbGUoLjM5MyknPjxwYXRoIGZpbGw9JyMwMGY3ZjEnIGQ9J00wIDBoNjJ2NDZIMHonLz48ZyBmaWx0ZXI9J3VybCgjU1ZHRHBMVWZja1UpJz48ZWxsaXBzZSBjeD0nMzgnIGN5PSc0Ni43NCcgZmlsbD0nIzkzZmZmYycgcng9JzQuNjInIHJ5PScyMS41JyB0cmFuc2Zvcm09J3JvdGF0ZSgtOTAgMzggNDYuNzQpJy8%2BPC9nPjxnIGZpbHRlcj0ndXJsKCNTVkdEcExVZmNrVSknPjxlbGxpcHNlIGN4PSc1Ni4xOCcgY3k9JzQ0Ljc4JyBmaWxsPScjMDBmZjc5JyByeD0nNC42Micgcnk9JzIxLjUnIHRyYW5zZm9ybT0ncm90YXRlKDI0OC4zIDU2LjE4IDQ0Ljc4KScvPjwvZz48ZyBmaWx0ZXI9J3VybCgjU1ZHRHBMVWZja1UpJz48ZWxsaXBzZSBjeD0nMTkuOCcgY3k9JzQ0Ljc4JyBmaWxsPScjMDA2MGZmJyByeD0nNC42Micgcnk9JzIxLjUnIHRyYW5zZm9ybT0ncm90YXRlKC02OC4zIDE5LjggNDQuNzgpJy8%2BPC9nPjxnIGZpbHRlcj0ndXJsKCNTVkdEcExVZmNrVSknPjxlbGxpcHNlIGN4PSc0Ni41MycgY3k9JzI5LjY2JyBmaWxsPScjOTNmZmZjJyByeD0nMy43Micgcnk9JzYuMjcnIHRyYW5zZm9ybT0ncm90YXRlKDIyNC44IDQ2LjUzIDI5LjY2KScvPjwvZz48ZyBmaWx0ZXI9J3VybCgjU1ZHRHBMVWZja1UpJz48ZWxsaXBzZSBjeD0nNDguNDQnIGN5PScyNi4yMScgZmlsbD0nIzAwNjBmZicgcng9JzMuNzInIHJ5PSc2LjI3JyB0cmFuc2Zvcm09J3JvdGF0ZSgyMjQuOCA0OC40NCAyNi4yMSknLz48L2c%2BPGcgZmlsdGVyPSd1cmwoI1NWR0RwTFVmY2tVKSc%2BPGVsbGlwc2UgY3g9JzQ4LjA2JyBjeT0nNy4wNycgZmlsbD0nIzkzZmZmYycgcng9JzMuNzInIHJ5PSc2LjI3JyB0cmFuc2Zvcm09J3JvdGF0ZSgyMjQuOCA0OC4wNiA3LjA3KScvPjwvZz48ZyBmaWx0ZXI9J3VybCgjU1ZHRHBMVWZja1UpJz48ZWxsaXBzZSBjeD0nNDkuMjEnIGN5PSc1LjUzJyBmaWxsPScjMDA2MGZmJyByeD0nMy43Micgcnk9JzYuMjcnIHRyYW5zZm9ybT0ncm90YXRlKDIyNC44IDQ5LjIgNS41MyknLz48L2c%2BPGcgZmlsdGVyPSd1cmwoI1NWR0RwTFVmY2tVKSc%2BPGVsbGlwc2UgY3g9JzMwLjA2JyBjeT0nMzAuNDMnIGZpbGw9JyM5M2ZmZmMnIHJ4PSczLjcyJyByeT0nNi4yNycgdHJhbnNmb3JtPSdyb3RhdGUoLTQ0LjggMzAuMDYgMzAuNDMpJy8%2BPC9nPjxnIGZpbHRlcj0ndXJsKCNTVkdEcExVZmNrVSknPjxlbGxpcHNlIGN4PScyNy4zOCcgY3k9JzI2Ljk4JyBmaWxsPScjMDA2MGZmJyByeD0nMy43Micgcnk9JzYuMjcnIHRyYW5zZm9ybT0ncm90YXRlKC00NC44IDI3LjM4IDI2Ljk4KScvPjwvZz48ZyBmaWx0ZXI9J3VybCgjU1ZHRHBMVWZja1UpJz48ZWxsaXBzZSBjeD0nMjcuMzgnIGN5PSc3LjA3JyBmaWxsPScjOTNmZmZjJyByeD0nMy43Micgcnk9JzYuMjcnIHRyYW5zZm9ybT0ncm90YXRlKC00NC44IDI3LjM4IDcuMDcpJy8%2BPC9nPjxnIGZpbHRlcj0ndXJsKCNTVkdEcExVZmNrVSknPjxlbGxpcHNlIGN4PScyNycgY3k9JzQuNzcnIGZpbGw9JyMwMDYwZmYnIHJ4PSczLjcyJyByeT0nNi4yNycgdHJhbnNmb3JtPSdyb3RhdGUoLTQ0LjggMjcgNC43NyknLz48L2c%2BPGcgZmlsdGVyPSd1cmwoI1NWR0RwTFVmY2tVKSc%2BPGVsbGlwc2UgY3g9JzIzLjc2JyBjeT0nMTguMzUnIGZpbGw9JyMwMDYwZmYnIHJ4PSczLjcyJyByeT0nMTEuOTUnIHRyYW5zZm9ybT0ncm90YXRlKC00NC44IDIzLjc2IDE4LjM1KScvPjwvZz48ZyBmaWx0ZXI9J3VybCgjU1ZHRHBMVWZja1UpJz48ZWxsaXBzZSBjeD0nNTMuNTknIGN5PScxNS4yOScgZmlsbD0nIzAwZmY3OScgcng9JzMuNzInIHJ5PScxMS45NScgdHJhbnNmb3JtPSdyb3RhdGUoMjI0LjggNTMuNiAxNS4yOSknLz48L2c%2BPGcgZmlsdGVyPSd1cmwoI1NWR0RwTFVmY2tVKSc%2BPGVsbGlwc2UgY3g9JzM4JyBjeT0nNDguNjYnIGZpbGw9JyMwMDYwZmYnIHJ4PSc0LjYyJyByeT0nMjEuNScgdHJhbnNmb3JtPSdyb3RhdGUoLTkwIDM4IDQ4LjY2KScvPjwvZz48L2c%2BPHBhdGggZmlsbD0nI2ZmZicgZD0nTTMuNzIgNi44Qy4xIDExLjk4LjA4IDIwIDMuNzIgMjUuMmgyLjQ1Yy0zLjY0LTUuMi0zLjYyLTEzLjIyIDAtMTguNHptMjQuNTYgMGgtMi40NWMzLjYyIDUuMTggMy42NCAxMy4yIDAgMTguNGgyLjQ1YzMuNjQtNS4yIDMuNjItMTMuMjIgMC0xOC40Jy8%2BPGRlZnM%2BPGZpbHRlciBpZD0nU1ZHRHBMVWZja1UnIHdpZHRoPSc2JyBoZWlnaHQ9JzYnIHg9Jy0zJyB5PSctMyc%2BPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0nNC42Jy8%2BPC9maWx0ZXI%2BPC9kZWZzPjwvZz48L3N2Zz4%3D&labelColor=16171d)](https://oxc.rs/)
 [![sponsor](https://img.shields.io/badge/sponsor-EA4AAA?logo=githubsponsors&labelColor=FAFAFA)](https://github.com/sponsors/okineadev)

  [🐛 Report bug](https://github.com/okineadev/vitepress-plugin-llms/issues/new?template=bug-report.yml) • [Request feature ✨](https://github.com/okineadev/vitepress-plugin-llms/issues/new?template=feature-request.yml)
</div>
<!-- markdownlint-restore -->

<!-- prettier-ignore-end -->

## 📦 Installation

```bash
npm install vitepress-plugin-llms --save-dev
```

## 🛠️ Usage

Add the Vite plugin to your VitePress configuration (`.vitepress/config.ts`):

```ts
import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
  vite: {
    plugins: [llmstxt()]
  }
})
```

Now, thanks to this plugin, the LLM version of the website documentation is automatically generated

> [!NOTE]
>
> **For repositories with documentation in other languages:** Please do not use this plugin, only English documentation is enough for LLMs.

---

<!-- markdownlint-capture -->
<!-- markdownlint-disable no-inline-html -->

> [!TIP]
> You can add <kbd>📋 Copy as Markdown</kbd> and <kbd>📥 Download as Markdown</kbd> buttons for each page so that visitors can copy the page in Markdown format with just one click!
>
> <img src="./assets/copy-as-markdown-buttons-screenshot.png" width="400" alt="Screenshot">

<!-- markdownlint-restore -->

First, register a global component with buttons in `docs/.vitepress/theme/index.ts`:

```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import CopyOrDownloadAsMarkdownButtons from 'vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CopyOrDownloadAsMarkdownButtons', CopyOrDownloadAsMarkdownButtons)
  }
} satisfies Theme
```

And tell VitePress to use an additional Markdown plugin that will insert them:

```ts
import { defineConfig } from 'vitepress'
import { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'

export default defineConfig({
  // ...
  markdown: {
    config(md) {
      md.use(copyOrDownloadAsMarkdownButtons)
    }
  }
})
```

---

### ✅ Good practices

#### 1. Use `description` in the pages frontmatter

Typically, the list of pages in llms.txt is generated like this:

```markdown
- [Tailwind v4](/docs/tailwind-v4.md)
```

As you can see, it's not very clear what's on this page and what it's for

But you can insert `description` in frontmatter in the `docs/tailwind-v4.md` file:

```markdown
---
description: How to use shadcn-vue with Tailwind v4.
---

...
```

And the link in the generated `llms.txt` will display the page description:

```markdown
- [Tailwind v4](/docs/tailwind-v4.md): How to use shadcn-vue with Tailwind v4.
```

### Plugin Configuration

<!-- markdownlint-capture -->
<!-- markdownlint-disable no-inline-html -->

> [!NOTE]
> In most cases you **don't need** any additional configuration because **everything works out of the box**, but if you do need to customize it, please see your IDE hints or see <a href="src/types.d.ts">`src/types.d.ts`</a> or <a href="https://deepwiki.com/okineadev/vitepress-plugin-llms"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" align="center"/></a>

<!-- markdownlint-restore -->

### Extended markup for content management

#### Embedding content specifically for LLMs with `<llm-only>` tag

You can add a content that will be visible in files for LLMs, but invisible to humans, this can be useful for setting special instructions like "Refer to #basic-queries for demonstrations", "NEVER do ....", "ALWAYS use ... in case of ..." etc.

To do this, you need to wrap content with the `<llm-only>` tag:

```markdown
<llm-only>

## Section for LLMs

This content appears only in the generated LLMs files without the `<llm-only>` tag
</llm-only>
```

Or

```markdown
Check out the Plugins API Guide for documentation about creating plugins.

<llm-only>Note for LLM...</llm-only>
```

#### Excluding content for LLMs with the `<llm-exclude>` tag

You can add a content that will be visible in files for humans, but invisible to LLMs, opposite of `<llm-only>`:

```markdown
<llm-exclude>
## Section for humans

This content will not be in the generated files for LLMs
</llm-exclude>
```

Or

```markdown
Check out the Plugins API Guide for documentation about creating plugins.

<llm-exclude>Note only for humans</llm-exclude>
```

## 🚀 Why `vitepress-plugin-llms`?

LLMs (Large Language Models) are great at processing text, but traditional documentation formats can be too heavy and cluttered. `vitepress-plugin-llms` generates raw Markdown documentation that LLMs can efficiently process

The file structure in `.vitepress/dist` folder will be as follows:

```plaintext
📂 .vitepress/dist
├── ...
├── llms-full.txt            // A file where all the website documentation is compiled into one file
├── llms.txt                 // The main file for LLMs with all links to all sections of the documentation for LLMs
├── markdown-examples.html   // A human-friendly version of `markdown-examples` section in HTML format
└── markdown-examples.md     // A LLM-friendly version of `markdown-examples` section in Markdown format
```

### ✅ Key Features

- ⚡️ Easy integration with VitePress
- ✅ Zero config required, everything works out of the box
- ⚙️ Customizable
- 🤖 An LLM-friendly version is generated for each page
- 📝 Generates `llms.txt` with section links
- 📖 Generates `llms-full.txt` with all content in one file

## 📖 [llmstxt.org](https://llmstxt.org/) Standard

This plugin follows the [llmstxt.org](https://llmstxt.org/) standard, which defines the best practices for LLM-friendly documentation.

## ✨ Projects where this plugin is used

| Project                                                  |                                                                                   Stars                                                                                   |                      `llms.txt`                       |                         `llms-full.txt`                         |
| -------------------------------------------------------- | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------: | :-------------------------------------------------------------: |
| [**Vite**](https://vitejs.dev/)                          |           [![Stars](https://img.shields.io/github/stars/vitejs/vite?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/vitejs/vite)           |         [llms.txt](https://vite.dev/llms.txt)         |         [llms-full.txt](https://vite.dev/llms-full.txt)         |
| [**Vue.js**](https://vuejs.org/)                         |            [![Stars](https://img.shields.io/github/stars/vuejs/core?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/vuejs/core)            |        [llms.txt](https://vuejs.org/llms.txt)         |        [llms-full.txt](https://vuejs.org/llms-full.txt)         |
| [**Slidev**](https://sli.dev/)                           |       [![Stars](https://img.shields.io/github/stars/slidevjs/slidev?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/slidevjs/slidev)       |         [llms.txt](https://sli.dev/llms.txt)          |         [llms-full.txt](https://sli.dev/llms-full.txt)          |
| [**Elysia**](https://elysiajs.com/)                      |       [![Stars](https://img.shields.io/github/stars/elysiajs/elysia?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/elysiajs/elysia)       |       [llms.txt](https://elysiajs.com/llms.txt)       |       [llms-full.txt](https://elysiajs.com/llms-full.txt)       |
| [**Rolldown**](https://rolldown.rs/)                     |     [![Stars](https://img.shields.io/github/stars/rolldown/rolldown?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/rolldown/rolldown)     |       [llms.txt](https://rolldown.rs/llms.txt)        |       [llms-full.txt](https://rolldown.rs/llms-full.txt)        |
| [**shadcn/vue**](https://shadcn-vue.com/)                |     [![Stars](https://img.shields.io/github/stars/unovue/shadcn-vue?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/unovue/shadcn-vue)     |      [llms.txt](https://shadcn-vue.com/llms.txt)      |      [llms-full.txt](https://shadcn-vue.com/llms-full.txt)      |
| [**Fantastic-admin**](https://fantastic-admin.hurui.me/) | [![Stars](https://img.shields.io/github/stars/fantastic-admin/basic?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/fantastic-admin/basic) | [llms.txt](https://fantastic-admin.hurui.me/llms.txt) | [llms-full.txt](https://fantastic-admin.hurui.me/llms-full.txt) |
| [**Vue Macros**](https://vue-macros.dev/)                | [![Stars](https://img.shields.io/github/stars/vue-macros/vue-macros?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/vue-macros/vue-macros) |      [llms.txt](https://vue-macros.dev/llms.txt)      |      [llms-full.txt](https://vue-macros.dev/llms-full.txt)      |
| [**oRPC**](https://orpc.unnoq.com/)                      |            [![Stars](https://img.shields.io/github/stars/unnoq/orpc?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/unnoq/orpc)            |      [llms.txt](https://orpc.unnoq.com/llms.txt)      |      [llms-full.txt](https://orpc.unnoq.com/llms-full.txt)      |
| [**tsdown**](https://tsdown.dev/)                        |       [![Stars](https://img.shields.io/github/stars/rolldown/tsdown?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/rolldown/tsdown)       |        [llms.txt](https://tsdown.dev/llms.txt)        |        [llms-full.txt](https://tsdown.dev/llms-full.txt)        |
| [**GramIO**](https://gramio.dev/)                        |       [![Stars](https://img.shields.io/github/stars/gramiojs/gramio?style=flat&label=%E2%AD%90&labelColor=FAFAFA&color=212121)](https://github.com/gramiojs/gramio)       |        [llms.txt](https://gramio.dev/llms.txt)        |        [llms-full.txt](https://gramio.dev/llms-full.txt)        |

## ❤️ Support

If you like this project, consider supporting it by starring ⭐ it on GitHub, sharing it with your friends, or [buying me a coffee ☕](https://github.com/sponsors/okineadev)

## 🤝 Contributing

You can read the instructions for contributing here - [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📜 License

<!-- spell-checker:disable-next-line -->

[MIT License](./LICENSE) © 2025-present [Yurii Bogdan](https://github.com/okineadev)

## 👨‍🏭 Contributors

Thank you to everyone who helped with the project!

![Contributors](https://contributors-table.vercel.app/image?repo=okineadev/vitepress-plugin-llms&width=50&columns=15)

[![Sponsors](https://raw.githubusercontent.com/okineadev/static/main/sponsors.svg)](https://github.com/sponsors/okineadev)
