import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent, assertEditorHtml } from "../../helpers/assertions.js"

const URL = "https://37signals.com"

function linkNode({ url = URL, text = URL } = {}) {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text,
        type: "text",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "link",
    version: 1,
    rel: null,
    target: null,
    title: null,
    url,
  }
}

function bareLinkNode() {
  return linkNode()
}

function paragraphNode(children) {
  return {
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
    textFormat: 0,
    textStyle: "",
  }
}

function lexicalPayload(nodes) {
  return JSON.stringify({ namespace: "Lexxy", nodes })
}

async function pasteWithLexicalPayload(editor, lexical, { html, text } = {}) {
  await editor.content.evaluate(
    (el, { text, html, lexical }) => {
      const event = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      })
      event.clipboardData.setData("text/plain", text)
      event.clipboardData.setData("text/html", html)
      event.clipboardData.setData("application/x-lexical-editor", lexical)
      el.dispatchEvent(event)
    },
    { text: text ?? URL, html: html ?? `<a href="${URL}">${URL}</a>`, lexical },
  )
  await editor.flush()
}

test.describe("Paste — Lexxy → Lexxy link copy", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()
  })

  test("wraps the selected text when a Lexxy lexical payload contains only a link", async ({
    editor,
  }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("everyone")

    await pasteWithLexicalPayload(editor, lexicalPayload([ bareLinkNode() ]))

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator(`a[href="${URL}"]`)).toHaveText("everyone")
    })
  })

  test("wraps the selected text when a Lexxy lexical payload wraps a single link in a paragraph", async ({
    editor,
  }) => {
    await editor.setValue("<p>Hello everyone</p>")
    await editor.select("everyone")

    await pasteWithLexicalPayload(
      editor,
      lexicalPayload([ paragraphNode([ bareLinkNode() ]) ]),
    )

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator(`a[href="${URL}"]`)).toHaveText("everyone")
    })
  })

  test("inserts the link when pasting a single-link Lexxy payload with no selection", async ({
    editor,
  }) => {
    await editor.setValue("<p>Hello</p>")
    await editor.focus()
    await editor.send("End")

    await pasteWithLexicalPayload(editor, lexicalPayload([ bareLinkNode() ]))

    await assertEditorHtml(editor, `<p>Hello<a href="${URL}">${URL}</a></p>`)
  })

  test("preserves both href and label when pasting a labeled Lexxy link with no selection", async ({
    editor,
  }) => {
    await editor.setValue("<p>Hello </p>")
    await editor.focus()
    await editor.send("End")

    const labeled = linkNode({ url: URL, text: "Click here" })

    await pasteWithLexicalPayload(editor, lexicalPayload([ labeled ]), {
      html: `<a href="${URL}">Click here</a>`,
      text: "Click here",
    })

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator(`a[href="${URL}"]`)).toHaveText("Click here")
    })
  })

  test("does not unwrap when the Lexxy payload contains a link plus surrounding text", async ({
    editor,
  }) => {
    await editor.setValue("<p>Greetings </p>")
    await editor.focus()
    await editor.send("End")

    const mixedParagraph = paragraphNode([
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: "see ",
        type: "text",
        version: 1,
      },
      bareLinkNode(),
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: " for details",
        type: "text",
        version: 1,
      },
    ])

    await pasteWithLexicalPayload(editor, lexicalPayload([ mixedParagraph ]), {
      html: `<p>see <a href="${URL}">${URL}</a> for details</p>`,
      text: `see ${URL} for details`,
    })

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator(`a[href="${URL}"]`)).toHaveText(URL)
      await expect(content).toContainText("see")
      await expect(content).toContainText("for details")
    })
  })
})
