import { expect, test } from "vitest"
import { highlightCode } from "../../../../src/helpers/code_highlighting_helper"

const Prism = window.Prism

const expectedGrammars = [
  // lexical default
  "clike",
  "markup",
  "diff",
  "clike",
  "diff",
  "javascript",
  "markup",
  "markdown",
  "c",
  "css",
  "objectivec",
  "sql",
  "powershell",
  "python",
  "rust",
  "swift",
  "typescript",
  "java",
  "cpp",
  // extra languages
  "markup-templating",
  "ruby",
  "php",
  "go",
  "bash",
  "json",
  "kotlin"
]

test.each(expectedGrammars)("Prism includes the %s grammar", (grammar) => {
  expect(Prism.languages[grammar]).toBeDefined()
})
