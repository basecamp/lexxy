import { test } from "../../test_helper.js"
import { expect } from "@playwright/test"
import { mockActiveStorageUploads } from "../../helpers/active_storage_mock.js"

// Inject the shared drag simulation helper before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.simulateDragAndDrop = function (source, target, position = "onto") {
      const sourceKey = source.dataset.lexicalNodeKey
      if (!sourceKey) throw new Error("Source element has no data-lexical-node-key")

      const dataTransfer = new DataTransfer()
      dataTransfer.setData("application/x-lexxy-node-key", sourceKey)

      source.dispatchEvent(new DragEvent("dragstart", {
        bubbles: true, cancelable: true, dataTransfer,
      }))

      const targetRect = target.getBoundingClientRect()
      let clientX, clientY

      if (position === "onto") {
        clientX = targetRect.left + targetRect.width / 2
        clientY = targetRect.top + targetRect.height / 2
      } else if (position === "before") {
        clientX = targetRect.left + targetRect.width * 0.25
        clientY = targetRect.top + targetRect.height * 0.25
      } else {
        clientX = targetRect.left + targetRect.width * 0.75
        clientY = targetRect.top + targetRect.height * 0.75
      }

      target.dispatchEvent(new DragEvent("dragover", {
        bubbles: true, cancelable: true, clientX, clientY, dataTransfer,
      }))

      target.dispatchEvent(new DragEvent("drop", {
        bubbles: true, cancelable: true, clientX, clientY, dataTransfer,
      }))

      source.dispatchEvent(new DragEvent("dragend", {
        bubbles: true, dataTransfer,
      }))
    }
  })
})

