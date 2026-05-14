import { describe, expect, test } from "vitest"
import { Direction } from "src/helpers/direction"

const node = (overrides = {}) => ({
  getNextSibling: () => "next-sibling",
  getPreviousSibling: () => "prev-sibling",
  getFirstChild: () => "first-child",
  getLastChild: () => "last-child",
  selectStart: () => "select-start",
  selectEnd: () => "select-end",
  insertBefore: (...args) => [ "insert-before", ...args ],
  insertAfter: (...args) => [ "insert-after", ...args ],
  ...overrides
})

describe("Direction.forward", () => {
  test("isForward is true and isBackward is false", () => {
    expect(Direction.forward.isForward).toBe(true)
    expect(Direction.forward.isBackward).toBe(false)
  })

  test("siblingOf returns the next sibling", () => {
    expect(Direction.forward.siblingOf(node())).toBe("next-sibling")
  })

  test("edgeChildOf returns the first child", () => {
    expect(Direction.forward.edgeChildOf(node())).toBe("first-child")
  })

  test("enterEdgeOf calls selectStart", () => {
    const calls = []
    Direction.forward.enterEdgeOf({ selectStart: () => calls.push("start"), selectEnd: () => calls.push("end") })
    expect(calls).toEqual([ "start" ])
  })

  test("insertNextTo calls insertAfter on the reference", () => {
    const calls = []
    Direction.forward.insertNextTo({ insertBefore: () => calls.push("before"), insertAfter: () => calls.push("after") }, "node")
    expect(calls).toEqual([ "after" ])
  })
})

describe("Direction.backward", () => {
  test("isForward is false and isBackward is true", () => {
    expect(Direction.backward.isForward).toBe(false)
    expect(Direction.backward.isBackward).toBe(true)
  })

  test("siblingOf returns the previous sibling", () => {
    expect(Direction.backward.siblingOf(node())).toBe("prev-sibling")
  })

  test("edgeChildOf returns the last child", () => {
    expect(Direction.backward.edgeChildOf(node())).toBe("last-child")
  })

  test("enterEdgeOf calls selectEnd", () => {
    const calls = []
    Direction.backward.enterEdgeOf({ selectStart: () => calls.push("start"), selectEnd: () => calls.push("end") })
    expect(calls).toEqual([ "end" ])
  })

  test("insertNextTo calls insertBefore on the reference", () => {
    const calls = []
    Direction.backward.insertNextTo({ insertBefore: () => calls.push("before"), insertAfter: () => calls.push("after") }, "node")
    expect(calls).toEqual([ "before" ])
  })
})
