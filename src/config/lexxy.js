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
    toolbar: true,
    headings: [ "h1", "h2", "h3", "h4", "h5", "h6" ],
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
