import { $generateHtmlFromNodes } from "@lexical/html"
import { DOMPurify, buildConfig } from "../config/dom_purify"

// An editor's sanitizer: its own allowlist, applied to its own value.
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
// An instance is built around the Lexical editor because that is the identity
// both call sites have to hand: the element holds it as `this.editor` and
// exposes its sanitizer as `editorElement.sanitized`, while nodes only receive
// it as the second argument to createDOM() and resolve the sanitizer with for().
export default class SanitizedEditor {
  static #instances = new WeakMap()

  // Only reached for an editor that never declared an allowlist. It tracks the
  // most recently configured one, which keeps the behavior of the module-level
  // config this replaced rather than silently widening to DOMPurify's permissive
  // defaults. It is an editor-less instance carrying only that allowlist: holding
  // a configured instance here would keep its editor, and so its DOM, alive for
  // as long as the page lives.
  static #fallback = new SanitizedEditor()

  static for(editor) {
    return this.#instances.get(editor) ?? this.#fallback
  }

  #editor
  #config = {}

  constructor(editor) {
    this.#editor = editor
  }

  set allowedTags(allowedTags) {
    this.#config = buildConfig(allowedTags)
    SanitizedEditor.#register(this)
  }

  get value() {
    return this.#editor.read(() => this.sanitize($generateHtmlFromNodes(this.#editor, null)))
  }

  sanitize(html) {
    return DOMPurify.sanitize(html, this.#config)
  }

  static #register(sanitized) {
    this.#instances.set(sanitized.#editor, sanitized)
    this.#fallback.#config = sanitized.#config
  }
}
