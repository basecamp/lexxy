// Registered from the app's eager bundle so it runs before Dragon's content
// script (which registers at document_end) and can stop the extension from
// editing the DOM directly. It holds no Lexical to keep that bundle light, and
// make_changes.js handles the edit lazily. The flag keeps a single registration
// when this module loads from both the app's bundle and Lexxy's.
const INSTALLED = Symbol.for("lexxy/dragon/support")

if (!window[INSTALLED]) {
  window[INSTALLED] = true
  window.addEventListener("message", handleMessage, { capture: true })
}

function handleMessage(event) {
  if (event.origin !== window.location.origin) return

  const args = makeChangesArgumentsFrom(event.data)

  if (args && isEditorFocused()) {
    event.stopImmediatePropagation()
    document.dispatchEvent(new CustomEvent("lexxy:dragon-make-changes", { detail: args }))
  }
}

// Only the editable root: Lexxy's own inputs and textareas (link, caption, alt
// text) are left to the extension
function isEditorFocused() {
  const element = document.activeElement
  return element?.isContentEditable && element.closest("lexxy-editor")?.editor?.getRootElement() === element
}

function makeChangesArgumentsFrom(data) {
  if (typeof data !== "string" || !data.includes("nuanria_messaging")) return null

  const message = parsedJson(data)
  const isMakeChanges = message?.protocol === "nuanria_messaging" &&
    message?.type === "request" && message.payload?.functionId === "makeChanges"

  return isMakeChanges ? message.payload.args : null
}

function parsedJson(data) {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}
