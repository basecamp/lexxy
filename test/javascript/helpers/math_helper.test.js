import { expect, test, describe } from "vitest"
import { renderMath } from "../../../src/helpers/math_helper"

describe("renderMath", () => {
  test("renders inline math", () => {
    const result = renderMath("E=mc^2")
    expect(result).toContain("katex")
    expect(result).toContain("span")
  })

  test("renders display mode math", () => {
    const result = renderMath("\\int_0^1 x^2 dx", { displayMode: true })
    expect(result).toContain("katex")
    expect(result).toContain("span")
  })

  test("handles empty string", () => {
    const result = renderMath("")
    expect(result).toContain("span")
  })

  test("handles invalid LaTeX gracefully", () => {
    const result = renderMath("\\invalid{command}")
    // Should not throw, returns rendered output with throwOnError: false
    expect(result).toBeTruthy()
  })

  test("renders common math expressions", () => {
    const expressions = [
      "x^2 + y^2 = z^2",
      "\\frac{a}{b}",
      "\\sqrt{x}",
      "\\sum_{i=1}^{n} i",
      "\\alpha + \\beta = \\gamma",
    ]

    for (const expr of expressions) {
      const result = renderMath(expr)
      expect(result).toContain("katex")
    }
  })
})
