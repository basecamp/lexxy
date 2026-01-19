import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND
} from "lexical"
import {
  $findCellNode,
  $findTableNode,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  TableCellHeaderStates
} from "@lexical/table"

import { capitalizeFirstLetter } from "../../helpers/string_helper"

export const TableAction = Object.freeze({
  INSERT:  "insert",
  DELETE: "delete",
  TOGGLE: "toggle"
})

export const TableChildType = Object.freeze({
  ROW: "row",
  COLUMN: "column",
  TABLE: "table"
})

export const TableDirection = Object.freeze({
  BEFORE: "before",
  AFTER: "after"
})

export class TableController {
  constructor(editorElement) {
    this.editor = editorElement.editor
    this.contents = editorElement.contents

    this.currentTableNodeKey = null
    this.currentCellKey = null

    this.#handleEnterKey()
    this.#handleBackspaceKey()
  }

  get currentCell() {
    if (!this.currentCellKey) return null

    return this.editor.getEditorState().read(() => {
      const node = $getNodeByKey(this.currentCellKey)
      return $findCellNode(node)
    })
  }

  get currentTableNode() {
    if (!this.currentTableNodeKey) return null

    const cell = this.currentCell
    if (!cell) return null

    return this.editor.getEditorState().read(() => {
      return $findTableNode(cell)
    })
  }

  get currentRowCells() {
    const currentRowIndex = this.currentRowIndex

    const rows = this.tableRows
    if (!rows) return null

    return this.editor.getEditorState().read(() => {
      return rows[currentRowIndex]?.getChildren() ?? null
    }) ?? null
  }

  get currentRowIndex() {
    const currentCell = this.currentCell
    if (!currentCell) return 0

    return this.editor.getEditorState().read(() => {
      return $getTableRowIndexFromTableCellNode(currentCell)
    }) ?? 0
  }

  get currentColumnCells() {
    const rows = this.tableRows
    const columnIndex = this.currentColumnIndex

    return this.editor.getEditorState().read(() => {
      return rows?.map(row => row.getChildAtIndex(columnIndex)) ?? null
    }) ?? null
  }

  get currentColumnIndex() {
    const currentCell = this.currentCell
    if (!currentCell) return 0

    return this.editor.getEditorState().read(() => {
      return $getTableColumnIndexFromTableCellNode(currentCell)
    }) ?? 0
  }

  get tableRows() {
    return this.editor.getEditorState().read(() => {
      return this.currentTableNode?.getChildren()
    }) ?? null
  }

