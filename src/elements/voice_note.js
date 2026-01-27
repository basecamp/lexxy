import VoiceNoteController from "../extensions/voice_note_controller"
import { createElement } from "../helpers/html_helper"

export class VoiceNoteButton {
  constructor(toolbar) {
    console.log("VoiceNoteButton initialize")
    this.editorElement = toolbar.editorElement
    this.editor = toolbar.editorElement.editor
    this.contents = toolbar.editorElement.contents
    this.voiceNoteController = new VoiceNoteController(toolbar.editorElement)

    this.editorElement.addEventListener("lexxy:voice-note:recording", this.#handleRecording.bind(this))
    this.editorElement.addEventListener("lexxy:voice-note:stopped", this.#handleStopped.bind(this))
  }

  setup(position) {
    this.button = this.#createButton()
    this.editorElement.toolbarElement.insertBefore(this.button, this.editorElement.toolbarElement.querySelector(position))
  }

  #createButton() {
    const button = createElement("button", { class: "lexxy-editor__toolbar-button" })
    button.innerHTML = `<svg viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg">
    <path d="M19 9C19.5523 9 20 9.44772 20 10V11C20 15.0795 16.9462 18.4433 13 18.9355V21H15C15.5523 21 16 21.4477 16 22C16 22.5523 15.5523 23 15 23H9C8.44772 23 8 22.5523 8 22C8 21.4477 8.44772 21 9 21H11V18.9355C7.05384 18.4433 4 15.0795 4 11V10C4 9.44772 4.44772 9 5 9C5.55228 9 6 9.44772 6 10V11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11V10C18 9.44772 18.4477 9 19 9Z" />
    <path d="M12 1C14.2091 1 16 2.79086 16 5V11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11V5C8 2.79086 9.79086 1 12 1Z"/>
    </svg>`
    
    button.addEventListener("click", this.#handleRecordButtonClick.bind(this))

    return button
  }

  #handleRecordButtonClick() {
    this.voiceNoteController.startRecording()
  }

  #handleRecording() {
    this.button.style.background = "red"
  }

  #handleStopped() {
    this.button.style.background = ""
  }
}