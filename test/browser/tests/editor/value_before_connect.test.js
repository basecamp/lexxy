import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Frameworks such as React, Preact, Svelte and Vue create a custom element, set
// its properties, and only then insert it. The value property has to work in
// that order, the way it does on a built-in form control.

// Returns the value and the text the editor shows, since a value assigned
// before the upgrade would read back as itself even if the editor ignored it.
async function connectedEditor(page, id) {
  await page.waitForSelector(`#${id}[connected]`)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve))))
  return page.evaluate((id) => {
    const editor = document.getElementById(id)
    return { value: editor.value, shown: editor.querySelector(".lexxy-editor__content").textContent }
  }, id)
}

test.describe("Value set before the editor connects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("an editor created and given a value connects with it", async ({ page }) => {
    const result = await page.evaluate(() => {
      const editor = document.createElement("lexxy-editor")
      editor.id = "late-editor"
      let error = null
      try { editor.value = "<p>Hello</p>" } catch (e) { error = e.message }
      const valueBeforeConnect = editor.value
      document.body.append(editor)
      return { error, valueBeforeConnect }
    })

    expect(result).toEqual({ error: null, valueBeforeConnect: "<p>Hello</p>" })
    expect(await connectedEditor(page, "late-editor")).toEqual({ value: "<p>Hello</p>", shown: "Hello" })
  })

  test("an editor created without a value reads its value attribute before connecting", async ({ page }) => {
    const value = await page.evaluate(() => {
      const editor = document.createElement("lexxy-editor")
      editor.setAttribute("value", "<p>From the attribute</p>")
      return editor.value
    })

    expect(value).toBe("<p>From the attribute</p>")
  })

  test("a value set on a removed editor loads when it is attached again", async ({ page }) => {
    await page.evaluate(() => {
      const editor = document.querySelector("lexxy-editor")
      editor.id = "moved-editor"
      editor.value = "<p>Before</p>"
      const parent = editor.parentElement
      editor.remove()
      editor.value = "<p>After</p>"
      parent.append(editor)
    })

    expect(await connectedEditor(page, "moved-editor")).toEqual({ value: "<p>After</p>", shown: "After" })
  })

  test("a value set before the element is upgraded loads on connect", async ({ page }) => {
    await page.evaluate(() => {
      // Elements made in a document without a browsing context aren't upgraded, so the
      // assignment creates a plain property that hides the setter until connect.
      const inert = document.implementation.createHTMLDocument("")
      const editor = inert.createElement("lexxy-editor")
      editor.id = "upgraded-editor"
      editor.value = "<p>Before upgrade</p>"
      document.body.append(document.adoptNode(editor))
    })

    expect(await connectedEditor(page, "upgraded-editor")).toEqual({ value: "<p>Before upgrade</p>", shown: "Before upgrade" })
  })
})
