import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { selectAttachment } from "../../helpers/attachment_helpers.js"

const AUDIO = '<action-text-attachment sgid="audio" content-type="audio/mpeg" filename="example.mp3" caption="Example"></action-text-attachment>'

test.beforeEach(async ({ page, editor }) => {
  await page.goto("/attachment-controls.html")
  await page.waitForSelector("lexxy-editor[connected]")
  await editor.setValue(`<p>Before</p>${AUDIO}<p>After</p>`)
  await editor.flush()
})

test("custom controls stay available outside the textbox before the attachment is selected", async ({ page, editor }) => {
  const play = page.getByRole("button", { name: "Play Example", exact: true })
  await expect(play).toBeVisible()
  await expect(editor.content.getByRole("button")).toHaveCount(0)
  await expect(page.getByRole("toolbar", { name: "Audio controls: Example", exact: true }).getByRole("button", { name: "Remove", exact: true })).toBeHidden()
  await play.click()
  await expect(page.getByRole("button", { name: "Pause Example", exact: true })).toBeFocused()
})

test("controls inherit theme changes without retaining resolved colors and fonts", async ({ page, editor }) => {
  await page.addStyleTag({ content: "lexxy-editor { color: rgb(20, 30, 40); } .audio-controls, .audio-controls button { color: inherit; font: inherit; }" })
  await editor.setValue(AUDIO)
  const play = page.getByRole("button", { name: "Play Example", exact: true })
  await expect(play).toHaveCSS("color", "rgb(20, 30, 40)")
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.locator("lexxy-editor").evaluate(element => {
    element.style.color = "rgb(220, 230, 240)"
  })
  await expect(play).toHaveCSS("color", "rgb(220, 230, 240)")
  await page.locator("lexxy-editor").evaluate(element => element.style.fontFamily = "serif")
  await expect(play).toHaveCSS("font-family", "serif")
})

test("controls can retain separate playback and progress positions", async ({ page, editor }) => {
  const preview = await editor.content.locator(".audio-preview").boundingBox()
  const play = page.getByRole("button", { name: "Play Example", exact: true })
  await expect(play).toBeVisible()
  await expect.poll(async () => {
    const box = await play.boundingBox()
    return Math.max(Math.abs(box.x - preview.x), Math.abs(box.y - preview.y), Math.abs(box.width - preview.width), Math.abs(box.height - preview.height))
  }).toBeLessThanOrEqual(1)
  const anchor = await editor.content.locator(".audio-progress-anchor").boundingBox()
  const progress = page.locator("lexxy-attachment-toolbar .audio-progress")
  await expect.poll(async () => {
    const box = await progress.boundingBox()
    return Math.max(Math.abs(box.x - anchor.x), Math.abs(box.y - anchor.y), Math.abs(box.width - anchor.width), Math.abs(box.height - anchor.height))
  }).toBeLessThanOrEqual(1)
})

test("seeking selects the attachment without moving focus away from the editor", async ({ page, editor }) => {
  await editor.content.locator("p").first().click()
  await page.locator("lexxy-attachment-toolbar .audio-progress").click()
  await expect(editor.content.locator("figure")).toHaveClass(/node--selected/)
  await page.keyboard.press("Alt+F10")
  await expect(page.getByRole("button", { name: "Play Example", exact: true })).toBeFocused()
})

test("the attachment toolbar owns keyboard navigation and Tab still reaches the caption", async ({ page, editor }) => {
  await selectAttachment(editor.content.locator("figure"))
  await page.keyboard.press("Alt+F10")
  await expect(page.getByRole("button", { name: "Play Example", exact: true })).toBeFocused()
  await page.keyboard.press("Space")
  await expect(page.getByRole("button", { name: "Pause Example", exact: true })).toBeFocused()
  await page.keyboard.press("End")
  await expect(page.getByRole("toolbar", { name: "Audio controls: Example", exact: true }).getByRole("button", { name: "Remove", exact: true })).toBeFocused()
  await page.keyboard.press("Home")
  await expect(page.getByRole("button", { name: "Pause Example", exact: true })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.locator(".lexxy-caption-editor")).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(editor.content).toBeFocused()
  await page.keyboard.press("Alt+F10")
  await page.keyboard.press("Escape")
  await expect(editor.content).toBeFocused()
  await expect.poll(() => page.evaluate(() => getSelection().toString())).toBe("Example")
  await page.keyboard.press("Tab")
  await expect(page.locator(".lexxy-caption-editor")).toBeFocused()
})

