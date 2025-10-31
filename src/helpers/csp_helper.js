function getNonce() {
  const element = document.head.querySelector("meta[name=csp-nonce]")
  return element?.content
}

export { getNonce }
