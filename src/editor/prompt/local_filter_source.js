import BaseSource from "./base_source"
import { filterMatches } from "../../helpers/string_helper"

const MAX_RENDERED_SUGGESTIONS = 50

export default class LocalFilterSource extends BaseSource {
  async buildListItems(filter = "") {
    const promptItems = await this.fetchPromptItems()
    return this.#buildListItemsFromPromptItems(promptItems, filter)
  }

  // Template method to override
  async fetchPromptItems(filter) {
    return Promise.resolve([])
  }

  promptItemFor(listItem) {
    return this.promptItemByListItem.get(listItem)
  }

  #buildListItemsFromPromptItems(promptItems, filter) {
    const listItems = []
    this.promptItemByListItem = new WeakMap()

    for (const promptItem of promptItems) {
      if (listItems.length >= MAX_RENDERED_SUGGESTIONS) break

      const searchableText = promptItem.getAttribute("search")

      if (!filter || filterMatches(searchableText, filter)) {
        const listItem = this.buildListItemElementFor(promptItem)
        this.promptItemByListItem.set(listItem, promptItem)
        listItems.push(listItem)
      }
    }

    return listItems
  }
}
