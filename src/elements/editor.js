import { $addUpdateTag, $createParagraphNode, $getNodeByKey, $getRoot, $getSelection, $isRangeSelection, CLEAR_HISTORY_COMMAND, COMMAND_PRIORITY_NORMAL, DecoratorNode, KEY_ENTER_COMMAND, SKIP_DOM_SELECTION_TAG } from "lexical"
import { buildEditorFromExtensions } from "@lexical/extension"
import { ListItemNode, ListNode, registerList } from "@lexical/list"
import { $isLinkNode, AutoLinkNode, LinkNode } from "@lexical/link"
import { registerPlainText } from "@lexical/plain-text"
import { $isHeadingNode, $isQuoteNode, HeadingNode, QuoteNode, registerRichText } from "@lexical/rich-text"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { $isCodeNode, CodeHighlightNode, CodeNode, registerCodeHighlighting, } from "@lexical/code"
import { TRANSFORMERS, registerMarkdownShortcuts } from "@lexical/markdown"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import { $findTableNode, $getTableCellNodeFromLexicalNode } from "@lexical/table"
import { getListType } from "../helpers/lexical_helper"
import { isSelectionHighlighted, getHighlightStyles } from "../helpers/format_helper"

import theme from "../config/theme"
import { ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"
import { CommandDispatcher } from "../editor/command_dispatcher"
import Selection from "../editor/selection"
import { createElement, dispatch, generateDomId, parseHtml } from "../helpers/html_helper"
import { sanitize } from "../helpers/sanitization_helper"
import LexicalToolbar from "./toolbar"
import Configuration from "../editor/configuration"
import Contents from "../editor/contents"
import Clipboard from "../editor/clipboard"
import Extensions from "../editor/extensions"
import Highlighter from "../editor/highlighter"

import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { TrixContentExtension } from "../extensions/trix_content_extension"

import { TablesLexicalExtension } from "../extensions/tables_lexical_extension"

export class LexicalEditorElement extends HTMLElement {
  static formAssociated = true
  static debug = false
  static commands = [ "bold", "italic", "strikethrough" ]

  static observedAttributes = [ "connected", "required" ]

  #initialValue = ""
  #validationTextArea = document.createElement("textarea")

  constructor() {
    super()
    this.internals = this.attachInternals()
    this.internals.role = "presentation"
  }

  connectedCallback() {
    this.id ??= generateDomId("lexxy-editor")
    this.config = new Configuration(this)
    this.extensions = new Extensions(this)
    this.highlighter = new Highlighter(this)

    this.editor = this.#createEditor()

    this.contents = new Contents(this)
    this.selection = new Selection(this)
    this.clipboard = new Clipboard(this)

    CommandDispatcher.configureFor(this)
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
    if (!this.cachedStringValue) {
      this.editor?.getEditorState().read(() => {
        this.cachedStringValue = $getRoot().getTextContent()
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

    this.toolbar = this.toolbar || this.#findOrCreateDefaultToolbar()
    return this.toolbar
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

  // Selection preservation for native bridge dialogs
  freezeSelection() {
    this.frozenSelectionState = null
    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      // If cursor is inside a link, expand to cover the full link text
      if (selection.isCollapsed()) {
        let node = selection.anchor.getNode()
        while (node) {
          if ($isLinkNode(node)) {
            const firstDescendant = node.getFirstDescendant()
            const lastDescendant = node.getLastDescendant()
            if (firstDescendant && lastDescendant) {
              this.frozenSelectionState = {
                anchor: { key: firstDescendant.getKey(), offset: 0 },
                focus: { key: lastDescendant.getKey(), offset: lastDescendant.getTextContent().length }
              }
              return
            }
            break
          }
          node = node.getParent()
        }
      }

      this.frozenSelectionState = {
        anchor: { key: selection.anchor.key, offset: selection.anchor.offset },
        focus: { key: selection.focus.key, offset: selection.focus.offset }
      }
    })
  }

  thawSelection() {
    const frozenSelectionState = this.frozenSelectionState
    this.frozenSelectionState = null
    if (!frozenSelectionState) return

    let shouldRestore = false
    this.editor.getEditorState().read(() => {
      const anchorNode = $getNodeByKey(frozenSelectionState.anchor.key)
      const focusNode = $getNodeByKey(frozenSelectionState.focus.key)

      // Skip if nodes were removed or content was truncated (e.g., text node
      // split by link creation) — restoring would leave Lexical in a broken state.
      if (!anchorNode?.isAttached() || !focusNode?.isAttached()) return
      if (frozenSelectionState.anchor.offset > anchorNode.getTextContentSize()) return
      if (frozenSelectionState.focus.offset > focusNode.getTextContentSize()) return

      // Skip if the selection hasn't actually changed — an unnecessary
      // editor.update() triggers DOM reconciliation that can disrupt Android
      // WebView's input connection.
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        shouldRestore =
          selection.anchor.key !== frozenSelectionState.anchor.key ||
          selection.anchor.offset !== frozenSelectionState.anchor.offset ||
          selection.focus.key !== frozenSelectionState.focus.key ||
          selection.focus.offset !== frozenSelectionState.focus.offset
      } else {
        shouldRestore = true
      }
    })

    if (shouldRestore) {
      this.editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          selection.anchor.set(frozenSelectionState.anchor.key, frozenSelectionState.anchor.offset, "text")
          selection.focus.set(frozenSelectionState.focus.key, frozenSelectionState.focus.offset, "text")
        }
      })
    }
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
    // Clearing/replacing content can invalidate any preserved selection keys.
    this.frozenSelectionState = null
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
    const nodes = $generateNodesFromDOM(this.editor, parseHtml(`<div>${html}</div>`))

    if (nodes.length === 0) {
      return [ $createParagraphNode() ]
    }

    // Custom decorator block elements such action-text-attachments get wrapped into <p> automatically by Lexical.
    // We flatten those.
    return nodes.map(node => {
      if (node.getType() === "paragraph" && node.getChildrenSize() === 1) {
        const child = node.getFirstChild()
        if (child instanceof DecoratorNode && !child.isInline()) {
          return child
        }
      }
      return node
    })
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

    const editor = buildEditorFromExtensions({
      name: "lexxy/core",
      namespace: "Lexxy",
      theme: theme,
      nodes: this.#lexicalNodes
    },
      ...this.#lexicalExtensions
    )

    editor.setRootElement(this.editorContentElement)

    return editor
  }

  get #lexicalExtensions() {
    const extensions = []
    const richTextExtensions = [
      this.highlighter.lexicalExtension,
      TrixContentExtension,
      TablesLexicalExtension
    ]

    if (this.supportsRichText) {
      extensions.push(...richTextExtensions)
    }

    extensions.push(...this.extensions.lexicalExtensions)

    return extensions
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

    if (this.supportsAttachments) {
      nodes.push(ActionTextAttachmentNode, ActionTextAttachmentUploadNode)
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
    this.appendChild(editorContentElement)

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
      this.#dispatchAttributesChange()
    }))
  }

  #dispatchAttributesChange() {
    let attributes = null
    let table = null
    let link = null
    let highlight = null

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const anchorNode = selection.anchor.getNode()
      if (!anchorNode.getParent()) return

      // Get link info
      let inLink = false
      let linkHref = null
      let node = anchorNode
      while (node) {
        if ($isLinkNode(node)) {
          inLink = true
          linkHref = node.getURL()
          break
        }
        node = node.getParent()
      }

      // Get block-level info
      const topLevelElement = anchorNode.getTopLevelElementOrThrow()
      const inQuote = $isQuoteNode(topLevelElement)
      const inHeading = $isHeadingNode(topLevelElement)

      // Get list type
      const listType = getListType(anchorNode)

      // Get table info
      const tableCellNode = $getTableCellNodeFromLexicalNode(anchorNode)
      const tableNode = tableCellNode ? $findTableNode(tableCellNode) : null
      const inTable = tableNode !== null
      const tableRows = tableNode?.getChildrenSize() ?? null
      const tableColumns = tableNode?.getFirstChild()?.getChildrenSize() ?? null

      // Only include truthy attributes - false/undefined values mean "enabled but not active"
      // iOS interprets false as "disabled", so we must omit inactive attributes
      attributes = {}
      if (selection.hasFormat("bold")) attributes.bold = true
      if (selection.hasFormat("italic")) attributes.italic = true
      if (selection.hasFormat("strikethrough")) attributes.strikethrough = true
      const inCode = $isCodeNode(topLevelElement) || selection.hasFormat("code")
      if (inCode) attributes.code = true
      if (isSelectionHighlighted(selection)) {
        attributes.highlight = true
        highlight = getHighlightStyles(selection)
      }
      if (inLink) attributes.link = true
      if (inQuote) attributes.quote = true
      if (inHeading) attributes.heading = true
      if (listType === "bullet") attributes["unordered-list"] = true
      if (listType === "number") attributes["ordered-list"] = true
      if (inTable) attributes.table = true

      table = inTable ? { rows: tableRows, columns: tableColumns } : null
      link = inLink && linkHref ? { href: linkHref } : null
    })

    if (attributes) {
      dispatch(this, "lexxy:attributes-change", { attributes, table, link, highlight })
    }
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
    if (this.supportsRichText) {
      registerRichText(this.editor)
      registerList(this.editor)
      this.#registerTableComponents()
      this.#registerCodeHiglightingComponents()
      if (this.supportsMarkdown) {
        registerMarkdownShortcuts(this.editor, TRANSFORMERS)
      }
    } else {
      registerPlainText(this.editor)
    }
    this.historyState = createEmptyHistoryState()
    registerHistory(this.editor, this.historyState, 20)
  }

  #registerTableComponents() {
    this.tableTools = createElement("lexxy-table-tools")
    this.append(this.tableTools)
  }

  #registerCodeHiglightingComponents() {
    registerCodeHighlighting(this.editor)
    this.codeLanguagePicker = createElement("lexxy-code-language-picker")
    this.append(this.codeLanguagePicker)
  }

  #handleEnter() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.editor.registerCommand(
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
    )
  }

  #registerFocusEvents() {
    this.addEventListener("focusin", this.#handleFocusIn)
    this.addEventListener("focusout", this.#handleFocusOut)
  }

  #handleFocusIn(event) {
    if (this.#elementInEditorOrToolbar(event.target) && !this.currentlyFocused) {
      this.#dispatchAttributesChange()
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
    }
  }

  #findOrCreateDefaultToolbar() {
    const toolbarId = this.config.get("toolbar")
    if (toolbarId && toolbarId !== true) {
      return document.getElementById(toolbarId)
    } else {
      return this.#createDefaultToolbar()
    }
  }

  get #hasToolbar() {
    return this.supportsRichText && this.config.get("toolbar")
  }

  #createDefaultToolbar() {
    const toolbar = createElement("lexxy-toolbar")
    toolbar.innerHTML = LexicalToolbar.defaultTemplate
    toolbar.setAttribute("data-attachments", this.supportsAttachments) // Drives toolbar CSS styles
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
    this.#unregisterHandlers()
    this.frozenSelectionState = null

    if (this.editorContentElement) {
      this.editorContentElement.remove()
      this.editorContentElement = null
    }

    this.contents = null
    this.editor = null

    if (this.toolbar) {
      if (!this.getAttribute("toolbar")) { this.toolbar.remove() }
      this.toolbar = null
    }

    if (this.codeLanguagePicker) {
      this.codeLanguagePicker.remove()
      this.codeLanguagePicker = null
    }

    if (this.tableHandler) {
      this.tableHandler.remove()
      this.tableHandler = null
    }

    this.selection = null

    document.removeEventListener("turbo:before-cache", this.#handleTurboBeforeCache)
  }

  #reconnect() {
    this.disconnectedCallback()
    this.valueBeforeDisconnect = null
    this.connectedCallback()
  }
}

export default LexicalEditorElement
