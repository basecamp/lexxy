import { ActionTextAttachmentNode, configure, Extension } from "lexxy"
import { defineExtension } from "@lexical/extension"

const options = new URLSearchParams(location.search)

class AudioNode extends ActionTextAttachmentNode {
  static clone(node) {
    return new AudioNode({ ...node }, node.__key)
  }

  $config() {
    return this.config("test-audio", { extends: ActionTextAttachmentNode })
  }

  isInline() {
    return options.has("inline") || super.isInline()
  }

  createDOM() {
    const figure = document.createElement("figure")
    figure.className = "attachment"
    figure.style.padding = "12px"
    if (options.has("inline")) figure.style.display = "inline-block"
    const preview = document.createElement("div")
    preview.className = "audio-preview"
    preview.textContent = this.caption
    figure.append(preview)
    const caption = document.createElement("figcaption")
    caption.className = "attachment__caption attachment__caption--editable"
    const text = document.createElement("span")
    text.className = "attachment__caption-text"
    text.textContent = this.caption
    caption.append(text)
    figure.append(caption)
    const progress = document.createElement("span")
    progress.className = "audio-progress-anchor"
    figure.append(progress)
    return figure
  }

  static from(node) {
    return new AudioNode({ ...node })
  }
}

class AudioExtension extends Extension {
  get lexicalExtension() {
    return defineExtension({
      name: "test/audio-controls",
      nodes: [AudioNode],
      register: editor => editor.registerNodeTransform(ActionTextAttachmentNode, node => {
        if (node.contentType === "audio/mpeg") node.replace(AudioNode.from(node))
      })
    })
  }

  get attachmentControls() {
    return [{ node: AudioNode, create: ({ node, attachmentElement }) => {
      const element = document.createElement("div")
      element.className = "audio-controls"
      const play = document.createElement("button")
      play.type = "button"
      play.ariaLabel = `Play ${node.caption}`
      play.textContent = "Play"
      element.append(play)
      if (options.has("group")) {
        const position = document.createElement("input")
        position.ariaLabel = "Position"
        position.value = "0:00"
        element.append(position)
        const reset = document.createElement("button")
        reset.type = "button"
        reset.textContent = "Reset"
        element.append(reset)
      }
      const progress = document.createElement("div")
      progress.className = "audio-progress"
      element.append(progress)
      let mute

      const togglePlayback = () => {
        play.ariaLabel = play.ariaLabel.replace(/^Play|^Pause/, state => {
          if (state === "Play") return "Pause"
          return "Play"
        })
      }
      play.addEventListener("click", togglePlayback)
      window.controlsCreated = (window.controlsCreated || 0) + 1

      return {
        element,
        role: options.has("group") ? "group" : "toolbar",
        placements: [
          { element: play, anchor: attachmentElement.firstElementChild },
          { element: progress, anchor: attachmentElement.lastElementChild }
        ],
        label: `Audio controls: ${node.caption}`,
        update({ node }) {
          play.ariaLabel = `${play.textContent} ${node.caption}`
          this.label = `Audio controls: ${node.caption}`
          if (node.caption === "With mute" && !mute) {
            mute = document.createElement("button")
            mute.type = "button"
            mute.textContent = "Mute"
            element.append(mute)
          }
        },
        dispose() {
          play.removeEventListener("click", togglePlayback)
          window.controlsDisposed = (window.controlsDisposed || 0) + 1
        }
      }
    } }]
  }
}

configure({ global: { extensions: [AudioExtension] } })

document.getElementById("toggle-editor").addEventListener("click", () => {
  const editor = document.querySelector("lexxy-editor")
  if (editor.style.display === "none") {
    editor.style.display = ""
  } else {
    editor.style.display = "none"
  }
})
