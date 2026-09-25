// Registered from the app's eager bundle so it runs before Dragon's content
// script (which registers at document_end) and can stop the extension from
// editing the DOM directly. It holds no Lexical to keep that bundle light, and
// make_changes.js handles the edit lazily. The flag keeps a single registration
// when this module loads from both the app's bundle and Lexxy's.
if (!window.lexxyDragonInstalled) {
  window.lexxyDragonInstalled = true
  window.addEventListener("message", handleMessage, { capture: true })
}

function handleMessage(event) {
  if (event.origin !== window.location.origin) return

  const args = makeChangesArgumentsFrom(event.data)
  const editor = args && document.activeElement?.closest("lexxy-editor")

  if (editor) {
    event.stopImmediatePropagation()
    document.dispatchEvent(new CustomEvent("lexxy:dragon-make-changes", { detail: args }))
  }
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
