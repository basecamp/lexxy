// Shared, strictly-contained element used to attach ephemeral nodes when we
// need to read computed styles (e.g. canonicalizing style values, resolving
// CSS custom properties). The container is created once and attached to
// `document.body` once; subsequent child mutations happen *inside* the
// contained subtree so they do not invalidate style on the rest of the page.
//
// Without this, `document.body.appendChild(...)` / `element.remove()` calls
// forced the browser to re-evaluate every ancestor-dependent selector (`:has()`,
// descendant combinators, universal sibling rules) across the document on each
// invocation — a 13,000+ element style recalc per call on a typical Basecamp
// page.

let resolverRoot = null

export function styleResolverRoot() {
  if (resolverRoot && resolverRoot.isConnected) return resolverRoot

  resolverRoot = document.createElement("div")
  resolverRoot.setAttribute("aria-hidden", "true")
  resolverRoot.setAttribute("data-lexxy-style-resolver", "")
  // `contain: strict` (size, layout, paint, style) isolates everything.
  // The root itself paints nothing (visibility hidden), has zero
  // geometric impact (position fixed, intrinsic size via contain), and
  // never leaks style invalidation to its ancestors.
  resolverRoot.style.cssText = "contain: strict; position: fixed; top: 0; left: 0; visibility: hidden; pointer-events: none; width: 0; height: 0;"
  document.body.appendChild(resolverRoot)
  return resolverRoot
}
