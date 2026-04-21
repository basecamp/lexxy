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

// Wraps `fn` so that repeated invocations within the same animation frame
// collapse into a single call on the next frame, using the latest arguments.
// Useful for observer callbacks (e.g. Lexical `registerUpdateListener`) that
// reflect editor state to UI and don't need to run synchronously inside the
// triggering event's frame.
export function coalesceOnFrame(fn) {
  let rafId = null
  let latestArgs = null

  return function (...args) {
    latestArgs = args
    if (rafId !== null) return

    rafId = requestAnimationFrame(() => {
      rafId = null
      const call = latestArgs
      latestArgs = null
      fn.apply(this, call)
    })
  }
}
