import DOMPurify from "dompurify"
import { getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection"

const ALLOWED_HTML_ATTRIBUTES = [ "class", "contenteditable", "href", "src", "style", "title" ]

const DEFAULT_ALLOWED_STYLE_PROPERTIES = [ "color", "background-color" ]

let allowedStyleProperties = new Set(DEFAULT_ALLOWED_STYLE_PROPERTIES)

function styleFilterHook(_currentNode, hookEvent) {
  if (hookEvent.attrName === "style" && hookEvent.attrValue) {
    const styles = { ...getStyleObjectFromCSS(hookEvent.attrValue) }
    const sanitizedStyles = { }

    for (const property in styles) {
      if (allowedStyleProperties.has(property)) {
        sanitizedStyles[property] = styles[property]
      }
    }

    if (Object.keys(sanitizedStyles).length) {
      hookEvent.attrValue = getCSSFromStyleObject(sanitizedStyles)
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

export { DOMPurify }

export function buildConfig(allowedElements, allowedStyles = []) {
  const tagAttributes = {}

  for (const element of allowedElements) {
    if (typeof element === "string") {
      tagAttributes[element] ||= []
    } else {
      tagAttributes[element.tag] ||= []
      tagAttributes[element.tag].push(...element.attributes)
    }
  }

  allowedStyleProperties = new Set([ ...DEFAULT_ALLOWED_STYLE_PROPERTIES, ...allowedStyles ])

  return {
    ALLOWED_TAGS: Object.keys(tagAttributes),
    ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
    ADD_ATTR: (attribute, tag) => tagAttributes[tag]?.includes(attribute),
    ADD_URI_SAFE_ATTR: [ "caption", "filename" ],
    SAFE_FOR_XML: false // So that it does not strip attributes that contains serialized HTML (like content)
  }
}
