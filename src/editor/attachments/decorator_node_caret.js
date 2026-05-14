import {
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_DOWN_COMMAND
} from "lexical"

import { Direction } from "../../helpers/direction"
import { $createNodeSelectionWith, $singleSelectedNode } from "../../helpers/lexical_helper"
import { ListenerBin } from "../../helpers/listener_helper"

// Keeps decorator nodes atomic under the caret: arrows cross them in one
// keypress, and any other key drops the NodeSelection back to a RangeSelection.
export class DecoratorNodeCaret {
  #listeners = new ListenerBin()

  constructor(editor) {
    this.#listeners.track(
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, (event) => new CaretStep(Direction.forward).take(event), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_LEFT_COMMAND, (event) => new CaretStep(Direction.backward).take(event), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, (event) => new CaretStep(Direction.forward).take(event), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, (event) => new CaretStep(Direction.backward).take(event), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_DOWN_COMMAND, this.#dropNodeSelectionOnIncidentalKey, COMMAND_PRIORITY_HIGH)
    )
  }

  destroy() {
    this.#listeners.dispose()
  }

  // A NodeSelection swallows keypresses meant for a RangeSelection; drop back
  // before the decorator node so typing and shortcuts behave normally.
  #dropNodeSelectionOnIncidentalKey = (event) => {
    const decoratorNode = $singleSelectedNode()
    if ($isDecoratorNode(decoratorNode) && !this.#shouldKeepNodeSelection(event)) {
      this.#placeCaretBefore(decoratorNode)
    }
    return false
  }

  // Keys that target the decorator (deletion, focus shortcuts, modifier
  // chords) or extend the selection. Anything else falls back to a RangeSelection.
  #shouldKeepNodeSelection(event) {
    return this.#isModifierKey(event.key)
      || event.key === "Backspace"
      || event.key === "Delete"
      || event.key === "Tab"
      || (event.altKey && event.key === "F10")
      || this.#isArrowWithoutNavigationModifier(event)
      || this.#isApplicationShortcut(event)
  }

  #isModifierKey(key) {
    return key === "Alt" || key === "Control" || key === "Meta" || key === "Shift"
  }

  #isArrowWithoutNavigationModifier(event) {
    return event.key.startsWith("Arrow")
      && !event.ctrlKey
      && !event.metaKey
      && !event.altKey
  }

  // Modifier + single character (Ctrl+C, Cmd+Z) is an app shortcut left alone.
  // Modifier + named key (Ctrl+Home, PageUp) falls through and drops.
  #isApplicationShortcut(event) {
    return (event.ctrlKey || event.metaKey || event.altKey)
      && event.key.length === 1
  }

  #placeCaretBefore(decoratorNode) {
    const previous = decoratorNode.getPreviousSibling()
    if ($isTextNode(previous)) {
      const size = previous.getTextContentSize()
      previous.select(size, size)
    } else if (previous) {
      previous.selectEnd()
    } else {
      const parent = decoratorNode.getParent()
      const index = decoratorNode.getIndexWithinParent()
      parent.select(index, index)
    }
  }
}

class CaretStep {
  constructor(direction) {
    this.direction = direction
  }

  take(event) {
    const selectedNode = $singleSelectedNode()
    const selection = $getSelection()

    if (event.shiftKey) {
      return false
    } else if ($isDecoratorNode(selectedNode)) {
      return this.#stepOutOf(selectedNode, event)
    } else if ($isRangeSelection(selection) && selection.isCollapsed()) {
      return this.#enterAdjacentDecoratorNode(selection.anchor, event)
    } else {
      return false
    }
  }

  #stepOutOf(decoratorNode, event) {
    event.preventDefault()

    const sibling = this.direction.siblingOf(decoratorNode)
    if (sibling) {
      this.#placeCaretOn(sibling)
    } else {
      this.#crossIntoAdjacentBlock(decoratorNode)
    }

    return true
  }

  #placeCaretOn(node) {
    if ($isDecoratorNode(node)) {
      $setSelection($createNodeSelectionWith(node))
    } else {
      this.direction.enterEdgeOf(node)
    }
  }

  #crossIntoAdjacentBlock(decoratorNode) {
    const neighbour = this.direction.siblingOf(decoratorNode.getTopLevelElement())
    if (neighbour) this.#placeCaretOn(neighbour)
  }

  #enterAdjacentDecoratorNode(anchor, event) {
    const decoratorNode = new AdjacentDecoratorNodeSearch(anchor, this.direction).result
    if (decoratorNode) {
      event.preventDefault()
      $setSelection($createNodeSelectionWith(decoratorNode))
      return true
    } else {
      return false
    }
  }
}

class AdjacentDecoratorNodeSearch {
  constructor(anchor, direction) {
    this.anchor = anchor
    this.direction = direction
  }

  get result() {
    return this.#decoratorNodeAcrossInlineBoundary
      || this.#decoratorNodeAtBlockEdge
      || this.#decoratorNodeLeadingAdjacentBlock
  }

  get #decoratorNodeAcrossInlineBoundary() {
    if (this.anchor.type === "text") {
      const node = this.anchor.getNode()
      const sibling = this.direction.siblingOf(node)
      const isAtBoundary = this.direction.isForward
        ? this.anchor.offset === node.getTextContentSize()
        : this.anchor.offset === 0
      return $isDecoratorNode(sibling) && isAtBoundary ? sibling : null
    } else {
      return null
    }
  }

  get #decoratorNodeAtBlockEdge() {
    if (this.anchor.type === "element") {
      const block = this.anchor.getNode()
      let child = null
      if (this.direction.isForward && this.anchor.offset === 0) {
        child = block.getFirstChild()
      } else if (this.direction.isBackward && this.anchor.offset === block.getChildrenSize()) {
        child = block.getLastChild()
      }
      return $isDecoratorNode(child) ? child : null
    } else {
      return null
    }
  }

  // When the next block opens with a decorator node (or a gallery whose first
  // child is one), commit its NodeSelection without stopping on the empty edge.
  get #decoratorNodeLeadingAdjacentBlock() {
    if (this.#isAtBlockEdge) {
      const neighbour = this.direction.siblingOf(this.anchor.getNode().getTopLevelElement())
      return this.#leadingDecoratorNodeIn(neighbour)
    } else {
      return null
    }
  }

  get #isAtBlockEdge() {
    if (this.anchor.type === "text") {
      const text = this.anchor.getNode()
      const block = text.getTopLevelElement()
      const isAtTextEdge = this.direction.isForward ? this.anchor.offset === text.getTextContentSize() : this.anchor.offset === 0
      const isTextAtBlockEdge = this.direction.isForward ? text === block.getLastChild() : text === block.getFirstChild()
      return isAtTextEdge && isTextAtBlockEdge
    } else if (this.anchor.type === "element") {
      return this.direction.isForward
        ? this.anchor.offset === this.anchor.getNode().getChildrenSize()
        : this.anchor.offset === 0
    } else {
      return false
    }
  }

  #leadingDecoratorNodeIn(block) {
    if ($isDecoratorNode(block)) {
      return block
    } else if ($isElementNode(block)) {
      const leading = this.direction.edgeChildOf(block)
      return $isDecoratorNode(leading) ? leading : null
    } else {
      return null
    }
  }
}
