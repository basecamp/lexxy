import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

test.describe("Editor validation", () => {
  test.beforeEach(async ({ page, editor }) => {
    await page.goto("/editor-accessibility.html")
    await editor.waitForConnected()
  })

  test("exposes the native validation message", async ({ editor }) => {
    await expect.poll(() => editor.locator.evaluate(element => element.validity.valueMissing)).toBe(true)
    expect(await editor.locator.evaluate(element => element.validationMessage)).toEqual(expect.any(String))
    expect(await editor.locator.evaluate(element => element.validationMessage)).not.toBe("")

    await editor.send("A reply")
    await expect.poll(() => editor.locator.evaluate(element => element.validationMessage)).toBe("")
  })

  test("sets and clears a custom error synchronously", async ({ editor }) => {
    await editor.send("A reply")
    const invalid = await editor.locator.evaluate(element => {
      element.setCustomValidity("Please include more detail.")
      return {
        customError: element.validity.customError,
        valid: element.validity.valid,
        message: element.validationMessage
      }
    })
    expect(invalid).toEqual({ customError: true, valid: false, message: "Please include more detail." })
    await expect(editor.content).toHaveAttribute("aria-invalid", "false")

    expect(await editor.locator.evaluate(element => element.reportValidity())).toBe(false)
    await expect(editor.content).toHaveAttribute("aria-invalid", "true")

    const valid = await editor.locator.evaluate(element => {
      element.setCustomValidity("")
      return { customError: element.validity.customError, valid: element.checkValidity(), message: element.validationMessage }
    })
    expect(valid).toEqual({ customError: false, valid: true, message: "" })
    await expect(editor.content).toHaveAttribute("aria-invalid", "false")
  })

  test("blocks form submission until the custom error is cleared", async ({ page, editor }) => {
    await editor.send("A reply")
    await editor.locator.evaluate(element => {
      element.addEventListener("invalid", event => event.preventDefault())
      element.form.addEventListener("submit", () => element.form.dataset.submitted = "true")
      element.setCustomValidity("Please include more detail.")
    })

    await page.getByRole("button", { name: "Submit", exact: true }).press("Enter")
    await expect(editor.content).toHaveAttribute("aria-invalid", "true")
    await expect(page.locator("form")).not.toHaveAttribute("data-submitted")

    await editor.locator.evaluate(element => element.setCustomValidity(""))
    await page.getByRole("button", { name: "Submit", exact: true }).press("Enter")
    await expect(page.locator("form")).toHaveAttribute("data-submitted", "true")
  })

  test("clearing a custom error preserves the required constraint", async ({ editor }) => {
    const invalid = await editor.locator.evaluate(element => {
      element.setCustomValidity("Please write a message.")
      return {
        customError: element.validity.customError,
        valueMissing: element.validity.valueMissing,
        message: element.validationMessage
      }
    })
    expect(invalid).toEqual({ customError: true, valueMissing: true, message: "Please write a message." })

    const cleared = await editor.locator.evaluate(element => {
      element.setCustomValidity("")
      return { customError: element.validity.customError, valueMissing: element.validity.valueMissing, valid: element.checkValidity() }
    })
    expect(cleared).toEqual({ customError: false, valueMissing: true, valid: false })
    expect(await editor.locator.evaluate(element => element.validationMessage)).not.toBe("Please write a message.")
    await expect(editor.content).toHaveAttribute("aria-invalid", "true")
  })

  test("keeps the custom error through editing and form reset until the app clears it", async ({ page, editor }) => {
    await editor.locator.evaluate(element => element.setCustomValidity("Please include more detail."))
    await editor.send("A reply")
    expect(await editor.locator.evaluate(element => element.validationMessage)).toBe("Please include more detail.")

    await page.getByRole("button", { name: "Reset", exact: true }).press("Enter")
    await editor.flush()
    expect(await editor.locator.evaluate(element => element.validity.customError)).toBe(true)
    expect(await editor.locator.evaluate(element => element.validationMessage)).toBe("Please include more detail.")
  })

  test("supports setting an error before connection and preserves it through reconnection", async ({ page, editor }) => {
    const initial = await page.evaluate(() => {
      const element = document.createElement("lexxy-editor")
      element.setCustomValidity("Please include more detail.")
      const result = { customError: element.validity.customError, message: element.validationMessage }
      document.querySelector("lexxy-editor").replaceWith(element)
      return result
    })
    expect(initial).toEqual({ customError: true, message: "Please include more detail." })
    await editor.waitForConnected()

    await editor.locator.evaluate(element => {
      const parent = element.parentElement
      element.remove()
      element.setCustomValidity("Please review your reply.")
      parent.append(element)
    })
    await editor.waitForConnected()
    await editor.flush()
    expect(await editor.locator.evaluate(element => element.validationMessage)).toBe("Please review your reply.")
    expect(await editor.locator.evaluate(element => element.checkValidity())).toBe(false)
  })

  test("custom errors and pending uploads do not clear each other's validity", async ({ page, editor }) => {
    await page.goto("/attachments.html")
    await editor.waitForConnected()
    await editor.send("A reply")
    const uploads = await mockActiveStorageUploads(page, { delayDirectUploadResponse: true })
    await editor.uploadFile("test/fixtures/files/example.png")
    await expect.poll(() => editor.locator.evaluate(element => element.validationMessage)).toBe("Please wait for all files to upload")

    await editor.locator.evaluate(element => element.setCustomValidity("Please include more detail."))
    expect(await editor.locator.evaluate(element => element.validationMessage)).toContain("Please include more detail.")

    await editor.locator.evaluate(element => element.setCustomValidity(""))
    expect(await editor.locator.evaluate(element => element.validationMessage)).toBe("Please wait for all files to upload")
    expect(await editor.locator.evaluate(element => element.checkValidity())).toBe(false)

    await editor.locator.evaluate(element => element.setCustomValidity("Please include more detail."))
    await uploads.releaseDirectUploadResponses()
    await expect(page.locator("[data-event='lexxy:upload-end']")).toHaveCount(1)
    await expect.poll(() => editor.locator.evaluate(element => element.validationMessage)).toBe("Please include more detail.")

    await editor.locator.evaluate(element => element.setCustomValidity(""))
    expect(await editor.locator.evaluate(element => element.checkValidity())).toBe(true)
  })
})
