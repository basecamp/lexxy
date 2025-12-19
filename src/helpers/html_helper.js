import DOMPurify from "dompurify"

export function createElement(name, properties, content = "") {
  const element = document.createElement(name)
  for (const [ key, value ] of Object.entries(properties || {})) {
    if (key in element) {
      element[key] = value
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, value)
    }
  }
  if (content) {
    element.innerHTML = content
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
  return DOMPurify.sanitize(html)
}

export function dispatch(element, eventName, detail = null, cancelable = false) {
  return element.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail, cancelable }))
}

export function generateDomId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${randomPart}`
}


