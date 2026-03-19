export function deepMerge(target, source) {
  const result = { ...target, ...source }
  for (const [ key, value ] of Object.entries(source)) {
    if (arePlainHashes(target[key], value)) {
      result[key] = deepMerge(target[key], value)
    }
  }

  return result
}

export function partition(hash, predicate) {
  const pass = {}
  const fail = {}
  for (const [ key, value ] of Object.entries(hash)) {
    if (predicate(key, value)) {
      pass[key] = value
    } else {
      fail[key] = value
    }
  }
  return [ pass, fail ]
}

function arePlainHashes(...values) {
  return values.every(value => value && value.constructor == Object)
}
