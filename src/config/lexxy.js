import Configuration from "./configuration"
import { range } from "../helpers/array_helper.js"
import I18n from "./i18n"

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
      upload: "both"
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

const i18n = new I18n()

export default {
  global,
  presets,
  i18n,
  configure({ global: newGlobal, i18n: i18nConfig, ...newPresets }) {
    if (newGlobal) {
      global.merge(newGlobal)
    }
    if (i18nConfig) {
      const { locale, ...locales } = i18nConfig
      for (const [ name, translations ] of Object.entries(locales)) {
        i18n.registerLocale(name, translations)
      }
      if (locale) {
        i18n.locale = locale
      }
    }
    presets.merge(newPresets)
  }
}
