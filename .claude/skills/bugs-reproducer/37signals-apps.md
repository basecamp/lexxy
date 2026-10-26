# 37signals Apps Reference

Cross-app context for reproducing and fixing Lexxy-related bugs across the 37signals ecosystem.

## Apps Using Lexxy

### Basecamp (BC5)
- **Repo:** `basecamp/bc3` at `~/Work/basecamp/bc3`
- **Branch:** `five` (the BC5/Lexxy branch — NOT `master`)
- **Deploy:** `bin/kamal deploy -d <destination>` (destinations: production, rollout, staging, beta, beta1–10, five)
- **Key areas:** Documents, Messages, Card Tables, Chat Lines, Pings, Comments

### Fizzy
- **Repo:** `basecamp/fizzy` at `~/Work/basecamp/fizzy`
- **Branch:** `main`
- **Setup:** Run `bin/rails saas:enable` before deploying or running tests (switches OSS → SaaS mode)
- **Deploy:** `bin/kamal deploy -d <destination>` (destinations: production, staging, beta, beta1–4)
- **Key areas:** Cards, Comments, Documents

## Cross-App Bug Investigation

When a bug is reported as a Lexxy issue but may live elsewhere:

1. **Start in Lexxy** — Check if the editor correctly handles the scenario (Playwright tests in `test/browser/`)
2. **If Lexxy is correct**, investigate the host app:
   - **CSS/styling issues** → Check the app's Lexxy CSS overrides (e.g., `app/assets/stylesheets/lexxy.css`)
   - **Content not persisting** → Check Action Text sanitizer config (`config/initializers/sanitization.rb`)
   - **Attachments dropped** → Check attachment processing pipeline and `permitted_attachment_content_types`
   - **Read-mode rendering** → Check Action Text rendering and CSS in the host app

## Useful Tools

### Browser-based reproduction
The `/bugs-browser-reproducer` skill in `basecamp/coworker` can reproduce bugs directly in other apps via Selenium WebDriver (locally or via BrowserStack). Use it when:
- The bug is visual or interaction-based
- You need to test against a running instance of Fizzy/BC5
- The bug involves cross-app behavior (e.g., paste from one app to another)

### Fizzy CLI
Use the `fizzy` CLI (NOT `basecamp` CLI) for Fizzy cards:
```bash
fizzy card show <number>
fizzy comment create --card <number> --body "text"
fizzy card column <number> --column <column_id>
```

### Basecamp CLI
Use the `basecamp` CLI for Basecamp interactions with URLs containing `3.basecamp.com/2914079`.

## Common Cross-App Patterns

| Symptom | Likely Location | What to Check |
|---------|----------------|---------------|
| Works in editor, broken in read mode | Host app CSS | Theme-specific styles, Action Text CSS |
| Content stripped on save | Host app sanitizer | `config/initializers/sanitization.rb`, allowed tags/attributes |
| Attachments lost in Chat/Ping | bc3 Chat model | `permitted_attachment_content_types` in `Chat::Lines::RichText` |
| Dark/light theme issues | Host app CSS | CSS variables, inline style handling |
| Agent/API content looks wrong | Host app CSS or API | Content format expectations, CSS for API-submitted HTML |
