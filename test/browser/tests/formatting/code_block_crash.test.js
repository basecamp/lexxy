import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml } from "../../helpers/assertions.js"

test.describe("Code block toggle resilience", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("toggling inline code on selected text keeps editor functional", async ({ page, editor }) => {
    await editor.click()
    await editor.send("Hello world")
    await editor.selectAll()

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    // Editor should still accept input after code toggle
    await editor.send("End")
    await editor.send(" more text")
    await editor.flush()

    expect(errors.filter((e) => e.includes("node not found"))).toEqual([])

    const value = await editor.value()
    expect(value).toContain("more text")
  })

  test("toggling code block on multi-paragraph selection keeps editor functional", async ({ page, editor }) => {
    await editor.click()
    await editor.send("First paragraph")
    await editor.send("Enter")
    await editor.send("Second paragraph")
    await editor.selectAll()

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    // Should produce a code block
    const value = await editor.value()
    expect(value).toContain("First paragraph")

    // Editor should still accept input
    await editor.send("End")
    await editor.send("Enter")
    await editor.send("New text")
    await editor.flush()

    expect(errors.filter((e) => e.includes("node not found"))).toEqual([])

    const newValue = await editor.value()
    expect(newValue).toContain("New text")
  })

  test("toggling inline code on formatted text keeps editor functional", async ({ page, editor }) => {
    // Mixed formatting triggers #stripInlineFormattingFromSelection which splits
    // text nodes. The toolbar state update can encounter stale selection points.
    await editor.setValue("<p>normal <strong>bold</strong> <em>italic</em> end</p>")
    await editor.selectAll()

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    await editor.send("End")
    await editor.send(" more")
    await editor.flush()

    expect(errors.filter((e) => e.includes("node not found"))).toEqual([])

    const value = await editor.value()
    expect(value).toContain("more")
  })

  test("toggling code block off keeps editor functional", async ({ page, editor }) => {
    await editor.click()
    await editor.send("First line")
    await editor.send("Enter")
    await editor.send("Second line")
    await editor.selectAll()

    // Apply code block
    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()
    await editor.selectAll()

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    // Toggle it off
    await page.getByRole("button", { name: "Code" }).click()
    await editor.flush()

    await editor.send("End")
    await editor.send(" added")
    await editor.flush()

    expect(errors.filter((e) => e.includes("node not found"))).toEqual([])

    const value = await editor.value()
    expect(value).toContain("added")
  })

  test("rapidly toggling code does not crash", async ({ page, editor }) => {
    await editor.click()
    await editor.send("Some text to format")
    await editor.selectAll()

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    const codeButton = page.getByRole("button", { name: "Code" })
    await codeButton.click()
    await editor.selectAll()
    await codeButton.click()
    await editor.selectAll()
    await codeButton.click()
    await editor.flush()

    await editor.send("End")
    await editor.send(" still works")
    await editor.flush()

    expect(errors.filter((e) => e.includes("node not found"))).toEqual([])

    const value = await editor.value()
    expect(value).toContain("still works")
  })
})
