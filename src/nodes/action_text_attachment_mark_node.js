import {
    $applyNodeReplacement,
} from 'lexical';
import { createElement } from "../helpers/html_helper";

import {MarkNode} from "@lexical/mark";
import {addClassNamesToElement} from "@lexical/utils";

export class ActionTextAttachmentMarkNode extends MarkNode {
    static getType() {
        return 'action_text_attachment_mark_node';
    }

    constructor(ids = [], serverResponse = {}) {
        super(ids, null)
        this.__sgid = serverResponse.sgid || ''
        this.__src = serverResponse.path || serverResponse.src || ''
    }

    static importJSON(serializedNode) {
        console.log("importJSON")
        const node = $createActionTextAttachmentMarkNode({
            sgid: serializedNode.sgid,
            src: serializedNode.src
        })
        node.setIds(serializedNode.ids)
        return node
    }

    static importDOM() {
        console.log("importDOM()")
        return {
            'action-text-attachment-mark-node': (node) => ({
                conversion: (element) => {
                    const sgid = element.getAttribute('sgid') || ''
                    const src = element.getAttribute('src') || element.getAttribute('url') || ''
                    return {
                        node: $createActionTextAttachmentMarkNode({ sgid, path: src })
                    }
                },
                priority: 1
            })
        }
    }

    static clone(node) {
        return new ActionTextAttachmentMarkNode(node.__ids, {
            sgid: node.__sgid,
            src: node.__src
        })
    }

    createDOM(config) {
        const element = createElement('action-text-attachment-mark-node', {
            "sgid": this.__sgid,
            "src": this.__src,
        })
        addClassNamesToElement(element, config.theme.mark);
        if (this.__ids.length > 1) {
            addClassNamesToElement(element, config.theme.markOverlap);
        }
        return element;
    }

    exportDOM(editor) {
        const element = document.createElement("action-text-attachment-mark-node")
        element.setAttribute("sgid", this.__sgid || '')
        element.setAttribute("src", this.__src || '')
        element.setAttribute("content-type", "text/html; charset=utf-8")
        return { element }
    }

    updateDOM() {
        console.log("updateDOM()")
        return true
    }

    isInline() {
        return true
    }

    excludeFromCopy(destination) {
        // Override MarkNode's default behavior to allow HTML export
        // Return false to include this node in HTML export
        return false
    }

    exportJSON() {
        console.log("exportJSON()")
        return {
            ...super.exportJSON(),
            type: "action_text_attachment_mark_node",
            sgid: this.__sgid,
            src: this.__src
        }
    }

    get sgid() {
        const self = this.getLatest()
        return self.__sgid
    }

    get src() {
        const self = this.getLatest()
        return self.__src
    }
}

export function $createActionTextAttachmentMarkNode(serverResponse = {}) {
    return $applyNodeReplacement(new ActionTextAttachmentMarkNode([], serverResponse));
}
