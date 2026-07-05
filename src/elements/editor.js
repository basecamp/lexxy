import { $addUpdateTag, $createParagraphNode, $getRoot, $getSelection, $hasUpdateTag, $isElementNode, $isLineBreakNode, $isRangeSelection, $isTextNode, $onUpdate, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, CLEAR_HISTORY_COMMAND, COMMAND_PRIORITY_NORMAL, KEY_ENTER_COMMAND, PASTE_TAG, SKIP_DOM_SELECTION_TAG, TextNode } from "lexical"
import { buildEditorFromExtensions } from "@lexical/extension"
import { ListItemNode, ListNode, registerList } from "@lexical/list"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { $getNearestNodeOfType } from "@lexical/utils"
import { registerPlainText } from "@lexical/plain-text"
import { HeadingNode, QuoteNode, registerRichText } from "@lexical/rich-text"
import { $generateHtmlFromNodes, $generateNodesFromDOM as $generateLexicalNodesFromDOM } from "@lexical/html"
import { filterDisallowedAttachmentNodes } from "../helpers/attachment_filter_helper"
import { $convertInlineImageDataURIs } from "../helpers/inline_image_uri_helper"
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { TRANSFORMERS, registerMarkdownShortcuts } from "@lexical/markdown"
import { HORIZONTAL_DIVIDER } from "../editor/markdown/horizontal_divider_transformer"
import { registerMarkdownLeadingTagHandler } from "../editor/markdown/leading_tag_handler"

import theme from "../config/theme"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"
import { UploadRequests } from "../editor/attachments/upload_requests"
import { CommandDispatcher } from "../editor/command_dispatcher"
import Selection from "../editor/selection"
import { createElement, dispatch, generateDomId, parseHtml } from "../helpers/html_helper"
import { isAttachmentSpacerTextNode, isEditorFocused } from "../helpers/lexical_helper"
import { sanitize, setSanitizerConfig } from "../helpers/sanitization_helper"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"
import LexicalToolbar from "./toolbar"
import Configuration from "../editor/configuration"
import Contents from "../editor/contents"
import Clipboard from "../editor/clipboard"
import Extensions from "../editor/extensions"
import { BrowserAdapter } from "../editor/adapters/browser_adapter"
import { getHighlightStyles } from "../helpers/format_helper"
import { styleResolverRoot } from "../helpers/style_resolver_root"

import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import { exportTextNodeDOM } from "../helpers/text_node_export_helper"
import { ProvisionalParagraphExtension } from "../extensions/provisional_paragraph_extension"
import { CodeHighlightingExtension } from "../extensions/code_highlighting_extension"
import { HighlightExtension } from "../extensions/highlight_extension"
import { TrixContentExtension } from "../extensions/trix_content_extension"
import { TablesExtension } from "../extensions/tables_extension"
import { RewritableHistoryExtension } from "../extensions/rewritable_history_extension.js"
import { AttachmentsExtension } from "../extensions/attachments_extension.js"
import { FormatEscapeExtension } from "../extensions/format_escape_extension.js"
import { LinkOpenerExtension } from "../extensions/link_opener_extension.js"
import { PreventLexicalTripleClickExtension } from "../extensions/prevent_lexical_triple_click_extension.js"
import { CustomAttachmentDragAndDropExtension } from "../extensions/custom_attachment_drag_and_drop_extension.js"
import { nextFrame } from "../helpers/timing_helper.js"


export class LexicalEditorElement extends HTMLElement {
  static formAssociated = true
  static debug = false
  static commands = [ "bold", "italic", "strikethrough" ]

  static observedAttributes = [ "autocapitalize", "connected", "required" ]

  #initialValue = ""
  #previousInternalFormValue = null

  #initializeEventDispatched = false
  #editorInitializedDispatched = false
  #listeners = new ListenerBin()
  #disposables = []
  #historyState = { undo: false, redo: false }

  #validity = new Map()
  #validationTextArea = document.createElement("textarea")
  #uploadRequests

