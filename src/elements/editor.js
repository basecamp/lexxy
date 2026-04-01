import { $addUpdateTag, $createParagraphNode, $getRoot, $isElementNode, $isLineBreakNode, $isTextNode, CLEAR_HISTORY_COMMAND, COMMAND_PRIORITY_NORMAL, KEY_ENTER_COMMAND, SKIP_DOM_SELECTION_TAG, TextNode, mergeRegister } from "lexical"
import { buildEditorFromExtensions } from "@lexical/extension"
import { ListItemNode, ListNode, registerList } from "@lexical/list"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { registerPlainText } from "@lexical/plain-text"
import { HeadingNode, QuoteNode, registerRichText } from "@lexical/rich-text"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { CodeHighlightNode, CodeNode, registerCodeHighlighting } from "@lexical/code"
import { TRANSFORMERS, registerMarkdownShortcuts } from "@lexical/markdown"
import { registerMarkdownLeadingTagHandler } from "../editor/markdown/leading_tag_handler"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"

import theme from "../config/theme"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"
import { CommandDispatcher } from "../editor/command_dispatcher"
import Selection from "../editor/selection"
import { createElement, dispatch, generateDomId, parseHtml } from "../helpers/html_helper"
import { isAttachmentSpacerTextNode } from "../helpers/lexical_helper"
import { sanitize } from "../helpers/sanitization_helper"
import LexicalToolbar from "./toolbar"
import Configuration from "../editor/configuration"
import Contents from "../editor/contents"
import Clipboard from "../editor/clipboard"
import Extensions from "../editor/extensions"

import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { exportTextNodeDOM } from "../helpers/text_node_export_helper"
import { ProvisionalParagraphExtension } from "../extensions/provisional_paragraph_extension"
import { HighlightExtension } from "../extensions/highlight_extension"
import { TrixContentExtension } from "../extensions/trix_content_extension"
import { TablesExtension } from "../extensions/tables_extension"
import { AttachmentsExtension } from "../extensions/attachments_extension.js"
import { FormatEscapeExtension } from "../extensions/format_escape_extension.js"


export class LexicalEditorElement extends HTMLElement {
  static formAssociated = true
  static debug = false
  static commands = [ "bold", "italic", "strikethrough" ]

  static observedAttributes = [ "connected", "required" ]

  #initialValue = ""
  #validationTextArea = document.createElement("textarea")
  #disposables = []

  constructor() {
    super()
    this.internals = this.attachInternals()
    this.internals.role = "presentation"
  }

  connectedCallback() {
    this.id ||= generateDomId("lexxy-editor")
    this.config = new Configuration(this)
    this.extensions = new Extensions(this)

    this.editor = this.#createEditor()
    this.#disposables.push(this.editor)

    this.contents = new Contents(this)
    this.#disposables.push(this.contents)

    this.selection = new Selection(this)
    this.#disposables.push(this.selection)

    this.clipboard = new Clipboard(this)

    const commandDispatcher = CommandDispatcher.configureFor(this)
    this.#disposables.push(commandDispatcher)

    this.#initialize()

    requestAnimationFrame(() => dispatch(this, "lexxy:initialize"))
    this.toggleAttribute("connected", true)

    this.#handleAutofocus()

    this.valueBeforeDisconnect = null
  }

