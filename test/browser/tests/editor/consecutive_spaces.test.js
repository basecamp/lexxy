import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test.describe("Consecutive spaces", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("double spaces survive reloading the editor's own value", async ({ editor }) => {
    await editor.send("alpha  beta")
    await editor.flush()

    await reloadOwnValue(editor)

    expect(await editorText(editor)).toBe("alpha  beta")
  })

  test("a run of spaces survives reloading the editor's own value", async ({ editor }) => {
    await editor.send("alpha     beta")
    await editor.flush()

    await reloadOwnValue(editor)

    expect(await editorText(editor)).toBe("alpha     beta")
  })

  test("leading spaces survive reloading the editor's own value", async ({ editor }) => {
    await editor.send("  alpha")
    await editor.flush()

    await reloadOwnValue(editor)

    expect(await editorText(editor)).toBe("  alpha")
  })

  test("double spaces display in HTML rendered without preserved whitespace", async ({ page, editor }) => {
    await editor.send("alpha  beta")
    await editor.flush()

    const html = await editor.value()
    const rendered = await page.evaluate((html) => {
      const container = document.createElement("div")
      container.innerHTML = html
      document.body.appendChild(container)
      const text = container.innerText
      container.remove()
      return text
    }, html)

    expect(normalizeSpaces(rendered)).toBe("alpha  beta")
  })

  test("single spaces export as plain spaces", async ({ editor }) => {
    await editor.send("alpha beta gamma")
    await editor.flush()

    expect(await editor.value()).toBe("<p>alpha beta gamma</p>")
  })

  test("spaces in code blocks export as plain spaces", async ({ editor }) => {
    await editor.setValue("<pre>alpha  beta</pre>")
    await editor.flush()

    expect(await editor.value()).toContain("alpha  beta")
  })
})

async function reloadOwnValue(editor) {
  const html = await editor.value()
  await editor.setValue(html)
  await editor.flush()
}

async function editorText(editor) {
  return normalizeSpaces(await editor.content.locator("p").first().textContent())
}

function normalizeSpaces(text) {
  return text.replaceAll(" ", " ")
}
