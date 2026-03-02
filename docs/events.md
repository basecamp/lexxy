---
title: Events
layout: default
nav_order: 4
---

# Events

Lexxy fires a handful of custom events that you can hook into.
Each event is dispatched on the `<lexxy-editor>` element.

## `lexxy:initialize`

Fired when the `<lexxy-editor>` element is attached to the DOM and ready for use.
This is useful for one-time setup.

## `lexxy:focus` and `lexxy:blur`

Fired whenever the editor element gains or loses focus.
Useful to show or hide accessory UI state.

Lexxy considers the entire `<lexxy-editor>` element and associated toolbar as the editor, including any children. Focusing or interacting with a toolbar element from an editor with focus will not fire `lexxy:blur` or `lexxy:focus`.

## `lexxy:change`

Fired whenever the editor content changes.
You can use this to sync the editor state with your application.

## `lexxy:file-accept`

Fired when a file is dropped or inserted into the editor.

- Access the file via `event.detail.file`.
- Call `event.preventDefault()` to cancel the upload and prevent attaching the file.

## `lexxy:insert-link`

Fired when a plain text link is pasted into the editor.
Access the link's URL via `event.detail.url`.

You also get a handful of callback helpers on `event.detail`:

- **`replaceLinkWith(html, options)`** – replace the pasted link with your own HTML.
- **`insertBelowLink(html, options)`** – insert custom HTML below the link.
- **Attachment rendering** – pass `{ attachment: true }` in `options` to render as non-editable content,
  or `{ attachment: { sgid: "your-sgid-here" } }` to provide a custom SGID.

### Example: Link Unfurling with Stimulus

When a user pastes a link, you may want to turn it into a preview or embed.
Here's a Stimulus controller that sends the URL to your app, retrieves metadata,
and replaces the plain text link with a richer version:

```javascript
// app/javascript/controllers/link_unfurl_controller.js
import { Controller } from "@hotwired/stimulus"
import { post } from "@rails/request.js"

export default class extends Controller {
  static values = {
    url: String, // endpoint that handles unfurling
  }

  unfurl(event) {
    this.#unfurlLink(event.detail.url, event.detail)
  }

  async #unfurlLink(url, callbacks) {
    const { response } = await post(this.urlValue, {
      body: JSON.stringify({ url }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })

    const metadata = await response.json()
    this.#insertUnfurledLink(metadata, callbacks)
  }

  #insertUnfurledLink(metadata, callbacks) {
    // Replace the pasted link with your custom HTML
    callbacks.replaceLinkWith(this.#renderUnfurledLinkHTML(metadata))

    // Or, insert below the link as an attachment:
    // callbacks.insertBelowLink(this.#renderUnfurledLinkHTML(metadata), { attachment: true })
  }

  #renderUnfurledLinkHTML(link) {
    return `<a href="${link.canonical_url}">${link.title}</a>`
  }
}
```

## `lexxy:insert-markdown`

Fired when markdown text is pasted into the editor, before the converted HTML is inserted.
Access the original markdown via `event.detail.markdown` and the parsed DOM via `event.detail.document`.

The `document` is a live DOM `Document` — mutate it to change what gets inserted.
The `event.detail` object is frozen, but the document itself is open to mutation.
Only synchronous handlers can mutate before insertion.

You also get a helper on `event.detail`:

- **`addBlockSpacing()`** – insert `<p><br></p>` between top-level elements, but not after headings. Use this if your app CSS removes margins between paragraphs and you need visual spacing in the editor.

### Example: Removing Images

```javascript
editor.addEventListener("lexxy:insert-markdown", (event) => {
  event.detail.document.querySelectorAll("img").forEach((img) => img.remove())
})
```

### Example: Adding Block Spacing

```javascript
editor.addEventListener("lexxy:insert-markdown", (event) => {
  event.detail.addBlockSpacing()
})
```
