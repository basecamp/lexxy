---
name: manually-validate-fix
description: Validate a bug-fix PR by reproducing the bug in production and confirming the fix locally, using browser automation.
disable-model-invocation: true
argument-hint: <pr-number>
---

# Fix Manual Validation

Validate a bug-fix PR by testing like a human — reproduce the bug in production (broken), confirm the fix works locally (working). Uses a single Selenium WebDriver script run against both environments.

```
PR → UNDERSTAND BUG → PLAN REPRODUCTION → WRITE SCRIPT → RUN vs PRODUCTION (bug)
                                                        → RUN vs LOCAL (fix)
                                                        → VERDICT → label PR
```

## Environments

| Environment | URL | Runs | Expected |
|---|---|---|---|
| **Production** | `https://basecamp.github.io/lexxy/try-it.html` | Latest released version (CDN) | Bug reproduces |
| **Local** | `http://lexxy.localhost:3000` | Current branch with the fix | Bug does NOT reproduce |

### Production page

The try-it page loads Lexxy from jsDelivr CDN. After JS executes:

- `<lexxy-editor>` with toolbar, emoji prompt on `:` trigger
- `data-direct-upload-url` and `data-blob-url-template` are set but uploads go to a service worker (no real backend)
- Editor behavior is fully functional for text editing, formatting, paste, tables, etc.

### Local sandbox

`http://lexxy.localhost:3000` runs the Rails dummy app:

- Root (`/sandbox`) — editor with `@` mention and `:` emoji prompts, template switcher
- Posts CRUD (`/posts`) — full Action Text form, all features
- Query params on `/posts/new` control features: `?attachments_disabled=true`, `?toolbar_disabled=true`, etc.

## Procedure

### 1. Understand the Bug

```bash
gh pr view $ARGUMENTS --json title,body,files,commits,headRefName
gh pr diff $ARGUMENTS
```

Extract:
- What bug it fixes — the problem statement
- How a human would trigger the bug — step-by-step
- What the fix changes — which files/behavior
- Which editor features are involved

If the PR references an issue, fetch that too.

### 2. Plan the Reproduction

Write a concrete step-by-step plan:

1. What page to visit (both environments share the same editor, pick the right page)
2. What content to type or paste
3. What buttons to click or keys to press
4. What the broken behavior looks like
5. What the fixed behavior looks like

The plan must map directly to WebDriver actions.

### 3. Ensure Selenium is Available

```bash
ls /tmp/node_modules/selenium-webdriver >/dev/null 2>&1 || {
  cd /tmp && npm install selenium-webdriver
}
which chromedriver >/dev/null 2>&1 || echo "ERROR: Install chromedriver"
```

### 4. Write the Validation Script

Write a single `.mjs` script in `/tmp/` that accepts a URL argument and runs the reproduction steps. The same script runs against both environments — only the URL changes.

**Script skeleton:**

```javascript
import webdriver from '/tmp/node_modules/selenium-webdriver/index.js'
import chrome from '/tmp/node_modules/selenium-webdriver/chrome.js'
import { Key } from '/tmp/node_modules/selenium-webdriver/lib/input.js'
import fs from 'fs'

const BASE_URL = process.argv[2]
if (!BASE_URL) {
  console.error('Usage: node script.mjs <url>')
  process.exit(1)
}

const ENV = BASE_URL.includes('github.io') ? 'production' : 'local'

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function screenshot(driver, name) {
  const data = await driver.takeScreenshot()
  fs.writeFileSync(`/tmp/validation-${ENV}-${name}.png`, Buffer.from(data, 'base64'))
  console.log(`Screenshot: /tmp/validation-${ENV}-${name}.png`)
}

const options = new chrome.Options()
options.addArguments('--headless=new', '--no-sandbox', '--window-size=1280,900')
const driver = await new webdriver.Builder()
  .forBrowser('chrome').setChromeOptions(options).build()

try {
  // Navigate and wait for editor
  await driver.get(BASE_URL)
  await driver.wait(
    webdriver.until.elementLocated(webdriver.By.css('lexxy-editor[connected]')),
    15000
  )
  const content = await driver.findElement(webdriver.By.css('.lexxy-editor__content'))
  await content.click()
  await sleep(300)

  // ===== REPRODUCTION STEPS HERE =====
  // Use real browser interactions:
  //   content.sendKeys('text')        — type text
  //   content.sendKeys(Key.RETURN)    — press Enter
  //   content.sendKeys(Key.BACK_SPACE) — press Backspace
  //   content.click()                 — click to focus
  //   driver.findElement(...).click() — click toolbar buttons
  //   driver.executeScript(...)       — read DOM state (not for actions)

  // ===== COLLECT EVIDENCE =====
  await screenshot(driver, 'result')

  const html = await driver.executeScript(
    'return document.querySelector("lexxy-editor").value'
  )
  console.log(`[${ENV}] Editor value:`, html)

  // ===== ASSERT =====
  // Check whether the bug manifests or not.
  // Print a clear PASS/FAIL line:
  //   PASS = behavior is correct (expected for local)
  //   FAIL = bug manifests (expected for production)
  // Example:
  //   const bugPresent = html.includes('<some-broken-markup>')
  //   console.log(`[${ENV}] Bug present: ${bugPresent}`)

} finally {
  await driver.quit()
}
```

