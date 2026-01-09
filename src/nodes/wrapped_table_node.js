import { TableNode } from "@lexical/table"
import { createElement } from "../helpers/html_helper"

export class WrappedTableNode extends TableNode {
  static clone(node) {
    return new WrappedTableNode(node.__key)
  }

  exportDOM(editor) {
    const output = super.exportDOM(editor)

    const originalAfter = output.after

    return {
      ...output,
      after: (tableElement) => {
        if (originalAfter) {
          tableElement = originalAfter(tableElement)
        }

        if (tableElement) {
          const clonedTable = tableElement.cloneNode(true)
          const figure = createElement("figure", { className: "lexxy-content__table-wrapper" }, clonedTable.outerHTML)
          return figure
        }

        return tableElement
      }
    }
  }
}