  executeTableCommand(command) {
    const { action, childType } = command
    if (action === TableAction.TOGGLE) {
      this.toggleHeaderStyle(childType)
      return
    }

    this.editor.dispatchCommand(this.#commandName(command))

    this.#selectNextBestCell(command)
  }

  updateSelectedTable() {
    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const anchorNode = selection.anchor.getNode()
      const tableNode = $findTableNode(anchorNode)
      const cellNode = $findCellNode(anchorNode)

      this.currentCellKey = cellNode?.getKey() ?? null
      this.currentTableNodeKey = tableNode?.getKey() ?? null
    })
  }

  toggleHeaderStyle(childType) {
    let cells = null
    let headerState = null

    if (childType === TableChildType.ROW) {
      cells = this.currentRowCells
      headerState = TableCellHeaderStates.ROW
    } else if (childType === TableChildType.COLUMN) {
      cells = this.currentColumnCells
      headerState = TableCellHeaderStates.COLUMN
    }

    if (!cells || cells.length === 0) return

    this.editor.update(() => {
      const firstCell = $getTableCellNodeFromLexicalNode(cells[0])
      if (!firstCell) return

      const currentStyle = firstCell.getHeaderStyles()
      const newStyle = currentStyle ^ headerState

      cells.forEach(cell => {
        this.#setHeaderStyle(cell, newStyle, headerState)
      })
    })
  }

  #commandName(command) {
    const { action, childType, direction } = command

    const childTypeSuffix = capitalizeFirstLetter(childType)
    const directionSuffix = action == TableAction.INSERT ? capitalizeFirstLetter(direction) : ""
    return `${action}Table${childTypeSuffix}${directionSuffix}`
  }

  #setHeaderStyle(cell, newStyle, headerState) {
    const tableCellNode = $getTableCellNodeFromLexicalNode(cell)

    if (tableCellNode) {
      tableCellNode.setHeaderStyles(newStyle, headerState)
    }
  }

  #selectCellAtIndex(rowIndex, columnIndex) {
    requestAnimationFrame(() => {
      if (!this.currentTableNode) return

      const rows = this.tableRows
      if (!rows) return

      const row = rows[rowIndex]
      if (!row) return

      this.editor.update(() => {
        const cell = $getTableCellNodeFromLexicalNode(row.getChildAtIndex(columnIndex))
        if (!cell) return

        cell.selectEnd()
      })
    })
  }

  #selectNextBestCell(command) {
    const { action, childType, direction } = command

    let rowIndex = this.currentRowIndex
    let columnIndex = this.currentColumnIndex

    let deleteOffset = action === TableAction.DELETE ? -1 : 0
    let offset = direction === TableDirection.AFTER ? 1 : deleteOffset

    if (childType === TableChildType.ROW) {
      rowIndex += offset
    } else if (childType === TableChildType.COLUMN) {
      columnIndex += offset
    }

    this.#selectCellAtIndex(rowIndex, columnIndex)
  }

  #selectLastCellInCurrentRow() {
    const rowLength = this.currentRowCells?.length ?? 0
    this.#selectCellAtIndex(this.currentRowIndex - 1, rowLength - 1)
  }

  #isCurrentCellEmpty() {
    if (!this.currentTableNode) return false

    const cell = this.currentCell
    if (!cell) return false

    return cell.getTextContent().trim() === ""
  }

  #isCurrentRowLast() {
    if (!this.currentTableNode) return false

    const rows = this.tableRows
    if (!rows) return false

    return rows.length === this.currentRowIndex + 1
  }

  #isCurrentRowEmpty() {
    if (!this.currentTableNode) return false

    const cells = this.currentRowCells
    if (!cells) return false

    return cells.every(cell => cell.getTextContent().trim() === "")
  }

  #handleBackspaceKey() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        if (!this.currentTableNode) return false

        if (this.#isCurrentRowEmpty()) {
          event.preventDefault()

          this.executeTableCommand({ action: TableAction.DELETE, childType: TableChildType.ROW })

          const rows = this.tableRows
          if (!rows || rows.length === 0) return

          this.#selectLastCellInCurrentRow()

          return true
        }

        if (this.#isCurrentCellEmpty()) {
          event.preventDefault()

          const cell = this.currentCell
          if (!cell) return

          this.editor.update(() => {
            cell.selectPrevious()
          })

          return true
        }

        return false
      },
      COMMAND_PRIORITY_NORMAL
    )
  }

  #handleEnterKey() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event.shiftKey ||!this.currentTableNode) return false

        event.preventDefault()

        if (this.#isCurrentRowLast() && this.#isCurrentRowEmpty()) {
          this.executeTableCommand({ action: TableAction.DELETE, childType: TableChildType.ROW })

          this.editor.update(() => {
            const next = this.currentTableNode?.getNextSibling()
            if (next) {
              next.selectStart()
            } else {
              const newParagraph = $createParagraphNode()
              this.currentTableNode.insertAfter(newParagraph)
              newParagraph.selectStart()
            }
          })
        } else if (this.#isCurrentRowLast()) {
          this.executeTableCommand({ action: TableAction.INSERT, childType: TableChildType.ROW, direction: TableDirection.AFTER })
        } else {
          const rows = this.tableRows
          if (!rows) return

          const nextRow = rows.at(this.currentRowIndex + 1)
          if (!nextRow) return

          this.editor.update(() => {
            nextRow.getChildAtIndex(this.currentColumnIndex)?.selectStart()
          })
        }

        return true
      },
      COMMAND_PRIORITY_NORMAL
    )
  }
}
