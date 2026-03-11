// Normalize HTML whitespace for comparison.
// Simpler than Ruby's Nokogiri-based normalize_html, but sufficient for
// comparing clean Lexical-generated HTML against expected strings.
export function normalizeHtml(html) {
  return html
    .replace(/\n/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim()
}
