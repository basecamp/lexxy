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

To run multiple worktrees in parallel, give each worktree its own port:

```bash
PORT=3100 bin/dev
PORT=3200 bin/dev
```

Use the matching URL for that worktree, for example `http://lexxy.localhost:3100/posts`.

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

## Performance benchmarks

Lexxy also ships a browser benchmark harness for the JS side of the editor. These benchmarks run against the Vite fixture app in `test/browser/fixtures/`, just like the Playwright browser tests, so they measure editor bootstrap and content-loading cost without involving Rails, Action Text persistence, or Active Storage uploads.

Each sample runs the scenario in a tight loop for a fixed time budget (default 5 seconds) and reports the per-operation median duration. Per-op timing amortizes frame-quantized waits across many operations, which is why this gives stable numbers for scenarios whose work is dominated by `requestAnimationFrame` / vsync alignment.

To run the full browser benchmark suite locally:

```bash
yarn benchmark:browser
```

Results are written to `tmp/browser-benchmarks.json` by default. Use `--output <path>` to write elsewhere.

For quicker iteration, you can narrow the run to a single scenario, reduce the sample counts, or shorten the time budget:

```bash
# List scenarios
yarn benchmark:browser --list-scenarios

# Run one scenario with smaller sample sizes
yarn benchmark:browser --scenario load-very-large-table --warmup 1 --iterations 3

# Use a shorter time budget per sample (default is 5000 ms)
yarn benchmark:browser --time-budget 2000
```

The same knobs are available as environment variables: `BENCHMARK_ITERATIONS`, `BENCHMARK_WARMUP_ITERATIONS`, and `BENCHMARK_TIME_BUDGET_MS`.

The current benchmark scenarios are:

- `bootstrap-empty-editor`
- `bootstrap-many-editors`
- `load-large-content`
- `load-very-large-table`
- `load-many-attachments`

Each scenario's per-sample time budget defaults to 5 seconds (set in `test/browser/fixtures/benchmarks.js`). Slower scenarios fit fewer ops in that window, so their per-op variance is wider — `load-very-large-table` is the practical worst case at ~16 ops per sample. To tighten that scenario's spread at the cost of CI time, raise its `timeBudgetMs` in the scenario definition.

To compare two result files locally:

```bash
yarn benchmark:browser:compare tmp/baseline.json tmp/current.json
```

The compare script checks per-scenario median regressions against coarse thresholds so it can be used in CI without flapping on normal GitHub runner variance.

## Benchmark CI

GitHub Actions runs the browser benchmark workflow from `.github/workflows/benchmarks.yml` on pull requests, pushes to `main`, and manual dispatches.

- Pull requests run benchmarks against the latest commit on `main` for which there's a successful benchmark run, and use that as the baseline for comparison.
- The workflow only fails when a scenario median regresses by more than both the configured absolute and relative threshold.
- The comparison is written to the workflow summary, so you can inspect the deltas without downloading artifacts manually.
