import { expect, test } from "vitest"
import { highlightCode } from "../../../../src/helpers/code_highlighting_helper"

const Prism = window.Prism

const expectedGrammars = [
  "clike",
  "markup",
  "markup-templating",
  "ruby",
  "php",
  "go",
  "bash",
  "json",
  "diff",
]

test.each(expectedGrammars)("Prism includes the %s grammar", (grammar) => {
  expect(Prism.languages[grammar]).toBeDefined()
})
