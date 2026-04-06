import DOMPurify from "dompurify"
import { buildConfig } from "../config/dom_purify"

export function sanitize(html, config) {
  return DOMPurify.sanitize(html, buildConfig(config))
}
