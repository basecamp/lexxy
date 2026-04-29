import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { NativeCapture } from "../../helpers/native_capture.js"
import { clickToolbarButton } from "../../helpers/toolbar.js"

test.describe("native: history dispatch", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("after an edit, undo.enabled is true and redo.enabled is false", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()

    await editor.click()
    await editor.send("hello")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes.undo.enabled).toBe(true)
    expect(last.attributes.redo.enabled).toBe(false)
    await capture.assertContract()
  })

  test("undo dispatches an attributes-change", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.click()
    await editor.send("hello")
    await editor.flush()

    await capture.reset()
    await clickToolbarButton(page, "undo")
    await editor.flush()

    expect(await capture.count()).toBeGreaterThan(0)
  })

  test("redo dispatches an attributes-change with redo.enabled true after undo", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await editor.click()
    await editor.send("hello")
    await editor.flush()
    await clickToolbarButton(page, "undo")
    await editor.flush()

    await capture.reset()
    await clickToolbarButton(page, "redo")
    await editor.flush()

    expect(await capture.count()).toBeGreaterThan(0)
    const last = await capture.last()
    expect(last.attributes.redo.enabled).toBe(false)
  })
})
