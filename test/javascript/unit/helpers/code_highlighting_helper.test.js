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

test("highlightCode preserves the pre wrapper around the highlighted code element", async () => {
  const pre = document.createElement("pre")
  pre.setAttribute("data-language", "javascript")
  pre.innerHTML = "const a = 1<br>const b = 2"
  document.body.appendChild(pre)

  await highlightCode()

  expect(pre.textContent).toContain("const a = 1\nconst b = 2")
})

test("highlightCode only walks pre elements within the given root", async () => {
  const inside = appendPre("inside", "javascript", "const a = 1")
  const outside = appendPre("outside", "javascript", "const b = 2")

  const scope = document.createElement("div")
  scope.appendChild(inside)
  document.body.appendChild(scope)
  document.body.appendChild(outside)

  await highlightCode(scope)

  expect(inside.dataset.highlighted).toBe("true")
  expect(outside.dataset.highlighted).toBeUndefined()
})

test("highlightCode is idempotent — already-highlighted blocks are skipped", async () => {
  const pre = appendPre("once", "javascript", "const a = 1")
  document.body.appendChild(pre)

  await highlightCode()
  const firstPassHtml = pre.innerHTML

  await highlightCode()

  expect(pre.innerHTML).toBe(firstPassHtml)
  expect(pre.dataset.highlighted).toBe("true")
})

test("highlightCode yields to the event loop while highlighting every block", async () => {
  const code = Array.from({ length: 30 }, (_line, index) =>
    `const value_${index} = compute(${index}, "token string", [ 1, 2, 3 ]) // comment ${index}`
  ).join("<br>")

  for (let index = 0; index < 8; index += 1) {
    document.body.appendChild(appendPre(`block-${index}`, "javascript", code))
  }

  // A macrotask queued just before highlighting starts must get a chance to run
  // before highlightCode resolves. A single synchronous pass would block the
  // main thread and only let it run after completion.
  let macrotaskRan = false
  const result = highlightCode()
  setTimeout(() => { macrotaskRan = true }, 0)

  expect(typeof result.then).toBe("function")
  await result

  expect(macrotaskRan).toBe(true)

  for (const pre of document.querySelectorAll("pre[data-language]")) {
    expect(pre.dataset.highlighted).toBe("true")
  }
})

test("highlightCode skips blocks removed from the root while it yields", async () => {
  const code = Array.from({ length: 30 }, (_line, index) =>
    `const value_${index} = compute(${index}, "token string", [ 1, 2, 3 ]) // comment ${index}`
  ).join("<br>")

  const blocks = Array.from({ length: 40 }, (_block, index) => appendPre(`block-${index}`, "javascript", code))
  blocks.forEach(pre => document.body.appendChild(pre))

  const result = highlightCode()
  const removed = blocks.filter(pre => pre.dataset.highlighted !== "true")
  removed.forEach(pre => pre.remove())
  await result

  expect(removed.length).toBeGreaterThan(0)
  for (const pre of removed) {
    expect(pre.dataset.highlighted).toBeUndefined()
  }
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

test("highlightElement keeps links on the right text", () => {
  const pre = appendPre("linked", "javascript", "const a = 1<br>see <a href=\"https://example.com/\">the docs</a> here")
  document.body.appendChild(pre)

  highlightElement(pre)

  const anchors = Array.from(pre.querySelectorAll("a[href='https://example.com/']"))
  expect(anchors.map((anchor) => anchor.textContent).join("")).toBe("the docs")
  expect(pre.textContent).toBe("const a = 1\nsee the docs here")
})

test("highlightElement keeps a link overlapping a color highlight", () => {
  const pre = appendPre("linkmark", "ruby", "def <a href=\"https://example.com/\"><mark style=\"background-color: yellow;\">hello</mark></a>")
  document.body.appendChild(pre)

  highlightElement(pre)

  const anchors = Array.from(pre.querySelectorAll("a[href='https://example.com/']"))
  expect(anchors.map((anchor) => anchor.textContent).join("")).toBe("hello")
  expect(pre.querySelector("mark").textContent).toBe("hello")
})

function appendPre(id, language, code) {
  const pre = document.createElement("pre")
  pre.id = id
  pre.setAttribute("data-language", language)
  pre.innerHTML = code
  return pre
}