test.describe("Attachment Drag and Drop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attachments.html")
    await page.waitForSelector("lexxy-editor[connected]")
    await page.waitForSelector("lexxy-toolbar[connected]")
    await mockActiveStorageUploads(page)
  })

  test.describe("Repositioning attachments", () => {
    test("drag a standalone image above a text paragraph", async ({ page, editor }) => {
      await editor.send("Hello world", "Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      await simulateDrag(page, "figure.attachment--preview", "p:not(.provisional-paragraph)", "before")

      await editor.flush()
      await expect(editor.content.locator("figure.attachment--preview + p")).toContainText("Hello world")
    })

    test("drag a file attachment above a text paragraph", async ({ page, editor }) => {
      await editor.send("Hello world", "Enter")
      await editor.uploadFile("test/fixtures/files/dummy.pdf")
      await waitForUploadsComplete(page)

      await simulateDrag(page, "figure.attachment--file", "p:not(.provisional-paragraph)", "before")

      await editor.flush()
      await expect(editor.content.locator("figure.attachment--file + p")).toContainText("Hello world")
    })

    test("drag an image and drop in same position causes no change", async ({ page, editor }) => {
      await editor.send("Before", "Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      const valueBefore = await editor.value()

      // Drag image "after" itself — should be a no-op
      await simulateDrag(page, "figure.attachment", "figure.attachment", "after")

      await editor.flush()
      const valueAfter = await editor.value()
      expect(valueAfter).toBe(valueBefore)
    })
  })

  test.describe("Gallery creation", () => {
    test("drag image onto another standalone image creates gallery", async ({ page, editor }) => {
      await editor.uploadFile("test/fixtures/files/example.png")
      await editor.send("Enter")
      await editor.uploadFile("test/fixtures/files/example2.png")
      await waitForUploadsComplete(page)

      await simulateDragByIndex(page, 1, 0, "onto")

      await assertGalleryWithImages(editor, 2)
    })

    test("drag image onto an existing gallery adds it", async ({ page, editor }) => {
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
      ])
      await assertGalleryWithImages(editor, 2)
      await waitForUploadsComplete(page)

      await editor.send("Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      const standalone = page.locator(".lexxy-editor__content > figure.attachment")
      const galleryImg = page.locator(".attachment-gallery figure.attachment").first()

      await dragLocatorToLocator(page, standalone, galleryImg, "onto")

      await assertGalleryWithImages(editor, 3)
    })

    test("drag a third standalone image onto a 2-image gallery", async ({ page, editor }) => {
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
      ])
      await assertGalleryWithImages(editor, 2)
      await waitForUploadsComplete(page)

      await editor.send("Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      const standalone = page.locator(".lexxy-editor__content > figure.attachment")
      const galleryImg = page.locator(".attachment-gallery figure.attachment").first()

      await dragLocatorToLocator(page, standalone, galleryImg, "onto")

      await assertGalleryWithImages(editor, 3)
    })
  })

  test.describe("Within-gallery reorder", () => {
    test("drag first image after last in a 3-image gallery", async ({ page, editor }) => {
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
        "test/fixtures/files/example.png",
      ])
      await assertGalleryWithImages(editor, 3)
      await waitForUploadsComplete(page)

      const images = page.locator(".attachment-gallery figure.attachment")
      const firstKey = await images.nth(0).getAttribute("data-lexical-node-key")

      await dragGalleryImage(page, 0, 2, "after")

      const lastKey = await images.nth(2).getAttribute("data-lexical-node-key")
      expect(lastKey).toBe(firstKey)
    })

    test("drag last image before first in a 3-image gallery", async ({ page, editor }) => {
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
        "test/fixtures/files/example.png",
      ])
      await assertGalleryWithImages(editor, 3)
      await waitForUploadsComplete(page)

      const images = page.locator(".attachment-gallery figure.attachment")
      const lastKey = await images.nth(2).getAttribute("data-lexical-node-key")

      await dragGalleryImage(page, 2, 0, "before")

      const firstKey = await images.nth(0).getAttribute("data-lexical-node-key")
      expect(firstKey).toBe(lastKey)
    })
  })

  test.describe("Moving out of gallery", () => {
    test("drag image out of 3-image gallery leaves 2 remaining", async ({ page, editor }) => {
      await editor.send("Below", "Enter")
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
        "test/fixtures/files/example.png",
      ])
      await assertGalleryWithImages(editor, 3)
      await waitForUploadsComplete(page)

      const galleryImage = page.locator(".attachment-gallery figure.attachment").first()
      const paragraph = page.locator(".lexxy-editor__content p:not(.provisional-paragraph)")

      await dragLocatorToLocator(page, galleryImage, paragraph, "before")

      await assertGalleryWithImages(editor, 2)
      await expect(page.locator("figure.attachment")).toHaveCount(3)
    })

    test("drag image out of 2-image gallery unwraps remaining image", async ({ page, editor }) => {
      await editor.send("Below", "Enter")
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
      ])
      await assertGalleryWithImages(editor, 2)
      await waitForUploadsComplete(page)

      const galleryImage = page.locator(".attachment-gallery figure.attachment").first()
      const paragraph = page.locator(".lexxy-editor__content p:not(.provisional-paragraph)")

      await dragLocatorToLocator(page, galleryImage, paragraph, "before")

      await assertNoGallery(page)
      await expect(page.locator("figure.attachment")).toHaveCount(2)
    })
  })

  test.describe("Gallery to gallery", () => {
    test("drag image from one gallery onto another", async ({ page, editor }) => {
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
      ])
      await assertGalleryWithImages(editor, 2)

      await editor.send("Enter", "Separator", "Enter")
      await editor.uploadFile([
        "test/fixtures/files/example.png",
        "test/fixtures/files/example2.png",
      ])

      await expect(page.locator(".attachment-gallery")).toHaveCount(2)
      await waitForUploadsComplete(page)

      const gallery1Image = page.locator(".attachment-gallery").nth(0).locator("figure.attachment").first()
      const gallery2Image = page.locator(".attachment-gallery").nth(1).locator("figure.attachment").first()

      await dragLocatorToLocator(page, gallery1Image, gallery2Image, "onto")

      await expect(page.locator(".attachment-gallery").last().locator("figure.attachment")).toHaveCount(3)
    })
  })

  test.describe("Undo/redo", () => {
    const modifier = process.platform === "darwin" ? "Meta" : "Control"

    test("undo reverses gallery creation", async ({ page, editor }) => {
      await editor.uploadFile("test/fixtures/files/example.png")
      await editor.send("Enter")
      await editor.uploadFile("test/fixtures/files/example2.png")
      await waitForUploadsComplete(page)

      await simulateDragByIndex(page, 1, 0, "onto")
      await assertGalleryWithImages(editor, 2)

      await editor.send(`${modifier}+z`)

      await assertNoGallery(page)
      await expect(page.locator("figure.attachment")).toHaveCount(2)
    })

    test("undo reverses repositioning", async ({ page, editor }) => {
      await editor.send("Hello world", "Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      await simulateDrag(page, "figure.attachment--preview", "p:not(.provisional-paragraph)", "before")

      await editor.flush()
      await expect(editor.content.locator("figure.attachment--preview + p")).toContainText("Hello world")

      await editor.send(`${modifier}+z`)

      await expect(editor.content.locator("p:not(.provisional-paragraph) ~ figure.attachment")).toBeVisible()
    })
  })

  test.describe("Visual feedback", () => {
    test("source has lexxy-dragging class during drag", async ({ page, editor }) => {
      await editor.send("Target", "Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      const hasDraggingClass = await page.evaluate(() => {
        const figure = document.querySelector("figure.attachment")

        const dt = new DataTransfer()
        figure.dispatchEvent(new DragEvent("dragstart", {
          bubbles: true, cancelable: true, dataTransfer: dt,
        }))

        return new Promise(resolve => {
          requestAnimationFrame(() => {
            resolve(figure.classList.contains("lexxy-dragging"))
          })
        })
      })

      expect(hasDraggingClass).toBe(true)

      await page.evaluate(() => {
        const figure = document.querySelector("figure.attachment")
        figure.dispatchEvent(new DragEvent("dragend", { bubbles: true }))
      })

      await expect(page.locator("figure.attachment.lexxy-dragging")).toHaveCount(0)
    })

    test("hovering over an image shows gallery drop target highlight", async ({ page, editor }) => {
      await editor.uploadFile("test/fixtures/files/example.png")
      await editor.send("Enter")
      await editor.uploadFile("test/fixtures/files/example2.png")
      await waitForUploadsComplete(page)

      const hasHighlight = await page.evaluate(() => {
        const figures = document.querySelectorAll("figure.attachment")
        const source = figures[0]
        const target = figures[1]

        const dt = new DataTransfer()
        dt.setData("application/x-lexxy-node-key", source.dataset.lexicalNodeKey)

        source.dispatchEvent(new DragEvent("dragstart", {
          bubbles: true, cancelable: true, dataTransfer: dt,
        }))

        const rect = target.getBoundingClientRect()
        target.dispatchEvent(new DragEvent("dragover", {
          bubbles: true, cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
          dataTransfer: dt,
        }))

        // Double rAF: the dragover handler schedules a rAF to update the drop
        // target, so we need to wait for that rAF to complete before checking.
        return new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve(
                target.classList.contains("lexxy-drop-target--gallery-before") ||
                target.classList.contains("lexxy-drop-target--gallery-after")
              )
            })
          })
        })
      })

      expect(hasHighlight).toBe(true)
    })
  })

  test.describe("List splitting", () => {
    test("drag image onto middle list item splits the list", async ({ page, editor }) => {
      await editor.setValue("<ul><li>First</li><li>Second</li><li>Third</li></ul>")
      await editor.send("ArrowDown", "ArrowDown", "ArrowDown", "Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      const figure = page.locator("figure.attachment")
      const secondLi = page.locator(".lexxy-editor__content li").nth(1)

      await dragLocatorToLocator(page, figure, secondLi, "before")

      await editor.flush()
      const lists = editor.content.locator("ul")
      await expect(lists).toHaveCount(2)
      await expect(lists.nth(0).locator("li")).toHaveCount(1)
      await expect(lists.nth(1).locator("li")).toHaveCount(2)
      await expect(editor.content.locator("figure.attachment")).toHaveCount(1)
    })

    test("drag image before first list item inserts above the list", async ({ page, editor }) => {
      await editor.setValue("<ul><li>First</li><li>Second</li></ul>")
      await editor.send("ArrowDown", "ArrowDown", "Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      const figure = page.locator("figure.attachment")
      const firstLi = page.locator(".lexxy-editor__content li").first()

      await dragLocatorToLocator(page, figure, firstLi, "before")

      await editor.flush()
      await expect(editor.content.locator("ul")).toHaveCount(1)
      await expect(editor.content.locator("figure.attachment ~ ul")).toBeVisible()
    })

    test("drag image after last list item inserts below the list", async ({ page, editor }) => {
      await editor.setValue("<ul><li>First</li><li>Second</li></ul>")
      await editor.send("ArrowDown", "ArrowDown", "Enter")
      await editor.uploadFile("test/fixtures/files/example.png")
      await waitForUploadsComplete(page)

      const figure = page.locator("figure.attachment")
      const lastLi = page.locator(".lexxy-editor__content li").last()

      await dragLocatorToLocator(page, figure, lastLi, "after")

      await editor.flush()
      await expect(editor.content.locator("ul")).toHaveCount(1)
      await expect(editor.content.locator("ul ~ figure.attachment")).toBeVisible()
    })
  })

  test.describe("External DnD preserved", () => {
    test("external file drop still works", async ({ page, editor }) => {
      await editor.send("Existing content")

      await editor.uploadFile("test/fixtures/files/example.png")

      await assertAttachmentVisible(page, "image/png")
      await expect(editor.content).toContainText("Existing content")
    })
  })
})

