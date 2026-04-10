import "lexxy"

const root = document.getElementById("benchmark-root")
const READY_TIMEOUT_MS = 5_000
const SETTLE_FRAMES = 2
const ATTACHMENT_IMAGE_URL = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%23d8d5cf'/%3E%3Ccircle cx='48' cy='42' r='14' fill='%23998367'/%3E%3Crect x='24' y='72' width='112' height='18' rx='9' fill='%2376644f'/%3E%3C/svg%3E"
const WORD_BANK = [ "lexxy", "editor", "selection", "format", "table", "attachment", "toolbar", "cursor", "markdown", "history", "highlight", "command" ]

window.lexxyBenchmarks = {
  async prepare() {
    await customElements.whenDefined("lexxy-editor")
    await nextAnimationFrames(SETTLE_FRAMES)
  },

  browserMetadata() {
    return {
      deviceMemory: navigator.deviceMemory ?? null,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    }
  },

  async measureScenario(scenario) {
    if (scenario.kind === "bootstrap") {
      return measureBootstrap(scenario.options)
    }

    if (scenario.kind === "load") {
      return measureLoad(scenario.payload, scenario.editorAttributes)
    }

    throw new Error(`Unknown benchmark kind: ${scenario.kind}`)
  },
}

async function measureBootstrap(options = {}) {
  await clearRoot()

  const editorCount = options.editorCount ?? 1
  const editorAttributes = options.editorAttributes ?? {}
  const editors = []
  const initializationPromises = []

  for (let index = 0; index < editorCount; index += 1) {
    const editorElement = buildEditor(editorAttributes)
    editors.push(editorElement)
    initializationPromises.push(waitForEvent(editorElement, "lexxy:initialize"))
  }

  const startTime = performance.now()
  root.replaceChildren(...editors)

  await Promise.all(initializationPromises)
  await Promise.all(editors.map(waitForEditorReady))
  const durationMs = performance.now() - startTime

  return {
    details: {
      editorCount,
      renderedNodeCount: editors.reduce((count, editor) => count + editor.querySelectorAll("*").length, 0),
      toolbarCount: editors.filter((editor) => editor.toolbarElement).length,
    },
    durationMs,
  }
}

async function measureLoad(payload, editorAttributes = {}) {
  await clearRoot()

  const editorElement = await createReadyEditor(editorAttributes)
  const { details, html } = buildPayload(payload)
  const startTime = performance.now()

  editorElement.value = html
  await settleEditor(editorElement)
  const durationMs = performance.now() - startTime

  return {
    details: {
      ...details,
      htmlLength: html.length,
      renderedNodeCount: editorElement.querySelectorAll("*").length,
      serializedHtmlLength: editorElement.value.length,
      textLength: editorElement.toString().length,
    },
    durationMs,
  }
}

function buildPayload(payload) {
  if (payload.kind === "large-content") {
    return buildLargeContentPayload(payload)
  }

  if (payload.kind === "table") {
    return buildTablePayload(payload)
  }

  if (payload.kind === "attachments") {
    return buildAttachmentPayload(payload)
  }

  throw new Error(`Unknown payload kind: ${payload.kind}`)
}

function buildLargeContentPayload({ listItemsPerSection, paragraphsPerSection, sections, wordsPerParagraph }) {
  const html = Array.from({ length: sections }, (_item, sectionIndex) => {
    const headingLevel = (sectionIndex % 3) + 2
    const heading = `<h${headingLevel}>Section ${sectionIndex + 1}</h${headingLevel}>`
    const paragraphs = Array.from({ length: paragraphsPerSection }, (_paragraph, paragraphIndex) => {
      const offset = sectionIndex * paragraphsPerSection + paragraphIndex
      return `<p>${buildFormattedSentence(offset, wordsPerParagraph)}</p>`
    }).join("")
    const list = `<ul>${Array.from({ length: listItemsPerSection }, (_listItem, itemIndex) => `<li>${buildPlainSentence(sectionIndex + itemIndex, 12)}</li>`).join("")}</ul>`
    const quote = `<blockquote><p>${buildPlainSentence(sectionIndex + 1, 24)}</p></blockquote>`
    const code = `<pre><code class="language-js">const section${sectionIndex + 1} = "${buildCodeString(sectionIndex)}"</code></pre>`

    return `${heading}${paragraphs}${list}${quote}${code}`
  }).join("")

  return {
    details: {
      listItemsPerSection,
      paragraphsPerSection,
      sections,
      wordsPerParagraph,
    },
    html,
  }
}

