import { COMMAND_PRIORITY_LOW, defineExtension } from "lexical"
import { $getSelection, $isRangeSelection } from "lexical"
import { INSERT_TABLE_COMMAND } from "@lexical/table"
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $findTableNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
  registerTablePlugin,
  registerTableSelectionObserver,
  setScrollableTablesActive
} from "@lexical/table"
import { WrappedTableNode } from "../nodes/wrapped_table_node.js"

export const TablesLexicalExtension = defineExtension({
  name: "lexxy/tables",
  nodes: [
    WrappedTableNode,
    {
      replace: TableNode,
      with: () => new WrappedTableNode()
    },
    TableCellNode,
    TableRowNode
  ],
  register(editor) {
    // Register Lexical table plugins
    registerTablePlugin(editor)
    registerTableSelectionObserver(editor, true)
    setScrollableTablesActive(editor, true)

    // Bug fix: Prevent hardcoded background color (Lexical #8089)
    editor.registerNodeTransform(TableCellNode, (node) => {
      if (node.getBackgroundColor() === null) {
        node.setBackgroundColor("")
      }
    })

    // Bug fix: Fix column header states (Lexical #8090)
    editor.registerNodeTransform(TableCellNode, (node) => {
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

    editor.registerCommand("insertTable", () => {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, { "rows": 3, "columns": 3, "includeHeaders": true })
      return true
    }, COMMAND_PRIORITY_LOW)

    editor.registerCommand("insertTableRowAfter", () => {
      $insertTableRowAtSelection(true)
      return true
    }, COMMAND_PRIORITY_LOW)

    editor.registerCommand("insertTableRowBefore", () => {
      $insertTableRowAtSelection(false)
      return true
    }, COMMAND_PRIORITY_LOW)

    editor.registerCommand("insertTableColumnAfter", () => {
      $insertTableColumnAtSelection(true)
      return true
    }, COMMAND_PRIORITY_LOW)

    editor.registerCommand("insertTableColumnBefore", () => {
      $insertTableColumnAtSelection(false)
      return true
    }, COMMAND_PRIORITY_LOW)

    editor.registerCommand("deleteTableRow", () => {
      $deleteTableRowAtSelection()
      return true
    }, COMMAND_PRIORITY_LOW)

    editor.registerCommand("deleteTableColumn", () => {
      $deleteTableColumnAtSelection()
      return true
    }, COMMAND_PRIORITY_LOW)

    editor.registerCommand("deleteTable", () => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return false
      $findTableNode(selection.anchor.getNode())?.remove()
      return true
    }, COMMAND_PRIORITY_LOW)
  }
})
