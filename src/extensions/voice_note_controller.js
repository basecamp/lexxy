import { dispatch } from "../helpers/html_helper"

export default class VoiceNoteController {
  mediaRecorder = null
  chunks = []

  constructor(editorElement) {
    this.editorElement = editorElement
    this.editor = editorElement.editor
    this.contents = editorElement.contents

    this.chunks = []
  }

  startRecording() {
    if (navigator.mediaDevices.getUserMedia) {
      console.log("The mediaDevices.getUserMedia() method is supported.");
      navigator.mediaDevices.getUserMedia({ audio: true }).then(this.#onSuccess.bind(this), this.#onError.bind(this))
    } else {
      console.log("MediaDevices.getUserMedia() not supported on your browser!")
    }
  }
  
  #record() {
    this.mediaRecorder.start()
    console.log("Recorder started.")
    dispatch(this.editorElement, "lexxy:voice-note:recording")
  }

  #stop() {
    this.mediaRecorder.stop()
    console.log("Recorder stopped.")
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

    console.log(this.mediaRecorder.state)

    if (this.mediaRecorder.state === "recording") {
      this.#stop()
    } else {
      this.#record()
    }
  }

  #onStop() {
    console.log("Last data to read (after MediaRecorder.stop() called).")

    const blob = new Blob(this.chunks, { type: this.mediaRecorder.mimeType })
    const audioURL = window.URL.createObjectURL(blob)
    
    this.chunks = []

    this.editor.dispatchCommand("insertVoiceNote", audioURL)

    this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
    this.mediaRecorder = null
  }

  #onError(err) {
    console.log("The following error occured: " + err)
  }
}