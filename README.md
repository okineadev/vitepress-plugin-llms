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

  [![NPM Downloads](https://img.shields.io/npm/dw/vitepress-plugin-llms?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNNDgwLTMyMCAyODAtNTIwbDU2LTU4IDEwNCAxMDR2LTMyNmg4MHYzMjZsMTA0LTEwNCA1NiA1OC0yMDAgMjAwWk0xNjAtMTYwdi0yMDBoODB2MTIwaDQ4MHYtMTIwaDgwdjIwMEgxNjBaIi8%2BPC9zdmc%2B&labelColor=FAFAFA&color=212121)](https://www.npmjs.com/package/vitepress-plugin-llms) [![NPM Version](https://img.shields.io/npm/v/vitepress-plugin-llms?logo=npm&logoColor=212121&label=version&labelColor=FAFAFA&color=212121)](https://npmjs.com/package/vitepress-plugin-llms) [![Tests Status](https://img.shields.io/github/actions/workflow/status/okineadev/vitepress-plugin-llms/ci.yml?label=tests&labelColor=212121)](https://github.com/okineadev/vitepress-plugin-llms/actions/workflows/ci.yml) [![Built with Bun](https://img.shields.io/badge/Built_with-Bun-fbf0df?logo=bun&labelColor=212121)](https://bun.sh) [![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome&labelColor=212121)](https://biomejs.dev/) [![sponsor](https://img.shields.io/badge/sponsor-EA4AAA?logo=githubsponsors&labelColor=FAFAFA)](https://github.com/sponsors/okineadev)

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

### Plugin Settings

<!-- markdownlint-capture -->
<!-- markdownlint-disable no-inline-html -->

See <a href="src/types.d.ts">`src/types.d.ts`</a> or <a href="https://deepwiki.com/okineadev/vitepress-plugin-llms"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" align="center"/></a>

<!-- markdownlint-restore -->

#### Example Configuration

Here is an example of how to configure the plugin with custom settings:

```ts
import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
  vite: {
    plugins: [
      llmstxt({
        generateLLMsFullTxt: false,
        ignoreFiles: ['sponsors/*'],
        customLLMsTxtTemplate: `# {title}\n\n{foo}`,
        title: 'Awesome tool',
        customTemplateVariables: {
          foo: 'bar'
        },
        experimental: {
          depth: 2 // Generate llms.txt and llms-full.txt in root and first-level subdirectories
        }
      })
    ]
  }
})
```

This configuration does the following:

- `generateLLMsFullTxt: false`: Disables the generation of the `llms-full.txt` file.
- `ignoreFiles: ['sponsors/*']`: Ignores all files in the `sponsors` directory.
- `customLLMsTxtTemplate`: Uses a custom template for the `llms.txt` file.
- `title`: Sets a custom header in `llms.txt`, for your custom variables use `customTemplateVariables`.
- `customTemplateVariables`: Sets custom variables for the template, replaces `{foo}` with `bar`.
- `experimental: { depth: 2 }`: Generates both `llms.txt` and `llms-full.txt` files in the root directory and all first-level subdirectories, with each directory containing only files from that specific directory and its subdirectories.

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

### 🔄 Dynamic Routes Support

The plugin automatically supports VitePress [dynamic routes](https://vitepress.dev/guide/routing#dynamic-routes), which allow you to generate multiple pages from a single template using route parameters.

**Dynamic routes are automatically included** in `llms.txt`, `llms-full.txt`, and as individual markdown files without any additional configuration!

#### Example: Package Documentation

Create a dynamic route template `packages/[pkg].md`:

```markdown
---
title: "{{ $params.pkg }} Documentation"
---

# {{ $params.pkg }}

Documentation for {{ $params.pkg }} package.
```

And a paths loader `packages/[pkg].paths.js`:

```js
export default {
  paths() {
    return [
      { params: { pkg: 'vitepress' }},
      { params: { pkg: 'vue' }},
      { params: { pkg: 'vite' }}
    ]
  }
}
```

This automatically generates:
- ✅ `packages/vitepress.md` with title "vitepress"
- ✅ `packages/vue.md` with title "vue"
- ✅ `packages/vite.md` with title "vite"
- ✅ All routes appear in `llms.txt` table of contents
- ✅ Full content included in `llms-full.txt`

#### CMS Integration

Dynamic routes work great with CMS integration using the `content` property:

```js
export default {
  async paths() {
    const posts = await fetch('https://my-cms.com/api/posts').then(r => r.json())

    return posts.map(post => ({
      params: {
        id: post.id,
        title: post.title,
        author: post.author
      },
      content: post.content // Raw Markdown or HTML from CMS
    }))
  }
}
```

The plugin will:
- ✅ Process all dynamically generated routes
- ✅ Extract titles from params or content
- ✅ Apply all markdown transformations (HTML stripping, llm-only tags, etc.)
- ✅ Include routes in llms.txt with proper descriptions

#### Disabling Dynamic Routes

If you want to exclude dynamic routes from LLM documentation:

```ts
llmstxt({
  includeDynamicRoutes: false
})
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
- 🔄 Automatic support for VitePress dynamic routes and CMS integration

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
