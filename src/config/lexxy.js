import { deepMerge } from "../helpers/hash_helper"

const config = {
  global: {
    attachmentTagName: "action-text-attachment",
  },
  default: {
    attachments: true,
    markdown: true,
    multiline: true,
    toolbar: true,
  }
}

export function configure(changes) {
  deepMerge(config, changes)
}

export default config
