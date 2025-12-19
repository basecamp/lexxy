import Configuration from "./configuration"

export const DEFAULT_PRESET = {
  attachments: true,
  markdown: true,
  singleLine: false,
  toolbar: true,
}

const configuration = {
  global: new Configuration({
    attachmentTagName: "action-text-attachment"
  }),
  presets: new Configuration({ default: DEFAULT_PRESET })
}

export function configure(changes) {
  return configuration.presets.merge(changes)
}

export default configuration
