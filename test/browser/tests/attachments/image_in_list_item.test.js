import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Inserting an image into a list item", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test("image inserted into a top-level bullet splits the list without corrupting it", async ({ page, editor }) => {
    await editor.setValue("<ul><li>First</li><li>Second</li></ul>")
    await editor.select("First")
    await editor.send("End")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    // The attachment breaks out between the two bullets, leaving both lists intact.
    await assertListStructure(editor, [ "First" ], [ "Second" ])
  })

  test("image inserted into a nested sub-bullet does not break nesting", async ({ page, editor }) => {
    await editor.setValue("<ul><li>First</li><li>Second</li></ul>")
    await editor.select("Second")
    await editor.sendTab()
    await editor.select("Second")
    await editor.send("End")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    // The attachment breaks out below the whole list; the nested bullet stays nested.
    await assertNestedListIntact(editor)
  })

  test("a second image inserted into a sub-bullet keeps both bullets intact", async ({ page, editor }) => {
    await editor.setValue("<ul><li>First</li><li>Second</li></ul>")
    await editor.select("Second")
    await editor.sendTab()
    await editor.select("Second")
    await editor.send("End")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await editor.uploadFile("test/fixtures/files/example2.png")
    await assertImageAttachments(editor, 2)

    await assertListIntegrity(editor)
    // The second image must not regress the bullet back to a top-level item or
    // drop it entirely — the nested structure stays intact.
    await assertNestedListIntact(editor)
  })
})

async function assertImageAttachments(editor, count) {
  await expect(editor.content.locator("action-text-attachment, figure.attachment")).toHaveCount(count, { timeout: 10_000 })
  await editor.flush()
}

// A list item may legitimately hold an inline mention, but never a block image
// attachment. An attachment nested inside an <li> means the list structure was
// corrupted by the insertion.
async function assertListIntegrity(editor) {
  await editor.flush()
  await expect(editor.content.locator("li action-text-attachment")).toHaveCount(0)
  await expect(editor.content.locator("li figure.attachment")).toHaveCount(0)
}

// Asserts the document's lists, in order, contain exactly the expected
// top-level item texts. Reads the exported value so the assertion reflects the
// canonical structure rather than the rendered DOM's innerText, which folds
// nested-list text into its ancestor <li>.
async function assertListStructure(editor, ...expectedLists) {
  await editor.flush()
  const html = await editor.value()
  const lists = [ ...html.matchAll(/<ul>(.*?)<\/ul>/gs) ].map(match =>
    [ ...match[1].matchAll(/<li[^>]*>([^<]*)/g) ].map(item => item[1].trim()).filter(Boolean)
  )
  expect(lists).toEqual(expectedLists)
}

// The nested sub-bullet case: "Second" remains nested under "First", and the
// attachment sits outside the list entirely.
async function assertNestedListIntact(editor) {
  await editor.flush()
  const html = await editor.value()
  expect(html).toContain("<ul><li value=\"1\">First<ul><li value=\"1\">Second</li></ul></li></ul>")
}
