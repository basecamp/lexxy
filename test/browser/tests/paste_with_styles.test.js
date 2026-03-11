import { test } from "../test_helper.js"
import { assertEditorHtml } from "../helpers/assertions.js"

test.describe("Paste with styles", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/new")
    await page.waitForSelector("lexxy-editor[connected]")
  })

  test("strips non-canonical color styles when pasting", async ({
    editor,
  }) => {
    await pasteWithStyle(editor, "color: purple")
    await assertStyleStripped(editor)
  })

  test("strips non-canonical background-color styles when pasting", async ({
    editor,
  }) => {
    await pasteWithStyle(editor, "background-color: yellow")
    await assertStyleStripped(editor)
  })

  test("preserves canonical CSS variable color when pasting", async ({
    editor,
  }) => {
    await pasteWithStyle(editor, "color: var(--highlight-1)")
    await assertCanonicalizedTo(editor, "color: var(--highlight-1)")
  })

  test("preserves canonical CSS variable background-color when pasting", async ({
    editor,
  }) => {
    await pasteWithStyle(editor, "background-color: var(--highlight-bg-1)")
    await assertCanonicalizedTo(
      editor,
      "background-color: var(--highlight-bg-1)",
    )
  })

  test("canonicalizes RGB color value matching canonical color", async ({
    page,
    editor,
  }) => {
    const rgb = await highlight1Rgb(page)
    await pasteWithStyle(editor, `color: ${rgb}`)
    await assertCanonicalizedTo(editor, "color: var(--highlight-1)")
  })

  test("canonicalizes RGBA background-color value matching canonical color", async ({
    editor,
  }) => {
    await pasteWithStyle(
      editor,
      "background-color: rgba(229, 223, 6, 0.3)",
    )
    await assertCanonicalizedTo(
      editor,
      "background-color: var(--highlight-bg-1)",
    )
  })

  test("preserves valid color but strips invalid background-color", async ({
    page,
    editor,
  }) => {
    const rgb = await highlight1Rgb(page)
    await pasteWithStyle(
      editor,
      `color: ${rgb}; background-color: yellow`,
    )
    await assertCanonicalizedTo(editor, "color: var(--highlight-1)")
  })

  test("preserves valid background-color but strips invalid color", async ({
    editor,
  }) => {
    await pasteWithStyle(
      editor,
      "color: purple; background-color: rgba(229, 223, 6, 0.3)",
    )
    await assertCanonicalizedTo(
      editor,
      "background-color: var(--highlight-bg-1)",
    )
  })

  test("strips irrelevant style properties", async ({ page, editor }) => {
    const rgb = await highlight1Rgb(page)
    await pasteWithStyle(
      editor,
      `background-color: rgba(229, 223, 6, 0.3); color: ${rgb}; box-sizing: border-box; scrollbar-color: rgb(193, 193, 193) rgba(0, 0, 0, 0); scrollbar-width: thin; background-image: unset; background-position: unset; background-size: unset; background-repeat: unset; background-attachment: unset; background-origin: unset; background-clip: unset; text-decoration: inherit; border-radius: 4px;`,
    )
    await assertCanonicalizedTo(
      editor,
      "color: var(--highlight-1);background-color: var(--highlight-bg-1)",
    )
  })

  test("canonicalizes styles in mark-up sent as plain-text", async ({
    editor,
  }) => {
    await editor.paste(
      `some <span style='color: purple; background-color: rgba(229, 223, 6, 0.3);'>styled text</span>`,
    )
    await assertCanonicalizedTo(
      editor,
      "background-color: var(--highlight-bg-1)",
    )
  })

  test("canonicalizes styles in <span>", async ({ editor }) => {
    await editor.paste("styled text", {
      html: `some <span style="color: purple; background-color: rgba(229, 223, 6, 0.3);">styled text</span>`,
    })
    await assertCanonicalizedTo(
      editor,
      "background-color: var(--highlight-bg-1)",
    )
  })

  test("canonicalizes selection styles on paste", async ({
    page,
    editor,
  }) => {
    const rgb = await highlight1Rgb(page)
    await editor.paste("styled text", {
      html: `some <span style="color: ${rgb}; background-color: white;">styled text</span>`,
    })
    await editor.send(" and more...")

    await assertEditorHtml(
      editor,
      `<p>some <mark style="color: var(--highlight-1);">styled text and more...</mark></p>`,
    )
  })
})

// Helpers

async function pasteWithStyle(editor, style) {
  await editor.paste("some styled text", {
    html: `some <mark style="${style}">styled text</mark>`,
  })
}

async function assertStyleStripped(editor) {
  await assertEditorHtml(editor, "<p>some styled text</p>")
}

async function assertCanonicalizedTo(editor, style) {
  await assertEditorHtml(
    editor,
    `<p>some <mark style="${style};">styled text</mark></p>`,
  )
}

async function highlight1Rgb(page) {
  return page.evaluate(() =>
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "rgb(240, 200, 22)"
      : "rgb(136, 118, 38)",
  )
}
