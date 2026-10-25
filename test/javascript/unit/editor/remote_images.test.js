import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, setContent } from "../helpers/editor_helper"
import Lexxy from "src/config/lexxy"

const remoteImage = `<img src="https://example.com/photo.jpg" alt="Photo">`
const remoteImageAttachment = `<action-text-attachment url="https://example.com/photo.jpg" content-type="image/jpeg"></action-text-attachment>`
const uploadedImage = `<action-text-attachment sgid="image-sgid" url="/rails/active_storage/blobs/photo.png" content-type="image/png" filename="photo.png"></action-text-attachment>`
const remoteFile = `<action-text-attachment url="https://example.com/doc.pdf" content-type="application/pdf" filename="doc.pdf"></action-text-attachment>`

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

    expect(editorElement.value).not.toContain("example.com/photo.jpg")
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
})
