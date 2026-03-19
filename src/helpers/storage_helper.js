export function bytesToHumanSize(bytes) {
  if (bytes === 0) return "0 B"
  const sizes = [ "B", "KB", "MB", "GB", "TB", "PB" ]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${ value.toFixed(2) } ${ sizes[i] }`
}

export function extractFileName(string) {
  return string.split("/").pop()
}

// Parse the content attribute of an action-text-attachment element, which may
// arrive in several formats depending on the serialization path:
//
// 1. Raw HTML (Trix/ActionText format, and new Lexxy format): the content
//    attribute holds HTML directly. JSON.parse fails, so we return as-is.
//
// 2. JSON-encoded HTML (legacy Lexxy format, browser round-trip): the content
//    attribute is a JSON string like '"<span ...>...</span>"'. JSON.parse
//    succeeds and unwraps it.
//
// 3. JSON-encoded HTML after server-side double-encoding: when Rails/Nokogiri
//    re-serializes the saved HTML, entities in the content attribute get
//    double-encoded (e.g., &quot; -> &amp;quot;). The browser decodes one layer
//    on paste, leaving entity-encoded characters that break JSON.parse. We
//    decode them and retry.
export function parseAttachmentContent(content) {
  try {
    return JSON.parse(content)
  } catch {
    // If content contains HTML entities (from server-side double-encoding),
    // decode them and retry JSON.parse for the legacy JSON format.
    if (content.includes("&")) {
      const decoded = decodeHtmlEntities(content)
      try {
        return JSON.parse(decoded)
      } catch {
        return decoded
      }
    }
    return content
  }
}

function decodeHtmlEntities(html) {
  const textarea = document.createElement("textarea")
  textarea.innerHTML = html
  return textarea.value
}

export function mimeTypeToExtension(mimeType) {
  if (!mimeType) return null

  const extension = mimeType.split("/")[1]
  return extension
}
