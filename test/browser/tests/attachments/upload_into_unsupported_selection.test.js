import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

const PDF_BASE64 = Buffer.from("%PDF-1.4 dummy", "utf8").toString("base64")

const pdfAttachment =
  '<action-text-attachment sgid="test-sgid-123" content-type="application/pdf" filename="report.pdf" ' +
  'filesize="12345" previewable="false" url="http://example.com/report.pdf"></action-text-attachment>'

const imageAttachment =
  '<action-text-attachment sgid="img-sgid-1" content-type="image/png" filename="a.png" ' +
  'filesize="100" width="10" height="10" previewable="true" url="http://example.com/a.png"></action-text-attachment>'

test.describe("Uploading into an unsupported selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  // "Cannot read properties of undefined (reading 'getNode')":
  // node selections have no anchor, so ShadowRootNodeInserter.handles crashed
  // instead of letting NodeSelectionNodeInserter handle the insertion.
  test("pasting a file while an attachment is node-selected inserts after it", async ({ page, editor }) => {
    await editor.setValue(pdfAttachment)
    await editor.flush()

    const figure = editor.content.locator("figure.attachment")
    await expect(figure).toBeVisible()

    await figure.click()
    await expect(figure).toHaveClass(/node--selected/)

    await editor.paste("", {
      files: [ { base64: PDF_BASE64, name: "pasted.pdf", type: "application/pdf" } ],
    })

    await expect(editor.content.locator("figure.attachment")).toHaveCount(2, { timeout: 10_000 })
  })

  test("inserting inline content while an attachment is node-selected keeps the root valid", async ({ page, editor }) => {
    await editor.setValue(`${pdfAttachment}<p>pasted text</p>`)
    await editor.flush()

    const figure = editor.content.locator("figure.attachment")
    await expect(figure).toBeVisible()

    await figure.click()
    await expect(figure).toHaveClass(/node--selected/)

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    // Detach the existing text node and re-insert it through the node-selection path,
    // mimicking inline clipboard nodes being inserted while the attachment is selected.
    const error = await page.evaluate(() => {
      const editorElement = document.querySelector("lexxy-editor")
      let message = null
      editorElement.editor.update(() => {
        const root = editorElement.editor.getEditorState()._nodeMap.get("root")
        const paragraph = root.getChildren().find((child) => child.getType() === "paragraph")
        const textNode = paragraph.getFirstChild()
        textNode.remove()
        try {
          editorElement.contents.insertAtCursor(textNode)
        } catch (err) {
          message = err.message
        }
      })
      return message
    })

    await editor.flush()

    expect(error).toBeNull()
    expect(errors).toEqual([])
    await expect(figure).toHaveCount(1)
    await expect(editor.content).toContainText("pasted text")
    expect(await editor.plainTextValue()).toContain("pasted text")
  })

  // "Cannot read properties of null (reading 'selectEnd')":
  // uploading a file while the caret sits in an empty code block leaves no node
  // at the caret, and CodeNodeInserter crashed trying to select it. Driven through
  // Contents#uploadFiles directly, the same entry point document-level drop zones use.
  // A <code> block can't hold an attachment, so the file lands after the block rather
  // than being silently discarded.
  test("uploading a file with the caret in a code block lands it after the block", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>keep me</code></pre>')
    await editor.flush()

    await editor.click()

    const errorMessage = await page.evaluate(() => {
      const editorElement = document.querySelector("lexxy-editor")
      const file = new File([ "%PDF-1.4 dummy" ], "dropped.pdf", { type: "application/pdf" })
      try {
        editorElement.contents.uploadFiles([ file ])
        return null
      } catch (error) {
        return error.message
      }
    })

    expect(errorMessage).toBeNull()

    // The file is uploaded (not silently dropped) and the code block keeps its contents.
    await expect(editor.content.locator("figure.attachment")).toHaveCount(1, { timeout: 10_000 })
    await expect(editor.content.locator("code")).toContainText("keep me")
  })

  // "Cannot read properties of null (reading 'splice')":
  // isOnPreviewableImage looks at the selection's first node (the image), but the gallery
  // was resolved from the anchor — the trailing text node, which can't join a gallery. The
  // lookup returned null and GalleryUploader crashed on `gallery.splice(...)`. Resolving from
  // the image node itself makes the existing image and the uploaded one form a gallery.
  test("uploading an image with the selection spanning from an image into text forms a gallery", async ({ page, editor }) => {
    await editor.setValue(`${imageAttachment}<p>hello world</p>`)
    await editor.flush()

    // Select from the image down into the trailing text: anchor at the end of the text,
    // focus on the root just before the image. This is what dragging from the image into
    // the text below produces — the image is the first selected node, the anchor is text.
    await page.evaluate(() => {
      const editorElement = document.querySelector("lexxy-editor")
      editorElement.editor.update(() => {
        const root = editorElement.editor.getEditorState()._nodeMap.get("root")
        const image = root.getChildren().find((child) => child.getType() === "action_text_attachment")
        const lastText = root.getLastDescendant()
        const selection = lastText.select(lastText.getTextContentSize(), lastText.getTextContentSize())
        selection.focus.set(root.getKey(), image.getIndexWithinParent(), "element")
      })
    })

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.uploadFile("test/fixtures/files/example.png")
    await editor.flush()

    // The dropped image lands (standalone image + new gallery = 2 figures) and nothing throws.
    await expect(editor.content.locator("figure.attachment")).toHaveCount(2, { timeout: 10_000 })
    expect(errors).toEqual([])
  })
})
