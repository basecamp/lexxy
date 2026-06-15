import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Dragon NaturallySpeaking's web extension drives the editor through window
// messages: protocol "nuanria_messaging", functionId "makeChanges", args
// [elementStart, elementLength, text, selStart, selLength]. A text of -1 (a
// number) means "change the selection without touching the text", which is how
// Select-and-Say corrections and cursor moves by voice arrive.
test.describe("Dragon NaturallySpeaking support", () => {
  let pageErrors

  test.beforeEach(async ({ page, editor }) => {
    pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(error.message))

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

  test("selection-only makeChanges selects the range without touching the text", async ({ editor }) => {
    await postMakeChanges(editor, [ 4, 9, -1, 4, 9 ])
    await editor.flush()

    expect(await editor.plainTextValue()).toBe("I'm dictating in the main content section")
    expect(await editor.content.evaluate(() => window.getSelection().toString())).toBe("dictating")
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
})

async function postMakeChanges(editor, args) {
  await editor.content.evaluate((_element, args) => {
    window.postMessage(JSON.stringify({
      protocol: "nuanria_messaging",
      type: "request",
      payload: { functionId: "makeChanges", args },
    }), "*")
  }, args)
}
