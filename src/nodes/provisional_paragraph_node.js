import { $createParagraphNode, $getSelection, $isDecoratorNode, $isElementNode, $isRangeSelection, $isRootOrShadowRoot, ParagraphNode } from "lexical"
import { $isBlockContainer } from "../helpers/lexical_helper"
import { $isImageGalleryNode } from "./image_gallery_node"

export class ProvisionalParagraphNode extends ParagraphNode {
  $config() {
    return this.config("provisonal_paragraph", {
      extends: ParagraphNode,
      importDOM: () => null,
      $transform: (node) => {
        node.concretizeIfEdited(node)
        node.removeUnlessRequired(node)
      }
    })
  }

  static neededBetween(nodeBefore, nodeAfter) {
    return !$offersCaretAtEdge(nodeBefore, "previous", nodeAfter)
      && !$offersCaretAtEdge(nodeAfter, "next", nodeBefore)
  }

  createDOM(editor) {
    const p = super.createDOM(editor)
    const selected = this.isSelected($getSelection())
    p.classList.add("provisional-paragraph")
    p.classList.toggle("hidden", !selected)
    return p
  }

  updateDOM(_prevNode, dom) {
    const selected = this.isSelected($getSelection())
    dom.classList.toggle("hidden", !selected)
    return false
  }

  getTextContent() {
    return ""
  }

  exportDOM() {
    return {
      element: null
    }
  }

  // override as Lexical has an interesting view of collapsed selection in ElementNodes
  // https://github.com/facebook/lexical/blob/f1e4f66014377b1f2595aec2b0ee17f5b7ef4dfc/packages/lexical/src/LexicalNode.ts#L646
  isSelected(selection = null) {
    const targetSelection = selection || $getSelection()
    if (!targetSelection) return false

    if (targetSelection.getNodes().some(node => node.is(this) || this.isParentOf(node))) return true

    // A collapsed range selection on the parent element at an offset adjacent to
    // this node means the caret is visually at this paragraph's position. Treat it
    // as selected so the paragraph is visible and the caret renders correctly.
    //
    // Both the offset matching our index (cursor just before us) and index + 1
    // (cursor just after us) count, because the provisional paragraph is an
    // invisible spacer: the browser resolves both offsets to the same visual spot.
    if ($isRangeSelection(targetSelection) && targetSelection.isCollapsed()) {
      const { anchor } = targetSelection
      const parent = this.getParent()
      if (parent && anchor.getNode().is(parent) && anchor.type === "element") {
        const index = this.getIndexWithinParent()
        return anchor.offset === index || anchor.offset === index + 1
      }
    }

    return false
  }

  removeUnlessRequired(self = this.getLatest()) {
    if (!self.required) self.remove()
  }

  concretizeIfEdited(self = this.getLatest()) {
    if (self.getTextContentSize() > 0) {
      self.replace($createParagraphNode(), true)
    }
  }


  get required() {
    return this.isDirectRootChild && ProvisionalParagraphNode.neededBetween(...this.immediateSiblings)
  }

  get isDirectRootChild() {
    const parent = this.getParent()
    return $isRootOrShadowRoot(parent)
  }

  get immediateSiblings() {
    return [ this.getPreviousSibling(), this.getNextSibling() ]
  }
}

export function $isProvisionalParagraphNode(node) {
  return node instanceof ProvisionalParagraphNode
}

// `direction` points from the gap into the node: "next" asks about a node's leading edge,
// "previous" about its trailing one. A block container — a quote holding paragraphs, a list
// holding items — holds no caret at that edge either, but it only earns a spacer when a decorator
// sits across the gap. Anywhere else its edge is already reachable, and a spacer there would
// widen what Select All covers.
function $offersCaretAtEdge(node, direction, opposite) {
  return $isElementNode(node)
    && $acceptsTextAtEdge(node, direction)
    && !($isDecoratorNode(opposite) && $holdsOnlyBlocks(node, direction))
}

// A gallery is a block container as well, but its attachments report themselves inline — they
// only do so to satisfy Lexical's rule that the root holds no inline nodes — so the generic
// check can't see it.
function $holdsOnlyBlocks(node, direction) {
  return $isImageGalleryNode(node) || $isBlockContainer(node, direction)
}

function $acceptsTextAtEdge(node, direction) {
  if (direction === "next") {
    return node.canInsertTextBefore()
  } else {
    return node.canInsertTextAfter()
  }
}