// --- Helpers ---

async function waitForUploadsComplete(page) {
  await expect(page.locator("figure.attachment > progress")).toHaveCount(0, { timeout: 10_000 })
}

async function assertAttachmentVisible(page, contentType) {
  await expect(
    page.locator(`figure.attachment[data-content-type='${contentType}']`),
  ).toBeVisible({ timeout: 10_000 })
}

async function assertGalleryWithImages(editor, count) {
  const gallery = editor.content.locator(".attachment-gallery").first()
  await expect(gallery).toBeVisible({ timeout: 10_000 })
  await expect(gallery.locator("figure.attachment")).toHaveCount(count)
}

async function assertNoGallery(page) {
  await expect(page.locator(".attachment-gallery")).toHaveCount(0)
}

async function simulateDrag(page, sourceSelector, targetSelector, position = "after") {
  await page.evaluate(({ sourceSelector, targetSelector, position }) => {
    const root = document.querySelector(".lexxy-editor__content")
    const source = root.querySelector(sourceSelector)
    const target = root.querySelector(targetSelector)
    if (!source || !target) throw new Error(`Not found: ${sourceSelector} or ${targetSelector}`)
    window.simulateDragAndDrop(source, target, position)
  }, { sourceSelector, targetSelector, position })
}

async function simulateDragByIndex(page, sourceIndex, targetIndex, position) {
  await page.evaluate(({ sourceIndex, targetIndex, position }) => {
    const figures = document.querySelectorAll(".lexxy-editor__content figure.attachment")
    window.simulateDragAndDrop(figures[sourceIndex], figures[targetIndex], position)
  }, { sourceIndex, targetIndex, position })
}

async function dragLocatorToLocator(page, sourceLocator, targetLocator, position = "onto") {
  const sourceHandle = await sourceLocator.elementHandle()
  const targetHandle = await targetLocator.elementHandle()

  await page.evaluate(({ source, target, position }) => {
    window.simulateDragAndDrop(source, target, position)
  }, { source: sourceHandle, target: targetHandle, position })
}

async function dragGalleryImage(page, sourceIndex, targetIndex, position) {
  await page.evaluate(({ sourceIndex, targetIndex, position }) => {
    const images = document.querySelectorAll(".attachment-gallery figure.attachment")
    window.simulateDragAndDrop(images[sourceIndex], images[targetIndex], position)
  }, { sourceIndex, targetIndex, position })
}
