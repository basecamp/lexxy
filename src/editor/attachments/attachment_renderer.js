import { createElement, isPreviewableImage } from "../../helpers/html_helper"
import { bytesToHumanSize } from "../../helpers/storage_helper"

export default class AttachmentRenderer {
  #editor

  constructor(editor) {
    this.#editor = editor
  }

  render(nodeKey, data, controller) {
    const figure = this.#editor.getElementByKey(nodeKey)
    if (!figure) return

    this.#clearContent(figure)

    if (this.#isPreviewable(data)) {
      figure.appendChild(this.#createImageContent(data))
      figure.appendChild(this.#createEditableCaption(data, controller))
    } else if (this.#isVideo(data)) {
      figure.appendChild(this.#createFileIcon(data))
      figure.appendChild(this.#createEditableCaption(data, controller))
    } else {
      figure.appendChild(this.#createFileIcon(data))
      figure.appendChild(this.#createFileCaption(data))
    }
  }

  updateProgress(nodeKey, progress) {
    const figure = this.#editor.getElementByKey(nodeKey)
    const bar = figure?.querySelector("progress")
    if (bar) bar.value = progress
  }

  showProgress(nodeKey) {
    const figure = this.#editor.getElementByKey(nodeKey)
    if (!figure || figure.querySelector("progress")) return

    figure.appendChild(createElement("progress", { value: 0, max: 100 }))
  }

  hideProgress(nodeKey) {
    const figure = this.#editor.getElementByKey(nodeKey)
    figure?.querySelector("progress")?.remove()
  }

  showError(nodeKey, fileName) {
    const figure = this.#editor.getElementByKey(nodeKey)
    if (!figure) return

    this.#clearContent(figure)
    figure.classList.add("attachment--error")
    figure.appendChild(createElement("div", { innerText: `Error uploading ${fileName || "file"}` }))
  }

  #clearContent(figure) {
    for (const child of [ ...figure.querySelectorAll(".attachment__container, .attachment__icon, figcaption, progress") ]) {
      child.remove()
    }
    figure.classList.remove("attachment--error")
  }

  #createImageContent(data) {
    const imgAttrs = { src: data.src, draggable: false, alt: data.altText || "" }
    if (data.width && data.height) {
      imgAttrs.width = data.width
      imgAttrs.height = data.height
    }

    const img = createElement("img", imgAttrs)
    const container = createElement("div", { className: "attachment__container" })
    container.appendChild(img)
    return container
  }

  #createFileIcon(data) {
    const extension = data.fileName ? data.fileName.split(".").pop().toLowerCase() : "unknown"
    return createElement("span", { className: "attachment__icon", textContent: extension })
  }

  #createFileCaption(data) {
    const figcaption = createElement("figcaption", { className: "attachment__caption" })
    figcaption.appendChild(createElement("strong", { className: "attachment__name", textContent: data.caption || data.fileName }))

    if (data.fileSize) {
      figcaption.appendChild(createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(data.fileSize) }))
    }

    return figcaption
  }

  #createEditableCaption(data, controller) {
    const caption = createElement("figcaption", { className: "attachment__caption" })
    const input = createElement("textarea", {
      value: data.caption || "",
      placeholder: data.fileName,
      rows: "1"
    })

    input.addEventListener("focusin", () => input.placeholder = "Add caption...")
    input.addEventListener("blur", () => {
      input.placeholder = data.fileName
      controller.updateCaption(input.value)
    })
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        event.target.blur()
        controller.selectAfterNode()
      }
      event.stopPropagation()
    })
    input.addEventListener("copy", (event) => event.stopPropagation())
    input.addEventListener("cut", (event) => event.stopPropagation())
    input.addEventListener("paste", (event) => event.stopPropagation())

    caption.appendChild(input)
    return caption
  }

  #isPreviewable(data) {
    return isPreviewableImage(data.contentType) || data.previewable
  }

  #isVideo(data) {
    return data?.contentType?.startsWith("video/")
  }
}
