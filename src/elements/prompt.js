import Lexxy from "../config/lexxy"
import { createElement, generateDomId, parseHtml } from "../helpers/html_helper"
import { getNonce } from "../helpers/csp_helper"
import { $createTextNode, $getSelection, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_CRITICAL, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ENTER_COMMAND, KEY_SPACE_COMMAND, KEY_TAB_COMMAND } from "lexical"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import InlinePromptSource from "../editor/prompt/inline_source"
import DeferredPromptSource from "../editor/prompt/deferred_source"
import RemoteFilterSource from "../editor/prompt/remote_filter_source"
import { debounce, nextFrame } from "../helpers/timing_helpers"
import { ListenerBin, registerEventListener } from "../helpers/listener_helper"

const NOTHING_FOUND_DEFAULT_MESSAGE = "Nothing found"
const FILTER_DEBOUNCE_INTERVAL = 50

export class LexicalPromptElement extends HTMLElement {
  #globalListeners = new ListenerBin()
  #popoverListeners = new ListenerBin()
  #debouncedFilterOptions = debounce(() => this.#filterOptions(), FILTER_DEBOUNCE_INTERVAL)

  constructor() {
    super()
    this.showPopoverId = 0
  }

  static observedAttributes = [ "connected" ]

  connectedCallback() {
    this.source = this.#createSource()

    this.#addTriggerListener()
    this.toggleAttribute("connected", true)
  }

