import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

async function tripleClickAndRead(page, target) {
  if (target && typeof target.click === "function") {
    await target.click({ clickCount: 3 })
  } else {
    await page.mouse.click(target.x, target.y, { clickCount: 3 })
  }
  const selected = await page.evaluate(() => window.getSelection().toString())
  return selected.replace(/\s+/g, " ").trim()
}

// Dispatches a synthetic triple-click directly to a target element. Used when
// browser-native click routing varies across engines (e.g. for decorator
// figures whose floating UI overlays can intercept real mouse events).
async function dispatchTripleClickTo(locator) {
  await locator.evaluate(el => {
    for (const detail of [ 1, 2, 3 ]) {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail }))
    }
  })
}

async function tripleClickDragAndRead(page, fromPoint, toPoint) {
  await page.mouse.move(fromPoint.x, fromPoint.y)
  await page.mouse.down({ clickCount: 1 })
  await page.mouse.up({ clickCount: 1 })
  await page.mouse.down({ clickCount: 2 })
  await page.mouse.up({ clickCount: 2 })
  await page.mouse.down({ clickCount: 3 })
  await page.mouse.move(toPoint.x, toPoint.y, { steps: 5 })
  await page.mouse.up({ clickCount: 3 })
  const selected = await page.evaluate(() => window.getSelection().toString())
  return selected.replace(/\s+/g, " ").trim()
}

function lineMidLeft(box) {
  return { x: box.x + 5, y: box.y + box.height / 2 }
}

function lineMidRight(box) {
  return { x: box.x + box.width - 5, y: box.y + box.height / 2 }
}

