import BaseSource from "./base_source"
import { debounceAsync } from "../../helpers/timing_helpers"

const DEBOUNCE_INTERVAL = 200

export default class RemoteFilterSource extends BaseSource {
  constructor(url) {
    super()

    this.baseURL = url
    this.loadAndFilterListItems = debounceAsync(this.fetchFilteredListItems.bind(this), DEBOUNCE_INTERVAL)
  }

  async buildListItems(filter = "") {
    return await this.loadAndFilterListItems(filter)
  }

  promptItemFor(listItem) {
    return this.promptItemByListItem.get(listItem)
  }

  async fetchFilteredListItems(filter) {
    const promptItems = await this.loadPromptItemsFromUrl(this.#urlFor(filter))
    return this.#buildListItemsFromPromptItems(promptItems)
  }

  #urlFor(filter) {
    const url = new URL(this.baseURL, window.location.origin)
    url.searchParams.append("filter", filter)
    return url.toString()
  }

  #buildListItemsFromPromptItems(promptItems) {
    const listItems = []
    this.promptItemByListItem = new WeakMap()

    for (const promptItem of promptItems) {
      const listItem = this.buildListItemElementFor(promptItem)
      this.promptItemByListItem.set(listItem, promptItem)
      listItems.push(listItem)
    }

    return listItems
  }
}
