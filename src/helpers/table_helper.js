import { TableCellHeaderStates, TableCellNode } from "@lexical/table"

// Temporary solve for a Lexical bug: https://github.com/facebook/lexical/issues/8089
// Prevent the hardcoded background color
export function registerHeaderBackgroundTransform(editor) {
  return editor.registerNodeTransform(TableCellNode, (node) => {
    if (node.getBackgroundColor() === null) {
      node.setBackgroundColor("")
    }
  })
}

// Temporary solve for a Lexical bug: https://github.com/facebook/lexical/issues/8090
// Fix column header states
export function registerTableHeaderStateTransform(editor) {
  return editor.registerNodeTransform(TableCellNode, (node) => {
    const headerState = node.getHeaderStyles()

    if (headerState !== TableCellHeaderStates.ROW) return

    const rowParent = node.getParent()
    const tableNode = rowParent?.getParent()
    if (!tableNode) return

    const rows = tableNode.getChildren()
    const cellIndex = rowParent.getChildren().indexOf(node)

    const cellsInRow = rowParent.getChildren()
    const isHeaderRow = cellsInRow.every(cell =>
      cell.getHeaderStyles() !== TableCellHeaderStates.NO_STATUS
    )

    const isHeaderColumn = rows.every(row => {
      const cell = row.getChildren()[cellIndex]
      return cell && cell.getHeaderStyles() !== TableCellHeaderStates.NO_STATUS
    })

    let newHeaderState = TableCellHeaderStates.NO_STATUS

    if (isHeaderRow) {
      newHeaderState |= TableCellHeaderStates.ROW
    }

    if (isHeaderColumn) {
      newHeaderState |= TableCellHeaderStates.COLUMN
    }

    if (newHeaderState !== headerState) {
      node.setHeaderStyles(newHeaderState, TableCellHeaderStates.BOTH)
    }
  })
}
