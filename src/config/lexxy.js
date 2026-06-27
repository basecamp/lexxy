import Configuration from "./configuration"

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
    permittedAttachmentTypes: null,
    richText: true,
    toolbar: {
      upload: "both"
    },
    highlight: {
      buttons: {
        color: [
          { value: "var(--highlight-1)", label: "Yellow" },
          { value: "var(--highlight-2)", label: "Orange" },
          { value: "var(--highlight-3)", label: "Red" },
          { value: "var(--highlight-4)", label: "Magenta" },
          { value: "var(--highlight-5)", label: "Purple" },
          { value: "var(--highlight-6)", label: "Blue" },
          { value: "var(--highlight-7)", label: "Green" },
          { value: "var(--highlight-8)", label: "Sand" },
          { value: "var(--highlight-9)", label: "Gray" },
        ],
        "background-color": [
          { value: "var(--highlight-bg-1)", label: "Yellow" },
          { value: "var(--highlight-bg-2)", label: "Orange" },
          { value: "var(--highlight-bg-3)", label: "Red" },
          { value: "var(--highlight-bg-4)", label: "Magenta" },
          { value: "var(--highlight-bg-5)", label: "Purple" },
          { value: "var(--highlight-bg-6)", label: "Blue" },
          { value: "var(--highlight-bg-7)", label: "Green" },
          { value: "var(--highlight-bg-8)", label: "Sand" },
          { value: "var(--highlight-bg-9)", label: "Gray" },
        ],
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
