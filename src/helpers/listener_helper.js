// Register an event listener with a return function to deregister the listener. Both the element and
// the listener are WeakRefs so neither is pinned in memory by the deregister function.
export function registerEventListener(element, type, listener, options) {
  element.addEventListener(type, listener, options)
  const elementRef = new WeakRef(element)
  const listenerRef = new WeakRef(listener)

  return function deregisterListener() {
    const listener = listenerRef.deref()
    if (listener) elementRef.deref()?.removeEventListener(type, listener, options)
  }
}
