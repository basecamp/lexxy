export function handleRollingTabIndex(items, event) {
  const currentIndex = items.indexOf(document.activeElement)
  if (currentIndex === -1) return

  let newItemIndex = currentIndex

  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      event.preventDefault()
      setActiveItemFocus(items, findNextVisibleItem(items, currentIndex))
      break

    case "ArrowLeft":
    case "ArrowUp":
      event.preventDefault()
      setActiveItemFocus(items, findPreviousVisibleItem(items, currentIndex))
      break

    case "Home":
      event.preventDefault()
      newItemIndex = items.findIndex((item) => item.disabled !== true)
      setActiveItemFocus(items, newItemIndex)
      break

    case "End":
      event.preventDefault()
      newItemIndex = items.filter((item) => item.disabled !== true).length - 1
      setActiveItemFocus(items, newItemIndex)
      break

    default:
      break
  }
}


function findNextVisibleItem(items, index) {
  let newIndex = (index + 1) % items.length
  while (items[newIndex].checkVisibility() === false) {
    newIndex = (newIndex + 1) % items.length
  }
  return newIndex
}

function findPreviousVisibleItem(items, index) {
  let newIndex = (index - 1 + items.length) % items.length
  while (items[newIndex].checkVisibility() === false) {
    newIndex = (newIndex - 1 + items.length) % items.length
  }
  return newIndex
}


function setActiveItemFocus(items, index) {
  if (items[index]?.disabled) return

  items.forEach((item, i) => {
    item.tabIndex = i === index ? 0 : -1
  })
  items[index].focus()
}
