import { $getNodeByKey, HISTORY_MERGE_TAG } from "lexical"

export default class AttachmentController {
  #editor
  #renderer
  #nodeKey
  #abortController = null

  constructor(editor, renderer, nodeKey) {
    this.#editor = editor
    this.#renderer = renderer
    this.#nodeKey = nodeKey
  }

  get nodeKey() {
    return this.#nodeKey
  }

  render(data) {
    this.#renderer.render(this.#nodeKey, data, this)
  }

  updateCaption(caption) {
    this.#editor.update(() => {
      const node = $getNodeByKey(this.#nodeKey)
      if (!node || !node.isAttached()) return
      node.getWritable().caption = caption
    })
  }

  selectAfterNode() {
    this.#editor.update(() => {
      const node = $getNodeByKey(this.#nodeKey)
      if (!node || !node.isAttached()) return
      node.selectNext(0, 0)
    }, { tag: HISTORY_MERGE_TAG })
  }

  showProgress() {
    this.#renderer.showProgress(this.#nodeKey)
  }

  updateProgress(progress) {
    this.#renderer.updateProgress(this.#nodeKey, progress)
  }

  completeUpload() {
    this.#abortController = null
    this.#renderer.hideProgress(this.#nodeKey)
  }

  showError(fileName) {
    this.#abortController = null
    this.#renderer.showError(this.#nodeKey, fileName)
  }

  registerAbort(abortFn) {
    this.#abortController = abortFn
  }

  abort() {
    this.#abortController?.()
    this.#abortController = null
  }

  destroy() {
    this.abort()
  }
}
