import LexxyExtension from "./lexxy_extension"
import { createElement, dispatch } from "../helpers/html_helper"

export default class VoiceNoteExtension extends LexxyExtension {
  mediaRecorder = null
  chunks = []

  get enabled() {
    return this.editorConfig.get("voiceNote")?.enabled ?? false
  }

  initializeToolbar(lexxyToolbar) {
    this.toolbar = lexxyToolbar
    this.button = this.#createButton()

    const position = this.editorConfig.get("voiceNote")?.position ?? ".lexxy-editor__toolbar-spacer"
    const insertBeforeElement = lexxyToolbar.querySelector(position)

    if (insertBeforeElement) {
      lexxyToolbar.insertBefore(this.button, insertBeforeElement)
    } else {
      lexxyToolbar.appendChild(this.button)
    }

    this.editorElement.addEventListener("lexxy:voice-note:recording", this.#handleRecording.bind(this))
    this.editorElement.addEventListener("lexxy:voice-note:stopped", this.#handleStopped.bind(this))
  }

  #createButton() {
    const button = createElement("button", {
      class: "lexxy-editor__toolbar-button",
      type: "button",
      name: "voice-note",
      title: "Record voice note"
    })
    button.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 9C19.5523 9 20 9.44772 20 10V11C20 15.0795 16.9462 18.4433 13 18.9355V21H15C15.5523 21 16 21.4477 16 22C16 22.5523 15.5523 23 15 23H9C8.44772 23 8 22.5523 8 22C8 21.4477 8.44772 21 9 21H11V18.9355C7.05384 18.4433 4 15.0795 4 11V10C4 9.44772 4.44772 9 5 9C5.55228 9 6 9.44772 6 10V11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11V10C18 9.44772 18.4477 9 19 9Z" />
    <path d="M12 1C14.2091 1 16 2.79086 16 5V11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11V5C8 2.79086 9.79086 1 12 1Z"/>
    </svg>`

    button.addEventListener("click", this.#handleRecordButtonClick.bind(this))

    return button
  }

  #handleRecordButtonClick() {
    this.#startRecording()
  }

  #handleRecording() {
    this.button.style.background = "red"
  }

  #handleStopped() {
    this.button.style.background = ""
  }

  // Recording logic (previously in VoiceNoteController)
  #startRecording() {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(
        this.#onSuccess.bind(this),
        this.#onError.bind(this)
      )
    } else {
      console.log("MediaDevices.getUserMedia() not supported on your browser!")
    }
  }

  #record() {
    this.mediaRecorder.start()
    dispatch(this.editorElement, "lexxy:voice-note:recording")
  }

  #stop() {
    this.mediaRecorder.stop()
    dispatch(this.editorElement, "lexxy:voice-note:stopped")
  }

  #onSuccess(stream) {
    if (this.mediaRecorder === null) {
      this.mediaRecorder = new MediaRecorder(stream)

      this.mediaRecorder.addEventListener("stop", this.#onStop.bind(this))

      const chunks = this.chunks
      this.mediaRecorder.ondataavailable = function (e) {
        chunks.push(e.data)
      }
    }

    if (this.mediaRecorder.state === "recording") {
      this.#stop()
    } else {
      this.#record()
    }
  }

  #onStop() {
    const blob = new Blob(this.chunks, { type: this.mediaRecorder.mimeType })
    const audioURL = window.URL.createObjectURL(blob)

    this.chunks = []

    this.editorElement.editor.dispatchCommand("insertVoiceNote", audioURL)

    this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
    this.mediaRecorder = null
  }

  #onError(err) {
    console.log("The following error occured: " + err)
  }
}
