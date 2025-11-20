import DOMPurify from "dompurify"

const ALLOWED_HTML_TAGS = [ "a", "action-text-attachment", "b", "blockquote", "br", "code", "em",
  "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "mark", "ol", "p", "pre", "q", "s", "strong", "ul" ]

const ALLOWED_HTML_ATTRIBUTES = [ "alt", "caption", "class", "content", "content-type", "contenteditable",
  "data-direct-upload-id", "data-sgid", "filename", "filesize", "height", "href", "presentation",
  "previewable", "sgid", "src", "style", "title", "url", "width" ]

const ALLOWED_CSS_PROPERTIES = [ "color", "background-color" ]

function styleFilterHook(currentNode, hookEvent) {
  if (hookEvent.attrName === "style" && hookEvent.attrValue) {
    const styles = hookEvent.attrValue.split(";").map(style => style.trim()).filter(Boolean)
    const sanitizedStyles = styles.filter(style => {
      const [ property ] = style.split(":").map(part => part.trim())
      return ALLOWED_CSS_PROPERTIES.includes(property)
    })
    const sanitizedValue = sanitizedStyles.join("; ").trim()
    if (sanitizedValue) {
      hookEvent.attrValue = sanitizedValue
    } else {
      hookEvent.keepAttr = false
    }
  }
}

DOMPurify.addHook("uponSanitizeAttribute", styleFilterHook)

DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "strong" || data.tagName === "em") {
    node.removeAttribute("class")
  }
})

DOMPurify.setConfig({
  ALLOWED_TAGS: ALLOWED_HTML_TAGS,
  ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
  SAFE_FOR_XML: false // So that it does not strip attributes that contains serialized HTML (like content)
})
