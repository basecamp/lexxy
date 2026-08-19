import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, tick } from "../../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

// Re-inflating stored attachment content is an untrusted storage round-trip. The
// custom attachment node re-parses the serialized `content` HTML into the live
// editor DOM, so it must be sanitized in DOMPurify's mXSS-safe mode.
//
// Only the first test here guards that opt-in. The second one passes with the
// opt-in reverted, and is meant to: it pins the lax value hop, where a
// comment-bearing `content` attribute has to survive being read back. Both
// properties are needed, but they are not the same property.
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

    // Asserted on the DOM rather than on serialized markup, because the serialized
    // form does not show the difference. HTML attribute serialization escapes `&`
    // and `"` and never `>`, so with the opt-in reverted figure.innerHTML reads
    // `title="--><img src=x onerror=alert(1)>"` literally — a `--&gt;` never appears
    // in it either way, and asserting on one could not fail.
    //
    // Reverting the safeForXml opt-in in createDOM fails these two, and only these.
    expect(figure.querySelector("p").hasAttribute("title")).toBe(false)
    expect(figure.innerHTML).not.toMatch(/onerror/i)
    expect(figure.textContent).toContain("hi")
  })

  // Passes with the opt-in reverted, by design. What it guards is the hop the opt-in
  // is deliberately *not* applied to: an editor reading its own value back keeps
  // SAFE_FOR_XML off, so a comment-bearing `content` attribute survives. Turn that
  // hop strict and the attribute is dropped, importDOM returns null, and the
  // attachment disappears on the next edit.
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
