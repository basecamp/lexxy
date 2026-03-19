# Lexxy

Lexxy is a rich text editor built on Lexical, distributed as both a Ruby gem and an npm package.

See [docs/development.md](docs/development.md) for local development setup, how to run tests, and release instructions.

## Worktrees

When working from a git worktree:

- Run all commands from that worktree, not from the main checkout.
- For system-level work, start `bin/dev` in the worktree before investigating or running `test/system/` after `src/` changes. Rails system tests use `app/assets/javascript/lexxy.js`, so the watcher must keep built assets in sync.
- Use a unique port per worktree, for example `PORT=3100 bin/dev` or `PORT=3200 bin/dev`, to avoid Rails server collisions.
- If you skip `bin/dev`, rebuild assets in the worktree before trusting system test results after any `src/` change.
- Playwright tests in `test/browser/` do not need `bin/dev`.

## Browser Test Organization

Playwright tests in `test/browser/tests/` are grouped into semantic folders:

| Folder         | What goes here                                                                          |
|----------------|-----------------------------------------------------------------------------------------|
| `attachments/` | Upload, delete, caption, gallery                                                        |
| `editor/`      | Core editor API: focus, isEmpty/isBlank, toString, setValue, CSS status classes          |
| `formatting/`  | Toolbar chrome, inline marks, highlights, block formats, lists, HR, escape, color       |
| `modes/`       | Plain-text mode, single-line mode                                                       |
| `paste/`       | Markdown conversion, URL/link paste, file/attachment paste, style canonicalization       |
| `prompts/`     | Prompt popover triggers, mention insertion/deletion, remote-filtering race conditions    |
| `tables/`      | Structure (create, add/remove rows/columns, delete), headers                             |

Single-file tests (`code_highlighting`, `events`) live at the root level.

When adding a new test, pick the folder whose description fits best. If none fits, consider whether a new folder is warranted or if the test extends an existing category.

## Performance Benchmarks

Use the browser benchmark harness for Lexxy performance work. It is intentionally scoped to the JS/editor side of the project, not Rails persistence or Action Text server behavior.

- Run browser benchmarks from the worktree with `yarn benchmark:browser`.
- Results are written to `tmp/browser-benchmarks.json`.
- For targeted iteration, use `yarn benchmark:browser --list-scenarios` and `yarn benchmark:browser --scenario <name> --warmup <n> --iterations <n>`.
- Compare two runs with `yarn benchmark:browser:compare <baseline.json> <current.json>`.
- CI uses `.github/workflows/benchmarks.yml` and compares PR results against the latest successful benchmark run on `main`.
- Treat CI benchmark failures as coarse regression alarms. The thresholds are intentionally loose enough to survive normal GitHub-hosted runner variance.
## Fixing Bugs

Follow this mandatory workflow. Every step must complete before moving to the next.

1. **Classify** — Determine if the bug is a **core editing bug** (JS behavior: typing, cursor, selection, formatting, paste, toolbar, nodes, extensions) or a **system-level bug** (e.g., Action Text, uploads, Trix conversion, persistence, prompt/SGID resolution, Turbo).
2. **Reproduce** — Use `/bugs-reproducer` to write a failing test. This skill is ONLY for reproduction — do not investigate fixes or modify source code during this step. Core editing bugs go to Playwright (`test/browser/tests/`), system-level bugs go to Capybara (`test/system/`). Write the test, run it, and **confirm it fails before touching any source code.** A test that hasn't been seen failing proves nothing — it could be passing for the wrong reason. The failing test is your evidence that the bug is real. Do NOT skip this step even if the root cause seems obvious. If you have a justified reason to skip (e.g., the bug is purely visual and untestable), state the justification explicitly before proceeding.
3. **Fix** — Now investigate the root cause and work on the fix until the reproduction test passes.
4. **Test** — Ensure a regression test covers the bug. If you reproduced with Playwright or Capybara in step 2, you already have it. If you used Selenium as a fallback, write a proper test now. Then run the full test suite (`yarn test:browser` for Playwright, `bin/rails test:all` for Capybara) to discard regressions. **Always run `yarn lint` after making changes and fix any lint errors before committing.**
5. **PR & Copilot review** — Push the branch, create a PR, and request a GitHub Copilot review (`gh api repos/<owner>/<repo>/pulls/<number>/requested_reviewers -f "reviewers[]=copilot-pull-request-reviewer[bot]"`). When the review arrives, reply to each comment on GitHub. For actionable feedback (real bugs, internal API misuse, flaky test patterns), write a test that validates the issue first, then fix it. Decline cosmetic or low-value suggestions with a brief rationale.
6. **Learn** — If the bug revealed a **family of bugs** (an architectural pattern or subsystem that produces recurring issues), update the "Common Bug Patterns" section in `/bugs-reproducer` (`.claude/skills/bugs-reproducer.md`). Each entry should describe a class of bugs, not an individual fix. Good: "Decorator node navigation" (a whole category). Bad: "Backtick shortcut only works one direction" (a single bug). Don't add notes about specific bugs — that's what the tests and commit messages are for.
