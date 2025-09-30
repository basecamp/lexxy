import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  unfurl(event) {
    const url = new URL(event.detail.url)
    const params = new URLSearchParams(url.search)

    const options = {}
    if (params.get("attachment") === "true") {
      options.attachment = true
    }

    const html = `<div style="border: 1px solid #ccc; padding: 8px;">Link Preview: ${event.detail.url}</div>`

    if (params.get("action") === "replace") {
      event.detail.replaceLinkWith(html, options)
    } else if (params.get("action") === "insert") {
      event.detail.insertBelowLink(html, options)
    }
  }
}
