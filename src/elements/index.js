import Toolbar from "./toolbar"

import Editor from "./editor"
import DropdownLink from "./dropdown/link"
import DropdownHighlight from "./dropdown/highlight"
import TableHandler from "./table_handler"
import Prompt from "./prompt"
import CodeLanguagePicker from "./code_language_picker"

export function start() {
  const elements = {
    "lexxy-toolbar": Toolbar,
    "lexxy-editor": Editor,
    "lexxy-link-dropdown": DropdownLink,
    "lexxy-highlight-dropdown": DropdownHighlight,
    "lexxy-table-handler": TableHandler,
    "lexxy-prompt": Prompt,
    "lexxy-code-language-picker": CodeLanguagePicker,
  }

  Object.entries(elements).forEach(([ name, element ]) => {
    if (!customElements.get(name)) {
      customElements.define(name, element)
    }
  })
}
