import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorPlainText } from "../../helpers/assertions.js"

// macOS and iOS dictation revise words they already inserted: when the engine changes its
// mind about a word, and again when the microphone turns off, it fires a beforeinput whose
// target range names the text to replace. Dictation can leave a different, non-collapsed
// selection behind, and Lexical only follows the target range when the selection is collapsed,
// so the revision replaced whatever was selected instead. Words disappeared (lexical#6940).
//
// Automation can't drive the system dictation engine, so these tests send the beforeinput
// events it sends, over a stale selection.
test.describe("Dictation revisions", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue("<p>this is a test</p>")
  })

  test("a replacement goes to its target range, not a stale selection", async ({ editor }) => {
    await editor.select("this")
    await sendRevision(editor, { inputType: "insertReplacementText", text: "best", target: "test" })

    await assertEditorPlainText(editor, "this is a best")
  })

  test("an insertText revision goes to its target range, not a stale selection", async ({ editor }) => {
    await editor.select("this")
    await sendRevision(editor, { inputType: "insertText", text: "best", target: "test" })

    await assertEditorPlainText(editor, "this is a best")
  })

  test("the commit when the microphone turns off replaces the whole dictated phrase", async ({ editor }) => {
    await editor.select("is a")
    await sendRevision(editor, { inputType: "insertText", text: "this is a best", target: "this is a test" })

    await assertEditorPlainText(editor, "this is a best")
  })

  test("a revision spanning formatted text replaces the run of misheard words", async ({ editor }) => {
    await editor.setValue("<p>say <strong>Internet</strong> pron word</p>")
    await editor.select("word")
    await sendRevision(editor, { inputType: "insertReplacementText", text: "incorrect", target: "Internet pron" })

    await assertEditorPlainText(editor, "say incorrect word")
  })

  test("typing over a selection still replaces the selection", async ({ editor }) => {
    await editor.select("test")
    await editor.send("x")

    await assertEditorPlainText(editor, "this is a x")
  })
})

// On macOS Chrome, a handled Backspace can accept a pending text replacement, which Lexical
// rejects while keeping the caret where it was. Lexical reads the platform when it loads, so
// this presents Chromium as macOS Chrome.
test.describe("Dictation revisions on macOS Chrome", () => {
  test.beforeEach(async ({ page, editor, browserName }) => {
    test.skip(browserName !== "chromium", "presents Chromium as macOS Chrome")

    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "platform", { get: () => "MacIntel" })
      Object.defineProperty(Navigator.prototype, "userAgent", {
        get: () => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
      })
    })
    await page.goto("/")
    await editor.waitForConnected()
    await editor.setValue("<p>this is a test</p>")
  })

  test("a replacement rejected after Backspace leaves the caret where it was", async ({ editor }) => {
    await editor.placeCaretInside("this", 4)
    await sendRevision(editor, { inputType: "insertText", text: "best", target: "test", afterBackspace: true })
    await editor.send("X")

    await assertEditorPlainText(editor, "thiX is a test")
  })
})

async function sendRevision(editor, { inputType, text, target, afterBackspace = false }) {
  await editor.content.evaluate((root, { inputType, text, target, afterBackspace }) => {
    if (afterBackspace) {
      root.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", code: "Backspace", bubbles: true, cancelable: true }))
    }

    const range = findTextRange(root, target)
    const event = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType,
      data: inputType === "insertText" ? text : null
    })

    if (inputType === "insertReplacementText") {
      const dataTransfer = new DataTransfer()
      dataTransfer.setData("text/plain", text)
      Object.defineProperty(event, "dataTransfer", { value: dataTransfer })
    }
    Object.defineProperty(event, "getTargetRanges", { value: () => [ new StaticRange(range) ] })
    root.dispatchEvent(event)

    // Finds `text` in the editor's rendered text, which may span several DOM text nodes.
    function findTextRange(root, text) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const nodes = []
      let content = ""
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        nodes.push({ node, start: content.length })
        content += node.nodeValue
      }

      const start = content.indexOf(text)
      const end = start + text.length
      const first = nodes.find(({ node, start: nodeStart }) => start < nodeStart + node.nodeValue.length)
      const last = nodes.find(({ node, start: nodeStart }) => end <= nodeStart + node.nodeValue.length)
      return {
        startContainer: first.node, startOffset: start - first.start,
        endContainer: last.node, endOffset: end - last.start
      }
    }
  }, { inputType, text, target, afterBackspace })
  await editor.flush()
}
