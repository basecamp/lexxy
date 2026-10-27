import { afterEach, expect, test, vi } from "vitest"
import { highlightCode, highlightElement } from "../../../../src/helpers/code_highlighting_helper"

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
  // Let the task end, closing highlightCode's time slice, so the next test
  // starts with a fresh budget.
  await new Promise(resolve => setTimeout(resolve, 10))
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

test("highlightCode yields to the event loop while blocks remain", async () => {
  const blocks = appendBlocks(8)
  advanceClockPerCall(5)

  const result = highlightCode()
  const highlightedSynchronously = countHighlighted(blocks)

  expect(typeof result.then).toBe("function")
  await result

  expect(highlightedSynchronously).toBeGreaterThan(0)
  expect(highlightedSynchronously).toBeLessThan(blocks.length)
  expect(countHighlighted(blocks)).toBe(blocks.length)
})

test("concurrent highlightCode calls share one time budget", async () => {
  const roots = Array.from({ length: 10 }, () => {
    const root = document.createElement("div")
    appendBlocks(1, root)
    document.body.appendChild(root)
    return root
  })
  const blocks = [ ...document.querySelectorAll("pre[data-language]") ]
  advanceClockPerCall(5)

  // Like one Stimulus controller per rendered rich text body, all connecting in
  // the same task. Separate loops would each spend a chunk before yielding.
  const results = roots.map(root => highlightCode(root))
  const highlightedSynchronously = countHighlighted(blocks)

  await Promise.all(results)

  expect(highlightedSynchronously).toBeLessThanOrEqual(2)
  expect(countHighlighted(blocks)).toBe(blocks.length)
})

test("highlightCode skips blocks removed from the root while it yields", async () => {
  const blocks = appendBlocks(8)
  advanceClockPerCall(5)

  const result = highlightCode()
  const removed = blocks.filter(pre => pre.dataset.highlighted !== "true")
  removed.forEach(pre => pre.remove())
  await result

  expect(removed.length).toBeGreaterThan(0)
  expect(countHighlighted(removed)).toBe(0)
})

test("highlightCode stops on a connected root that is detached while it yields", async () => {
  const root = document.createElement("div")
  const blocks = appendBlocks(8, root)
  document.body.appendChild(root)
  advanceClockPerCall(5)

  const result = highlightCode(root)
  const pending = blocks.filter(pre => pre.dataset.highlighted !== "true")
  root.remove()
  await result

  expect(pending.length).toBeGreaterThan(0)
  expect(countHighlighted(pending)).toBe(0)
})

test("highlightCode highlights a pending block moved to a new root and highlighted there", async () => {
  const oldRoot = document.createElement("div")
  const blocks = appendBlocks(8, oldRoot)
  document.body.appendChild(oldRoot)
  advanceClockPerCall(5)

  const firstRun = highlightCode(oldRoot)
  const moved = blocks.filter(pre => pre.dataset.highlighted !== "true")
  const newRoot = document.createElement("div")
  moved.forEach(pre => newRoot.appendChild(pre))
  document.body.appendChild(newRoot)

  await Promise.all([ firstRun, highlightCode(newRoot) ])

  expect(moved.length).toBeGreaterThan(0)
  expect(countHighlighted(moved)).toBe(moved.length)
})

test("highlightCode highlights a fragment's blocks after the fragment is inserted", async () => {
  const template = document.createElement("template")
  const blocks = appendBlocks(8, template.content)
  advanceClockPerCall(5)

  const result = highlightCode(template.content)
  document.body.appendChild(template.content)
  await result

  expect(countHighlighted(blocks)).toBe(blocks.length)
})

test("highlightCode highlights pending blocks moved elsewhere in the document", async () => {
  const root = document.createElement("div")
  const blocks = appendBlocks(8, root)
  document.body.appendChild(root)
  advanceClockPerCall(5)

  const result = highlightCode(root)
  const elsewhere = document.createElement("div")
  document.body.appendChild(elsewhere)
  blocks.filter(pre => pre.dataset.highlighted !== "true").forEach(pre => elsewhere.appendChild(pre))
  await result

  expect(countHighlighted(blocks)).toBe(blocks.length)
})

test("a block that fails to highlight doesn't stop the others", async () => {
  const reportError = vi.fn()
  vi.stubGlobal("reportError", reportError)
  const blocks = appendBlocks(8)
  const broken = blocks[1]
  Object.defineProperty(broken, "innerHTML", { set() { throw new Error("blocked sink") } })
  advanceClockPerCall(5)

  await highlightCode()

  expect(reportError).toHaveBeenCalledOnce()
  expect(countHighlighted(blocks)).toBe(blocks.length - 1)
  expect(broken.dataset.highlighted).toBeUndefined()
})

test("highlightCode highlights a root that was never connected", async () => {
  const root = document.createElement("div")
  const blocks = appendBlocks(8, root)
  advanceClockPerCall(5)

  await highlightCode(root)

  expect(countHighlighted(blocks)).toBe(blocks.length)
})

test("a failing block is logged where reportError is missing", async () => {
  vi.stubGlobal("reportError", undefined)
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
  const blocks = appendBlocks(3)
  Object.defineProperty(blocks[0], "innerHTML", { set() { throw new Error("blocked sink") } })

  await highlightCode()

  expect(consoleError).toHaveBeenCalledOnce()
  expect(countHighlighted(blocks)).toBe(2)
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

function appendBlocks(count, parent = document.body) {
  const code = Array.from({ length: 5 }, (_line, index) => `const value_${index} = compute(${index})`).join("<br>")
  return Array.from({ length: count }, (_block, index) => parent.appendChild(appendPre(`block-${index}`, "javascript", code)))
}

function countHighlighted(blocks) {
  return blocks.filter(pre => pre.dataset.highlighted === "true").length
}

// Makes every block cost `ms` of budget, so chunk boundaries don't depend on
// how fast the machine running the tests is.
function advanceClockPerCall(ms) {
  let now = 0
  vi.spyOn(performance, "now").mockImplementation(() => (now += ms))
}
