---
title: Development
layout: default
nav_order: 7
---

# Development

## Setup

Install all dependencies (Ruby gems, Node packages, Playwright browsers, and database):

```bash
bin/setup
```

## Local development

To start both the Rails server and the JS watcher:

```bash
bin/dev
```

The sandbox app is available at http://lexxy.localhost:3000. There is also a CRUD example at http://lexxy.localhost:3000/posts.

## Tests

CI runs the full suite on every pull request and push to `main` via GitHub Actions (see `.github/workflows/ci.yml`). It runs four jobs in parallel: lint, JS unit tests, Rails system tests, and Playwright browser tests (across Chromium, Firefox, and WebKit).

To run tests locally:

```bash
# JS unit tests (Vitest)
yarn test

# Playwright browser tests — all browsers
yarn test:browser

# Playwright browser tests — single browser
yarn test:browser:chromium
yarn test:browser:firefox
yarn test:browser:webkit

# Playwright browser tests — headed (visible browser window)
yarn test:browser:headed

# Rails system tests
bin/rails test:all

# Lint
bin/rubocop
yarn lint
```

### Two browser-facing test suites

#### Playwright (`test/browser/`) — JS editing behavior

Tests pure JS editing behavior: typing, cursor/selection, formatting, paste handling, toolbar interactions, keyboard shortcuts, node transforms, tables, code blocks, and other client-side interactions. Tests run against a Vite dev server serving static HTML fixtures — no Rails required. Playwright runs across Chromium, Firefox, and WebKit for local cross-browser coverage.

**WebKit on Omarchy/Arch Linux:** Playwright's bundled WebKit binaries are compiled against Ubuntu's system libraries (ICU 74, libjxl 0.8, etc.). Arch ships newer, ABI-incompatible versions of these libraries, so WebKit will fail to launch locally. This is a Playwright limitation — they only build WebKit for Ubuntu. Chromium and Firefox work fine everywhere. Run `yarn test:browser:chromium` or `yarn test:browser:firefox` locally; WebKit coverage is guaranteed by CI which runs on Ubuntu.

#### Capybara (`test/system/`) — Rails integration

Tests the full Rails stack: Action Text rendering and persistence, Trix ↔ Lexxy conversion (both directions, in `test/system/trix/`), ActiveStorage uploads, SGID/prompt resolution, form behavior, Turbo/page refresh, authenticated storage, and gallery display after save. Tests run against the dummy Rails app using `selenium_chrome_headless`.

## Documentation

To run the documentation site locally:

```bash
cd docs
bundle install
bundle exec jekyll serve
```

The docs will be available at http://localhost:4000/lexxy/.

## Release

### Gem

1. Update the version in `version.rb`
2. Run `bundle` to update `Gemfile.lock`
3. Commit the version bump
4. Run `rake release` to publish the gem

### NPM package

```bash
yarn release
```

### Create release in GitHub

Create [a new release in GitHub](https://github.com/basecamp/lexxy/releases). 

While in beta we are flagging the releases as pre-release.
