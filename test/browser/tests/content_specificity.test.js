import { test, expect } from "@playwright/test"

test.describe("Content stylesheet specificity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/content-specificity.html")
  })

  test.describe("a low specificity consumer rule wins", () => {
    test("over the attachment preview image styles", async ({ page }) => {
      await expect(page.locator("#overridden-image")).toHaveCSS("border-radius", "0px")
    })

    test("over the attachment figure styles", async ({ page }) => {
      await expect(page.locator("#overridden-figure")).toHaveCSS("padding", "0px")
    })

    test("over the attachment caption styles", async ({ page }) => {
      await expect(page.locator("#overridden-caption")).toHaveCSS("padding", "0px")
    })

    test("over the inline format styles", async ({ page }) => {
      await expect(page.locator("#overridden-italic")).toHaveCSS("font-style", "normal")
    })
  })

  test.describe("without a consumer rule", () => {
    test("the content styles still apply", async ({ page }) => {
      await expect(page.locator("#untouched-image")).not.toHaveCSS("border-radius", "0px")
      await expect(page.locator("#untouched-figure")).not.toHaveCSS("padding", "0px")
      await expect(page.locator("#untouched-caption")).not.toHaveCSS("padding", "0px")
      await expect(page.locator("#untouched-italic")).toHaveCSS("font-style", "italic")
    })
  })
})
