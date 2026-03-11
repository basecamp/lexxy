import { expect, test, vi, beforeEach } from "vitest"
import Lexxy from "../../../src/config/lexxy"

vi.mock("lexical", () => ({
  $getEditor: () => ({}),
  $getNearestRootOrShadowRoot: () => ({}),
  DecoratorNode: class {},
  HISTORY_MERGE_TAG: "history-merge"
}))

import { ActionTextAttachmentNode } from "../../../src/nodes/action_text_attachment_node"

function createAttachmentElement(attrs = {}) {
  const el = document.createElement("action-text-attachment")
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) el.setAttribute(key, value)
  }
  return el
}

beforeEach(() => {
  Lexxy.configure({ global: { remoteImages: true } })
})

test("default: importDOM() includes an img handler", () => {
  const handlers = ActionTextAttachmentNode.importDOM()
  expect(handlers).toHaveProperty("img")
})

test("default: attachment handler converts non-sgid images", () => {
  const handlers = ActionTextAttachmentNode.importDOM()
  const el = createAttachmentElement({
    url: "https://example.com/photo.jpg",
    "content-type": "image/jpeg"
  })
  const result = handlers["action-text-attachment"]().conversion(el)
  expect(result.node).not.toBeNull()
  expect(result.node.contentType).toBe("image/jpeg")
})

test("remoteImages: false — img handler returns null node", () => {
  Lexxy.configure({ global: { remoteImages: false } })
  const handlers = ActionTextAttachmentNode.importDOM()
  const img = document.createElement("img")
  img.setAttribute("src", "https://example.com/photo.jpg")
  const result = handlers["img"]().conversion(img)
  expect(result.node).toBeNull()
})

test("remoteImages: false — attachment handler returns null for non-sgid image", () => {
  Lexxy.configure({ global: { remoteImages: false } })
  const handlers = ActionTextAttachmentNode.importDOM()
  const el = createAttachmentElement({
    url: "https://example.com/photo.jpg",
    "content-type": "image/jpeg"
  })
  const result = handlers["action-text-attachment"]().conversion(el)
  expect(result.node).toBeNull()
})

test("remoteImages: false — sgid-backed attachments still import", () => {
  Lexxy.configure({ global: { remoteImages: false } })
  const handlers = ActionTextAttachmentNode.importDOM()
  const el = createAttachmentElement({
    sgid: "abc123",
    url: "https://example.com/photo.jpg",
    "content-type": "image/png",
    filename: "photo.png"
  })
  const result = handlers["action-text-attachment"]().conversion(el)
  expect(result.node).not.toBeNull()
  expect(result.node.sgid).toBe("abc123")
})

test("remoteImages: false — non-image attachments without sgid still import", () => {
  Lexxy.configure({ global: { remoteImages: false } })
  const handlers = ActionTextAttachmentNode.importDOM()
  const el = createAttachmentElement({
    url: "https://example.com/doc.pdf",
    "content-type": "application/pdf",
    filename: "doc.pdf"
  })
  const result = handlers["action-text-attachment"]().conversion(el)
  expect(result.node).not.toBeNull()
  expect(result.node.contentType).toBe("application/pdf")
})

test("remoteImages: false — video handler still present", () => {
  Lexxy.configure({ global: { remoteImages: false } })
  const handlers = ActionTextAttachmentNode.importDOM()
  expect(handlers).toHaveProperty("video")
})

test("config change after importDOM() is respected at conversion time", () => {
  const handlers = ActionTextAttachmentNode.importDOM()

  const img = document.createElement("img")
  img.setAttribute("src", "https://example.com/photo.jpg")
  expect(handlers["img"]().conversion(img).node).not.toBeNull()

  Lexxy.configure({ global: { remoteImages: false } })
  expect(handlers["img"]().conversion(img).node).toBeNull()
})
