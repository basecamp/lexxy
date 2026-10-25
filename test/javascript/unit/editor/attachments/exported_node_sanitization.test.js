import { beforeEach, describe, expect, test } from "vitest"
import { createEditor } from "lexical"
import EditorSanitizer from "src/editor/sanitizer"
import { CustomActionTextAttachmentNode } from "src/nodes/custom_action_text_attachment_node"

// CustomActionTextAttachmentNode is exported from src/index.js, so it can be
// registered in a Lexical editor Lexxy did not build. That editor never calls
// EditorSanitizer.register, so every attachment it renders re-inflates through
// the fallback — a path no other test reaches, and the only one where what a
// sanitizer does is not decided by the editor asking.
//
// A standalone editor with this node imports inline tags, p, br and the
// attachment element, and nothing else: no h1, no blockquote. That gap is what
// the assertions below read.
const MARKUP = "<h1>Title</h1><blockquote>quoted</blockquote><p>body</p><script>evil()</script>"

function standaloneEditor() {
  return createEditor({ nodes: [ CustomActionTextAttachmentNode ], onError: () => {} })
}

// Nodes are built and rendered inside an update, which is where Lexical itself
// calls createDOM.
function reinflate(editor, innerHtml = MARKUP) {
  let inflated

  editor.update(() => {
    inflated = new CustomActionTextAttachmentNode({ contentType: "text/html", innerHtml }).createDOM({}, editor).innerHTML
  }, { discrete: true })

  return inflated
}

// A Lexxy editor competing for the fallback, registered with a narrow allowlist.
function registerNarrowEditor() {
  EditorSanitizer.register({ _htmlConversions: new Map() }, [ "strong" ])
}

let editor

beforeEach(() => {
  editor = standaloneEditor()
})

describe("exported attachment node sanitization", () => {
  // The fallback declares no allowlist, so DOMPurify's own default policy
  // applies — which is what this consumer had before Lexxy owned an instance.
  // An empty allowlist is deterministic too and strips every tag, leaving the
  // attachment rendering as bare text.
  test("re-inflates under DOMPurify's default policy when no editor registered", () => {
    const inflated = reinflate(editor)

    expect(inflated).toContain("<h1>")
    expect(inflated).toContain("<blockquote>")
    expect(inflated).toContain("<p>")
    // Still a sanitizer, not a passthrough.
    expect(inflated).not.toMatch(/script/i)
  })

  // The regression that matters more than the stripping: a fallback pointing at
  // whichever sanitizer registered most recently makes this consumer's allowlist
  // depend on which Lexxy editor happened to initialise last — last-editor-wins,
  // on the one path with no editor to key on.
  test("re-inflates the same way after another editor registers", () => {
    const before = reinflate(editor)

    registerNarrowEditor()

    expect(reinflate(editor)).toBe(before)
  })

  // The supported route for a consumer that wants a specific allowlist rather
  // than the default. register() takes the Lexical editor and nothing else it
  // cannot supply, and EditorSanitizer is exported for exactly this.
  test("a consumer can register its own allowlist for the exported node", () => {
    EditorSanitizer.register(editor)

    const inflated = reinflate(editor)

    // p is importable by this editor, blockquote is not, so registering narrows
    // what the default kept — which is the point of registering.
    expect(inflated).toContain("<p>")
    expect(inflated).not.toContain("<blockquote>")
    expect(inflated).toContain("quoted")
  })
})