function buildTablePayload({ columns, rows }) {
  const header = `<thead><tr>${Array.from({ length: columns }, (_item, columnIndex) => `<th>Column ${columnIndex + 1}</th>`).join("")}</tr></thead>`
  const body = `<tbody>${Array.from({ length: rows }, (_item, rowIndex) => `<tr>${Array.from({ length: columns }, (_cell, columnIndex) => `<td>R${rowIndex + 1}C${columnIndex + 1} ${buildPlainSentence(rowIndex + columnIndex, 8)}</td>`).join("")}</tr>`).join("")}</tbody>`

  return {
    details: {
      columns,
      rows,
      totalCells: rows * columns,
    },
    html: `<table>${header}${body}</table>`,
  }
}

function buildAttachmentPayload({ count }) {
  const html = Array.from({ length: count }, (_item, index) => {
    return [
      "<p>Attachment group</p>",
      `<action-text-attachment`,
      ` previewable="true"`,
      ` url="${ATTACHMENT_IMAGE_URL}"`,
      ` alt="Attachment ${index + 1}"`,
      ` caption="Attachment ${index + 1}"`,
      ` content-type="image/png"`,
      ` filename="attachment-${index + 1}.png"`,
      ` width="160"`,
      ` height="120">`,
      "</action-text-attachment>",
    ].join("")
  }).join("")

  return {
    details: {
      count,
    },
    html,
  }
}

function buildEditor(editorAttributes = {}) {
  const editorElement = document.createElement("lexxy-editor")
  editorElement.classList.add("lexxy-content")
  editorElement.setAttribute("placeholder", "Write something...")

  Object.entries(editorAttributes).forEach(([ name, value ]) => {
    if (value === false || value === null || value === undefined) return

    if (value === true) {
      editorElement.setAttribute(name, "true")
      return
    }

    editorElement.setAttribute(name, String(value))
  })

  return editorElement
}

async function createReadyEditor(editorAttributes = {}) {
  const editorElement = buildEditor(editorAttributes)
  const initialized = waitForEvent(editorElement, "lexxy:initialize")

  root.replaceChildren(editorElement)

  await initialized
  await waitForEditorReady(editorElement)

  return editorElement
}

async function waitForEditorReady(editorElement) {
  await waitForCondition(() => editorElement.hasAttribute("connected"))

  if (editorElement.toolbarElement) {
    await waitForCondition(() => editorElement.toolbarElement?.hasAttribute("connected"))
  }

  await settleEditor(editorElement)
}

function settleEditor(editorElement) {
  return new Promise((resolve) => {
    editorElement.editor.update(() => {}, {
      onUpdate: async () => {
        await nextAnimationFrames(SETTLE_FRAMES)
        resolve()
      },
    })
  })
}

async function clearRoot() {
  root.replaceChildren()
  await nextAnimationFrames(SETTLE_FRAMES)
}

function waitForEvent(target, eventName) {
  return new Promise((resolve) => {
    target.addEventListener(eventName, resolve, { once: true })
  })
}

function waitForCondition(predicate) {
  const startTime = performance.now()

  return new Promise((resolve, reject) => {
    const tick = () => {
      if (predicate()) {
        resolve()
        return
      }

      if ((performance.now() - startTime) > READY_TIMEOUT_MS) {
        reject(new Error("Benchmark fixture timed out while waiting for editor readiness"))
        return
      }

      requestAnimationFrame(tick)
    }

    tick()
  })
}

function nextAnimationFrames(frameCount) {
  let promise = Promise.resolve()

  for (let frame = 0; frame < frameCount; frame += 1) {
    promise = promise.then(() => new Promise((resolve) => requestAnimationFrame(resolve)))
  }

  return promise
}

function buildFormattedSentence(offset, wordCount) {
  const plainSentence = buildPlainSentence(offset, wordCount)

  return [
    `Paragraph ${offset + 1} uses`,
    `<strong>bold text</strong>,`,
    `<em>emphasis</em>,`,
    `<a href="https://example.com/sections/${offset + 1}">linked text</a>,`,
    `<mark style="color: var(--highlight-1)">highlighting</mark>,`,
    `${plainSentence}.`,
  ].join(" ")
}

function buildPlainSentence(offset, wordCount) {
  const words = []

  for (let index = 0; index < wordCount; index += 1) {
    words.push(WORD_BANK[(offset + index) % WORD_BANK.length])
  }

  return words.join(" ")
}

function buildCodeString(sectionIndex) {
  return `section-${sectionIndex + 1}-${buildPlainSentence(sectionIndex, 4).replaceAll(" ", "-")}`
}
