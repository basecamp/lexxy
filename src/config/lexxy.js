import Configuration from "./configuration"
import { range } from "../helpers/array_helper.js"

const global = new Configuration({
  attachmentTagName: "action-text-attachment",
  attachmentContentTypeNamespace: "actiontext",
  authenticatedUploads: false,
  extensions: []
})

const presets = new Configuration({
  default: {
    attachments: true,
    markdown: true,
    multiLine: true,
    richText: true,
    toolbar: {
      items: [
        "image",
        "file",
        "|",
        "bold",
        "italic",
        { name: "format", icon: "heading", label: "Text formatting", items: [
            "paragraph",
            "heading-large",
            "heading-medium",
            "heading-small",
            "|",
            "strikethrough",
            "underline",
          ]
        },
        { name: "lists", icon: "ul", label: "Lists", items: [
            "unordered-list",
            "ordered-list",
          ]
        },
        "highlight",
        "link",
        "quote",
        "code",
        "|",
        "table",
        "divider",
        "~",
        "undo",
        "redo",
      ]
    },
    highlight: {
      buttons: {
        color: range(1, 9).map(n => `var(--highlight-${n})`),
        "background-color": range(1, 9).map(n => `var(--highlight-bg-${n})`),
      },
      permit: {
        color: [],
        "background-color": []
      }
    }
  }
})

export default {
  global,
  presets,
  configure({ global: newGlobal, ...newPresets }) {
    if (newGlobal) {
      global.merge(newGlobal)
    }
    presets.merge(newPresets)
  }
}
