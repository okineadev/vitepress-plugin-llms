# Changelog


## v1.1.2

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.1.1...v1.1.2)

### 📖 Documentation

- Update readme ([f7081db](https://github.com/okineadev/vitepress-plugin-llms/commit/f7081db))
- Update readme ([eef8410](https://github.com/okineadev/vitepress-plugin-llms/commit/eef8410))

### 🏡 Chore

- Update dependabot configuration ([ba38489](https://github.com/okineadev/vitepress-plugin-llms/commit/ba38489))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.1.1

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.1.0...v1.1.1)

### 🩹 Fixes

- **ci:** Fix ci errors ([e4b6162](https://github.com/okineadev/vitepress-plugin-llms/commit/e4b6162))

### 💅 Refactors

- Import `Plugin` from `vite` instead of `vitepress` ([#22](https://github.com/okineadev/vitepress-plugin-llms/pull/22))
- Make it more async ([9524c64](https://github.com/okineadev/vitepress-plugin-llms/commit/9524c64))

### 📖 Documentation

- Use badges to display the GitHub star count ([#20](https://github.com/okineadev/vitepress-plugin-llms/pull/20))
- Add oRPC to the list of projects that use this plugin ([#21](https://github.com/okineadev/vitepress-plugin-llms/pull/21))
- Add gitads ([5f79f81](https://github.com/okineadev/vitepress-plugin-llms/commit/5f79f81))
- Fix netlify redirects ([cee0ac5](https://github.com/okineadev/vitepress-plugin-llms/commit/cee0ac5))

### 🏡 Chore

- Use Prettier for markdown formatting ([2006cd5](https://github.com/okineadev/vitepress-plugin-llms/commit/2006cd5))
- Migrate to faster `bunup` ([943e1c3](https://github.com/okineadev/vitepress-plugin-llms/commit/943e1c3))
- Migrate from Renovate to Dependabot ([0e7c9c5](https://github.com/okineadev/vitepress-plugin-llms/commit/0e7c9c5))
- Remove Renovate configuration ([013763f](https://github.com/okineadev/vitepress-plugin-llms/commit/013763f))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))
- Kevin Deng 三咲智子 <sxzz@sxzz.moe>
- Unnoq <dinwwwh@gmail.com>
- Hooray Hu ([@hooray](https://github.com/hooray))

## v1.1.0

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.0.5...v1.1.0)

### 🚀 Enhancements

- ✨ clean Markdown with `remark` by default ([5a844f0](https://github.com/okineadev/vitepress-plugin-llms/commit/5a844f0))

### 🩹 Fixes

- Do not add `.md` extension to each link in `llms.txt` if `generateLLMFriendlyDocsForEachPage` option is disabled ([577cae6](https://github.com/okineadev/vitepress-plugin-llms/commit/577cae6))

### 🏡 Chore

- Update TSDoc in `generateTOCLink` function ([343ba46](https://github.com/okineadev/vitepress-plugin-llms/commit/343ba46))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.0.5

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.0.4...v1.0.5)

### 🩹 Fixes

- Move `@actions/github-script` from `optionalDependencies` to `devDependencies` ([540768b](https://github.com/okineadev/vitepress-plugin-llms/commit/540768b))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.0.4

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.0.3...v1.0.4)

### 🔥 Performance

- ⚡speed up file processing with asynchronous processing ([20b7298](https://github.com/okineadev/vitepress-plugin-llms/commit/20b7298))

### 🩹 Fixes

- Do not output files to `/guide/index.md`, instead output to `/guide.md` ([40c7e7a](https://github.com/okineadev/vitepress-plugin-llms/commit/40c7e7a))

### 🏡 Chore

- Add additional keywords to `package.json` ([6c98059](https://github.com/okineadev/vitepress-plugin-llms/commit/6c98059))

### 🤖 CI

- Create `codeql.yml` ([9357ddb](https://github.com/okineadev/vitepress-plugin-llms/commit/9357ddb))
- Fix `pr-title.yml` and `pr-closed.yml` triggers ([46617e6](https://github.com/okineadev/vitepress-plugin-llms/commit/46617e6))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.0.3

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.0.2...v1.0.3)

### 🩹 Fixes

- Fix lockfile ([5da3ed2](https://github.com/okineadev/vitepress-plugin-llms/commit/5da3ed2))

### 💅 Refactors

- 📰 improve logging and display approximate token size and size of `llms.txt` and `llms-full.txt` files ([5e639b5](https://github.com/okineadev/vitepress-plugin-llms/commit/5e639b5))

### 🤖 CI

- Omit optional bun dependencies in `tests.yml` ([686293e](https://github.com/okineadev/vitepress-plugin-llms/commit/686293e))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.0.2

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.0.1...v1.0.2)

### 🩹 Fixes

- Correctly match sidebar paths and file paths ([551610c](https://github.com/okineadev/vitepress-plugin-llms/commit/551610c))
- Fix `check-previous-workflow` step in `release.yml` ([1d39493](https://github.com/okineadev/vitepress-plugin-llms/commit/1d39493))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.0.1

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.0.0...v1.0.1)

### 🩹 Fixes

- **ci:** Fix `check-previous-workflow` step in `release.yml` ([546aee1](https://github.com/okineadev/vitepress-plugin-llms/commit/546aee1))
- Trim title description in links ([16ead9a](https://github.com/okineadev/vitepress-plugin-llms/commit/16ead9a))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v1.0.0

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.22...v1.0.0)

### 🚀 Enhancements

- Add option `generateLLMFriendlyDocsForEachPage` which determines whether to generate LLM-friendly version of documentation for each page ([f63d926](https://github.com/okineadev/vitepress-plugin-llms/commit/f63d926))
- Add `sidebar` option for manual sidebar setting ([308bb78](https://github.com/okineadev/vitepress-plugin-llms/commit/308bb78))

### 🔥 Performance

- **ci:** Speed up bun package loading speed in `tests.yml` ([62281fe](https://github.com/okineadev/vitepress-plugin-llms/commit/62281fe))

### 🩹 Fixes

- **ci:** Fix the path of the script that needs to be loaded in `release.yml` ([0c56c94](https://github.com/okineadev/vitepress-plugin-llms/commit/0c56c94))
- Fix title parsing ([06a8c2d](https://github.com/okineadev/vitepress-plugin-llms/commit/06a8c2d))
- **ci:** Add `--ignore-scripts` flag for `bun install` ([b120281](https://github.com/okineadev/vitepress-plugin-llms/commit/b120281))
- Process `sidebar` according to its original structure ([e59d6f5](https://github.com/okineadev/vitepress-plugin-llms/commit/e59d6f5))

### 💅 Refactors

- **tests:** Refactor tests by the DRY principle ([e401465](https://github.com/okineadev/vitepress-plugin-llms/commit/e401465))
- **ci:** Refactor actions a bit ([58dbb41](https://github.com/okineadev/vitepress-plugin-llms/commit/58dbb41))

### 🏡 Chore

- Update `bun.lock` ([238766a](https://github.com/okineadev/vitepress-plugin-llms/commit/238766a))

### 🤖 CI

- Add network tweaks for Windows to `tests.yml` ([f2a0dab](https://github.com/okineadev/vitepress-plugin-llms/commit/f2a0dab))
- More network tweaks for Windows tests ([e23e2f7](https://github.com/okineadev/vitepress-plugin-llms/commit/e23e2f7))
- Skip CI if commit message have [skip-ci] tag ([e774e79](https://github.com/okineadev/vitepress-plugin-llms/commit/e774e79))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.22

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.21...v0.0.22)

### 🩹 Fixes

- **ci:** Rewrite the script for checking the tests of the current commit that runs `release.yml` in JS ([fb67209](https://github.com/okineadev/vitepress-plugin-llms/commit/fb67209))
- Fix a bug where all child links in the root section were duplicated ([17e73ba](https://github.com/okineadev/vitepress-plugin-llms/commit/17e73ba))
- Fix a bug where even if you specify a file description in frontmatter, the link in `llms.txt` still doesn't have a description ([2732122](https://github.com/okineadev/vitepress-plugin-llms/commit/2732122))

### 💅 Refactors

- ♻️ refactor project structure ([f486dac](https://github.com/okineadev/vitepress-plugin-llms/commit/f486dac))
- Insert `llms.txt` default description in `{details}` instead of `{description}` ([0352080](https://github.com/okineadev/vitepress-plugin-llms/commit/0352080))

### 📖 Documentation

- Add https://github.com/slidevjs/slidev to the list of projects that use this plugin ([2f6056f](https://github.com/okineadev/vitepress-plugin-llms/commit/2f6056f))

### 🏡 Chore

- Add `.editorconfig` ([b2886c8](https://github.com/okineadev/vitepress-plugin-llms/commit/b2886c8))
- Update MIME type for documentation for LLMs in dev server and add encoding ([1bb23bb](https://github.com/okineadev/vitepress-plugin-llms/commit/1bb23bb))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.21

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.20...v0.0.21)

### 🩹 Fixes

- Fix bug when vitepress `sidebar` is an object and section headers in `llms.txt` are not generated ([98bd967](https://github.com/okineadev/vitepress-plugin-llms/commit/98bd967))

### 💅 Refactors

- **ci:** Move the script for checking tests in `release.yml` to a separate file ([d534260](https://github.com/okineadev/vitepress-plugin-llms/commit/d534260))

### 🤖 CI

- Configure `release.yml` authentication to allow pushing to the `main` branch ([247fac2](https://github.com/okineadev/vitepress-plugin-llms/commit/247fac2))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.20

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.16...v0.0.20)

### 🚀 Enhancements

- Simplify the plugin configuration experience ([6d9cec3](https://github.com/okineadev/vitepress-plugin-llms/commit/6d9cec3))
- Add `domain` option to attach domain to links in `llms.txt`, `llms-full.txt` and context links ([b05688c](https://github.com/okineadev/vitepress-plugin-llms/commit/b05688c))
- Automatically generate sections according to VitePress `sidebar` configuration ([ff351e5](https://github.com/okineadev/vitepress-plugin-llms/commit/ff351e5))

### 🩹 Fixes

- 🚑 fix missing TOC issue ([38736b6](https://github.com/okineadev/vitepress-plugin-llms/commit/38736b6))

### 📖 Documentation

- Add instructions for configuring Netlify redirects ([3765f6f](https://github.com/okineadev/vitepress-plugin-llms/commit/3765f6f))
- Add websites that use this plugin to the README ([#11](https://github.com/okineadev/vitepress-plugin-llms/pull/11))

### 🏡 Chore

- Update package description ([3518894](https://github.com/okineadev/vitepress-plugin-llms/commit/3518894))
- Add a note that `domain` cannot end with `/` ([bee2a73](https://github.com/okineadev/vitepress-plugin-llms/commit/bee2a73))

### 🤖 CI

- Run `pkg.pr.new` only from this repository ([255b024](https://github.com/okineadev/vitepress-plugin-llms/commit/255b024))
- ♻️ do not run tests in `release.yml` if they have already been passed in the current commit ([1e984b8](https://github.com/okineadev/vitepress-plugin-llms/commit/1e984b8))
- Do not trigger `pr-title` and `pr-closed` if the author is `renovate[bot]` ([9dc1f29](https://github.com/okineadev/vitepress-plugin-llms/commit/9dc1f29))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))
- Kravets ([@kravetsone](https://github.com/kravetsone))

## v0.0.16

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.15...v0.0.16)

### 🩹 Fixes

- Fix parsing of titles for TOC in `llms.txt` ([df3b580](https://github.com/okineadev/vitepress-plugin-llms/commit/df3b580))
- Fix `templateVariable` regexp ([00e2ea5](https://github.com/okineadev/vitepress-plugin-llms/commit/00e2ea5))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.15

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.14...v0.0.15)

### 🚀 Enhancements

- Add support for link details in `llms.txt` ([2524b6b](https://github.com/okineadev/vitepress-plugin-llms/commit/2524b6b))

### 🏡 Chore

- Improve types ([b7845e0](https://github.com/okineadev/vitepress-plugin-llms/commit/b7845e0))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.14

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.13...v0.0.14)

### 🩹 Fixes

- Fix reading user config ([7223cb3](https://github.com/okineadev/vitepress-plugin-llms/commit/7223cb3))
- Temporarily remove html stripping ([ce8c1c1](https://github.com/okineadev/vitepress-plugin-llms/commit/ce8c1c1))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.13

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.12...v0.0.13)

### 🚀 Enhancements

- Trim HTML by default for cleaner documentation ([bdfff78](https://github.com/okineadev/vitepress-plugin-llms/commit/bdfff78))

### 📖 Documentation

- Add a links for reporting a bug or requesting a feature ([6b5a289](https://github.com/okineadev/vitepress-plugin-llms/commit/6b5a289))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.12

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.11...v0.0.12)

### 🏡 Chore

- Ship both `esm` and `cjs` ([d567004](https://github.com/okineadev/vitepress-plugin-llms/commit/d567004))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.11

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.10...v0.0.11)

### 🚀 Enhancements

- Improve extracting headers from files ([3facf27](https://github.com/okineadev/vitepress-plugin-llms/commit/3facf27))
- Add support for optional details section and improve variable replacement functionality in the template ([b6b8888](https://github.com/okineadev/vitepress-plugin-llms/commit/b6b8888))

### 📖 Documentation

- Add "Contributors" sections in the readme ([aa93bb4](https://github.com/okineadev/vitepress-plugin-llms/commit/aa93bb4))
- Improve readme ([0546c31](https://github.com/okineadev/vitepress-plugin-llms/commit/0546c31))
- Fix file tree syntax highlighting ([f24a427](https://github.com/okineadev/vitepress-plugin-llms/commit/f24a427))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.10

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.9...v0.0.10)

### 🩹 Fixes

- Fix error with incorrect reading of frontmatter if `index.md` is not included in `ignoreFiles` ([7ce7194](https://github.com/okineadev/vitepress-plugin-llms/commit/7ce7194))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.9

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.8...v0.0.9)

### 🚀 Enhancements

- Add new  `customTemplateVariables` option ([bd9476b](https://github.com/okineadev/vitepress-plugin-llms/commit/bd9476b))

### 🔥 Performance

- **ci:** ⚡ try to speed up Windows tests by downgrading runner version to `windows-2019` ([d0054ab](https://github.com/okineadev/vitepress-plugin-llms/commit/d0054ab))
- **ci:** ⚡ try to speed up Windows tests (again) ([2a0f1bd](https://github.com/okineadev/vitepress-plugin-llms/commit/2a0f1bd))
- **ci:** ⚡ try to speed up Windows tests ([94b2b5d](https://github.com/okineadev/vitepress-plugin-llms/commit/94b2b5d))

### 🩹 Fixes

- **ci:** Fix `tests.yml` ([621afde](https://github.com/okineadev/vitepress-plugin-llms/commit/621afde))
- **ci:** Fix `WINDOWS_USERPROFILE` env variable in `tests.yml` ([812be07](https://github.com/okineadev/vitepress-plugin-llms/commit/812be07))
- **ci:** Fix `tests.yml` ([e7e1e91](https://github.com/okineadev/vitepress-plugin-llms/commit/e7e1e91))

### 💅 Refactors

- **ci:** ♻️ refactor `tests.yml` ([b5364a6](https://github.com/okineadev/vitepress-plugin-llms/commit/b5364a6))
- Refactor types ([61b6ef3](https://github.com/okineadev/vitepress-plugin-llms/commit/61b6ef3))

### 📖 Documentation

- Fix badge links 🙈 ([982b1b6](https://github.com/okineadev/vitepress-plugin-llms/commit/982b1b6))
- Add contributing guidelines ([7517047](https://github.com/okineadev/vitepress-plugin-llms/commit/7517047))
- Fix heading in `CONTRIBUTING.md` ([5717e5a](https://github.com/okineadev/vitepress-plugin-llms/commit/5717e5a))
- Add a light version of the banner ([69589c1](https://github.com/okineadev/vitepress-plugin-llms/commit/69589c1))
- Add example configuration in the readme ([2c09116](https://github.com/okineadev/vitepress-plugin-llms/commit/2c09116))

### 🏡 Chore

- 🗑️ remove unused folders ([72e76a6](https://github.com/okineadev/vitepress-plugin-llms/commit/72e76a6))
- 🍱 rename `assets/banner.png` to `assets/hero.png` ([65e06a9](https://github.com/okineadev/vitepress-plugin-llms/commit/65e06a9))
- **assets:** Fix `assets/hero-light.png` background color ([ebef9dc](https://github.com/okineadev/vitepress-plugin-llms/commit/ebef9dc))
- Use `>` before description in `llms.txt` ([ef1335f](https://github.com/okineadev/vitepress-plugin-llms/commit/ef1335f))

### 🤖 CI

- 🛡️ improve workflows security ([2b92609](https://github.com/okineadev/vitepress-plugin-llms/commit/2b92609))
- 🍎 setup `macos` tests ([c1adebb](https://github.com/okineadev/vitepress-plugin-llms/commit/c1adebb))
- Enhance concurrency for auto-cancellation of outdated tests ([1438361](https://github.com/okineadev/vitepress-plugin-llms/commit/1438361))
- Make shorter `pkg.pr.new` package link ([f6001d4](https://github.com/okineadev/vitepress-plugin-llms/commit/f6001d4))

### ❤️ Contributors

- Okinea Dev <hi@okinea.dev>

## v0.0.8

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.7...v0.0.8)

### 🩹 Fixes

- Fix a few bugs ([eb51df4](https://github.com/okineadev/vitepress-plugin-llms/commit/eb51df4))
- Fix several bugs and improve types ([5ec5155](https://github.com/okineadev/vitepress-plugin-llms/commit/5ec5155))
- **ci:** Fix CI triggers ([c516533](https://github.com/okineadev/vitepress-plugin-llms/commit/c516533))

### 📖 Documentation

- Add cool badges ([b024d98](https://github.com/okineadev/vitepress-plugin-llms/commit/b024d98))

### 🏡 Chore

- 💡 improve TSDoc comments ([a8b719d](https://github.com/okineadev/vitepress-plugin-llms/commit/a8b719d))

### 🤖 CI

- Replace `bun-version-file` with `bun-version` ([e614a52](https://github.com/okineadev/vitepress-plugin-llms/commit/e614a52))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.7

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.6...v0.0.7)

### 🩹 Fixes

- 🚑 fix `ignoreFiles` ([143ac77](https://github.com/okineadev/vitepress-plugin-llms/commit/143ac77))
- 🚑 fix issue with missing title and description when `index.md` file is excluded ([cac5690](https://github.com/okineadev/vitepress-plugin-llms/commit/cac5690))

### 🤖 CI

- ♻️ optimize workflows ([1b069e4](https://github.com/okineadev/vitepress-plugin-llms/commit/1b069e4))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.6

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.5...v0.0.6)

### 🩹 Fixes

- 🚑 fix a few bugs ([f53645b](https://github.com/okineadev/vitepress-plugin-llms/commit/f53645b))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.5

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.4...v0.0.5)

### 🚀 Enhancements

- Add `customLLMsTxtTemplate` option ([65fb933](https://github.com/okineadev/vitepress-plugin-llms/commit/65fb933))

### 📖 Documentation

- Remove the note that the project is not recommended for use in production because almost all of the plugin's functionality is ready ([b366442](https://github.com/okineadev/vitepress-plugin-llms/commit/b366442))

### 🎨 Styles

- Minor formatting improvements ([5c1f7d3](https://github.com/okineadev/vitepress-plugin-llms/commit/5c1f7d3))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.4

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.3...v0.0.4)

### 🚀 Enhancements

- Add frontmatter to generated data files for better navigation ([180b252](https://github.com/okineadev/vitepress-plugin-llms/commit/180b252))

### 🩹 Fixes

- **docs:** Load banner from GitHub instead of file ([132387c](https://github.com/okineadev/vitepress-plugin-llms/commit/132387c))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.3

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.2...v0.0.3)

### 🚀 Enhancements

- **ci:** 🪟 add windows tests ([d1e946d](https://github.com/okineadev/vitepress-plugin-llms/commit/d1e946d))

### 🩹 Fixes

- 🛂 use `minimatch` for ignoring files ([a381566](https://github.com/okineadev/vitepress-plugin-llms/commit/a381566))
- **ci:** Fix windows tests ([17efe5e](https://github.com/okineadev/vitepress-plugin-llms/commit/17efe5e))
- Fix TOC link generation to ensure consistent path across OS ([#7](https://github.com/okineadev/vitepress-plugin-llms/pull/7))
- **ci:** Run `pkg-pr-new` only after all tests ([f365ac9](https://github.com/okineadev/vitepress-plugin-llms/commit/f365ac9))

### 📖 Documentation

- 🍱  add banner in the readme ([5d4f33b](https://github.com/okineadev/vitepress-plugin-llms/commit/5d4f33b))
- Use banner with rounded corners ([4a7d796](https://github.com/okineadev/vitepress-plugin-llms/commit/4a7d796))

### 🏡 Chore

- Improve banner ([31c01d6](https://github.com/okineadev/vitepress-plugin-llms/commit/31c01d6))
- **docs:** Add link for the banner ([c7382f3](https://github.com/okineadev/vitepress-plugin-llms/commit/c7382f3))

### 🤖 CI

- ✅ add reusable `tests.yml` workflow ([8f8a150](https://github.com/okineadev/vitepress-plugin-llms/commit/8f8a150))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))
- Kravets ([@kravetsone](https://github.com/kravetsone))

## v0.0.2

[compare changes](https://github.com/okineadev/vitepress-plugin-llms/compare/v0.0.1...v0.0.2)

### 🩹 Fixes

- Fix `package.json` ([3c95d24](https://github.com/okineadev/vitepress-plugin-llms/commit/3c95d24))
- 🚑 fix links in `llms.txt` ([5cb8007](https://github.com/okineadev/vitepress-plugin-llms/commit/5cb8007))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))

## v0.0.1


### 🚀 Enhancements

- ⚙️ add `ignoreFiles` option ([#6](https://github.com/okineadev/vitepress-plugin-llms/pull/6))

### 🩹 Fixes

- Use resolved path when collecting content for llms-full.txt ([#3](https://github.com/okineadev/vitepress-plugin-llms/pull/3))
- **ci:** Run pr title checker workflow only if pr title changed ([386e08b](https://github.com/okineadev/vitepress-plugin-llms/commit/386e08b))
- Move `.bun-version` file to root folder ([b66fabf](https://github.com/okineadev/vitepress-plugin-llms/commit/b66fabf))
- 🚑 add package main entrypoint in `package.json` ([5ddfbd6](https://github.com/okineadev/vitepress-plugin-llms/commit/5ddfbd6))
- 🐛 fix the issue with folder structure not being saved ([b2144cc](https://github.com/okineadev/vitepress-plugin-llms/commit/b2144cc))
- 🚑 fix TOC generation ([f71808b](https://github.com/okineadev/vitepress-plugin-llms/commit/f71808b))

### 💅 Refactors

- ♻️ refactor code, fix type errors and improve types ([e7002ae](https://github.com/okineadev/vitepress-plugin-llms/commit/e7002ae))
- **ci:** ♻️ rename `test.yml` to `ci.yml` ([ca1e85c](https://github.com/okineadev/vitepress-plugin-llms/commit/ca1e85c))

### 📖 Documentation

- Add support section ([be723ff](https://github.com/okineadev/vitepress-plugin-llms/commit/be723ff))
- Add vitepress docs ([fd1fdb7](https://github.com/okineadev/vitepress-plugin-llms/commit/fd1fdb7))
- Improve readme ([5f6de9c](https://github.com/okineadev/vitepress-plugin-llms/commit/5f6de9c))
- Add detailed usage instructions to README ([09a9a99](https://github.com/okineadev/vitepress-plugin-llms/commit/09a9a99))

### 🏡 Chore

- Add plugin description in `package.json` ([17a649a](https://github.com/okineadev/vitepress-plugin-llms/commit/17a649a))
- Rename `biome.json` to `biome.jsonc` ([55c133b](https://github.com/okineadev/vitepress-plugin-llms/commit/55c133b))
- Create `bunfig.toml` with reccomended settings for Bun ([f967959](https://github.com/okineadev/vitepress-plugin-llms/commit/f967959))
- 🏷️  improve types ([b24eda5](https://github.com/okineadev/vitepress-plugin-llms/commit/b24eda5))

### ✅ Tests

- 🧪  add basic tests ([7c0fb53](https://github.com/okineadev/vitepress-plugin-llms/commit/7c0fb53))

### 🤖 CI

- Add emojis in step names ([0920ab6](https://github.com/okineadev/vitepress-plugin-llms/commit/0920ab6))
- 🔄️ setup continuous releases with pkg.pr.new ([409a809](https://github.com/okineadev/vitepress-plugin-llms/commit/409a809))
- Fix continuous releases ([44cab9e](https://github.com/okineadev/vitepress-plugin-llms/commit/44cab9e))
- ♻️ rename `ci.yml` to `test.yml` and remove build and publish steps ([21aecb0](https://github.com/okineadev/vitepress-plugin-llms/commit/21aecb0))

### ❤️ Contributors

- Okinea Dev ([@okineadev](https://github.com/okineadev))
- Kentaro Suzuki <mail@sushichan.live>

