import { TableCellNode } from "@lexical/table"

// Prevent the hardcoded background color
// A background color value is set by Lexical if background is null:
// https://github.com/facebook/lexical/blob/5bbbe849bd229e1db0e7b536e6a919520ada7bb2/packages/lexical-table/src/LexicalTableCellNode.ts#L187
export function registerTableCellTransform(editor) {
  return editor.registerNodeTransform(TableCellNode, (node) => {
    if (node.getBackgroundColor() === null) {
      node.setBackgroundColor("")
    }
  })
}
