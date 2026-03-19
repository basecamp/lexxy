import DOMPurify from "dompurify"
import { buildConfig } from "../config/dom_purify"

export function sanitize(html, allowedElements) {
  return DOMPurify.sanitize(html, buildConfig(allowedElements))
}
