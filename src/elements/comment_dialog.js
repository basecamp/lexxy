import { $getSelection, $isRangeSelection } from "lexical";
import {parseHtml} from "../helpers/html_helper.js";

export class CommentDialog extends HTMLElement {
    connectedCallback() {
        this.dialog = this.querySelector("dialog")
        this.textarea = this.querySelector("textarea")

        this.addEventListener("submit", this.#handleSubmit.bind(this))
    }

    show(editor) {
        this.dialog.show()
    }

    #handleSubmit(event) {
        const command = event.submitter?.value
        this.#editor.dispatchCommand(command, this.textarea.value)
    }

    get #editor() {
        return this.closest("lexxy-toolbar").editor
    }


}

customElements.define("lexxy-comment-dialog", CommentDialog)
