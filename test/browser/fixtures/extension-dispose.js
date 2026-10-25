import { configure, Extension } from "lexxy"

class DisposableListenerExtension extends Extension {
  #abortController = new AbortController()

  initializeToolbar(toolbar) {
    toolbar.addEventListener(
      "lexxy-test-ping",
      () => {
        window.__lexxyDisposeTest_pingCount = (window.__lexxyDisposeTest_pingCount || 0) + 1
      },
      { signal: this.#abortController.signal }
    )
  }

  dispose() {
    window.__lexxyDisposeTest_disposeCount = (window.__lexxyDisposeTest_disposeCount || 0) + 1
    this.#abortController.abort()
  }
}

configure({ global: { extensions: [DisposableListenerExtension] } })
