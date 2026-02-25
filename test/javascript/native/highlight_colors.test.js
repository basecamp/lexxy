import { afterEach, describe, expect, test } from "vitest"
import { createTestEditorWithNativeAdapter, destroyTestEditor, captureEvent } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("highlight colors event", () => {
  test("dispatches event with color and background-color arrays", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    const event = await captureEvent(editorElement, "lexxy:highlight-colors", () => {
      editorElement.dispatchHighlightColors()
    })

    expect(event.detail.colors).toBeInstanceOf(Array)
    expect(event.detail.backgroundColors).toBeInstanceOf(Array)
  })

  test("each color entry has name and value properties", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    const event = await captureEvent(editorElement, "lexxy:highlight-colors", () => {
      editorElement.dispatchHighlightColors()
    })

    for (const color of event.detail.colors) {
      expect(color).toHaveProperty("name")
      expect(color).toHaveProperty("value")
    }

    for (const color of event.detail.backgroundColors) {
      expect(color).toHaveProperty("name")
      expect(color).toHaveProperty("value")
    }
  })

  test("color names correspond to CSS custom properties", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    const event = await captureEvent(editorElement, "lexxy:highlight-colors", () => {
      editorElement.dispatchHighlightColors()
    })

    // Default config uses var(--highlight-N) for colors
    for (const color of event.detail.colors) {
      expect(color.name).toMatch(/^var\(--highlight-\d+\)$/)
    }

    // Default config uses var(--highlight-bg-N) for background colors
    for (const color of event.detail.backgroundColors) {
      expect(color.name).toMatch(/^var\(--highlight-bg-\d+\)$/)
    }
  })
})