**Key rules for the script:**
- All interactions go through real browser events (`sendKeys`, `click`). No programmatic shortcuts.
- `executeScript` is for reading state only — never for producing the action under test.
- Screenshots at key steps, named by environment and step.
- Clear console output showing what happened in each environment.

### 5. Ensure Local Server is Running

```bash
curl -s -o /dev/null -w "%{http_code}" http://lexxy.localhost:3000/ 2>/dev/null | grep -q 200 || {
  echo "Starting local server..."
  cd ~/Work/basecamp/lexxy && bin/dev &
  for i in $(seq 1 30); do
    curl -s -o /dev/null -w "%{http_code}" http://lexxy.localhost:3000/ 2>/dev/null | grep -q 200 && break
    sleep 1
  done
}
```

Verify the right branch is checked out:

```bash
cd ~/Work/basecamp/lexxy && git branch --show-current
# Must match the PR's head branch
```

### 6. Run Against Both Environments

```bash
# Production — expect the bug
node /tmp/validate-fix-<pr>.mjs "https://basecamp.github.io/lexxy/try-it.html"

# Local — expect the fix
node /tmp/validate-fix-<pr>.mjs "http://lexxy.localhost:3000"
```

Review screenshots and console output from both runs.

### 7. Render Verdict

| Production | Local | Verdict |
|---|---|---|
| Bug reproduces | Bug does NOT reproduce | **Validated** |
| Bug reproduces | Bug STILL reproduces | **Not Fixed** |
| Bug does NOT reproduce | N/A | **Cannot Validate** |

**Verdict format:**

```markdown
**Validation Verdict: [Validated / Not Fixed / Cannot Validate]**

**PR:** #<number> — <title>
**Bug:** <one-line description>

**Production** (https://basecamp.github.io/lexxy/try-it.html):
- <what happened>
- Evidence: <screenshot paths>

**Local** (http://lexxy.localhost:3000):
- <what happened>
- Evidence: <screenshot paths>

**Steps executed:**
1. <step> — <result>
2. ...
```

### 8. Label and Comment on the PR

**If Validated:**

```bash
gh pr edit <number> --add-label "fix-validated" -R basecamp/lexxy
gh pr comment <number> --body "$(cat <<'EOF'
## Manual Validation: Validated

<Brief description of what was tested — written for a human reviewer. Describe the steps you performed and what you observed, e.g. "Typed a bulleted list, selected all items, applied heading format from the toolbar. Confirmed the list converted to a heading without leaving orphaned list markers.">
EOF
)"
```

**If Not Fixed** — comment on the PR:

```bash
gh pr comment <number> --body "$(cat <<'EOF'
## Manual Validation: Not Fixed

<Same human-readable description of the steps tested and what was observed, explaining why validation failed.>
EOF
)"
```

## Important Notes

- **Test like a human.** Every interaction goes through real browser events.
- **One script, two URLs.** The reproduction is identical in both environments.
- **Evidence is mandatory.** Screenshots + editor state for both runs.
- **Don't touch the code.** This skill validates only — no source modifications.
- **Production may be slow.** CDN version loads from jsDelivr. Allow extra wait time.
