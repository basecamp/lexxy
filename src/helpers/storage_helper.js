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

// Lexxy exports the content attribute as a JSON string (via JSON.stringify),
// but Trix/ActionText stores it as raw HTML. Try JSON first, fall back to raw.
export function parseAttachmentContent(content) {
  try {
    return JSON.parse(content)
  } catch {
    return content
  }
}

export function mimeTypeToExtension(mimeType) {
  if (!mimeType) return null

  const extension = mimeType.split("/")[1]
  return extension
}
