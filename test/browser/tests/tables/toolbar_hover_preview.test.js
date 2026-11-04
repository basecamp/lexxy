import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

const menuCommands = [
  { action: "insert", direction: "before" },
  { action: "insert", direction: "after" },
  { action: "toggle" },
  { action: "delete" }
]

for (const childType of [ "row", "column" ]) {
  test.describe(`Tables — ${childType} previews`, () => {
    test.beforeEach(async ({ page, editor }) => {
      await page.goto("/")
      await page.waitForSelector("lexxy-editor[connected]")
      await page.waitForSelector("lexxy-toolbar[connected]")
      await editor.clickToolbarButton("insertTable")
      await editor.content.locator("table th").first().click()
    })

    test("hover previews each menu action while the first item retains focus", async ({ editor }) => {
      const controls = tableControls(editor, childType)
      await controls.locator("[data-dropdown-trigger]").click()

      const items = controls.getByRole("menuitem")
      for (const [ index, command ] of menuCommands.entries()) {
        await items.nth(index).hover()
        await assertPreview(editor, childType, command)
        await expect(items.first()).toBeFocused()
      }
    })

    test("keyboard navigation previews each menu action", async ({ page, editor }) => {
      await page.keyboard.press("Alt+F10")
      const triggerSteps = { row: 1, column: 4 }
      for (let step = 0; step < triggerSteps[childType]; step++) {
        await page.keyboard.press("ArrowRight")
      }
      await page.keyboard.press("Enter")

      for (const command of menuCommands) {
        await assertPreview(editor, childType, command)
        await page.keyboard.press("ArrowDown")
      }
      await assertPreview(editor, childType, menuCommands[0])
    })

    test("moving focus to the menu trigger clears the command preview", async ({ page, editor }) => {
      await page.keyboard.press("Alt+F10")
      const commandSteps = { row: 0, column: 3 }
      for (let step = 0; step < commandSteps[childType]; step++) {
        await page.keyboard.press("ArrowRight")
      }
      await assertPreview(editor, childType, menuCommands[3])

      await page.keyboard.press("ArrowRight")

      await expect(tableControls(editor, childType).locator("[data-dropdown-trigger]")).toBeFocused()
      await expect(editor.content.locator(".lexxy-content__table-cell--highlight")).toHaveCount(0)
    })

    test("switching between mouse and keyboard updates the preview", async ({ page, editor }) => {
      const controls = tableControls(editor, childType)
      await controls.locator("[data-dropdown-trigger]").click()
      const items = controls.getByRole("menuitem")

      await items.nth(2).hover()
      await assertPreview(editor, childType, menuCommands[2])

      await page.keyboard.press("ArrowDown")
      await expect(items.nth(1)).toBeFocused()
      await assertPreview(editor, childType, menuCommands[1])

      await items.nth(3).hover()
      await assertPreview(editor, childType, menuCommands[3])

      await page.mouse.move(0, 0)
      await assertPreview(editor, childType, menuCommands[1])

      await page.keyboard.press("Escape")
      await expect(editor.content.locator(".lexxy-content__table-cell--highlight")).toHaveCount(0)
    })
  })
}

function tableControls(editor, childType) {
  return editor.locator.locator(`lexxy-table-tools .lexxy-table-control--${childType}`)
}

async function assertPreview(editor, childType, command) {
  const highlightedCells = editor.content.locator(".lexxy-content__table-cell--highlight")
  await expect(highlightedCells).toHaveCount(3)
  for (const cell of await highlightedCells.all()) {
    await expect(cell).toHaveAttribute("data-child-type", childType)
    await expect(cell).toHaveAttribute("data-action", command.action)
    if (command.direction) {
      await expect(cell).toHaveAttribute("data-direction", command.direction)
    }
  }
}
