---
name: mass-bug-fixing
description: |
  Process multiple bugs from a Fizzy board (or GitHub issues) in parallel.
  Uses worktree agents to reproduce, fix, test, create PRs, and comment on cards.
invocation: user
user_invocation: /mass-bug-fixing
---

# Mass Bug Fixing

Process a batch of bugs from a Fizzy board or GitHub repo in parallel, using worktree agents that each follow the project's mandatory bug-fixing workflow.

## Invocation

**From a Fizzy board (default):**

```
/mass-bug-fixing --board 12345 --column 67890
/mass-bug-fixing --board 12345                   # all columns
```

**From GitHub issues:**

```
/mass-bug-fixing --repo basecamp/lexxy --label bug
```

The user may also just provide a board ID or URL and let the skill prompt for the column.

## Overview

```
FETCH BUGS → BATCH (groups of ~5) → PARALLEL AGENTS (one per bug, each in a worktree)
                                        │
                                        ├── Classify
                                        ├── Reproduce (failing test)
                                        ├── Fix (root cause)
                                        ├── Test (full suite + lint)
                                        ├── Commit
                                        ├── Push branch + create PR
                                        ├── Comment on Fizzy card / GitHub issue
                                        └── Schedule CI check
                                        │
                                     NEXT BATCH (after current completes)
```

## Full Workflow

### Step 1: Fetch bugs

**Fizzy board:**

```bash
# List columns to find the right one
fizzy column list --board <board_id>

# List cards in a column (--all is REQUIRED — column filtering is client-side)
fizzy card list --board <board_id> --column <column_id> --all

# Show a specific card (works with card numbers, not just IDs)
fizzy card show <card_number>
```

**GitHub issues:**

```bash
gh issue list --repo <owner/repo> --label <label> --state open --json number,title,body
gh issue view <number> --repo <owner/repo>
```

### Step 2: Organize into batches

Group bugs into batches of approximately 5. This is the sweet spot for parallel processing — enough to make progress quickly, but not so many that system resources are exhausted or context becomes unmanageable.

**Batch sizing guidance:**
- Default batch size: 5
- Reduce to 3 if bugs look complex (system-level, multi-subsystem)
- Increase to 7 if bugs look straightforward (single-node, well-described)
- Never exceed 8 parallel agents

Present the batches to the user for confirmation before launching agents.

### Step 3: Launch parallel worktree agents

For each bug in the batch, launch a parallel agent in its own worktree. Each agent follows the project's mandatory bug-fixing workflow from `AGENTS.md`:

1. **Classify** — Determine if it's a core editing bug (Playwright) or system-level bug (Capybara).
2. **Reproduce** — Use `/bugs-reproducer` patterns to write a failing test. Confirm it fails before touching source code.
3. **Fix** — Investigate root cause, implement the fix, make the reproduction test pass.
4. **Test** — Run the full test suite (`yarn test:browser` for Playwright, `bin/rails test:all` for Capybara) plus `yarn lint`. Fix any failures or lint errors.
5. **Commit** — Single commit with a clear message describing the fix.

**Test naming:** Never name test files after bug numbers (e.g., `bug_1234_thing.test.js`). Use descriptive names that fit the existing test suite (e.g., `tables_click_target.test.js`, `markdown_format.test.js`). **Always check if an existing test file already covers the area** (e.g., paste tests go in `paste.test.js`, table tests go in `tables.test.js`) and add tests there as a new `test.describe` block instead of creating a separate file. Only create a new file when the topic is genuinely distinct and no existing file covers it. Test `describe` blocks should also be descriptive, not reference bug numbers.

Each worktree agent should use a unique port to avoid Rails server collisions (e.g., `PORT=3100`, `PORT=3200`, etc.) if system tests are involved.

### Step 4: Post-processing (as each agent completes)

When an agent finishes its bug fix:

**Push and create PR:**

```bash
# Push branch with descriptive name
git push -u origin fix-<short-description>

# Create PR — descriptive title only, no card/issue numbers in title
gh pr create \
  --title "Fix <descriptive title>" \
  --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing the fix>

Fixes [Fizzy card #<number>](<card_url>): <card title>
EOF
)" \
  --assignee "$(gh api user --jq '.login')"
```

**PR conventions:**
- Title: descriptive only, no card/issue numbers (e.g., "Fix cursor jumping after pasting into blockquote" not "Fix #4567: cursor paste bug")
- Body: include a Summary section with bullet points, and a **full markdown link** to the Fizzy card or GitHub issue (e.g., `[Fizzy card #3785](https://app.fizzy.do/5986089/cards/3785)`). Use the card's `url` field from `fizzy card show`. Never use just `#<number>` — GitHub would misinterpret it as a GitHub issue reference.
- Assignee: always assign to the current GitHub user (`gh api user --jq '.login'`), never hardcode a username

**Comment on the Fizzy card:**

```bash
fizzy comment create --card <card_number> --body "$(cat <<'EOF'
## Troubleshooting Findings

<What was investigated, what was tried>

## Root Cause

<Technical explanation of the root cause>

## Fix

PR: <pr_url>
<Brief description of the fix approach>
EOF
)"
```

