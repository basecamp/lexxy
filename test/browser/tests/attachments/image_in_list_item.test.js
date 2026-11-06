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

  test("image inserted after a soft line break in an otherwise empty bullet keeps the bullet", async ({ editor }) => {
    await editor.send("Intro", "Enter", "1. ", "Shift+Enter")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    expect(await editor.value()).toMatch(/^<p>Intro<\/p><ol><li value="1"><br><br><\/li><\/ol><action-text-attachment [^>]*><\/action-text-attachment>$/)
    await expect(editor.content.locator("ol > li")).toHaveCount(1)
  })

  test("image inserted after a soft line break in an empty middle bullet keeps the list in one piece before it", async ({ editor }) => {
    await editor.setValue("<ol><li>First</li><li>Second</li></ol>")
    await editor.select("First")
    await editor.send("End", "Enter", "Shift+Enter")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    expect(await editor.value()).toMatch(/^<ol><li value="1">First<\/li><li value="2"><br><br><\/li><\/ol><action-text-attachment [^>]*><\/action-text-attachment><ol start="3"><li value="3">Second<\/li><\/ol>$/)
    await expect(editor.content.locator("ol")).toHaveCount(2)
    await expect(editor.content.locator("ol").nth(0).locator("li")).toHaveCount(2)
    await expect(editor.content.locator("ol").nth(1)).toHaveAttribute("start", "3")
  })

  test("image inserted into a numbered list keeps counting after the image", async ({ editor }) => {
    await editor.setValue("<ol><li>First</li><li>Second</li><li>Third</li></ol>")
    await editor.select("Second")
    await editor.send("End")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    expect(await editor.value()).toMatch(/^<ol><li value="1">First<\/li><li value="2">Second<\/li><\/ol><action-text-attachment [^>]*><\/action-text-attachment><ol start="3"><li value="3">Third<\/li><\/ol>$/)
    await expect(editor.content.locator("ol").nth(1)).toHaveAttribute("start", "3")
  })

  test("image inserted into the second numbered list of a quote continues that list", async ({ editor }) => {
    await editor.setValue('<blockquote><ol><li>One</li></ol><p>Between</p><ol start="10"><li>Ten</li><li>Eleven</li></ol></blockquote>')
    await editor.select("Ten")
    await editor.send("End")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    expect(await editor.value()).toMatch(/^<blockquote><ol><li value="1">One<\/li><\/ol><p>Between<\/p><ol start="10"><li value="10">Ten<\/li><\/ol><\/blockquote><action-text-attachment [^>]*><\/action-text-attachment><blockquote><ol start="11"><li value="11">Eleven<\/li><\/ol><\/blockquote>$/)
  })

  test("image inserted into a numbered list inside nested quotes continues the list", async ({ editor }) => {
    await editor.setValue("<blockquote><blockquote><ol><li>One</li><li>Two</li></ol></blockquote></blockquote>")
    await editor.select("One")
    await editor.send("End")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    expect(await editor.value()).toMatch(/<action-text-attachment [^>]*><\/action-text-attachment><blockquote><blockquote><ol start="2"><li value="2">Two<\/li><\/ol><\/blockquote><\/blockquote>$/)
  })

  test("image inserted after the last bullet of a quote leaves a later list's numbering alone", async ({ editor }) => {
    await editor.setValue('<blockquote><ol><li>One</li></ol><p>Between</p><ol start="5"><li>Five</li></ol></blockquote>')
    await editor.select("One")
    await editor.send("End")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    expect(await editor.value()).toMatch(/<ol start="5"><li value="5">Five<\/li><\/ol><\/blockquote>$/)
  })

  test("image inserted into a blank bullet inside a quote leaves no empty list behind", async ({ editor }) => {
    await editor.setValue("<blockquote><ol><li>First</li></ol></blockquote>")
    await editor.select("First")
    await editor.send("End", "Enter")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    const html = await editor.value()
    expect(html).toMatch(/^<blockquote><ol><li value="1">First<\/li><\/ol><\/blockquote><action-text-attachment [^>]*><\/action-text-attachment>$/)

    await editor.send("after")
    expect(await editor.value()).toMatch(/<\/action-text-attachment><p>after<\/p>$/)
  })

  test("image inserted into the only bullet of a quote, left blank, replaces the quote", async ({ editor }) => {
    await editor.setValue("<blockquote><ol><li>First</li></ol></blockquote>")
    await editor.select("First")
    await editor.send("Backspace")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    expect(await editor.value()).toMatch(/^<action-text-attachment [^>]*><\/action-text-attachment>$/)
  })

  test("image inserted into the last bullet of a quote lands after the quote", async ({ editor }) => {
    await editor.setValue("<blockquote><ol><li>First</li><li>Second</li></ol></blockquote>")
    await editor.select("Second")
    await editor.send("End")

    await editor.uploadFile("test/fixtures/files/example.png")
    await assertImageAttachments(editor, 1)

    await assertListIntegrity(editor)
    await editor.send("after")
    expect(await editor.value()).toMatch(/^<blockquote><ol><li value="1">First<\/li><li value="2">Second<\/li><\/ol><\/blockquote><action-text-attachment [^>]*><\/action-text-attachment><p>after<\/p>$/)
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
