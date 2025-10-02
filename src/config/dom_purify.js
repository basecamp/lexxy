import DOMPurify from 'dompurify'

DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "strong" || data.tagName === "em") {
    node.removeAttribute('class');
  }
});
