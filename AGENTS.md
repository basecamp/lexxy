# Lexxy

Lexxy is a rich text editor built on Lexical, distributed as both a Ruby gem and an npm package.

See [docs/development.md](docs/development.md) for local development setup, how to run tests, and release instructions.

## Fixing Bugs

Use the `/bugs-reproducer` skill to follow this workflow:

1. **Classify** — Determine if the bug is a **core editing bug** (JS behavior: typing, cursor, selection, formatting, paste, toolbar, nodes, extensions) or a **system-level bug** (e.g., Action Text, uploads, Trix conversion, persistence, prompt/SGID resolution, Turbo).
2. **Reproduce** — Use `/bugs-reproducer`. Core editing bugs go to Playwright (`test/browser/tests/`), system-level bugs go to Capybara (`test/system/`). The reproduction test doubles as evidence and a regression test.
3. **Fix** — Work on the fix until the reproduction test passes.
4. **Test** — Ensure a regression test covers the bug. If you reproduced with Playwright or Capybara in step 2, you already have it. If you used Selenium as a fallback, write a proper test now.
5. **Learn** — If the bug revealed a pattern, edge case, or reproduction technique not covered in `/bugs-reproducer`, update the skill (`.claude/skills/bugs-reproducer.md`) to capture the lesson. Keep the "Common Bug Patterns" section current.
