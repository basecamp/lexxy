import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Dragon NaturallySpeaking's web extension drives the editor through window
// messages: protocol "nuanria_messaging", functionId "makeChanges", args
// [elementStart, elementLength, text, selStart, selLength, formatCommand]. A
// text of -1 (a number) means "change the selection without touching the
// text", which is how Select-and-Say corrections and cursor moves by voice
// arrive. The optional sixth argument carries an execCommand name (bold,
// italic, underline, ...) for voice commands such as "bold that".
test.describe("Dragon NaturallySpeaking support", () => {
  let pageErrors

  test.beforeEach(async ({ page, editor }) => {
    pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error.message))

    // Dragon runs on Windows, where the extension's line feed is \r\n
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "appVersion", { get: () => "5.0 (Windows NT 10.0; Win64; x64)" })
    })
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await editor.focus()
    await editor.send("I'm dictating in the main content section")
  })

  test("replaces a word through a makeChanges message", async ({ editor }) => {
    await postMakeChanges(editor, [ 4, 9, "Dictating", 13, 0 ])
    await editor.flush()

    expect(await editor.plainTextValue()).toBe("I'm Dictating in the main content section")
    expect(pageErrors).toEqual([])
  })

  test("a selection-only makeChanges keeps the serialized value cache instead of recomputing it", async ({ editor }) => {
    // A selection-only change dirties no node, so the value cache should survive
    // untouched. A sentinel tells "kept" apart from "recomputed to the same string".
    await editor.locator.evaluate((element) => { element.cachedValue = "sentinel" })

    await postMakeChanges(editor, [ 4, 9, -1, 4, 9 ])
    await editor.flush()

    expect(await editor.locator.evaluate((element) => element.cachedValue)).toBe("sentinel")
  })

  test("selection-only makeChanges selects the range without touching the text", async ({ editor }) => {
    await postMakeChanges(editor, [ 4, 9, -1, 4, 9 ])
    await editor.flush()

    expect(await editor.plainTextValue()).toBe("I'm dictating in the main content section")
    expect(await selectedText(editor)).toBe("dictating")
    expect(pageErrors).toEqual([])
  })

  test("corrects a word after a selection-only makeChanges", async ({ editor }) => {
    await postMakeChanges(editor, [ 4, 9, -1, 4, 9 ])
    await postMakeChanges(editor, [ 4, 9, "Dictating", 13, 0 ])
    await editor.flush()

    expect(await editor.plainTextValue()).toBe("I'm Dictating in the main content section")
    expect(pageErrors).toEqual([])
  })

  test("survives malformed makeChanges payloads", async ({ editor }) => {
    await postMakeChanges(editor, "garbage")
    await postMakeChanges(editor, { blockStart: 4 })
    await postMakeChanges(editor, [])
    await postMakeChanges(editor, [ "4", "9", "Hi", 0, 0 ])
    await postMakeChanges(editor, [ 4, 9, 5, 0, 0 ])
    await editor.send("!")
    await editor.flush()

    expect(await editor.plainTextValue()).toBe("I'm dictating in the main content section!")
    expect(pageErrors).toEqual([])
  })

  test("survives out-of-range offsets", async ({ editor }) => {
    await postMakeChanges(editor, [ 4, 900, -1, -5, 100 ])
    await postMakeChanges(editor, [ 4, 9, -1, 8, -3 ])
    await editor.send("!")
    await editor.flush()

    expect((await editor.plainTextValue()).replace("!", "")).toBe("I'm dictating in the main content section")
    expect(pageErrors).toEqual([])
  })

  test("formats the selection when makeChanges carries a format command", async ({ editor }) => {
    await postMakeChanges(editor, [ 4, 9, -1, 4, 9, "bold" ])
    await editor.flush()

    expect(await editor.value()).toContain("<strong>dictating</strong>")
    expect(await editor.plainTextValue()).toBe("I'm dictating in the main content section")
    expect(pageErrors).toEqual([])
  })

  test("does not toggle format when the final selection is collapsed", async ({ editor }) => {
    await postMakeChanges(editor, [ 4, 9, -1, 100, 5, "bold" ])
    await editor.send("!")
    await editor.flush()

    expect(await editor.value()).not.toContain("<strong>")
    expect(pageErrors).toEqual([])
  })

  test("ignores unknown format commands", async ({ editor }) => {
    await postMakeChanges(editor, [ 4, 9, -1, 4, 9, "fontName" ])
    await postMakeChanges(editor, [ 4, 9, -1, 4, 9, "toString" ])
    await editor.flush()

    expect(await editor.value()).not.toContain("<strong>")
    expect(await editor.plainTextValue()).toBe("I'm dictating in the main content section")
    expect(pageErrors).toEqual([])
  })

  // Dragon counts offsets over the whole field the way its web extension
  // flattens it: a \r\n line feed (\r on macOS) between blocks and for each
  // <br>, and a "[~]" placeholder for each element it doesn't parse. In
  // "First paragraph\r\nI'm dictating here", "dictating" sits at offset 21.
  test("selects a word addressed by a global offset across paragraphs", async ({ editor }) => {
    await editor.setValue("<p>First paragraph</p><p>I'm dictating here</p>")
    await editor.select("here")
    await postMakeChanges(editor, [ 21, 9, -1, 21, 9 ])
    await editor.flush()

    expect(await selectedText(editor)).toBe("dictating")
    expect(pageErrors).toEqual([])
  })

  test("replaces a word addressed by a global offset across paragraphs", async ({ editor }) => {
    await editor.setValue("<p>First paragraph</p><p>I'm dictating here</p>")
    await editor.select("here")
    await postMakeChanges(editor, [ 21, 9, "speaking", 29, 0 ])
    await editor.send("!")
    await editor.flush()

    expect(await editor.value()).toContain("I'm speaking! here")
    expect(await editor.value()).toContain("First paragraph")
    expect(pageErrors).toEqual([])
  })

  test("counts a line feed between list items", async ({ editor }) => {
    await editor.setValue("<ul><li>one apple</li><li>two pears</li></ul>")
    await postMakeChanges(editor, [ 15, 5, "plums", 20, 0 ])
    await editor.flush()

    expect(await editor.value()).toContain("two plums")
    expect(await editor.value()).toContain("one apple")
    expect(pageErrors).toEqual([])
  })

  test("counts a line feed for each line break", async ({ editor }) => {
    await editor.setValue("<p>line one<br>line two</p>")
    await postMakeChanges(editor, [ 15, 3, -1, 15, 3 ])
    await editor.flush()

    expect(await selectedText(editor)).toBe("two")
    expect(pageErrors).toEqual([])
  })

  test("counts a placeholder for a decorator block", async ({ editor }) => {
    await editor.setValue("<p>Before</p><hr><p>Dictating here</p>")
    await editor.select("here")
    await postMakeChanges(editor, [ 13, 9, -1, 13, 9 ])
    await editor.flush()

    expect(await selectedText(editor)).toBe("Dictating")
    expect(pageErrors).toEqual([])
  })

  test("counts a placeholder for a highlight", async ({ editor }) => {
    await editor.setValue("<p>plain <mark style=\"color: var(--highlight-1);\">marked</mark> and after</p>")
    await postMakeChanges(editor, [ 14, 5, -1, 14, 5 ])
    await editor.flush()

    expect(await selectedText(editor)).toBe("after")
    expect(pageErrors).toEqual([])
  })

  test("counts UTF-16 code units like the extension", async ({ editor }) => {
    await editor.setValue("<p>😀 I'm dictating here</p>")
    await postMakeChanges(editor, [ 7, 9, "speaking", 15, 0 ])
    await editor.flush()

    expect(await editor.plainTextValue()).toBe("😀 I'm speaking here")
    expect(pageErrors).toEqual([])
  })

  test("ignores a replacement whose range runs past the end of the field", async ({ editor }) => {
    await editor.setValue("<p>First paragraph</p><p>Second paragraph</p><p>Third paragraph</p>")
    await postMakeChanges(editor, [ 6, 900, "word", 10, 0 ])
    await editor.flush()

    expect(await editor.value()).toContain("Second paragraph")
    expect(await editor.value()).toContain("Third paragraph")
    expect(pageErrors).toEqual([])
  })

  test("leaves the caret after the inserted text when the final selection is out of the field", async ({ editor }) => {
    await editor.setValue("<p>First paragraph</p><p>I'm dictating here</p>")
    await postMakeChanges(editor, [ 21, 9, "speaking", -1, 0 ])
    await editor.send("!")
    await editor.flush()

    expect(await editor.value()).toContain("I'm speaking! here")
    expect(pageErrors).toEqual([])
  })

  test("stops the message before listeners registered after Lexxy, like the extension's", async ({ page, editor }) => {
    await listenForLaterMessages(page)
    await postMakeChanges(editor, [ 4, 9, -1, 4, 9 ])

    expect(await page.evaluate(() => window.laterMessages)).toEqual(0)
  })

  test("leaves dictation into Lexxy's own fields to the extension", async ({ page, editor }) => {
    await listenForLaterMessages(page)
    await page.evaluate(() => {
      const textarea = document.createElement("textarea")
      document.querySelector("lexxy-editor").append(textarea)
      textarea.focus()
    })
    await postMakeChanges(editor, [ 0, 0, "hijacked", 8, 0 ])
    await editor.flush()

    expect(await page.evaluate(() => window.laterMessages)).toEqual(1)
    expect(await editor.plainTextValue()).toBe("I'm dictating in the main content section")
  })
})

