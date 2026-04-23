import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor } from "../helpers/editor_helper"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
})

describe("permittedAttachmentTypes getter", () => {
  test("returns a frozen array so hosts cannot mutate internal state", async () => {
    editorElement = await createTestEditor({
      attributes: { "permitted-attachment-types": "application/vnd.basecamp.mention" }
    })

    const list = editorElement.permittedAttachmentTypes

    expect(Object.isFrozen(list)).toBe(true)
    expect(() => list.push("image/png")).toThrow(TypeError)
  })
})
