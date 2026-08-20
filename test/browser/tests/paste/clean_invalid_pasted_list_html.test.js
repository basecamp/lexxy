import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, startMonitoringConsole } from "../../helpers/assertions.js"

async function assertPastedListBecomes(page, editor, pastedHtml, expectedHtml) {
  await page.goto("/")
  await editor.waitForConnected()
  startMonitoringConsole(page)

  await editor.setValue("<p></p>")
  await editor.focus()

  await editor.paste("ignored", { html: pastedHtml })
  await editor.flush()

  await assertEditorHtml(editor, expectedHtml)
  expect(page).toHaveNoErrors()
}

test.describe("Paste list with stray non-<li> children before the first item", () => {
  test("strips a stray <br> and whitespace before the first <ol> item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ol>\n    <br>\n    <li>First item<br></li>\n    <li>Second item<br></li>\n    <li>Third item<br></li>\n</ol>",
      '<ol><li value="1">First item</li><li value="2">Second item</li><li value="3">Third item</li></ol>',
    )
  })

  test("strips a stray <br> before the first <ul> item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul>\n    <br>\n    <li>First item<br></li>\n    <li>Second item<br></li>\n</ul>",
      '<ul><li value="1">First item</li><li value="2">Second item</li></ul>',
    )
  })

  test("strips leading whitespace text before the first <ol> item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ol>\n    <li>First item</li>\n    <li>Second item</li>\n</ol>",
      '<ol><li value="1">First item</li><li value="2">Second item</li></ol>',
    )
  })

  test("keeps an empty <li> that is not leading", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ol><li>First item</li><li></li><li>Second item</li></ol>",
      '<ol><li value="1">First item</li><li value="2"></li><li value="3">Second item</li></ol>',
    )
  })
})

test.describe("Paste list with items inside a stray wrapper element", () => {
  test("keeps items wrapped in a <div> after the first item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div><li>Second item</li><li>Third item</li><li>Fourth item</li></div></ul>",
      '<ul><li value="1">First item</li><li value="2">Second item</li><li value="3">Third item</li><li value="4">Fourth item</li></ul>',
    )
  })

  test("keeps items inside nested wrapper elements", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div><div><li>Second item</li></div><li>Third item</li></div></ul>",
      '<ul><li value="1">First item</li><li value="2">Second item</li><li value="3">Third item</li></ul>',
    )
  })

  test("keeps items from a nested list placed before the first item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><ul><li>Nested item</li></ul><li>First item</li><li>Second item</li></ul>",
      '<ul><li value="1">Nested item</li><li value="2">First item</li><li value="3">Second item</li></ul>',
    )
  })

  test("keeps a nested list inside a stray wrapper after a list item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div><ul><li>Nested item</li></ul></div><li>Second item</li></ul>",
      '<ul><li value="1">First item<ul><li value="1">Nested item</li></ul></li><li value="2">Second item</li></ul>',
    )
  })

  test("keeps items and their sublists inside a stray wrapper", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul>\n  <li>First item</li>\n  <div>\n    <li>Second item</li>\n    <ul><li>Nested under second</li></ul>\n  </div>\n  <li>Third item</li>\n</ul>",
      '<ul><li value="1">First item</li><li value="2">Second item<ul><li value="1">Nested under second</li></ul></li><li value="3">Third item</li></ul>',
    )
  })

  test("keeps a nested list of a different type inside a stray wrapper", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div><ol><li>Nested ordered item</li></ol></div><li>Second item</li></ul>",
      '<ul><li value="1">First item<ol><li value="1">Nested ordered item</li></ol></li><li value="2">Second item</li></ul>',
    )
  })

  test("keeps items but drops stray text inside a wrapper", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div>stray text<li>Second item</li></div></ul>",
      '<ul><li value="1">First item</li><li value="2">Second item</li></ul>',
    )
  })

  test("keeps a nested list inside deeply nested wrappers", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div><div><ul><li>Nested item</li></ul></div></div><li>Second item</li></ul>",
      '<ul><li value="1">First item<ul><li value="1">Nested item</li></ul></li><li value="2">Second item</li></ul>',
    )
  })

  test("nests two wrapped sublists under the previous item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div><ul><li>Nested A</li></ul><ul><li>Nested B</li></ul></div><li>Second item</li></ul>",
      '<ul><li value="1">First item<ul><li value="1">Nested A</li></ul><ul><li value="1">Nested B</li></ul></li><li value="2">Second item</li></ul>',
    )
  })

  test("keeps items wrapped in a <div> before the first item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><div><li>Zero item</li></div><li>First item</li></ul>",
      '<ul><li value="1">Zero item</li><li value="2">First item</li></ul>',
    )
  })

  test("keeps items from a wrapped nested list before the first item", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><div><ul><li>Nested item</li></ul></div><li>First item</li></ul>",
      '<ul><li value="1">Nested item</li><li value="2">First item</li></ul>',
    )
  })

  test("drops bare text between list items", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li>stray text<li>Second item</li></ul>",
      '<ul><li value="1">First item</li><li value="2">Second item</li></ul>',
    )
  })

  test("drops an empty wrapper between list items", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div></div><li>Second item</li></ul>",
      '<ul><li value="1">First item</li><li value="2">Second item</li></ul>',
    )
  })

  test("keeps items but drops a stray <br> inside a wrapper", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div><li>Second item</li><br></div></ul>",
      '<ul><li value="1">First item</li><li value="2">Second item</li></ul>',
    )
  })

  test("doesn't resurrect list items inside an inert template", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>Real item</li><template><li>Template item</li></template></ul>",
      '<ul><li value="1">Real item</li></ul>',
    )
  })

  test("still drops a wrapper with no list items inside", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><div>stray text</div><li>Second item</li></ul>",
      '<ul><li value="1">First item</li><li value="2">Second item</li></ul>',
    )
  })
})

test.describe("Paste list with a nested list as a direct child", () => {
  test("keeps a nested <ul> placed directly inside its parent <ul>", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ul><li>First item</li><ul><li>Nested item</li></ul><li>Second item</li></ul>",
      '<ul><li value="1">First item<ul><li value="1">Nested item</li></ul></li><li value="2">Second item</li></ul>',
    )
  })

  test("keeps a nested <ol> placed directly inside its parent <ol>", async ({ page, editor }) => {
    await assertPastedListBecomes(
      page,
      editor,
      "<ol><li>First item</li><ol><li>Nested item</li></ol><li>Second item</li></ol>",
      '<ol><li value="1">First item<ol><li value="1">Nested item</li></ol></li><li value="2">Second item</li></ol>',
    )
  })
})