test.describe("Dragon NaturallySpeaking support on macOS", () => {
  test("counts a single carriage return between blocks", async ({ page, editor }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "appVersion", { get: () => "5.0 (Macintosh; Intel Mac OS X 10_15_7)" })
    })
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await editor.focus()
    await editor.setValue("<p>First paragraph</p><p>I'm dictating here</p>")
    await postMakeChanges(editor, [ 20, 9, -1, 20, 9 ])
    await editor.flush()

    expect(await selectedText(editor)).toBe("dictating")
  })
})

async function postMakeChanges(editor, args) {
  await editor.content.evaluate((_element, args) => {
    return new Promise((resolve) => {
      window.postMessage(JSON.stringify({
        protocol: "nuanria_messaging",
        type: "request",
        payload: { functionId: "makeChanges", args },
      }), "*")
      // Let the posted message reach the capture listener before the test reads back state.
      setTimeout(resolve, 0)
    })
  }, args)
}

function selectedText(editor) {
  return editor.content.evaluate(() => window.getSelection().toString())
}

test.describe("Dragon NaturallySpeaking support in restricted editors", () => {
  test("keeps dictated line breaks out of a single-line editor", async ({ page, editor }) => {
    await page.goto("/single-line.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await editor.focus()
    await editor.send("one")
    await postMakeChanges(editor, [ 3, 0, "\r\ntwo", 8, 0 ])
    await editor.flush()

    expect(await editor.value()).not.toContain("<br>")
    expect(await editor.plainTextValue()).toBe("one two")
  })

  test("ignores format commands in a plain text editor", async ({ page, editor }) => {
    await page.goto("/rich-text-disabled.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await editor.focus()
    await editor.send("dictating")
    await postMakeChanges(editor, [ 0, 9, -1, 0, 9, "bold" ])
    await editor.flush()

    expect(await editor.value()).not.toContain("<strong>")
  })
})

function listenForLaterMessages(page) {
  return page.evaluate(() => {
    window.laterMessages = 0
    window.addEventListener("message", (event) => {
      if (String(event.data).includes("nuanria_messaging")) window.laterMessages += 1
    })
  })
}
