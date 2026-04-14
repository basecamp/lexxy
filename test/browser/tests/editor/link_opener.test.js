import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const modifier = process.platform === "darwin" ? "Meta" : "Control"

test.describe("Link opener", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue('<p>Visit <a href="https://example.com">example</a> today</p>')
    await editor.flush()
  })

  test("holding modifier makes links non-editable", async ({ page, editor }) => {
    const anchor = editor.content.locator("a")

    await expect(anchor).not.toHaveAttribute("contenteditable")
    await page.keyboard.down(modifier)
    await expect(anchor).toHaveAttribute("contenteditable", "false")
    await page.keyboard.up(modifier)
    await expect(anchor).not.toHaveAttribute("contenteditable")
  })

  test("holding modifier sets target and rel on links", async ({ page, editor }) => {
    const anchor = editor.content.locator("a")

    await page.keyboard.down(modifier)
    await expect(anchor).toHaveAttribute("target", "_blank")
    await expect(anchor).toHaveAttribute("rel", "noopener noreferrer")
    await page.keyboard.up(modifier)
    await expect(anchor).not.toHaveAttribute("target")
    await expect(anchor).not.toHaveAttribute("rel")
  })

  test("applies to all links in the editor", async ({ editor, page }) => {
    await editor.setValue(
      '<p><a href="https://a.com">first</a> and <a href="https://b.com">second</a></p>',
    )
    await editor.flush()

    const anchors = editor.content.locator("a")

    await page.keyboard.down(modifier)
    await expect(anchors.nth(0)).toHaveAttribute("contenteditable", "false")
    await expect(anchors.nth(1)).toHaveAttribute("contenteditable", "false")
    await page.keyboard.up(modifier)
    await expect(anchors.nth(0)).not.toHaveAttribute("contenteditable")
    await expect(anchors.nth(1)).not.toHaveAttribute("contenteditable")
  })

  test("clears link attributes on window blur", async ({ page, editor }) => {
    const anchor = editor.content.locator("a")

    await page.keyboard.down(modifier)
    await expect(anchor).toHaveAttribute("contenteditable", "false")

    await page.evaluate(() => window.dispatchEvent(new Event("blur")))
    await expect(anchor).not.toHaveAttribute("contenteditable")
  })
})
