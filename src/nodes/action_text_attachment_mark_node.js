import { $applyNodeReplacement } from 'lexical';
import { createElement } from "../helpers/html_helper";
import { MarkNode } from "@lexical/mark";
import { addClassNamesToElement } from "@lexical/utils";

/**
 * ActionTextAttachmentMarkNode
 * - This model references meta elements (like comments) in rich texts. The actual meta content will be saved and updated in RoR backend
 * - MarkNode from lexical is used to spread meta references over multiple html nodes of the rich text
 * - Adds an attribute (data-selection-group) for grouping selection before rails creates instance
 * - Adds an attribute (data-create-meta-content) for triggering the creation and storage of the meta user input as some ActiveStorage instance in backend
 * - Adds an attribute (data-delete-meta-content) for triggering the deletion of the referenced ActiveStorage instance in backend
 * - After creation the sgid is used for identification
 * - Updating of the meta content (UX and storage) should be provided by the parent application
 *
 */
export class ActionTextAttachmentMarkNode extends MarkNode {

    constructor(ids = [], dataset = {}, sgid = null) {
        super(ids, null)
        this.__dataset = dataset || {
            createMetaContent: null,
            deleteMetaContent: null,
            selectionGroup: null
        }
        this.sgid = sgid
    }

    static getType() {
        return 'action_text_attachment_mark_node';
    }

    static importJSON(serializedNode) {
        const node = $createActionTextAttachmentMarkNode(serializedNode.dataset)
        node.setAttribute('sgid', serializedNode.sgid)
        node.setIds(serializedNode.ids)
        return node
    }

    static importDOM() {
        return {
            'action-text-attachment-mark-node': (node) => ({
                conversion: (element) => {
                    let dataset = {}
                    if (element.getAttribute('data-create-meta-content') !== undefined) {
                        dataset.createMetaContent = element.getAttribute('data-create-meta-content')
                    }
                    if (element.getAttribute('data-delete-meta-content') !== undefined) {
                        dataset.deleteMetaContent = element.getAttribute('data-delete-meta-content')
                    }
                    if (element.getAttribute('data-selection-group') !== undefined) {
                        dataset.selectionGroup = element.getAttribute('data-selection-group')
                    }

                    this.sgid = element.getAttribute("sgid")
                    node = $createActionTextAttachmentMarkNode(dataset, this.sgid)

                    return {
                        node: node
                    }
                },
                priority: 1
            })
        }
    }

    static clone(node) {
        return new ActionTextAttachmentMarkNode(node.__ids, node.__dataset, node.sgid)
    }

    createDOM(config) {
        const element = createElement('action-text-attachment-mark-node', {sgid: this.sgid})
        addClassNamesToElement(element, config.theme.mark);
        this.setContentAttributes(element)
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
        this.setContentAttributes(element)
        element.setAttribute("content-type", "text/html; charset=utf-8")
        return { element }
    }

    setContentAttributes(element) {
        if (this.__dataset.createMetaContent) {
            element.setAttribute("data-create-meta-content", this.__dataset.createMetaContent)
        }
        if (this.__dataset.deleteMetaContent) {
            element.setAttribute("data-delete-meta-content", this.__dataset.deleteMetaContent)
        }
        if (this.__dataset.selectionGroup) {
            element.setAttribute("data-selection-group", this.__dataset.selectionGroup)
        }
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
            sgid: this.sgid,
            dataset: {
                createMetaContent: this.__dataset.createMetaContent,
                deleteMetaContent: this.__dataset.deleteMetaContent,
                selectionGroup: this.__dataset.selectionGroup,
            }
        }
    }
}

export function $createActionTextAttachmentMarkNode(dataset = {}, sgid = null) {
    return $applyNodeReplacement(new ActionTextAttachmentMarkNode([], dataset, sgid));
}
