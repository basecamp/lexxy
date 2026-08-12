import { DOMPurify, buildConfig } from "../config/dom_purify"

// Sanitizer config is per editor, and passed to each sanitize() call.
//
// Neither of those is incidental. This used to call DOMPurify.setConfig() on the
// shared singleton, which had two distinct consequences:
//
// 1. A persistent config is final — DOMPurify ignores the per-call config once
//    one is set — so it silently disarmed the sanitizing of any host app that
//    also imports dompurify. See config/dom_purify for why we now own our
//    instance; keeping the config per-call means there is no global sanitizer
//    state left even on that instance.
//
// 2. One config for the whole module meant the last editor to connect decided
//    how every other editor on the page sanitized. That is not cosmetic: an
//    editor's `value` is sanitized on read, so a rich editor sharing a page with
//    a plain one would silently drop its own headings, lists and links from the
//    value it submits. Keying on the editor is what fixes that.
//
// Registered against the Lexical editor, which is the identity both call sites
// have to hand: the element has it as `this.editor`, and nodes receive it as the
// second argument to createDOM().
const configs = new WeakMap()

// Only reached if sanitize() is called for an editor that never registered one.
// Falling back to the most recent config keeps the old behaviour rather than
// silently widening the allowlist to DOMPurify's permissive defaults.
let fallbackConfig = {}

export function setSanitizerConfig(editor, allowedTags) {
  fallbackConfig = buildConfig(allowedTags)
  configs.set(editor, fallbackConfig)
}

// Re-inflating stored attachment content is an untrusted storage round-trip, so that
// call site opts into DOMPurify's mXSS-safe mode with { safeForXml: true }.
//
// The safe-XML config is derived from *this editor's* config rather than a module
// base, and by spreading it rather than rebuilding: that keeps TRUSTED_TYPES_POLICY
// and ADD_URI_SAFE_ATTR, and keeps the per-editor allowlist that the whole point of
// keying on the editor was to preserve. Building from a shared base here would
// quietly reintroduce the last-editor-wins bug on the one path that handles
// untrusted content.
export function sanitize(html, editor, { safeForXml = false } = {}) {
  const config = configs.get(editor) ?? fallbackConfig

  return DOMPurify.sanitize(html, safeForXml ? { ...config, SAFE_FOR_XML: true } : config)
}
