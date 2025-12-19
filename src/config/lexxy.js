import Configuration from "./configuration"

const config = {
  global: new Configuration({
    attachmentTagName: "action-text-attachment"
  }),
  presets: new Configuration({
    default: {
      attachments: true,
      markdown: true,
      singleLine: false,
      toolbar: true,
    }
  })
}

export default config
export const configure = config.presets.merge.bind(config)
