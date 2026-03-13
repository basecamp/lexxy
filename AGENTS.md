# Lexxy

Lexxy is a rich text editor built on Lexical, distributed as both a Ruby gem and an npm package.

See [docs/development.md](docs/development.md) for local development setup, how to run tests, and release instructions.

## Fixing Bugs

Follow this mandatory workflow. Every step must complete before moving to the next.

1. **Classify** — Determine if the bug is a **core editing bug** (JS behavior: typing, cursor, selection, formatting, paste, toolbar, nodes, extensions) or a **system-level bug** (e.g., Action Text, uploads, Trix conversion, persistence, prompt/SGID resolution, Turbo).
2. **Reproduce** — Use `/bugs-reproducer` to write a failing test. This skill is ONLY for reproduction — do not investigate fixes or modify source code during this step. Core editing bugs go to Playwright (`test/browser/tests/`), system-level bugs go to Capybara (`test/system/`). Write the test, run it, and **confirm it fails before touching any source code.** A test that hasn't been seen failing proves nothing — it could be passing for the wrong reason. The failing test is your evidence that the bug is real. Do NOT skip this step even if the root cause seems obvious. If you have a justified reason to skip (e.g., the bug is purely visual and untestable), state the justification explicitly before proceeding.
3. **Fix** — Now investigate the root cause and work on the fix until the reproduction test passes.
4. **Test** — Ensure a regression test covers the bug. If you reproduced with Playwright or Capybara in step 2, you already have it. If you used Selenium as a fallback, write a proper test now. Then run the full test suite (`yarn test:browser` for Playwright, `bin/rails test:all` for Capybara) to discard regressions. **Always run `yarn lint` after making changes and fix any lint errors before committing.**
5. **Learn** — If the bug revealed a pattern, edge case, or reproduction technique not covered in `/bugs-reproducer`, update the skill (`.claude/skills/bugs-reproducer.md`) to capture the lesson. Keep the "Common Bug Patterns" section current.
