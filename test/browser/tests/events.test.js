import { test } from "../test_helper.js"
import { expect } from "@playwright/test"
import { assertEditorHtml, assertEditorContent } from "../helpers/assertions.js"

test.describe("Events", () => {
  test("no lexxy:change event on initial load", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await expect(page.locator("[data-event='lexxy:change']")).toHaveCount(0)
  })

  test("dispatch lexxy:focus and lexxy:blur events on focus gain and loss", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.focus()
    await expect(page.locator("[data-event='lexxy:focus']")).toBeVisible()

    await page.locator("input[name='post[title]']").click()
    await expect(page.locator("[data-event='lexxy:blur']")).toBeVisible()
  })

  test("using toolbar dispatches lexxy:focus", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await page.locator("input[name='post[title]']").click()
    await expect(page.locator("[data-event='lexxy:focus']")).toHaveCount(0)

    await page.locator("button[data-command='bold']").click()
    await expect(page.locator("[data-event='lexxy:focus']")).toBeVisible()
    await expect(page.locator("[data-event='lexxy:blur']")).toHaveCount(0)
  })

  test("using toolbar does not dispatch lexxy:blur", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.focus()
    await expect(page.locator("[data-event='lexxy:focus']")).toBeVisible()

    await page.locator("button[data-command='bold']").click()
    await expect(page.locator("[data-event='lexxy:blur']")).toHaveCount(0)
  })

  test("toolbar dropdowns do not dispatch lexxy:blur", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.focus()
    await expect(page.locator("[data-event='lexxy:focus']")).toBeVisible()

    // Apply highlight via dropdown
    await page.locator("[name='highlight']").click()
    await page
      .locator(
        "lexxy-highlight-dropdown .lexxy-highlight-colors .lexxy-highlight-button[data-style='background-color']",
      )
      .first()
      .click()

    await expect(page.locator("[data-event='lexxy:blur']")).toHaveCount(0)
  })

  test("dispatch lexxy:change event on edits", async ({ page, editor }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.send("Y")

    await expect(page.locator("[data-event='lexxy:change']")).toBeVisible()
  })

  test("dispatch lexxy:insert-link event when a link is pasted", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await expect(
      page.locator("[data-event='lexxy:insert-link']"),
    ).toHaveCount(0)

    await editor.paste("https://37signals.com")

    await expect(
      page.locator("[data-event='lexxy:insert-link']"),
    ).toBeVisible()
  })

  test("dispatch lexxy:insert-markdown event when markdown is pasted", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("Hello **there**")

    await expect(
      page.locator("[data-event='lexxy:insert-markdown']"),
    ).toBeVisible()
    await assertEditorHtml(
      editor,
      "<p>Hello <b><strong>there</strong></b></p>",
    )
  })

  test("lexxy:insert-markdown event detail is frozen with expected shape", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await page.evaluate(() => {
      document
        .querySelector("lexxy-editor")
        .addEventListener("lexxy:insert-markdown", (event) => {
          const d = event.detail
          const results = []
          if (!Object.isFrozen(d)) results.push("detail is not frozen")
          if (typeof d.markdown !== "string")
            results.push("markdown is not a string")
          if (!(d.document instanceof Document))
            results.push("document is not a Document")
          if (typeof d.addBlockSpacing !== "function")
            results.push("addBlockSpacing is not a function")

          const el = document.createElement("div")
          el.id = "detail-check"
          el.textContent =
            results.length === 0
              ? "all checks passed"
              : results.join(", ")
          document.body.appendChild(el)
        })
    })

    await editor.paste("Hello **there**")

    await expect(page.locator("#detail-check")).toHaveText(
      "all checks passed",
    )
  })

  test("lexxy:insert-markdown event detail includes the original markdown", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await page.evaluate(() => {
      document
        .querySelector("lexxy-editor")
        .addEventListener("lexxy:insert-markdown", (event) => {
          const el = document.createElement("div")
          el.id = "markdown-check"
          el.textContent = event.detail.markdown
          document.body.appendChild(el)
        })
    })

    await editor.paste("Hello **there**")

    await expect(page.locator("#markdown-check")).toHaveText(
      "Hello **there**",
    )
  })

  test("lexxy:insert-markdown event handler can mutate the DOM to remove images", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await page.evaluate(() => {
      document
        .querySelector("lexxy-editor")
        .addEventListener("lexxy:insert-markdown", (event) => {
          event.detail.document
            .querySelectorAll("img")
            .forEach((img) => img.remove())
        })
    })

    await editor.paste("Hello ![alt](http://example.com/image.png) world")

    await assertEditorContent(editor, async (content) => {
      await expect(content.locator("p")).toContainText("Hello world")
      await expect(content.locator("img")).toHaveCount(0)
    })
  })

  test("lexxy:insert-markdown event handler can use addBlockSpacing", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await page.evaluate(() => {
      document
        .querySelector("lexxy-editor")
        .addEventListener("lexxy:insert-markdown", (event) => {
          event.detail.addBlockSpacing()
        })
    })

    await editor.paste("paragraph one\n\nparagraph two")

    await assertEditorHtml(
      editor,
      "<p>paragraph one</p><p><br></p><p>paragraph two</p>",
    )
  })

  test("lexxy:insert-markdown event does not fire when pasting a URL", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("https://37signals.com")

    await expect(
      page.locator("[data-event='lexxy:insert-markdown']"),
    ).toHaveCount(0)
    await expect(
      page.locator("[data-event='lexxy:insert-link']"),
    ).toBeVisible()
  })

  test("lexxy:insert-markdown event does not fire when markdown is disabled", async ({
    page,
    editor,
  }) => {
    await page.goto("/markdown-disabled.html")
    await editor.waitForConnected()

    await editor.click()
    await editor.paste("Hello **there**")

    await expect(
      page.locator("[data-event='lexxy:insert-markdown']"),
    ).toHaveCount(0)
    await assertEditorHtml(editor, "<p>Hello **there**</p>")
  })

  test("lexxy:insert-markdown event does not fire when pasting into code block", async ({
    page,
    editor,
  }) => {
    await page.goto("/")
    await editor.waitForConnected()

    await editor.paste("some text")
    await editor.clickToolbarButton("insertCodeBlock")

    // Clear the events log so we only check for new events
    await page.evaluate(
      () => (document.querySelector(".events").innerHTML = ""),
    )

    await editor.paste("Hello **there**")

    await expect(
      page.locator("[data-event='lexxy:insert-markdown']"),
    ).toHaveCount(0)
    await assertEditorContent(editor, async (content) => {
      await expect(content).toContainText("**there**")
      await expect(content.locator("strong")).toHaveCount(0)
    })
  })
})
