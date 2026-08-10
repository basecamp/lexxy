import { DOMPurify, buildConfig } from "../config/dom_purify"

// The config is passed to each sanitize() call rather than installed with
// DOMPurify.setConfig().
//
// A persistent config is final — DOMPurify ignores the per-call config once one
// has been set — so setConfig() is only ever safe on an instance nobody else
// shares. We now have our own (see config/dom_purify), and keeping the config
// per-call means there is no global sanitizer state left even on that instance.
let config = {}

export function setSanitizerConfig(allowedTags) {
  config = buildConfig(allowedTags)
}

export function sanitize(html) {
  return DOMPurify.sanitize(html, config)
}
