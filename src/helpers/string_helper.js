export function dasherize(value) {
  return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`)
}

export function isAutolinkableURL(string) {
  return /^(?:[a-z0-9]+:\/\/|www\.)[^\s]+$/i.test(string)
}

export function isPath(string) {
  return /^\/.*$/.test(string)
}

export function normalizeFilteredText(string) {
  return string
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
}

export function filterMatchPosition(text, potentialMatch) {
  const normalizedText = normalizeFilteredText(text)
  const normalizedMatch = normalizeFilteredText(potentialMatch)

  if (!normalizedMatch) return 0

  const match = normalizedText.match(new RegExp(`(?:^|\\b)${escapeForRegExp(normalizedMatch)}`))
  return match ? match.index : -1
}

export function upcaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function escapeForRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Parses a value that may arrive as a boolean or as a string (e.g. from DOM
// getAttribute) into a proper boolean. Ensures "false" doesn't evaluate as truthy.
export function parseBoolean(value) {
  if (typeof value === "string") return value === "true"
  return Boolean(value)
}
