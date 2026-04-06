export const HELLO_EVERYONE = "<p>Hello everyone</p>"

export async function openFormatDropdown(page) {
  await page.evaluate(() => {
    const details = document.querySelector("summary[name='format']").closest("details")
    details.open = true
    details.dispatchEvent(new Event("toggle"))
  })
}

const FORMAT_DROPDOWN_COMMANDS = new Set([
  "setFormatParagraph", "setFormatHeadingLarge", "setFormatHeadingMedium",
  "setFormatHeadingSmall", "strikethrough", "underline", "clearFormatting"
])

export async function clickToolbarButton(page, command) {
  if (FORMAT_DROPDOWN_COMMANDS.has(command)) {
    await openFormatDropdown(page)
  }
  await page.locator(`[data-command='${command}']`).click()
}

export async function applyHighlightOption(page, attribute, buttonIndex) {
  await page.locator("[name='highlight']").click()
  const buttons = page.locator(
    `lexxy-highlight-dropdown .lexxy-highlight-colors .lexxy-highlight-button[data-style='${attribute}']`,
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
