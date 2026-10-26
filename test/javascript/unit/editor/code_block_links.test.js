import { afterEach, expect, test } from "vitest"
import { $getRoot, $isElementNode } from "lexical"
import { $isCodeNode } from "@lexical/code"
import { createTestEditor, destroyTestEditor, tick } from "../helpers/editor_helper"

let editor

afterEach(async () => {
  if (editor) {
    await destroyTestEditor(editor)
    editor = null
  }
  document.body.innerHTML = ""
})

async function loadEditorWithValue(value) {
  editor = await createTestEditor({ value })
  await tick()
  await tick()
  return editor
}

function linksIn(value, url) {
  const container = document.createElement("div")
  container.innerHTML = value
  return Array.from(container.querySelectorAll(`pre a[href="${url}"]`))
}

test("a link inside a code block survives loading and reading the value", async () => {
  await loadEditorWithValue('<pre data-language="plain"><code>see <a href="https://example.com/">docs</a> here</code></pre>')

  const anchors = linksIn(editor.value, "https://example.com/")
  expect(anchors.map((anchor) => anchor.textContent).join("")).toBe("docs")
  expect(editor.value).toContain("see ")
  expect(editor.value).toContain(" here")
})

test("a link inside a code block survives an edit elsewhere in the block", async () => {
  await loadEditorWithValue('<pre data-language="plain"><code>see <a href="https://example.com/">docs</a> here</code></pre>')

  editor.editor.update(() => {
    const codeNode = $getRoot().getChildren().find($isCodeNode)
    codeNode.getFirstChild().spliceText(0, 0, "please ")
  }, { discrete: true })
  await tick()
  await tick()

  const anchors = linksIn(editor.value, "https://example.com/")
  expect(anchors.map((anchor) => anchor.textContent).join("")).toBe("docs")
  expect(editor.value).toContain("please see ")
})

test("a link and a highlight coexist inside a code block", async () => {
  await loadEditorWithValue('<pre data-language="plain"><code>see <a href="https://example.com/">docs</a> and <mark style="background-color: rgb(255, 255, 0);">notes</mark> here</code></pre>')

  const anchors = linksIn(editor.value, "https://example.com/")
  expect(anchors.map((anchor) => anchor.textContent).join("")).toBe("docs")
  expect(editor.value).toMatch(/<mark[^>]*>notes<\/mark>/)
})

test("multiple links inside a code block all survive", async () => {
  await loadEditorWithValue('<pre data-language="plain"><code><a href="https://one.example.com/">one</a> and <a href="https://two.example.com/">two</a></code></pre>')

  expect(linksIn(editor.value, "https://one.example.com/").map((anchor) => anchor.textContent).join("")).toBe("one")
  expect(linksIn(editor.value, "https://two.example.com/").map((anchor) => anchor.textContent).join("")).toBe("two")
})

test("a link inside a Trix-authored code block survives along with its language", async () => {
  await loadEditorWithValue('<pre language="ruby"><code>require <a href="https://rubygems.org/">gems</a></code></pre>')

  expect(editor.value).toContain('data-language="ruby"')
  const anchors = linksIn(editor.value, "https://rubygems.org/")
  expect(anchors.map((anchor) => anchor.textContent).join("")).toBe("gems")
})

test("a link spanning highlighted syntax tokens survives retokenization", async () => {
  await loadEditorWithValue('<pre data-language="javascript"><code>const a = 1\n<a href="https://example.com/">const b = 2</a></code></pre>')

  const anchors = linksIn(editor.value, "https://example.com/")
  expect(anchors.map((anchor) => anchor.textContent).join("")).toBe("const b = 2")
})

// A link spanning a line break fragments into one anchor per line — the
// tokens on each side carry the link state, the line break between them
// can't — but every covered character keeps its link.
test("a link spanning a line break survives as one anchor per line", async () => {
  await loadEditorWithValue('<pre data-language="plain"><code><a href="https://example.com/">one\ntwo</a></code></pre>')

  const anchors = linksIn(editor.value, "https://example.com/")
  expect(anchors.map((anchor) => anchor.textContent)).toEqual([ "one", "two" ])
})

test("text without links round-trips unchanged", async () => {
  await loadEditorWithValue('<pre data-language="plain"><code>plain code</code></pre>')

  expect(editor.value).not.toContain("<a")
  expect(editor.value).toContain("plain code")
})
