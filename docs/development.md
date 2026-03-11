---
title: Development
layout: default
nav_order: 7
---

# Development

## Local development

To build the JS source when it changes, run:

```bash
yarn build -w
```

To the sandbox app:

```bash
bin/rails server
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
bin/rails db:test:prepare
bin/rails test:all

# Lint
bin/rubocop
yarn lint
```

Most editor behavior is tested in Playwright (`test/browser/tests/`). The remaining Rails system tests (`test/system/`) only cover what genuinely needs Rails: Action Text rendering, Active Storage uploads, authenticated storage, and SGID resolution.

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
