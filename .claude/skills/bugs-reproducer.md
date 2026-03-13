---
name: bugs-reproducer
description: |
  Bug reproduction for the Lexxy rich text editor. Core editing bugs use
  Playwright (Selenium fallback); system-level bugs use Capybara. All local.
invocation: user
user_invocation: /bugs-reproducer
---

# Bugs Reproducer

Reproduce bugs in Lexxy — a rich text editor built on [Lexical](https://lexical.dev/), distributed as a Rails gem and npm package. Lexxy replaces Trix as the rich text editor for Rails Action Text.

```
BUG REPORT → CLASSIFY → REPRODUCE → DIAGNOSE → FIX → VERIFY
                          ^^^^^^^^^
                          core editing bug → Playwright (Selenium fallback)
                          system-level bug → Capybara
```

## Understanding Lexxy

Lexxy wraps Lexical in a set of custom elements (`<lexxy-editor>`, `<lexxy-toolbar>`, `<lexxy-table-tools>`, etc.) and extends it with custom nodes, extensions, and an Action Text integration layer. Before writing reproduction steps, understand which layer the bug likely lives in:

**Editor core** — The `<lexxy-editor>` custom element (`src/elements/editor.js`) owns the Lexical editor instance. It is `FormAssociated`, manages the `value` (sanitized HTML) lifecycle, handles Turbo reconnection, and dispatches events (`lexxy:change`, `lexxy:focus`, `lexxy:blur`, `lexxy:initialize`).

**Custom Lexical nodes** (`src/nodes/`) — These define how content is represented and rendered:
- `ActionTextAttachmentNode` / `ActionTextAttachmentUploadNode` — file and image attachments with ActiveStorage upload lifecycle
- `CustomActionTextAttachmentNode` — inline custom attachments (e.g., `@mentions` from prompts)
- `ImageGalleryNode` — container that auto-collapses/splits around previewable images
- `HorizontalDividerNode` — `<hr>` rendered as a decorator node
- `ProvisionalParagraphNode` — invisible placeholder paragraphs around non-selectable decorator nodes so the cursor can always be placed
- `WrappedTableNode` — tables wrapped in a scroll container

**Extensions** (`src/extensions/`) — Plugin-like modules:
- `ProvisionalParagraphExtension` — inserts/removes provisional paragraphs on tree changes
- `HighlightExtension` — color/background-color inline styles with palette canonicalization
- `TrixContentExtension` — backward-compatible import rules for Trix-generated HTML (`<em>`, `<del>`, `<span style>`, `<pre language>`)
- `TablesExtension` — table commands + Lexical bug workarounds
- `AttachmentsExtension` — attachment nodes + gallery collapse logic

**Clipboard & paste** (`src/editor/clipboard.js`) — Handles paste: plain text, URLs, markdown conversion (via `marked`), files, and HTML with `<action-text-attachment>` elements.

**Selection & cursor** (`src/editor/selection.js`) — Arrow-key navigation around decorator nodes, cursor containment within the editor, node selection management.

**Toolbar** (`src/elements/toolbar.js`) — Button state synced to selection format, hotkey dispatch, overflow menu compaction via `ResizeObserver`.

**Prompt system** (`src/elements/prompt.js`) — Trigger-based autocomplete (`@`, custom triggers) with inline, deferred, and remote data sources.

## Trix Compatibility

Lexxy is a **drop-in replacement for Trix**. Content authored in Trix must render correctly in Lexxy, and vice versa. The `TrixContentExtension` handles Trix HTML import rules. Bugs in this area are high priority — they affect every app migrating from Trix to Lexxy.

The `test/system/trix/` directory contains Capybara tests covering both conversion directions:
- `from_trix_to_lexxy_test.rb` — content created in Trix, then loaded/edited in Lexxy
- `from_lexxy_to_trix_test.rb` — content created in Lexxy, then loaded/edited in Trix

When reproducing Trix conversion bugs, use the Capybara test suite (see "Choosing the Right Test Suite" below).

## Choosing the Right Test Suite

**This is the first and most important decision.** Every bug falls into one of two categories, and each has its own test suite. Getting this wrong wastes all subsequent work.

### 1. Core editing bugs → Playwright (`test/browser/`)

Bugs in the editor's client-side behavior: typing, cursor movement, selection, formatting, paste handling, toolbar interactions, keyboard shortcuts, node transforms, code blocks, tables, decorator nodes (dividers, embeds), and anything that lives in the editor's JS layer.

Playwright runs against a Vite dev server serving static HTML fixtures from `test/browser/fixtures/`. Each fixture configures a `<lexxy-editor>` with different attributes (toolbar, attachments, markdown, single-line, etc.). No Rails required.

Playwright tests run across **Chromium, Firefox, and WebKit**, giving cross-browser coverage locally without external services. Start with one browser for fast iteration, then confirm across available browsers once the reproduction is solid.

**Note:** WebKit may not launch on Arch Linux due to ABI-incompatible system libraries (see `docs/development.md`). Use Chromium and Firefox locally; WebKit coverage is guaranteed by CI.

**Fallback:** if Playwright can't trigger the bug after 3 attempts (e.g., needs real OS-level events), fall back to Selenium WebDriver scripts.

### 2. System-level bugs → Capybara (`test/system/`)

Bugs involving anything outside the editor's JS layer: Action Text rendering and persistence, ActiveStorage uploads, Trix ↔ Lexxy conversion, form submission, SGID resolution, prompt/mention resolution with Rails-backed data, gallery display after save, page refreshes (Turbo), authenticated storage, and any scenario where data must survive a save/load roundtrip.

Capybara tests run against the dummy Rails app (`test/dummy/`) using `selenium_chrome_headless`. Stay in Capybara for all attempts — Selenium scripts add nothing over Capybara for Rails integration bugs.

## Extending the Test Suite

It is encouraged to extend the test suite when reproducing bugs. Add new fixtures, helpers, or test files as needed — the test suites are designed to be extended. Keep things consistent with the existing patterns:

- **Playwright fixtures**: add new `.html` files in `test/browser/fixtures/` following the existing pattern (import `editor.js`, configure `<lexxy-editor>` with the attributes needed for the scenario)
- **Playwright helpers**: extend `EditorHandle` in `test/browser/helpers/editor_handle.js` or add new helper modules in `test/browser/helpers/`
- **Capybara helpers**: add or extend test helpers in `test/test_helpers/`
- **Rails fixtures**: add or modify fixture data in `test/fixtures/`
- **Dummy app routes/views**: add pages to the dummy app in `test/dummy/` if a specific editor configuration is needed

## Reproduce Like a Human (for the Action Under Test)

The **action under test** — the interaction you're trying to reproduce — must go through the browser's real event pipeline. Bugs live in event side effects (mousedown → focus → selectionchange → input) — programmatic calls skip them entirely.

**Setup and inspection are fine with helpers.** Use `editor.setValue()`, `editor.select()`, `editor.value()`, and `editor.flush()` freely for loading initial content, positioning the cursor before the test, and reading state for assertions. These are standard test helpers, not shortcuts.

**`editor.paste()` is a special case.** It dispatches a synthetic `ClipboardEvent`, which is how all existing paste tests work — browsers don't allow programmatic clipboard access, so this is the correct way to reproduce paste bugs. Use `editor.paste()` as the action under test for paste-related bugs.

**The reproduction step itself must be human-like:**

| For the action under test | Use | Don't use |
|--------------------------|-----|-----------|
| Type text | `editor.send("text")` (PW) / `element.sendKeys("text")` (Selenium) | `editor.setValue("text")` |
| Press Enter | `editor.send("Enter")` (PW) / `element.sendKeys(Key.RETURN)` (Selenium) | `dispatchEvent(new KeyboardEvent(...))` |
| Focus an element | `editor.click()` (PW) / `element.click()` (Selenium) | `element.focus()` |
| Click a toolbar button | `editor.clickToolbarButton("bold")` or `click_on "Bold"` | Direct command dispatch |

**`executeScript` / `evaluate` is primarily for reading** — inspecting DOM state, checking cursor position, reading scroll offsets. Narrow setup exceptions exist (e.g., programmatic DOM manipulation when real interaction would destroy required preconditions), but never use it to produce the action under test.

## Non-Negotiable: Persevere

One test is one attempt. Different attempts vary the **setup**: content volume, cursor positioning, page lifecycle, scroll depth, timing.

**Once reproduced, stop.** A single reproduction with clear evidence is the goal. The 8-attempt minimum applies only when the bug hasn't been reproduced yet.

**Write at least 8 separate attempts before concluding "not reproduced."** Each must target at least 2 dimensions the previous attempts didn't cover:

### General dimensions
- **Event race timing** — vary delay between two-step interactions
- **Click timing** — click then immediately act vs. click, pause, then act
- **Keypress speed** — rapid successive keypresses vs. deliberate single presses
- **Focus transitions** — type or press Enter immediately after clicking, before focus/selection stabilize
- **Cursor positioning** — beginning, middle, end of content; inside vs. outside a node boundary
- **Selection state** — text selected vs. collapsed cursor vs. no selection vs. node selection
- **Content volume** — empty editor vs. short content vs. long content (15+ lines)
- **Repetition** — same action 5+ times in a row
- **Page lifecycle** — fresh load vs. content already present vs. navigated away and back

### Lexxy-specific dimensions
- **Node context** — paragraph, heading, blockquote, list item, code block, table cell — bugs often manifest only in specific node types
- **Decorator node boundaries** — interactions at the edge of attachments, dividers, and galleries where `ProvisionalParagraphNode` inserts invisible placeholders and `Selection` intercepts arrow keys
- **Gallery state** — single image, multiple images in gallery, images adjacent to non-image content (triggers `splitAroundInvalidChild`)
- **Nested structures** — list inside blockquote, table inside content, code block after list
- **Toolbar state transitions** — format, then type, then format differently, then undo — the toolbar state sync via `#updateButtonStates()` can get stale
- **Paste variants** — plain text, URL, markdown, HTML with attachments, HTML with Trix formatting, file paste
- **Highlight interactions** — apply color, change color, remove color, paste colored text — the `StyleCanonicalizer` and highlight format sync can conflict
- **Undo/redo across node changes** — undo after inserting an attachment, table, or divider — history state at decorator node boundaries is fragile
- **Editor reconnection** — if the bug involves Turbo, test with the page refresh fixture/flow

Label each attempt (v1, v2, v3...) and log which dimensions it covers.

**For core editing bugs (Playwright path):** after 3 failed attempts, consider switching to Selenium if the bug might require real OS-level events that Playwright's synthetic event model doesn't trigger. Continue the 8-attempt minimum across both methods.

**For system-level bugs (Capybara path):** stay in Capybara for all attempts. The Rails integration is the point — Selenium scripts against the sandbox app add nothing over Capybara.

## Procedure

### 1. Parse the Bug Report and Choose Suite

Extract from the bug report:
- Step-by-step reproduction path
- Browser/OS from report (if specified)
- Which Lexxy layer is likely involved (editor core, specific node type, extension, paste, toolbar, prompt, Action Text integration)
- Whether the bug involves persistence (save/load) or is purely client-side

**Choose the test suite first.** Refer to the decision guide in "Choosing the Right Test Suite" above. This determines whether you write Playwright tests, Capybara system tests, or (as a last resort) Selenium scripts. Getting this wrong wastes attempts.

### 2. Plan Reproduction

**Problem Summary** — restate the bug:
- What the user experiences vs. expected behavior
- Which Lexxy subsystem is likely involved
- Environmental conditions (browser, editor config)
- Whether this is a Trix migration issue

**Reproduction Plan** — design around the report specifics. Each attempt targets a specific hypothesis. List the attempts you'll write, each naming:
- The hypothesis it tests
- The dimensions it varies
- Why it differs from the previous attempt

### 3. Ensure Local Environment is Ready

**For Playwright tests** (no Rails needed):

The Playwright config starts its own Vite dev server automatically when you run the tests. No manual setup required.

**For Capybara tests or Selenium scripts** (needs Rails):

```bash
# Check if the dev server is running
curl -s -o /dev/null -w "%{http_code}" http://lexxy.localhost:3000/ || echo "not running"

# If not running:
cd ~/Work/basecamp/lexxy
bin/setup   # installs deps, creates DB — idempotent, safe to re-run
bin/dev &

# Wait for server (up to 30s):
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://lexxy.localhost:3000/ 2>/dev/null && break
  sleep 1
done
```

### 4a. Reproduce with Playwright (preferred)

Write test files in `test/browser/tests/` following the project's existing patterns.

**Test pattern:**

```javascript
import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"

test.describe("Bug reproduction: <description>", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("v1: <hypothesis>", async ({ page, editor }) => {
    // Setup: load initial content (programmatic is OK here)
    await editor.setValue("<p>Initial content</p>")

    // Reproduction: human-like interactions only
    await editor.send("Enter")
    await editor.send("New line text")
    await editor.flush()

    // Evidence: assert the bug manifests
    await assertEditorHtml(editor, "<p>Expected HTML</p>")
  })
})
```

The `test_helper.js` provides an `editor` fixture (`EditorHandle` instance) alongside Playwright's `page`. See `test/browser/helpers/editor_handle.js` for the full API — key methods include `send()`, `select()`, `paste()`, `clickToolbarButton()`, `flush()`, `value()`, `setValue()`, and `uploadFile()`.

Assertion helpers live in `test/browser/helpers/assertions.js`: `assertEditorHtml()`, `assertEditorContent()`, `assertEditorPlainText()`. These use `expect.poll` with `editor.flush()` to account for async Lexical state updates.

HTML fixtures in `test/browser/fixtures/` provide different editor configurations (toolbar enabled/disabled, attachments, markdown, single-line, plain text, etc.). Load them with `page.goto("/fixture-name.html")`. If a bug requires a configuration that doesn't have a fixture, create one — follow the existing fixture pattern.

**Run the test:**

```bash
# Single test file, single browser
yarn test:browser:chromium -- test/browser/tests/<file>.test.js

# All browsers (Chromium + Firefox + WebKit)
yarn test:browser -- test/browser/tests/<file>.test.js

# Headed (visible browser window) — useful for visual bugs
yarn test:browser:headed -- test/browser/tests/<file>.test.js
```

**Collecting evidence:**

Playwright automatically captures screenshots on failure, traces on first retry, and videos on first retry. For explicit evidence during reproduction:

```javascript
await page.screenshot({ path: "/tmp/bug-step-1.png" })
const html = await editor.innerHTML()
console.log("Editor HTML:", html)
```

### 4b. Reproduce with Capybara (for Rails integration bugs)

For bugs involving Action Text, uploads, Trix conversion, or persistence, write a system test in `test/system/`.

Follow the existing patterns: tests extend `ApplicationSystemTestCase`, use the `EditorHandler` via `find_editor`, and use helpers from `test/test_helpers/` (editor, focus, html, toolbar, trix, console helpers).

```bash
# Run a single system test
bin/rails test test/system/<file>.rb

# Run all system tests
bin/rails test:all
```

### 4c. Reproduce with Selenium (fallback)

If Playwright doesn't reproduce after 3+ attempts and the bug might require real OS-level events, fall back to Selenium WebDriver `.mjs` scripts.

**Ensure prerequisites:**

```bash
ls /tmp/node_modules/selenium-webdriver >/dev/null 2>&1 || {
  cd /tmp && npm install selenium-webdriver
}
which chromedriver >/dev/null 2>&1 || echo "Install chromedriver"
```

**Script pattern** — write `.mjs` scripts in `/tmp/`:

```javascript
import webdriver from '/tmp/node_modules/selenium-webdriver/index.js';
import chrome from '/tmp/node_modules/selenium-webdriver/chrome.js';
import fs from 'fs';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function screenshot(driver, name) {
  const data = await driver.takeScreenshot();
  fs.writeFileSync(`/tmp/${name}.png`, Buffer.from(data, 'base64'));
}

const options = new chrome.Options();
options.addArguments('--headless=new', '--no-sandbox', '--window-size=1280,900');
const driver = await new webdriver.Builder()
  .forBrowser('chrome').setChromeOptions(options).build();

try {
  await driver.get('http://lexxy.localhost:3000');
  await driver.wait(webdriver.until.elementLocated(
    webdriver.By.css('lexxy-editor[connected]')
  ), 10000);

  const content = await driver.findElement(
    webdriver.By.css('.lexxy-editor__content')
  );
  await content.click();

  // Reproduction steps here — screenshot after each
  await content.sendKeys('Hello there');
  await screenshot(driver, 'step-1');

  // Inspect via executeScript (read only)
  const html = await driver.executeScript(
    'return document.querySelector("lexxy-editor").value'
  );
  console.log('Editor value:', html);
} finally {
  await driver.quit();
}
```

### 5. Render Verdict

| Verdict | Criteria |
|---------|----------|
| **Reproduced** | Bug manifests following reported steps |
| **Not Reproduced** | Bug does not manifest after 8+ attempts varying dimensions in the chosen suite |
| **Intermittent** | Bug manifests inconsistently (note frequency, e.g., 2/5 attempts) |

**Verdict format:**

```markdown
**Reproduction Verdict: [Reproduced / Not Reproduced / Intermittent]**

**Bug:** <title>
**Confidence:** High / Medium / Low
**Method:** Playwright / Capybara / Selenium
**Browsers tested:** Chromium, Firefox, WebKit (via Playwright) / Chrome (via Selenium)
**Attempts:** <n> attempts, <n> successful reproductions

**Lexxy subsystem:** <node type / extension / clipboard / selection / toolbar / Action Text>

**Steps Executed:**
1. <step> — [evidence]
2. <step> — [evidence]
3. <step> — bug manifests here

**Evidence Summary:**
- <what was observed>
- <DOM/Lexical state if inspected>
- <console errors if present>

**Observations:**
- <any differences from reported behavior>
- <additional conditions discovered>
- <timing sensitivity if intermittent>
- <which browsers reproduce: all, or specific>
```

### 6. If Reproduced — Leave the Test

When reproduced via Playwright, **keep the test file** in `test/browser/tests/`. It serves as both evidence and a regression test for the eventual fix. Name it descriptively:

```
test/browser/tests/bug_<short_description>.test.js
```

When reproduced via Capybara, keep the test in `test/system/`. When reproduced via Selenium, keep the script in `/tmp/` and note the path in the verdict.

## Common Bug Patterns in Lexxy

These are areas where bugs tend to cluster, based on the architecture:

**Decorator node navigation** — Arrow keys around attachments, dividers, and galleries. The `Selection` class manually intercepts LEFT/RIGHT/UP/DOWN at node boundaries. Chrome has specific workarounds for fake cursor elements.

**Provisional paragraph lifecycle** — The invisible paragraphs inserted around decorator nodes by `ProvisionalParagraphExtension`. They should appear when needed, disappear when not, and convert to real paragraphs when typed into. Bugs: they don't appear, they duplicate, they don't convert, or they persist when they shouldn't.

**Gallery transforms** — `ImageGalleryNode` auto-collapses adjacent images, splits around non-image children, and unwraps when left with a single child. The transform runs per-pass, so multiple non-images embedded may need multiple passes.

**Paste handling edge cases** — The clipboard handler has separate code paths for: only plain text, HTML with attachments, URLs (including Safari's `text/uri-list`), markdown, files, and content inside code blocks (bypasses Lexxy entirely). Bugs often appear at the boundary between these paths. Cross-app paste (Trix → Lexxy) is a key variant: Trix stores raw HTML in the `content` attribute of `<action-text-attachment>`, while Lexxy stores JSON-stringified HTML. Any code that parses `content` must handle both formats.

**Highlight style sync** — The `HighlightExtension` keeps Lexical's `highlight` format bit in sync with inline CSS styles. Two TextNode transforms run on every mutation: one for sync, one for canonical palette enforcement. Infinite loop risk if the sync logic disagrees with Lexical's internal state.

**Trix HTML import** — The `TrixContentExtension` converts Trix's HTML output (`<em>`, `<del>`, `<span style>`, `<pre language>`) to Lexxy's model. Bugs here affect every migrated document.

**Turbo reconnection** — The `<lexxy-editor>` watches its `connected` attribute. Rapid Turbo morphs can stack reconnections. `valueBeforeDisconnect` can be null if timing is wrong.

**Upload lifecycle** — `ActionTextAttachmentUploadNode.createDOM()` starts the upload as a side effect. Lexical can call `createDOM()` multiple times (history restore). Guard logic prevents re-upload but can falsely block.
