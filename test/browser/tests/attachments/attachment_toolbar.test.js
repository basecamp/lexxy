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

  test("Alt+F10 focuses the first button; Escape returns focus to the editor", async ({ page, editor }) => {
    await editor.setValue(attachmentTag("a", "example.png"))
    await editor.flush()

    const figure = page.locator("figure.attachment[data-content-type='image/png']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await editor.focus()
    await selectAttachment(figure)
    await expect(figure).toHaveClass(/node--selected/)
    await page.keyboard.press("Alt+F10")

    await expect(page.locator("lexxy-attachment-toolbar button[aria-label='Alternative text']")).toBeFocused()

    await page.keyboard.press("ArrowRight")
    await expect(page.locator("lexxy-attachment-toolbar button[aria-label='Remove']")).toBeFocused()

    await page.keyboard.press("Escape")
    await expect(editor.content).toBeFocused()
    await expect(figure).toHaveClass(/node--selected/)
  })

  test("Alt+F10 falls through to Remove when the attachment cannot have a description", async ({ page, editor }) => {
    await editor.setValue(FILE_ATTACHMENT_TAG)
    await editor.flush()

    const figure = page.locator("figure.attachment")
    await expect(figure).toBeVisible()

    await editor.focus()
    await selectAttachment(figure)
    await page.keyboard.press("Alt+F10")

    await expect(page.locator("lexxy-attachment-toolbar button[aria-label='Alternative text']")).toBeHidden()
    await expect(page.locator("lexxy-attachment-toolbar button[aria-label='Remove']")).toBeFocused()
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
    const inset = await cornerInset(toolbar)
    await expect.poll(async () => {
      const [ figureBox, toolbarBox ] = await boxes(figure, toolbar)
      return Math.max(Math.abs(toolbarBox.y - (figureBox.y + inset)), Math.abs(right(toolbarBox) - (right(figureBox) - inset)))
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

    await expectInsetFromCorner(figure, toolbar)
  })

  test("sits inset from the top-right corner of a block attachment", async ({ page, editor }) => {
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
    await expectInsetFromCorner(figure, toolbar)
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

// A non-previewable attachment: the alternative text button does not apply to it.
const FILE_ATTACHMENT_TAG = `<action-text-attachment sgid="f" content-type="application/pdf" url="/doc.pdf" filename="doc.pdf" filesize="100"></action-text-attachment>`

// Browsers round subpixel boxes differently; two device pixels covers all three.
const TOLERANCE = 2

// Matches the inset in lexxy-editor.css; ch resolves against the toolbar's own font.
const CORNER_INSET = "1.5ch"

// Both gaps come from the same inset, so they track each other far more tightly than TOLERANCE allows.
const SYMMETRY_TOLERANCE = 1

async function expectInsetFromCorner(figure, toolbar) {
  const inset = await cornerInset(toolbar)
  const [ figureBox, toolbarBox ] = await boxes(figure, toolbar)
  const topGap = toolbarBox.y - figureBox.y
  const rightGap = right(figureBox) - right(toolbarBox)

  expect(Math.abs(topGap - inset)).toBeLessThanOrEqual(TOLERANCE)
  expect(Math.abs(rightGap - inset)).toBeLessThanOrEqual(TOLERANCE)
  expect(Math.abs(topGap - rightGap)).toBeLessThanOrEqual(SYMMETRY_TOLERANCE)
}

async function cornerInset(toolbar) {
  return toolbar.evaluate((element, inset) => {
    const probe = document.createElement("div")
    probe.style.position = "absolute"
    probe.style.inlineSize = inset
    element.append(probe)
    const { width } = probe.getBoundingClientRect()
    probe.remove()
    return width
  }, CORNER_INSET)
}

async function boxes(...locators) {
  return Promise.all(locators.map((locator) => locator.boundingBox()))
}

function right(box) {
  return box.x + box.width
}

function middle(box) {
  return box.y + box.height / 2
}
