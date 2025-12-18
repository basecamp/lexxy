import Configuration from "./configuration"

export const DEFAULT_PRESET = {
  attachments: true,
  markdown: true,
  singleLine: false,
  toolbar: true,
}

const configuration = {
  global: new Configuration({
    attachmentTagName: "action-text-attachment",
    highlight: {
      color: {
        buttons: range(1, 9).map(n => `var(--highlight-${n})`),
        permit: []
      },
      "background-color": {
        buttons: range(1, 9).map(n => `var(--highlight-bg-${n})`),
        permit: []
      }
    }
  }),
  presets: new Configuration({ default: DEFAULT_PRESET })
}

export function configure(changes) {
  return configuration.presets.merge(changes)
}

export default configuration

function range(from, to) {
  return [ ...Array(1 + to - from).keys() ].map(i => i + from)
}
