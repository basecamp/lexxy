export const HELLO_EVERYONE = "<p>Hello everyone</p>"

export function focusedName(page) {
  return page.evaluate(() => document.activeElement?.name)
}

export async function openFormatDropdown(page) {
  await openToolbarDropdown(page, "format")
}

export async function openToolbarDropdown(page, name) {
  await page.locator(`button[name='${name}']`).click()
}

const FORMAT_DROPDOWN_COMMANDS = new Set([
  "setFormatParagraph", "clearFormatting"
])

const HEADING_BUTTON_PREFIX = "heading-"

export async function clickToolbarButton(page, command) {
  if (FORMAT_DROPDOWN_COMMANDS.has(command) || command.startsWith(HEADING_BUTTON_PREFIX)) {
    await openFormatDropdown(page)
  }

  if (command.startsWith(HEADING_BUTTON_PREFIX)) {
    await page.locator(`[name='${command}']`).click()
  } else {
    await page.locator(`[data-command='${command}']`).click()
  }
}

export async function applyHighlightOption(page, attribute, buttonIndex) {
  await page.locator("[name='highlight']").click()
  const buttons = page.locator(
    `lexxy-highlight-dropdown [data-dropdown-panel] .lexxy-highlight-colors .lexxy-highlight-button[data-style='${attribute}']`,
  )
  await buttons.nth(buttonIndex - 1).click()
}

export async function placeCaretAtEndOfInlineCode(editor) {
  await editor.content.evaluate((content) => {
    const code = content.querySelector("code")
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
    const textNode = walker.nextNode()
    const range = document.createRange()

    range.setStart(textNode, textNode.textContent.length)
    range.collapse(true)

    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  })
}
