import { $getRoot } from "lexical"
import { defineElements } from "../../../src/elements/index"

let elementsRegistered = false

function ensureElementsRegistered() {
  if (elementsRegistered) return
  elementsRegistered = true
  stubElementInternals()
  defineElements()
}

// jsdom doesn't fully support ElementInternals (setFormValue, setValidity, labels)
function stubElementInternals() {
  const originalAttachInternals = HTMLElement.prototype.attachInternals
  HTMLElement.prototype.attachInternals = function() {
    const internals = originalAttachInternals.call(this)
    internals.setFormValue ??= () => {}
    internals.setValidity ??= () => {}
    if (!internals.labels) {
      Object.defineProperty(internals, "labels", { get: () => [] })
    }
    return internals
  }
}

export async function createTestEditor(options = {}) {
  ensureElementsRegistered()

  const element = document.createElement("lexxy-editor")
  element.setAttribute("toolbar", "false")

  if (options.value) {
    element.setAttribute("value", options.value)
  }

  document.body.appendChild(element)

  // Wait for requestAnimationFrame callbacks (lexxy:initialize, dispatchHighlightColors)
  await tick()

  return element
}

export async function destroyTestEditor(element) {
  element?.remove()
  // Let pending requestAnimationFrame callbacks settle after disconnectedCallback
  await tick()
}

export async function setContent(editorElement, html) {
  editorElement.value = html
  await tick()
}

export function selectAll(editorElement) {
  editorElement.editor.update(() => {
    const root = $getRoot()
    const firstDescendant = root.getFirstDescendant()
    const lastDescendant = root.getLastDescendant()
    if (firstDescendant && lastDescendant) {
      const selection = firstDescendant.select(0, 0)
      selection.focus.set(lastDescendant.getKey(), lastDescendant.getTextContentSize(), "text")
    }
  })
}

export function selectEnd(editorElement) {
  editorElement.editor.update(() => {
    $getRoot().selectEnd()
  })
}

export function captureEvent(element, eventName, fn) {
  return new Promise((resolve) => {
    element.addEventListener(eventName, (event) => resolve(event), { once: true })
    fn()
  })
}

export function tick() {
  // jsdom implements requestAnimationFrame as setTimeout(cb, ~16ms).
  // We need to wait for RAFs to fire (e.g., from connectedCallback, value setter).
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)))
}
