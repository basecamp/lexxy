import { configure, Extension } from "lexxy"

class ToolbarButtonExtension extends Extension {
  initializeToolbar(toolbar) {
    const spacer = toolbar.querySelector(".lexxy-editor__toolbar-spacer")
    const button = document.createElement("button")
    button.type = "button"
    button.name = "custom-extension-button"
    button.className = "lexxy-editor__toolbar-button"
    button.textContent = "Custom"
    spacer.insertAdjacentElement("beforebegin", button)
  }
}

configure({ global: { extensions: [ToolbarButtonExtension] } })
