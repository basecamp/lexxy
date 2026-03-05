import { Controller } from "@hotwired/stimulus"
import { renderContentMath } from "lexxy"

export default class extends Controller {
  connect() {
    renderContentMath(this.element)
  }
}
