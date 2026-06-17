import { LineBreakNode, defineExtension } from "lexical"
import LexxyExtension from "./lexxy_extension"
import { MarkableLineBreakNode } from "../nodes/markable_line_break_node"
import ToolbarIcons from "../elements/toolbar_icons"
import { createElement } from "../helpers/html_helper"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"

export const SHOW_INVISIBLES_CLASS = "lexxy-editor__content--show-invisibles"

export class ShowInvisiblesExtension extends LexxyExtension {
  #button
  #listeners = new ListenerBin()

  get enabled() {
    return this.editorElement.supportsRichText && this.editorConfig.get("showInvisibles")
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/show-invisibles",
      nodes: [
        MarkableLineBreakNode,
        { replace: LineBreakNode, with: () => new MarkableLineBreakNode(), withKlass: MarkableLineBreakNode }
      ]
    })
  }

  initializeToolbar(toolbar) {
    this.#button = this.#createButton()
    this.#insertButton(toolbar)
    this.#listeners.track(registerEventListener(this.#button, "click", this.#toggle))
  }

  dispose() {
    this.#listeners.dispose()
  }

  #createButton() {
    return createElement("button", {
      type: "button",
      name: "show-invisibles",
      class: "lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end",
      title: "Show formatting marks",
      "aria-pressed": "false"
    }, ToolbarIcons.showInvisibles)
  }

  #insertButton(toolbar) {
    const pushRight = toolbar.querySelector(".lexxy-editor__toolbar-button--push-right")
    if (pushRight) {
      pushRight.insertAdjacentElement("beforebegin", this.#button)
    } else {
      toolbar.appendChild(this.#button)
    }
  }

  #toggle = () => {
    const visible = this.#contentElement.classList.toggle(SHOW_INVISIBLES_CLASS)
    this.#button.setAttribute("aria-pressed", visible.toString())
  }

  get #contentElement() {
    return this.editorElement.editorContentElement
  }
}
