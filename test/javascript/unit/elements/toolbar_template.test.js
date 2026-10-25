import { expect, test } from "vitest"
import { buildToolbarTemplate } from "src/elements/toolbar_template"
import { defaultToolbarItems } from "src/config/toolbar"

function build(items) {
  const toolbar = document.createElement("div")
  toolbar.append(buildToolbarTemplate(items))
  return toolbar
}

function topLevelNames(toolbar) {
  return Array.from(toolbar.children).map((item) => {
    return item.matches("button") ? item.name : item.querySelector(":scope > [data-dropdown-trigger]").name
  })
}

test("builds the items in the configured order, followed by the overflow menu", () => {
  const toolbar = build([ "redo", "bold", "link", "italic" ])

  expect(topLevelNames(toolbar)).toEqual([ "redo", "bold", "link", "italic", "" ])
  expect(toolbar.lastElementChild.classList).toContain("lexxy-editor__toolbar-overflow")
})

test("leaves out the items that aren't configured", () => {
  const toolbar = build([ "bold", "italic" ])

  expect(toolbar.querySelector("[name=image]")).toBeNull()
  expect(toolbar.querySelector("lexxy-highlight-dropdown")).toBeNull()
  expect(toolbar.querySelector("lexxy-heading-dropdown")).toBeNull()
})

test("a separator ends the group of the item before it", () => {
  const toolbar = build([ "bold", "|", "italic", "link", "|", "highlight" ])

  expect(toolbar.querySelector("[name=bold]").classList).toContain("lexxy-editor__toolbar-group-end")
  expect(toolbar.querySelector("[name=italic]").classList).not.toContain("lexxy-editor__toolbar-group-end")
  expect(toolbar.querySelector("lexxy-link-dropdown > [name=link]").classList).toContain("lexxy-editor__toolbar-group-end")
})

test("a spacer pushes the item after it to the end", () => {
  const toolbar = build([ "bold", "~", "highlight", "undo" ])

  expect(toolbar.querySelector("lexxy-highlight-dropdown").classList).toContain("lexxy-editor__toolbar-button--push-right")
  expect(toolbar.querySelector("[name=undo]").classList).not.toContain("lexxy-editor__toolbar-button--push-right")
})

test("builds a dropdown group as a menu of its items", () => {
  const toolbar = build([ { name: "insert", icon: "table", label: "Insert", items: [ "table", "|", "divider", "bold" ] } ])
  const group = toolbar.querySelector("lexxy-toolbar-dropdown[data-toolbar-group]")
  const trigger = group.querySelector(":scope > [data-dropdown-trigger]")
  const panel = group.querySelector(":scope > [data-dropdown-panel]")

  expect(trigger.name).toBe("insert")
  expect(trigger.title).toBe("Insert")
  expect(trigger.getAttribute("aria-haspopup")).toBe("menu")
  expect(panel.getAttribute("role")).toBe("menu")
  expect(panel.getAttribute("aria-label")).toBe("Insert")
  expect(panel.hidden).toBe(true)

  const [ table, separator, divider, bold ] = panel.children
  expect(table.dataset.command).toBe("insertTable")
  expect(table.querySelector("span").textContent).toBe("Insert a table")
  expect(separator.getAttribute("role")).toBe("separator")
  expect(divider.name).toBe("divider")
  expect(divider.getAttribute("role")).toBe("menuitem")
  expect(divider.hasAttribute("aria-checked")).toBe(false)
  expect(bold.dataset.command).toBe("bold")
})

test("toggles in a dropdown group are menu checkboxes", () => {
  const toolbar = build([ { name: "more", label: "More", items: [ "bold", "unordered-list" ] } ])

  for (const name of [ "bold", "unordered-list" ]) {
    const button = toolbar.querySelector(`[name=${name}]`)
    expect(button.getAttribute("role")).toBe("menuitemcheckbox")
    expect(button.getAttribute("aria-checked")).toBe("false")
  }
})

test("a group's label is text, never markup", () => {
  const toolbar = build([ { name: "insert", label: "<img src=x onerror=alert(1)>", items: [ "table" ] } ])
  const group = toolbar.querySelector("[data-toolbar-group]")

  expect(group.querySelector("img")).toBeNull()
  expect(group.querySelector("[data-dropdown-trigger]").title).toBe("<img src=x onerror=alert(1)>")
})

test("headings and paragraph go in a dropdown group", () => {
  const toolbar = build([ { name: "format", icon: "heading", label: "Text formatting", items: [ "paragraph", "headings" ] } ])

  expect(toolbar.querySelector("[name=paragraph]").getAttribute("role")).toBe("menuitemradio")
  expect(toolbar.querySelector("lexxy-heading-dropdown .lexxy-heading-options")).not.toBeNull()
  expect(() => build([ "headings" ])).toThrow(/Unknown toolbar item "headings"/)
  expect(() => build([ "paragraph" ])).toThrow(/Unknown toolbar item "paragraph"/)
})

test("dropdowns can't go inside a dropdown group", () => {
  expect(() => build([ { name: "more", label: "More", items: [ "link" ] } ])).toThrow(/"link" can't go in a dropdown group/)
  expect(() => build([ { name: "more", label: "More", items: [ { name: "nested", label: "Nested", items: [] } ] } ])).toThrow(/can't go in a dropdown group/)
})

test("an unknown item fails loudly", () => {
  expect(() => build([ "bolt" ])).toThrow(/Unknown toolbar item "bolt"/)
})

test("undo and redo start disabled, and the image button stays out of the overflow menu", () => {
  const toolbar = build(defaultToolbarItems)

  expect(toolbar.querySelector("[name=undo]").getAttribute("aria-disabled")).toBe("true")
  expect(toolbar.querySelector("[name=redo]").getAttribute("aria-disabled")).toBe("true")
  expect(toolbar.querySelector("[name=image]").hasAttribute("data-prevent-overflow")).toBe(true)
  expect(toolbar.querySelector("[name=bold]").hasAttribute("aria-disabled")).toBe(false)
})
