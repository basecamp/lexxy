import { readFileSync } from "node:fs"
import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

const EXAMPLE_PNG = readFileSync("test/fixtures/files/example.png").toString("base64")
const EXAMPLE_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>',
).toString("base64")
const PNG_DATA_URI = `data:image/png;base64,${EXAMPLE_PNG}`
const SVG_DATA_URI = `data:image/svg+xml;base64,${EXAMPLE_SVG}`
const modifier = process.platform === "darwin" ? "Meta" : "Control"

test.describe("Paste — Inline image data URIs", () => {
  test("converts a standalone data URI image into an upload", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    await editor.paste("", { html: `<img src="${PNG_DATA_URI}">` })

    await expect.poll(() => calls.blobCreations.length, { timeout: 10_000 }).toBe(1)
    expect(calls.blobCreations[0].content_type).toBe("image/png")

    await expect(
      editor.content.locator("figure.attachment[data-content-type='image/png']"),
    ).toHaveCount(1)

    expect(await editor.value()).not.toContain("data:image/png")
  })

  test("preserves the full subtype for spec-compliant mimetypes", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    const validBase64 = Buffer.from("hello").toString("base64")
    const dataURI = `data:image/x-icon;base64,${validBase64}`
    await editor.paste("", { html: `<img src="${dataURI}">` })

    await expect.poll(() => calls.blobCreations.length, { timeout: 10_000 }).toBe(1)
    expect(calls.blobCreations[0].content_type).toBe("image/x-icon")

    await expect(
      editor.content.locator("figure.attachment[data-content-type='image/x-icon']"),
    ).toHaveCount(1)
  })

  test("preserves position when surrounded by other content", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    await editor.paste("", {
      html: `<p>before</p><img src="${PNG_DATA_URI}"><p>after</p>`,
    })

    await expect.poll(() => calls.blobCreations.length, { timeout: 10_000 }).toBe(1)

    const children = editor.content.locator(":scope > *")
    await expect(children).toHaveCount(3)
    await expect(children.nth(0)).toContainText("before")
    await expect(children.nth(1)).toHaveClass(/attachment/)
    await expect(children.nth(2)).toContainText("after")
    expect(await editor.value()).not.toContain("data:image/png")
  })

  test("converts a data URI inline within paragraph content", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    await editor.paste("", {
      html: `<p>see <img src="${PNG_DATA_URI}"> here</p>`,
    })

    await expect.poll(() => calls.blobCreations.length, { timeout: 10_000 }).toBe(1)

    const children = editor.content.locator(":scope > *")
    await expect(children).toHaveCount(3)
    await expect(children.nth(0)).toContainText("see")
    await expect(children.nth(1)).toHaveClass(/attachment/)
    await expect(children.nth(2)).toContainText("here")
    expect(await editor.value()).not.toContain("data:image/png")
  })

  test("converts each of multiple data URI images independently without forming a gallery", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    await editor.paste("", {
      html: `<img src="${PNG_DATA_URI}"><img src="${PNG_DATA_URI}">`,
    })

    await expect.poll(() => calls.blobCreations.length, { timeout: 10_000 }).toBe(2)

    await expect(
      editor.content.locator("figure.attachment[data-content-type='image/png']"),
    ).toHaveCount(2)
    await expect(editor.content.locator(".attachment-gallery")).toHaveCount(0)
  })

  test("fires lexxy:file-accept with the synthesized file", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    await mockActiveStorageUploads(page)

    await editor.locator.evaluate((el) => {
      window.__fileAcceptCalls = []
      el.addEventListener("lexxy:file-accept", (e) => {
        window.__fileAcceptCalls.push({ type: e.detail.file.type })
      })
    })

    await editor.paste("", { html: `<img src="${PNG_DATA_URI}">` })
    await editor.flush()

    const fileAcceptCalls = await page.evaluate(() => window.__fileAcceptCalls)
    expect(fileAcceptCalls).toEqual([ { type: "image/png" } ])
  })

  test("undo lands on pre-paste state without the data URI", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    await mockActiveStorageUploads(page)

    await editor.paste("", { html: `<img src="${PNG_DATA_URI}">` })
    await editor.flush()

    await editor.content.press(`${modifier}+z`)
    await editor.flush()

    const value = await editor.value()
    expect(value).not.toContain("data:image/png")
  })

  test("converts a permitted image data URI even with a restrictive allowlist", async ({ page, editor }) => {
    await page.goto("/attachments-permitted-image-png.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    await editor.paste("", { html: `<img src="${PNG_DATA_URI}">` })

    await expect.poll(() => calls.blobCreations.length, { timeout: 10_000 }).toBe(1)
    expect(calls.blobCreations[0].content_type).toBe("image/png")

    await expect(
      editor.content.locator("figure.attachment[data-content-type='image/png']"),
    ).toHaveCount(1)
  })

  test("silently drops a non-permitted image data URI", async ({ page, editor }) => {
    await page.goto("/attachments-permitted-image-png.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    await editor.paste("", {
      html: `<p>before</p><img src="${SVG_DATA_URI}"><p>after</p>`,
    })
    await editor.flush()

    expect(calls.blobCreations).toHaveLength(0)

    const children = editor.content.locator(":scope > *")
    await expect(children).toHaveCount(2)
    await expect(editor.content.locator(":scope > p")).toHaveCount(2)
    await expect(children.nth(0)).toContainText("before")
    await expect(children.nth(1)).toContainText("after")
    expect(await editor.value()).not.toContain("data:image")
  })

  test("leaves a non-image data URI untouched in the saved HTML", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    const pdfDataURI = `data:application/pdf;base64,${Buffer.from("hello").toString("base64")}`
    await editor.paste("", {
      html: `<p>before</p><img src="${pdfDataURI}"><p>after</p>`,
    })
    await editor.flush()

    expect(calls.blobCreations).toHaveLength(0)
    expect(await editor.value()).toContain(pdfDataURI)
  })

  test("silently drops a malformed data URI", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    const calls = await mockActiveStorageUploads(page)

    const malformed = "data:image/png;base64,!!!!not-real-base64!!!!"
    await editor.paste("", {
      html: `<p>before</p><img src="${malformed}"><p>after</p>`,
    })
    await editor.flush()

    expect(calls.blobCreations).toHaveLength(0)

    const children = editor.content.locator(":scope > *")
    await expect(children).toHaveCount(2)
    await expect(editor.content.locator(":scope > p")).toHaveCount(2)
    await expect(children.nth(0)).toContainText("before")
    await expect(children.nth(1)).toContainText("after")
    expect(await editor.value()).not.toContain("data:image/png")
  })
})
