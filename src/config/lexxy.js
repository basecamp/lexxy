import Configuration from "./configuration"

const config = new Configuration({
  global: {
    attachmentTagName: "action-text-attachment"
  },
  default: {
    attachments: true,
    markdown: true,
    singleLine: false,
    toolbar: true,
  }
})

export default config
export const configure = config.merge.bind(config)
