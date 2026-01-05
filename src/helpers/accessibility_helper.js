export function handleRollingTabIndex(elements, event) {
  const previousActiveElement = document.activeElement

  if (elements.includes(previousActiveElement)) {
    const finder = new NextElementFinder(elements, event.key)

    if (finder.selectNext(previousActiveElement)) {
      event.preventDefault()
    }
  }
}

class NextElementFinder {
  constructor(elements, key) {
    this.elements = elements
    this.key = key
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
    switch (this.key) {
      case "ArrowRight":
      case "ArrowDown":
        return this.#findNextSibling(fromElement)

      case "ArrowLeft":
      case "ArrowUp":
        return this.#findPreviousSibling(fromElement)

      case "Home":
        return this.#findFirst()

      case "End":
        return this.#findLast()
    }
  }

  #findFirst(elements = this.elements) {
    return elements.find(isActiveAndVisible)
  }

  #findLast(elements = this.elements) {
    return elements.findLast(isActiveAndVisible)
  }

  #findNextSibling(element) {
    const afterElements = this.elements.slice(this.#indexOf(element) + 1)
    return this.#findFirst(afterElements)
  }

  #findPreviousSibling(element) {
    const beforeElements = this.elements.slice(0, this.#indexOf(element))
    return this.#findLast(beforeElements)
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

function isActiveAndVisible(element) {
  return element && !element.disabled && element.checkVisibility()
}