function lineMidCenter(box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function stubCaretAPIs(page, installStubs) {
  await page.evaluate(() => {
    window.__originalCaretPositionFromPoint = document.caretPositionFromPoint
    window.__originalCaretRangeFromPoint = document.caretRangeFromPoint
  })
  await page.evaluate(installStubs)
}

async function restoreCaretAPIs(page) {
  await page.evaluate(() => {
    document.caretPositionFromPoint = window.__originalCaretPositionFromPoint
    document.caretRangeFromPoint = window.__originalCaretRangeFromPoint
    delete window.__originalCaretPositionFromPoint
    delete window.__originalCaretRangeFromPoint
  })
}

test.describe("Triple-click clamps selection to the visual line", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("paragraph with X<br><br>Y — clicking Y selects only the Y line", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br><br>Y line.</p><p>Trailing.</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line.")
  })

  test("paragraph with X<br><br>Y — clicking X selects only the X line", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br><br>Y line.</p><p>Trailing.</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "X line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("X line.")
  })

  test("paragraph with X<br>Y — clicking X selects only the X line", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br>Y line.</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "X line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("X line.")
  })

  test("paragraph with X<br>Y — clicking Y selects only the Y line", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br>Y line.</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line.")
  })

  test("paragraph with X<br>Y<br>Z — clicking Y selects only the Y line", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br>Y line.<br>Z line.</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line.")
  })

  test("paragraph with X<br><br><br>Y — clicking Y selects only the Y line", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br><br><br>Y line.</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line.")
  })

  test("paragraph with no <br>s — clicking selects the whole block content", async ({ page, editor }) => {
    await editor.setValue("<p>X line.</p><p>Trailing.</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "X line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("X line.")
  })

  test("paragraph without <br> following a paragraph with <br> — clicking the trailing paragraph selects only its content", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br>Y line.</p><p>Trailing.</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "Trailing." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Trailing.")
  })

  test("multi-paragraph blockquote where only first paragraph has <br> — clicking the trailing paragraph selects only its content", async ({ page, editor }) => {
    await editor.setValue("<blockquote><p>X line.<br>Y line.</p><p>Trailing.</p></blockquote>")
    await editor.flush()

    const target = editor.content.locator("blockquote p span", { hasText: "Trailing." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Trailing.")
  })

  test("blockquote with X<br><br>Y inside — clicking Y selects only the Y line", async ({ page, editor }) => {
    await editor.setValue("<blockquote><p>X line.<br><br>Y line.</p></blockquote><p>Trailing.</p>")
    await editor.flush()

    const target = editor.content.locator("blockquote span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line.")
  })

  test("heading with X<br>Y — clicking Y selects only the Y line", async ({ page, editor }) => {
    await editor.setValue("<h2>X line.<br>Y line.</h2><p>Trailing.</p>")
    await editor.flush()

    const target = editor.content.locator("h2 span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line.")
  })

  test("paragraph with X<br><br><br>Y — clicking the empty middle line yields a collapsed selection at the clicked <br>", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br><br><br>Y line.</p>")
    await editor.flush()

    const middleBr = editor.content.locator("p br").nth(1)
    const rect = await middleBr.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, height: r.height }
    })
    const point = { x: rect.x + 2, y: rect.y + rect.height / 2 }
    const selected = await tripleClickAndRead(page, point)

    expect(selected).toBe("")

    const lexicalSelection = await page.evaluate(() => {
      const editor = document.querySelector("lexxy-editor").editor
      return editor.read(() => {
        const sel = window.$getSelection()
        return {
          kind: sel?.constructor?.name ?? null,
          anchorType: sel?.anchor?.type ?? null,
          focusType: sel?.focus?.type ?? null,
          anchorKey: sel?.anchor?.key ?? null,
          focusKey: sel?.focus?.key ?? null,
          anchorOffset: sel?.anchor?.offset ?? null,
          focusOffset: sel?.focus?.offset ?? null,
          isCollapsed: sel?.isCollapsed?.() ?? null
        }
      })
    })
    expect(lexicalSelection.kind).toBe("_RangeSelection")
    expect(lexicalSelection.anchorType).toBe("element")
    expect(lexicalSelection.focusType).toBe("element")
    expect(lexicalSelection.anchorKey).toBe(lexicalSelection.focusKey)
    expect(lexicalSelection.anchorOffset).toBe(lexicalSelection.focusOffset)
    expect(lexicalSelection.isCollapsed).toBe(true)
    // Pins the childAfterCaret-first fallback in $resolveLexicalNodeAtPoint:
    // children are [TextX, LB1, LB2, LB3, TextY]; clicking between two <br>s
    // must pick the 2nd <br> (offset 2), not the 1st (offset 1).
    expect(lexicalSelection.anchorOffset).toBe(2)
  })

  test("paragraph with X<br>Y — clicking the trailing whitespace after X clamps to the X line", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br>Y line.</p>")
    await editor.flush()

    const lineBreak = editor.content.locator("p br").first()
    const rect = await lineBreak.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, height: r.height }
    })
    const point = { x: rect.x + 2, y: rect.y + rect.height / 2 }
    const selected = await tripleClickAndRead(page, point)

    expect(selected).toBe("X line.")
  })

  test("paragraph with X<br>Y — clicking the leading whitespace before Y clamps to the Y line", async ({ page, editor }) => {
    await editor.setValue("<p>X line.<br>Y line.</p>")
    await editor.flush()

    const yLine = editor.content.locator("p span", { hasText: "Y line." }).first()
    const rect = await yLine.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, height: r.height }
    })
    const point = { x: rect.x - 2, y: rect.y + rect.height / 2 }
    const selected = await tripleClickAndRead(page, point)

    expect(selected).toBe("Y line.")
  })

  test("link nested inside a paragraph with X<br>Y — clicking Y clamps to the visual line including text after the link", async ({ page, editor }) => {
    await editor.setValue('<p>before <a href="https://example.com">X line.<br>Y line.</a> after</p>')
    await editor.flush()

    const target = editor.content.locator("a span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line. after")
  })

  test("list item with X<br><br>Y — clicking Y selects only the Y line", async ({ page, editor }) => {
    await editor.setValue("<ul><li>X line.<br><br>Y line.</li></ul>")
    await editor.flush()

    const target = editor.content.locator("li span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line.")
  })

  test("list item containing a nested blockquote — clicking the outer list's second line selects only that line", async ({ page, editor }) => {
    await editor.setValue("<ul><li>Parent line.<br>Second line.<blockquote>Nested line.<br>Other line.</blockquote></li></ul>")
    await editor.flush()

    const target = editor.content.locator("li > span", { hasText: "Second line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Second line.")
  })

  test("multi-line code block with X<br>Y<br>Z — clicking the middle line selects only that line", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain">line one\nline two\nline three</pre>')
    await editor.flush()

    const target = editor.content.locator("code span", { hasText: "line two" }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("line two")
  })

  test("code block with tab-indented middle line — clicking the indented text selects the whole indented line", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain">line one\n\tline two\nline three</pre>')
    await editor.flush()

    const target = editor.content.locator("code span", { hasText: "line two" }).first()
    await target.click({ clickCount: 3 })

    const rawSelection = await page.evaluate(() => window.getSelection().toString())

    expect(rawSelection).toContain("line two")
    expect(rawSelection).not.toContain("line one")
    expect(rawSelection).not.toContain("line three")
    expect(rawSelection).toMatch(/\tline two/)
  })

  test("table cell with X<br>Y — clicking Y selects only the Y line within the cell", async ({ page, editor }) => {
    await editor.setValue("<table><tbody><tr><td>X line.<br>Y line.</td></tr></tbody></table>")
    await editor.flush()

    const target = editor.content.locator("td span", { hasText: "Y line." }).first()
    const selected = await tripleClickAndRead(page, target)

    expect(selected).toBe("Y line.")
  })

  test("double-clicking a word selects the word and does not clamp to the visual line", async ({ page, editor }) => {
    await editor.setValue("<p>hello world<br>second line</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "hello world" }).first()
    await target.click({ clickCount: 2 })

    const selected = await page.evaluate(() => window.getSelection().toString())
    expect(["hello", "world"]).toContain(selected)
  })

  test("forward triple-click-drag staying within a single line selects only that line", async ({ page, editor }) => {
    await editor.setValue("<p>XXXX line one.<br>YYYY line two.<br>ZZZZ line three.</p>")
    await editor.flush()

    const yBox = await editor.content.locator("p span", { hasText: "YYYY line two." }).first().boundingBox()

    const selected = await tripleClickDragAndRead(page, lineMidLeft(yBox), lineMidRight(yBox))
    expect(selected).toBe("YYYY line two.")
  })

  test("backward triple-click-drag staying within a single line selects only that line", async ({ page, editor }) => {
    await editor.setValue("<p>XXXX line one.<br>YYYY line two.<br>ZZZZ line three.</p>")
    await editor.flush()

    const yBox = await editor.content.locator("p span", { hasText: "YYYY line two." }).first().boundingBox()

    const selected = await tripleClickDragAndRead(page, lineMidRight(yBox), lineMidLeft(yBox))
    expect(selected).toBe("YYYY line two.")
  })

  test("forward triple-click-drag across lines in a block selects from start of first line to end of last line", async ({ page, editor }) => {
    await editor.setValue("<p>XXXX line one.<br>YYYY line two.<br>ZZZZ line three.</p>")
    await editor.flush()

    const xBox = await editor.content.locator("p span", { hasText: "XXXX line one." }).first().boundingBox()
    const yBox = await editor.content.locator("p span", { hasText: "YYYY line two." }).first().boundingBox()

    const selected = await tripleClickDragAndRead(page, lineMidLeft(xBox), lineMidCenter(yBox))
    expect(selected).toBe("XXXX line one. YYYY line two.")
  })

  test("backward triple-click-drag across lines in a block selects from start of first line to end of last line", async ({ page, editor }) => {
    await editor.setValue("<p>XXXX line one.<br>YYYY line two.<br>ZZZZ line three.</p>")
    await editor.flush()

    const yBox = await editor.content.locator("p span", { hasText: "YYYY line two." }).first().boundingBox()
    const zBox = await editor.content.locator("p span", { hasText: "ZZZZ line three." }).first().boundingBox()

    const selected = await tripleClickDragAndRead(page, lineMidLeft(zBox), lineMidCenter(yBox))
    expect(selected).toBe("YYYY line two. ZZZZ line three.")
  })

  test("forward triple-click-drag across blocks selects the spanned lines", async ({ page, editor }) => {
    await editor.setValue("<p>AAAA top first line.<br>BBBB top second line.</p><p>CCCC bottom first line.<br>DDDD bottom second line.</p>")
    await editor.flush()

    const topFirstBox = await editor.content.locator("p span", { hasText: "AAAA top first line." }).first().boundingBox()
    const bottomFirstBox = await editor.content.locator("p span", { hasText: "CCCC bottom first line." }).first().boundingBox()

    const selected = await tripleClickDragAndRead(page, lineMidLeft(topFirstBox), lineMidCenter(bottomFirstBox))
    expect(selected).toBe("AAAA top first line. BBBB top second line. CCCC bottom first line.")
  })

  test("backward triple-click-drag across blocks selects the spanned lines", async ({ page, editor }) => {
    await editor.setValue("<p>AAAA top first line.<br>BBBB top second line.</p><p>CCCC bottom first line.<br>DDDD bottom second line.</p>")
    await editor.flush()

    const topSecondBox = await editor.content.locator("p span", { hasText: "BBBB top second line." }).first().boundingBox()
    const bottomSecondBox = await editor.content.locator("p span", { hasText: "DDDD bottom second line." }).first().boundingBox()

    const selected = await tripleClickDragAndRead(page, lineMidLeft(bottomSecondBox), lineMidCenter(topSecondBox))
    expect(selected).toBe("BBBB top second line. CCCC bottom first line. DDDD bottom second line.")
  })

  test("click-drag across two lines preserves the dragged range and does not clamp to one line", async ({ page, editor }) => {
    await editor.setValue("<p>first line<br>second line</p>")
    await editor.flush()

    const firstLine = editor.content.locator("p span", { hasText: "first line" }).first()
    const secondLine = editor.content.locator("p span", { hasText: "second line" }).first()
    const firstBox = await firstLine.boundingBox()
    const secondBox = await secondLine.boundingBox()

    await page.mouse.move(firstBox.x + 5, firstBox.y + firstBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(secondBox.x + secondBox.width - 5, secondBox.y + secondBox.height / 2, { steps: 10 })
    await page.mouse.up()

    const selected = await page.evaluate(() => window.getSelection().toString())
    expect(selected).toMatch(/first|irst/)
    expect(selected).toMatch(/second|secon/)
  })
})

