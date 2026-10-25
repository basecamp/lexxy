import { COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_NORMAL, SELECTION_CHANGE_COMMAND, defineExtension } from "lexical"
import { $getNodeByKey, $getPreviousSelection, $getSelection, $isRangeSelection, $setSelection } from "lexical"
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $findTableNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableNode,
  $isTableSelection,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
  getTableElement,
  getTableObserverFromTableElement,
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

  get allowedElements() {
    if (this.editorElement.supportsTables) {
      return [ "figure", "tbody" ]
    } else {
      return []
    }
  }

  get lexicalExtension() {
    if (this.editorElement.supportsTables) {
      return this.#tablesExtension
    } else {
      return this.#tablesDisabledExtension
    }
  }

  get #tablesExtension() {
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
        setScrollableTablesActive(editor, true)

        return mergeRegister(
          registerTablePlugin(editor),

          // Lexxy registers extensions before setRootElement(), but table
          // drag-selection needs a root before wiring its pointer handlers.
          editor.registerRootListener((rootElement) => {
            if (rootElement) {
              return registerTableSelectionObserver(editor, true)
            }
          }),

          editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
            $keepTableSelectionWhileDragging(editor)
            return false
          }, COMMAND_PRIORITY_CRITICAL),

          // A table in Lexxy is a Lexxy table: cell shading can't be set in the
          // editor, so any cell background only ever comes from foreign content
          // (pasted spreadsheets, loaded documents). Normalize every cell to no
          // background so it adopts the current theme. This also clears
          // Lexical's hardcoded default header background (Lexical #8089).
          editor.registerNodeTransform(TableCellNode, (node) => {
            if (node.getBackgroundColor() !== "") {
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

  // With no table nodes registered, Lexical imports a table's content as is, and
  // runs the text of header cells and captions together, since it only treats
  // <td> as a block. Turn every cell into a block first, so each keeps its text
  // on its own line. The lookup returns no conversion, so Lexical goes on to
  // import the table's children. It rewrites the DOM it is given, which is safe
  // because every import parses its HTML into a throwaway document.
  get #tablesDisabledExtension() {
    return defineExtension({
      name: "lexxy/tables-disabled",
      html: {
        import: {
          table: (table) => {
            replaceCellsWithBlocks(table)
            return null
          }
        }
      }
    })
  }
}

function replaceCellsWithBlocks(table) {
  const cells = Array.from(table.rows).flatMap(row => Array.from(row.cells))

  for (const cell of [ table.caption, ...cells ].filter(Boolean)) {
    const block = cell.ownerDocument.createElement("div")
    block.append(...cell.childNodes)
    cell.replaceWith(block)
  }
}

// WebKit drops a collapsed caret into the cell under the pointer while a drag
// selects cells. Since Lexical 0.52 that range clears the table observer, anchor
// cell included, so the drag re-anchors on the cell it just entered and loses the
// cells before it. Keep the table selection until the drag ends.
function $keepTableSelectionWhileDragging(editor) {
  const selection = $getSelection()
  const previousSelection = $getPreviousSelection()
  if (!$isTableSelection(previousSelection) || !$isRangeSelection(selection) || !selection.isCollapsed()) return

  const tableNode = $getNodeByKey(previousSelection.tableKey)
  if (!$isTableNode(tableNode) || !tableNode.isParentOf(selection.anchor.getNode())) return

  const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()))
  const observer = tableElement && getTableObserverFromTableElement(tableElement)
  if (observer?.isSelecting) $setSelection(previousSelection.clone())
}
