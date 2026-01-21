/**
 * Normalizes HTML content from the Lexical editor.
 *
 * Lexical produces `<p><br></p>` for empty editor content to ensure
 * the contentEditable area remains functional (cursor placement, focus, etc.).
 * This function normalizes that empty state to an empty string.
 *
 * @param {string} html - The HTML string to normalize
 * @returns {string} - The normalized HTML string
 */
export function normalizeEmptyContent(html) {
  if (!html) return html
  return html.trim() === "<p><br></p>" ? "" : html
}
