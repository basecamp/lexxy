import { $addUpdateTag, $getNodeByKey, $getRoot, BLUR_COMMAND, CLEAR_HISTORY_COMMAND, COMMAND_PRIORITY_NORMAL, DecoratorNode, FOCUS_COMMAND, KEY_ENTER_COMMAND, SKIP_DOM_SELECTION_TAG, createEditor } from "lexical"
import { ListItemNode, ListNode, registerList } from "@lexical/list"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { HeadingNode, QuoteNode, registerRichText } from "@lexical/rich-text"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { CodeHighlightNode, CodeNode, registerCodeHighlighting, } from "@lexical/code"
import { TRANSFORMERS, registerMarkdownShortcuts } from "@lexical/markdown"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"

import theme from "../config/theme"
import { ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"
import { CommandDispatcher } from "../editor/command_dispatcher"
import Selection from "../editor/selection"
import { createElement, dispatch, generateDomId, parseHtml, sanitize } from "../helpers/html_helper"
import LexicalToolbar from "./toolbar"
import Contents from "../editor/contents"
import Clipboard from "../editor/clipboard"
import Highlighter from "../editor/highlighter"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { HighlightNode } from "../nodes/highlight_node"
import { TrixTextNode } from "../nodes/trix_text_node"

export default class LexicalEditorElement extends HTMLElement {
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
    this.editor = this.#createEditor()
    this.contents = new Contents(this)
    this.selection = new Selection(this)
    this.clipboard = new Clipboard(this)
    this.highlighter = new Highlighter(this)

    CommandDispatcher.configureFor(this)
    this.#initialize()

    requestAnimationFrame(() => dispatch(this, "lexxy:initialize"))
    this.toggleAttribute("connected", true)

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

  get isSingleLineMode() {
    return this.hasAttribute("single-line")
  }

  get supportsAttachments() {
    return this.getAttribute("attachments") !== "false"
  }

  get contentTabIndex() {
    return parseInt(this.editorContentElement?.getAttribute("tabindex") ?? "0")
  }

  focus() {
    this.editor.focus()
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
      if (html !== "") root.append(...this.#parseHtmlIntoLexicalNodes(html))
      root.select()

      this.#toggleEmptyStatus()

      // The first time you set the value, when the editor is empty, it seems to leave Lexical
      // in an inconsistent state until, at least, you focus. You can type but adding attachments
      // fails because no root node detected. This is a workaround to deal with the issue.
      requestAnimationFrame(() => this.editor?.update(() => { }))
    })
  }

  toString() {
    if (!this.cachedStringValue) {
      this.editor?.getEditorState().read(() => {
        this.cachedStringValue = $getRoot().getTextContent()
      })
    }

    return this.cachedStringValue
  }

  #parseHtmlIntoLexicalNodes(html) {
    if (!html) html = "<p></p>"
    const nodes = $generateNodesFromDOM(this.editor, parseHtml(`<div>${html}</div>`))
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
    this.#listenForInvalidatedNodes()
    this.#handleEnter()
    this.#handleFocus()
    this.#attachDebugHooks()
    this.#attachToolbar()
    this.#loadInitialValue()
    this.#resetBeforeTurboCaches()
  }

  #createEditor() {
    this.editorContentElement = this.editorContentElement || this.#createEditorContentElement()

    const editor = createEditor({
      namespace: "LexicalEditor",
      onError(error) {
        throw error
      },
      theme: theme,
      nodes: this.#lexicalNodes
    })

    editor.setRootElement(this.editorContentElement)

    return editor
  }

  get #lexicalNodes() {
    const nodes = [
      TrixTextNode,
      HighlightNode,
      QuoteNode,
      HeadingNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
      HorizontalDividerNode,

      CustomActionTextAttachmentNode,
    ]

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
    registerRichText(this.editor)
    this.historyState = createEmptyHistoryState()
    registerHistory(this.editor, this.historyState, 20)
    registerList(this.editor)
    this.#registerCodeHiglightingComponents()
    registerMarkdownShortcuts(this.editor, TRANSFORMERS)
  }

  #registerCodeHiglightingComponents() {
    registerCodeHighlighting(this.editor)
    this.append(createElement("lexxy-code-language-picker"))
  }

  #listenForInvalidatedNodes() {
    this.editor.getRootElement().addEventListener("lexxy:internal:invalidate-node", (event) => {
      const { key, values } = event.detail

      this.editor.update(() => {
        const node = $getNodeByKey(key)

        if (node instanceof ActionTextAttachmentNode) {
          const updatedNode = node.getWritable()
          Object.assign(updatedNode, values)
        }
      })
    })
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
        if (this.isSingleLineMode) {
          event.preventDefault()
          return true
        }

        return false
      },
      COMMAND_PRIORITY_NORMAL
    )
  }

  #handleFocus() {
    // Lexxy handles focus and blur as commands
    // see https://github.com/facebook/lexical/blob/d1a8e84fe9063a4f817655b346b6ff373aa107f0/packages/lexical/src/LexicalEvents.ts#L35
    // and https://stackoverflow.com/a/72212077
    this.editor.registerCommand(BLUR_COMMAND, () => { dispatch(this, "lexxy:blur") }, COMMAND_PRIORITY_NORMAL)
    this.editor.registerCommand(FOCUS_COMMAND, () => { dispatch(this, "lexxy:focus") }, COMMAND_PRIORITY_NORMAL)
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
    const toolbarId = this.getAttribute("toolbar")
    return toolbarId ? document.getElementById(toolbarId) : this.#createDefaultToolbar()
  }

  get #hasToolbar() {
    return this.getAttribute("toolbar") !== "false"
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

    this.selection = null

    document.removeEventListener("turbo:before-cache", this.#handleTurboBeforeCache)
  }

  #reconnect() {
    this.disconnectedCallback()
    this.valueBeforeDisconnect = null
    this.connectedCallback()
  }
}

customElements.define("lexxy-editor", LexicalEditorElement)
