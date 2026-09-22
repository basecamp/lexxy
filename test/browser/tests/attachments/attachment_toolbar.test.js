import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { attachmentTag, selectAttachment } from "../../helpers/attachment_helpers.js"

test.describe("Attachment toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/*.png", route => route.fulfill({ path: "test/fixtures/files/example.png", contentType: "image/png" }))
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("appears for a selected attachment and hides when selection leaves it", async ({ page, editor }) => {
    await editor.setValue(
      "<p>Above</p>" +
      attachmentTag("a", "example.png")
    )
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible()

    const toolbar = page.locator("lexxy-attachment-toolbar")
    await expect(toolbar).toHaveAttribute("role", "toolbar")
    await expect(toolbar).toBeHidden()

    await selectAttachment(figure)
    await expect(toolbar).toBeVisible()

    await editor.content.locator("p", { hasText: "Above" }).click()
    await expect(toolbar).toBeHidden()
  })

  test("Alt+F10 focuses the remove button; Escape returns focus to the editor", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "example.png"))
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await editor.focus()
    await selectAttachment(figure)
    await expect(figure).toHaveClass(/node--selected/)
    await page.keyboard.press("Alt+F10")

    const removeButton = page.locator("lexxy-attachment-toolbar button[aria-label='Remove']")
    await expect(removeButton).toBeFocused()

    await page.keyboard.press("Escape")
    await expect(editor.content).toBeFocused()
    await expect(figure).toHaveClass(/node--selected/)
  })

  test("repositions beside the attachment when the editor reflows", async ({ page, editor }) => {
    await page.setViewportSize({ width: 1200, height: 800 })
    await editor.setValue(
      `<p>${"word ".repeat(120)}</p>` +
      attachmentTag("a", "example.png")
    )
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible()
    await selectAttachment(figure)

    const toolbar = page.locator("lexxy-attachment-toolbar")
    await expect(toolbar).toBeVisible()
    const wideTop = (await figure.boundingBox()).y

    await page.setViewportSize({ width: 360, height: 800 })

    await expect.poll(async () => (await figure.boundingBox()).y).not.toBe(wideTop)
    await expect.poll(async () => {
      const [ figureBox, toolbarBox ] = await boxes(figure, toolbar)
      return Math.max(Math.abs(toolbarBox.y - figureBox.y), Math.abs(right(toolbarBox) - right(figureBox)))
    }).toBeLessThanOrEqual(TOLERANCE)
  })

  test("aligns with the selected gallery image", async ({ page, editor }) => {
    await editor.setValue(`<div class="attachment-gallery">${attachmentTag("a", "one.png")}${attachmentTag("b", "two.png")}</div>`)
    await editor.flush()

    const figure = page.locator(".attachment-gallery figure.attachment").first()
    await expect(figure).toBeVisible()
    await selectAttachment(figure)

    const toolbar = page.locator("lexxy-attachment-toolbar")
    await expect(toolbar).toHaveAttribute("data-presentation", "gallery")

    const [ figureBox, toolbarBox ] = await boxes(figure, toolbar)
    expect(Math.abs(toolbarBox.y - figureBox.y)).toBeLessThanOrEqual(TOLERANCE)
    expect(Math.abs(right(toolbarBox) - right(figureBox))).toBeLessThanOrEqual(TOLERANCE)
  })

  test("hangs off the top-right corner of a block attachment", async ({ page, editor }) => {
    await editor.setValue(
      "<p>Above</p>" +
      attachmentTag("a", "example.png")
    )
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible()
    await selectAttachment(figure)

    const toolbar = page.locator("lexxy-attachment-toolbar")
    await expect(toolbar).toBeVisible()
    const [ figureBox, toolbarBox ] = await boxes(figure, toolbar)
    expect(Math.abs(toolbarBox.y - figureBox.y)).toBeLessThanOrEqual(TOLERANCE)
    expect(Math.abs(right(toolbarBox) - right(figureBox))).toBeLessThanOrEqual(TOLERANCE)
  })

  test("centers on a horizontal divider", async ({ page, editor }) => {
    await editor.setValue("<p>Before</p><hr><p>After</p>")
    await editor.flush()

    const figure = page.locator("figure.horizontal-divider")
    await expect(figure).toBeVisible()
    await selectAttachment(figure)

    const toolbar = page.locator("lexxy-attachment-toolbar")
    await expect(toolbar).toHaveAttribute("data-node-type", "horizontal_divider")

    const [ figureBox, toolbarBox ] = await boxes(figure, toolbar)
    expect(Math.abs(middle(toolbarBox) - middle(figureBox))).toBeLessThanOrEqual(TOLERANCE)
    expect(right(toolbarBox)).toBeLessThanOrEqual(right(figureBox))
  })

  test("sits after an inline attachment", async ({ page, editor }) => {
    await editor.setValue(
      '<p>Hello <action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;Alice&lt;/span&gt;"></action-text-attachment> and welcome to the project.</p>'
    )
    await editor.flush()

    const chip = page.locator("action-text-attachment[content-type='application/vnd.test.mention']")
    await expect(chip).toBeVisible()
    await chip.click()

    const toolbar = page.locator("lexxy-attachment-toolbar")
    await expect(toolbar).toBeVisible()
    await expect(toolbar).toHaveAttribute("data-presentation", "inline")

    const [ chipBox, toolbarBox ] = await boxes(chip, toolbar)
    expect(toolbarBox.x).toBeGreaterThanOrEqual(right(chipBox))
    expect(Math.abs(middle(toolbarBox) - middle(chipBox))).toBeLessThanOrEqual(TOLERANCE)
  })

  test("moves before an inline attachment that leaves no room after it", async ({ page, editor }) => {
    await page.setViewportSize({ width: 360, height: 600 })
    await editor.setValue(
      '<p><action-text-attachment sgid="alice" content-type="application/vnd.test.mention" content="&lt;span&gt;AlexandriaOcasioCortezOfTheFourteenthDistrictOfNewYork&lt;/span&gt;"></action-text-attachment></p>'
    )
    await editor.flush()

    const chip = page.locator("action-text-attachment[content-type='application/vnd.test.mention']")
    await chip.click()

    const toolbar = page.locator("lexxy-attachment-toolbar")
    await expect(toolbar).toBeVisible()
    await expect(toolbar).toHaveAttribute("data-overflow", "")

    const [ chipBox, toolbarBox, editorBox ] = await boxes(chip, toolbar, page.locator("lexxy-editor"))
    expect(toolbarBox.x).toBeGreaterThanOrEqual(editorBox.x)
    expect(right(toolbarBox)).toBeLessThanOrEqual(right(editorBox))
    expect(right(toolbarBox)).toBeLessThanOrEqual(right(chipBox) + TOLERANCE)
  })
})

// Browsers round subpixel boxes differently; two device pixels covers all three.
const TOLERANCE = 2

async function boxes(...locators) {
  return Promise.all(locators.map((locator) => locator.boundingBox()))
}

function right(box) {
  return box.x + box.width
}

function middle(box) {
  return box.y + box.height / 2
}
