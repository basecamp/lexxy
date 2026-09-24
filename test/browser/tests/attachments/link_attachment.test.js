import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"
import { openToolbarDropdown } from "../../helpers/toolbar.js"

const URL_INPUT = "lexxy-link-dropdown [data-dropdown-panel] input[type='url']"

function attachment(href = null) {
  const hrefAttribute = href ? ` href="${href}"` : ""
  return `<action-text-attachment${hrefAttribute} content-type="image/png" url="/test.png" filename="test.png" filesize="1024" width="100" height="100"></action-text-attachment>`
}

function exportedAttachment(href = null) {
  const hrefAttribute = href ? ` href="${href}"` : ""
  return `<action-text-attachment${hrefAttribute} url="/test.png" alt="" caption="" content-type="image/png" filename="test.png" filesize="1024" width="100" height="100" presentation="gallery"></action-text-attachment>`
}

test.describe("Linking attachments", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("linking a selected image sets its href", async ({ page, editor }) => {
    await editor.setValue(attachment())
    await selectAttachment(page)

    await linkTo(page, "https://example.com")

    await assertEditorHtml(editor, exportedAttachment("https://example.com"))
  })

  test("a linked image survives being loaded again", async ({ editor }) => {
    await editor.setValue(attachment("https://example.com"))

    await assertEditorHtml(editor, exportedAttachment("https://example.com"))
  })

  test("relinking a selected image replaces its href", async ({ page, editor }) => {
    await editor.setValue(attachment("https://example.com"))
    await selectAttachment(page)

    await linkTo(page, "https://example.org")

    await assertEditorHtml(editor, exportedAttachment("https://example.org"))
  })

  test("unlinking a selected image removes its href", async ({ page, editor }) => {
    await editor.setValue(attachment("https://example.com"))
    await selectAttachment(page)

    await openToolbarDropdown(page, "link")
    await page.locator("lexxy-link-dropdown [data-dropdown-panel] button[value='unlink']").first().click()

    await assertEditorHtml(editor, exportedAttachment())
  })

  test("the link dialog shows the href of a linked image", async ({ page, editor }) => {
    await editor.setValue(attachment("https://example.com"))
    await selectAttachment(page)

    await openToolbarDropdown(page, "link")

    await expect(page.locator(URL_INPUT).first()).toHaveValue("https://example.com")
  })

  test("the link button is pressed while a linked image is selected", async ({ page, editor }) => {
    const linkButton = page.locator("button[name='link']")

    await editor.setValue(attachment())
    await selectAttachment(page)
    await expect(linkButton).toHaveAttribute("aria-pressed", "false")

    await linkTo(page, "https://example.com")
    await expect(linkButton).toHaveAttribute("aria-pressed", "true")
  })

  test("only images can be linked", async ({ page, editor }) => {
    const pdf = '<action-text-attachment content-type="application/pdf" url="/test.pdf" filename="test.pdf" filesize="1024"></action-text-attachment>'
    await editor.setValue(pdf)
    await page.locator("figure.attachment").click()
    await expect(page.locator("figure.attachment")).toHaveClass(/node--selected/)

    await linkTo(page, "https://example.com")

    expect(await editor.value()).not.toContain("href")
  })

  test("an image in a gallery can be linked", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachment()}${attachment()}</div>`)
    await page.locator(".attachment-gallery figure.attachment img").first().click()

    await linkTo(page, "https://example.com")

    await assertEditorHtml(editor, `<div class="attachment-gallery attachment-gallery--2">${exportedAttachment("https://example.com")}${exportedAttachment()}</div>`)
  })
})

async function selectAttachment(page) {
  await page.locator("figure.attachment img").click()
  await expect(page.locator("figure.attachment")).toHaveClass(/node--selected/)
}

async function linkTo(page, url) {
  await openToolbarDropdown(page, "link")

  const input = page.locator(URL_INPUT).first()
  await expect(input).toBeVisible({ timeout: 2_000 })
  await input.fill(url)
  await page.locator("lexxy-link-dropdown [data-dropdown-panel] button[value='link']").first().click()
}
