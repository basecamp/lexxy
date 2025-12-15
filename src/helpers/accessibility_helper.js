export function handleRollingTabIndex(elements, event) {
  const previousActiveElement = document.activeElement
  if (!elements.includes(previousActiveElement)) return

  const getNextActiveElement = getFinderFunctionForKey(event.key)?.bind(new ElementFinder(elements))

  if (getNextActiveElement) {
    event.preventDefault()
    const nextActiveElement = getNextActiveElement(previousActiveElement)
    const inactiveElements = elements.filter(element => element !== nextActiveElement)

    unsetTabIndex(inactiveElements)
    focusWithActiveTabIndex(nextActiveElement)
  }
}

function getFinderFunctionForKey(key) {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return ElementFinder.prototype.findNextSibling

    case "ArrowLeft":
    case "ArrowUp":
      return ElementFinder.prototype.findPreviousSibling

    case "Home":
      return ElementFinder.prototype.findFirst

    case "End":
      return ElementFinder.prototype.findLast
  }
}

class ElementFinder {
  constructor(elements) {
    this.elements = elements
  }

  findFirst() {
    return this.elements.find(isActiveAndVisible)
  }

  findLast() {
    return this.elements.findLast(isActiveAndVisible)
  }

  findNextSibling(element) {
    return this.#after(element).findFirst()
  }

  findPreviousSibling(element) {
    return this.#before(element).findLast()
  }

  #after(element) {
    const sliceAfter = this.elements.slice(this.#indexOf(element) + 1)
    return new ElementFinder(sliceAfter)
  }

  #before(element) {
    const sliceBefore = this.elements.slice(0, this.#indexOf(element))
    return new ElementFinder(sliceBefore)
  }

  #indexOf(element) {
    return this.elements.indexOf(element)
  }
}

function isActiveAndVisible(element) {
  return element && element.disabled !== true && element.checkVisibility() == true
}

function focusWithActiveTabIndex(element) {
  if (!isActiveAndVisible(element)) return

  element.tabIndex = 0
  element.focus()
}

function unsetTabIndex(elements) {
  elements.forEach(element => element.tabIndex = -1)
}
