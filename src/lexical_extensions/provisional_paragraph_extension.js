import { $createParagraphNode, $getRoot, $getSelection, $isElementNode, $isRootOrShadowRoot, COMMAND_PRIORITY_HIGH, ParagraphNode, RootNode, SELECTION_CHANGE_COMMAND, defineExtension } from "lexical"
import { $descendantsMatching, $firstToLastIterator, $insertFirst, mergeRegister } from "@lexical/utils"

class ProvisionalParagraphNode extends ParagraphNode {
  $config() {
    return this.config("provisonal-paragraph-node", {
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
    return targetSelection?.getNodes().some(node => node.is(this) || this.isParentOf(node))
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

function $isProvisionalParagraphNode(node) {
  return node instanceof ProvisionalParagraphNode
}

function $isSelectableElement(node, direction) {
  return $isElementNode(node) && (direction === "next" ? node.canInsertTextBefore() : node.canInsertTextAfter())
}

export const ProvisionalParagraphExtension = defineExtension({
  name: "lexxy/provisional-paragraph",
  nodes: [
    ProvisionalParagraphNode
  ],
  register(editor) {
    return mergeRegister(
      // Process Provisional Paragraph Nodes on root changes as sibling status influences whether
      // they are required and their visible/hidden status
      editor.registerNodeTransform(RootNode, $insertRequiredProvisionalParagraphs),
      editor.registerNodeTransform(RootNode, $ensureProvisionalParagraphsRequired),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, $markAllProvisionParagraphsDirty, COMMAND_PRIORITY_HIGH)
    )
  }
})

function $insertRequiredProvisionalParagraphs(rootNode) {
  const firstNode = rootNode.getFirstChild()
  if (ProvisionalParagraphNode.neededBetween(null, firstNode)) {
    $insertFirst(rootNode, new ProvisionalParagraphNode)
  }

  for (const node of $firstToLastIterator(rootNode)) {
    const nextNode = node.getNextSibling()
    if (ProvisionalParagraphNode.neededBetween(node, nextNode)) {
      node.insertAfter(new ProvisionalParagraphNode)
    }
  }
}

function $ensureProvisionalParagraphsRequired(rootNode) {
  for (const provisionalParagraph of $getAllProvisionalParagraphs(rootNode)) {
    provisionalParagraph.removeUnlessRequired()
  }
}

function $markAllProvisionParagraphsDirty() {
  for (const provisionalParagraph of $getAllProvisionalParagraphs()) {
    provisionalParagraph.markDirty()
  }
}

function $getAllProvisionalParagraphs(rootNode = $getRoot()) {
  return $descendantsMatching(rootNode.getChildren(), $isProvisionalParagraphNode)
}
