import { ActionTextAttachmentNode, configure, Extension } from "lexxy"
import { defineExtension } from "@lexical/extension"

class AudioNode extends ActionTextAttachmentNode {
  $config() {
    return this.config("test-audio", { extends: ActionTextAttachmentNode })
  }

  createDOM() {
    const figure = document.createElement("figure")
    figure.className = "attachment"
    figure.style.padding = "12px"
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
        anchor: attachmentElement.firstElementChild,
        label: `Audio controls: ${node.caption}`,
        update({ node }) {
          play.ariaLabel = `${play.textContent} ${node.caption}`
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
