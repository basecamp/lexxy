import { expect, test } from "vitest"
import { assignHeadingIds } from "../../../src/helpers/heading_id_helper"

test("assigns ID to heading", () => {
  const html = "<h2>Hello World</h2>"
  const result = assignHeadingIds(html)
  expect(result).toBe('<h2 id="hello-world">Hello World</h2>')
})

test("handles duplicate headings", () => {
  const html = "<h2>Intro</h2><h2>Intro</h2><h2>Intro</h2>"
  const result = assignHeadingIds(html)
  expect(result).toContain('id="intro"')
  expect(result).toContain('id="intro-1"')
  expect(result).toContain('id="intro-2"')
})

test("skips headings with no alphanumeric content", () => {
  const html = "<h2></h2>"
  const result = assignHeadingIds(html)
  expect(result).not.toContain('id=')
})
