import { DOMPurify, buildConfig } from "../config/dom_purify"

// An editor's sanitizer: the allowlist it was registered with, applied to a
// string.
//
// The allowlist is per editor, and passed to each sanitize() call. Neither of
// those is incidental. This used to be a module-level config installed with
// DOMPurify.setConfig() on the shared singleton, which had two distinct
// consequences:
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
//    value it submits.
//
// Sanitizers are keyed by the Lexical editor, which is the identity both call
// sites have: the element registers with it and keeps the result as
// `this.sanitizer`, while nodes only receive it as createDOM()'s second argument
// and resolve their sanitizer with for().
export default class EditorSanitizer {
  static #instances = new WeakMap()

  // Only reached for an editor that never registered, which is a supported case:
  // CustomActionTextAttachmentNode is exported from src/index.js, so it can be
  // registered in a Lexical editor Lexxy did not build.
  //
  // Fixed, and never reassigned. Pointing it at whichever sanitizer registered
  // most recently would make an unregistered consumer's allowlist depend on
  // which Lexxy editor happened to initialise last — the last-editor-wins bug
  // this class exists to remove, reintroduced on the one path that has no editor
  // to key on, and unobservable from the consumer's own code.
  //
  // It declares no allowlist, so DOMPurify's own default policy applies. An
  // empty allowlist would be deterministic too and strips every tag, which
  // silently drops markup a standalone consumer used to keep. It holds no
  // editor either, so nothing here pins a disconnected editor's DOM.
  //
  // A consumer wanting its own allowlist registers for it: register() needs only
  // the Lexical editor and is reachable as EditorSanitizer from src/index.js.
  static #fallback = new EditorSanitizer()

  static register(editor, allowedElements = []) {
    const sanitizer = new EditorSanitizer(this.#allowedElementsFor(editor, allowedElements))
    this.#instances.set(editor, sanitizer)

    return sanitizer
  }

  static for(editor) {
    return this.#instances.get(editor) ?? this.#fallback
  }

  // An editor can import every tag it can convert from HTML, plus whatever its
  // extensions declare. Lexical registers the conversions while building the
  // editor, so they are already in place when $initialEditorState registers us.
  static #allowedElementsFor(editor, allowedElements) {
    return this.#importableTags(editor).concat(allowedElements)
  }

  static #importableTags(editor) {
    const tags = Array.from(editor._htmlConversions.keys())
    return tags.filter(tag => !tag.startsWith("#"))
  }

  #config

  constructor(allowedElements = null) {
    this.#config = buildConfig(allowedElements)
  }

  sanitize(html) {
    return DOMPurify.sanitize(html, this.#config)
  }
}
