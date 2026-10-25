import { afterEach, expect, test } from "vitest"
import { $getRoot } from "lexical"
import Lexxy from "src/config/lexxy"
import { createTestEditor, destroyTestEditor, setContent, tick } from "../helpers/editor_helper"

// Each editor sanitizes with its own allowlist.
//
// The sanitizer config used to be one module-level value installed with
// DOMPurify.setConfig(), so the last editor to connect decided how every other
// editor on the page sanitized. Because an editor's `value` is sanitized on
// read, a rich editor sharing a page with a plain one would silently drop its
// own headings and lists from the value it submitted — data loss on save, with
// nothing visible in the editor to suggest it.

const RICH = "<h1>Title</h1><ul><li>one</li></ul><p>body</p>"

let rich, plain

afterEach(async () => {
  await destroyTestEditor(rich)
  await destroyTestEditor(plain)
  rich = plain = undefined
})

async function typeInto(editorElement) {
  editorElement.editor.update(() => {
    $getRoot().getLastDescendant()?.select().insertText("!")
  }, { discrete: true })
  await tick()
}

test("a rich editor keeps its formatting after a plain editor connects", async () => {
  Lexxy.configure({ plain: { richText: false } })

  rich = await createTestEditor({ value: RICH })
  plain = await createTestEditor({ attributes: { preset: "plain" } })
  await tick()

  // Editing clears the cached value, so the next read re-sanitizes. That read is
  // what used to pick up the plain editor's allowlist.
  await typeInto(rich)

  expect(rich.value).toContain("<h1>")
  expect(rich.value).toContain("<ul>")
})

test("the plain editor still sanitizes with its own narrower allowlist", async () => {
  Lexxy.configure({ plain: { richText: false } })

  rich = await createTestEditor({ value: RICH })
  plain = await createTestEditor({ attributes: { preset: "plain" }, value: RICH })
  await tick()

  await typeInto(plain)

  // Control: proves the two editors really do resolve different allowlists, so
  // the assertion above isn't passing because both are simply permissive.
  expect(plain.value).not.toContain("<h1>")
})

test("attachment content is sanitized with its own editor's allowlist", async () => {
  Lexxy.configure({ plain: { richText: false } })

  const attachment = '<action-text-attachment content-type="application/vnd.test.thing" ' +
    'content="&lt;blockquote&gt;quoted&lt;/blockquote&gt;"></action-text-attachment>'

  rich = await createTestEditor()
  plain = await createTestEditor({ attributes: { preset: "plain" } })
  await tick()

  // The content has to be set *after* the plain editor connects. A decorator
  // node builds its DOM once, so loading the attachment up front would render
  // it before there was any competing config — passing whether or not the bug
  // is present.
  await setContent(rich, `<p>${attachment}</p>`)

  // blockquote is in the rich editor's allowlist but not the plain one's.
  expect(rich.querySelector("action-text-attachment").innerHTML).toContain("<blockquote>")
})
