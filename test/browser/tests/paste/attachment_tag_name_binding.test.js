import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

// Reproduces the reported vulnerability through the real paste boundary.
//
// application/x-lexical-editor is attacker-craftable clipboard JSON that flows
// through the editor's clipboard parsing, node insertion, reconciliation, and
// serialization. A crafted custom_action_text_attachment carrying
// { tagName: "script", innerHtml: "..." } must not become a <script> element in
// the live DOM: the attachment tag is bound to the configured attachmentTagName,
// not to node data.
//
// The live DOM is where the damage lands. The exported value is a weaker witness
// — DOMPurify's allowlist has no <script> in it, so the poisoned tag was dropped
// from the value either way. What the value proves here is the other half: the
// attachment survives as the configured tag rather than vanishing with the tag it
// was poisoned with.
//
// The unit suite (test/javascript/unit/editor/attachments/tag_name_binding.test.js)
// asserts the node-level contract directly; this test proves the whole paste path
// enforces it end to end, as AGENTS.md requires for core paste behavior.

const CONFIGURED_TAG = "action-text-attachment"

function lexicalPayload(nodes) {
  return JSON.stringify({ namespace: "Lexxy", nodes })
}

test.describe("Paste — attachment tagName is bound to config, not clipboard data", () => {
  test("a crafted custom_action_text_attachment tagName never becomes a <script> element", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    await editor.setValue("<p>hello world</p>")
    await editor.focus()
    await editor.select("world")

    // Distinct content in the lexical payload vs. the HTML fallback. Lexical
    // prefers application/x-lexical-editor over text/html, so the JSON marker is
    // what must survive. If a change ever stopped honoring the MIME payload and
    // fell back to HTML, the FALLBACK marker would surface and the test would
    // fail — proving this exercises the JSON paste boundary, not the HTML one.
    const JSON_MARKER = "window.poisonedAttachmentTagExecuted = true"
    const FALLBACK_MARKER = "from-html-fallback"

    const malicious = {
      type: "custom_action_text_attachment",
      version: 1,
      tagName: "script",
      contentType: "text/html",
      innerHtml: JSON_MARKER,
    }

    // text/plain, text/html and the lexical payload all set, exactly as a genuine
    // copy out of Lexxy produces.
    await editor.paste("", {
      html: `<action-text-attachment content-type="text/html" content="${FALLBACK_MARKER}"></action-text-attachment>`,
      lexical: lexicalPayload([ malicious ]),
    })
    await editor.flush()

    // The JSON marker is a statement, so a poisoned tag that became a real <script>
    // would already have run it: a script executes as it is inserted.
    expect(await page.evaluate(() => window.poisonedAttachmentTagExecuted ?? null)).toBeNull()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("script")).toHaveCount(0)
      await expect(content.locator(CONFIGURED_TAG)).toHaveCount(1)
      await expect(content.locator(CONFIGURED_TAG)).toContainText(JSON_MARKER)
    })

    // The exported value — what gets persisted — carries the configured tag, built
    // from the lexical payload. Without the fix the attachment is poisoned into a
    // tag DOMPurify drops, so the value comes back empty instead.
    const value = await editor.value()
    expect(value).toContain(CONFIGURED_TAG)
    expect(value).toContain(JSON_MARKER)
    expect(value).not.toContain(FALLBACK_MARKER)
  })
})
