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

import { capitalizeFirstLetter } from "../../helpers/string_helper"
import { nextFrame } from "../../helpers/timing_helpers"

export class TableController {
  constructor(editorElement) {
    this.editor = editorElement.editor
    this.contents = editorElement.contents
    this.selection = editorElement.selection

    this.currentTableNodeKey = null
    this.currentCellKey = null

    this.#registerKeyHandlers()
  }

  destroy() {
    this.currentTableNodeKey = null
    this.currentCellKey = null

    this.#unregisterKeyHandlers()
  }

  get currentCell() {
    if (!this.currentCellKey) return null

    return this.editor.getEditorState().read(() => {
      const cell = $getNodeByKey(this.currentCellKey)
      return (cell instanceof TableCellNode) ? cell : null
    })
  }

  get currentTableNode() {
    if (!this.currentTableNodeKey) return null

    return this.editor.getEditorState().read(() => {
      const tableNode = $getNodeByKey(this.currentTableNodeKey)
      return (tableNode instanceof TableNode) ? tableNode : null
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
    const columnIndex = this.currentColumnIndex

    const rows = this.tableRows
    if (!rows) return null

    return this.editor.getEditorState().read(() => {
      return rows.map(row => row.getChildAtIndex(columnIndex))
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
    switch (command.action) {
      case "insert":
      case "delete":
        this.#executeCommand(command, customIndex)
        break
      case "toggle":
        this.#executeToggleStyle(command)
        break
    }
  }

  deleteTable() {
    this.#selectCellAtSelection()
    this.editor.dispatchCommand("deleteTable")
  }

  #executeCommand(command, customIndex = null) {
    this.#selectCellAtSelection()
    this.editor.dispatchCommand(this.#commandName(command))
    this.#selectNextBestCell(command, customIndex)
  }

  #executeToggleStyle(command) {
    const childType = command.childType

    let cells = null
    let headerState = null

    if (childType === "row") {
      cells = this.currentRowCells
      headerState = TableCellHeaderStates.ROW
    } else if (childType === "column") {
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

  #selectCellAtSelection() {
    this.editor.update(() => {
      const selection = $getSelection()
      if (!selection) return

      const node = selection.getNodes()[0]

      const cellNode = $findCellNode(node)
      if (!cellNode) return

      cellNode.selectEnd()
    })
  }

  #commandName(command) {
    const { action, childType, direction } = command

    const childTypeSuffix = capitalizeFirstLetter(childType)
    const directionSuffix = action == "insert" ? capitalizeFirstLetter(direction) : ""
    return `${action}Table${childTypeSuffix}${directionSuffix}`
  }

  #setHeaderStyle(cell, newStyle, headerState) {
    const tableCellNode = $getTableCellNodeFromLexicalNode(cell)

    if (tableCellNode) {
      tableCellNode.setHeaderStyles(newStyle, headerState)
    }
  }

  async #selectCellAtIndex(rowIndex, columnIndex) {
    // We wait for next frame, otherwise table operations have might've not completed yet.
    await nextFrame()

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
  }

  #selectNextBestCell(command, customIndex = null) {
    const { childType, direction } = command

    let rowIndex = this.currentRowIndex
    let columnIndex = customIndex !== null ? customIndex : this.currentColumnIndex

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
    const rows = this.tableRows
    if (!rows) return

    const nextRow = rows.at(this.currentRowIndex + 1)
    if (!nextRow) return

    this.editor.update(() => {
      nextRow.getChildAtIndex(this.currentColumnIndex)?.selectEnd()
    })
  }

  #selectPreviousCell() {
    const cell = this.currentCell
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
    const tableNode = this.currentTableNode
    this.executeTableCommand({ action: "delete", childType: "row" })

    this.editor.update(() => {
      const next = tableNode?.getNextSibling()
      if ($isParagraphNode(next)) {
        next.selectStart()
      } else {
        const newParagraph = $createParagraphNode()
        this.currentTableNode.insertAfter(newParagraph)
        newParagraph.selectStart()
      }
    })
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

  #isFirstCellInRow() {
    if (!this.currentTableNode) return false

    const cells = this.currentRowCells
    if (!cells) return false

    return cells.indexOf(this.currentCell) === 0
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
    if (!this.currentTableNode) return false

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
    if (event.shiftKey || !this.currentTableNode) return false

    if (this.selection.isInsideList || this.selection.isInsideCodeBlock) return false

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
