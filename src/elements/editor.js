import { createEditor, $getRoot, $createTextNode, $getNodeByKey, $addUpdateTag, SKIP_DOM_SELECTION_TAG, KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH } from "lexical"
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
import { CommandDispatcher } from "../editor/command_dispatcher"
import Selection from "../editor/selection"
import { containsVisuallyRelevantChildren, createElement, dispatch, generateDomId, parseHtml, sanitize } from "../helpers/html_helper"
import LexicalToolbar from "./toolbar"
import Contents from "../editor/contents";
import Clipboard from "../editor/clipboard";
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node";

export default class LexicalEditorElement extends HTMLElement {
  static formAssociated = true
  static debug = true
  static commands = [ "bold", "italic", "" ]

  static observedAttributes = [ "connected" ]

  constructor() {
    super()
    this.internals = this.attachInternals()
    this.internals.ariaRole = "textbox"
  }

  connectedCallback() {
    this.id ??= generateDomId("lexical-editor")
    this.editor = this.#createEditor()
    this.contents = new Contents(this)
    this.selection = new Selection(this.editor)
    this.clipboard = new Clipboard(this)

    CommandDispatcher.configureFor(this)
    this.#initialize()
    this.toggleAttribute("connected", true)
  }

  disconnectedCallback() {
    this.#reset() // Prevent hangs with Safari when morphing
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect())
    }
  }

  get form() {
    return this.internals.form
  }

  get toolbarElement() {
    this.toolbar = this.toolbar || this.#findOrCreateDefaultToolbar()
    return this.toolbar
  }

  get directUploadUrl() {
    return this.dataset.directUploadUrl
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
      const nodes = $generateNodesFromDOM(this.editor, parseHtml(`<div>${html}</div>`))
      root.append(...nodes)
      root.select()

      this.#toggleEmptyStatus()

      // The first time you set the value, when the editor is empty, it seems to leave Lexical
      // in an inconsistent state until, at least, you focus. You can type but adding attachments
      // fails because no root node detected. This is a workaround to deal with the issue.
      requestAnimationFrame(() => this.editor?.update(() => { }))
    })
  }

  #initialize() {
    this.#synchronizeWithChanges()
    this.#registerComponents()
    this.#listenForInvalidatedNodes()
    this.#preventCtrlEnter()
    this.#attachDebugHooks()
    this.#attachToolbar()
    this.#loadInitialValue()
  }

  #createEditor() {
    this.editorContentElement = this.editorContentElement || this.#createEditorContentElement()

    const editor = createEditor({
      namespace: "LexicalEditor",
      onError(error) {
        throw error
      },
      theme: theme,
      nodes: [
        QuoteNode,
        HeadingNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
        AutoLinkNode,

        CustomActionTextAttachmentNode,
        ActionTextAttachmentNode,
        ActionTextAttachmentUploadNode
      ]
    })

    editor.setRootElement(this.editorContentElement)

    return editor
  }

  #createEditorContentElement() {
    const editorContentElement = createElement("div", { classList: "lexical-editor__content", contenteditable: true, placeholder: this.getAttribute("placeholder") })
    editorContentElement.id = `${this.id}-content`
    this.appendChild(editorContentElement)

    if (this.getAttribute("tabindex")) {
      this.editorContentElement.setAttribute("tabindex", this.getAttribute("tabindex"))
      this.removeAttribute("tabindex")
    } else {
      editorContentElement.setAttribute("tabindex", 0)
    }

    return editorContentElement
  }

  set #internalFormValue(html) {
    const changed = this.#internalFormValue !== undefined && this.#internalFormValue !== this.value

    this.internals.setFormValue(html)
    this._internalFormValue = html

    if (changed) {
      dispatch(this, "actiontext:change")
    }
  }

  get #internalFormValue()  {
    return this._internalFormValue
  }

  #loadInitialValue() {
    const initialHtml = this.getAttribute("value") || "<p></p>"
    console.debug("INITIAL", initialHtml);
    this.value = initialHtml
  }

  #synchronizeWithChanges() {
    this.#addUnregisterHandler(this.editor.registerUpdateListener(({ editorState }) => {
      this.cachedValue = null
      this.#internalFormValue = this.value
      this.#toggleEmptyStatus()
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
    registerHistory(this.editor, createEmptyHistoryState(), 20)
    registerList(this.editor)
    registerCodeHighlighting(this.editor)
    registerMarkdownShortcuts(this.editor, TRANSFORMERS)
  }

  #listenForInvalidatedNodes() {
    this.editor.getRootElement().addEventListener("lexical:node-invalidated", (event) => {
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

  #preventCtrlEnter() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          return true
        }

        return false
      },
      COMMAND_PRIORITY_HIGH
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
    this.toolbarElement.setEditor(this)
  }

  #findOrCreateDefaultToolbar() {
    const toolbarId = this.getAttribute("toolbar")
    return toolbarId ? document.getElementById(toolbarId) : this.#createDefaultToolbar()
  }

  #createDefaultToolbar() {
    const toolbar = createElement("lexical-toolbar")
    toolbar.innerHTML = LexicalToolbar.defaultTemplate
    this.prepend(toolbar)
    return toolbar
  }

  #toggleEmptyStatus() {
    this.classList.toggle("lexical-editor--empty", this.#isEmpty)
  }

  get #isEmpty() {
    return !this.editorContentElement.textContent.trim() && !containsVisuallyRelevantChildren(this.editorContentElement)
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
  }

  #reconnect() {
    this.disconnectedCallback()
    this.connectedCallback()
  }
}

customElements.define("lexical-editor", LexicalEditorElement)
