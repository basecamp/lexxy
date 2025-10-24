import {
    $applyNodeReplacement,
} from 'lexical';
import { createElement } from "../helpers/html_helper";

import {MarkNode} from "@lexical/mark";
import {addClassNamesToElement} from "@lexical/utils";

/**
 * ActionTextAttachmentMarkNode
 * - represents comments saved in rails backend
 * - MarkNode from lexical is used to spread comment over multiple html nodes
 * - Adds an attribute (data-selection-group) for grouping selection before rails creates instance
 * - Adds an attribute (data-comment) for storing user input that creates or updates the rails instance
 *
 */
export class ActionTextAttachmentMarkNode extends MarkNode {

    constructor(ids = [], dataset = {}, sgid = null) {
        super(ids, null)
        this.__dataset = dataset || null
        this.sgid = sgid
    }

    static getType() {
        return 'action_text_attachment_mark_node';
    }

    static importJSON(serializedNode) {
        const node = $createActionTextAttachmentMarkNode({
            dataset: serializedNode.dataset
        })
        node.setAttribute('sgid', serializedNode.sgid)
        node.setIds(serializedNode.ids)
        return node
    }

    static importDOM() {
        return {
            'action-text-attachment-mark-node': (node) => ({
                conversion: (element) => {
                    let dataset = {}
                    if (element.getAttribute('data-comment') !== undefined) {
                        dataset.comment = element.getAttribute('data-comment')
                    }
                    if (element.getAttribute('data-selection-group') !== undefined) {
                        dataset.selectionGroup = element.getAttribute('data-selection-group')
                    }

                    this.sgid = element.getAttribute("sgid")
                    node = $createActionTextAttachmentMarkNode(dataset, (this.sgid || null))

                    return {
                        node: node
                    }
                },
                priority: 1
            })
        }
    }

    static clone(node) {
        console.log("clone")
        return new ActionTextAttachmentMarkNode(node.__ids, node.__dataset)
    }

    createDOM(config) {
        const element = createElement('action-text-attachment-mark-node', {sgid: this.sgid})
        addClassNamesToElement(element, config.theme.mark);
        if (this.__dataset.comment) {
            element.setAttribute("data-comment", this.__dataset.comment)
        }
        if (this.__dataset.selectionGroup) {
            element.setAttribute("data-selection-group", this.__dataset.selectionGroup)
        }
        if (this.__ids.length > 1) {
            addClassNamesToElement(element, config.theme.markOverlap);
        }
        return element;
    }

    exportDOM(editor) {
        const element = document.createElement("action-text-attachment-mark-node")
        if (this.sgid) {
            element.setAttribute("sgid", this.sgid)
        }
        if (this.__dataset.comment) {
            element.setAttribute("data-comment", this.__dataset.comment)
        }
        if (this.__dataset.selectionGroup) {
            element.setAttribute("data-selection-group", this.__dataset.selectionGroup)
        }
        element.setAttribute("content-type", "text/html; charset=utf-8")
        return { element }
    }

    updateDOM() {
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
        return {
            ...super.exportJSON(),
            type: "action_text_attachment_mark_node",
            comment: this.__dataset.comment,
            selectionGroup: this.__dataset.selectionGroup,
            sgid: this.sgid
        }
    }

    get comment() {
        const self = this.getLatest()
        return self.__dataset.comment || ''
    }
}

export function $createActionTextAttachmentMarkNode(dataset = {}, sgid = null) {
    return $applyNodeReplacement(new ActionTextAttachmentMarkNode([], dataset, sgid));
}