  disconnectedCallback() {
    this.valueBeforeDisconnect = this.value
    this.#reset() // Prevent hangs with Safari when morphing
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect())
    }

    if (name === "required" && this.isConnected) {
      this.#validationTextArea.required = this.hasAttribute("required")
      this.#setValidity()
    }
  }

  formResetCallback() {
    this.value = this.#initialValue
    this.editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
  }

  toString() {
    if (this.cachedStringValue == null) {
      this.editor?.getEditorState().read(() => {
        this.cachedStringValue = $getReadableTextContent($getRoot())
      })
    }

    return this.cachedStringValue
  }

  get form() {
    return this.internals.form
  }

  get name() {
    return this.getAttribute("name")
  }

  get toolbarElement() {
    if (!this.#hasToolbar) return null

    this.toolbar ??= this.#findOrCreateDefaultToolbar()
    return this.toolbar
  }

  get baseExtensions() {
    return [
      ProvisionalParagraphExtension,
      HighlightExtension,
      TrixContentExtension,
      TablesExtension,
      AttachmentsExtension,
      FormatEscapeExtension
    ]
  }

  get directUploadUrl() {
    return this.dataset.directUploadUrl
  }

  get blobUrlTemplate() {
    return this.dataset.blobUrlTemplate
  }

  get isEmpty() {
    return [ "<p><br></p>", "<p></p>", "" ].includes(this.value.trim())
  }

  get isBlank() {
    return this.isEmpty || this.toString().match(/^\s*$/g) !== null
  }

  get hasOpenPrompt() {
    return this.querySelector(".lexxy-prompt-menu.lexxy-prompt-menu--visible") !== null
  }

  get preset() {
    return this.getAttribute("preset") || "default"
  }

  get supportsAttachments() {
    return this.config.get("attachments")
  }

  get supportsMarkdown() {
    return this.supportsRichText && this.config.get("markdown")
  }

  get supportsMultiLine() {
    return this.config.get("multiLine") && !this.isSingleLineMode
  }

  get supportsRichText() {
    return this.config.get("richText")
  }

  // TODO: Deprecate `single-line` attribute
  get isSingleLineMode() {
    return this.hasAttribute("single-line")
  }

  get contentTabIndex() {
    return parseInt(this.editorContentElement?.getAttribute("tabindex") ?? "0")
  }

  focus() {
    this.editor.focus(() => this.#onFocus())
  }

  get value() {
    if (!this.cachedValue) {
      this.editor?.getEditorState().read(() => {
        this.cachedValue = sanitize($generateHtmlFromNodes(this.editor, null))
      })
    }

    return this.cachedValue
  }

  set value(html) {
    this.editor.update(() => {
      $addUpdateTag(SKIP_DOM_SELECTION_TAG)
      const root = $getRoot()
      root.clear()
      root.append(...this.#parseHtmlIntoLexicalNodes(html))
      root.selectEnd()

      this.#toggleEmptyStatus()

      // The first time you set the value, when the editor is empty, it seems to leave Lexical
      // in an inconsistent state until, at least, you focus. You can type but adding attachments
      // fails because no root node detected. This is a workaround to deal with the issue.
      requestAnimationFrame(() => this.editor?.update(() => { }))
    })
  }

  #parseHtmlIntoLexicalNodes(html) {
    if (!html) html = "<p></p>"
    const nodes = $generateNodesFromDOM(this.editor, parseHtml(`${html}`))

    return nodes
      .filter(this.#isNotWhitespaceOnlyNode)
      .map(this.#wrapTextNode)
  }

  // Whitespace-only text nodes (e.g. "\n" between block elements like <div>) and stray line break
  // nodes are formatting artifacts from the HTML source. They can't be appended to the root node
  // and have no semantic meaning, so we strip them during import.
  #isNotWhitespaceOnlyNode(node) {
    if ($isLineBreakNode(node)) return false
    if ($isTextNode(node) && node.getTextContent().trim() === "") return false
    return true
  }

  // Raw string values produce TextNodes which cannot be appended directly to the RootNode.
  // We wrap those in <p>
  #wrapTextNode(node) {
    if (!$isTextNode(node)) return node

    const paragraph = $createParagraphNode()
    paragraph.append(node)
    return paragraph
  }

  #initialize() {
    this.#synchronizeWithChanges()
    this.#registerComponents()
    this.#handleEnter()
    this.#registerFocusEvents()
    this.#attachDebugHooks()
    this.#attachToolbar()
    this.#loadInitialValue()
    this.#resetBeforeTurboCaches()
  }

  #createEditor() {
    this.editorContentElement ||= this.#createEditorContentElement()
    this.appendChild(this.editorContentElement)

    const editor = buildEditorFromExtensions({
      name: "lexxy/core",
      namespace: "Lexxy",
      theme: theme,
      nodes: this.#lexicalNodes,
      html: {
        export: new Map([ [ TextNode, exportTextNodeDOM ] ])
      }
    },
      ...this.extensions.lexicalExtensions
    )

    editor.setRootElement(this.editorContentElement)

    return editor
  }

  get #lexicalNodes() {
    const nodes = [ CustomActionTextAttachmentNode ]

    if (this.supportsRichText) {
      nodes.push(
        QuoteNode,
        HeadingNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
        AutoLinkNode,
        HorizontalDividerNode
      )
    }

    return nodes
  }

  #createEditorContentElement() {
    const editorContentElement = createElement("div", {
      classList: "lexxy-editor__content",
      contenteditable: true,
      role: "textbox",
      "aria-multiline": true,
      "aria-label": this.#labelText,
      placeholder: this.getAttribute("placeholder")
    })
    editorContentElement.id = `${this.id}-content`
    this.#ariaAttributes.forEach(attribute => editorContentElement.setAttribute(attribute.name, attribute.value))

    if (this.getAttribute("tabindex")) {
      editorContentElement.setAttribute("tabindex", this.getAttribute("tabindex"))
      this.removeAttribute("tabindex")
    } else {
      editorContentElement.setAttribute("tabindex", 0)
    }

    return editorContentElement
  }

  get #labelText() {
    return Array.from(this.internals.labels).map(label => label.textContent).join(" ")
  }

  get #ariaAttributes() {
    return Array.from(this.attributes).filter(attribute => attribute.name.startsWith("aria-"))
  }

  set #internalFormValue(html) {
    const changed = this.#internalFormValue !== undefined && this.#internalFormValue !== this.value

    this.internals.setFormValue(html)
    this._internalFormValue = html
    this.#validationTextArea.value = this.isEmpty ? "" : html

    if (changed) {
      dispatch(this, "lexxy:change")
    }
  }

  get #internalFormValue() {
    return this._internalFormValue
  }

  #loadInitialValue() {
    const initialHtml = this.valueBeforeDisconnect || this.getAttribute("value") || "<p></p>"
    this.value = this.#initialValue = initialHtml
  }

  #resetBeforeTurboCaches() {
    document.addEventListener("turbo:before-cache", this.#handleTurboBeforeCache)
  }

  #handleTurboBeforeCache = (event) => {
    this.#reset()
  }

  #synchronizeWithChanges() {
    this.#addUnregisterHandler(this.editor.registerUpdateListener(({ editorState }) => {
      this.#clearCachedValues()
      this.#internalFormValue = this.value
      this.#toggleEmptyStatus()
      this.#setValidity()
    }))
  }

  #clearCachedValues() {
    this.cachedValue = null
    this.cachedStringValue = null
  }

  #addUnregisterHandler(handler) {
    this.unregisterHandlers = this.unregisterHandlers || []
    this.unregisterHandlers.push(handler)
  }

  #unregisterHandlers() {
    this.unregisterHandlers?.forEach((handler) => {
      handler()
    })
    this.unregisterHandlers = null
  }

  #registerComponents() {
    const registered = []

    if (this.supportsRichText) {
      registered.push(
        registerRichText(this.editor),
        registerList(this.editor)
      )
      this.#registerTableComponents()
      this.#registerCodeHiglightingComponents()
      if (this.supportsMarkdown) {
          registered.push(
            registerMarkdownShortcuts(this.editor, TRANSFORMERS),
            registerMarkdownLeadingTagHandler(this.editor, TRANSFORMERS)
        )
      }
    } else {
      registered.push(registerPlainText(this.editor))
    }
    this.historyState = createEmptyHistoryState()
    registered.push(registerHistory(this.editor, this.historyState, 20))

    this.#addUnregisterHandler(mergeRegister(...registered))
  }

  #registerTableComponents() {
    let tableTools = this.querySelector("lexxy-table-tools")
    tableTools ??= createElement("lexxy-table-tools")
    this.append(tableTools)
    this.#disposables.push(tableTools)
  }

  #registerCodeHiglightingComponents() {
    registerCodeHighlighting(this.editor)
    let codeLanguagePicker = this.querySelector("lexxy-code-language-picker")
    codeLanguagePicker ??= createElement("lexxy-code-language-picker")
    this.append(codeLanguagePicker)
    this.#disposables.push(codeLanguagePicker)
  }

  #handleEnter() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.#addUnregisterHandler(this.editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Prevent CTRL+ENTER
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          return true
        }

        // In single line mode, prevent ENTER
        if (!this.supportsMultiLine) {
          event.preventDefault()
          return true
        }

        return false
      },
      COMMAND_PRIORITY_NORMAL
    ))
  }

  #registerFocusEvents() {
    this.addEventListener("focusin", this.#handleFocusIn)
    this.addEventListener("focusout", this.#handleFocusOut)

    this.#addUnregisterHandler(() => {
      this.removeEventListener("focusin", this.#handleFocusIn)
      this.removeEventListener("focusout", this.#handleFocusOut)
    })
  }

  #handleFocusIn(event) {
    if (this.#elementInEditorOrToolbar(event.target) && !this.currentlyFocused) {
      dispatch(this, "lexxy:focus")
      this.currentlyFocused = true
    }
  }

  #handleFocusOut(event) {
    if (!this.#elementInEditorOrToolbar(event.relatedTarget)) {
      dispatch(this, "lexxy:blur")
      this.currentlyFocused = false
    }
  }

  #elementInEditorOrToolbar(element) {
    return this.contains(element) || this.toolbarElement?.contains(element)
  }

  #onFocus() {
    if (this.isEmpty) {
      this.selection.placeCursorAtTheEnd()
    }
  }

  #handleAutofocus() {
    if (!document.querySelector(":focus")) {
      if (this.hasAttribute("autofocus") && document.querySelector("[autofocus]") === this) {
        this.focus()
      }
    }
  }


  #attachDebugHooks() {
    if (!LexicalEditorElement.debug) return

    this.#addUnregisterHandler(this.editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        console.debug("HTML: ", this.value, "String:", this.toString())
        console.debug("empty", this.isEmpty, "blank", this.isBlank)
      })
    }))
  }

  #attachToolbar() {
    if (this.#hasToolbar) {
      this.toolbarElement.setEditor(this)
      if (typeof this.toolbarElement.dispose === "function") {
        this.#disposables.push(this.toolbarElement)
      }

      this.extensions.initializeToolbars()
    }
  }

  #findOrCreateDefaultToolbar() {
    const toolbarConfig = this.config.get("toolbar")
    if (typeof toolbarConfig === "string") {
      return document.getElementById(toolbarConfig)
    } else {
      return this.querySelector("lexxy-toolbar") ?? this.#createDefaultToolbar()
    }
  }

  get #hasToolbar() {
    return this.supportsRichText && !!this.config.get("toolbar")
  }

  #createDefaultToolbar() {
    const toolbar = createElement("lexxy-toolbar")
    toolbar.innerHTML = LexicalToolbar.defaultTemplate
    toolbar.setAttribute("data-attachments", this.supportsAttachments) // Drives toolbar CSS styles
    toolbar.configure(this.config.get("toolbar"))
    this.prepend(toolbar)
    return toolbar
  }

  #toggleEmptyStatus() {
    this.classList.toggle("lexxy-editor--empty", this.isEmpty)
  }

  #setValidity() {
    if (this.#validationTextArea.validity.valid) {
      this.internals.setValidity({})
    } else {
      this.internals.setValidity(this.#validationTextArea.validity, this.#validationTextArea.validationMessage, this.editorContentElement)
    }
  }

  #reset() {
    this.#dispose()
    this.editorContentElement?.remove()
    this.editorContentElement = null

    // Prevents issues with turbo morphing receiving an empty <lexxy-editor> which wipes
    // out the DOM for the tools, and the old toolbar reference will cause issues
    this.toolbar = null
  }

  #dispose() {
    this.#unregisterHandlers()
    document.removeEventListener("turbo:before-cache", this.#handleTurboBeforeCache)

    while (this.#disposables.length) {
      this.#disposables.pop().dispose()
    }
  }

  #reconnect() {
    this.disconnectedCallback()
    this.valueBeforeDisconnect = null
    this.connectedCallback()
  }
}

export default LexicalEditorElement

// Like $getRoot().getTextContent() but uses readable text for custom attachment nodes
// (e.g., mentions) instead of their single-character cursor placeholder.
function $getReadableTextContent(node) {
  if (node instanceof CustomActionTextAttachmentNode) {
    return node.getReadableTextContent()
  }

  if ($isElementNode(node)) {
    let text = ""
    const children = node.getChildren()
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const previousChild = children[i - 1]

      if (isAttachmentSpacerTextNode(child, previousChild, i, children.length)) continue

      text += $getReadableTextContent(child)
      if ($isElementNode(child) && i !== children.length - 1 && !child.isInline()) {
        text += "\n\n"
      }
    }
    return text
  }

  return node.getTextContent()
}
