import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { attachmentTag, selectAttachment } from "../../helpers/attachment_helpers.js"

const LIVE_REGION = "lexxy-editor lexxy-live-region"

test.describe("Attachment keyboard move", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("Alt+Shift+ArrowUp moves an attachment above the previous block", async ({ page, editor }) => {
    await editor.setValue(`<p>Above</p><p>Below</p>${attachmentTag("a", "one.png")}`)
    await editor.flush()

    const figure = page.locator("figure.attachment").first()
    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Alt+Shift+ArrowUp")
    await editor.flush()

    await expect.poll(async () => page.locator(LIVE_REGION).textContent())
      .toContain("Attachment moved up")
    const blocks = await editor.content.locator("> p, > figure").all()
    await expect(blocks[1]).toHaveAttribute("data-content-type", "image/png")
  })

  test("Alt+Shift+ArrowDown moves an attachment below the next block", async ({ page, editor }) => {
    await editor.setValue(`<p>Above</p>${attachmentTag("a", "one.png")}<p>Below</p>`)
    await editor.flush()

    const figure = page.locator("figure.attachment").first()
    await selectAttachment(figure)
    await editor.focus()
    await page.keyboard.press("Alt+Shift+ArrowDown")
    await editor.flush()

    await expect.poll(async () => page.locator(LIVE_REGION).textContent())
      .toContain("Attachment moved down")
    const blocks = await editor.content.locator("> p, > figure").all()
    await expect(blocks[2]).toHaveAttribute("data-content-type", "image/png")
  })

  test("Alt+Shift+ArrowUp on adjacent images forms a gallery", async ({ page, editor }) => {
    await appendAdjacentAttachments(editor, [
      { sgid: "a", file: "one.png" },
      { sgid: "b", file: "two.png" }
    ])

    const second = page.locator("figure.attachment").nth(1)
    await selectAttachment(second)
    await editor.focus()
    await page.keyboard.press("Alt+Shift+ArrowUp")
    await editor.flush()

    await expect.poll(async () => page.locator(LIVE_REGION).textContent())
      .toContain("Gallery created")
    await expect(editor.content.locator(".attachment-gallery figure.attachment")).toHaveCount(2)
  })

  test("Alt+Shift+ArrowRight reorders an image within its gallery", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "one.png")}${attachmentTag("b", "two.png")}</div>`)
    await editor.flush()

    const first = page.locator(".attachment-gallery figure.attachment").first()
    await selectAttachment(first)
    await editor.focus()
    await page.keyboard.press("Alt+Shift+ArrowRight")
    await editor.flush()

    await expect.poll(async () => page.locator(LIVE_REGION).textContent())
      .toContain("Image reordered in gallery")
    const figures = page.locator(".attachment-gallery figure.attachment")
    await expect(figures.first()).toHaveAttribute("data-lexical-node-key")
    await expect(figures.nth(1).locator("img")).toHaveAttribute("src", "/one.png")
  })
})

// Builds adjacent attachments at the root via Lexical's API, bypassing HTML
// parsing — browsers normalise consecutive top-level decorator nodes
// differently in setValue, breaking adjacency.
async function appendAdjacentAttachments(editor, specs) {
  await editor.locator.evaluate((el, items) => {
    return new Promise((resolve) => {
      el.editor.update(() => {
        const root = el.editor.getEditorState()._nodeMap.get("root")
        root.clear()
        const ActionTextAttachmentNode = el.editor._nodes.get("action_text_attachment").klass
        for (const { sgid, file } of items) {
          root.append(new ActionTextAttachmentNode({
            sgid,
            src: `/${file}`,
            previewable: "true",
            contentType: "image/png",
            fileName: file,
            fileSize: 100,
            width: 50,
            height: 50
          }))
        }
      }, { onUpdate: resolve })
    })
  }, specs)
  await editor.flush()
}
