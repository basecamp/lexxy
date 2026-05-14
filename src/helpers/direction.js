export class Direction {
  constructor({ isForward }) {
    this.isForward = isForward
  }

  get isBackward() {
    return !this.isForward
  }

  siblingOf(node) {
    return this.isForward ? node.getNextSibling() : node.getPreviousSibling()
  }

  edgeChildOf(block) {
    return this.isForward ? block.getFirstChild() : block.getLastChild()
  }

  enterEdgeOf(node) {
    if (this.isForward) {
      node.selectStart()
    } else {
      node.selectEnd()
    }
  }

  insertNextTo(reference, node) {
    if (this.isForward) {
      reference.insertAfter(node)
    } else {
      reference.insertBefore(node)
    }
  }
}

Direction.forward = new Direction({ isForward: true })
Direction.backward = new Direction({ isForward: false })
