import { $getNodeByKey } from "lexical"
import { ListenerBin } from "../../helpers/listener_helper"

export default class AttachmentControls {
  #editorElement
  #editor
  #listeners = new ListenerBin()
  #mounted = new Map()

  constructor(editorElement, definitions) {
    this.#editorElement = editorElement
    this.#editor = editorElement.editor

    for (const definition of definitions) {
      this.#listeners.track(this.#editor.registerMutationListener(definition.node, mutations => {
        this.#editor.read(() => {
          for (const [ key, mutation ] of mutations) {
            if (mutation === "destroyed") {
              this.#unmount(key)
            } else {
              this.#refresh(key, definition)
            }
          }
        })
      }, { skipInitialization: false }))
    }
  }

  has(nodeKey) {
    return this.#mounted.has(nodeKey)
  }

  elementFor(nodeKey) {
    return this.#mounted.get(nodeKey)?.controls.element ?? null
  }

  dispose() {
    this.#listeners.dispose()
    for (const key of this.#mounted.keys()) this.#unmount(key)
  }

  #refresh(nodeKey, definition) {
    const node = $getNodeByKey(nodeKey)
    const attachmentElement = this.#editor.getElementByKey(nodeKey)
    const mounted = this.#mounted.get(nodeKey)

    if (mounted && mounted.attachmentElement === attachmentElement) {
      mounted.controls.update?.({ node, attachmentElement })
      mounted.toolbar.refresh()
    } else if (attachmentElement) {
      this.#unmount(nodeKey)
      const controls = definition.create({ node, attachmentElement })
      if (controls) {
        const toolbar = document.createElement("lexxy-attachment-toolbar")
        toolbar.bind({ nodeKey, controls })
        this.#mounted.set(nodeKey, { attachmentElement, controls, toolbar })
        this.#editorElement.append(toolbar)
      }
    }
  }

  #unmount(nodeKey) {
    const mounted = this.#mounted.get(nodeKey)
    if (mounted) {
      this.#mounted.delete(nodeKey)
      mounted.toolbar.remove()
    }
  }
}