  disconnectedCallback() {
    this.#popoverListeners.dispose()
    this.#globalListeners.dispose()
    this.source = null
    this.popoverElement = null
  }


  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect())
    }
  }

  get name() {
    return this.getAttribute("name")
  }

  get trigger() {
    return this.getAttribute("trigger")
  }

  get supportsSpaceInSearches() {
    return this.hasAttribute("supports-space-in-searches")
  }

  get open() {
    return this.popoverElement?.classList?.contains("lexxy-prompt-menu--visible")
  }

  get closed() {
    return !this.open
  }

  get #doesSpaceSelect() {
    return !this.supportsSpaceInSearches
  }

  #createSource() {
    const src = this.getAttribute("src")
    if (src) {
      if (this.hasAttribute("remote-filtering")) {
        return new RemoteFilterSource(src)
      } else {
        return new DeferredPromptSource(src)
      }
    } else {
      return new InlinePromptSource(this.querySelectorAll("lexxy-prompt-item"))
    }
  }

  #addTriggerListener() {
    if (!this.#promptContentTypePermitted) return

    this.#popoverListeners.track(this.#editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (this.#selection.isInsideCodeBlock) return

        const { node, offset } = this.#selection.selectedNodeWithOffset()
        if (!node) return

        if ($isTextNode(node)) {
          const fullText = node.getTextContent()
          const triggerLength = this.trigger.length

          // Check if we have enough characters for the trigger
          if (offset >= triggerLength) {
            const textBeforeCursor = fullText.slice(offset - triggerLength, offset)

            // Check if trigger is at the start of the text node (new line case) or preceded by space or newline
            if (textBeforeCursor === this.trigger) {
              const isAtStart = offset === triggerLength

              const charBeforeTrigger = offset > triggerLength ? fullText[offset - triggerLength - 1] : null
              const isPrecededBySpaceOrNewline = charBeforeTrigger === " " || charBeforeTrigger === "\n"

              if (isAtStart || isPrecededBySpaceOrNewline) {
                this.#popoverListeners.dispose()
                this.#showPopover()
              }
            }
          }
        }
      })
    }))
  }

  get #promptContentTypePermitted() {
    const el = this.#editorElement
    if (!el.supportsAttachments) {
      return false
    } else {
      const templates = Array.from(this.querySelectorAll("template[type='editor']"))
      const types = templates.length
        ? templates.map(t => t.getAttribute("content-type") || this.#defaultPromptContentType)
        : [ this.#defaultPromptContentType ]
      return types.some(t => el.permitsAttachmentContentType(t))
    }
  }

  #addCursorPositionListener() {
    this.#popoverListeners.track(this.#editor.registerUpdateListener(({ editorState }) => {
      if (this.closed) return

      editorState.read(() => {
        if (this.#selection.isInsideCodeBlock) {
          this.#hidePopover()
          return
        }

        const { node, offset } = this.#selection.selectedNodeWithOffset()
        if (!node) return

        if ($isTextNode(node) && offset > 0) {
          const fullText = node.getTextContent()
          const textBeforeCursor = fullText.slice(0, offset)
          const lastTriggerIndex = textBeforeCursor.lastIndexOf(this.trigger)
          const triggerEndIndex = lastTriggerIndex + this.trigger.length - 1

          // If trigger is not found, or cursor is at or before the trigger end position, hide popover
          if (lastTriggerIndex === -1 || offset <= triggerEndIndex) {
            this.#hidePopover()
          }
        } else {
          // Cursor is not in a text node or at offset 0, hide popover
          this.#hidePopover()
        }
      })
    }))
  }

  get #editor() {
    return this.#editorElement.editor
  }

  get #editorElement() {
    return this.closest("lexxy-editor")
  }

  get #selection() {
    return this.#editorElement.selection
  }

  async #showPopover() {
    const showId = ++this.showPopoverId
    this.popoverElement ??= await this.#buildPopover()
    if (this.showPopoverId !== showId) return

    this.#resetPopoverPosition()
    await this.#filterOptions()
    if (this.showPopoverId !== showId) return

    this.popoverElement.classList.toggle("lexxy-prompt-menu--visible", true)
    this.#selectFirstOption()

    this.#popoverListeners.track(
      registerEventListener(this.#editorElement, "keydown", this.#handleKeydownOnPopover),
      registerEventListener(this.#editorElement, "lexxy:change", this.#debouncedFilterOptions)
    )

    this.#registerKeyListeners()
    this.#addCursorPositionListener()
  }

  #registerKeyListeners() {
    // We can't use a regular keydown for Enter as Lexical handles it first
    this.#popoverListeners.track(
      this.#editor.registerCommand(KEY_ENTER_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL),
      this.#editor.registerCommand(KEY_TAB_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL)
    )

    if (this.#doesSpaceSelect) {
      this.#popoverListeners.track(this.#editor.registerCommand(KEY_SPACE_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL))
    }

    // Register arrow keys with CRITICAL priority to prevent Lexical's selection handlers from running
    this.#popoverListeners.track(
      this.#editor.registerCommand(KEY_ARROW_UP_COMMAND, this.#handleArrowUp.bind(this), COMMAND_PRIORITY_CRITICAL),
      this.#editor.registerCommand(KEY_ARROW_DOWN_COMMAND, this.#handleArrowDown.bind(this), COMMAND_PRIORITY_CRITICAL)
    )
  }

  #handleArrowUp(event) {
    this.#moveSelectionUp()
    event.preventDefault()
    return true
  }

  #handleArrowDown(event) {
    this.#moveSelectionDown()
    event.preventDefault()
    return true
  }

  #selectFirstOption() {
    const firstOption = this.#listItemElements[0]

    if (firstOption) {
      this.#selectOption(firstOption)
    }
  }

  get #listItemElements() {
    return Array.from(this.popoverElement.querySelectorAll(".lexxy-prompt-menu__item"))
  }

  #selectOption(listItem) {
    this.#clearListItemSelection()
    listItem.toggleAttribute("aria-selected", true)
    listItem.scrollIntoView({ block: "nearest", behavior: "smooth" })
    listItem.focus()

    // Preserve selection to prevent cursor jump
    this.#selection.preservingSelection(() => {
      this.#editorElement.focus()
    })

    this.#setEditorAssociationAttribute("aria-controls", this.popoverElement.id)
    this.#setEditorAssociationAttribute("aria-activedescendant", listItem.id)
    this.#setEditorAssociationAttribute("aria-haspopup", "listbox")
  }

  #clearListItemSelection() {
    this.#listItemElements.forEach((item) => { item.toggleAttribute("aria-selected", false) })
  }

  #clearSelection() {
    this.#clearListItemSelection()
    this.#editorContentElement.removeAttribute("aria-controls")
    this.#editorContentElement.removeAttribute("aria-activedescendant")
    this.#editorContentElement.removeAttribute("aria-haspopup")
  }

  #setEditorAssociationAttribute(name, value) {
    if (this.#editorContentElement.getAttribute(name) !== value) {
      this.#editorContentElement.setAttribute(name, value)
    }
  }

  #positionPopover() {
    const { x, y, fontSize } = this.#selection.cursorPosition
    const editorRect = this.#editorElement.getBoundingClientRect()
    const contentRect = this.#editorContentElement.getBoundingClientRect()
    const verticalOffset = contentRect.top - editorRect.top

    if (!this.popoverElement.hasAttribute("data-anchored")) {
      this.#setPopoverOffsetX(x)
      this.#setPopoverOffsetY(y + verticalOffset)
      this.popoverElement.toggleAttribute("data-anchored", true)
    }

    const popoverRect = this.popoverElement.getBoundingClientRect()

    if (popoverRect.right > window.innerWidth) {
      this.popoverElement.toggleAttribute("data-clipped-at-right", true)
    }

    if (popoverRect.bottom > window.innerHeight) {
      this.#setPopoverOffsetY(contentRect.height - y + fontSize)
      this.popoverElement.toggleAttribute("data-clipped-at-bottom", true)
    }
  }

  #setPopoverOffsetX(value) {
    this.popoverElement.style.setProperty("--lexxy-prompt-offset-x", `${value}px`)
  }

  #setPopoverOffsetY(value) {
    this.popoverElement.style.setProperty("--lexxy-prompt-offset-y", `${value}px`)
  }

  #resetPopoverPosition() {
    this.popoverElement.removeAttribute("data-clipped-at-bottom")
    this.popoverElement.removeAttribute("data-clipped-at-right")
    this.popoverElement.removeAttribute("data-anchored")
  }

  async #hidePopover() {
    this.showPopoverId++
    this.#clearSelection()
    this.popoverElement.classList.toggle("lexxy-prompt-menu--visible", false)
    this.#popoverListeners.dispose()

    await nextFrame()
    this.#addTriggerListener()
  }

  #filterOptions = async () => {
    if (this.initialPrompt) {
      this.initialPrompt = false
      return
    }

    if (this.#editorContents.containsTextBackUntil(this.trigger)) {
      await this.#showFilteredOptions()

      // Re-check after async operation — the trigger may have been consumed
      // (e.g. markdown heading shortcut converted "# " to h1 during the fetch)
      if (!this.#editorContents.containsTextBackUntil(this.trigger)) {
        this.#hidePopover()
        return
      }

      await nextFrame()
      this.#positionPopover()
    } else {
      this.#hidePopover()
    }
  }

  async #showFilteredOptions() {
    const showId = this.showPopoverId
    const filter = this.#editorContents.textBackUntil(this.trigger)
    const filteredListItems = await this.source.buildListItems(filter)
    if (this.showPopoverId !== showId) return
    if (!this.#editorContents.containsTextBackUntil(this.trigger)) return

    this.popoverElement.innerHTML = ""

    if (filteredListItems.length > 0) {
      this.#showResults(filteredListItems)
    } else {
      this.#showEmptyResults()
    }
    this.#selectFirstOption()
  }

  #showResults(filteredListItems) {
    this.popoverElement.classList.remove("lexxy-prompt-menu--empty")
    this.popoverElement.append(...filteredListItems)
  }

  #showEmptyResults() {
    this.popoverElement.classList.add("lexxy-prompt-menu--empty")
    const el = createElement("li", { textContent: this.#emptyResultsMessage })
    el.classList.add("lexxy-prompt-menu__item--empty")
    this.popoverElement.append(el)
  }

  get #emptyResultsMessage() {
    return this.getAttribute("empty-results") || NOTHING_FOUND_DEFAULT_MESSAGE
  }

  #handleKeydownOnPopover = (event) => {
    if (event.key === "Escape") {
      this.#hidePopover()
      this.#editorElement.focus()
      event.stopPropagation()
    } else if (event.key === ",") {
      event.preventDefault()
      event.stopPropagation()
      this.#optionWasSelected()
      this.#editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          selection.insertText(",")
        }
      })
    }
    // Arrow keys are now handled via Lexical commands with HIGH priority
  }

  #moveSelectionDown() {
    const nextIndex = this.#selectedIndex + 1
    if (nextIndex < this.#listItemElements.length) this.#selectOption(this.#listItemElements[nextIndex])
  }

  #moveSelectionUp() {
    const previousIndex = this.#selectedIndex - 1
    if (previousIndex >= 0) this.#selectOption(this.#listItemElements[previousIndex])
  }

  get #selectedIndex() {
    return this.#listItemElements.findIndex((item) => item.hasAttribute("aria-selected"))
  }

  get #selectedListItem() {
    return this.#listItemElements[this.#selectedIndex]
  }

  #handleSelectedOption(event) {
    event.preventDefault()
    event.stopPropagation()
    this.#optionWasSelected()
    return true
  }

  #optionWasSelected() {
    this.#replaceTriggerWithSelectedItem()
    this.#hidePopover()
    this.#editorElement.focus()
  }

  #replaceTriggerWithSelectedItem() {
    const promptItem = this.source.promptItemFor(this.#selectedListItem)

    if (!promptItem) { return }

    const templates = Array.from(promptItem.querySelectorAll("template[type='editor']"))
    const stringToReplace = `${this.trigger}${this.#editorContents.textBackUntil(this.trigger)}`

    if (this.hasAttribute("insert-editable-text")) {
      this.#insertTemplatesAsEditableText(templates, stringToReplace)
    } else {
      this.#insertTemplatesAsAttachments(templates, stringToReplace, promptItem.getAttribute("sgid"))
    }
  }

  #insertTemplatesAsEditableText(templates, stringToReplace) {
    this.#editor.update(() => {
      const nodes = templates.flatMap(template => this.#buildEditableTextNodes(template))
      this.#editorContents.replaceTextBackUntil(stringToReplace, nodes)
    })
  }

  #buildEditableTextNodes(template) {
    return this.#editorElement.$generateNodesFromDOM(parseHtml(`${template.innerHTML}`))
  }

  #insertTemplatesAsAttachments(templates, stringToReplace, fallbackSgid = null) {
    this.#editor.update(() => {
      const attachmentNodes = this.#buildAttachmentNodes(templates, fallbackSgid)
      const spacedAttachmentNodes = attachmentNodes.flatMap(node => [ node, this.#getSpacerTextNode() ]).slice(0, -1)
      this.#editorContents.replaceTextBackUntil(stringToReplace, spacedAttachmentNodes)
    })
  }

  #buildAttachmentNodes(templates, fallbackSgid = null) {
    return templates
      .filter(template => this.#editorElement.permitsAttachmentContentType(
        template.getAttribute("content-type") || this.#defaultPromptContentType))
      .map(template => this.#buildAttachmentNode(
        template.innerHTML,
        template.getAttribute("content-type") || this.#defaultPromptContentType,
        template.getAttribute("sgid") || fallbackSgid
      ))
  }

  #getSpacerTextNode() {
    return $createTextNode(" ")
  }

  get #defaultPromptContentType() {
    const attachmentContentTypeNamespace = Lexxy.global.get("attachmentContentTypeNamespace")
    return `application/vnd.${attachmentContentTypeNamespace}.${this.name}`
  }

  #buildAttachmentNode(innerHtml, contentType, sgid) {
    return new CustomActionTextAttachmentNode({ sgid, contentType, innerHtml })
  }

  get #editorContents() {
    return this.#editorElement.contents
  }

  get #editorContentElement() {
    return this.#editorElement.editorContentElement
  }

  async #buildPopover() {
    const popoverContainer = createElement("ul", { role: "listbox", id: generateDomId("prompt-popover") }) // Avoiding [popover] due to not being able to position at an arbitrary X, Y position.
    popoverContainer.classList.add("lexxy-prompt-menu")
    popoverContainer.style.position = "absolute"
    popoverContainer.setAttribute("nonce", getNonce())
    popoverContainer.append(...await this.source.buildListItems())
    this.#globalListeners.track(registerEventListener(popoverContainer, "click", this.#handlePopoverClick))
    this.#editorElement.appendChild(popoverContainer)
    return popoverContainer
  }

  #handlePopoverClick = (event) => {
    const listItem = event.target.closest(".lexxy-prompt-menu__item")
    if (listItem) {
      this.#selectOption(listItem)
      this.#optionWasSelected()
    }
  }

  #reconnect() {
    this.disconnectedCallback()
    this.connectedCallback()
  }
}

export default LexicalPromptElement
