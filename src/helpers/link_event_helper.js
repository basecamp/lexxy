import { dispatch } from "./html_helper"

export function dispatchLinkEvent(event, editorElement, nodeKey, payload) {
  const linkManipulationMethods = {
    replaceLinkWith: (html) => editorElement.contents.replaceNodeWithHTML(nodeKey, html),
    insertBelowLink: (html) => editorElement.contents.insertHTMLBelowNode(nodeKey, html)
  }

  dispatch(editorElement, `lexxy:link-${event}`, {
    ...payload,
    ...linkManipulationMethods
  })
}
