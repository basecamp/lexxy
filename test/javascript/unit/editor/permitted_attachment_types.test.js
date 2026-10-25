import { afterEach, describe, expect, test } from "vitest"
import { createTestEditor, destroyTestEditor } from "../helpers/editor_helper"
import Lexxy from "src/config/lexxy"

let editorElement

afterEach(async () => {
  await destroyTestEditor(editorElement)
  Lexxy.configure({ default: { permittedAttachmentTypes: null } })
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

  test("reflects JS configuration", async () => {
    Lexxy.configure({ default: { permittedAttachmentTypes: [ "application/vnd.basecamp.mention" ] } })

    editorElement = await createTestEditor()

    expect([ ...editorElement.permittedAttachmentTypes ]).toEqual([ "application/vnd.basecamp.mention" ])
  })
})
