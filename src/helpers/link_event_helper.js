import { dispatch } from "./html_helper"

export function dispatchLinkEvent(event, editorElement, nodeKey, payload) {
  const linkManipulationMethods = {
    replaceLinkWith: (html, options) => editorElement.contents.replaceNodeWithHTML(nodeKey, html, options),
    insertBelowLink: (html, options) => editorElement.contents.insertHTMLBelowNode(nodeKey, html, options)
  }

  dispatch(editorElement, `lexxy:link-${event}`, {
    ...payload,
    ...linkManipulationMethods
  })
}
