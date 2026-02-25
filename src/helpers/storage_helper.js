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

export function mimeTypeToExtension(mimeType) {
  if (!mimeType) return null

  const extension = mimeType.split("/")[1]
  return extension
}
