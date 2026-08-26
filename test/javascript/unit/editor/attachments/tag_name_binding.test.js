import { describe, expect, test } from "vitest"
import { createEditor } from "lexical"
import { ActionTextAttachmentNode } from "src/nodes/action_text_attachment_node"
import { CustomActionTextAttachmentNode } from "src/nodes/custom_action_text_attachment_node"

// The clipboard paste format (application/x-lexical-editor) is attacker-craftable
// JSON that flows straight into importJSON. tagName must never be honored from that
// payload: the rendered/exported element tag is bound to the configured TAG_NAME
// (attachmentTagName), exactly as importDOM already binds it. A crafted
// { tagName: "script", ... } must not become a <script> element and must not
// round-trip back out through exportJSON.
const CONFIGURED_TAG = "action-text-attachment"
const MALICIOUS = "script"

function standaloneEditor() {
  return createEditor({
    nodes: [ ActionTextAttachmentNode, CustomActionTextAttachmentNode ],
    onError: (error) => { throw error }
  })
}

function inEditor(editor, fn) {
  let result
  editor.update(() => { result = fn() }, { discrete: true })
  return result
}

describe("attachment node tag name binding", () => {
  test("CustomActionTextAttachmentNode.importJSON ignores an attacker tagName when rendering", () => {
    const editor = standaloneEditor()

    const dom = inEditor(editor, () => {
      const node = CustomActionTextAttachmentNode.importJSON({
        type: "custom_action_text_attachment",
        version: 1,
        tagName: MALICIOUS,
        contentType: "text/html",
        innerHtml: "<p>hi</p>"
      })
      return node.createDOM({}, editor)
    })

    expect(dom.tagName.toLowerCase()).toBe(CONFIGURED_TAG)
  })

  test("CustomActionTextAttachmentNode round-trips without carrying tagName", () => {
    const editor = standaloneEditor()

    const json = inEditor(editor, () =>
      CustomActionTextAttachmentNode.importJSON({
        type: "custom_action_text_attachment",
        version: 1,
        tagName: MALICIOUS,
        contentType: "text/html",
        innerHtml: "<p>hi</p>"
      }).exportJSON()
    )

    expect(json).not.toHaveProperty("tagName")

    const exportedTag = inEditor(editor, () =>
      CustomActionTextAttachmentNode.importJSON({ ...json, tagName: MALICIOUS }).exportDOM().element.tagName.toLowerCase()
    )

    expect(exportedTag).toBe(CONFIGURED_TAG)
  })

  test("CustomActionTextAttachmentNode.clone does not resurrect an attacker tagName", () => {
    const editor = standaloneEditor()

    const cloned = inEditor(editor, () => {
      const poisoned = CustomActionTextAttachmentNode.importJSON({
        type: "custom_action_text_attachment",
        version: 1,
        tagName: MALICIOUS,
        contentType: "text/html",
        innerHtml: "<p>hi</p>"
      })
      return CustomActionTextAttachmentNode.clone(poisoned)
    })

    expect(cloned).not.toHaveProperty("tagName")
    expect(inEditor(editor, () => cloned.createDOM({}, editor).tagName.toLowerCase())).toBe(CONFIGURED_TAG)
  })

  test("ActionTextAttachmentNode ignores an attacker tagName on export and JSON", () => {
    const editor = standaloneEditor()

    const { json, exportedTag } = inEditor(editor, () => {
      const node = ActionTextAttachmentNode.importJSON({
        type: "action_text_attachment",
        version: 1,
        tagName: MALICIOUS,
        sgid: "x",
        contentType: "image/png"
      })
      return { json: node.exportJSON(), exportedTag: node.exportDOM().element.tagName.toLowerCase() }
    })

    expect(json).not.toHaveProperty("tagName")
    expect(exportedTag).toBe(CONFIGURED_TAG)
  })
})
