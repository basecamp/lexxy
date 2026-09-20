import { $getSelection, $isDecoratorNode, $isNodeSelection, $isRangeSelection, BLUR_COMMAND, COMMAND_PRIORITY_NORMAL } from "lexical"
import { announceFromEditor } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

// Decorators render as <figure contenteditable="false">.
// Two screen-reader quirks force us to flip DOM hints on the figure only while
// the caret is at it or one keystroke from crossing it, and revert them as
// soon as the caret moves away:
//
// 1. INLINE IMAGE-BACKED FIGURES. In focus mode, when the user reads
//    line by line (arrow up/down), the screen reader stops the moment it
//    hits an <img> with alt. So we can't set the avatar's alt permanently
//    — every line containing a mention would cut off there. We leave the
//    alt empty by default and let the visible name span carry the label, so
//    line-by-line reading flows through. We only set alt = label right
//    before the caret can cross the figure, so character-by-character
//    navigation announces the mention cleanly. As soon as the caret moves
//    away we put the alt back to empty.
//
// 2. GALLERY IMAGES. Stepping the caret past a gallery image's figcaption
//    character by character only reads the FIRST LETTER of the caption, no
//    matter what we put on the figcaption (an aria-label there isn't read
//    either). The workaround is to push the caption through the live region
//    at the moment the caret arrives. To stop that being announced doubled
//    with the first letter the screen reader is reading anyway, we aria-hide
//    the figcaption while the caret is there — and remove the aria-hidden as
//    soon as the caret leaves so browse mode reads the figcaption normally.
//
// A decorator opts in by exposing:
//
//   - get isAnnounceable          — truthy means we manage it
//   - setupAnnouncement(figure)   — flip into announcement-ready form
//   - teardownAnnouncement(figure) — flip back to natural
//
// And, for figures that need the live-region push (case 2):
//
//   - get shouldAnnounceLabel
//   - get label
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

  #updateAnnouncement = () => {
    this.#editor.getEditorState().read(() => {
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

// The decorator picked up by the current NodeSelection — a single
// participating decorator that the user just landed on. Null otherwise.
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

// The decorator one keystroke away from the anchor on either side: the anchor's
// text node's next sibling when the offset is within one character of its end,
// its previous sibling when within one character of its start, or the child on
// either side of an element anchor's offset. The 1-character buffer gives the
// screen reader time to pick up the freshly setup label before the caret steps
// onto the figure, whichever way it is travelling. When both neighbours qualify,
// as in the single space between two chips, the nearer one wins.
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
