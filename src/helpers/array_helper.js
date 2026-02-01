export function partition(array, predicate) {
  const trueArray = []
  const falseArray = []
  array.forEach((element) => {
    (predicate(element) ? trueArray : falseArray).push(element)
  })
  return [ trueArray, falseArray ]
}

export function range(from, to) {
  return [ ...Array(1 + to - from).keys() ].map(i => i + from)
}
