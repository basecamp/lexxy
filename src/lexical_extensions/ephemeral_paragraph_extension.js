import { $createParagraphNode, $getPreviousSelection, $getRoot, $getSelection, $isElementNode, $isParagraphNode, COMMAND_PRIORITY_HIGH, ParagraphNode, RootNode, SELECTION_CHANGE_COMMAND, defineExtension } from "lexical"
import { $insertFirst, mergeRegister } from "@lexical/utils"

class EphemeralSelectionParagraph extends ParagraphNode {
  $config() {
    return this.config("ephemeral-paragraph-node", {
      extends: ParagraphNode,
    })
  }

  createDOM(editor) {
    const p = super.createDOM(editor)
    const selected = this.isSelected($getSelection())
    p.classList.add("ephemeral-paragraph")
    p.classList.toggle("hidden", !selected)
    return p
  }

  updateDOM(_prevNode, dom) {
    const selected = this.isSelected($getSelection())
    dom.classList.toggle("hidden", !selected)
    return false
  }

  static importDOM (){
    return null
  }

  static transform() {
    return (node) => {
      if (node.getTextContentSize() > 0) { node.concretize() }
    }
  }

  exportDOM () {
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

  concretize() {
    this.replace($createParagraphNode(), true)
  }
}

function $ensureSelectableParagraphAtTopAndBottom(rootNode) {
  const firstNode = rootNode.getFirstChild()
  if (!$isElementNode(firstNode) || !firstNode.canInsertTextBefore()) {
    $insertFirst(rootNode, new EphemeralSelectionParagraph)
  }

  const lastChild = rootNode.getLastChild()
  if (!$isParagraphNode(lastChild)) {
    rootNode.append(new EphemeralSelectionParagraph)
  }
}

export const EphemeralSelectionParagraphExtension = defineExtension({
  name: "lexxy/ephemeral_paragraph",
  nodes: [
    EphemeralSelectionParagraph
  ],
  register(editor) {
    return mergeRegister(
      editor.registerNodeTransform(RootNode, $ensureSelectableParagraphAtTopAndBottom),
      editor.registerCommand(SELECTION_CHANGE_COMMAND,
        () => {
          const nodes = $getRoot().getChildren()
          const theseNodes = nodes.filter(node => node instanceof EphemeralSelectionParagraph)
          theseNodes.forEach(node => node.markDirty())

      }, COMMAND_PRIORITY_HIGH)
    )
  }
})
