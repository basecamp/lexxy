import Toolbar from "./toolbar"
import ToolbarDropdown from "./toolbar_dropdown"

import Editor from "./editor"
import Prompt from "./prompt"
import CodeLanguagePicker from "./code_language_picker"
import NodeDeleteButton from "./node_delete_button"
import TableTools from "./table/table_tools"

export function defineElements() {
  const elements = {
    "lexxy-toolbar": Toolbar,
    "lexxy-toolbar-dropdown": ToolbarDropdown,
    "lexxy-editor": Editor,
    "lexxy-prompt": Prompt,
    "lexxy-code-language-picker": CodeLanguagePicker,
    "lexxy-node-delete-button": NodeDeleteButton,
    "lexxy-table-tools": TableTools,
  }

  Object.entries(elements).forEach(([ name, element ]) => {
    customElements.define(name, element)
  })
}
