import { createElement, generateDomId, parseHtml } from "../../helpers/html_helper"
import { filterMatchPosition } from "../../helpers/string_helper"

export default class BaseSource {
  // Template method to override
  async buildListItems(filter = "") {
    return Promise.resolve([])
  }

  // Template method to override
  promptItemFor(listItem) {
    return null
  }

  listItemMatches(listItem, filter) {
    return this.matchPosition(this.promptItemFor(listItem), filter) >= 0
  }

  // Protected

  matchPosition(promptItem, filter) {
    return filterMatchPosition(this.#searchableText(promptItem), filter)
  }

  buildListItemElementFor(promptItemElement) {
    const template = promptItemElement.querySelector("template[type='menu']")
    const fragment = template.content.cloneNode(true)
    const listItemElement = createElement("li", { role: "option", id: generateDomId("prompt-item"), tabindex: "0" })
    listItemElement.classList.add("lexxy-prompt-menu__item")
    listItemElement.appendChild(fragment)
    return listItemElement
  }

  async loadPromptItemsFromUrl(url) {
    try {
      const response = await fetch(url)
      const html = await response.text()
      const promptItems = parseHtml(html).querySelectorAll("lexxy-prompt-item")
      return Promise.resolve(Array.from(promptItems))
    } catch (error) {
      return Promise.reject(error)
    }
  }

  #searchableText(promptItem) {
    return promptItem.getAttribute("search") ?? promptItem.querySelector("template[type='menu']").content.textContent
  }
}