test.describe("Triple-click edge cases", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("caret resolving to an inline link (whose LinkNode is not in the leaves list) does not throw", async ({ page, editor }) => {
    await editor.setValue('<p><a href="https://example.com">link text</a></p>')
    await editor.flush()

    const jsErrors = []
    page.on("pageerror", err => jsErrors.push(err.message))

    await stubCaretAPIs(page, () => {
      const original = document.caretPositionFromPoint.bind(document)
      document.caretPositionFromPoint = (x, y) => {
        const p = document.querySelector("lexxy-editor p")
        if (p && p.childNodes[0]?.nodeName === "A") {
          return { offsetNode: p, offset: 0 }
        }
        return original(x, y)
      }
    })

    try {
      const link = editor.content.locator("a").first()
      await link.click({ clickCount: 3 })
      await page.waitForTimeout(200)

      const typeErrors = jsErrors.filter(e => e.includes("TypeError") || e.includes("Cannot read properties"))
      expect(typeErrors).toEqual([])
    } finally {
      await restoreCaretAPIs(page)
    }
  })

  test("caretPositionFromPoint returning null inside editor is handled gracefully", async ({ page, editor }) => {
    await editor.setValue("<p>some content<br>second line</p>")
    await editor.flush()

    const jsErrors = []
    page.on("pageerror", err => jsErrors.push(err.message))

    // Stub both APIs so the WebKit fallback chain can't rescue the null.
    await stubCaretAPIs(page, () => {
      document.caretPositionFromPoint = () => null
      document.caretRangeFromPoint = () => null
    })

    try {
      const target = editor.content.locator("p span").first()
      await target.click({ clickCount: 3 })
      await page.waitForTimeout(200)

      expect(jsErrors.filter(e => e.includes("TypeError"))).toEqual([])
    } finally {
      await restoreCaretAPIs(page)
    }
  })

  test("triple-click resolving to an empty link (no children) does not throw and is a no-op", async ({ page, editor }) => {
    await editor.setValue('<p>some text</p>')
    await editor.flush()

    await page.evaluate(() => {
      const p = document.querySelector("lexxy-editor p")
      const emptyLink = document.createElement("a")
      emptyLink.href = "https://example.com"
      p.appendChild(emptyLink)
    })

    const jsErrors = []
    page.on("pageerror", err => jsErrors.push(err.message))

    await stubCaretAPIs(page, () => {
      document.caretPositionFromPoint = () => {
        const p = document.querySelector("lexxy-editor p")
        return { offsetNode: p, offset: p.childNodes.length - 1 }
      }
      document.caretRangeFromPoint = () => null
    })

    try {
      const target = editor.content.locator("p").first()
      await target.click({ clickCount: 3 })
      await page.waitForTimeout(200)

      expect(jsErrors.filter(e => e.includes("TypeError") || e.includes("Cannot read"))).toEqual([])
    } finally {
      await restoreCaretAPIs(page)
    }
  })

  test("single-click produces a collapsed selection and does not trigger the clamp", async ({ page, editor }) => {
    await editor.setValue("<p>hello world<br>second line</p>")
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "hello world" }).first()
    await target.click({ clickCount: 1 })

    const isCollapsed = await page.evaluate(() => window.getSelection().isCollapsed)
    expect(isCollapsed).toBe(true)
  })
})

