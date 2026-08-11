import { expect, test, describe, beforeEach } from "vitest"

import { setSanitizerConfig, sanitize } from "src/helpers/sanitization_helper"
import { ActionTextAttachmentNode } from "src/nodes/action_text_attachment_node"

// Mirrors AttachmentsExtension#allowedElements (src/extensions/attachments_extension.js).
const TAG = ActionTextAttachmentNode.TAG_NAME
const ATTACHMENT_ATTRIBUTES = [ "alt", "caption", "content", "content-type", "data-direct-upload-id",
  "data-sgid", "filename", "filesize", "height", "presentation", "previewable", "sgid", "url", "width" ]

function sanitizeAttachment(html) {
  setSanitizerConfig([ { tag: TAG, attributes: ATTACHMENT_ATTRIBUTES } ])
  return sanitize(html)
}

// Regression coverage for GHSA-cjmm-f4jc-qw8r: DOMPurify's ADD_ATTR-predicate form
// skipped URI validation, so a dangerous scheme in the attachment `url` attribute
// survived sanitization. The attachment `url` is read into an <img src>, so a bumped,
// URI-validating DOMPurify must reject javascript:/data: there while leaving legitimate
// blob download URLs (absolute and relative) intact.
describe("action-text-attachment url sanitization", () => {
  beforeEach(() => {
    setSanitizerConfig([ { tag: TAG, attributes: ATTACHMENT_ATTRIBUTES } ])
  })

  test("strips a javascript: scheme from the url attribute", () => {
    const output = sanitizeAttachment(`<${TAG} url="javascript:alert(document.domain)" content-type="image/*"></${TAG}>`)
    expect(output).not.toMatch(/javascript:/i)
  })

  test("strips a data:text/html scheme from the url attribute", () => {
    const output = sanitizeAttachment(`<${TAG} url="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" content-type="image/*"></${TAG}>`)
    expect(output).not.toMatch(/data:text\/html/i)
  })

  test("keeps a legitimate absolute https url", () => {
    const url = "https://bc3-production.s3.amazonaws.com/blob/example.png"
    const output = sanitizeAttachment(`<${TAG} url="${url}" content-type="image/*"></${TAG}>`)
    expect(output).toContain(url)
  })

  test("keeps a legitimate relative ActiveStorage url", () => {
    const url = "/rails/active_storage/blobs/redirect/abc123/example.png"
    const output = sanitizeAttachment(`<${TAG} url="${url}" content-type="image/*"></${TAG}>`)
    expect(output).toContain(url)
  })

  test("preserves the serialized-HTML content attribute", () => {
    // The `content` attribute intentionally carries serialized HTML (SAFE_FOR_XML: false);
    // it must survive sanitization here — it is scrubbed server-side, not by this pass.
    const output = sanitizeAttachment(`<${TAG} content="&quot;&lt;b&gt;hi&lt;/b&gt;&quot;" content-type="text/html"></${TAG}>`)
    expect(output).toMatch(/content=/)
  })
})
