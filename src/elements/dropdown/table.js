import { ToolbarDropdown } from "../toolbar_dropdown"

const DEFAULT_ROWS = 5
const DEFAULT_COLUMNS = 5

export class TableDropdown extends ToolbarDropdown {

  connectedCallback() {
    super.connectedCallback()

    this.#setUpButtons()
  }

  #setUpButtons() {
    this.#createTableButtons()
    this.#createEditButtons()
  }

  #createTableButtons() {
    const tableBlock = this.querySelector(".lexxy-editor__table-create .lexxy-editor__table-buttons")
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

  #createEditButtons() {
    const tableBlock = this.querySelector(".lexxy-editor__table-edit .lexxy-editor__table-buttons")
    const buttons = [
      {
        label: "Insert a row before",
        command: "insertTableRowBefore",
        icon: ""
      },
      {
        label: "Insert a row after",
        command: "insertTableRowAfter",
        icon: ""
      },
      {
        label: "Insert a column before",
        command: "insertTableColumnBefore",
        icon: ""
      },
      {
        label: "Insert a column after",
        command: "insertTableColumnAfter",
        icon: ""
      },
      {
        label: "Delete row",
        command: "deleteTableRow",
        icon: ""
      },
      {
        label: "Delete column",
        command: "deleteTableColumn",
        icon: ""
      }
    ]
    buttons.forEach(button => {
      const btn = document.createElement("button")
      btn.textContent = button.label
      btn.dataset.command = button.command
      btn.addEventListener("click", this.#insertTable.bind(this))
      tableBlock.appendChild(btn)
    })
  }

  get #withHeaders() {
    return this.querySelector("input[type='checkbox']").checked
  }

  get #buttons() {
    return this.querySelectorAll("button")
  }

  get #activeButtons() {
    return this.querySelectorAll("button.active")
  }

  #buttonHover(btn) {
    const row = parseInt(btn.dataset.rows);
    const col = parseInt(btn.dataset.columns);
    
    this.#buttons.forEach(b => {
      const bRow = parseInt(b.dataset.rows);
      const bCol = parseInt(b.dataset.columns);
      
      if (bRow < row && bCol <= col || (bRow === row && bCol <= col)) {
        b.classList.add("active")
      }
    })
  }

  #setupButtonHover(btn) {
      btn.addEventListener("mouseenter", () => {
        this.#buttonHover(btn)
      })
      
      btn.addEventListener("mouseleave", () => {
        this.#activeButtons.forEach(b => 
          b.classList.remove("active")
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

/*
  <button data-command="insertTable">Insert a table</button>
  <button data-command="insertTableRowAfter">Insert a row after</button>
  <button data-command="insertTableRowBefore">Insert a row before</button>
  <button data-command="insertTableColumnAfter">Insert a column after</button>
  <button data-command="insertTableColumnBefore">Insert a column before</button>
  <button data-command="deleteTableRow">Delete a row</button>
  <button data-command="deleteTableColumn">Delete a column</button>
*/