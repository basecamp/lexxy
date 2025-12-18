export function deepMerge(target, source) {
  for (const [ key, value ] of Object.entries(source)) {
    if (arePlainHashes(target[key], value)) {
      deepMerge(target[key], value)
    } else {
      target[key] = value
    }
  }

  return target
}

function arePlainHashes(...values) {
  return values.every(value => value.constructor == Object)
}
