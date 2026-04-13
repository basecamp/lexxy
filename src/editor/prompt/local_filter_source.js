import BaseSource from "./base_source"
import { filterMatchPosition } from "../../helpers/string_helper"

const MAX_RENDERED_SUGGESTIONS = 100

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
    this.promptItemByListItem = new WeakMap()

    if (!filter) {
      return this.#buildAllListItems(promptItems)
    }

    const matches = []
    for (const promptItem of promptItems) {
      const searchableText = promptItem.getAttribute("search")
      const position = filterMatchPosition(searchableText, filter)
      if (position >= 0) {
        matches.push({ promptItem, position })
      }
    }

    matches.sort((a, b) => a.position - b.position)

    const listItems = []
    for (const { promptItem } of matches) {
      if (listItems.length >= MAX_RENDERED_SUGGESTIONS) break
      const listItem = this.buildListItemElementFor(promptItem)
      this.promptItemByListItem.set(listItem, promptItem)
      listItems.push(listItem)
    }
    return listItems
  }

  #buildAllListItems(promptItems) {
    const listItems = []
    for (const promptItem of promptItems) {
      if (listItems.length >= MAX_RENDERED_SUGGESTIONS) break
      const listItem = this.buildListItemElementFor(promptItem)
      this.promptItemByListItem.set(listItem, promptItem)
      listItems.push(listItem)
    }
    return listItems
  }
}
