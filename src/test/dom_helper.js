import { JSDOM } from "jsdom"

export function createElement(html) {
  return JSDOM.fragment(html).firstChild
}
