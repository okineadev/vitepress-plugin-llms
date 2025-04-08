<!-- markdownlint-capture -->
<!-- markdownlint-disable no-inline-html heading-start-left first-line-h1 -->
<div align="center">

  <a href="https://npmjs.com/package/vitepress-plugin-llms">
    <!-- https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#specifying-the-theme-an-image-is-shown-to -->
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
      <source media="(prefers-color-scheme: light)" srcset="assets/hero-light.png">
      <img src="assets/hero-dark.png" alt="Banner">
    </picture>
  </a>

  # 📜 vitepress-plugin-llms

  [![NPM Downloads](https://img.shields.io/npm/dw/vitepress-plugin-llms?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNNDgwLTMyMCAyODAtNTIwbDU2LTU4IDEwNCAxMDR2LTMyNmg4MHYzMjZsMTA0LTEwNCA1NiA1OC0yMDAgMjAwWk0xNjAtMTYwdi0yMDBoODB2MTIwaDQ4MHYtMTIwaDgwdjIwMEgxNjBaIi8%2BPC9zdmc%2B&labelColor=FAFAFA&color=212121)](https://www.npmjs.com/package/vitepress-plugin-llms) [![NPM Version](https://img.shields.io/npm/v/vitepress-plugin-llms?logo=npm&logoColor=212121&label=version&labelColor=FAFAFA&color=212121)](https://npmjs.com/package/vitepress-plugin-llms) [![Tests Status](https://img.shields.io/github/actions/workflow/status/okineadev/vitepress-plugin-llms/ci.yml?label=tests&labelColor=212121)](https://github.com/okineadev/vitepress-plugin-llms/actions/workflows/ci.yml) [![Built with Bun](https://img.shields.io/badge/Built_with-Bun-fbf0df?logo=bun&labelColor=212121)](https://bun.sh) [![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome&labelColor=212121)](https://biomejs.dev/) [![sponsor](https://img.shields.io/badge/sponsor-EA4AAA?logo=githubsponsors&labelColor=FAFAFA)](https://github.com/okineadev/vitepress-plugin-llms?sponsor=1)

  [🐛 Report bug](https://github.com/okineadev/vitepress-plugin-llms/issues/new?template=bug-report.yml) • [Request feature ✨](https://github.com/okineadev/vitepress-plugin-llms/issues/new?template=feature-request.yml)
</div>
<!-- markdownlint-restore -->

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

### Plugin Settings

See [`src/types.d.ts`](src/types.d.ts)

### Redirects (optional, but recommended ✅)

It is recommended to configure redirects so that AI can use addresses with both `.md` and `.txt` extensions

#### Netlify

`public/_redirects`:

```plaintext
/*.txt           /:splat.md 301
/llms.md         /llms.txt 301
/llms.txt        /llms.txt 200!
/llms-full.md    /llms-full.txt 200!
/llms-full.txt   /llms-full.txt 200!
```

<!-- markdownlint-disable-next-line -->
<sub>Syntax documentation: <https://docs.netlify.com/routing/redirects></sub>

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

- [**Slidev**](https://sli.dev/) - ![](https://img.shields.io/github/stars/slidevjs/slidev?style=social) - [llms.txt](https://sli.dev/llms.txt) | [llms-full.txt](https://sli.dev/llms-full.txt)
- [**Elysia**](https://elysiajs.com/) - ![](https://img.shields.io/github/stars/elysiajs/elysia?style=social) - [llms.txt](https://elysiajs.com/llms.txt) | [llms-full.txt](https://elysiajs.com/llms-full.txt)
- [**shadcn/vue**](https://shadcn-vue.com/) - ![](https://img.shields.io/github/stars/unovue/shadcn-vue?style=social) - [llms.txt](https://shadcn-vue.com/llms.txt) | [llms-full.txt](https://shadcn-vue.com/llms-full.txt)
- [**Vue Macros**](https://vue-macros.dev/) - ![](https://img.shields.io/github/stars/vue-macros/vue-macros?style=social) - [llms.txt](https://vue-macros.dev/llms.txt) | [llms-full.txt](https://vue-macros.dev/llms-full.txt)
- [**GramIO**](https://gramio.dev/) - ![](https://img.shields.io/github/stars/gramiojs/gramio?style=social) - [llms.txt](https://gramio.dev/llms.txt) | [llms-full.txt](https://gramio.dev/llms-full.txt)
- [**Fantastic-admin**](https://fantastic-admin.hurui.me/) - ![](https://img.shields.io/github/stars/fantastic-admin/basic?style=social) - [llms.txt](https://fantastic-admin.hurui.me/llms.txt) | [llms-full.txt](https://fantastic-admin.hurui.me/llms-full.txt)

## ❤️ Support

If you like this project, consider supporting it by starring ⭐ it on GitHub, sharing it with your friends, or [buying me a coffee ☕](https://github.com/okineadev/vitepress-plugin-llms?sponsor=1)

## 🤝 Contributing

You can read the instructions for contributing here - [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📜 License

[MIT License](./LICENSE) © 2025-present [Yurii Bogdan](https://github.com/okineadev)

## 👨‍🏭 Contributors

Thank you to everyone who helped with the project!

![Contributors](https://contributors-table.vercel.app/image?repo=okineadev/vitepress-plugin-llms&width=50&columns=10)
