import { createEditor, $getRoot, $getNodeByKey, $addUpdateTag, SKIP_DOM_SELECTION_TAG, KEY_ENTER_COMMAND, COMMAND_PRIORITY_NORMAL, DecoratorNode, CLEAR_HISTORY_COMMAND } from "lexical"
import { ListNode, ListItemNode, registerList } from "@lexical/list"
import { LinkNode, AutoLinkNode } from "@lexical/link"
import { registerRichText, QuoteNode, HeadingNode } from "@lexical/rich-text"
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html"
import { CodeHighlightNode, CodeNode, registerCodeHighlighting, } from "@lexical/code"
import { TRANSFORMERS, registerMarkdownShortcuts } from "@lexical/markdown"
import { registerHistory, createEmptyHistoryState } from '@lexical/history'

import theme from "../config/theme"
import { ActionTextAttachmentNode } from "../nodes/action_text_attachment_node"
import { ActionTextAttachmentUploadNode } from "../nodes/action_text_attachment_upload_node"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"
import { CommandDispatcher } from "../editor/command_dispatcher"
import Selection from "../editor/selection"
import { containsVisuallyRelevantChildren, createElement, dispatch, generateDomId, parseHtml, sanitize } from "../helpers/html_helper"
import LexicalToolbar from "./toolbar"
import Contents from "../editor/contents"
import Clipboard from "../editor/clipboard"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import {MarkNode} from "@lexical/mark";
import { $createActionTextAttachmentMarkNode, ActionTextAttachmentMarkNode } from "../nodes/action_text_attachment_mark_node"

export default class LexicalEditorElement extends HTMLElement {
  static formAssociated = true
  static debug = true
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

  get isSingleLineMode() {
    return this.hasAttribute("single-line")
  }

  get supportsAttachments() {
    return this.getAttribute("attachments") !== "false"
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
      MarkNode,
      ActionTextAttachmentMarkNode,
      {
        replace: MarkNode,
        with: () => $createActionTextAttachmentMarkNode(),
        withKlass: ActionTextAttachmentMarkNode
      },
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
    this.#validationTextArea.value = this.#isEmpty ? "" : html

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
      this.cachedValue = null
      this.#internalFormValue = this.value
      this.#toggleEmptyStatus()
      this.#setValidity()
    }))
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

  #attachDebugHooks() {
    if (!LexicalEditorElement.debug) return

    this.#addUnregisterHandler(this.editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        console.debug("HTML: ", this.value)
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
    this.prepend(toolbar)
    return toolbar
  }

  #toggleEmptyStatus() {
    this.classList.toggle("lexxy-editor--empty", this.#isEmpty)
  }

  get #isEmpty() {
    return !this.editorContentElement.textContent.trim() && !containsVisuallyRelevantChildren(this.editorContentElement)
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
    this.connectedCallback()
  }
}

customElements.define("lexxy-editor", LexicalEditorElement)
