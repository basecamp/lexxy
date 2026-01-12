import Configuration from "./configuration"

const global = new Configuration({
  attachmentTagName: "action-text-attachment",
  authenticatedUploads: false
})

const presets = new Configuration({
  default: {
    attachments: true,
    markdown: true,
    multiLine: true,
    richText: true,
    toolbar: true,
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
