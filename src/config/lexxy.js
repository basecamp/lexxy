import Configuration from "./configuration"

const global = new Configuration({
  attachmentTagName: "action-text-attachment"
})

const presets = new Configuration({
  default: {
    attachments: true,
    markdown: true,
    multiline: true,
    toolbar: true,
  }
})

export default {
  global,
  presets,
  configure(changes) {
    return presets.merge(changes)
  }
}
