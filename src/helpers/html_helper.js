import DOMPurify from "dompurify"

const ALLOWED_HTML_TAGS = [ "a", "action-text-attachment", "b", "blockquote", "br", "code", "em",
  "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "mark", "ol", "p", "pre", "q", "s", "strong", "ul" ]

const ALLOWED_HTML_ATTRIBUTES = [ "alt", "caption", "class", "content", "content-type", "contenteditable",
  "data-direct-upload-id", "data-sgid", "filename", "filesize", "height", "href", "presentation",
  "previewable", "sgid", "src", "style", "title", "url", "width" ]

export function createElement(name, properties) {
  const element = document.createElement(name)
  for (const [ key, value ] of Object.entries(properties || {})) {
    if (key in element) {
      element[key] = value
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, value)
    }
  }
  return element
}

export function parseHtml(html) {
  const parser = new DOMParser()
  return parser.parseFromString(html, "text/html")
}

export function createAttachmentFigure(contentType, isPreviewable, fileName) {
  const extension = fileName ? fileName.split(".").pop().toLowerCase() : "unknown"
  return createElement("figure", {
    className: `attachment attachment--${isPreviewable ? "preview" : "file"} attachment--${extension}`,
    "data-content-type": contentType
  })
}

export function isPreviewableImage(contentType) {
  return contentType.startsWith("image/") && !contentType.includes("svg")
}

export function dispatchCustomEvent(element, name, detail) {
  const event = new CustomEvent(name, {
    detail: detail,
    bubbles: true,
  })
  element.dispatchEvent(event)
}

export function sanitize(html) {
  // Add hook to filter style attribute to only allow color and background properties
  function styleFilterHook(currentNode, hookEvent) {
    if (hookEvent.attrName === "style" && hookEvent.attrValue) {
      const allowedProperties = [ "background-color", "color" ]
      const styles = hookEvent.attrValue.split(";").map(style => style.trim()).filter(Boolean)
      const sanitizedStyles = styles.filter(style => {
        const [ property ] = style.split(":").map(part => part.trim())
        return allowedProperties.includes(property)
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

  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_HTML_TAGS,
    ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
    SAFE_FOR_XML: false // So that it does not stripe attributes that contains serialized HTML (like content)
  })

  // Remove the hook after sanitization to avoid side effects
  DOMPurify.removeHook("uponSanitizeAttribute", styleFilterHook)

  return sanitizedHtml
}

export function dispatch(element, eventName, detail = null, cancelable = false) {
  return element.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail, cancelable }))
}

export function generateDomId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${randomPart}`
}


