import { test } from "../../test_helper.js"
import { EditorHandle } from "../../helpers/editor_handle.js"
import { expect } from "@playwright/test"

test.describe("Prompt popover inside a clipping container", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 700 })
    await page.goto("/prompt-overflow-container.html")
  })

  test("flips above the cursor when the menu overflows a scroll container while the window still has room below", async ({ page }) => {
    const popover = await openPrompt(page)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")

    const positions = await measure(page)
    expect(positions.popoverBottom).toBeLessThanOrEqual(positions.containerBottom + 1)
    expect(positions.popoverBottom).toBeLessThan(positions.viewportBottom)
  })

  test("stays below the cursor when no ancestor clips and the window has room", async ({ page }) => {
    await page.evaluate(() => {
      const container = document.querySelector(".scroll-container")
      container.style.overflow = "visible"
      container.style.blockSize = "auto"
    })

    const popover = await openPrompt(page)
    await expect(popover).not.toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("stays below the cursor when the scroll container has even less room above it", async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector(".filler").remove()
      document.querySelector(".scroll-container").style.blockSize = "150px"
    })

    const popover = await openPrompt(page)
    await expect(popover).not.toHaveAttribute("data-clipped-at-bottom", "")

    const positions = await measure(page)
    expect(positions.popoverBottom).toBeGreaterThan(positions.containerBottom)
  })

  test("flips above the cursor at the bottom edge of the window with no clipping ancestor", async ({ page }) => {
    await page.evaluate(() => {
      const container = document.querySelector(".scroll-container")
      container.style.overflow = "visible"
      container.style.blockSize = "auto"
      document.querySelector(".filler").style.blockSize = "600px"
    })

    const popover = await openPrompt(page)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")

    const positions = await measure(page)
    expect(positions.popoverBottom).toBeLessThanOrEqual(positions.viewportBottom)
  })

  test("ignores clipping ancestors that a fixed-position container escapes", async ({ page }) => {
    await page.evaluate(() => {
      const form = document.querySelector("form")
      form.style.overflow = "hidden"
      form.style.blockSize = "0"

      const container = document.querySelector(".scroll-container")
      container.style.position = "fixed"
      container.style.insetBlockStart = "0"
      container.style.overflow = "visible"
      container.style.blockSize = "auto"
    })

    const popover = await openPrompt(page)
    await expect(popover).not.toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("measures the scroll container's scrollport, not its border box", async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector(".scroll-container").style.borderBlockEnd = "250px solid #ccc"
    })

    const popover = await openPrompt(page)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("keeps the clipping of a transformed ancestor that contains a fixed-position container", async ({ page }) => {
    await page.evaluate(() => {
      const form = document.querySelector("form")
      form.style.transform = "translateZ(0)"
      form.style.overflow = "hidden"
      form.style.blockSize = "320px"

      const container = document.querySelector(".scroll-container")
      container.style.position = "fixed"
      container.style.insetBlockStart = "0"
      container.style.overflow = "visible"
      container.style.blockSize = "auto"
    })

    const popover = await openPrompt(page)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("measures a scaled scroll container in viewport coordinates", async ({ page }) => {
    await page.evaluate(() => {
      const container = document.querySelector(".scroll-container")
      container.style.transform = "scale(0.5)"
      container.style.transformOrigin = "top left"
    })

    const popover = await openPrompt(page)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("ignores a boxless fixed-position wrapper between the editor and its scroll container", async ({ page }) => {
    await page.evaluate(() => {
      const editor = document.querySelector("lexxy-editor")
      const wrapper = document.createElement("div")
      wrapper.style.display = "contents"
      wrapper.style.position = "fixed"
      editor.before(wrapper)
      wrapper.append(editor)
    })

    const popover = await openPrompt(page)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("treats paint containment as clipping", async ({ page }) => {
    await page.evaluate(() => {
      const container = document.querySelector(".scroll-container")
      container.style.overflow = "visible"
      container.style.contain = "paint"
      container.style.blockSize = "360px"
    })

    const popover = await openPrompt(page)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("keeps the clipping of a content-visibility ancestor that contains a fixed-position container", async ({ page }) => {
    await page.evaluate(() => {
      const form = document.querySelector("form")
      form.style.contentVisibility = "auto"
      form.style.overflow = "hidden"
      form.style.blockSize = "320px"

      const container = document.querySelector(".scroll-container")
      container.style.position = "fixed"
      container.style.insetBlockStart = "0"
      container.style.overflow = "visible"
      container.style.blockSize = "auto"
    })

    const popover = await openPrompt(page)
    await expect(popover).toHaveAttribute("data-clipped-at-bottom", "")
  })

  test("ignores clipping ancestors outside a modal dialog", async ({ page }) => {
    await page.evaluate(() => {
      const form = document.querySelector("form")
      form.style.transform = "translateZ(0)"
      form.style.overflow = "hidden"
      form.style.blockSize = "100px"

      const dialog = document.createElement("dialog")
      Object.assign(dialog.style, { margin: "0", padding: "0", border: "0", insetBlockStart: "0", overflow: "visible", maxBlockSize: "none" })
      dialog.append(document.querySelector(".filler"), document.querySelector("lexxy-editor"))
      form.append(dialog)
      dialog.showModal()
    })

    const popover = await openPrompt(page)
    await expect(popover).not.toHaveAttribute("data-clipped-at-bottom", "")
  })
})

async function openPrompt(page) {
  const editor = new EditorHandle(page, "lexxy-editor")
  await editor.waitForConnected()

  await editor.send("@")

  const popover = page.locator(".lexxy-prompt-menu--visible")
  await expect(popover).toBeVisible({ timeout: 5_000 })
  return popover
}

async function measure(page) {
  return page.evaluate(() => {
    const container = document.querySelector(".scroll-container")
    const popover = document.querySelector(".lexxy-prompt-menu--visible")

    return {
      containerBottom: container.getBoundingClientRect().bottom,
      popoverBottom: popover.getBoundingClientRect().bottom,
      viewportBottom: window.innerHeight,
    }
  })
}
