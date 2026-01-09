import { TableNode } from "@lexical/table"
import { createElement } from "../helpers/html_helper"

export class WrappedTableNode extends TableNode {
  static clone(node) {
    return new WrappedTableNode(node.__key)
  }

  exportDOM(editor) {
    const superExport = super.exportDOM(editor)

    return {
      ...superExport,
      after: (tableElement) => {
        if (tableElement = superExport.after?.(tableElement)) {
          const clonedTable = tableElement.cloneNode(true)
          const wrappedTable = createElement("figure", { className: "lexxy-content__table-wrapper" }, clonedTable.outerHTML)
          return wrappedTable
        }

        return tableElement
      }
    }
  }
}
