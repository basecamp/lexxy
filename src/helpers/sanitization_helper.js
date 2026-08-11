import { DOMPurify, buildConfig } from "../config/dom_purify"

export function setSanitizerConfig(allowedTags) {
  DOMPurify.clearConfig()
  DOMPurify.setConfig(buildConfig(allowedTags))
}

export function sanitize(html) {
  return DOMPurify.sanitize(html)
}
