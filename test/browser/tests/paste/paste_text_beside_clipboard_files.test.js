import { readFileSync } from "node:fs"
import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"
import { assertEditorPlainText } from "../../helpers/assertions.js"

const EXAMPLE_PNG = readFileSync("test/fixtures/files/example.png").toString("base64")

// Google apps on Android put the copied text on the clipboard as text/plain,
// with no HTML, beside a "file" that only holds a reference to their own
// clipboard. A long-press paste hands both to the editor.
const GOOGLE_CLIPBOARD_REFERENCE = {
  base64: Buffer.from("content://com.google.android.apps.docs.editors.kix.editors.clipboard?uuid=1", "utf8").toString("base64"),
  name: "com.google.android.apps.docs.editors.kix.editors.clipboard?uuid=1",
  type: ""
}

test.describe("Paste — Text beside a clipboard file", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await mockActiveStorageUploads(page)
  })

  test("pastes the text, not a file that only references another clipboard", async ({ editor }) => {
    await editor.paste("Notes from the meeting", { files: [ GOOGLE_CLIPBOARD_REFERENCE ] })

    await assertEditorPlainText(editor, "Notes from the meeting")
    await expect(editor.content.locator("figure.attachment")).toHaveCount(0)
  })

  test("still uploads a file whose name is the pasted text", async ({ editor }) => {
    const pdf = Buffer.from("%PDF-1.4 dummy", "utf8").toString("base64")
    await editor.paste("report.pdf", { files: [ { base64: pdf, name: "report.pdf", type: "application/pdf" } ] })

    await expect(editor.content.locator("figure.attachment[data-content-type='application/pdf']")).toHaveCount(1, { timeout: 10_000 })
  })

  test("still uploads an image pasted with text", async ({ editor }) => {
    await editor.paste("A screenshot", { files: [ { base64: EXAMPLE_PNG, name: "shot.png", type: "image/png" } ] })

    await expect(editor.content.locator("figure.attachment[data-content-type='image/png']")).toHaveCount(1, { timeout: 10_000 })
  })
})
