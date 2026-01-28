import DOMPurify from "dompurify"
import { buildConfig } from "../config/dom_purify"

export function sanitize(html) {
  return DOMPurify.sanitize(html, buildConfig())
}

export function normalizeEmptyContent(html) {
  if (!html) return html;
  return html.trim() === "<p><br></p>" ? "" : html;
}
