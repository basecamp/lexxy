import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor, tick } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("deferred initialization", () => {
  test("editor.getRootElement() is null until the next animation frame", async () => {
    editorElement = await createTestEditor({ skipTick: true })

    expect(editorElement.editor.getRootElement()).toBeNull()

    await tick()

    expect(editorElement.editor.getRootElement()).toBe(editorElement.editorContentElement)
  })

  test("restores valueBeforeDisconnect across disconnect/reconnect", async () => {
    editorElement = await createTestEditor({ value: "<p>initial</p>" })

    editorElement.value = "<p>edited content</p>"
    await tick()

    const parent = editorElement.parentNode
    parent.removeChild(editorElement)
    parent.appendChild(editorElement)
    await tick()

    expect(editorElement.value).toContain("edited content")
  })

  test("preserves external value set after connectedCallback returns but before rAF fires", async () => {
    editorElement = await createTestEditor({ value: "<p>initial</p>", skipTick: true })

    editorElement.value = "<p>external write</p>"

    await tick()

    expect(editorElement.value).toContain("external write")
  })

  test("preserves value attribute across synchronous disconnect/reconnect before rAF fires", async () => {
    editorElement = await createTestEditor({ value: "<p>initial</p>", skipTick: true })

    const parent = editorElement.parentNode
    parent.removeChild(editorElement)
    parent.appendChild(editorElement)

    await tick()

    expect(editorElement.value).toContain("initial")
  })

  test("does not steal focus when value is set externally before rAF fires", async () => {
    editorElement = await createTestEditor({ value: "<p>initial</p>", skipTick: true })

    let focusEvents = 0
    editorElement.addEventListener("lexxy:focus", () => focusEvents++)

    editorElement.value = "<p>external write</p>"

    await tick()

    expect(focusEvents).toBe(0)
  })

  test("value is loaded synchronously so background-tab forms still submit content", async () => {
    editorElement = await createTestEditor({ value: "<p>initial</p>", skipTick: true })

    expect(editorElement.value).toContain("initial")
  })

  test("formResetCallback restores initial value before first frame", async () => {
    editorElement = await createTestEditor({ value: "<p>initial</p>", skipTick: true })

    editorElement.value = "<p>edited</p>"
    editorElement.formResetCallback()

    expect(editorElement.value).toContain("initial")
  })

  test("stale rAF firing while disconnected does not poison state on reconnect", async () => {
    editorElement = await createTestEditor({ value: "<p>initial</p>", skipTick: true })

    editorElement.value = "<p>external</p>"

    const parent = editorElement.parentNode
    parent.removeChild(editorElement)

    await tick()

    parent.appendChild(editorElement)
    await tick()

    expect(editorElement.value).toContain("external")
  })
})
