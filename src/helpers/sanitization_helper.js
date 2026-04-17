import { DOMPurify, buildConfig } from "../config/dom_purify"

export function setSanitizerConfig(allowedTags, allowedStyles = []) {
  DOMPurify.clearConfig()
  DOMPurify.setConfig(buildConfig(allowedTags, allowedStyles))
}

export function sanitize(html) {
  return DOMPurify.sanitize(html)
}
