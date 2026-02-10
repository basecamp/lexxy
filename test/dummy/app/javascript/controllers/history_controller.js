import { Controller } from "@hotwired/stimulus"

export default class HistoryController extends Controller {
  pushFromFrameLoad(event) {
    const frame = event.target
    const url = frame.src
    window.history.pushState({}, "", url)
  }
}
