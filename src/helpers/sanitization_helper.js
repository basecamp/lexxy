import DOMPurify from "dompurify"
import { buildConfig } from "../config/dom_purify"

export function sanitize(html) {
  return DOMPurify.sanitize(html, buildConfig())
}

// Sanitize HTML for custom attachment content (mentions, cards, etc.).
// Uses DOMPurify defaults to strip XSS vectors (scripts, event handlers)
// while preserving the richer tag set that server-rendered attachment
// content legitimately uses (e.g. <span>, <div>, <img>).
export function sanitizeAttachmentContent(html) {
  return DOMPurify.sanitize(html)
}
