import en from "./locales/en"

export default class I18n {
  #locale
  #registry

  constructor(locales = {}, defaultLocale = "en") {
    this.#locale = defaultLocale
    this.#registry = { en, ...locales }
  }

  get locale() { return this.#locale }
  set locale(value) { this.#locale = value }

  registerLocale(name, translations) {
    this.#registry[name] = translations
  }

  t(path, values = {}) {
    let result = resolve(this.#registry[this.#locale], path)

    if (result === undefined && this.#locale !== "en") {
      result = resolve(this.#registry.en, path)
    }

    if (result === undefined) return path

    if (result && typeof result === "object") {
      if (!("count" in values)) return path
      const rule = selectPluralForm(this.#locale, values.count)
      result = result[rule] ?? result.other ?? path
    }

    if (typeof result === "string") {
      return interpolate(result, values)
    }

    return path
  }
}

const pluralRulesCache = {}

function resolve(tree, path) {
  return path.split(".").reduce((node, key) => node?.[key], tree)
}

function selectPluralForm(locale, count) {
  pluralRulesCache[locale] ??= new Intl.PluralRules(locale)
  return pluralRulesCache[locale].select(count)
}

function interpolate(str, values) {
  return str.replace(/%\{(\w+)\}/g, (_, key) => values[key] ?? `%{${key}}`)
}
