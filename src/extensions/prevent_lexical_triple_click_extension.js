import { $findMatchingParent, $getNearestNodeFromDOMNode, $getSelection, $isDecoratorNode, $isElementNode, $isRangeSelection, CLICK_COMMAND, COMMAND_PRIORITY_LOW, defineExtension } from "lexical"
import { $findCellNode, $isTableCellNode, $isTableNode, $isTableRowNode } from "@lexical/table"
import { mergeRegister } from "@lexical/utils"
import { registerEventListener } from "../helpers/listener_helper"
import LexxyExtension from "./lexxy_extension"

export class PreventLexicalTripleClickExtension extends LexxyExtension {
  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/prevent-lexical-triple-click",
      register: (editor) => mergeRegister(
        editor.registerRootListener((rootElement) => {
          if (rootElement) {
            return registerEventListener(
              rootElement,
              "click",
              (event) => this.#handleTripleClick(event, rootElement),
              { capture: true }
            )
          }
        }),
        editor.registerCommand(CLICK_COMMAND, $selectClickedBlockInTableCell, COMMAND_PRIORITY_LOW)
      )
    })
  }

  // Stop propagation of the triple-click to prevent Lexical's handler from running.
  //
  // Lexical's onClick handler implements a triple-click handler that is trivial/anemic/naïve. The
  // intention of the change, made in facebook/lexical#4512, seems to be to deal with browsers'
  // "overselection" behavior, where a triple-click selection might end at offset 0 of the following
  // block, which can cause issues when transforming the selection. But the implementation breaks
  // many common real-world use cases and Lexxy does not demonstrate the behavior it's intended to
  // work around (in headers).
  //
  // Table cells are the exception: Lexical's table plugin cancels the browser's own triple-click
  // selection inside a cell, so the click has to reach Lexical there for anything to be selected.
  #handleTripleClick(event, rootElement) {
    if (event.detail === 3 && !this.#isInsideTableCell(event.target, rootElement)) {
      event.stopPropagation()
    }
  }

  #isInsideTableCell(target, rootElement) {
    const cell = target.closest("td, th")
    return cell !== null && rootElement.contains(cell)
  }
}

// Lexical's own table click handler only selects blocks that are direct children of a cell, so
// list items and paragraphs inside quotes would otherwise be left with nothing selected.
function $selectClickedBlockInTableCell(event) {
  if (event.detail < 3 || !$isRangeSelection($getSelection())) return false

  const node = $getNearestNodeFromDOMNode(event.target)
  if (!node || $isDecoratorNode(node) || $isTableStructure(node)) return false

  const cell = $findCellNode(node)
  if (!cell) return false

  const block = $findMatchingParent(node, (candidate) => $isElementNode(candidate) && !candidate.isInline())
  if (block && !block.is(cell)) {
    block.select(0, block.getChildrenSize())
    return true
  } else {
    return false
  }
}

function $isTableStructure(node) {
  return $isTableNode(node) || $isTableRowNode(node) || $isTableCellNode(node)
}
