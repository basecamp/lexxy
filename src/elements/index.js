import Toolbar from "./toolbar"

import Editor from "./editor"
import DropdownLink from "./dropdown/link"
import DropdownHighlight from "./dropdown/highlight"
import DropdownHeading from "./dropdown/heading"
import Prompt from "./prompt"
import CodeLanguagePicker from "./code_language_picker"
import TableTools from "./table/table_tools"

export function defineElements() {
  const elements = {
    "lexxy-toolbar": Toolbar,
    "lexxy-editor": Editor,
    "lexxy-link-dropdown": DropdownLink,
    "lexxy-highlight-dropdown": DropdownHighlight,
    "lexxy-heading-dropdown": DropdownHeading,
    "lexxy-prompt": Prompt,
    "lexxy-code-language-picker": CodeLanguagePicker,
    "lexxy-table-tools": TableTools,
  }

  Object.entries(elements).forEach(([ name, element ]) => {
    customElements.define(name, element)
  })
}
