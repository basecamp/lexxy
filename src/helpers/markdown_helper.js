import { Marked } from "marked"

export function parsePastedMarkdown(text) {
  return pasteMarked.parse(text)
}

// A marked instance scoped to the paste flow. A fresh Marked starts from
// marked's stock defaults — gfm stays on and tables still parse — and is
// isolated from the global `marked` singleton, so a host bundle sharing the
// deduped module can't leak `marked.use(...)` customizations into pasting.
// The additions are breaks: true, matching the render pass Clipboard always
// used, and the `html` renderer.
//
// Following CommonMark, marked tokenizes a bare "<tag>" in prose as raw inline
// (or block) HTML. That is intentional for recognized tags — pasted plain text
// carrying <span style>, <mark>, <b>… is styled on import — but for an
// *unrecognized* element the Lexical importer has no converter and silently
// unwraps it, dropping the tag. WEBVTT speaker cues such as
// "<v Nabila Abdel Nabi>", where the name lives in what the HTML parser reads
// as attributes, thus vanish entirely.
//
// Classifying at marked's html renderer rides its public token grammar instead
// of shadowing it: marked routes code (`code`/`codespan`), autolinks and
// [text](<dest>) links to *other* token types that never reach this renderer,
// so their literal "<...>" content is preserved for free — no pre-escaping,
// code-region collection, or lexer-option syncing required. This renderer fires
// only for genuine raw-HTML tokens, and marked inserts its return value verbatim
// (it does not re-encode), so we escape unsupported tags to literal text here.
const pasteMarked = new Marked({
  breaks: true,
  renderer: { html: renderPastedHtmlToken }
})

// Matches a single HTML tag lexeme: an optional "/", a tag name, then attribute
// characters up to the closing ">". Quoted attribute values may contain ">" —
// the HTML tokenizer consumes them as part of the value, and marked's tag
// grammar matches them into the same raw token — so the attribute run matches
// quoted strings whole. Otherwise a lexeme like <v title="a > b"> would end at
// the inner ">", escaping only the prefix and leaving the tail for DOMParser
// to decode.
const HTML_TAG_LEXEME = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g

// Escape unknown tags *within* the raw-HTML token, keeping known tags intact.
// Lexeme-level (not whole-token) escaping matters because marked can emit a
// single coarse block-HTML token whose first tag is known but which nests an
// unknown one — e.g. "<div><v Name> Hello</div>" arrives as one token. We keep
// the <div> so it still renders, and escape the nested <v Name> so it survives
// as literal text rather than being unwrapped and dropped by the importer.
function renderPastedHtmlToken(token) {
  return token.text.replace(HTML_TAG_LEXEME, (lexeme, _slash, name) => {
    return isSupportedHtmlElement(name) ? lexeme : escapeHtml(lexeme)
  })
}

// The renderer's output is final, so escape the full lexeme — "&", "<" and ">" —
// for an exact round-trip (e.g. "<v A&nbsp;B>" → "&lt;v A&amp;nbsp;B&gt;").
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// "Supported" — safe to pass through for the importer to handle — is decided from
// the element taxonomy, not the importer's converter registry. The importer both
// converts tags it has a converter for (span→mark, b→bold, tr/td→table cells) and
// transparently traverses standard structural wrappers it has *no* converter for
// (thead, tbody, tfoot, colgroup, caption), keeping their children. A converter
// registry (editor._htmlConversions) lists only the former, so classifying by it
// escaped those wrappers to literal text and corrupted pasted tables — foster
// parenting hoisted "&lt;thead&gt;…" out as a stray paragraph. The taxonomy covers
// both: a standard HTML element is either converted or losslessly unwrapped.
//
// Two exclusions escape the tag to literal text instead:
//   - Invented tags (WEBVTT's "<v Nabila Abdel Nabi>", "<foo>"): document
//     .createElement returns HTMLUnknownElement. The importer would unwrap them,
//     dropping the tag — and for <v Name> the name lives in what parses as
//     attributes, so it vanishes entirely.
//   - Custom elements (turbo-frame, bc-attachment, action-text-attachment): a
//     hyphenated name is a custom element (HTML spec; no standard element has a
//     hyphen). They're excluded even when the importer registers a converter, so
//     a plain-text paste can never materialize an attachment/widget. Legitimate
//     attachments arrive through the rich-HTML paste path, not here.
function isSupportedHtmlElement(name) {
  const tag = name.toLowerCase()
  return !(document.createElement(tag) instanceof HTMLUnknownElement) && !tag.includes("-")
}
