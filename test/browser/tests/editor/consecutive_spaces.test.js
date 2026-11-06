import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { applyHighlightOption } from "../../helpers/toolbar.js"

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

  test("spaces in code blocks stay plain after highlighting part of the block", async ({ page, editor }) => {
    await page.waitForSelector("lexxy-toolbar[connected]")
    await editor.setValue('<pre data-language="plain"><code>  alpha  beta</code></pre>')
    await editor.select("beta")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    const html = await editor.value()
    expect(html).toContain("  alpha  ")
    expect(html).not.toContain("&nbsp;")
  })

  test("reloaded runs of spaces edit as plain spaces", async ({ editor }) => {
    await editor.send("alpha  beta")
    await editor.flush()
    await reloadOwnValue(editor)

    await editor.placeCaretInside("beta", 0)
    await editor.send("Backspace")
    await editor.flush()

    expect(await editor.value()).toBe("<p>alpha beta</p>")
  })

  test("runs of only non-breaking spaces are kept", async ({ editor }) => {
    await editor.setValue("<p>alpha&nbsp;&nbsp;beta</p>")
    await editor.flush()

    expect(await editor.value()).toBe("<p>alpha&nbsp;&nbsp;beta</p>")
  })

  test("a non-breaking space opening a pasted inline fragment is kept", async ({ editor }) => {
    await editor.send("x")
    await editor.paste("10 km", { html: "10<strong>&nbsp;km</strong>" })
    await editor.flush()

    expect(await editor.value()).toContain("<strong>&nbsp;km</strong>")
  })

  test("a non-breaking space opening a pasted link is kept", async ({ editor }) => {
    await editor.send("x")
    await editor.paste("10 km", { html: '10<a href="https://example.com/">&nbsp;km</a>' })
    await editor.flush()

    expect(await editor.value()).toContain(">&nbsp;km</a>")
  })

  test("a non-breaking space between words is kept", async ({ editor }) => {
    await editor.setValue("<p>10&nbsp;km</p>")
    await editor.flush()

    expect(await editor.value()).toBe("<p>10&nbsp;km</p>")
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
  return text.replaceAll("\u00a0", " ")
}
