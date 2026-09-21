import { $getSelection, $isDecoratorNode, $isNodeSelection, $isRangeSelection, BLUR_COMMAND, COMMAND_PRIORITY_NORMAL } from "lexical"
import { announceFromEditor } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

// Using a mention's label as avatar alt text can interrupt line-by-line reading,
// but character navigation needs it near the caret to announce the mention.
//
// Character navigation reads only the first letter of gallery captions, even
// with aria-label. A live announcement needs the caption temporarily hidden to
// avoid duplicate speech; browse mode still needs the caption when we leave.
export class DecoratorAnnouncement {
  #editor
  #listeners = new ListenerBin()
  #active = null
  #announcedDecoratorKey = null

  constructor(editor) {
    this.#editor = editor
    this.#listeners.track(
      editor.registerUpdateListener(this.#updateAnnouncement),
      editor.registerCommand(BLUR_COMMAND, () => {
        this.#teardownAnnouncement()
        return false
      }, COMMAND_PRIORITY_NORMAL)
    )
  }

  destroy() {
    this.#listeners.dispose()
    this.#teardownAnnouncement()
  }

  #updateAnnouncement = ({ editorState }) => {
    if (document.activeElement === this.#editor.getRootElement()) {
      editorState.read(() => {
        const selection = $getSelection()
        const selectedDecorator = decoratorSelectedBy(selection)
        const upcomingDecorator = decoratorBesideAnchor(selection)

        if (selectedDecorator) {
          this.#setupAnnouncementOn(selectedDecorator)
          this.#announcedDecoratorKey = null
        } else if (upcomingDecorator) {
          this.#setupAnnouncementOn(upcomingDecorator)
          const key = upcomingDecorator.getKey()
          if (upcomingDecorator.shouldAnnounceLabel && key !== this.#announcedDecoratorKey) {
            announceFromEditor(this.#editor, upcomingDecorator.label, { transient: true })
            this.#announcedDecoratorKey = key
          }
        } else {
          this.#teardownAnnouncement()
        }
      })
    } else {
      this.#teardownAnnouncement()
    }
  }

  #setupAnnouncementOn(decorator) {
    const figure = this.#editor.getElementByKey(decorator.getKey())
    if (figure && figure !== this.#active?.figure) {
      this.#teardownAnnouncement()
      decorator.setupAnnouncement(figure)
      this.#active = { figure, decorator }
    }
  }

  #teardownAnnouncement() {
    if (this.#active) {
      const { decorator, figure } = this.#active
      decorator.teardownAnnouncement(figure)
      this.#active = null
    }
    this.#announcedDecoratorKey = null
  }
}

function decoratorSelectedBy(selection) {
  if ($isNodeSelection(selection)) {
    const nodes = selection.getNodes()
    if (nodes.length === 1 && isAnnounceableDecorator(nodes[0])) {
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
function decoratorBesideAnchor(selection) {
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
      .filter(({ node }) => isAnnounceableDecorator(node))
      .sort((a, b) => a.distance - b.distance)[0]

    return nearest?.node ?? null
  } else {
    return null
  }
}

function isAnnounceableDecorator(node) {
  return $isDecoratorNode(node) && node?.isAnnounceable
}
