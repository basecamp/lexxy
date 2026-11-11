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
  const box = await play.boundingBox()
  expect(box.y + box.height / 2).toBeLessThan(viewport.y)
  expect(await play.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === element
  })).toBe(false)
  await page.keyboard.press("Alt+F10")
  await expect(play).toBeFocused()
  await expect.poll(async () => (await play.boundingBox()).y).toBeGreaterThanOrEqual(viewport.y - 1)
})

test("group controls retain native Tab and field arrow navigation", async ({ page, editor }) => {
  await page.goto("/attachment-controls.html?group")
  await page.waitForSelector("lexxy-editor[connected]")
  await editor.setValue(AUDIO)
  await page.getByRole("button", { name: "Play Example", exact: true }).click()
  await page.keyboard.press("Tab")
  const position = page.getByRole("textbox", { name: "Position", exact: true })
  await expect(position).toBeFocused()
  await page.keyboard.press("Home")
  await page.keyboard.press("ArrowRight")
  await expect(position).toBeFocused()
  await expect.poll(() => position.evaluate(element => element.selectionStart)).toBe(1)
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Reset", exact: true })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "After editor", exact: true })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(page.getByRole("button", { name: "Reset", exact: true })).toBeFocused()
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
