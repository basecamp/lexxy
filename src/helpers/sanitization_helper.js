import { DOMPurify, buildConfig } from "../config/dom_purify"

let currentHooks = {}
const registeredHookEvents = new Set()

export function setSanitizerConfig(allowedTags, allowedStyles = []) {
  const { config, hooks } = buildConfig(allowedTags, allowedStyles)

  currentHooks = hooks
  for (const event of Object.keys(hooks)) {
    ensureHookRegistered(event)
  }

  DOMPurify.clearConfig()
  DOMPurify.setConfig(config)
}

export function sanitize(html) {
  return DOMPurify.sanitize(html)
}

function ensureHookRegistered(event) {
  if (registeredHookEvents.has(event)) return

  DOMPurify.addHook(event, (...args) => {
    const hook = currentHooks[event]
    if (typeof hook === "function") return hook(...args)
  })

  registeredHookEvents.add(event)
}
