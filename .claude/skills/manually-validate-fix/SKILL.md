---
name: manually-validate-fix
description: Validate a bug-fix PR by reproducing the bug in production and confirming the fix locally, using browser automation.
disable-model-invocation: true
argument-hint: <pr-number>
---

# Fix Manual Validation

Validate a bug-fix PR by testing like a human — reproduce the bug in production (broken), confirm the fix works locally (working). Drives a real browser through the same steps in both environments, with whatever automation tool you have available and judge best.

```
PR → UNDERSTAND BUG → PLAN REPRODUCTION → RUN vs PRODUCTION (bug)
                                        → RUN vs LOCAL (fix)
                                        → VERDICT → label PR
```

## Environments

| Environment | URL | Runs | Expected |
|---|---|---|---|
| **Production** | `https://lexxy.dev/sandbox/` | Latest released version (CDN) | Bug reproduces |
| **Local** | `http://lexxy.localhost:<port>` | The PR's branch, checked out in its worktree | Bug does NOT reproduce |

### Production page

The sandbox loads the latest released Lexxy from esm.sh (`@37signals/lexxy@latest`). After JS executes:

- `<lexxy-editor>` with toolbar, emoji prompt on `:` trigger
- `data-direct-upload-url` and `data-blob-url-template` are set but uploads go to a service worker (no real backend)
- Editor behavior is fully functional for text editing, formatting, paste, tables, etc.

### Local sandbox

`http://lexxy.localhost:<port>` runs the Rails dummy app from the PR's worktree. Pick a port of your own (`3000` is often taken by another app) and use it everywhere below:

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

Each step must be a real browser interaction: typing, a key press, a click.

### 3. Choose How to Drive the Browser

Use whatever browser automation tool you have available and judge best. Whatever you pick must:

- Send real input for the action under test: typing, key presses, clicks. Page scripts are for reading state only, never for producing the action under test.
- Wait for the editor to be ready (`lexxy-editor[connected]`) before interacting. Production loads from a CDN, so allow extra time there.
- Pace the input. Lexical picks up selection changes asynchronously, so a shortcut sent straight after a burst of keys can act on a stale selection. Pause briefly between steps.
- Take screenshots at key steps, named by environment and step, and read each one.
- Read the editor's value (`document.querySelector("lexxy-editor").value`) as evidence.

### 4. Make the Steps Repeatable

The steps must be identical in both environments; only the URL changes. The two pages preload different sample content, so start from a known state, for example by selecting all and deleting before the first step. If your tool runs scripts, write one that takes the URL as an argument. Otherwise, write the steps down and follow them exactly both times.

For each run, record a clear line: **PASS** when the behavior is correct (expected for local) or **FAIL** when the bug manifests (expected for production).

### 5. Ensure Local Server is Running

Run the server from the worktree that has the PR's branch checked out (see AGENTS.md, "Worktrees", for `bin/setup` and seeding a fresh one).

If no worktree has it, make one: `git worktree add ../lexxy-pr-<number> origin/<headRefName>`.

```bash
cd <pr-worktree>
git log -1 --format=%H   # must match the PR's head commit: gh pr view <number> --json headRefOid
git status --porcelain   # must print nothing
```

A server already answering on a port may be serving another checkout, so start your own rather than reusing one:

```bash
# bin/dev force-kills whatever listens on its port, so pick a free one: this must print nothing
lsof -ti tcp:<port> -sTCP:LISTEN

mkdir -p tmp
PORT=<port> bin/dev > tmp/dev-<port>.log 2>&1 &
DEV_PID=$!
for i in $(seq 1 60); do
  curl -s -o /dev/null -w "%{http_code}" http://lexxy.localhost:<port>/ 2>/dev/null | grep -q 200 && break
  sleep 1
done
curl -s -o /dev/null -w "%{http_code}" http://lexxy.localhost:<port>/ | grep -q 200 || tail -30 tmp/dev-<port>.log
```

Before testing, wait for the JS build to finish: `tmp/dev-<port>.log` shows rollup's "waiting for changes". When you're done, `kill $DEV_PID` (foreman stops its children).

### 6. Run Against Both Environments

1. **Production** — `https://lexxy.dev/sandbox/`: expect the bug.
2. **Local** — `http://lexxy.localhost:<port>`: expect the fix.

Review the screenshots and editor values from both runs.

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

**Production** (https://lexxy.dev/sandbox/):
- <what happened>
- Evidence: <screenshot paths>

**Local** (http://lexxy.localhost:<port>):
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
- **Same steps, two URLs.** The reproduction is identical in both environments.
- **Evidence is mandatory.** Screenshots + editor state for both runs.
- **Don't touch the code.** This skill validates only — no source modifications.
- **Production may be slow.** CDN version loads from esm.sh. Allow extra wait time.
