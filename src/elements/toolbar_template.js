import ToolbarIcons from "./toolbar_icons"
import { createElement, generateDomId } from "../helpers/html_helper"

const SEPARATOR = "|"
const SPACER = "~"

const BUTTONS = {
  "image": { command: "uploadImage", icon: "image", title: "Add images and video", preventOverflow: true },
  "file": { command: "uploadFile", icon: "attachment", title: "Upload files" },
  "bold": { command: "bold", icon: "bold", title: "Bold" },
  "italic": { command: "italic", icon: "italic", title: "Italic" },
  "strikethrough": { command: "strikethrough", icon: "strikethrough", title: "Strikethrough" },
  "underline": { command: "underline", icon: "underline", title: "Underline" },
  "clear-formatting": { command: "clearFormatting", icon: "clearFormatting", title: "Clear formatting" },
  "quote": { command: "insertQuoteBlock", icon: "quote", title: "Quote" },
  "code": { command: "insertCodeBlock", icon: "code", title: "Code" },
  "unordered-list": { command: "insertUnorderedList", icon: "ul", title: "Bullet list" },
  "ordered-list": { command: "insertOrderedList", icon: "ol", title: "Numbered list" },
  "table": { command: "insertTable", icon: "table", title: "Insert a table" },
  "divider": { command: "insertHorizontalDivider", icon: "hr", title: "Insert a divider" },
  "undo": { command: "undo", icon: "undo", title: "Undo", disabled: true },
  "redo": { command: "redo", icon: "redo", title: "Redo", disabled: true }
}

const MENU_ITEMS = {
  "paragraph": { command: "setFormatParagraph", icon: "paragraph", title: "Paragraph", label: "Normal", role: "menuitemradio" }
}

const DROPDOWNS = {
  "highlight": highlightDropdown,
  "link": linkDropdown
}

// Builds the default toolbar's contents from the `toolbar.items` configuration: button names, dropdown groups
// ({ name, icon, label, items }), "|" to end a group of items, and "~" to push the following items to the end.
export function buildToolbarTemplate(items) {
  const fragment = document.createDocumentFragment()
  let pushNextItemRight = false

  for (const item of items) {
    if (item === SEPARATOR) {
      endGroup(fragment.lastElementChild)
    } else if (item === SPACER) {
      pushNextItemRight = true
    } else {
      const element = toolbarItem(item)
      if (pushNextItemRight) element.classList.add("lexxy-editor__toolbar-button--push-right")
      pushNextItemRight = false
      fragment.append(element)
    }
  }

  fragment.append(overflowDropdown())
  return fragment
}

function endGroup(element) {
  const button = element?.querySelector(":scope > [data-dropdown-trigger]") ?? element
  button?.classList.add("lexxy-editor__toolbar-group-end")
}

function toolbarItem(item) {
  if (typeof item === "object") {
    return groupDropdown(item)
  } else if (item in DROPDOWNS) {
    return DROPDOWNS[item]()
  } else if (item in BUTTONS) {
    return toolbarButton(item, BUTTONS[item])
  } else {
    throw new Error(`Unknown toolbar item "${item}". Use a button name, "|", "~", or a dropdown group object.`)
  }
}

function toolbarButton(name, { command, icon, title, preventOverflow, disabled }) {
  return createElement("button", {
    className: "lexxy-editor__toolbar-button",
    type: "button",
    name,
    title,
    "data-command": command,
    "data-prevent-overflow": preventOverflow,
    "aria-disabled": disabled
  }, ToolbarIcons[icon])
}

function groupDropdown({ name, icon, label, items }) {
  const dropdown = createElement("lexxy-toolbar-dropdown", { className: "lexxy-editor__toolbar-dropdown", "data-toolbar-group": "" })
  const panel = createElement("div", { "data-dropdown-panel": "", role: "menu", "aria-label": label, className: "lexxy-editor__toolbar-dropdown-list", hidden: true })

  for (const item of items) {
    panel.append(menuItem(item))
  }

  dropdown.append(dropdownTrigger({ name, icon, title: label, popup: "menu", chevron: true }), panel)
  return dropdown
}

