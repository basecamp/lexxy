import { ToolbarDropdown } from "../toolbar_dropdown"

const DEFAULT_ROWS = 5
const DEFAULT_COLUMNS = 5

export class TableDropdown extends ToolbarDropdown {

  connectedCallback() {
    super.connectedCallback()

    this.#setUpButtons()
  }

  get #withHeaders() {
    return this.querySelector("input[type='checkbox']").checked
  }

  get #cells() {
    return this.querySelectorAll("button")
  }

  get #activeCells() {
    return this.querySelectorAll("button.active")
  }

  #setUpButtons() {
    const tableBlock = this.querySelector(".lexxy-editor__table-create .lexxy-editor__table-buttons")
    if (!tableBlock) return

    for (let i = 1; i <= DEFAULT_ROWS; i++) {
      const row = document.createElement("div")
      for (let j = 1; j <= DEFAULT_COLUMNS; j++) {
        const button = document.createElement("button")
        button.dataset.rows = i
        button.dataset.columns = j
        button.addEventListener("click", this.#insertTable.bind(this))
        this.#setupButtonHover(button)
        row.appendChild(button)
      }
      tableBlock.appendChild(row)
    }
  }

  #buttonHover(button) {
    const row = parseInt(button.dataset.rows)
    const col = parseInt(button.dataset.columns)

    this.#cells.forEach(cell => {
      const cellRow = parseInt(cell.dataset.rows)
      const cellCol = parseInt(cell.dataset.columns)

      if (cellRow < row && cellCol <= col || (cellRow === row && cellCol <= col)) {
        cell.classList.add("active")
      }
    })
  }

  #setupButtonHover(button) {
      button.addEventListener("mouseenter", () => {
        this.#buttonHover(button)
      })

      button.addEventListener("mouseleave", () => {
        this.#activeCells.forEach(cell =>
          cell.classList.remove("active")
        )
      })
  }

  #insertTable(event) {
    event.preventDefault()
    const rows = event.target.dataset.rows
    const columns = event.target.dataset.columns
    this.editor.dispatchCommand("insertTable", {
      rows: rows,
      columns: columns,
      includeHeaders: this.#withHeaders
    })
    this.close()
  }

}

customElements.define("lexxy-table-dropdown", TableDropdown)
