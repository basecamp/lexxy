import { afterEach, expect, test } from "vitest"
import { $getRoot, COLLABORATION_TAG } from "lexical"
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

function tokenKeys() {
  return editor.editor.getEditorState().read(() => $getRoot().getChildren().find($isCodeNode).getChildren().map((node) => node.getKey()))
}

function tokenTexts() {
  return editor.editor.getEditorState().read(() => $getRoot().getChildren().find($isCodeNode).getChildren().map((node) => node.getTextContent()))
}

async function retokenizeWithStaleTokens() {
  editor.editor.update(() => {
    const tokens = $getRoot().getChildren().find($isCodeNode).getChildren()
    tokens[0].getWritable().__highlightType = "stale"
    tokens[tokens.length - 1].getWritable().__highlightType = "stale"
  }, { discrete: true })
  await tick()
  await tick()
}

// Lexical's retokenizer replaces every token between the first and the last
// one its diff sees as changed. Tokens whose highlight types no longer match
// the tokenizer's make that the whole block, on every pass.
test("a retokenization pass over unchanged code keeps the existing tokens", async () => {
  await loadEditorWithValue('<pre data-language="javascript"><code>const a = 1\nconst b = 2</code></pre>')
  const keysBefore = tokenKeys()
  expect(keysBefore.length).toBeGreaterThan(1)

  await retokenizeWithStaleTokens()

  expect(tokenKeys()).toEqual(keysBefore)
})

test("an edit to the code still retokenizes it", async () => {
  await loadEditorWithValue('<pre data-language="javascript"><code>const a = 1</code></pre>')

  editor.editor.update(() => {
    const codeNode = $getRoot().getChildren().find($isCodeNode)
    codeNode.getLastChild().spliceText(0, 0, "+ 2")
  }, { discrete: true })
  await tick()
  await tick()

  expect(tokenTexts()).toContain("+")
  expect(tokenTexts().join("")).toBe("const a = + 21")
})

test("text spliced in under COLLABORATION_TAG keeps the tokens it came with", async () => {
  await loadEditorWithValue('<pre data-language="javascript"><code>const a = 1</code></pre>')
  const keysBefore = tokenKeys()

  editor.editor.update(() => {
    const codeNode = $getRoot().getChildren().find($isCodeNode)
    codeNode.getFirstChild().spliceText(0, 0, "let b = 2; ")
  }, { discrete: true, tag: COLLABORATION_TAG })
  await tick()
  await tick()

  expect(tokenKeys()).toEqual(keysBefore)
  expect(tokenTexts().join("")).toBe("let b = 2; const a = 1")
})
