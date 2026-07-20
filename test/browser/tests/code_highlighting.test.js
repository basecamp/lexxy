import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorContent } from "../helpers/assertions.js"
import { applyHighlightOption } from "../helpers/toolbar.js"

test.describe("Code highlighting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("ruby code is highlighted in editor", async ({ page, editor }) => {
    await editor.send("def hello_world")
    await editor.select("dev")
    await page.getByRole("button", { name: "Code" }).click()

    const languageSelect = page.locator("select[name=lexxy-code-language]")
    await expect(languageSelect).toHaveValue("plain")

    await languageSelect.selectOption("Ruby")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("span.code-token__attr")).toContainText(
        "def",
      )
    })
  })
})

test.describe("Code block color highlights survive editing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
  })

  test("a highlight survives deleting a character elsewhere in the code block", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>due Jul 31.</code></pre>')
    await editor.select("Jul 31")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toContainText("Jul 31")
    })

    await editor.select(".")
    await editor.send("Backspace")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toHaveCount(1)
      await expect(content.locator("code mark")).toContainText("Jul 31")
    })
  })

  test("a highlight survives appending characters to the code block", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>due Jul 31</code></pre>')
    await editor.select("Jul 31")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toHaveCount(1)
    })

    await editor.select("31")
    await editor.send("End", " today")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code")).toContainText("due Jul 31 today")
      await expect(content.locator("code mark")).toContainText("Jul 31")
    })
  })

  test("multiple highlights on different words all survive a later edit", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>12,571 due Jul 31.</code></pre>')

    await editor.select("12,571")
    await applyHighlightOption(page, "color", 1)
    await editor.flush()

    await editor.select("Jul 31")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toHaveCount(2)
    })

    await editor.select(".")
    await editor.send("Backspace")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toHaveCount(2)
      await expect(content.locator("code mark").nth(0)).toContainText("12,571")
      await expect(content.locator("code mark").nth(1)).toContainText("Jul 31")
    })
  })

  test("highlights aligned and unaligned with ruby tokens all survive an edit", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="ruby"><code>sum = 12571 # due Jul 31.</code></pre>')

    await editor.select("12571")
    await applyHighlightOption(page, "color", 1)
    await editor.flush()

    await editor.select("Jul 31")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toHaveCount(2)
    })

    await editor.select(".")
    await editor.send("Backspace")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toHaveCount(2)
      await expect(content.locator("code mark").nth(0)).toContainText("12571")
      await expect(content.locator("code mark").nth(1)).toContainText("Jul 31")
    })
  })

  test("a highlight loaded from persisted HTML survives an edit", async ({ editor }) => {
    await editor.setValue('<pre data-language="plain"><code>due <mark style="background-color: var(--highlight-bg-1);">Jul 31</mark>.</code></pre>')

    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("code mark")).toContainText("Jul 31")
    }).toPass({ timeout: 5_000 })

    await editor.select(".")
    await editor.send("Backspace")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toHaveCount(1)
      await expect(content.locator("code mark")).toContainText("Jul 31")
    })
  })

  test("a highlight survives switching the code language", async ({ page, editor }) => {
    await editor.setValue('<pre data-language="plain"><code>def hello_world</code></pre>')
    await editor.select("hello")
    await applyHighlightOption(page, "background-color", 1)
    await editor.flush()

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("code mark")).toContainText("hello")
    })

    await page.locator("select[name=lexxy-code-language]").selectOption("Ruby")

    await expect(async () => {
      await editor.flush()
      await expect(editor.content.locator("span.code-token__attr")).toContainText("def")
      await expect(editor.content.locator("code mark")).toContainText("hello")
    }).toPass({ timeout: 5_000 })
  })
})
