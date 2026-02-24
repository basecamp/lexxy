import { COMMAND_PRIORITY_NORMAL, defineExtension } from "lexical"
import { $getSelection, $isRangeSelection } from "lexical"
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
import LexxyExtension from "./lexxy_extension.js"
import { mergeRegister } from "@lexical/utils"

export class TablesExtension extends LexxyExtension {

  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/tables",
      nodes: [
        WrappedTableNode,
        {
          replace: TableNode,
          with: () => new WrappedTableNode(),
          withKlass: WrappedTableNode
        },
        TableCellNode,
        TableRowNode
      ],
      register(editor) {
        return mergeRegister(
          // Register Lexical table plugins
          registerTablePlugin(editor),
          registerTableSelectionObserver(editor, true),
          setScrollableTablesActive(editor, true),

          // Bug fix: Prevent hardcoded background color (Lexical #8089)
          editor.registerNodeTransform(TableCellNode, (node) => {
            if (node.getBackgroundColor() === null) {
              node.setBackgroundColor("")
            }
          }),

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

            if (isHeaderRow) newHeaderState |= TableCellHeaderStates.ROW
            if (isHeaderColumn) newHeaderState |= TableCellHeaderStates.COLUMN

            if (newHeaderState !== headerState) {
              node.setHeaderStyles(newHeaderState, TableCellHeaderStates.BOTH)
            }
          }),

          editor.registerCommand("insertTableRowAfter", () => {
            $insertTableRowAtSelection(true)
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("insertTableRowBefore", () => {
            $insertTableRowAtSelection(false)
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("insertTableColumnAfter", () => {
            $insertTableColumnAtSelection(true)
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("insertTableColumnBefore", () => {
            $insertTableColumnAtSelection(false)
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("deleteTableRow", () => {
            $deleteTableRowAtSelection()
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("deleteTableColumn", () => {
            $deleteTableColumnAtSelection()
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("deleteTable", () => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return false
            $findTableNode(selection.anchor.getNode())?.remove()
          }, COMMAND_PRIORITY_NORMAL)
        )
      }
    })
  }
}
