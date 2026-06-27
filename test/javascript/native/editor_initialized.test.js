import { afterEach, describe, expect, test } from "vitest"
import { createTestEditorWithNativeAdapter, destroyTestEditor, captureEvent } from "../unit/helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("editor initialized event", () => {
  test("dispatches event with highlight colors", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    const event = await captureEvent(editorElement, "lexxy:editor-initialized", () => {
      editorElement.dispatchEditorInitialized()
    })

    expect(event.detail.highlightColors.colors).toBeInstanceOf(Array)
    expect(event.detail.highlightColors.backgroundColors).toBeInstanceOf(Array)
    expect(event.detail.headingFormats).toBeInstanceOf(Array)
  })

  test("each color entry has name, value, and label properties", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    const event = await captureEvent(editorElement, "lexxy:editor-initialized", () => {
      editorElement.dispatchEditorInitialized()
    })

    const { colors, backgroundColors } = event.detail.highlightColors
    for (const color of [ ...colors, ...backgroundColors ]) {
      expect(color).toHaveProperty("name")
      expect(color).toHaveProperty("value")
      expect(color).toHaveProperty("label")
    }

    expect(colors[0].label).toBe("Yellow")
    expect(backgroundColors[0].label).toBe("Yellow")
  })

  test("color names correspond to CSS custom properties", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    const event = await captureEvent(editorElement, "lexxy:editor-initialized", () => {
      editorElement.dispatchEditorInitialized()
    })

    // Default config uses var(--highlight-N) for colors
    for (const color of event.detail.highlightColors.colors) {
      expect(color.name).toMatch(/^var\(--highlight-\d+\)$/)
    }

    // Default config uses var(--highlight-bg-N) for background colors
    for (const color of event.detail.highlightColors.backgroundColors) {
      expect(color.name).toMatch(/^var\(--highlight-bg-\d+\)$/)
    }
  })

  test("dispatches heading formats with command and tag", async () => {
    editorElement = await createTestEditorWithNativeAdapter()

    const event = await captureEvent(editorElement, "lexxy:editor-initialized", () => {
      editorElement.dispatchEditorInitialized()
    })

    expect(event.detail.headingFormats).toEqual([
      { label: "Normal", command: "setFormatParagraph", tag: null },
      { label: "Large Heading", command: "applyHeadingFormat", tag: "h2" },
      { label: "Medium Heading", command: "applyHeadingFormat", tag: "h3" },
      { label: "Small Heading", command: "applyHeadingFormat", tag: "h4" },
    ])
  })
})