test("removing and undoing an attachment disposes and recreates its external controls", async ({ page, editor }) => {
  await selectAttachment(editor.content.locator("figure"))
  await page.keyboard.press("Alt+F10")
  await page.keyboard.press("End")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("button", { name: "Play Example", exact: true })).toHaveCount(0)
  await expect(editor.content).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.controlsDisposed)).toBe(1)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(page.getByRole("button", { name: "Play Example", exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.controlsCreated)).toBe(2)
})

test("selected controls remain reachable when the editor is read-only", async ({ page, editor }) => {
  await selectAttachment(editor.content.locator("figure"))
  await page.evaluate(() => document.querySelector("lexxy-editor").editor.setEditable(false))
  await page.keyboard.press("Alt+F10")
  await expect(page.getByRole("button", { name: "Play Example", exact: true })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.locator(".lexxy-caption-editor")).toBeFocused()
})

test("Tab from a selected attachment still opens its caption in a read-only editor", async ({ page, editor }) => {
  await selectAttachment(editor.content.locator("figure"))
  await page.evaluate(() => document.querySelector("lexxy-editor").editor.setEditable(false))
  await page.keyboard.press("Tab")
  await expect(page.locator(".lexxy-caption-editor")).toBeFocused()
})

test("returning focus to a selected attachment restores its range in a noneditable root", async ({ page, editor }) => {
  await editor.setValue(AUDIO)
  await editor.content.evaluate(element => element.querySelectorAll("p").forEach(paragraph => paragraph.style.display = "none"))
  await selectAttachment(editor.content.locator("figure"))
  await page.evaluate(() => document.querySelector("lexxy-editor").editor.setEditable(false))
  await page.getByRole("button", { name: "Before editor", exact: true }).click()
  await page.evaluate(() => window.attachmentLabel = "Example updated")
  await editor.content.focus()
  await expect.poll(() => page.evaluate(() => getSelection().toString())).toBe("Example updated")
})

test("new controls from an attachment update join toolbar navigation", async ({ page, editor }) => {
  await selectAttachment(editor.content.locator("figure"))
  await page.keyboard.press("Tab")
  await page.locator(".lexxy-caption-editor").fill("With mute")
  await page.keyboard.press("Escape")
  await page.keyboard.press("Alt+F10")
  await page.keyboard.press("ArrowRight")
  await expect(page.getByRole("button", { name: "Mute", exact: true })).toBeFocused()
})

test("hiding and showing an editor retains its controls without positioning errors", async ({ page }) => {
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  const toggle = page.getByRole("button", { name: "Toggle editor", exact: true })
  await toggle.click()
  await expect(page.locator("lexxy-editor")).toBeHidden()
  await toggle.click()
  await expect(page.getByRole("button", { name: "Play Example", exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test("controls respect the editor scrollport and keyboard focus reveals their attachment", async ({ page, editor }) => {
  await editor.setValue(`<p>${"Before<br>".repeat(12)}</p>${AUDIO}<p>${"After<br>".repeat(20)}</p>`)
  await editor.content.evaluate(element => {
    element.style.maxHeight = "150px"
    element.style.overflow = "auto"
  })
  await selectAttachment(editor.content.locator("figure"))
  const viewport = await editor.content.boundingBox()
  const before = await editor.content.evaluate(element => element.scrollTop)
  await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + 20)
  await page.mouse.wheel(0, 160)
  await expect.poll(() => editor.content.evaluate(element => element.scrollTop)).toBeGreaterThan(before)
  const play = page.getByRole("button", { name: "Play Example", exact: true })
  await expect.poll(async () => {
    const box = await play.boundingBox()
    return box.y + box.height / 2
  }).toBeLessThan(viewport.y)
  await expect.poll(() => play.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === element
  })).toBe(false)
  await page.keyboard.press("Alt+F10")
  await expect(play).toBeFocused()
  await expect.poll(async () => (await play.boundingBox()).y).toBeGreaterThanOrEqual(viewport.y - 1)
})

test("a standalone field retains native navigation without an extra group or toolbar", async ({ page, editor }) => {
  await page.goto("/attachment-controls.html?field")
  await page.waitForSelector("lexxy-editor[connected]")
  await editor.setValue(AUDIO)
  const native = await page.evaluateHandle(() => {
    const input = document.body.appendChild(document.createElement("input"))
    input.value = "0:00"
    input.readOnly = true
    input.focus()
    return input
  })
  await page.keyboard.press("Home")
  await page.keyboard.press("ArrowRight")
  const nativeSelection = await native.evaluate(element => [element.selectionStart, element.selectionEnd])
  await native.evaluate(element => element.remove())
  const position = page.getByRole("textbox", { name: "Position", exact: true })
  await position.focus()
  await expect(position.locator("xpath=ancestor::*[@role='group' or @role='toolbar']")).toHaveCount(0)
  await page.keyboard.press("Home")
  await page.keyboard.press("ArrowRight")
  await expect(position).toBeFocused()
  expect(await position.evaluate(element => [element.selectionStart, element.selectionEnd])).toEqual(nativeSelection)
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "After editor", exact: true })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(position).toBeFocused()
})

