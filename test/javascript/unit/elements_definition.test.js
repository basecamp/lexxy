import { expect, test } from "vitest"
import { configure } from "src/index"

configure({ default: { attachments: false } })

// Microtasks run before the browser can paint; the next task (a zero-delay timer) may come after a paint.
await Promise.resolve()
const definedBeforeNextTask = customElements.get("lexxy-editor") !== undefined

test("defines the elements before the next task, so a page isn't painted before its editors exist", () => {
  expect(definedBeforeNextTask).toBe(true)
})
