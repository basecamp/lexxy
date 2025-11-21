import { defineExtension } from "lexical"
import { extendConversion } from "../helpers/lexical_helper"
import { HorizontalDividerNode } from "../nodes/horizontal_divider_node"

export const TrixHorizontalDividerExtension = defineExtension({
  name: "lexxy/horizontal-divider",

  html: {
    import: {
      "bc-attachment": onlyHorizontalDividerContentTypes({
        conversion: () => extendConversion(HorizontalDividerNode, "hr"),
        priority: 2
      })
    }
  }
})

function onlyHorizontalDividerContentTypes(conversion) {
  return element => element.getAttribute("content-type") === "application/vnd.basecamp.horizontal-rule.html" ? conversion : null
}
