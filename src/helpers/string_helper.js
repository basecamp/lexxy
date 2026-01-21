export function dasherize(value) {
  return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`)
}

export function isUrl(string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

export function isPath(string) {
  return /^\/.*$/.test(string)
}

export function normalizeFilteredText(string) {
  return string
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
}

export function filterMatches(text, potentialMatch) {
  return normalizeFilteredText(text).includes(normalizeFilteredText(potentialMatch))
}

export function upcaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
