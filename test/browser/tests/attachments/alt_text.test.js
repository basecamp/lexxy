import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

const attachment = (attrs = {}) => {
  const defaults = {
    sgid: "test-sgid-image",
    "content-type": "image/png",
    filename: "racecar.png",
    filesize: "12345",
    url: "http://example.com/racecar.png",
    width: "320",
    height: "240",
  }
  const merged = { ...defaults, ...attrs }
  const attrString = Object.entries(merged).map(([ k, v ]) => `${k}="${v}"`).join(" ")
  return `<action-text-attachment ${attrString}></action-text-attachment>`
}

const openAltEditor = async (page) => {
  await page.locator("figure.attachment img").click()

  const badge = page.locator("lexxy-alt-text-button .lexxy-alt-text")
  await expect(badge).toBeVisible()
  await badge.click()

  const panel = page.locator(".lexxy-alt-text__panel")
  await expect(panel).toBeVisible()
  return panel
}

test.describe("Image attachment alt text", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("a selected image reveals an alt text badge", async ({ page, editor }) => {
    await editor.setValue(attachment())
    await editor.flush()

    const badge = page.locator("lexxy-alt-text-button .lexxy-alt-text")
    await page.locator("figure.attachment img").click()
    await expect(badge).toBeVisible()
  })

  test("the badge indicates when alt text is missing", async ({ page, editor }) => {
    await editor.setValue(attachment())
    await editor.flush()

    const badge = page.locator("lexxy-alt-text-button .lexxy-alt-text")
    await expect(badge).toHaveClass(/lexxy-alt-text--missing/)
  })

  test("the badge does not indicate missing when alt text is present", async ({ page, editor }) => {
    await editor.setValue(attachment({ alt: "A red racecar at the track" }))
    await editor.flush()

    const badge = page.locator("lexxy-alt-text-button .lexxy-alt-text")
    await expect(badge).not.toHaveClass(/lexxy-alt-text--missing/)
  })

  test("the editor loads the existing alt text", async ({ page, editor }) => {
    await editor.setValue(attachment({ alt: "A red racecar at the track" }))
    await editor.flush()

    const panel = await openAltEditor(page)
    await expect(panel.locator("textarea")).toHaveValue("A red racecar at the track")
  })

  test("alt text can be edited and saved", async ({ page, editor }) => {
    await editor.setValue(attachment())
    await editor.flush()

    const panel = await openAltEditor(page)
    const input = panel.locator("textarea")
    await input.fill("A red racecar at the track")
    await input.press("Enter")

    await expect.poll(async () => {
      await editor.flush()
      return await editor.value()
    }, { timeout: 5_000 }).toContain('alt="A red racecar at the track"')
  })

  test("editing alt text applies it to the rendered image", async ({ page, editor }) => {
    await editor.setValue(attachment())
    await editor.flush()

    const panel = await openAltEditor(page)
    const input = panel.locator("textarea")
    await input.fill("A red racecar at the track")
    await input.press("Enter")
    await editor.flush()

    await expect(page.locator("figure.attachment img")).toHaveAttribute("alt", "A red racecar at the track")
  })

  test("an uploaded image starts without alt text", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/example.png")

    await expect(page.locator("figure.attachment[data-content-type='image/png']")).toBeVisible({ timeout: 10_000 })

    const badge = page.locator("lexxy-alt-text-button .lexxy-alt-text")
    await expect(badge).toHaveClass(/lexxy-alt-text--missing/)

    const panel = await openAltEditor(page)
    await expect(panel.locator("textarea")).toHaveValue("")
  })

  test("clicking away commits and closes the editor", async ({ page, editor }) => {
    await editor.setValue(attachment())
    await editor.flush()

    const panel = await openAltEditor(page)
    await panel.locator("textarea").fill("A red racecar at the track")

    // Click outside the badge and panel to dismiss
    await page.mouse.click(5, 5)
    await expect(panel).toBeHidden()

    await expect.poll(async () => {
      await editor.flush()
      return await editor.value()
    }, { timeout: 5_000 }).toContain('alt="A red racecar at the track"')
  })

  test("Escape discards an in-progress edit", async ({ page, editor }) => {
    await editor.setValue(attachment({ alt: "A red racecar at the track" }))
    await editor.flush()

    const panel = await openAltEditor(page)
    const input = panel.locator("textarea")
    await input.fill("An accidental change")
    await input.press("Escape")

    await expect(panel).toBeHidden()
    expect(await editor.value()).toContain('alt="A red racecar at the track"')
  })

  test("non-image attachments do not get an alt text badge", async ({ page, editor }) => {
    await mockActiveStorageUploads(page)
    await editor.uploadFile("test/fixtures/files/note.txt", { via: "file" })

    const figure = page.locator("figure.attachment[data-content-type='text/plain']")
    await expect(figure).toBeVisible({ timeout: 10_000 })

    await expect(page.locator("lexxy-alt-text-button")).toHaveCount(0)
  })

  test("editing alt text leaves the caption untouched", async ({ page, editor }) => {
    await editor.setValue(attachment({ caption: "Race day" }))
    await editor.flush()

    const panel = await openAltEditor(page)
    const input = panel.locator("textarea")
    await input.fill("A red racecar at the track")
    await input.press("Enter")

    await expect.poll(async () => {
      await editor.flush()
      return await editor.value()
    }, { timeout: 5_000 }).toContain('alt="A red racecar at the track"')

    expect(await editor.value()).toContain('caption="Race day"')
  })
})
