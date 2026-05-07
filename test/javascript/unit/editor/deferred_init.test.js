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
})