  constructor() {
    super()
    this.internals = this.attachInternals()
    this.internals.role = "presentation"
  }

  get uploadRequests() {
    return this.#uploadRequests
  }

  connectedCallback() {
    this.id ||= generateDomId("lexxy-editor")
    this.config = new Configuration(this)
    this.extensions = new Extensions(this)
    this.#disposables.push(this.extensions)

    this.editor = this.#createEditor()
    this.#disposables.push(this.editor)
    this.#disposables.push(this.#listeners)

    this.contents = new Contents(this)
    this.#disposables.push(this.contents)

    this.selection = new Selection(this)
    this.#disposables.push(this.selection)

    this.clipboard = new Clipboard(this)
    this.#disposables.push(this.clipboard)

    this.adapter = new BrowserAdapter()
    this.#uploadRequests = new UploadRequests()

    const commandDispatcher = CommandDispatcher.configureFor(this)
    this.#disposables.push(commandDispatcher)

    this.#initialize()

    this.toggleAttribute("connected", true)

    requestAnimationFrame(() => {
      this.#mountRoot()
      this.#handleAutofocus()
      this.#dispatchInitialize()
    })
  }

  disconnectedCallback() {
    this.#initializeEventDispatched = false
    this.#editorInitializedDispatched = false

    this.#previousInternalFormValue = null
    this.valueBeforeDisconnect = this.value

    this.#clearCachedValues()
    this.#reset() // Prevent hangs with Safari when morphing
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (typeof this[`${name}ChangedCallback`] === "function") {
      this[`${name}ChangedCallback`](oldValue, newValue)
    }
  }

  autocapitalizeChangedCallback() {
    if (this.editorContentElement) {
      this.#transferAttributeToContentEditable(this.editorContentElement, "autocapitalize")
    }
  }

