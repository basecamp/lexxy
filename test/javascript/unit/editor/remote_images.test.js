import { afterEach, describe, expect, test } from "vitest"
import { PASTE_COMMAND } from "lexical"
import { createTestEditor, destroyTestEditor, selectEnd, setContent, tick } from "../helpers/editor_helper"
import Lexxy from "src/config/lexxy"

const remoteImage = `<img src="https://example.com/photo.jpg" alt="Photo">`
const remoteImageAttachment = `<action-text-attachment url="https://example.com/photo.jpg" content-type="image/jpeg"></action-text-attachment>`
const uploadedImage = `<action-text-attachment sgid="image-sgid" url="/rails/active_storage/blobs/photo.png" content-type="image/png" filename="photo.png"></action-text-attachment>`
const trixRemoteImage = `<action-text-attachment url="https://example.com/trix.jpg" content-type="image"></action-text-attachment>`
const remoteFile = `<action-text-attachment url="https://example.com/doc.pdf" content-type="application/pdf" filename="doc.pdf"></action-text-attachment>`

// jsdom has neither event class, and Lexical's paste handling checks events against both
globalThis.ClipboardEvent ??= class ClipboardEvent extends Event {}
globalThis.DragEvent ??= class DragEvent extends Event {}

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
  Lexxy.configure({ default: { remoteImages: true } })
})

describe("remoteImages", () => {
  test("keeps remote images by default", async () => {
    editorElement = await createTestEditor()

    await setContent(editorElement, `${remoteImage}${remoteImageAttachment}`)

    expect(editorElement.value).toContain(`url="https://example.com/photo.jpg"`)
    expect(editorElement.value.match(/<action-text-attachment/g)).toHaveLength(2)
  })

  test("drops remote images when disabled with the attribute", async () => {
    editorElement = await createTestEditor({ attributes: { "remote-images": "false" } })

    await setContent(editorElement, `<p>Before</p>${remoteImage}${remoteImageAttachment}<p>After</p>`)

    expect(editorElement.value).not.toContain("action-text-attachment")
    expect(editorElement.value).toContain("Before")
    expect(editorElement.value).toContain("After")
  })

  test("drops remote images when disabled in a preset", async () => {
    Lexxy.configure({ default: { remoteImages: false } })
    editorElement = await createTestEditor()

    await setContent(editorElement, remoteImage)

    expect(editorElement.value).not.toContain("action-text-attachment")
  })

  test("drops remote images nested in a table cell", async () => {
    editorElement = await createTestEditor({ attributes: { "remote-images": "false" } })

    await setContent(editorElement, `<table><tbody><tr><td>Cell ${remoteImage}</td></tr></tbody></table>`)

    expect(editorElement.value).toContain("<table")
    expect(editorElement.value).toContain("Cell")
    expect(editorElement.value).not.toContain("example.com/photo.jpg")
  })

  test("keeps uploaded images and remote files when disabled", async () => {
    editorElement = await createTestEditor({ attributes: { "remote-images": "false" } })

    await setContent(editorElement, `${uploadedImage}${remoteFile}`)

    expect(editorElement.value).toContain(`sgid="image-sgid"`)
    expect(editorElement.value).toContain(`content-type="application/pdf"`)
  })

  test("drops remote images that Trix stored with a bare image content type", async () => {
    editorElement = await createTestEditor({ attributes: { "remote-images": "false" } })

    await setContent(editorElement, trixRemoteImage)

    expect(editorElement.value).not.toContain("action-text-attachment")
  })

  test("drops remote images pasted from another editor's clipboard JSON", async () => {
    editorElement = await createTestEditor({ attributes: { "remote-images": "false" } })
    selectEnd(editorElement)

    pasteLexicalClipboard(editorElement, [
      { type: "paragraph", version: 1, children: [ { type: "text", version: 1, text: "Copied" } ] },
      { type: "action_text_attachment", version: 1, src: "https://example.com/photo.jpg", contentType: "image/jpeg" }
    ])
    await tick()

    expect(editorElement.value).toContain("Copied")
    expect(editorElement.value).not.toContain("action-text-attachment")
  })
})

function pasteLexicalClipboard(editorElement, nodes) {
  const data = {
    "application/x-lexical-editor": JSON.stringify({ namespace: editorElement.editor._config.namespace, nodes }),
    "text/html": "<p>Copied</p>"
  }
  const event = new ClipboardEvent("paste")
  event.clipboardData = {
    types: Object.keys(data),
    files: [],
    getData: (type) => data[type] ?? ""
  }
  editorElement.editor.dispatchCommand(PASTE_COMMAND, event)
}
