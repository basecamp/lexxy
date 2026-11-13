import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

test("keeps surrounding accessible text stable while selecting a mention", async ({ page, editor, browserName }) => {
  test.skip(browserName !== "chromium", "Chromium accessibility events are inspected through CDP")

  const accessibility = await page.context().newCDPSession(page)
  await accessibility.send("Accessibility.enable")
  await page.goto("/mentions.html")
  await editor.waitForConnected()
  await page.addStyleTag({ content: `
    .notice + * { margin-block-start: 0.8rem; }
    @layer components {
      .breadcrumb::before { content: "‹"; flex-shrink: 0; inline-size: var(--breadcrumb-caret-width); text-align: center; }
      @container layout (inline-size < 76.8rem) {
        .breadcrumb:has(~ .breadcrumb) { display: none; }
      }
    }
  ` })
  await page.evaluate(() => {
    const heading = document.createElement("header")
    heading.className = "breadcrumb"
    const text = document.createElement("span")
    text.textContent = "Surrounding content"
    heading.append(text)
    document.querySelector("form").prepend(heading)
  })

  await editor.send("Before @Zacharias", "Enter", " after.")
  await editor.placeCaretInside("Before ", 7)
  await editor.flush()

  const surroundingText = async () => {
    const { nodes } = await accessibility.send("Accessibility.getFullAXTree")
    return nodes.filter(node => node.role.value === "InlineTextBox" && node.name?.value === "Surrounding content").map(node => node.nodeId)
  }
  const original = await editor.value()
  const before = await surroundingText()
  expect(before).toHaveLength(1)

  for (const [ key, selected ] of [ [ "ArrowRight", "Zacharias" ], [ "ArrowRight", "" ], [ "ArrowLeft", "Zacharias" ], [ "ArrowLeft", "" ] ]) {
    await editor.send(key)
    expect(await page.evaluate(() => getSelection().toString())).toBe(selected)
    expect(await surroundingText()).toEqual(before)
    expect(await editor.value()).toBe(original)
  }
})
