import Toolbar from "./toolbar"
import ToolbarDropdown from "./toolbar_dropdown"
import HighlightDropdown from "./dropdown/highlight"
import LinkDropdown from "./dropdown/link"
import Editor from "./editor"
import LiveRegion from "./live_region"
import Prompt from "./prompt"
import CodeLanguagePicker from "./code_language_picker"
import AttachmentToolbar from "./attachment_toolbar"
import TableTools from "./table/table_tools"

export function defineElements() {
  const elements = {
    // Toolbar must be registered BEFORE Editor
    "lexxy-toolbar": Toolbar,
    "lexxy-toolbar-dropdown": ToolbarDropdown,
    "lexxy-highlight-dropdown": HighlightDropdown,
    "lexxy-link-dropdown": LinkDropdown,

    "lexxy-editor": Editor,

    // Prompt must be registered AFTER Editor
    "lexxy-prompt": Prompt,
    "lexxy-code-language-picker": CodeLanguagePicker,
    "lexxy-live-region": LiveRegion,
    "lexxy-attachment-toolbar": AttachmentToolbar,
    "lexxy-table-tools": TableTools
  }

  Object.entries(elements).forEach(([ name, element ]) => {
    customElements.define(name, element)
  })
}
