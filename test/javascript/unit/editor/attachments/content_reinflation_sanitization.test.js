import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, tick } from "../../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

// Re-inflating stored attachment content is an untrusted storage round-trip. The
// custom attachment node re-parses the serialized `content` HTML into the live
// editor DOM, so it must be sanitized in DOMPurify's mXSS-safe mode while keeping
// legitimate content (including comments) intact.
describe("attachment content re-inflation sanitization", () => {
  const attachment = (content) =>
    `<action-text-attachment content-type="text/html" sgid="abc123" content="${content}"></action-text-attachment>`

  // The payload has to be one SAFE_FOR_XML actually decides, or the test passes
  // with the change reverted and proves nothing. An ordinary `onerror` doesn't
  // qualify: DOMPurify's tag and attribute allowlists remove it either way.
  //
  // A comment terminator inside an attribute value does. SAFE_FOR_XML drops any
  // attribute whose value could close a comment or a raw-text element when the
  // sanitized markup is re-serialized and parsed again — which is exactly what
  // re-inflating stored content does.
  test("drops an attribute whose value can break out of a comment", async () => {
    const payload = "&lt;p title=&quot;--&gt;&lt;img src=x onerror=alert(1)&gt;&quot;&gt;hi&lt;/p&gt;"
    editorElement = await createTestEditor({ value: attachment(payload) })
    await tick()

    const figure = editorElement.querySelector("action-text-attachment, [content-type]")
    expect(figure, "attachment was dropped on re-inflation").not.toBeNull()

    // Verified by reverting the safeForXml opt-in in createDOM: without it the
    // title survives verbatim and this assertion fails.
    expect(figure.innerHTML).not.toContain("--&gt;")
    expect(figure.innerHTML).not.toMatch(/onerror/i)
    expect(figure.textContent).toContain("hi")
  })

  test("preserves legitimate comment-bearing attachment content after round-trip", async () => {
    const content = "&lt;!-- BEGIN app/views/users/_user.html.erb --&gt;&lt;span&gt;Chris&lt;/span&gt;&lt;!-- END app/views/users/_user.html.erb --&gt;"
    editorElement = await createTestEditor({ value: attachment(content) })
    await tick()

    // The attachment survives, and its exported value still carries the content.
    expect(editorElement.value).toContain("action-text-attachment")
    expect(editorElement.value).toContain("BEGIN app/views/users/_user.html.erb")
    // The rendered inner content is present in the editor DOM.
    expect(editorElement.textContent).toContain("Chris")
  })
})
