import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

// Reproduces the reported vulnerability through the real paste boundary.
//
// application/x-lexical-editor is attacker-craftable clipboard JSON that flows
// through the editor's clipboard parsing, node insertion, reconciliation, and
// serialization. A crafted custom_action_text_attachment carrying
// { tagName: "script", innerHtml: "alert(...)" } must not become a <script>
// element in the live DOM and must not survive into the exported value: the
// attachment tag is bound to the configured attachmentTagName, not to node data.
//
// The unit suite (test/javascript/unit/editor/attachments/tag_name_binding.test.js)
// asserts the node-level contract directly; this test proves the whole paste path
// enforces it end to end, as AGENTS.md requires for core paste behavior.

const CONFIGURED_TAG = "action-text-attachment"

function lexicalPayload(nodes) {
  return JSON.stringify({ namespace: "Lexxy", nodes })
}

// Mirrors a real browser paste: text/plain, text/html, and the Lexxy lexical
// payload all present on the clipboard, exactly as a copy from Lexxy produces.
async function pasteLexical(editor, { lexical, html, text }) {
  await editor.content.evaluate(
    (el, { text, html, lexical }) => {
      const event = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      })
      event.clipboardData.setData("text/plain", text)
      event.clipboardData.setData("text/html", html)
      event.clipboardData.setData("application/x-lexical-editor", lexical)
      el.dispatchEvent(event)
    },
    { text, html, lexical },
  )
  await editor.flush()
}

test.describe("Paste — attachment tagName is bound to config, not clipboard data", () => {
  test("a crafted custom_action_text_attachment tagName never becomes a <script> element", async ({ page, editor }) => {
    await page.goto("/mentions.html")
    await editor.waitForConnected()

    await editor.setValue("<p>hello world</p>")
    await editor.focus()
    await editor.select("world")

    // If a poisoned tagName ever reached the DOM as <script>, this would fire.
    let dialogTriggered = false
    page.on("dialog", async (dialog) => { dialogTriggered = true; await dialog.dismiss() })

    const malicious = {
      type: "custom_action_text_attachment",
      version: 1,
      tagName: "script",
      contentType: "text/html",
      innerHtml: "alert(document.domain)",
    }

    await pasteLexical(editor, {
      lexical: lexicalPayload([ malicious ]),
      html: '<action-text-attachment content-type="text/html" content="alert(document.domain)"></action-text-attachment>',
      text: "",
    })

    await page.waitForTimeout(500)

    expect(dialogTriggered).toBe(false)

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("script")).toHaveCount(0)
      await expect(content.locator(CONFIGURED_TAG)).toHaveCount(1)
    })

    // The exported value (what gets persisted) must carry the configured tag only.
    const value = await editor.value()
    expect(value).not.toContain("<script")
    expect(value).toContain(CONFIGURED_TAG)
  })
})
