/**
 * registerFormatTextWithClassPlugin(editor)
 *
 * Usage:
 *   import { registerFormatTextWithClassPlugin, FORMAT_TEXT_WITH_CLASS_COMMAND } from './plugins/formatTextWithClassPlugin';
 *   // when editor is ready:
 *   const unregister = registerFormatTextWithClassPlugin(editor);
 *   // call: editor.dispatchCommand(FORMAT_TEXT_WITH_CLASS_COMMAND, { format: 'highlight', className: 'my-highlight' });
 */

import {
  createCommand,
  COMMAND_PRIORITY_EDITOR,
  FORMAT_TEXT_COMMAND,
} from 'lexical';
import {
  $getSelection,
  $isRangeSelection,
} from 'lexical';

export const FORMAT_TEXT_WITH_CLASS_COMMAND = createCommand();

function findMarksInRange(range) {
  const marks = [];
  if (!range) return marks;

  let root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) {
    root = root.parentElement || document.body;
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeName.toLowerCase() !== 'mark') return NodeFilter.FILTER_REJECT;
        try {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        } catch (e) {
          return NodeFilter.FILTER_REJECT;
        }
      },
    },
    false
  );

  let current = walker.nextNode();
  while (current) {
    marks.push(current);
    current = walker.nextNode();
  }

  try {
    const startElem = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
    const endElem = range.endContainer.nodeType === Node.ELEMENT_NODE ? range.endContainer : range.endContainer.parentElement;
    const startClosest = startElem && startElem.closest ? startElem.closest('mark') : null;
    const endClosest = endElem && endElem.closest ? endElem.closest('mark') : null;
    [startClosest, endClosest].forEach((m) => {
      if (m && marks.indexOf(m) === -1 && range.intersectsNode(m)) marks.push(m);
    });
  } catch (e) {
    // ignore
  }

  return marks;
}

export function registerFormatTextWithClassPlugin(editor) {
  // registerCommand returns an unregister function
  return editor.registerCommand(
    FORMAT_TEXT_WITH_CLASS_COMMAND,
    (payload) => {
      const { format, className } = payload || {};

      // 1) Apply the lexical format inside an update so state change is atomic.
      // The DOM update that injects <mark> may occur after this update completes,
      // so we schedule the DOM inspection on the next animation frame below.
      editor.update(() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
      });

      // 2) After the render finishes, inspect the browser selection and find the <mark> elements
      //    created by the formatter, then add className to them.
      //    requestAnimationFrame gives the renderer one frame to update the DOM.
      const schedule = typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame
        : (cb) => setTimeout(cb, 0);

      schedule(() => {
        if (!className) return;

        const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection() : null;
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);

        const marks = findMarksInRange(range);
        if (marks.length === 0) {
          // fallback: try closest mark at start container
          try {
            const startElem = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
            const fallback = startElem && startElem.closest ? startElem.closest('mark') : null;
            if (fallback) marks.push(fallback);
          } catch (e) { /* ignore */ }
        }

        marks.forEach((m) => {
          if (m && m.classList) m.classList.add(className);
        });
      });

      return true;
    },
    COMMAND_PRIORITY_EDITOR
  );
}