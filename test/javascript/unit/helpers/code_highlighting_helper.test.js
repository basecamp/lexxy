import { afterEach, expect, test } from "vitest"
import { highlightCode, highlightElement } from "../../../../src/helpers/code_highlighting_helper"

afterEach(() => {
  document.body.innerHTML = ""
})

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

test("highlightCode preserves the pre wrapper around the highlighted code element", () => {
  const pre = document.createElement("pre")
  pre.setAttribute("data-language", "javascript")
  pre.innerHTML = "const a = 1<br>const b = 2"
  document.body.appendChild(pre)

  highlightCode()

  expect(pre.textContent).toContain("const a = 1\nconst b = 2")
})

test("highlightCode only walks pre elements within the given root", () => {
  const inside = appendPre("inside", "javascript", "const a = 1")
  const outside = appendPre("outside", "javascript", "const b = 2")

  const scope = document.createElement("div")
  scope.appendChild(inside)
  document.body.appendChild(scope)
  document.body.appendChild(outside)

  highlightCode(scope)

  expect(inside.dataset.highlighted).toBe("true")
  expect(outside.dataset.highlighted).toBeUndefined()
})

test("highlightCode is idempotent — already-highlighted blocks are skipped", () => {
  const pre = appendPre("once", "javascript", "const a = 1")
  document.body.appendChild(pre)

  highlightCode()
  const firstPassHtml = pre.innerHTML

  highlightCode()

  expect(pre.innerHTML).toBe(firstPassHtml)
  expect(pre.dataset.highlighted).toBe("true")
})

test("highlightElement highlights a single pre element", () => {
  const pre = appendPre("single", "javascript", "const a = 1")
  document.body.appendChild(pre)

  highlightElement(pre)

  expect(pre.querySelector("span.token")).not.toBeNull()
  expect(pre.dataset.highlighted).toBe("true")
})

test("highlightElement preserves leading whitespace", () => {
  const pre = appendPre("indented", "ruby", "    def hello")
  document.body.appendChild(pre)

  highlightElement(pre)

  expect(pre.textContent).toBe("    def hello")
})

test("highlightElement preserves the alignment of an ASCII table with indented rows", () => {
  const table = "+----+----+\n  | ab | cd |\n  |  e |  f |"
  const pre = appendPre("ascii", "plain", table.replace(/\n/g, "<br>"))
  document.body.appendChild(pre)

  highlightElement(pre)

  expect(pre.textContent).toBe(table)
})

test("highlightElement keeps color highlights on the right text when code is indented", () => {
  const pre = appendPre("highlight", "ruby", "  def <mark style=\"background-color: yellow;\">hello</mark>")
  document.body.appendChild(pre)

  highlightElement(pre)

  const mark = pre.querySelector("mark")
  expect(mark.textContent).toBe("hello")
  expect(mark.getAttribute("style")).toContain("background-color: yellow")
})

function appendPre(id, language, code) {
  const pre = document.createElement("pre")
  pre.id = id
  pre.setAttribute("data-language", language)
  pre.innerHTML = code
  return pre
}
