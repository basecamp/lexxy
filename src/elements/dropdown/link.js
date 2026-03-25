import { $getSelection, $isRangeSelection } from "lexical"
import { $isLinkNode } from "@lexical/link"
import { createElement } from "../../helpers/html_helper"
import ToolbarIcons from "../toolbar_icons"
import { ToolbarDropdown } from "../toolbar_dropdown"

export class LinkDropdown extends ToolbarDropdown {
  static buildToolbarElement(name, entry) {
    const details = createElement("details", {
      className: "lexxy-editor__toolbar-dropdown",
      name: "lexxy-dropdown"
    })

    const summaryProps = {
      className: "lexxy-editor__toolbar-button",
      name,
      title: entry.title
    }
    if (entry.hotkey) summaryProps["data-hotkey"] = entry.hotkey
    details.appendChild(createElement("summary", summaryProps, ToolbarIcons[entry.icon]))

    const dropdown = createElement("lexxy-link-dropdown", {
      className: "lexxy-editor__toolbar-dropdown-content"
    })

    const form = createElement("form", { method: "dialog" })
    form.appendChild(createElement("input", {
      type: "url",
      placeholder: "Enter a URL\u2026",
      className: "input"
    }))

    const actions = createElement("div", { className: "lexxy-editor__toolbar-dropdown-actions" })
    actions.appendChild(createElement("button", {
      type: "submit",
      className: "lexxy-editor__toolbar-button",
      value: "link"
    }, "Link"))
    actions.appendChild(createElement("button", {
      type: "button",
      className: "lexxy-editor__toolbar-button",
      value: "unlink"
    }, "Unlink"))

    form.appendChild(actions)
    dropdown.appendChild(form)
    details.appendChild(dropdown)
    return details
  }

  connectedCallback() {
    super.connectedCallback()
    this.input = this.querySelector("input")

    this.#registerHandlers()
  }

  #registerHandlers() {
    this.container.addEventListener("toggle", this.#handleToggle.bind(this))
    this.addEventListener("submit", this.#handleSubmit.bind(this))
    this.querySelector("[value='unlink']").addEventListener("click", this.#handleUnlink.bind(this))
  }

  #handleToggle({ newState }) {
    this.input.value = this.#selectedLinkUrl
    this.input.required = newState === "open"
  }

  #handleSubmit(event) {
    const command = event.submitter?.value
    this.editor.dispatchCommand(command, this.input.value)
    this.close()
  }

  #handleUnlink() {
    this.editor.dispatchCommand("unlink")
    this.close()
  }

  get #selectedLinkUrl() {
    let url = ""

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      let node = selection.getNodes()[0]
      while (node && node.getParent()) {
        if ($isLinkNode(node)) {
          url = node.getURL()
          break
        }
        node = node.getParent()
      }
    })

    return url
  }
}

export default LinkDropdown
