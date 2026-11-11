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
