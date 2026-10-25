import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { NativeCapture } from "../../helpers/native_capture.js"
import { clickToolbarButton, HELLO_EVERYONE } from "../../helpers/toolbar.js"

// The native apps invoke heading formats as commands; the web toolbar has no buttons for them.
function dispatchCommand(page, command) {
  return page.evaluate((command) => {
    document.querySelector("lexxy-editor").editor.dispatchCommand(command)
  }, command)
}

test.describe("native: format toggle dispatch", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await editor.setValue(HELLO_EVERYONE)
    await editor.select("everyone")
  })

  test("bold dispatches and flips bold.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await clickToolbarButton(page, "bold")
    await editor.flush()

    expect(await capture.count()).toBeGreaterThan(0)
    expect((await capture.last()).attributes.bold.active).toBe(true)
    await capture.assertContract()
  })

  test("italic dispatches and flips italic.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await clickToolbarButton(page, "italic")
    await editor.flush()

    expect((await capture.last()).attributes.italic.active).toBe(true)
    await capture.assertContract()
  })

  test("strikethrough dispatches and flips strikethrough.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await clickToolbarButton(page, "strikethrough")
    await editor.flush()

    expect((await capture.last()).attributes.strikethrough.active).toBe(true)
    await capture.assertContract()
  })

  test("setFormatHeadingLarge dispatches with heading.active and headingTag h2", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await dispatchCommand(page, "setFormatHeadingLarge")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes.heading.active).toBe(true)
    expect(last.headingTag).toBe("h2")
    await capture.assertContract()
  })

  test("setFormatHeadingMedium → h3, setFormatHeadingSmall → h4", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await dispatchCommand(page, "setFormatHeadingMedium")
    await editor.flush()
    expect((await capture.last()).headingTag).toBe("h3")

    await dispatchCommand(page, "setFormatHeadingSmall")
    await editor.flush()
    expect((await capture.last()).headingTag).toBe("h4")
  })

  test("setFormatParagraph clears heading", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await dispatchCommand(page, "setFormatHeadingLarge")
    await editor.flush()
    await dispatchCommand(page, "setFormatParagraph")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes.heading.active).toBe(false)
    expect(last.headingTag).toBeNull()
  })

  test("insertQuoteBlock toggles quote.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await clickToolbarButton(page, "insertQuoteBlock")
    await editor.flush()

    expect((await capture.last()).attributes.quote.active).toBe(true)
  })

  test("insertUnorderedList toggles unordered-list.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await clickToolbarButton(page, "insertUnorderedList")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes["unordered-list"].active).toBe(true)
    expect(last.attributes["ordered-list"].active).toBe(false)
  })

  test("insertOrderedList toggles ordered-list.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()
    await capture.reset()

    await clickToolbarButton(page, "insertOrderedList")
    await editor.flush()

    const last = await capture.last()
    expect(last.attributes["ordered-list"].active).toBe(true)
    expect(last.attributes["unordered-list"].active).toBe(false)
  })

  test("toggling bold off clears bold.active", async ({ page, editor }) => {
    const capture = new NativeCapture(page)
    await capture.install()

    await clickToolbarButton(page, "bold")
    await editor.flush()
    await editor.select("everyone")
    await clickToolbarButton(page, "bold")
    await editor.flush()

    expect((await capture.last()).attributes.bold.active).toBe(false)
    await capture.assertContract()
  })
})