For GitHub issues, use `gh issue comment`.

**Schedule CI check:**

After creating the PR, schedule a background check ~3 minutes later to verify CI passes:

```bash
# Background: check CI status after 3 minutes
sleep 180 && gh pr checks <pr_number> --repo <owner/repo>
```

### Step 5: CI follow-up

When the CI check returns:

- **Green:** Report success to the user.
- **Red:** Investigate the failure. If it's a flaky test unrelated to the change, note it. If it's a real failure, fix it, push, and re-check.

### Step 6: Process next batch

After all agents in the current batch complete (or time out), process the next batch. Report a summary of the completed batch:

```
Batch 1 complete:
  ✓ Card #123 — Fixed cursor navigation in tables → PR #45
  ✓ Card #124 — Fixed paste handling for Trix HTML → PR #46
  ✗ Card #125 — Could not reproduce (commented findings on card)
  ✓ Card #126 — Fixed highlight color sync → PR #47
  ✓ Card #127 — Fixed gallery split with mixed content → PR #48
```

## Handling Unreproducible or Unfixable Bugs

Not every bug can be reproduced or fixed. When an agent fails:

**Cannot reproduce (after 8+ attempts):**

Comment on the Fizzy card with the reproduction attempts, dimensions explored, and a request for more information:

```bash
fizzy comment create --card <card_number> --body "$(cat <<'EOF'
## Reproduction Attempt

Could not reproduce after 8 attempts across multiple dimensions:
- <list of approaches tried>
- <browsers tested>
- <content configurations tried>

**Request:** Could you provide more details about:
- The exact browser and OS version
- Whether this happens consistently or intermittently
- Any specific content that triggers it
EOF
)"
```

**Can reproduce but cannot fix:**

Comment with the reproduction findings and root cause analysis, even if a fix isn't ready. The reproduction test is still valuable.

## The Learn Step

After completing a batch, review whether any bugs revealed a **family of bugs** — an architectural pattern or subsystem that produces recurring issues. If so, update the "Common Bug Patterns" section in `/bugs-reproducer` (`.claude/skills/bugs-reproducer.md`).

**Do** add entries for classes of bugs (e.g., "Decorator node navigation", "Gallery transform ordering").
**Don't** add entries for individual bug fixes — that's what tests and commit messages are for.

## Fizzy CLI Reference

| Command | Description | Notes |
|---------|-------------|-------|
| `fizzy column list --board <id>` | List columns with IDs | Use to find column IDs |
| `fizzy card list --board <id> --column <col_id> --all` | List cards in a column | `--all` is **required** — column filtering is client-side |
| `fizzy card list --board <id> --all` | List all cards on a board | Omit `--column` for all columns |
| `fizzy card show <number>` | Show a specific card | Works with card numbers, not just IDs |
| `fizzy comment create --card <number> --body "text"` | Comment on a card | Use heredoc for multiline body |

**Gotchas:**
- `fizzy card list` without `--all` returns only the first page — always include `--all`
- Column filtering (`--column`) is client-side, so `--all` must be present for it to work
- Card objects have `id`, `number`, `title`, `description`, `description_html` fields
- Use card `number` (not `id`) with `fizzy card show` and `fizzy comment create`

## Example Session

```
User: /mass-bug-fixing --board 52436 --column 913527

Agent: Fetching bugs from Fizzy board 52436, column 913527...

Found 12 bugs. Organizing into batches of 5:

Batch 1:
  1. Card #4601 — Cursor jumps to start after pasting URL in blockquote
  2. Card #4603 — Bold formatting lost when converting Trix content
  3. Card #4607 — Gallery doesn't collapse when third image added
  4. Card #4610 — Toolbar Bold button stays active after clearing selection
  5. Card #4612 — Horizontal divider duplicates on undo

Batch 2:
  6. Card #4615 — Upload progress bar doesn't appear for drag-and-drop
  7. Card #4618 — Code block loses language after save/reload
  ...

Shall I proceed with Batch 1?

User: Yes

Agent: Launching 5 parallel worktree agents...
  → Agent 1: Card #4601 (worktree: fix-paste-url-blockquote, PORT=3100)
  → Agent 2: Card #4603 (worktree: fix-trix-bold-conversion, PORT=3200)
  → Agent 3: Card #4607 (worktree: fix-gallery-collapse-third-image, PORT=3300)
  → Agent 4: Card #4610 (worktree: fix-toolbar-bold-stale-state, PORT=3400)
  → Agent 5: Card #4612 (worktree: fix-divider-undo-duplicate, PORT=3500)

[agents work in parallel...]

Batch 1 complete:
  ✓ Card #4601 — Fixed paste URL in blockquote → PR #851
  ✓ Card #4603 — Fixed Trix bold conversion → PR #852
  ✗ Card #4607 — Could not reproduce (commented on card)
  ✓ Card #4610 — Fixed toolbar state sync → PR #853
  ✓ Card #4612 — Fixed divider undo duplication → PR #854

CI checks scheduled. Shall I proceed with Batch 2?
```
