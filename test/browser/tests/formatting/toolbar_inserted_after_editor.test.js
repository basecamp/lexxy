import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"

// Turbo renders a new page by inserting a parsed body whose custom elements are not upgraded yet. The browser upgrades
// them in tree order, so an editor connects before a toolbar that comes after it, nested inside it or later in the page.
const toolbarMarkup = (id) => `
  <lexxy-toolbar${id ? ` id="${id}"` : ""}>
    <button class="lexxy-editor__toolbar-button" type="button" name="bold" data-command="bold" title="Bold">bold</button>
    <lexxy-toolbar-dropdown class="lexxy-editor__toolbar-overflow">
      <button class="lexxy-editor__toolbar-button" type="button" data-dropdown-trigger
              aria-haspopup="menu" aria-expanded="false" aria-label="More options">&bull;&bull;&bull;</button>
      <div data-dropdown-panel role="menu" class="lexxy-editor__toolbar-overflow-menu" aria-label="More options" hidden></div>
    </lexxy-toolbar-dropdown>
  </lexxy-toolbar>
`

const layouts = {
  "a toolbar after the editor": `
    <lexxy-editor class="lexxy-content" toolbar="custom_toolbar"></lexxy-editor>
    ${toolbarMarkup("custom_toolbar")}
  `,
  "a toolbar nested in the editor and referenced by id": `
    <lexxy-editor class="lexxy-content" toolbar="custom_toolbar">${toolbarMarkup("custom_toolbar")}</lexxy-editor>
  `,
  "a nested toolbar without an id": `
    <lexxy-editor class="lexxy-content">${toolbarMarkup()}</lexxy-editor>
  `
}

for (const [ description, markup ] of Object.entries(layouts)) {
  test(`inserting an editor with ${description} attaches the toolbar`, async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))

    await page.evaluate((html) => {
      const body = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body
      document.body.replaceWith(document.adoptNode(body))
    }, markup)

    await editor.waitForConnected()
    expect(errors).toEqual([])
    await expect(page.locator("lexxy-toolbar")).toHaveCount(1)
    await expect(page.locator("lexxy-toolbar[connected]")).toBeVisible()

    await editor.send("Hello")
    await editor.selectAll()
    await page.locator("lexxy-toolbar button[name='bold']").click()

    await expect(editor.content.locator("strong, b")).toHaveText("Hello")
  })
}
