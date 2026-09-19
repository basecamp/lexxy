import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test("pasting an image preserves its description without adding a caption", async ({ page, editor }) => {
  await page.route("**/canoe.png", route => route.fulfill({ path: "test/fixtures/files/example.png", contentType: "image/png" }))
  await page.goto("/attachments.html")
  await editor.waitForConnected()
  await editor.paste("", { html: '<img src="https://example.com/canoe.png" alt="A red canoe" width="50" height="50">' })

  await expect(page.locator("figure.attachment img")).toHaveAttribute("alt", "A red canoe")
  await expect(page.locator(".attachment__caption-text")).toHaveText("canoe.png")
  await page.locator("figure.attachment figcaption").click()
  await expect(page.getByRole("textbox", { name: "Image caption", exact: true })).toHaveValue("")
  expect(await editor.value()).toContain('alt="A red canoe"')
})
