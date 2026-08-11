import { configure } from "lexxy"
import "./events_logger.js"

// A plain-text preset alongside the default rich one. The two resolve different
// importable tags, which is what makes their sanitizer allowlists differ.
configure({ plain: { richText: false } })
