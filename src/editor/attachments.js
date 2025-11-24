import { COMMAND_PRIORITY_NORMAL, createCommand } from "lexical"
import { createElement } from "../helpers/html_helper"

export const UPLOAD_ATTACHMENTS_COMMAND = createCommand()

export function registerUploadCommand(editorElement) {
  editorElement.editor.registerCommand(
    UPLOAD_ATTACHMENTS_COMMAND,
    contents => {
      const input = createElement("input", {
        type: "file",
        multiple: true,
        style: "display: none;",
        onchange: ({ target }) => {
          const files = Array.from(target.files)
          if (!files.length) return

          for (const file of files) {
            editorElement.contents.uploadFile(file)
          }
        }
      })

      editorElement.appendChild(input) // Append and remove just for the sake of making it testable
      input.click()
      setTimeout(() => input.remove(), 1000)
      return true
    },
    COMMAND_PRIORITY_NORMAL)
}
