import Lexxy from "../config/lexxy"
import { createElement, generateDomId, parseHtml } from "../helpers/html_helper"
import { getNonce } from "../helpers/csp_helper"
import { $createTextNode, $isTextNode, COMMAND_PRIORITY_CRITICAL, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ENTER_COMMAND, KEY_SPACE_COMMAND, KEY_TAB_COMMAND } from "lexical"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import InlinePromptSource from "../editor/prompt/inline_source"
import DeferredPromptSource from "../editor/prompt/deferred_source"
import RemoteFilterSource from "../editor/prompt/remote_filter_source"
import { $generateNodesFromDOM } from "@lexical/html"
import { nextFrame } from "../helpers/timing_helpers"

const NOTHING_FOUND_DEFAULT_MESSAGE = "Nothing found"

export class LexicalPromptElement extends HTMLElement {
  constructor() {
    super()
    this.keyListeners = []
  }

  static observedAttributes = [ "connected" ]

  connectedCallback() {
    this.source = this.#createSource()

    this.#addTriggerListener()
    this.toggleAttribute("connected", true)
  }

  disconnectedCallback() {
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
    const unregister = this.#editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
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
                unregister()
                this.#showPopover()
              }
            }
          }
        }
      })
    })
  }

  #addCursorPositionListener() {
    this.cursorPositionListener = this.#editor.registerUpdateListener(() => {
      if (this.closed) return

      this.#editor.read(() => {
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
    })
  }

  #removeCursorPositionListener() {
    if (this.cursorPositionListener) {
      this.cursorPositionListener()
      this.cursorPositionListener = null
    }
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
    this.popoverElement ??= await this.#buildPopover()
    this.#resetPopoverPosition()
    await this.#filterOptions()
    this.popoverElement.classList.toggle("lexxy-prompt-menu--visible", true)
    this.#selectFirstOption()

    this.#editorElement.addEventListener("keydown", this.#handleKeydownOnPopover)
    this.#editorElement.addEventListener("lexxy:change", this.#filterOptions)

    this.#registerKeyListeners()
    this.#addCursorPositionListener()
  }

  #registerKeyListeners() {
    // We can't use a regular keydown for Enter as Lexical handles it first
    this.keyListeners.push(this.#editor.registerCommand(KEY_ENTER_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL))
    this.keyListeners.push(this.#editor.registerCommand(KEY_TAB_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL))

    if (this.#doesSpaceSelect) {
      this.keyListeners.push(this.#editor.registerCommand(KEY_SPACE_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL))
    }

    // Register arrow keys with CRITICAL priority to prevent Lexical's selection handlers from running
    this.keyListeners.push(this.#editor.registerCommand(KEY_ARROW_UP_COMMAND, this.#handleArrowUp.bind(this), COMMAND_PRIORITY_CRITICAL))
    this.keyListeners.push(this.#editor.registerCommand(KEY_ARROW_DOWN_COMMAND, this.#handleArrowDown.bind(this), COMMAND_PRIORITY_CRITICAL))
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
    this.#clearSelection()
    listItem.toggleAttribute("aria-selected", true)
    listItem.scrollIntoView({ block: "nearest", behavior: "smooth" })
    listItem.focus()

    // Preserve selection to prevent cursor jump
    this.#selection.preservingSelection(() => {
      this.#editorElement.focus()
    })

    this.#editorContentElement.setAttribute("aria-controls", this.popoverElement.id)
    this.#editorContentElement.setAttribute("aria-activedescendant", listItem.id)
    this.#editorContentElement.setAttribute("aria-haspopup", "listbox")
  }

  #clearSelection() {
    this.#listItemElements.forEach((item) => { item.toggleAttribute("aria-selected", false) })
    this.#editorContentElement.removeAttribute("aria-controls")
    this.#editorContentElement.removeAttribute("aria-activedescendant")
    this.#editorContentElement.removeAttribute("aria-haspopup")
  }

  #positionPopover() {
    const { x, y, fontSize } = this.#selection.cursorPosition
    const editorRect = this.#editorElement.getBoundingClientRect()
    const contentRect = this.#editorContentElement.getBoundingClientRect()
    const verticalOffset = contentRect.top - editorRect.top

    if (!this.popoverElement.hasAttribute("data-anchored")) {
      this.popoverElement.style.left = `${x}px`
      this.popoverElement.toggleAttribute("data-anchored", true)
    }

    this.popoverElement.style.top = `${y + verticalOffset}px`
    this.popoverElement.style.bottom = "auto"

    const popoverRect = this.popoverElement.getBoundingClientRect()
    const isClippedAtBottom = popoverRect.bottom > window.innerHeight

    if (isClippedAtBottom || this.popoverElement.hasAttribute("data-clipped-at-bottom")) {
      this.popoverElement.style.top = `${y + verticalOffset - popoverRect.height - fontSize}px`
      this.popoverElement.style.bottom = "auto"
      this.popoverElement.toggleAttribute("data-clipped-at-bottom", true)
    }
  }

  #resetPopoverPosition() {
    this.popoverElement.removeAttribute("data-clipped-at-bottom")
    this.popoverElement.removeAttribute("data-anchored")
  }

  async #hidePopover() {
    this.#clearSelection()
    this.popoverElement.classList.toggle("lexxy-prompt-menu--visible", false)
    this.#editorElement.removeEventListener("lexxy:change", this.#filterOptions)
    this.#editorElement.removeEventListener("keydown", this.#handleKeydownOnPopover)

    this.#unregisterKeyListeners()
    this.#removeCursorPositionListener()

    await nextFrame()
    this.#addTriggerListener()
  }

  #unregisterKeyListeners() {
    this.keyListeners.forEach((unregister) => unregister())
    this.keyListeners = []
  }

  #filterOptions = async () => {
    if (this.initialPrompt) {
      this.initialPrompt = false
      return
    }

    if (this.#editorContents.containsTextBackUntil(this.trigger)) {
      await this.#showFilteredOptions()
      await nextFrame()
      this.#positionPopover()
    } else {
      this.#hidePopover()
    }
  }

  async #showFilteredOptions() {
    const filter = this.#editorContents.textBackUntil(this.trigger)
    const filteredListItems = await this.source.buildListItems(filter)
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
    const el = createElement("li", { innerHTML: this.#emptyResultsMessage })
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
    return $generateNodesFromDOM(this.#editor, parseHtml(`${template.innerHTML}`))
  }

  #insertTemplatesAsAttachments(templates, stringToReplace, fallbackSgid = null) {
    this.#editor.update(() => {
      const attachmentNodes = this.#buildAttachmentNodes(templates, fallbackSgid)
      const spacedAttachmentNodes = attachmentNodes.flatMap(node => [ node, this.#getSpacerTextNode() ]).slice(0, -1)
      this.#editorContents.replaceTextBackUntil(stringToReplace, spacedAttachmentNodes)
    })
  }

  #buildAttachmentNodes(templates, fallbackSgid = null) {
    return templates.map(
      template => this.#buildAttachmentNode(
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
    popoverContainer.addEventListener("click", this.#handlePopoverClick)
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