test("inline attachment controls keep their anchor position", async ({ page, editor }) => {
  await page.goto("/attachment-controls.html?inline")
  await page.waitForSelector("lexxy-editor[connected]")
  await editor.setValue(`<p>Before ${AUDIO} After</p>`)
  await expect(page.locator("lexxy-attachment-toolbar[data-custom-controls]")).toHaveAttribute("data-presentation", "inline")
  const figure = await editor.content.locator("figure").boundingBox()
  await expect.poll(async () => {
    const box = await page.locator("lexxy-attachment-toolbar[data-custom-controls]").boundingBox()
    return Math.max(Math.abs(box.x - figure.x), Math.abs(box.y - figure.y))
  }).toBeLessThanOrEqual(1)
  const anchor = await editor.content.locator(".audio-preview").boundingBox()
  const play = page.getByRole("button", { name: "Play Example", exact: true })
  await expect.poll(async () => {
    const box = await play.boundingBox()
    return Math.max(Math.abs(box.x - anchor.x), Math.abs(box.y - anchor.y))
  }).toBeLessThanOrEqual(1)
  await play.click()
  await expect(page.getByRole("button", { name: "Pause Example", exact: true })).toBeFocused()
})

test("buttons on unlabelled attachments keep their native Tab stops", async ({ page, editor }) => {
  await page.goto("/attachment-controls.html?unlabelled")
  await page.waitForSelector("lexxy-editor[connected]")
  await editor.setValue(`<p>Before</p>${AUDIO}<p>After</p>`)
  await editor.content.locator("p").first().click()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Play Example", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  const pause = page.getByRole("button", { name: "Pause Example", exact: true })
  await expect(pause).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "After editor", exact: true })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(pause).toBeFocused()
})

test("caret navigation avoids attachment geometry work while edits still reposition controls", async ({ page, editor }) => {
  await editor.setValue(`<p>Before the attachments</p>${AUDIO.repeat(3)}<p>After</p>`)
  await editor.content.locator("p").first().click()
  await page.keyboard.press("Home")
  await editor.flush()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await editor.content.locator("figure").evaluateAll(figures => {
    window.attachmentGeometryReads = 0
    window.restoreAttachmentGeometry = figures.map(figure => {
      const measure = figure.getBoundingClientRect
      figure.getBoundingClientRect = function() {
        window.attachmentGeometryReads++
        return measure.call(this)
      }
      return () => figure.getBoundingClientRect = measure
    })
  })
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("ArrowLeft")
  expect(await page.evaluate(() => window.attachmentGeometryReads)).toBe(0)
  await page.evaluate(() => window.restoreAttachmentGeometry.forEach(restore => restore()))

  const play = page.getByRole("button", { name: "Play Example", exact: true }).first()
  const before = await play.boundingBox()
  await page.keyboard.press("Enter")
  await expect.poll(async () => (await play.boundingBox()).y).toBeGreaterThan(before.y)
  await expect.poll(async () => {
    const control = await play.boundingBox()
    const anchor = await editor.content.locator(".audio-preview").first().boundingBox()
    return Math.abs(control.y - anchor.y)
  }).toBeLessThanOrEqual(1)
})
