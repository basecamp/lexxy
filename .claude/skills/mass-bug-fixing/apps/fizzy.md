# Fizzy CLI Reference for Bug Processing

## Fetching cards from a board column

### Step 1: Find the column ID

```bash
fizzy column list --board <board_id>
```

Board IDs can be extracted from Fizzy URLs: `https://app.fizzy.do/<account>/boards/<board_id>`

### Step 2: List cards in the column

**IMPORTANT:** Always include `--all` — column filtering is client-side and won't work without it.

```bash
fizzy card list --board <board_id> --column <column_id> --all
```

### Step 3: Get card details

```bash
# Show card with full description
fizzy card show <card_number>
```

The response is wrapped in a `data` object:
```
.data.number
.data.title
.data.description
.data.url
```

### Step 4: Get card comments

Comments contain crucial context — previous investigations, partial fixes, related PRs.

```bash
fizzy comment list --card <card_number> --all
```

Comment body is an object with `html` and `plain_text` fields:
```
.data[].body.plain_text
.data[].creator.name
.data[].created_at
```

## Common operations

### Comment on a card

```bash
fizzy comment create --card <card_number> --body "text"
```

For multiline, use a heredoc:
```bash
fizzy comment create --card <card_number> --body "$(cat <<'EOF'
## Heading
Content here
EOF
)"
```

### Move a card to a column

```bash
fizzy card column <card_number> --column <column_id>
```

### Assign a card

```bash
fizzy card assign <card_number> --user <user_id>
```

## Gotchas

- `fizzy card list` without `--all` returns only the first page
- Use card `number` (not `id`) with `fizzy card show` and `fizzy comment create`
- Comment `.body` is an object (`{html, plain_text}`), not a string
- Card fields are under `.data`, not at the top level (e.g., `.data.number`, not `.number`)
- The `description` field is plain text; `description_html` has the rendered HTML
