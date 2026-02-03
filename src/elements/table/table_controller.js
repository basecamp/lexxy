import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isParagraphNode,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND
} from "lexical"
import {
  $findCellNode,
  $findTableNode,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
} from "@lexical/table"

import { upcaseFirst } from "../../helpers/string_helper"
import { nextFrame } from "../../helpers/timing_helpers"

export class TableController {
  #cachedTableState = null

  constructor(editorElement) {
    this.editor = editorElement.editor
    this.contents = editorElement.contents
    this.selection = editorElement.selection

    this.currentTableNodeKey = null
    this.currentCellKey = null

    this.#registerKeyHandlers()
    this.#registerUpdateListener()
  }

  destroy() {
    this.currentTableNodeKey = null
    this.currentCellKey = null

    this.#unregisterKeyHandlers()
    this.#unregisterUpdateListener()
  }

  #registerUpdateListener() {
    this.unregisterUpdateListener = this.editor.registerUpdateListener(() => {
      this.#cachedTableState = null
    })
  }

  #unregisterUpdateListener() {
    this.unregisterUpdateListener?.()
    this.unregisterUpdateListener = null
  }

  get tableState() {
    if (this.#cachedTableState) return this.#cachedTableState

    return this.editor.getEditorState().read(() => {
      if (!this.currentCellKey || !this.currentTableNodeKey) return null

      const cell = $getNodeByKey(this.currentCellKey)
      if (cell instanceof TableCellNode === false) return null

      const tableNode = $getNodeByKey(this.currentTableNodeKey)
      if (tableNode instanceof TableNode === false) return null

      const rows = tableNode?.getChildren() ?? []

      const currentRowIndex = $getTableRowIndexFromTableCellNode(cell)
      const currentColumnIndex = $getTableColumnIndexFromTableCellNode(cell)

      const rowCells = rows[currentRowIndex]?.getChildren() ?? null
      const columnCells = rows.map(row => row.getChildAtIndex(currentColumnIndex)) ?? null

      this.#cachedTableState = { cell, tableNode, rows, currentRowIndex, currentColumnIndex, rowCells, columnCells }
      return this.#cachedTableState
    })
  }

  updateSelectedTable() {
    let cellNode = null
    let tableNode = null

    this.editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!selection || !this.selection.isTableCellSelected) return

      const node = selection.getNodes()[0]

      cellNode = $findCellNode(node)
      tableNode = $findTableNode(node)
    })

    this.currentCellKey = cellNode?.getKey() ?? null
    this.currentTableNodeKey = tableNode?.getKey() ?? null
  }

  executeTableCommand(command, customIndex = null) {
    if (command.action === "delete" && command.childType === "table") {
      this.#deleteTable()
      return
    }

    if (command.action === "toggle") {
      this.#executeToggleStyle(command)
      return
    }

    this.#executeCommand(command, customIndex)
  }

  #executeCommand(command, customIndex = null) {
    this.#selectCellAtSelection()
    this.editor.dispatchCommand(this.#commandName(command))
    this.#selectNextBestCell(command, customIndex)
  }

  #executeToggleStyle(command) {
    const childType = command.childType
    const { rowCells, columnCells } = this.tableState

    let cells = null
    let headerState = null

    if (childType === "row") {
      cells = rowCells
      headerState = TableCellHeaderStates.ROW
    } else if (childType === "column") {
      cells = columnCells
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

  #deleteTable() {
    this.#selectCellAtSelection()
    this.editor.dispatchCommand("deleteTable")
  }

  #selectCellAtSelection() {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!selection) return

      const node = selection.getNodes()[0]

      $findCellNode(node)?.selectEnd()
    })
  }

  #commandName(command) {
    const { action, childType, direction } = command

    const childTypeSuffix = upcaseFirst(childType)
    const directionSuffix = action == "insert" ? upcaseFirst(direction) : ""
    return `${action}Table${childTypeSuffix}${directionSuffix}`
  }

  #setHeaderStyle(cell, newStyle, headerState) {
    const tableCellNode = $getTableCellNodeFromLexicalNode(cell)
    tableCellNode?.setHeaderStyles(newStyle, headerState)
  }

  async #selectCellAtIndex(rowIndex, columnIndex) {
    // We wait for next frame, otherwise table operations might not have completed yet.
    await nextFrame()

    const tableState = this.tableState
    if (!tableState) return

    const row = tableState.rows[rowIndex]
    if (!row) return

    this.editor.update(() => {
      const cell = $getTableCellNodeFromLexicalNode(row.getChildAtIndex(columnIndex))
      cell?.selectEnd()
    })
  }

  #selectNextBestCell(command, customIndex = null) {
    const { childType, direction } = command
    const { currentRowIndex, currentColumnIndex } = this.tableState

    let rowIndex = currentRowIndex
    let columnIndex = customIndex !== null ? customIndex : currentColumnIndex

    const deleteOffset = command.action === "delete" ? -1 : 0
    const offset = direction === "after" ? 1 : deleteOffset

    if (childType === "row") {
      rowIndex += offset
    } else if (childType === "column") {
      columnIndex += offset
    }

    this.#selectCellAtIndex(rowIndex, columnIndex)
  }

  #selectNextRow() {
    const { rows, currentRowIndex, currentColumnIndex } = this.tableState
    if (!rows) return

    const nextRow = rows.at(currentRowIndex + 1)
    if (!nextRow) return

    this.editor.update(() => {
      nextRow.getChildAtIndex(currentColumnIndex)?.selectEnd()
    })
  }

  #selectPreviousCell() {
    const { cell } = this.tableState
    if (!cell) return

    this.editor.update(() => {
      cell.selectPrevious()
    })
  }

  #insertRowAndSelectFirstCell() {
    this.executeTableCommand({ action: "insert", childType: "row", direction: "after" }, 0)
  }

  #deleteRowAndSelectLastCell() {
    this.executeTableCommand({ action: "delete", childType: "row" }, -1)
  }

  #deleteRowAndSelectNextNode() {
    const { tableNode } = this.tableState
    this.executeTableCommand({ action: "delete", childType: "row" })

    this.editor.update(() => {
      const next = tableNode?.getNextSibling()
      if ($isParagraphNode(next)) {
        next.selectStart()
      } else {
        const newParagraph = $createParagraphNode()
        tableNode.insertAfter(newParagraph)
        newParagraph.selectStart()
      }
    })
  }

  #isCurrentCellEmpty() {
    const { tableNode, cell } = this.tableState
    if (!tableNode || !cell) return false

    return cell.getTextContent().trim() === ""
  }

  #isCurrentRowLast() {
    const { rows, currentRowIndex } = this.tableState
    if (!rows) return false

    return rows.length === currentRowIndex + 1
  }

  #isCurrentRowEmpty() {
    const { rowCells } = this.tableState
    if (!rowCells) return false

    return rowCells.every(cell => cell.getTextContent().trim() === "")
  }

  #isFirstCellInRow() {
    const { rowCells, cell } = this.tableState
    if (!rowCells) return false

    return rowCells.indexOf(cell) === 0
  }

  #registerKeyHandlers() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.unregisterBackspaceKeyHandler = this.editor.registerCommand(KEY_BACKSPACE_COMMAND, (event) => this.#handleBackspaceKey(event), COMMAND_PRIORITY_HIGH)
    this.unregisterEnterKeyHandler = this.editor.registerCommand(KEY_ENTER_COMMAND, (event) => this.#handleEnterKey(event), COMMAND_PRIORITY_HIGH)
  }

  #unregisterKeyHandlers() {
    this.unregisterBackspaceKeyHandler?.()
    this.unregisterEnterKeyHandler?.()

    this.unregisterBackspaceKeyHandler = null
    this.unregisterEnterKeyHandler = null
  }

  #handleBackspaceKey(event) {
    const tableState = this.tableState
    if (!tableState) return false

    if (this.#isCurrentRowEmpty() && this.#isFirstCellInRow()) {
      event.preventDefault()
      this.#deleteRowAndSelectLastCell()
      return true
    }

    if (this.#isCurrentCellEmpty() && !this.#isFirstCellInRow()) {
      event.preventDefault()
      this.#selectPreviousCell()
      return true
    }

    return false
  }

  #handleEnterKey(event) {
    if ((event.ctrlKey || event.metaKey) || event.shiftKey) return false

    if (this.selection.isInsideList || this.selection.isInsideCodeBlock) return false

    const tableState = this.tableState
    if (!tableState) return false

    event.preventDefault()

    if (this.#isCurrentRowLast() && this.#isCurrentRowEmpty()) {
      this.#deleteRowAndSelectNextNode()
    } else if (this.#isCurrentRowLast()) {
      this.#insertRowAndSelectFirstCell()
    } else {
      this.#selectNextRow()
    }

    return true
  }
}
