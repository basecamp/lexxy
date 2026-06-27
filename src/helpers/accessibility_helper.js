import { isActiveAndVisible } from "./html_helper"

// Keyboard and programmatic clicks carry a synthetic pointer.
export function isKeyboardActivation(event) {
  return event instanceof PointerEvent && event.pointerId === -1
}

export function handleRollingTabIndex(elements, event, { orientation = "horizontal", wrap = false } = {}) {
  const previousActiveElement = document.activeElement

  if (elements.includes(previousActiveElement)) {
    const finder = new NextElementFinder(elements, event.key, { orientation, wrap })

    if (finder.selectNext(previousActiveElement)) {
      event.preventDefault()
    }
  }
}

class NextElementFinder {
  constructor(elements, key, { orientation, wrap }) {
    this.elements = elements
    this.key = key
    this.orientation = orientation
    this.wrap = wrap
  }

  selectNext(fromElement) {
    const nextElement = this.#findNextElement(fromElement)

    if (nextElement) {
      const inactiveElements = this.elements.filter(element => element !== nextElement)
      this.#unsetTabIndex(inactiveElements)
      this.#focusWithActiveTabIndex(nextElement)
      return true
    }

    return false
  }

  #findNextElement(fromElement) {
    switch (this.#directionFor(this.key)) {
      case "next":
        return this.#findNextSibling(fromElement)

      case "previous":
        return this.#findPreviousSibling(fromElement)

      case "first":
        return this.#findFirst()

      case "last":
        return this.#findLast()
    }
  }

  #directionFor(key) {
    if (key === "Home") return "first"
    if (key === "End") return "last"
    if (this.#nextKeys.includes(key)) return "next"
    if (this.#previousKeys.includes(key)) return "previous"
  }

  get #nextKeys() {
    return this.orientation === "both" ? [ "ArrowRight", "ArrowDown" ] : [ "ArrowRight" ]
  }

  get #previousKeys() {
    return this.orientation === "both" ? [ "ArrowLeft", "ArrowUp" ] : [ "ArrowLeft" ]
  }

  #findFirst(elements = this.elements) {
    return elements.find(isActiveAndVisible)
  }

  #findLast(elements = this.elements) {
    return elements.findLast(isActiveAndVisible)
  }

  #findNextSibling(element) {
    const afterElements = this.elements.slice(this.#indexOf(element) + 1)
    return this.#findFirst(afterElements) ?? this.#wrapToFirst()
  }

  #findPreviousSibling(element) {
    const beforeElements = this.elements.slice(0, this.#indexOf(element))
    return this.#findLast(beforeElements) ?? this.#wrapToLast()
  }

  #wrapToFirst() {
    return this.wrap ? this.#findFirst() : undefined
  }

  #wrapToLast() {
    return this.wrap ? this.#findLast() : undefined
  }

  #indexOf(element) {
    return this.elements.indexOf(element)
  }

  #focusWithActiveTabIndex(element) {
    if (isActiveAndVisible(element)) {
      element.tabIndex = 0
      element.focus()
    }
  }

  #unsetTabIndex(elements) {
    elements.forEach(element => element.tabIndex = -1)
  }
}
