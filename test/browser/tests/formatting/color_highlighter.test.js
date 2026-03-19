import { test } from "../../test_helper.js"
import { assertEditorHtml, assertEditorContent } from "../../helpers/assertions.js"
import { applyHighlightOption } from "../../helpers/toolbar.js"
import { expect } from "@playwright/test"

test.describe("Color highlighter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("color highlighting collapsed selection", async ({ page, editor }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("everyone")
    await editor.send("ArrowRight")

    await applyHighlightOption(page, "color", 1)
    await editor.send(" again!")

    await assertEditorHtml(
      editor,
      '<p>Hello everyone<mark style="color: var(--highlight-1);"> again!</mark></p>',
    )
  })

  test("color highlighting text in a plain-text code block", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>some log output</code></pre>')
    await expect(page.locator("select[name=lexxy-code-language]")).toHaveValue("plain")

    await editor.select("log output")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toContainText("log output")
    })
  })

  test("highlight in a code block survives setValue round-trip", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>some log output</code></pre>')
    await editor.select("log output")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    const html = await editor.value()

    // Reload the HTML into the editor (simulating save → re-edit)
    await editor.setValue(html)
    await editor.flush()
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toContainText("log output")
    })
  })

  test("removing highlight from text in a plain-text code block", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>some log output</code></pre>')
    await expect(page.locator("select[name=lexxy-code-language]")).toHaveValue("plain")

    await editor.select("log output")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toContainText("log output")
    })

    await editor.select("log output")
    await removeHighlight(page)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toHaveCount(0)
    })
  })
})

async function removeHighlight(page) {
  await page.locator("[name='highlight']").click()
  await page.locator("[data-command='removeHighlight']").click()
}
