import { test as base } from "@playwright/test"
import { EditorHandle } from "./helpers/editor_handle.js"

export const test = base.extend({
  editor: async ({ page }, use) => {
    await use(new EditorHandle(page))
  },
})