function menuItem(item) {
  if (item === SEPARATOR) {
    return createElement("div", { className: "lexxy-editor__toolbar-separator", role: "separator" })
  } else if (item === "headings") {
    const headings = createElement("lexxy-heading-dropdown")
    headings.append(createElement("div", { className: "lexxy-heading-options" }))
    return headings
  } else if (item in MENU_ITEMS || item in BUTTONS) {
    return menuButton(item, MENU_ITEMS[item] ?? BUTTONS[item])
  } else {
    throw new Error(`Toolbar item "${item}" can't go in a dropdown group. Use a button name, "headings", or "|".`)
  }
}

function menuButton(name, { command, icon, title, label = title, role = "menuitem", disabled }) {
  const button = createElement("button", { type: "button", name, title, role, "data-command": command, "aria-disabled": disabled }, ToolbarIcons[icon])
  button.append(" ", createElement("span", { textContent: label }))
  return button
}

function dropdownTrigger({ name, icon, title, popup, chevron = false, hotkey }) {
  const className = chevron ? "lexxy-editor__toolbar-button lexxy-editor__toolbar-button--chevron" : "lexxy-editor__toolbar-button"

  const trigger = createElement("button", {
    "data-dropdown-trigger": "",
    className,
    type: "button",
    title,
    "data-hotkey": hotkey,
    "aria-haspopup": popup,
    "aria-expanded": "false"
  }, ToolbarIcons[icon])

  if (name) trigger.name = name
  return trigger
}

function highlightDropdown() {
  const dropdown = createElement("lexxy-highlight-dropdown", { className: "lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-dropdown--highlight" })
  const panel = createElement("div", { "data-dropdown-panel": "", role: "menu", "aria-label": "Color highlight", hidden: true }, `
    <div class="lexxy-highlight-colors"></div>
    <button data-command="removeHighlight" type="button" class="lexxy-editor__toolbar-button lexxy-editor__toolbar-dropdown-reset" role="menuitem">Remove all coloring</button>
  `)

  dropdown.append(dropdownTrigger({ name: "highlight", icon: "highlight", title: "Color highlight", popup: "menu", chevron: true }), panel)
  return dropdown
}

function linkDropdown() {
  const dropdown = createElement("lexxy-link-dropdown", { className: "lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-dropdown--link" })
  const panel = createElement("div", { "data-dropdown-panel": "", role: "dialog", "aria-label": "Link", hidden: true }, `
    <input type="text" inputmode="url" autocapitalize="off" spellcheck="false" pattern="[a-zA-Z][a-zA-Z0-9+.\\-]*:.+|[\\/#].*" title="A full URL, or a path such as /about" placeholder="Enter a URL…" class="input" id="${generateDomId("lexxy-link-url")}">
    <div class="lexxy-editor__toolbar-dropdown-actions">
      <button type="button" class="lexxy-editor__toolbar-button" value="link">Link</button>
      <button type="button" class="lexxy-editor__toolbar-button" value="unlink">Unlink</button>
    </div>
  `)

  dropdown.append(dropdownTrigger({ name: "link", icon: "link", title: "Link", popup: "dialog", hotkey: "cmd+k ctrl+k" }), panel)
  return dropdown
}

function overflowDropdown() {
  const dropdown = createElement("lexxy-toolbar-dropdown", { className: "lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-button--push-right lexxy-editor__toolbar-overflow" })
  const panel = createElement("div", { "data-dropdown-panel": "", role: "menu", className: "lexxy-editor__toolbar-overflow-menu", "aria-label": "More options", hidden: true })

  dropdown.append(dropdownTrigger({ icon: "overflow", title: "More options", popup: "menu" }), panel)
  return dropdown
}
