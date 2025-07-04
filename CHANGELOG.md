# Changelog


## v1.6.0

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.5.1...v1.6.0)

### 🚀 Enhancements

- Add `README.md` to the `unnecessaryFilesList` ([b039dc2](https://github.com/okineadev/vitepress-plugin-llms/commit/b039dc2))
- ✨ add the ability to enable a buttons to instantly copy or download a page in Markdown format on the human documentation side ([4bb73e9](https://github.com/okineadev/vitepress-plugin-llms/commit/4bb73e9))
- Add hashed image support ([3ceea9e](https://github.com/okineadev/vitepress-plugin-llms/commit/3ceea9e))
- Add linting step to CI and setup `tsc` linting for `src/**/*.ts` ([52ee133](https://github.com/okineadev/vitepress-plugin-llms/commit/52ee133))
- Add ability to set a custom Vue component name for `copyOrDownloadAsMarkdownButtons` and fix comments ([1254c83](https://github.com/okineadev/vitepress-plugin-llms/commit/1254c83))

### 🩹 Fixes

- Fix build errors caused by 3ceea9eead27acfd5311630abe3e7e3b120da702 ([d75a57a](https://github.com/okineadev/vitepress-plugin-llms/commit/d75a57a))
- **ci:** Fix missing `@types/node` package error by removing `--production` from bun install ([1362166](https://github.com/okineadev/vitepress-plugin-llms/commit/1362166))
- **ci:** Do not omit optional dependencies in `bun install` ([b7a5865](https://github.com/okineadev/vitepress-plugin-llms/commit/b7a5865))
- **ci:** Checkout `biome.jsonc` file which is required for linting ([5ef8dd7](https://github.com/okineadev/vitepress-plugin-llms/commit/5ef8dd7))

### 💅 Refactors

- ♻️ refactor the "Copy as Markdown" button components and convert them to a Vue component ([2a3b001](https://github.com/okineadev/vitepress-plugin-llms/commit/2a3b001))
- **types:** Explicitly set types for all functions for `isolatedDeclarations` ([b2767f7](https://github.com/okineadev/vitepress-plugin-llms/commit/b2767f7))

### 📖 Documentation

- Add best practices section ([8a3c859](https://github.com/okineadev/vitepress-plugin-llms/commit/8a3c859))

### 🏡 Chore

- Update commitlint rules to enforce lower-case subject lines ([6a5aae2](https://github.com/okineadev/vitepress-plugin-llms/commit/6a5aae2))
- Update deps, migrate Biome configuration to `v2` and fix new linting errors ([a64fecb](https://github.com/okineadev/vitepress-plugin-llms/commit/a64fecb))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))
- Benjamin BERNARD <benjamin.bernard@benvii.com>

## v1.5.1

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.5.0...v1.5.1)

### 🩹 Fixes

- 🚑 fix index page resolving ([0461232](https://github.com/okineadev/vitepress-plugin-llms/commit/0461232))
- 🚑 normalize file paths in TOC generation and tests ([92f7ddf](https://github.com/okineadev/vitepress-plugin-llms/commit/92f7ddf))

### 💅 Refactors

- 🗃️ move sample Markdown documents for testing into separate `.md` files ([b0eca52](https://github.com/okineadev/vitepress-plugin-llms/commit/b0eca52))

### 📖 Documentation

- Add a note advising against use of this plugin in documentation repos for other languages ([5e95245](https://github.com/okineadev/vitepress-plugin-llms/commit/5e95245))

### 🤖 CI

- Fix failing tests ([fa248e6](https://github.com/okineadev/vitepress-plugin-llms/commit/fa248e6))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.5.0

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.4.0...v1.5.0)

### 🚀 Enhancements

- Add depth-based generation for hierarchical `llms.txt` files ([#59](https://github.com/okineadev/vitepress-plugin-llms/pull/59))

### 💅 Refactors

- Do not repeat `stripExt` functions ([d7dda58](https://github.com/okineadev/vitepress-plugin-llms/commit/d7dda58))
- Move devserver middleware back to `src/index.ts` ([cd0b8f5](https://github.com/okineadev/vitepress-plugin-llms/commit/cd0b8f5))

### 📖 Documentation

- Add "Ask DeepWiki" badge ([110319d](https://github.com/okineadev/vitepress-plugin-llms/commit/110319d))

### ❤️ Contributors

- Max <maximogarciamtnez@gmail.com>
- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.4.0

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.3.4...v1.4.0)

### 🚀 Enhancements

- Implement VitePress `rewrites` support ([6c8f5f1](https://github.com/okineadev/vitepress-plugin-llms/commit/6c8f5f1))

### 🩹 Fixes

- Fix sidebar file path resolving and add support for `base` sidebar parameter ([#51](https://github.com/okineadev/vitepress-plugin-llms/pull/51))

### 📖 Documentation

- Remove redirects instructions ([1cfecba](https://github.com/okineadev/vitepress-plugin-llms/commit/1cfecba))
- Stretch the contributor list image from `10` columns to `15` ([a3554c6](https://github.com/okineadev/vitepress-plugin-llms/commit/a3554c6))

### 🏡 Chore

- Migrate back to Renovate ([8c258f2](https://github.com/okineadev/vitepress-plugin-llms/commit/8c258f2))
- Use `files` field in `package.json` instead of tricks with `.npmignore` ([3597f4f](https://github.com/okineadev/vitepress-plugin-llms/commit/3597f4f))
- Improve Renovate configuration ([0dbbabb](https://github.com/okineadev/vitepress-plugin-llms/commit/0dbbabb))
- **actions:** Pin dependencies ([#54](https://github.com/okineadev/vitepress-plugin-llms/pull/54))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))
- Gilad S. ([@giladgd](https://github.com/giladgd))

## v1.3.4

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.3.3...v1.3.4)

### 💅 Refactors

- Refactor the regexs ([7ed052a](https://github.com/okineadev/vitepress-plugin-llms/commit/7ed052a))

### 🏡 Chore

- Improve `bug-report` template ([5c5c518](https://github.com/okineadev/vitepress-plugin-llms/commit/5c5c518))
- **readme:** Remove GitAds ([b4ef2f9](https://github.com/okineadev/vitepress-plugin-llms/commit/b4ef2f9))

### 🤖 CI

- Refactor tests, disable Windows tests by default ([d9f776c](https://github.com/okineadev/vitepress-plugin-llms/commit/d9f776c))
- Run tests also on Windows before release by default if they were set to run ([9daf916](https://github.com/okineadev/vitepress-plugin-llms/commit/9daf916))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.3.3

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.3.2...v1.3.3)

### 🩹 Fixes

- 🚑 rollback `bunup` to version `0.5.14` ([ea7569c](https://github.com/okineadev/vitepress-plugin-llms/commit/ea7569c))
- Fix `vitePressPlease` plugin ([2a7b0ff](https://github.com/okineadev/vitepress-plugin-llms/commit/2a7b0ff))
- Install `markdown-it` for tests ([5b0fbae](https://github.com/okineadev/vitepress-plugin-llms/commit/5b0fbae))
- **ci:** Fix failing tests ([1951f67](https://github.com/okineadev/vitepress-plugin-llms/commit/1951f67))
- ⚙️ fix functionality that removes `<llm-(only ([exclude)>` tags from human documentation](https://github.com/okineadev/vitepress-plugin-llms/commit/exclude)>` tags from human documentation))
- Remove `markdown-it` from `devDependencies` ([a4fa0fa](https://github.com/okineadev/vitepress-plugin-llms/commit/a4fa0fa))

### 💅 Refactors

- Refactor and simplify the code ([82fede3](https://github.com/okineadev/vitepress-plugin-llms/commit/82fede3))

### 🏡 Chore

- **formatting:** Set max line width to `110` ([3244253](https://github.com/okineadev/vitepress-plugin-llms/commit/3244253))
- Dont git blame commit 3244253b2ebc368e6afaa67a93a930191e77553e ([7bf7f1b](https://github.com/okineadev/vitepress-plugin-llms/commit/7bf7f1b))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))
- E819d12 <Okinea Dev>

## v1.3.2

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.3.1...v1.3.2)

### 🩹 Fixes

- Return `enforce: 'post'` back ([3050415](https://github.com/okineadev/vitepress-plugin-llms/commit/3050415))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.3.1

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.3.0...v1.3.1)

### 🩹 Fixes

- **workflows:** Correct condition for running tests in `release.yml` ([4efa02c](https://github.com/okineadev/vitepress-plugin-llms/commit/4efa02c))
- **`package.json`:** 🚑 return `exports` field back ([8b859a9](https://github.com/okineadev/vitepress-plugin-llms/commit/8b859a9))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.3.0

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.2.0...v1.3.0)

### 🚀 Enhancements

- ♻️ exclude some unnecessary pages by default to save tokens ([6f84799](https://github.com/okineadev/vitepress-plugin-llms/commit/6f84799))

### 🩹 Fixes

- Fix potential `undefined` reference errors ([#44](https://github.com/okineadev/vitepress-plugin-llms/pull/44))
- **ci:** Return changelog generation back ([e1b2fa7](https://github.com/okineadev/vitepress-plugin-llms/commit/e1b2fa7))

### 🏡 Chore

- **workflows:** Simplify `release` workflow ([bc7e72d](https://github.com/okineadev/vitepress-plugin-llms/commit/bc7e72d))
- **`package.json`:** Remove `exports` field and `main` entry ([78bc5d5](https://github.com/okineadev/vitepress-plugin-llms/commit/78bc5d5))
- **workflows:** Improve `run-tests` input description in `release.yml` ([153dded](https://github.com/okineadev/vitepress-plugin-llms/commit/153dded))

### 🤖 CI

- Dont generate `CHANGELOG.md` ([5919119](https://github.com/okineadev/vitepress-plugin-llms/commit/5919119))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))
- WChenonly ([@wChenonly](https://github.com/wChenonly))

