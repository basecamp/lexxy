export function debounce(fn, wait) {
  let timeout

  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}

export function debounceAsync(fn, wait) {
  let timeout

  return (...args) => {
    clearTimeout(timeout)

    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          const result = await fn(...args)
          resolve(result)
        } catch (err) {
          reject(err)
        }
      }, wait)
    })
  }
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function nextFrame() {
  return new Promise(requestAnimationFrame)
}
