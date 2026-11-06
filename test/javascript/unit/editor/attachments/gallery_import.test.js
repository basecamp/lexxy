import { afterEach, describe, expect, test } from "vitest"
import { PASTE_TAG } from "lexical"
import { createTestEditor, destroyTestEditor } from "../../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("Pasting a div of image attachments", () => {
  async function paste(html) {
    editorElement = await createTestEditor()
    editorElement.contents.insertHtml(html, { tag: PASTE_TAG })
    await editorElement.editor.read(() => {})
  }

  function image(n, content = "") {
    return `<action-text-attachment sgid="sgid${n}" content-type="image/png" url="https://example.com/${n}.png" filename="${n}.png" previewable="true" presentation="gallery">${content}</action-text-attachment>`
  }

  function galleries() {
    return editorElement.querySelectorAll(".attachment-gallery")
  }

  test("imports a gallery whose attachments hold text", async () => {
    await paste(`<div>${image(1)}${image(2)}${image(3, "Text!")}</div>`)

    expect(galleries()).toHaveLength(1)
    expect(galleries()[0].querySelectorAll("figure.attachment")).toHaveLength(3)
  })

  test("imports a gallery copied from rendered content, with figures and captions", async () => {
    const rendered = n => image(n, `<figure class="attachment attachment--preview"><a href="https://example.com/${n}.png"><img src="https://example.com/${n}.png"></a><figcaption class="attachment__caption"><span>${n}.png</span> <a href="https://example.com/${n}.png?disposition=attachment">Download</a></figcaption></figure>`)
    await paste(`<div class="attachment-gallery attachment-gallery--3">\n  ${rendered(1)}\n  ${rendered(2)}\n  ${rendered(3)}\n</div>`)

    expect(galleries()).toHaveLength(1)
    expect(galleries()[0].querySelectorAll("figure.attachment")).toHaveLength(3)
    expect(editorElement.value).not.toContain("Download")
  })

  test("does not import a div with text between its attachments as a gallery", async () => {
    await paste(`<div>${image(1)} Text ${image(2)}${image(3)}</div>`)

    expect(galleries()).toHaveLength(0)
    expect(editorElement.value).toContain("Text")
  })

  test("does not import a div of plain text as a gallery", async () => {
    await paste("<div>Just a paragraph of text</div>")

    expect(galleries()).toHaveLength(0)
    expect(editorElement.value).toContain("Just a paragraph of text")
  })

  test("does not import an empty div as a gallery", async () => {
    await paste("<p>Before</p><div></div><p>After</p>")

    expect(galleries()).toHaveLength(0)
    expect(editorElement.value).toContain("Before")
    expect(editorElement.value).toContain("After")
  })
})
