import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../../helpers/assertions.js"

async function installListener(editor, { returnValue }) {
  await editor.locator.evaluate((el, value) => {
    const { SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, COMMAND_PRIORITY_HIGH } = window.__lex
    window.__pasteCommandCalls = []
    el.editor.registerCommand(
      SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
      (payload) => {
        window.__pasteCommandCalls.push({
          nodesLength: payload.nodes.length,
          hasSelection: !!payload.selection,
        })
        return value
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, returnValue)
}

test.describe("Paste — SELECTION_INSERT_CLIPBOARD_NODES_COMMAND dispatch", () => {
  test("fires on HTML paste with nodes and a selection", async ({ page, editor }) => {
    await page.goto("/paste-command-dispatch.html")
    await editor.waitForConnected()

    await installListener(editor, { returnValue: false })

    await editor.paste("hello", { html: "<p>hello</p>" })
    await editor.flush()

    const calls = await page.evaluate(() => window.__pasteCommandCalls)
    expect(calls).toHaveLength(1)
    expect(calls[0].nodesLength).toBeGreaterThan(0)
    expect(calls[0].hasSelection).toBe(true)
  })

  test("returning false does not stop the default paste", async ({ page, editor }) => {
    await page.goto("/paste-command-dispatch.html")
    await editor.waitForConnected()

    await installListener(editor, { returnValue: false })

    await editor.paste("hello", { html: "<p>hello pasted</p>" })

    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText("hello pasted")
    })
  })

  test("returning true prevents the default insertion path", async ({ page, editor }) => {
    await page.goto("/paste-command-dispatch.html")
    await editor.waitForConnected()

    await installListener(editor, { returnValue: true })

    await editor.paste("blocked", { html: "<p>blocked content</p>" })
    await editor.flush()

    const calls = await page.evaluate(() => window.__pasteCommandCalls)
    expect(calls).toHaveLength(1)

    await expect(editor.content).not.toContainText("blocked content")
    await expect.poll(() => editor.isEmpty()).toBe(true)
  })
})
