import { createElement, generateDomId, parseHtml } from "../helpers/html_helper"
import { getNonce } from "../helpers/csp_helper"
import { $getSelection, $isNodeSelection, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_HIGH, KEY_ENTER_COMMAND, KEY_SPACE_COMMAND, KEY_TAB_COMMAND } from "lexical"
import { CustomActionTextAttachmentNode } from "../nodes/custom_action_text_attachment_node"
import InlinePromptSource from "../editor/prompt/inline_source"
import DeferredPromptSource from "../editor/prompt/deferred_source"
import RemoteFilterSource from "../editor/prompt/remote_filter_source"
import { $generateNodesFromDOM } from "@lexical/html"
import { nextFrame } from "../helpers/timing_helpers"

const NOTHING_FOUND_DEFAULT_MESSAGE = "Nothing found"

export default class LexicalPromptElement extends HTMLElement {
  constructor() {
    super()
    this.keyListeners = []
  }

  connectedCallback() {
    this.source = this.#createSource()

    this.#addTriggerListener()
  }

  disconnectedCallback() {
    this.source = null
    this.popoverElement = null
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
    const unregister = this.#editor.registerUpdateListener(() => {
      this.#editor.read(() => {
        const selection = $getSelection()
        if (!selection) return
        let node
        let offset
        if ($isRangeSelection(selection)) {
          node = selection.anchor.getNode()
          offset = selection.anchor.offset
        } else if ($isNodeSelection(selection)) {
          [ node ] = selection.getNodes()
          offset = 0
        }

        if (node && $isTextNode(node) && offset > 0) {
          const fullText = node.getTextContent()
          const charBeforeCursor = fullText[offset - 1]

          if (charBeforeCursor === this.trigger) {
            unregister()
            this.#showPopover()
          }
        }
      })
    })
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
  }

  #registerKeyListeners() {
    // We can't use a regular keydown for Enter as Lexical handles it first
    this.keyListeners.push(this.#editor.registerCommand(KEY_ENTER_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_HIGH))
    this.keyListeners.push(this.#editor.registerCommand(KEY_TAB_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_HIGH))

    if (this.#doesSpaceSelect) {
      this.keyListeners.push(this.#editor.registerCommand(KEY_SPACE_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_HIGH))
    }
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
    listItem.focus()

    // Scroll the selected item into view
    listItem.scrollIntoView({ block: "nearest", behavior: "smooth" })

    // Preserve and restore selection before/after focusing to prevent cursor jump
    let selectionState = null;
    this.#editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (selection && $isRangeSelection(selection)) {
        selectionState = {
          anchor: { key: selection.anchor.key, offset: selection.anchor.offset },
          focus: { key: selection.focus.key, offset: selection.focus.offset }
        };
      }
    });

    this.#editorElement.focus();

    if (selectionState) {
      nextFrame().then(() => {
        this.#editor.update(() => {
          const selection = $getSelection();
          if (selection && $isRangeSelection(selection)) {
            selection.anchor.set(selectionState.anchor.key, selectionState.anchor.offset, "text");
            selection.focus.set(selectionState.focus.key, selectionState.focus.offset, "text");
          }
        }, { discrete: true });
      });
    }

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
    } else if (event.key === "ArrowDown") {
      this.#moveSelectionDown()
      event.preventDefault()
      event.stopPropagation()
    } else if (event.key === "ArrowUp") {
      this.#moveSelectionUp()
      event.preventDefault()
      event.stopPropagation()
    }
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
    if (event.key !== " ") event.preventDefault()
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

    const template = promptItem.querySelector("template[type='editor']")
    const stringToReplace = `${this.trigger}${this.#editorContents.textBackUntil(this.trigger)}`

    if (this.hasAttribute("insert-editable-text")) {
      this.#insertTemplateAsEditableText(template, stringToReplace)
    } else {
      this.#insertTemplateAsAttachment(promptItem, template, stringToReplace)
    }
  }

  #insertTemplateAsEditableText(template, stringToReplace) {
    this.#editor.update(() => {
      const nodes = $generateNodesFromDOM(this.#editor, parseHtml(`${template.innerHTML}`))
      this.#editorContents.replaceTextBackUntil(stringToReplace, nodes)
    })
  }

  #insertTemplateAsAttachment(promptItem, template, stringToReplace) {
    this.#editor.update(() => {
      const attachmentNode = new CustomActionTextAttachmentNode({ sgid: promptItem.getAttribute("sgid"), contentType: `application/vnd.actiontext.${this.name}`, innerHtml: template.innerHTML })
      this.#editorContents.replaceTextBackUntil(stringToReplace, attachmentNode)
    })
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
}

customElements.define("lexxy-prompt", LexicalPromptElement)