  connectedChangedCallback(oldValue, newValue) {
    if (this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect())
    }
  }

  requiredChangedCallback() {
    if (this.isConnected) this.#requestValidityRefresh()
  }

  formResetCallback() {
    this.value = this.#initialValue
    this.editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
  }

  toString() {
    return this.cachedStringValue ??= this.editor?.read(() => {
      return $getReadableTextContent($getRoot())
    })
  }

  get form() {
    return this.internals.form
  }

  get name() {
    return this.getAttribute("name")
  }

  get required() {
    return this.hasAttribute("required")
  }

  get validity() {
    return this.internals.validity
  }

  checkValidity() {
    return this.internals.checkValidity()
  }

  reportValidity() {
    return this.internals.reportValidity()
  }

  setElementValidity(key, flags, message) {
    this.#validity.set(key, { flags, message })
    this.#requestValidityRefresh()
  }

  get toolbarElement() {
    if (!this.#hasToolbar) return null

    this.toolbar ??= this.#findOrCreateDefaultToolbar()
    return this.toolbar
  }

  get baseExtensions() {
    return [
      ProvisionalParagraphExtension,
      CodeHighlightingExtension,
      HighlightExtension,
      TrixContentExtension,
      TablesExtension,
      RewritableHistoryExtension,
      AttachmentsExtension,
      FormatEscapeExtension,
      LinkOpenerExtension,
      PreventLexicalTripleClickExtension,
      CustomAttachmentDragAndDropExtension
    ]
  }

  get directUploadUrl() {
    return this.dataset.directUploadUrl
  }

  get blobUrlTemplate() {
    return this.dataset.blobUrlTemplate
  }

  get permittedAttachmentTypes() {
    const raw = this.config.get("permittedAttachmentTypes")
    if (raw == null) {
      return null
    } else {
      const tokens = Array.isArray(raw) ? raw : String(raw).split(/\s+/)
      return Object.freeze(tokens.filter(t => t && t !== "false"))
    }
  }

  permitsAttachmentContentType(contentType) {
    if (!this.supportsAttachments) {
      return false
    } else {
      const list = this.permittedAttachmentTypes
      return list === null || list.includes(contentType)
    }
  }

  acceptsFile(file) {
    return dispatch(this, "lexxy:file-accept", { file }, true)
  }

  $generateNodesFromDOM(doc, { editor = this.editor } = {}) {
    let nodes = $generateLexicalNodesFromDOM(editor, doc)
    if ($hasUpdateTag(PASTE_TAG)) nodes = $convertInlineImageDataURIs(nodes, this)
    return filterDisallowedAttachmentNodes(nodes, this)
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

  registerAdapter(adapter) {
    this.adapter = adapter

    if (!this.editor) return

    this.#dispatchEditorInitialized()
    this.#dispatchAttributesChange()
  }

  freezeSelection() {
    this.adapter.freeze()
  }

  thawSelection() {
    this.adapter.thaw()
  }

  dispatchAttributesChange() {
    this.#dispatchAttributesChange()
  }

  dispatchEditorInitialized() {
    this.#dispatchEditorInitialized()
  }

  // TODO: Deprecate `single-line` attribute
  get isSingleLineMode() {
    return this.hasAttribute("single-line")
  }

  get contentTabIndex() {
    return parseInt(this.editorContentElement?.getAttribute("tabindex") ?? "0")
  }

  focus() {
    // `editor.focus()` commits a reconciler update to position the cursor.
    // Skip if the contenteditable already owns focus — the update would be a
    // no-op but still triggers a full style/layout pass on pages with large
    // DOMs.
    if (this.#isContentFocused) return

    this.editor.focus(() => this.#onFocus())
  }

  get #isContentFocused() {
    return !!this.editor && isEditorFocused(this.editor)
  }

  get value() {
    return this.cachedValue ??= this.#readSanitizedEditorValue()
  }

  set value(html) {
    const editorHasFocus = this.#isContentFocused

    this.editor.update(() => {
      if (editorHasFocus) {
        // Address Safari inconsistently placing the cursor in the contenteditable by forcing focus back onto the editor
        // Use direct `editor.focus` to bypass the pre-existing focus optimization and skip the callback
        $onUpdate(() => this.editor.focus())
      } else {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG)
      }


      this.#setEditorHtml(html)
      this.#toggleEmptyStatus()
    }, { discrete: true })
  }

  get canUndo() {
    return this.#historyState.undo
  }

  get canRedo() {
    return this.#historyState.redo
  }

  #readSanitizedEditorValue() {
    return this.editor?.read(() => {
      return sanitize($generateHtmlFromNodes(this.editor, null))
    }) ?? null
  }

  #parseHtmlIntoLexicalNodes(html, { editor = this.editor } = {}) {
    if (!html) html = "<p></p>"
    const nodes = this.$generateNodesFromDOM(parseHtml(`${html}`), { editor })

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
    this.#registerComponents()
    this.#handleEnter()
    this.#registerFocusEvents()
    this.#registerHistoryEvents()
    this.#registerFileAcceptFilter()
    this.#attachDebugHooks()
    this.#attachToolbar()
    this.#resetBeforeTurboCaches()

    this.#setInternalFormValue(this.value, { suppressEvent: true })
    this.#synchronizeWithChanges()
  }

  #registerFileAcceptFilter() {
    this.#listeners.track(
      registerEventListener(this, "lexxy:file-accept", (event) => {
        if (!this.permitsAttachmentContentType(event.detail.file.type)) {
          event.preventDefault()
        }
      })
    )
  }

  #createEditor() {
    this.editorContentElement ||= this.#prerenderedContentElement() || this.#createEditorContentElement()
    this.appendChild(this.editorContentElement)

    const editor = buildEditorFromExtensions({
      name: "lexxy/core",
      namespace: "Lexxy",
      theme: theme,
      nodes: this.#lexicalNodes,
      html: {
        export: new Map([ [ TextNode, exportTextNodeDOM ], [ CodeHighlightNode, exportTextNodeDOM ] ])
      },
      $initialEditorState: (editor) => {
        this.#configureSanitizer(editor)
        this.#loadInitialValue(editor)
      },
    },
      ...this.extensions.lexicalExtensions
    )

    return editor
  }

  // Toggling editable around setRootElement skips Lexical's DOM-selection sync,
  // which would otherwise steal focus from elsewhere on the page.
  #mountRoot() {
    this.editor.setEditable(false)
    this.editor.setRootElement(this.editorContentElement)
    this.editor.setEditable(true)
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

  // Adopt a content element the server prerendered inside us, if present.
  // Rendering the body server-side and reusing it here gives the field its final
  // height at first paint, avoiding the reflow from building the editor a frame
  // after load. Lexical reconciles its parsed state into this element on mount,
  // replacing the static markup with the live editor at the same height. Returns
  // null when absent (the default), so the empty-editor path is unchanged.
  #prerenderedContentElement() {
    const element = this.querySelector(":scope > .lexxy-editor__content")
    if (!element) return null

    element.id ||= `${this.id}-content`
    element.setAttribute("contenteditable", "true")
    element.setAttribute("role", "textbox")
    element.setAttribute("aria-multiline", "true")
    if (!element.hasAttribute("aria-label")) element.setAttribute("aria-label", this.#labelText)
    if (this.hasAttribute("placeholder")) element.setAttribute("placeholder", this.getAttribute("placeholder"))

    this.#ariaAttributes.forEach(attribute => element.setAttribute(attribute.name, attribute.value))
    this.#transferAttributeToContentEditable(element, "autocapitalize")
    this.#transferAttributeToContentEditable(element, "tabindex", { defaultValue: 0, removeSource: true })

    return element
  }

  #createEditorContentElement() {
    const editorContentElement = createElement("div", {
      id: `${this.id}-content`,
      classList: "lexxy-editor__content",
      contenteditable: true,
      role: "textbox",
      "aria-multiline": true,
      "aria-label": this.#labelText,
      placeholder: this.getAttribute("placeholder")
    })

    this.#ariaAttributes.forEach(attribute => editorContentElement.setAttribute(attribute.name, attribute.value))

    this.#transferAttributeToContentEditable(editorContentElement, "autocapitalize")
    this.#transferAttributeToContentEditable(editorContentElement, "tabindex", { defaultValue: 0, removeSource: true })

    return editorContentElement
  }

  #transferAttributeToContentEditable(element, qualifiedName, { defaultValue = null, removeSource = false } = {}) {
    if (this.hasAttribute(qualifiedName)) {
      element.setAttribute(qualifiedName, this.getAttribute(qualifiedName))
    } else if (defaultValue !== null) {
      element.setAttribute(qualifiedName, defaultValue)
    } else {
      element.removeAttribute(qualifiedName)
    }

    if (removeSource) this.removeAttribute(qualifiedName)
  }

  get #labelText() {
    return Array.from(this.internals.labels).map(label => label.textContent).join(" ")
  }

  get #ariaAttributes() {
    return Array.from(this.attributes).filter(attribute => attribute.name.startsWith("aria-"))
  }

  #setInternalFormValue(html, { suppressEvent = false } = {}) {
    const changed = html !== this.#previousInternalFormValue

    this.internals.setFormValue(html)
    this.#previousInternalFormValue = html

    if (changed && !suppressEvent) {
      dispatch(this, "lexxy:change")
    }
  }

  #loadInitialValue(editor) {
    const initialHtml = this.valueBeforeDisconnect || this.getAttribute("value") || "<p><br></p>"

    this.#initialValue = initialHtml
    this.#setEditorHtml(initialHtml, { editor })
  }

  #setEditorHtml(html, { editor = this.editor } = { }) {
    $getRoot()
      .clear()
      .selectEnd()
      .insertNodes(this.#parseHtmlIntoLexicalNodes(html, { editor }))
  }

  #resetBeforeTurboCaches() {
    this.#listeners.track(
      registerEventListener(document, "turbo:before-cache", this.#handleTurboBeforeCache)
    )
  }

  #handleTurboBeforeCache = (event) => {
    if (!this.closest("[data-turbo-permanent]")) {
      this.#reset()
    }
  }

  #synchronizeWithChanges() {
    this.#listeners.track(this.editor.registerUpdateListener(({ editorState }) => {
      this.#clearCachedValues()
      this.#setInternalFormValue(this.value)
      this.#toggleEmptyStatus()
      this.#requestValidityRefresh()
      this.#dispatchAttributesChange()
    }))
  }

  async #requestValidityRefresh() {
    await nextFrame()

    if (this.isConnected) this.#refreshValidity()
  }

  #refreshValidity() {
    this.#refreshInternalValidity()
    const { validity, message } = this.#calculateValidity()
    this.internals.setValidity(validity, message, this.editorContentElement)
  }

  #refreshInternalValidity() {
    this.#validationTextArea.required = this.required && this.isBlank
    const flags = this.#validationTextArea.validity
    const message = this.#validationTextArea.validationMessage

    this.#validity.set(this, { flags, message })
  }

  #calculateValidity() {
    const validity = {}
    const messages = []

    for (const { flags, message } of this.#validity.values()) {
      // internal TextArea's ValidityState can contain `valid: true`
      if (flags.valid === true) continue

      for (const flag in flags) {
        if (flags[flag]) {
          validity[flag] = true
          messages.push(message)
        }
      }
    }

    return { validity, message: messages.join("\n") }
  }

  #clearCachedValues() {
    this.cachedValue = null
    this.cachedStringValue = null
  }

  #registerComponents() {
    const registered = []

    if (this.supportsRichText) {
      registered.push(
        registerRichText(this.editor),
        registerList(this.editor)
      )
      this.#registerTableComponents()
      this.#registerCodeLanguagePicker()
      if (this.supportsMarkdown) {
        const transformers = [ ...TRANSFORMERS, HORIZONTAL_DIVIDER ]
        registered.push(
          registerMarkdownShortcuts(this.editor, transformers),
          registerMarkdownLeadingTagHandler(this.editor, transformers)
        )
      }
    } else {
      registered.push(registerPlainText(this.editor))
    }

    this.#listeners.track(...registered)
  }

  #registerTableComponents() {
    let tableTools = this.querySelector("lexxy-table-tools")
    tableTools ??= createElement("lexxy-table-tools")
    this.append(tableTools)
    this.#disposables.push(tableTools)
  }

  #registerCodeLanguagePicker() {
    let codeLanguagePicker = this.querySelector("lexxy-code-language-picker")
    codeLanguagePicker ??= createElement("lexxy-code-language-picker")
    this.append(codeLanguagePicker)
    this.#disposables.push(codeLanguagePicker)
  }

  #handleEnter() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.#listeners.track(this.editor.registerCommand(
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
    this.#listeners.track(
      registerEventListener(this, "focusin", this.#handleFocusIn),
      registerEventListener(this, "focusout", this.#handleFocusOut)
    )
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

  #registerHistoryEvents() {
    this.#listeners.track(
      this.editor.registerCommand(CAN_UNDO_COMMAND, (enabled) => { this.#historyState.undo = enabled }, COMMAND_PRIORITY_NORMAL),
      this.editor.registerCommand(CAN_REDO_COMMAND, (enabled) => { this.#historyState.redo = enabled }, COMMAND_PRIORITY_NORMAL)
    )
  }

  #attachDebugHooks() {
    if (!LexicalEditorElement.debug) return

    this.#listeners.track(this.editor.registerUpdateListener(({ editorState }) => {
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

  #configureSanitizer(editor) {
    setSanitizerConfig(this.#getAllowedElements(editor))
  }

  #getAllowedElements(editor) {
    return this.#getImportableTags(editor).concat(this.extensions.allowedElements)
  }

  #getImportableTags(editor) {
    const tags = Array.from(editor._htmlConversions.keys())
    return tags.filter(tag => !tag.startsWith("#"))
  }

  #dispatchAttributesChange() {
    let attributes = null
    let linkHref = null
    let highlight = null
    let headingTag = null

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const format = this.selection.getFormat()
      if (Object.keys(format).length === 0) return

      const anchorNode = selection.anchor.getNode()
      const linkNode = $getNearestNodeOfType(anchorNode, LinkNode)

      attributes = {
        bold: { active: format.isBold, enabled: true },
        italic: { active: format.isItalic, enabled: true },
        strikethrough: { active: format.isStrikethrough, enabled: true },
        code: { active: format.isInCode, enabled: true },
        highlight: { active: format.isHighlight, enabled: true },
        link: { active: format.isInLink, enabled: true },
        quote: { active: format.isInQuote, enabled: true },
        heading: { active: format.isInHeading, enabled: true },
        "unordered-list": { active: format.isInList && format.listType === "bullet", enabled: true },
        "ordered-list": { active: format.isInList && format.listType === "number", enabled: true },
        undo: { active: false, enabled: this.canUndo },
        redo: { active: false, enabled: this.canRedo }
      }

      linkHref = linkNode ? linkNode.getURL() : null
      highlight = format.isHighlight ? getHighlightStyles(selection) : null
      headingTag = format.headingTag ?? null
    })

    if (attributes) {
      this.adapter.dispatchAttributesChange(attributes, linkHref, highlight, headingTag)
    }
  }

  #dispatchEditorInitialized() {
    if (!this.adapter) return

    this.#editorInitializedDispatched = true

    this.adapter.dispatchEditorInitialized({
      highlightColors: this.#resolvedHighlightColors,
      headingFormats: this.#supportedHeadingFormats
    })
  }

  #dispatchInitialize() {
    if (this.isConnected && this.adapter) {
      if (!this.#initializeEventDispatched) {
        this.#initializeEventDispatched = true
        dispatch(this, "lexxy:initialize")
      }

      if (!this.#editorInitializedDispatched) {
        this.#dispatchEditorInitialized()
      }
    }
  }

  get #resolvedHighlightColors() {
    const buttons = this.config.get("highlight.buttons")
    if (!buttons) return null

    const colors = this.#resolveColors("color", buttons.color || [])
    const backgroundColors = this.#resolveColors("background-color", buttons["background-color"] || [])
    return { colors, backgroundColors }
  }

  get #supportedHeadingFormats() {
    if (!this.supportsRichText) return []

    return [
      { label: "Normal", command: "setFormatParagraph", tag: null },
      { label: "Large heading", command: "setFormatHeadingLarge", tag: "h2" },
      { label: "Medium heading", command: "setFormatHeadingMedium", tag: "h3" },
      { label: "Small heading", command: "setFormatHeadingSmall", tag: "h4" },
    ]
  }

  // Builds one resolver element per CSS value inside a hidden container, attaches
  // the container in a single DOM write, then reads all computed values in one pass
  // — triggering at most one forced reflow. The previous implementation interleaved
  // setProperty/getComputedStyle/removeProperty on the same element, forcing a style
  // recalc on every iteration during editor initialization.
  #resolveColors(property, cssValues) {
    const container = document.createElement("span")
    container.style.display = "none"

    const resolvers = cssValues.map(cssValue => {
      const element = document.createElement("span")
      element.style.setProperty(property, cssValue)
      container.appendChild(element)
      return { element, name: cssValue }
    })

    styleResolverRoot().appendChild(container)

    const resolved = resolvers.map(({ element, name }) => ({
      name,
      value: window.getComputedStyle(element).getPropertyValue(property)
    }))

    container.remove()
    return resolved
  }

  #reset() {
    this.#dispose()
    this.#resetValidity()
    this.#uploadRequests?.clear()
    this.editorContentElement?.remove()
    this.editorContentElement = null

    // Prevents issues with turbo morphing receiving an empty <lexxy-editor> which wipes
    // out the DOM for the tools, and the old toolbar reference will cause issues
    this.toolbar = null
  }

  #dispose() {
    while (this.#disposables.length) {
      this.#disposables.pop().dispose()
    }
  }

  #reconnect() {
    this.disconnectedCallback()
    this.valueBeforeDisconnect = null
    this.connectedCallback()
  }

  #resetValidity() {
    this.#validity = new Map()
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