test.describe("Triple-click on a decorator falls through to default node selection", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/attachments-enabled.html")
    await editor.waitForConnected()
  })

  test("clicking a decorator selects the decorator node and does not clamp text", async ({ page, editor }) => {
    await editor.setValue(
      '<action-text-attachment content-type="image/png" url="http://example.com/image.png" filename="photo.png"></action-text-attachment>'
    )
    await editor.flush()

    const target = editor.content.locator("figure.attachment").first()
    await dispatchTripleClickTo(target)

    await expect(editor.content.locator("figure.attachment.node--selected")).toHaveCount(1)

    const selectedText = await page.evaluate(() => window.getSelection().toString())
    expect(selectedText.trim()).toBe("")

    const hasNodeSelection = await page.evaluate(
      () => document.querySelector("lexxy-editor").selection.hasNodeSelection
    )
    expect(hasNodeSelection).toBe(true)
  })
})

test.describe("Triple-click on a visual line that starts with an inline decorator", () => {
  const mentionHtml = [
    '<action-text-attachment',
    ' content-type="application/vnd.actiontext.mention"',
    ' sgid="test-sgid-mention"',
    ' content="&lt;span class=&quot;person&quot;&gt;Alice&lt;/span&gt;"',
    ">Alice</action-text-attachment>"
  ].join("")

  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/attachments-enabled.html")
    await editor.waitForConnected()
  })

  test("middle line that starts with a mention — clicking the trailing text clamps to the whole line including the mention", async ({ page, editor }) => {
    await editor.setValue(`<p>X line.<br>${mentionHtml} after<br>Z line.</p>`)
    await editor.flush()

    const target = editor.content.locator("p span", { hasText: "after" }).first()
    await target.click({ clickCount: 3 })

    const rawSelection = await page.evaluate(() => window.getSelection().toString())
    expect(rawSelection).toContain("after")
    expect(rawSelection).toContain("Alice")
    expect(rawSelection).not.toContain("X line")
    expect(rawSelection).not.toContain("Z line")

    // Pins the anchor at the mention's parent + index, so the test can't
    // silently weaken if a future change renders the mention without visible
    // "Alice" text.
    const anchorState = await page.evaluate(() => {
      const editor = document.querySelector("lexxy-editor").editor
      return editor.read(() => {
        const sel = window.$getSelection()
        const anchor = sel?.anchor
        if (!anchor) return null
        const anchorNode = anchor.getNode()
        const childAtOffset = anchor.type === "element" ? anchorNode.getChildren()[anchor.offset] : null
        return {
          anchorType: anchor.type,
          anchorNodeType: anchorNode.getType(),
          childAtOffsetType: childAtOffset?.getType() ?? null
        }
      })
    })
    expect(anchorState.anchorType).toBe("element")
    expect(anchorState.anchorNodeType).toBe("paragraph")
    expect(anchorState.childAtOffsetType).toBe("custom_action_text_attachment")
  })

  test("clicking a figure decorator inline with text and <br>s falls through to default node selection", async ({ page, editor }) => {
    await editor.setValue(`<p>X line.<br><action-text-attachment content-type="image/png" url="http://example.com/photo.png" filename="photo.png"></action-text-attachment><br>Z line.</p>`)
    await editor.flush()

    const figure = editor.content.locator("figure.attachment").first()
    await dispatchTripleClickTo(figure)

    await expect(editor.content.locator("figure.attachment.node--selected")).toHaveCount(1)

    const hasNodeSelection = await page.evaluate(
      () => document.querySelector("lexxy-editor").selection.hasNodeSelection
    )
    expect(hasNodeSelection).toBe(true)

    const selectedText = await page.evaluate(() => window.getSelection().toString())
    expect(selectedText).not.toContain("X line")
    expect(selectedText).not.toContain("Z line")
  })
})
