import { mergeRegister } from "@lexical/utils"
import { $createActionTextAttachmentNode } from "../../nodes/action_text_attachment_node"
import AttachmentController from "./attachment_controller"
import AttachmentRenderer from "./attachment_renderer"

export default class AttachmentManager {
  #editor
  #renderer
  #controllers = new Map()
  #previousDecorators = {}

  constructor(editor) {
    this.#editor = editor
    this.#renderer = new AttachmentRenderer(editor)
  }

  register() {
    return mergeRegister(
      this.#editor.registerDecoratorListener((decorators) => {
        this.#reconcileDecorators(decorators)
      }),
      () => this.#cleanup()
    )
  }

  controllerFor(nodeKey) {
    return this.#controllers.get(nodeKey)
  }

  // Create an attachment from an existing sgid (no upload needed).
  // Must be called inside editor.update().
  $createFromSgid(props) {
    return $createActionTextAttachmentNode(props)
  }

  // Create an attachment by uploading a file. Runs the full DirectUpload,
  // then inserts the node with the resulting sgid.
  // Returns a promise that resolves to the controller for the new attachment.
  async createFromFile(file, { caption, uploadUrl, blobUrlTemplate, insertNode } = {}) {
    const blob = await this.#upload(file, uploadUrl)

    let nodeKey = null
    this.#editor.update(() => {
      const node = $createActionTextAttachmentNode({
        sgid: blob.attachable_sgid,
        src: blob.previewable ? blob.url : this.#blobSrc(blobUrlTemplate, blob),
        contentType: blob.content_type,
        fileName: blob.filename,
        fileSize: blob.byte_size,
        previewable: blob.previewable,
        caption: caption || ""
      })

      if (insertNode) {
        insertNode(node)
      }

      nodeKey = node.getKey()
    })

    return nodeKey ? this.controllerFor(nodeKey) : null
  }

  async #upload(file, uploadUrl) {
    const { DirectUpload } = await import("@rails/activestorage")

    return new Promise((resolve, reject) => {
      const upload = new DirectUpload(file, uploadUrl)
      upload.create((error, blob) => {
        if (error) reject(error)
        else resolve(blob)
      })
    })
  }

  #blobSrc(template, blob) {
    if (!template) return null
    return template
      .replace(":signed_id", blob.signed_id)
      .replace(":filename", encodeURIComponent(blob.filename))
  }

  #reconcileDecorators(decorators) {
    const previous = this.#previousDecorators

    for (const [ nodeKey, data ] of Object.entries(decorators)) {
      if (!this.#isAttachmentDecorator(data)) continue

      if (previous[nodeKey] !== data) {
        const controller = this.#ensureController(nodeKey)
        controller.render(data)
      }
    }

    for (const nodeKey of Object.keys(previous)) {
      if (!this.#isAttachmentDecorator(previous[nodeKey])) continue

      if (!(nodeKey in decorators)) {
        this.#destroyController(nodeKey)
      }
    }

    this.#previousDecorators = decorators
  }

  #ensureController(nodeKey) {
    let controller = this.#controllers.get(nodeKey)
    if (!controller) {
      controller = new AttachmentController(this.#editor, this.#renderer, nodeKey)
      this.#controllers.set(nodeKey, controller)
    }
    return controller
  }

  #destroyController(nodeKey) {
    const controller = this.#controllers.get(nodeKey)
    if (controller) {
      controller.destroy()
      this.#controllers.delete(nodeKey)
    }
  }

  #isAttachmentDecorator(data) {
    return data !== null && typeof data === "object" && "sgid" in data && "contentType" in data
  }

  #cleanup() {
    for (const [ , controller ] of this.#controllers) {
      controller.destroy()
    }
    this.#controllers.clear()
    this.#previousDecorators = {}
  }
}
