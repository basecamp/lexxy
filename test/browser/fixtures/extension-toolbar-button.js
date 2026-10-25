import { configure, Extension } from "lexxy"

class ToolbarButtonExtension extends Extension {
  initializeToolbar(toolbar) {
    const pushRight = toolbar.querySelector(".lexxy-editor__toolbar-button--push-right")
    const button = document.createElement("button")
    button.type = "button"
    button.name = "custom-extension-button"
    button.className = "lexxy-editor__toolbar-button"
    button.textContent = "Custom"
    pushRight.insertAdjacentElement("beforebegin", button)
  }
}

configure({ global: { extensions: [ToolbarButtonExtension] } })
