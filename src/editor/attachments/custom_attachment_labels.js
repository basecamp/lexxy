import { $getSelection, $isNodeSelection, $isRangeSelection } from "lexical"
import { $isCustomActionTextAttachmentNode } from "../../nodes/custom_action_text_attachment_node"
import { ListenerBin, registerEventListener } from "../../helpers/listener_helper"

// Using a mention's label as avatar alt text can interrupt line-by-line reading,
// but character navigation needs it near the caret to announce the mention.
export class CustomAttachmentLabels {
  #editor
  #listeners = new ListenerBin()
  #active = null

  constructor(editor) {
    this.#editor = editor
    this.#listeners.track(
      editor.registerUpdateListener(this.#updateLabel),
      // A blur command opens a Lexical update that can pull focus back into the editor.
      editor.registerRootListener(rootElement => {
        if (rootElement) {
          return registerEventListener(rootElement, "blur", () => this.#restoreLabel())
        }
      })
    )
  }

  destroy() {
    this.#listeners.dispose()
    this.#restoreLabel()
  }

  #updateLabel = ({ editorState }) => {
    if (document.activeElement === this.#editor.getRootElement()) {
      editorState.read(() => {
        const selection = $getSelection()
        const attachment = customAttachmentSelectedBy(selection) || customAttachmentBesideAnchor(selection)

        if (attachment) {
          this.#exposeLabelOn(attachment)
        } else {
          this.#restoreLabel()
        }
      })
    } else {
      this.#restoreLabel()
    }
  }

  #exposeLabelOn(attachment) {
    const figure = this.#editor.getElementByKey(attachment.getKey())
    if (figure && figure !== this.#active?.figure) {
      this.#restoreLabel()
      attachment.exposeLabel(figure)
      this.#active = { figure, attachment }
    }
  }

  #restoreLabel() {
    if (this.#active) {
      const { attachment, figure } = this.#active
      attachment.restoreLabel(figure)
      this.#active = null
    }
  }
}

function customAttachmentSelectedBy(selection) {
  if ($isNodeSelection(selection)) {
    const nodes = selection.getNodes()
    if (nodes.length === 1 && $isCustomActionTextAttachmentNode(nodes[0])) {
      return nodes[0]
    } else {
      return null
    }
  } else {
    return null
  }
}

// Screen readers need the label one character early to announce it as the caret
// crosses the figure.
function customAttachmentBesideAnchor(selection) {
  if ($isRangeSelection(selection) && selection.isCollapsed()) {
    const anchor = selection.anchor
    const parent = anchor.getNode()
    const candidates = []

    if (anchor.type === "text") {
      const toEnd = parent.getTextContentSize() - anchor.offset
      if (toEnd <= 1) candidates.push({ node: parent.getNextSibling(), distance: toEnd })
      if (anchor.offset <= 1) candidates.push({ node: parent.getPreviousSibling(), distance: anchor.offset })
    } else {
      candidates.push({ node: parent.getChildAtIndex(anchor.offset), distance: 0 })
      candidates.push({ node: parent.getChildAtIndex(anchor.offset - 1), distance: 0 })
    }

    const nearest = candidates
      .filter(({ node }) => $isCustomActionTextAttachmentNode(node))
      .sort((a, b) => a.distance - b.distance)[0]

    return nearest?.node ?? null
  } else {
    return null
  }
}
