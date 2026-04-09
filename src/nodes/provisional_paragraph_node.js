import { $createParagraphNode, $getSelection, $isElementNode, $isRangeSelection, $isRootOrShadowRoot, ParagraphNode } from "lexical"

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
    return !$isSelectableElement(nodeBefore, "next")
      && !$isSelectableElement(nodeAfter, "previous")
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

function $isSelectableElement(node, direction) {
  return $isElementNode(node) && (direction === "next" ? node.canInsertTextBefore() : node.canInsertTextAfter())
}
