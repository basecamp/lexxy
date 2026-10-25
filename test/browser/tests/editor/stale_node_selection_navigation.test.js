import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// A committed NodeSelection can outlive the node it references (empty editor,
// just-deleted node, decorator boundary). Selection#withCurrentNodeSelectionNode
// used to hand that unresolved node (undefined) straight to the arrow-key
// handlers, crashing on currentNode.selectPrevious / selectNext /
// getTopLevelElement (Sentry BC3-JS-N8HQ / N8HR / N8HS).
test.describe("Arrow navigation with a stale node selection", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/stale-node-selection.html")
    await page.waitForSelector("lexxy-editor[connected]")

    await editor.setValue("<p>Hello</p><p>World</p>")
    await editor.focus()

    // Commit the stale state: a NodeSelection whose key no longer resolves to
    // a node, so getNodes() comes back empty.
    await page.evaluate(() => {
      const element = document.querySelector("lexxy-editor")
      element.editor.update(() => {
        const selection = window.__lex.$createNodeSelection()
        selection.add("9999")
        window.__lex.$setSelection(selection)
      }, { discrete: true })
    })
  })

  test("arrow keys do not crash when the selected node no longer resolves", async ({ page, editor }) => {
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await editor.content.press("ArrowRight")
    await editor.content.press("ArrowLeft")
    await editor.content.press("ArrowUp")
    await editor.content.press("ArrowDown")
    await editor.flush()

    expect(errors).toHaveLength(0)

    // The editor remains usable: clicking back in restores a caret and typing works
    await editor.placeCaretInside("World", 5)
    await editor.send("!")
    await editor.flush()
    expect(await editor.value()).toContain("World!")
  })
})
