export { highlightCode, highlightElement } from './lexxy_helpers.esm.js';
import createDOMPurify from 'dompurify';
import { getStyleObjectFromCSS, getCSSFromStyleObject, $getSelectionStyleValueForProperty, $ensureForwardRangeSelection, $isAtNodeEnd, $patchStyleText, $setBlocksType, $forEachSelectedTextNode } from '@lexical/selection';
import { SKIP_DOM_SELECTION_TAG, CAN_UNDO_COMMAND, COMMAND_PRIORITY_LOW, CAN_REDO_COMMAND, $getSelection, $isRangeSelection, DecoratorNode, $createTextNode, defineExtension, $getRoot, $caretFromPoint, $setSelectionFromCaretRange, $getCaretRange, $normalizeCaret, $getChildCaret, $getCaretInDirection, $isParagraphNode, $isLineBreakNode, $createParagraphNode, $isElementNode, $isRootOrShadowRoot, $isRootNode, $createNodeSelection, $isDecoratorNode, $isTextNode, $getSiblingCaret, $rewindSiblingCaret, $splitAtPointCaretNext, $normalizeSelection__EXPERIMENTAL, $isChildCaret, $isTextPointCaret, $isExtendableTextPointCaret, $isSiblingCaret, $getCommonAncestor, $findMatchingParent, TextNode, createCommand, COMMAND_PRIORITY_EDITOR, $getEditor, $getNodeByKey, HISTORY_MERGE_TAG, SKIP_SCROLL_INTO_VIEW_TAG, $cloneWithProperties, $getNearestRootOrShadowRoot, $createRangeSelection, $setSelection, createState, COMMAND_PRIORITY_NORMAL, $getState, $setState, $hasUpdateTag, PASTE_TAG, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_TAB_COMMAND, INSERT_LINE_BREAK_COMMAND, COMMAND_PRIORITY_HIGH, INSERT_PARAGRAPH_COMMAND, OUTDENT_CONTENT_COMMAND, INDENT_CONTENT_COMMAND, $isNodeSelection, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ARROW_DOWN_COMMAND, DELETE_CHARACTER_COMMAND, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_CRITICAL, $addUpdateTag, CLICK_COMMAND, isDOMNode, $getNearestNodeFromDOMNode, ElementNode, $splitNode, $getChildCaretAtIndex, $createLineBreakNode, SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, PASTE_COMMAND, $onUpdate, ParagraphNode, RootNode, DRAGSTART_COMMAND, DROP_COMMAND, mergeRegister as mergeRegister$1, $createRangeSelectionFromDom, CLEAR_HISTORY_COMMAND, KEY_ENTER_COMMAND, KEY_SPACE_COMMAND, INPUT_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DOWN_COMMAND } from 'lexical';
import * as lexical from 'lexical';
export { lexical as Lexical };
import { LinkNode, $createAutoLinkNode, $toggleLink, $createLinkNode, $isLinkNode, AutoLinkNode } from '@lexical/link';
import { buildEditorFromExtensions } from '@lexical/extension';
import { ListNode, ListItemNode, $getListDepth, $isListNode, $isListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, $createListNode, $createListItemNode, registerList } from '@lexical/list';
import { $getNearestNodeOfType, $wrapNodeInElement, $lastToFirstIterator, $descendantsMatching, mergeRegister, $insertNodeToNearestRoot, $insertFirst, $unwrapAndFilterDescendants, $firstToLastIterator, $getNearestBlockElementAncestorOrThrow, IS_APPLE } from '@lexical/utils';
import { registerPlainText } from '@lexical/plain-text';
import { RichTextExtension, $isQuoteNode, QuoteNode, $isHeadingNode, $createHeadingNode, $createQuoteNode, HeadingNode, registerRichText } from '@lexical/rich-text';
import { $generateNodesFromDOM, $generateHtmlFromNodes } from '@lexical/html';
import { HistoryExtension } from '@lexical/history';
import { $isCodeNode, CodeHighlightNode, PrismTokenizer, $isCodeHighlightNode, $createCodeNode, $createCodeHighlightNode, CodeNode, registerCodeHighlighting, normalizeCodeLang, CODE_LANGUAGE_FRIENDLY_NAME_MAP } from '@lexical/code';
import { TRANSFORMERS, registerMarkdownShortcuts } from '@lexical/markdown';
import { INSERT_TABLE_COMMAND, $getTableCellNodeFromLexicalNode, TableCellNode, TableNode, TableRowNode, setScrollableTablesActive, registerTablePlugin, registerTableSelectionObserver, TableCellHeaderStates, $insertTableRowAtSelection, $insertTableColumnAtSelection, $deleteTableRowAtSelection, $deleteTableColumnAtSelection, $findTableNode, $getTableRowIndexFromTableCellNode, $getTableColumnIndexFromTableCellNode, $findCellNode, $getElementForTableNode } from '@lexical/table';
import { marked } from 'marked';
import { $insertDataTransferForRichText } from '@lexical/clipboard';
import 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-kotlin';

function deepMerge(target, source) {
  const result = { ...target, ...source };
  for (const [ key, value ] of Object.entries(source)) {
    if (arePlainHashes(target[key], value)) {
      result[key] = deepMerge(target[key], value);
    }
  }

  return result
}

function arePlainHashes(...values) {
  return values.every(value => value && value.constructor == Object)
}

class Configuration {
  #tree = {}

  constructor(...configs) {
    this.merge(...configs);
  }

  merge(...configs) {
    return this.#tree = configs.reduce(deepMerge, this.#tree)
  }

  get(path) {
    const keys = path.split(".");
    return keys.reduce((node, key) => node[key], this.#tree)
  }
}

function range(from, to) {
  return [ ...Array(1 + to - from).keys() ].map(i => i + from)
}

const global = new Configuration({
  attachmentTagName: "action-text-attachment",
  attachmentContentTypeNamespace: "actiontext",
  authenticatedUploads: false,
  extensions: []
});

const presets = new Configuration({
  default: {
    attachments: true,
    markdown: true,
    multiLine: true,
    permittedAttachmentTypes: null,
    richText: true,
    toolbar: {
      upload: "both"
    },
    headings: [ "h2", "h3", "h4" ],
    highlight: {
      buttons: {
        color: range(1, 9).map(n => `var(--highlight-${n})`),
        "background-color": range(1, 9).map(n => `var(--highlight-bg-${n})`),
      },
      permit: {
        color: [],
        "background-color": []
      }
    }
  }
});

var Lexxy = {
  global,
  presets,
  configure({ global: newGlobal, ...newPresets }) {
    if (newGlobal) {
      global.merge(newGlobal);
    }
    presets.merge(newPresets);
  }
};

// Lexxy's own DOMPurify instance, deliberately not the shared default export.
//
// dompurify's default export is a singleton, and both its config and its hooks
// are global to every consumer in the bundle. That makes configuring it from an
// editor's connectedCallback actively dangerous for the host app: DOMPurify
// treats a persistent config as final, so once setConfig() has run, every
// later `sanitize(html, config)` anywhere in the app silently ignores its own
// config argument. An app sanitizing untrusted HTML with, say,
// `{ ALLOW_DATA_ATTR: false }` would keep passing that option and stop getting
// it the moment a Lexxy editor connected — with no error and no visible change
// at the call site.
//
// Calling the default export with a window returns a fresh, independent
// instance. This one carries the hooks and config below; nothing we do here can
// reach the app's instance, and nothing it does can reach ours.
//
// Under Trusted Types, every DOMPurify instance tries to create a policy named
// `dompurify` on its first sanitize, and TT rejects a duplicate name — so the
// second instance on the page gets none. That matters: DOMPurify hands its input
// to DOMParser.parseFromString, which is itself a TT sink, so an unsigned
// instance throws rather than degrading, and which sanitizer breaks depends on
// which one ran first.
//
// So we create our own, under our own name, and hand it to DOMPurify rather than
// letting it try. Guarded, because creating a policy the CSP hasn't allowlisted
// throws: if that happens we're back to no policy, which is exactly where this
// stood before. An app enforcing `require-trusted-types-for 'script'` should add
// `lexxy` to its `trusted-types` directive.
//
// What this does NOT do is make Lexxy work under enforced Trusted Types. It
// stops *our* sanitizer from taking the host's policy name and breaking the
// host's; it does nothing about Lexxy's own unwrapped sinks, and there are
// several. `parseHtml` in helpers/html_helper.js hands a plain string to
// DOMParser.parseFromString on the initial-value path, so the editor throws
// before it finishes connecting — verified in Chromium under
// `require-trusted-types-for 'script'`, with `lexxy` allowlisted and without.
// The `insertAdjacentHTML` in nodes/custom_action_text_attachment_node.js and
// the `innerHTML` writes across elements/ are in the same position. Making the
// editor usable under TT is a separate piece of work; this is a prerequisite
// for it, not the whole of it.
const TRUSTED_TYPES_POLICY = createTrustedTypesPolicy();

function createTrustedTypesPolicy() {
  // Feature-detected below, so browsers without Trusted Types simply get no
  // policy — the same path as a CSP that doesn't allowlist ours.
  // eslint-disable-next-line compat/compat
  const trustedTypes = window.trustedTypes;

  if (typeof trustedTypes?.createPolicy !== "function") return null

  try {
    return trustedTypes.createPolicy("lexxy", { createHTML: (html) => html, createScriptURL: (url) => url })
  } catch {
    return null
  }
}

const DOMPurify = createDOMPurify(window);

// alt is inert on every element it can appear on, so it sits in the blanket
// list. srcset is deliberately absent — it carries URLs, so it belongs to a
// consumer that declares it.
const ALLOWED_HTML_ATTRIBUTES = [ "alt", "class", "contenteditable", "href", "src", "style", "title" ];

// width/height are scoped to img rather than allowlisted globally, because
// ALLOWED_ATTR is not per-tag: putting them there would also permit
// `<table width="100000">` and `<td height="500">` in attachment content, which
// is layout the editor previously stripped. An image needs them to hold its
// place while it loads; nothing else here does.
const DEFAULT_TAG_ATTRIBUTES = { img: [ "width", "height" ] };

const ALLOWED_STYLE_PROPERTIES = [ "color", "background-color" ];

// An attachment's `url` ends up as an <img src> (action_text_attachment_node
// reads it into `this.src`, which is assigned to img.src). DOMPurify already
// permits a data: URI on img[src] — img is in its DATA_URI_TAGS — but it has no
// way to know that a custom element's `url` feeds the same sink, so it applies
// the plain URI check and drops it.
//
// Until 3.3.2 that never came up: attributes admitted by a *functional* ADD_ATTR
// skipped URI validation entirely (GHSA-cjmm-f4jc-qw8r), which is how data:
// URLs worked here — and, less happily, how `url="javascript:…"` survived too.
// The fix restored validation for both.
//
// So `url` is marked URI-safe, which hands the decision to this hook, and the
// hook allows exactly what DOMPurify allows on an img src: its default scheme
// list plus data:. javascript: and friends are dropped, which is stricter than
// what shipped before the upgrade. The hook only ever removes an attribute — it
// never force-keeps one — so scoping stays with the ADD_ATTR predicate, and a
// `url` on a tag that never declared it is dropped as it always was.
const URI_BEARING_ATTACHMENT_ATTRIBUTES = [ "url" ];
const SAFE_ATTACHMENT_URI = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;
// eslint-disable-next-line no-control-regex -- mirrors DOMPurify's own ATTR_WHITESPACE
const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;

function attachmentUriFilterHook(_currentNode, hookEvent) {
  if (!URI_BEARING_ATTACHMENT_ATTRIBUTES.includes(hookEvent.attrName)) return

  if (!SAFE_ATTACHMENT_URI.test(String(hookEvent.attrValue).replace(ATTR_WHITESPACE, ""))) {
    hookEvent.keepAttr = false;
  }
}


function styleFilterHook(_currentNode, hookEvent) {
  if (hookEvent.attrName === "style" && hookEvent.attrValue) {
    const styles = { ...getStyleObjectFromCSS(hookEvent.attrValue) };
    const sanitizedStyles = { };

    for (const property in styles) {
      if (ALLOWED_STYLE_PROPERTIES.includes(property)) {
        sanitizedStyles[property] = styles[property];
      }
    }

    if (Object.keys(sanitizedStyles).length) {
      hookEvent.attrValue = getCSSFromStyleObject(sanitizedStyles);
    } else {
      hookEvent.keepAttr = false;
    }
  }
}

// DOMPurify's SAFE_FOR_XML guard drops any attribute whose value contains an
// XML-unsafe sequence — a comment terminator (`-->`, `--!>`, `]>`) or a raw
// `</style`-style tag close. Lexxy serializes attachment content (arbitrary HTML,
// including Rails view-annotation comments like `<!-- BEGIN app/views/... -->`)
// into the `content` attribute of an <action-text-attachment>. Under SAFE_FOR_XML
// that value trips the guard and the whole attribute is stripped, silently losing
// the attachment on the storage round-trip.
//
// The content attribute is inert: it is always entity-escaped on serialization and
// is only ever re-parsed — and re-sanitized — by the attachment node's own renderer,
// so preserving it here is mXSS-safe. This regexp mirrors DOMPurify's own
// SAFE_FOR_XML attribute-value check, so it is coupled to the dompurify version in
// package.json — verified identical against 3.4.13's check apart from the /g needed
// for replace().
const XML_UNSAFE_ATTRIBUTE_VALUE =
  /((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/gi;

// Narrowed to the attachment element itself. The justification for the bypass below
// is specific to attachment content: it is entity-escaped on serialization and only
// ever re-parsed by the attachment node's own renderer, which re-sanitizes it.
// Extensions may declare `content` on any tag they like (see home/docs/extensions.md),
// and for `{ tag: "x-widget", attributes: ["content"] }` none of that reasoning holds
// — whatever renders x-widget is free to treat the value as markup.
//
// No fallback to the literal `action-text-attachment`: when a consumer renames the
// element (bc3 uses `bc-attachment`), that name is no longer imported or rendered by
// the attachment node, so exempting it would grant the bypass to a tag nothing here
// treats as an attachment. The configured name is the only one that means anything.
function isAttachmentTag(tag) {
  return tag === Lexxy.global.get("attachmentTagName")
}

// Stateless: the per-editor config arrives as the hook's third argument.
//
// This is the whole reason the hook cannot keep its own copy of which tags allow
// `content`. buildConfig() now runs once per editor, so a module-level set would be
// whichever editor connected last, and it would desynchronise from the config this
// call is actually running under — in both directions. Editor B (attachments off)
// connecting last would strip editor A's content; the reverse would force-keep
// `content` on an element whose in-force config denied it.
//
// DOMPurify passes the resolved config to every hook (`hook.call(DOMPurify, node,
// data, CONFIG)`), and because nothing calls setConfig any more, _parseConfig runs on
// each sanitize() — so CONFIG is this call's config, not a stale one. buildConfig
// already exposes the per-tag predicate as ADD_ATTR, which is exactly the question
// being asked here.
function preserveSerializedContentHook(currentNode, hookEvent, config) {
  const tag = currentNode?.nodeName?.toLowerCase();

  // forceKeepAttr bypasses DOMPurify's per-tag attribute allowlist, so it is scoped
  // to a tag this config actually granted `content` on. Anything else — a
  // non-attachment tag, or an attachment tag configured without `content` because
  // attachments are disabled — falls through to normal validation and is stripped.
  // The bypass never leaks past what the calling editor's config already permits.
  if (hookEvent.attrName === "content" && isAttachmentTag(tag) && config?.ADD_ATTR?.("content", tag)) {
    // Neutralize only the copy DOMPurify inspects for its XML-safety guard. The
    // original value is what reaches the DOM: forceKeepAttr makes _sanitizeAttributes
    // `continue`, which skips the _setAttributeValue at the end of the loop, so the
    // attribute is left exactly as parsed.
    //
    // Replaced with a space rather than an empty string, because deleting a match can
    // join its neighbours into a *new* unsafe sequence that String#replace will not
    // rescan. `foo--</style>bar` collapses to `foo-->bar`, which still trips the guard
    // — and the guard runs before the forceKeepAttr check, so the attribute would be
    // dropped despite this hook. A separator makes that impossible for every
    // alternation in the pattern.
    hookEvent.attrValue = hookEvent.attrValue.replace(XML_UNSAFE_ATTRIBUTE_VALUE, " ");
    hookEvent.forceKeepAttr = true;
  }
}

DOMPurify.addHook("uponSanitizeAttribute", styleFilterHook);
DOMPurify.addHook("uponSanitizeAttribute", attachmentUriFilterHook);
// Registered ahead of stimulusAttributeFilterHook, which sets keepAttr = false.
// forceKeepAttr wins over keepAttr in DOMPurify, so if this hook's attribute set
// ever widened past `content` to overlap that one's (`data-controller`,
// `data-action`) it would silently defeat it. They are disjoint today and no test
// links them, so the ordering is noted here rather than left to be rediscovered.
DOMPurify.addHook("uponSanitizeAttribute", preserveSerializedContentHook);

const FORBIDDEN_STIMULUS_ATTRIBUTES = [ "data-controller", "data-action" ];

// Stimulus behavior attributes must never survive sanitization, whatever an
// extension's allowedElements declares. FORBID_ATTR alone isn't enough: in
// DOMPurify 3.x the functional ADD_ATTR — which Lexxy builds from the public
// allowedElements API — is evaluated ahead of FORBID_ATTR, so an extension that
// listed one of these on a tag would otherwise reinstate it. This hook drops
// them unconditionally, keeping the class-level prohibition config-independent.
function stimulusAttributeFilterHook(_currentNode, hookEvent) {
  if (FORBIDDEN_STIMULUS_ATTRIBUTES.includes(hookEvent.attrName)) {
    hookEvent.keepAttr = false;
  }
}

DOMPurify.addHook("uponSanitizeAttribute", stimulusAttributeFilterHook);

DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "strong" || data.tagName === "em") {
    node.removeAttribute("class");
  }
});

function buildConfig(allowedElements ) {
  const tagAttributes = {};

  for (const element of allowedElements) {
    if (typeof element === "string") {
      tagAttributes[element] ||= [];
    } else {
      tagAttributes[element.tag] ||= [];
      tagAttributes[element.tag].push(...element.attributes);
    }
  }

  // Only for tags the caller already permits — this widens what an allowed
  // element may carry, never which elements are allowed.
  for (const [ tag, attributes ] of Object.entries(DEFAULT_TAG_ATTRIBUTES)) {
    if (tagAttributes[tag]) tagAttributes[tag].push(...attributes);
  }

  return {
    ALLOWED_TAGS: Object.keys(tagAttributes),
    ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
    ADD_ATTR: (attribute, tag) => tagAttributes[tag]?.includes(attribute),
    ADD_URI_SAFE_ATTR: [ "caption", "filename", ...URI_BEARING_ATTACHMENT_ATTRIBUTES ],
    ...(TRUSTED_TYPES_POLICY ? { TRUSTED_TYPES_POLICY } : {}),
    SAFE_FOR_XML: false, // So that it does not strip attributes that contains serialized HTML (like content)
    // Stimulus behavior attributes must never survive sanitization: they let stored content
    // wire up arbitrary controllers/actions in the viewer's session. FORBID_ATTR wins over
    // ALLOWED_ATTR/ADD_ATTR/ALLOW_DATA_ATTR in DOMPurify, so this holds even though other
    // data-* attributes (data-language, data-trix-*, etc.) are otherwise allowed through.
    FORBID_ATTR: [ "data-controller", "data-action" ]
  }
}

function getNonce() {
  const element = document.head.querySelector("meta[name=csp-nonce]");
  return element?.content
}

// Register an event listener with a return function to deregister the listener. Both the element and
// the listener are WeakRefs so neither is pinned in memory by the deregister function.
function registerEventListener(element, type, listener, options) {
  element.addEventListener(type, listener, options);
  const elementRef = new WeakRef(element);
  const listenerRef = new WeakRef(listener);

  return function deregisterListener() {
    const listener = listenerRef.deref();
    if (listener) elementRef.deref()?.removeEventListener(type, listener, options);
  }
}

class ListenerBin {
  #listeners = []

  track(...listeners) {
    this.#listeners.push(...listeners);
  }

  dispose() {
    while (this.#listeners.length) {
      const teardown = this.#listeners.pop();
      teardown();
    }
  }
}

function handlingDefault(handler) {
  return event => {
    const handled = handler(event);
    if (handled) event.preventDefault();
    return handled
  }
}

function createElement(name, properties, content = "") {
  const element = document.createElement(name);
  for (const [ key, value ] of Object.entries(properties || {})) {
    if (key === "dataset") {
      Object.entries(value).forEach(([ key, value ]) => (element.dataset[key] = value));
    } else if (key in element) {
      element[key] = value;
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, value);
    }
  }
  if (content) {
    element.innerHTML = content;
  }
  return element
}

function parseHtml(html) {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html")
}

function createAttachmentFigure(contentType, isPreviewable, fileName) {
  const extension = fileName ? fileName.split(".").pop().toLowerCase() : "unknown";
  return createElement("figure", {
    className: `attachment attachment--${isPreviewable ? "preview" : "file"} attachment--${extension}`,
    "data-content-type": contentType
  })
}

function isPreviewableImage(contentType) {
  return contentType.startsWith("image/") && !contentType.includes("svg")
}

function dispatch(element, eventName, detail = null, cancelable = false) {
  return element.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail, cancelable }))
}

function addBlockSpacing(doc) {
  const selector = "body > :not(h1, h2, h3, h4, h5, h6) + *, blockquote > :not(h1, h2, h3, h4, h5, h6) + *";
  for (const block of doc.querySelectorAll(selector)) {
    const spacer = doc.createElement("p");
    spacer.appendChild(doc.createElement("br"));
    block.before(spacer);
  }
}

function generateDomId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}`
}

function extractPlainTextFromHtml(innerHtml = "") {
  return parseHtml(innerHtml).body.textContent.trim()
}

function isActiveAndVisible(element) {
  return element && !element.disabled && checkVisibility(element)
}

// no `checkVisibility` in Safari < 17.4
// https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility#browser_compatibility
function checkVisibility(element, options) {
  if (element.checkVisibility) {
    return element.checkVisibility(options)
  } else {
    // Will not work for body or a fixed position element child of the body
    // which is OK since that doesn't apply in the toolbar where this is used
    return Boolean(element.offsetParent)
  }
}

function handleRollingTabIndex(elements, event) {
  const previousActiveElement = document.activeElement;

  if (elements.includes(previousActiveElement)) {
    const finder = new NextElementFinder(elements, event.key);

    if (finder.selectNext(previousActiveElement)) {
      event.preventDefault();
    }
  }
}

class NextElementFinder {
  constructor(elements, key) {
    this.elements = elements;
    this.key = key;
  }

  selectNext(fromElement) {
    const nextElement = this.#findNextElement(fromElement);

    if (nextElement) {
      const inactiveElements = this.elements.filter(element => element !== nextElement);
      this.#unsetTabIndex(inactiveElements);
      this.#focusWithActiveTabIndex(nextElement);
      return true
    }

    return false
  }

  #findNextElement(fromElement) {
    switch (this.key) {
      case "ArrowRight":
      case "ArrowDown":
        return this.#findNextSibling(fromElement)

      case "ArrowLeft":
      case "ArrowUp":
        return this.#findPreviousSibling(fromElement)

      case "Home":
        return this.#findFirst()

      case "End":
        return this.#findLast()
    }
  }

  #findFirst(elements = this.elements) {
    return elements.find(isActiveAndVisible)
  }

  #findLast(elements = this.elements) {
    return elements.findLast(isActiveAndVisible)
  }

  #findNextSibling(element) {
    const afterElements = this.elements.slice(this.#indexOf(element) + 1);
    return this.#findFirst(afterElements)
  }

  #findPreviousSibling(element) {
    const beforeElements = this.elements.slice(0, this.#indexOf(element));
    return this.#findLast(beforeElements)
  }

  #indexOf(element) {
    return this.elements.indexOf(element)
  }

  #focusWithActiveTabIndex(element) {
    if (isActiveAndVisible(element)) {
      element.tabIndex = 0;
      element.focus();
    }
  }

  #unsetTabIndex(elements) {
    elements.forEach(element => element.tabIndex = -1);
  }
}

var ToolbarIcons = {
  "bold":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.05273 1.88232C10.6866 1.88237 12.0033 2.20353 12.9529 2.89673L13.1272 3.0293C13.974 3.70864 14.4008 4.63245 14.4009 5.76562C14.4008 6.49354 14.2316 7.15281 13.8845 7.73145C13.6683 8.09188 13.3997 8.40162 13.0818 8.66016C13.5902 8.92606 14.0196 9.28599 14.3635 9.74121C14.8586 10.3834 15.0945 11.1743 15.0945 12.0879C15.0944 13.3698 14.5922 14.3931 13.5879 15.1106L13.5857 15.1128C12.5967 15.805 11.196 16.125 9.43799 16.125H3.10547V1.88232L9.05273 1.88232ZM6.36108 13.4084H9.28418C10.224 13.4084 10.8634 13.2491 11.2581 12.9851C11.6259 12.7389 11.8198 12.3768 11.8198 11.8367C11.8197 11.2968 11.6259 10.9351 11.2581 10.689C10.8634 10.425 10.2241 10.2649 9.28418 10.2649H6.36108V13.4084ZM6.36108 7.56812H8.78247C9.5163 7.56809 10.0547 7.45371 10.429 7.25757L10.5791 7.16895C10.9438 6.92178 11.1255 6.57934 11.1255 6.09302C11.1254 5.59017 10.9414 5.25227 10.5835 5.02002L10.5784 5.01636L10.5732 5.01343C10.1994 4.75387 9.61878 4.59818 8.78247 4.59814H6.36108V7.56812Z"/>
  </svg>`,

  "italic":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.1379 3.91187L14.1086 4.06421H11.4668L9.49805 13.9431H12.0981L11.7473 15.7852L11.7188 15.9375H4.16675L4.51758 14.0955L4.54614 13.9431H7.18799L9.17505 4.06421H6.55664L6.90747 2.22217L6.93677 2.06982H14.4888L14.1379 3.91187Z"/>
  </svg>`,

  "strikethrough":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.3723 11.8015C14.3771 11.8858 14.3811 11.9756 14.3811 12.0681C14.3811 12.811 14.1777 13.4959 13.7725 14.1174L13.7717 14.1189C13.3624 14.7329 12.7463 15.2162 11.9377 15.5742L11.9348 15.5757C11.1214 15.9223 10.1306 16.092 8.96997 16.092C7.9356 16.092 6.93308 15.9348 5.96338 15.6204L5.96045 15.6189C5.00593 15.292 4.24112 14.8699 3.67676 14.3459L3.57568 14.2522L3.63501 14.1277L4.45605 12.397L4.64282 12.5654C5.13492 13.0083 5.76733 13.3759 6.54492 13.6648C7.33475 13.9406 8.14322 14.0786 8.96997 14.0786C10.0731 14.0786 10.8638 13.8932 11.3708 13.5513C11.8757 13.1982 12.1172 12.7464 12.1172 12.1838C12.1172 12.0662 12.1049 11.9556 12.0828 11.8513L12.0344 11.625H14.3621L14.3723 11.8015Z"/>
    <path d="M9.2981 1.91602C10.111 1.91604 10.9109 2.02122 11.6975 2.23096C12.4855 2.44111 13.1683 2.74431 13.7417 3.14429L13.8655 3.23071L13.8083 3.36987L13.1726 4.91235L13.0869 5.1189L12.8987 4.99878C12.3487 4.64881 11.761 4.38633 11.1365 4.21143L11.1328 4.20996C10.585 4.04564 10.0484 3.95419 9.52295 3.93384L9.2981 3.92944C8.22329 3.92944 7.44693 4.12611 6.94043 4.49121C6.44619 4.85665 6.20874 5.31616 6.20874 5.88135L6.21533 6.03296C6.24495 6.37662 6.37751 6.65526 6.61011 6.87964L6.72144 6.97632C6.98746 7.19529 7.30625 7.37584 7.68018 7.51538L8.05151 7.63184C8.45325 7.75061 8.94669 7.87679 9.53247 8.01123L9.53467 8.01196C10.1213 8.15305 10.6426 8.29569 11.0991 8.4375H15C15.5178 8.4375 15.9375 8.85723 15.9375 9.375C15.9375 9.89277 15.5178 10.3125 15 10.3125H3C2.48223 10.3125 2.0625 9.89277 2.0625 9.375C2.0625 8.85723 2.48223 8.4375 3 8.4375H4.93726C4.83783 8.34526 4.74036 8.24896 4.64795 8.146L4.64502 8.14233C4.1721 7.58596 3.94482 6.85113 3.94482 5.95825C3.94483 5.20441 4.14059 4.51965 4.53369 3.90967L4.53516 3.90747C4.94397 3.29427 5.55262 2.81114 6.34863 2.45288C7.15081 2.0919 8.13683 1.91602 9.2981 1.91602Z"/>
  </svg>`,

  "underline":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 14C14.5523 14 15 14.4477 15 15C15 15.5523 14.5523 16 14 16H4C3.44772 16 3 15.5523 3 15C3 14.4477 3.44772 14 4 14H14Z"/>
    <path d="M12.625 1.59375C13.25 1.59375 13.625 1.97656 13.625 2.64062V9.02344C13.625 11.4844 11.8516 13.1875 8.99219 13.1875C6.14062 13.1875 4.35938 11.4844 4.35938 9.02344V2.64062C4.35938 1.97656 4.74219 1.59375 5.36719 1.59375C6 1.59375 6.375 1.97656 6.375 2.64062V8.84375C6.375 10.3828 7.32031 11.4297 8.99219 11.4297C10.6641 11.4297 11.6172 10.3828 11.6172 8.84375V2.64062C11.6172 1.97656 11.9922 1.59375 12.625 1.59375Z"/>
  </svg>`,

  "heading":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.5 2C12.0523 2 12.5 2.44772 12.5 3V3.5C12.5 4.05228 12.0523 4.5 11.5 4.5H8V15C8 15.5523 7.55228 16 7 16H6.5C5.94772 16 5.5 15.5523 5.5 15V4.5H2C1.44772 4.5 1 4.05228 1 3.5V3C1 2.44772 1.44772 2 2 2H11.5ZM16 7C16.5523 7 17 7.44772 17 8V8.5C17 9.05228 16.5523 9.5 16 9.5H15V15C15 15.5523 14.5523 16 14 16H13.5C12.9477 16 12.5 15.5523 12.5 15V9.5H11.5C10.9477 9.5 10.5 9.05228 10.5 8.5V8C10.5 7.44772 10.9477 7 11.5 7H16Z"/>
  </svg>`,

  "h1":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.12207 4.30078C8.84668 4.30078 9.25684 4.74512 9.25684 5.51758V12.5518C9.25677 13.3241 8.84662 13.7686 8.12207 13.7686C7.39752 13.7686 6.9942 13.3309 6.99414 12.5518V9.87207H3.56934V12.5518C3.56927 13.3241 3.15912 13.7686 2.43457 13.7686C1.71002 13.7686 1.3067 13.3309 1.30664 12.5518V5.51758C1.30664 4.73828 1.70996 4.30078 2.43457 4.30078C3.15918 4.30078 3.56934 4.74512 3.56934 5.51758V8.07422H6.99414V5.51758C6.99414 4.73828 7.39746 4.30078 8.12207 4.30078ZM13.8418 4.125H14.8271C15.543 4.125 16.0449 4.56934 16.0449 5.23828V12.7207C16.0449 13.4111 15.6348 13.8486 14.9854 13.8486C14.336 13.8486 13.9395 13.418 13.9395 12.7207V6.11133H13.8887L12.9541 6.74219C12.7354 6.88574 12.5303 6.95312 12.3047 6.95312C11.7646 6.95312 11.3955 6.58398 11.3955 6.06445C11.3955 5.69531 11.5801 5.42578 11.9766 5.15625L13.4023 4.32031C13.5459 4.23633 13.6826 4.17578 13.8418 4.125Z"/>
  </svg>`,

  "h2":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.12207 4.30078C8.84668 4.30078 9.25684 4.74512 9.25684 5.51758V12.5518C9.25677 13.3241 8.84662 13.7686 8.12207 13.7686C7.39752 13.7686 6.9942 13.3309 6.99414 12.5518V9.87207H3.56934V12.5518C3.56927 13.3241 3.15912 13.7686 2.43457 13.7686C1.71002 13.7686 1.3067 13.3309 1.30664 12.5518V5.51758C1.30664 4.73828 1.70996 4.30078 2.43457 4.30078C3.15918 4.30078 3.56934 4.74512 3.56934 5.51758V8.07422H6.99414V5.51758C6.99414 4.73828 7.39746 4.30078 8.12207 4.30078ZM13.6445 4.19824C15.5244 4.19824 16.8984 5.34668 16.8984 6.91211C16.8984 7.8759 16.4335 8.7237 15.292 9.84473L13.3438 11.8135V11.9092H16.1875C16.8232 11.9092 17.2197 12.251 17.2197 12.8115C17.2196 13.3651 16.83 13.7002 16.1875 13.7002H11.5117C10.8487 13.7002 10.4112 13.3241 10.4111 12.75C10.4111 12.3399 10.6368 11.9843 11.3203 11.3145L13.6855 8.88086C14.4169 8.13583 14.7245 7.64349 14.7246 7.12402C14.7246 6.4541 14.2393 6.00293 13.5215 6.00293C12.9404 6.00293 12.5166 6.29688 12.2158 6.90527C11.9151 7.37002 11.6552 7.54785 11.2588 7.54785C10.7188 7.54785 10.3429 7.17861 10.3428 6.65918C10.3428 5.3877 11.7783 4.19824 13.6445 4.19824Z"/>
  </svg>`,

  "h3":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5967 4.19824C15.5928 4.19824 16.9873 5.23047 16.9873 6.7002C16.9872 7.705 16.2421 8.60059 15.2988 8.7168V8.86719C16.4199 8.94923 17.2607 9.89942 17.2607 11.0889C17.2606 12.7362 15.7362 13.9053 13.583 13.9053C11.6827 13.9053 10.1925 12.873 10.1924 11.7041C10.1924 11.1846 10.5547 10.8154 11.0537 10.8154C11.3818 10.8154 11.6553 10.9727 11.9629 11.3555C12.3799 11.9159 12.92 12.2031 13.583 12.2031C14.4853 12.2031 15.0731 11.7313 15.0732 11C15.0732 10.2754 14.4785 9.7832 13.5898 9.7832H13.0361C12.5645 9.7832 12.2159 9.4208 12.2158 8.92188C12.2158 8.44336 12.5576 8.07422 13.0361 8.07422H13.5693C14.3075 8.07422 14.8544 7.60928 14.8545 6.97363C14.8545 6.33789 14.3213 5.90039 13.5557 5.90039C12.9678 5.90039 12.5029 6.16016 12.0859 6.71387C11.8399 7.03508 11.5527 7.17871 11.1973 7.17871C10.671 7.17871 10.295 6.82314 10.2949 6.31738C10.2949 5.18945 11.751 4.19824 13.5967 4.19824ZM8.0332 4.30078C8.75781 4.30078 9.16797 4.74512 9.16797 5.51758V12.5518C9.1679 13.3241 8.75776 13.7686 8.0332 13.7686C7.30865 13.7686 6.90534 13.3309 6.90527 12.5518V9.87207H3.48047V12.5518C3.4804 13.3241 3.07026 13.7686 2.3457 13.7686C1.62115 13.7686 1.21784 13.3309 1.21777 12.5518V5.51758C1.21777 4.73828 1.62109 4.30078 2.3457 4.30078C3.07031 4.30078 3.48047 4.74512 3.48047 5.51758V8.07422H6.90527V5.51758C6.90527 4.73828 7.30859 4.30078 8.0332 4.30078Z"/>
  </svg>`,

  "h4":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.6357 4.22559C15.7432 4.22559 16.4336 4.80664 16.4336 5.73633V10.3164H16.7275C17.2881 10.3164 17.6436 10.6787 17.6436 11.2256C17.6435 11.7655 17.3017 12.1006 16.7275 12.1006H16.4336V12.6611C16.4335 13.3515 16.0234 13.7891 15.374 13.7891C14.7247 13.7891 14.3282 13.3583 14.3281 12.6611V12.1006H11.04C10.2335 12.1006 9.76863 11.6766 9.76855 10.918C9.76855 10.5762 9.85064 10.3026 10.1104 9.74219C10.7666 8.42289 11.5733 7.0146 12.5713 5.54492C13.2549 4.56738 13.7812 4.22559 14.6357 4.22559ZM7.88965 4.30078C8.61426 4.30078 9.02441 4.74512 9.02441 5.51758V12.5518C9.02435 13.3241 8.6142 13.7686 7.88965 13.7686C7.1651 13.7686 6.76178 13.3309 6.76172 12.5518V9.87207H3.33691V12.5518C3.33685 13.3241 2.9267 13.7686 2.20215 13.7686C1.4776 13.7686 1.07428 13.3309 1.07422 12.5518V5.51758C1.07422 4.73828 1.47754 4.30078 2.20215 4.30078C2.92676 4.30078 3.33691 4.74512 3.33691 5.51758V8.07422H6.76172V5.51758C6.76172 4.73828 7.16504 4.30078 7.88965 4.30078ZM14.2188 6.07812C13.6035 7.02841 12.2158 9.48929 11.7988 10.2686V10.3164H14.3281V6.07812H14.2188Z"/>
  </svg>`,

  "h5":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.12207 4.30078C8.84668 4.30078 9.25684 4.74512 9.25684 5.51758V12.5518C9.25677 13.3241 8.84662 13.7686 8.12207 13.7686C7.39752 13.7686 6.9942 13.3309 6.99414 12.5518V9.87207H3.56934V12.5518C3.56927 13.3241 3.15912 13.7686 2.43457 13.7686C1.71002 13.7686 1.3067 13.3309 1.30664 12.5518V5.51758C1.30664 4.73828 1.70996 4.30078 2.43457 4.30078C3.15918 4.30078 3.56934 4.74512 3.56934 5.51758V8.07422H6.99414V5.51758C6.99414 4.73828 7.39746 4.30078 8.12207 4.30078ZM16.1191 4.30078C16.6934 4.30078 17.0762 4.63672 17.0762 5.16602C17.0762 5.69531 16.6934 6.03125 16.1191 6.03125H13.3457L12.9219 8.25586H13.0176C13.248 8.03711 13.6855 7.84375 14.2871 7.84375C15.9277 7.84375 17.1445 9.07422 17.1445 10.7832C17.1445 12.5605 15.8184 13.9053 13.7695 13.9053C11.9512 13.9053 10.6934 12.9277 10.5566 11.7178C10.5566 11.2021 10.9121 10.8193 11.4277 10.8193C11.8379 10.8193 12.1328 11.0244 12.3516 11.4893C12.625 12.0361 13.1133 12.2549 13.7285 12.2549C14.5488 12.2549 15.1367 11.6533 15.1367 10.7695C15.1367 9.92188 14.5625 9.31348 13.7559 9.31348C13.1953 9.31348 12.7578 9.56055 12.4629 10.0254C12.2168 10.3887 11.9355 10.5527 11.5527 10.5527C10.9648 10.5527 10.5684 10.1699 10.5684 9.55469C10.5684 9.42773 10.582 9.30762 10.6094 9.17383L11.2383 5.55273C11.3516 4.88379 11.7207 4.30078 12.6797 4.30078H16.1191Z"/>
  </svg>`,

  "h6":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.12207 4.30078C8.84668 4.30078 9.25684 4.74512 9.25684 5.51758V12.5518C9.25677 13.3241 8.84662 13.7686 8.12207 13.7686C7.39752 13.7686 6.9942 13.3309 6.99414 12.5518V9.87207H3.56934V12.5518C3.56927 13.3241 3.15912 13.7686 2.43457 13.7686C1.71002 13.7686 1.3067 13.3309 1.30664 12.5518V5.51758C1.30664 4.73828 1.70996 4.30078 2.43457 4.30078C3.15918 4.30078 3.56934 4.74512 3.56934 5.51758V8.07422H6.99414V5.51758C6.99414 4.73828 7.39746 4.30078 8.12207 4.30078ZM13.6719 13.9258C15.5518 13.9258 17.1445 12.37306 17.1445 10.35451V10.05763C17.1445 8.10744 16.6016 6.59574 15.5928 5.58694C14.8613 4.85544 13.8975 4.42384 12.7285 4.25294C12.4199 4.21194 12.1592 4.19824 11.8643 4.19824C11.2627 4.19824 10.8389 4.59474 10.8389 5.14164C10.8389 5.65724 11.2354 6.02054 11.7783 6.04784C12.1758 6.06834 12.4844 6.10944 12.7656 6.19144C13.5176 6.42384 14.0742 6.95314 14.3965 7.75974L14.4922 8.00584H14.3828C14.0605 7.56834 13.4863 7.25974 12.6523 7.25974C11.1406 7.25974 10.0674 8.42384 10.0674 10.02345V10.27736C10.0674 12.2549 11.4668 13.9258 13.6719 13.9258ZM13.5215 12.24123C12.6797 12.24123 12.0918 11.48244 12.0918 10.4131V10.1592C12.0918 9.26174 12.6523 8.71291 13.5352 8.71291C14.3965 8.71291 14.9844 9.27638 14.9844 10.1592V10.4131C14.9844 11.48244 14.3828 12.24123 13.5215 12.24123Z"/>
  </svg>`,

  "paragraph":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12C9.55228 12 10 12.4477 10 13C10 13.5523 9.55228 14 9 14H3C2.44772 14 2 13.5523 2 13C2 12.4477 2.44772 12 3 12H9ZM15 8C15.5523 8 16 8.44772 16 9C16 9.55228 15.5523 10 15 10H3C2.44772 10 2 9.55228 2 9C2 8.44772 2.44772 8 3 8H15ZM15 4C15.5523 4 16 4.44772 16 5C16 5.55228 15.5523 6 15 6H3C2.44772 6 2 5.55228 2 5C2 4.44772 2.44772 4 3 4H15Z"/>
  </svg>`,

  "clearFormatting":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.0607 2.07533C10.8417 1.29432 12.1078 1.2943 12.8888 2.07533L16.424 5.61049C17.205 6.39154 17.205 7.65854 16.424 8.43959L9.44937 15.4142C9.07435 15.7891 8.5656 16.0001 8.03531 16.0001H5.0148C4.55074 16.0001 4.10309 15.8385 3.74722 15.547L3.60074 15.4142L1.57534 13.3888C0.79431 12.6078 0.794336 11.3417 1.57534 10.5607L10.0607 2.07533ZM2.98941 11.9747L5.0148 14.0001H8.03531L9.71792 12.3165L6.18179 8.78139L2.98941 11.9747Z"/>
  </svg>`,

  "highlight":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.4564 14.4272C17.1356 15.5592 16.3204 17.0002 15.0003 17.0004C13.68 17.0004 12.864 15.5593 13.5433 14.4272L15.0003 12.0004L16.4564 14.4272ZM5.1214 1.70746C5.51192 1.31693 6.14494 1.31693 6.53546 1.70746L9.7171 4.8891L13.2532 8.42426C14.2295 9.40056 14.2295 10.9841 13.2532 11.9604L9.7171 15.4955C8.74078 16.4718 7.15822 16.4718 6.18195 15.4955L2.64679 11.9604C1.67048 10.9841 1.67048 9.40057 2.64679 8.42426L6.18195 4.8891C6.30299 4.76805 6.43323 4.66177 6.57062 4.57074L5.1214 3.12152C4.73091 2.73104 4.73099 2.09799 5.1214 1.70746ZM8.30304 6.30316C8.10776 6.10815 7.79119 6.10799 7.59601 6.30316L4.06085 9.83929L3.9964 9.91742C3.88661 10.0838 3.88645 10.3019 3.9964 10.4682L4.02277 10.5004H11.8763C12.0312 10.3043 12.02 10.0205 11.8392 9.83929L8.30304 6.30316Z"/>
  </svg>`,

  "link":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.8885 7.23091L13.9479 6.17155C14.5337 5.58576 14.5337 4.63602 13.9479 4.05023C13.3621 3.46444 12.4124 3.46444 11.8266 4.05023L8.29235 7.58446C7.9263 7.95051 7.90312 8.52994 8.2233 8.92271L8.36141 9.07463C8.68158 9.4674 8.65841 10.0468 8.29235 10.4129C7.90183 10.8034 7.26866 10.8034 6.87814 10.4129C5.70657 9.24131 5.70657 7.34182 6.87814 6.17025L10.4124 2.63602C11.7792 1.26918 13.9953 1.26918 15.3621 2.63602C16.729 4.00285 16.729 6.21893 15.3621 7.58576L14.3028 8.64512C13.9122 9.03564 13.2791 9.03564 12.8885 8.64512C12.498 8.2546 12.498 7.62143 12.8885 7.23091Z"/>
    <path d="M5.11038 10.7664L4.04843 11.8284C3.46264 12.4142 3.46264 13.3639 4.04842 13.9497C4.63421 14.5355 5.58396 14.5355 6.16975 13.9497L9.70657 10.4129C10.0726 10.0468 10.0958 9.46741 9.77563 9.07464L9.63752 8.92272C9.31734 8.52995 9.34052 7.95052 9.70657 7.58446C10.0971 7.19394 10.7303 7.19394 11.1208 7.58446C12.2924 8.75604 12.2924 10.6555 11.1208 11.8271L7.58396 15.3639C6.21712 16.7308 4.00105 16.7308 2.63421 15.3639C1.26738 13.9971 1.26738 11.781 2.63421 10.4142L3.69617 9.35223C4.08669 8.96171 4.71986 8.96171 5.11038 9.35223C5.5009 9.74275 5.5009 10.3759 5.11038 10.7664Z"/>
  </svg>`,

  "quote":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.96387 4.23438C6.8769 4.23438 8.42767 5.78522 8.42773 7.69824C8.42773 8.32925 8.25769 8.92015 7.96289 9.42969L7.96387 9.43066L5.11816 14.3584C4.77659 14.95 4.02038 15.153 3.42871 14.8115C2.83701 14.4699 2.63397 13.7128 2.97559 13.1211L4.16113 11.0674C2.63532 10.7052 1.5 9.33485 1.5 7.69824C1.50006 5.78524 3.05086 4.2344 4.96387 4.23438ZM13.0361 4.23438C14.9491 4.23449 16.4999 5.7853 16.5 7.69824C16.5 8.32921 16.3299 8.92017 16.0352 9.42969L16.0361 9.43066L13.1904 14.3584C12.8488 14.9501 12.0917 15.1531 11.5 14.8115C10.9085 14.4698 10.7063 13.7127 11.0479 13.1211L12.2324 11.0674C10.7069 10.7049 9.57227 9.33461 9.57227 7.69824C9.57233 5.78522 11.1231 4.23438 13.0361 4.23438Z"/>
  </svg>`,

  "code":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.29289 3.79295C6.68342 3.40243 7.31643 3.40243 7.70696 3.79295C8.09748 4.18348 8.09748 4.81649 7.70696 5.20702L3.91399 8.99999L7.70696 12.793C8.09748 13.1835 8.09748 13.8165 7.70696 14.207C7.31643 14.5975 6.68342 14.5975 6.29289 14.207L1.79289 9.70702C1.40237 9.31649 1.40237 8.68348 1.79289 8.29295L6.29289 3.79295Z"/>
    <path d="M11.707 3.79295C11.3164 3.40243 10.6834 3.40243 10.2929 3.79295C9.90237 4.18348 9.90237 4.81649 10.2929 5.20702L14.0859 8.99999L10.2929 12.793C9.90237 13.1835 9.90237 13.8165 10.2929 14.207C10.6834 14.5975 11.3164 14.5975 11.707 14.207L16.207 9.70702C16.5975 9.31649 16.5975 8.68348 16.207 8.29295L11.707 3.79295Z"/>
  </svg>`,

  "ul":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12.5C3.82843 12.5 4.5 13.1716 4.5 14C4.5 14.8284 3.82843 15.5 3 15.5C2.17157 15.5 1.5 14.8284 1.5 14C1.5 13.1716 2.17157 12.5 3 12.5ZM15.5 13C16.0523 13 16.5 13.4477 16.5 14C16.5 14.5523 16.0523 15 15.5 15H7C6.44772 15 6 14.5523 6 14C6 13.4477 6.44772 13 7 13H15.5ZM3 7.5C3.82843 7.5 4.5 8.17157 4.5 9C4.5 9.82843 3.82843 10.5 3 10.5C2.17157 10.5 1.5 9.82843 1.5 9C1.5 8.17157 2.17157 7.5 3 7.5ZM15.5 8C16.0523 8 16.5 8.44772 16.5 9C16.5 9.55228 16.0523 10 15.5 10H7C6.44772 10 6 9.55228 6 9C6 8.44772 6.44772 8 7 8H15.5ZM3 2.5C3.82843 2.5 4.5 3.17157 4.5 4C4.5 4.82843 3.82843 5.5 3 5.5C2.17157 5.5 1.5 4.82843 1.5 4C1.5 3.17157 2.17157 2.5 3 2.5ZM15.5 3C16.0523 3 16.5 3.44772 16.5 4C16.5 4.55228 16.0523 5 15.5 5H7C6.44772 5 6 4.55228 6 4C6 3.44772 6.44772 3 7 3H15.5Z"/>
  </svg>`,

  "ol":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 13C16.0523 13 16.5 13.4477 16.5 14C16.5 14.5523 16.0523 15 15.5 15H7C6.44772 15 6 14.5523 6 14C6 13.4477 6.44772 13 7 13H15.5ZM15.5 8C16.0523 8 16.5 8.44772 16.5 9C16.5 9.55228 16.0523 10 15.5 10H7C6.44772 10 6 9.55228 6 9C6 8.44772 6.44772 8 7 8H15.5ZM15.5 3C16.0523 3 16.5 3.44772 16.5 4C16.5 4.55228 16.0523 5 15.5 5H7C6.44772 5 6 4.55228 6 4C6 3.44772 6.44772 3 7 3H15.5Z"/>
    <path d="M2.98657 16.0967C2.68042 16.0967 2.41187 16.0465 2.18091 15.9463C1.95174 15.846 1.77002 15.7046 1.63574 15.522C1.50146 15.3376 1.42448 15.1227 1.40479 14.8774L1.4021 14.8452H2.34204L2.34741 14.8748C2.35815 14.9589 2.39038 15.035 2.44409 15.103C2.49959 15.1711 2.5721 15.2248 2.66162 15.2642C2.75293 15.3035 2.86035 15.3232 2.98389 15.3232C3.10563 15.3232 3.21037 15.3027 3.2981 15.2615C3.38761 15.2185 3.45654 15.1603 3.50488 15.0869C3.55322 15.0135 3.57739 14.9294 3.57739 14.8345V14.8291C3.57739 14.6715 3.51921 14.5516 3.40283 14.4692C3.28646 14.3869 3.12085 14.3457 2.90601 14.3457H2.48706V13.677H2.90063C3.02775 13.677 3.13607 13.6582 3.22559 13.6206C3.31689 13.583 3.38672 13.5302 3.43506 13.4622C3.48519 13.3941 3.51025 13.3153 3.51025 13.2258V13.2205C3.51025 13.1256 3.48877 13.0441 3.4458 12.9761C3.40462 12.9062 3.34375 12.8534 3.26318 12.8176C3.18441 12.78 3.08952 12.7612 2.97852 12.7612C2.86572 12.7612 2.76636 12.7809 2.68042 12.8203C2.59627 12.8579 2.52913 12.9125 2.479 12.9841C2.43066 13.054 2.40112 13.1363 2.39038 13.2312L2.3877 13.2581H1.49341L1.49609 13.2205C1.514 12.977 1.58561 12.7666 1.71094 12.5894C1.83805 12.4103 2.00903 12.2725 2.22388 12.1758C2.44051 12.0773 2.69206 12.0281 2.97852 12.0281C3.27393 12.0281 3.52995 12.0728 3.74658 12.1624C3.96322 12.2501 4.13062 12.3727 4.24878 12.5303C4.36694 12.6878 4.42603 12.8722 4.42603 13.0835V13.0889C4.42603 13.2518 4.38932 13.3941 4.31592 13.5159C4.2443 13.6358 4.14762 13.7343 4.02588 13.8113C3.90592 13.8883 3.77254 13.942 3.62573 13.9724V13.9912C3.91756 14.0199 4.14941 14.1121 4.32129 14.2678C4.49316 14.4236 4.5791 14.6295 4.5791 14.8855V14.8909C4.5791 15.1344 4.51375 15.3474 4.38306 15.53C4.25236 15.7109 4.06795 15.8505 3.82983 15.949C3.59172 16.0474 3.31063 16.0967 2.98657 16.0967Z"/>
    <path d="M1.54443 11V10.342L2.76099 9.20874C2.95076 9.03507 3.09757 8.89274 3.20142 8.78174C3.30705 8.66895 3.37956 8.57316 3.41895 8.49438C3.46012 8.41382 3.48071 8.33415 3.48071 8.25537V8.24463C3.48071 8.14795 3.46012 8.0638 3.41895 7.99219C3.37777 7.92057 3.31779 7.86507 3.23901 7.82568C3.16024 7.7863 3.06714 7.7666 2.95972 7.7666C2.84692 7.7666 2.74756 7.78988 2.66162 7.83643C2.57747 7.88298 2.51123 7.94743 2.46289 8.02979C2.41455 8.11035 2.39038 8.20345 2.39038 8.30908V8.33057L1.48804 8.32788V8.31177C1.48804 8.05396 1.5507 7.82837 1.67603 7.63501C1.80314 7.44165 1.97949 7.29126 2.20508 7.18384C2.43245 7.07463 2.69653 7.02002 2.99731 7.02002C3.28556 7.02002 3.53711 7.06836 3.75195 7.16504C3.96859 7.25993 4.13688 7.39331 4.25684 7.56519C4.37858 7.73706 4.43945 7.93758 4.43945 8.16675V8.18018C4.43945 8.3252 4.40902 8.46932 4.34814 8.61255C4.28727 8.75578 4.18701 8.90885 4.04736 9.07178C3.90771 9.23291 3.71883 9.41642 3.48071 9.62231L2.58374 10.4092L2.85498 9.98486V10.4092L2.58374 10.2319H4.49048V11H1.54443Z"/>
    <path d="M2.84155 6V3.01367H2.79053L1.85596 3.64478V2.79614L2.84155 2.12476H3.82715V6H2.84155Z"/>
  </svg>`,

  "image":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2C15.6569 2 17 3.34315 17 5V13C17 14.6569 15.6569 16 14 16H4C2.34315 16 1 14.6569 1 13V5C1 3.34315 2.34315 2 4 2H14ZM3.06348 13.3496C3.2053 13.7294 3.57078 14 4 14H13.5859L11 11.4141L9.70703 12.707C9.31651 13.0976 8.68349 13.0976 8.29297 12.707C7.90244 12.3165 7.90244 11.6835 8.29297 11.293L8.58594 11L7 9.41406L3.06348 13.3496ZM4 4C3.44772 4 3 4.44772 3 5V10.5859L6.29297 7.29297L6.36914 7.22461C6.76191 6.90427 7.34092 6.92686 7.70703 7.29297L10 9.58594L10.293 9.29297L10.3691 9.22461C10.7619 8.90427 11.3409 8.92686 11.707 9.29297L15 12.5859V5C15 4.44772 14.5523 4 14 4H4ZM12.5 5C13.3284 5 14 5.67157 14 6.5C14 7.32843 13.3284 8 12.5 8C11.6716 8 11 7.32843 11 6.5C11 5.67157 11.6716 5 12.5 5Z"/>
  </svg>`,

  "attachment":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 13.5V6C13 4.067 11.433 2.5 9.5 2.5C7.567 2.5 6 4.067 6 6V13.5C6 14.6046 6.89543 15.5 8 15.5H8.23047C9.20759 15.5 10 14.7076 10 13.7305V7C10 6.72386 9.77614 6.5 9.5 6.5C9.22386 6.5 9 6.72386 9 7V12.5C9 13.0523 8.55228 13.5 8 13.5C7.44772 13.5 7 13.0523 7 12.5V7C7 5.61929 8.11929 4.5 9.5 4.5C10.8807 4.5 12 5.61929 12 7V13.7305C12 15.8122 10.3122 17.5 8.23047 17.5H8C5.79086 17.5 4 15.7091 4 13.5V6C4 2.96243 6.46243 0.5 9.5 0.5C12.5376 0.5 15 2.96243 15 6V13.5C15 14.0523 14.5523 14.5 14 14.5C13.4477 14.5 13 14.0523 13 13.5Z"/>
  </svg>`,

  "table":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 1C16.1046 1 17 1.89543 17 3V15C17 16.1046 16.1046 17 15 17H3C1.89543 17 1 16.1046 1 15V3C1 1.89543 1.89543 1 3 1H15ZM3 15H8V10H3V15ZM10 10V15H15V10H10ZM10 8H15V3H10V8ZM3 8H8V3H3V8Z"/>
  </svg>`,

  "hr":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.75 12C13.1642 12 13.5 12.3358 13.5 12.75V14.25C13.5 14.6642 13.1642 15 12.75 15H5.25C4.83579 15 4.5 14.6642 4.5 14.25V12.75C4.5 12.3358 4.83579 12 5.25 12H12.75ZM15.4863 8C16.0461 8 16.5 8.44771 16.5 9C16.5 9.55229 16.0461 10 15.4863 10H2.51367C1.95392 10 1.5 9.55229 1.5 9C1.5 8.44771 1.95392 8 2.51367 8H15.4863ZM12.75 3C13.1642 3 13.5 3.33579 13.5 3.75V5.25C13.5 5.66421 13.1642 6 12.75 6H5.25C4.83579 6 4.5 5.66421 4.5 5.25V3.75C4.5 3.33579 4.83579 3 5.25 3H12.75Z"/>
  </svg>`,

  "undo":
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.36612 5.36612C8.85427 4.87796 9.64554 4.87796 10.1337 5.36612C10.6218 5.85428 10.6218 6.64557 10.1337 7.13369L7.26748 9.9999H15.2499C18.1494 9.99996 20.4999 12.3504 20.4999 15.2499V19.2499C20.4999 19.9402 19.9402 20.4999 19.2499 20.4999C18.5596 20.4999 18 19.9402 17.9999 19.2499V15.2499C17.9999 13.7312 16.7686 12.5 15.2499 12.4999H7.26748L10.1337 15.3661C10.6218 15.8543 10.6218 16.6456 10.1337 17.1337C9.64557 17.6218 8.85428 17.6218 8.36612 17.1337L3.36612 12.1337C2.87796 11.6455 2.87796 10.8543 3.36612 10.3661L8.36612 5.36612Z"/>
  </svg>`,

  "redo":
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.6338 5.1163C15.1456 4.62814 14.3543 4.62814 13.8662 5.1163C13.3781 5.60446 13.3781 6.39575 13.8662 6.88388L16.7324 9.75009H8.74997C5.85052 9.75014 3.49997 12.1006 3.49997 15.0001V19.0001C3.50002 19.6904 4.05969 20.25 4.74997 20.2501C5.4403 20.2501 5.99992 19.6904 5.99997 19.0001V15.0001C5.99997 13.4813 7.23123 12.2501 8.74997 12.2501H16.7324L13.8662 15.1163C13.3781 15.6045 13.3781 16.3958 13.8662 16.8839C14.3543 17.372 15.1456 17.3719 15.6338 16.8839L20.6338 11.8839C21.1219 11.3957 21.1219 10.6045 20.6338 10.1163L15.6338 5.1163Z" />
  </svg>`,

  "overflow":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6.75C4.24264 6.75 5.25 7.75736 5.25 9C5.25 10.2426 4.24264 11.25 3 11.25C1.75736 11.25 0.75 10.2426 0.75 9C0.75 7.75736 1.75736 6.75 3 6.75ZM9 6.75C10.2426 6.75 11.25 7.75736 11.25 9C11.25 10.2426 10.2426 11.25 9 11.25C7.75736 11.25 6.75 10.2426 6.75 9C6.75 7.75736 7.75736 6.75 9 6.75ZM15 6.75C16.2426 6.75 17.25 7.75736 17.25 9C17.25 10.2426 16.2426 11.25 15 11.25C13.7574 11.25 12.75 10.2426 12.75 9C12.75 7.75736 13.7574 6.75 15 6.75Z"/>
  </svg>`
};

class LexicalToolbarElement extends HTMLElement {
  static observedAttributes = [ "connected" ]
  #listeners = new ListenerBin()
  #refreshToolbarAF = null

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "toolbar";

    this.#createEditorPromise();
  }

  connectedCallback() {
    this.requestOverflowRefresh();
    this.setAttribute("role", "toolbar");
    this.#installResizeObserver();
  }

  disconnectedCallback() {
    this.dispose();
  }

  dispose() {
    this.#listeners.dispose();

    cancelAnimationFrame(this.#refreshToolbarAF);

    this.editorElement = null;
    this.editor = null;
    this.selection = null;
    this.#refreshToolbarAF = null;

    this.#createEditorPromise();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect());
    }
  }

  configure(config) {
    if (typeof config === "object" && config !== null) {
      for (const [ button, value ] of Object.entries(config)) {
        this.setAttribute(`data-${button}`, value);
      }
    }
  }

  setEditor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
    this.selection = editorElement.selection;
    this.#bindButtons();
    this.#bindHotkeys();
    this.#resetTabIndexValues();
    this.#monitorSelectionChanges();
    this.#monitorHistoryChanges();
    this.requestOverflowRefresh();
    this.#bindFocusListeners();

    this.resolveEditorPromise(editorElement);

    this.toggleAttribute("connected", true);
  }

  async getEditorElement() {
    return this.editorElement || await this.editorPromise
  }

  requestOverflowRefresh() {
    if (this.#refreshToolbarAF != null) return

    this.#refreshToolbarAF = requestAnimationFrame(() => {
      this.#refreshOverflow();
      this.#refreshToolbarAF = null;
    });
  }

  closeDropdowns({ except } = {}) {
    this.#dropdowns.forEach((dropdown) => {
      if (dropdown !== except) {
        dropdown.close({ focusEditor: false });
      }
    });
  }

  #reconnect() {
    this.disconnectedCallback();
    this.connectedCallback();
  }

  async #createEditorPromise() {
    this.editorPromise = new Promise((resolve) => {
      this.resolveEditorPromise = resolve;
    });

    this.editorElement = await this.editorPromise;
  }

  #installResizeObserver() {
    const resizeObserver = new ResizeObserver(() => this.requestOverflowRefresh());
    resizeObserver.observe(this);
    this.#listeners.track(() => resizeObserver.disconnect());
  }

  #bindButtons() {
    this.#listeners.track(registerEventListener(this, "click", this.#handleButtonClicked));
  }

  #handleButtonClicked = (event) => {
    this.#handleTargetClicked(event, "[data-command]", this.#dispatchButtonCommand.bind(this));
  }

  #handleTargetClicked(event, selector, callback) {
    const button = event.target.closest(selector);
    if (button) {
      callback(event, button);
    }
  }

  #dispatchButtonCommand(event, { dataset: { command, payload } }) {
    const isKeyboard = event instanceof PointerEvent && event.pointerId === -1;

    this.editor.update(() => {
      this.editor.dispatchCommand(command, payload);
    }, { tag: isKeyboard ? SKIP_DOM_SELECTION_TAG : undefined });

    if (!isKeyboard) this.editor.focus();
  }

  #bindHotkeys() {
    this.#listeners.track(registerEventListener(this.editorElement, "keydown", this.#handleHotkey));
  }

  #handleHotkey = (event) => {
    const buttons = this.querySelectorAll("[data-hotkey]");
    buttons.forEach((button) => {
      const hotkeys = button.dataset.hotkey.toLowerCase().split(/\s+/);
      if (hotkeys.includes(this.#keyCombinationFor(event))) {
        event.preventDefault();
        event.stopPropagation();
        button.click();
      }
    });
  }

  #keyCombinationFor(event) {
    const pressedKey = event.key.toLowerCase();
    const modifiers = [
      event.ctrlKey ? "ctrl" : null,
      event.metaKey ? "cmd" : null,
      event.altKey ? "alt" : null,
      event.shiftKey ? "shift" : null,
    ].filter(Boolean);

    return [ ...modifiers, pressedKey ].join("+")
  }

  #bindFocusListeners() {
    this.#listeners.track(
      registerEventListener(this.editorElement, "lexxy:focus", this.#handleEditorFocus),
      registerEventListener(this.editorElement, "lexxy:blur", this.#handleEditorBlur),
      registerEventListener(this, "keydown", this.#handleKeydown)
    );
  }

  #handleEditorFocus = () => {
    const firstVisible = this.#buttons.find(isActiveAndVisible);
    if (firstVisible) firstVisible.tabIndex = 0;
  }

  #handleEditorBlur = () => {
    this.#resetTabIndexValues();
  }

  #handleKeydown = (event) => {
    handleRollingTabIndex(this.#buttons, event);
  }

  #resetTabIndexValues() {
    this.#buttons.forEach((button) => {
      button.tabIndex = -1;
    });
  }

  #monitorSelectionChanges() {
    this.#listeners.track(this.editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        this.#updateButtonStates();
        this.closeDropdowns();
      });
    }));
  }

  #monitorHistoryChanges() {
    this.#listeners.track(
      this.editor.registerCommand(CAN_UNDO_COMMAND, (enabled) => { this.#setButtonDisabled("undo", !enabled); }, COMMAND_PRIORITY_LOW),
      this.editor.registerCommand(CAN_REDO_COMMAND, (enabled) => { this.#setButtonDisabled("redo", !enabled); }, COMMAND_PRIORITY_LOW),
    );
  }

  #updateButtonStates() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode();
    if (!anchorNode.getParent()) { return }

    const { isBold, isItalic, isStrikethrough, isUnderline, isHighlight, isInLink, isInQuote, isInHeading,
      headingTag, isInCode, isInList, listType, isInTable } = this.selection.getFormat();

    this.#setButtonPressed("bold", isBold);
    this.#setButtonPressed("italic", isItalic);
    this.#setButtonPressed("strikethrough", isStrikethrough);
    this.#setButtonPressed("underline", isUnderline);

    this.#setButtonPressed("format", isInHeading);
    this.#setButtonPressed("paragraph", !isInHeading);

    this.querySelector("lexxy-heading-dropdown")
      ?.updateActiveHeading(headingTag);

    this.#setButtonPressed("lists", isInList);
    this.#setButtonPressed("unordered-list", isInList && listType === "bullet");
    this.#setButtonPressed("ordered-list", isInList && listType === "number");

    this.#setButtonPressed("highlight", isHighlight);
    this.#setButtonPressed("link", isInLink);
    this.#setButtonPressed("quote", isInQuote);
    this.#setButtonPressed("code", isInCode);

    this.#setButtonPressed("table", isInTable);
  }

  #setButtonPressed(name, isPressed) {
    const button = this.querySelector(`[name="${name}"]`);
    if (button) {
      const next = isPressed.toString();
      if (button.getAttribute("aria-pressed") !== next) {
        button.setAttribute("aria-pressed", next);
      }
    }
  }

  #setButtonDisabled(name, isDisabled) {
    const button = this.querySelector(`[name="${name}"]`);
    if (button) {
      if (button.disabled !== isDisabled) {
        button.disabled = isDisabled;
      }
      const next = isDisabled.toString();
      if (button.getAttribute("aria-disabled") !== next) {
        button.setAttribute("aria-disabled", next);
      }
    }
  }

  #refreshOverflow() {
    this.#hideOverflowMenuButton();
    this.#resetToolbarOverflow();
    this.#reindexToolbarItems();
    this.#compactMenu();

    const isOverflowing = this.#overflowMenuDropdown.children.length > 0;

    this.toggleAttribute("overflowing", isOverflowing);
    this.#setOverflowMenuNonce();
    this.#showOverflowMenuButton(isOverflowing);
  }

  #resetToolbarOverflow() {
    const items = Array.from(this.#overflowMenuDropdown.children);
    items.sort((a, b) => this.#itemPosition(b) - this.#itemPosition(a));

    for (const item of items) {
      const nextItem = this.querySelector(`[data-position="${this.#itemPosition(item) + 1}"]`) ?? this.#overflowMenuButton;
      item.removeAttribute("role");
      this.insertBefore(item, nextItem);
    }
  }

  #showOverflowMenuButton(show = true) {
    this.#overflowMenuDropdown.toggleAttribute("disabled", !show);
    this.#overflowMenuButton.style.display = show ? "block" : "none";
  }

  #hideOverflowMenuButton() {
    this.#showOverflowMenuButton(false);
  }

  #itemPosition(item) {
    return parseInt(item.dataset.position ?? "999")
  }

  #reindexToolbarItems() {
    this.#toolbarItems.forEach((item, index) => {
      item.dataset.position = index;
    });
  }

  #compactMenu() {
    const overflowWidth = this.#getOverflowWidth();

    if (overflowWidth > 0) {
      this.#showOverflowMenuButton();
      const gap = this.#getToolbarGap();
      const spaceForOverflow = gap + this.#overflowMenuButton.offsetWidth;
      this.#reclaimWidth(overflowWidth + spaceForOverflow, { gap });
    }
  }

  #getOverflowWidth() {
    return this.scrollWidth - this.clientWidth
  }

  #reclaimWidth(overflowWidth, { gap }) {
    const buttons = this.#overflowableButtons;
    const overflowButtons = [];
    let recoveredWidth = 0;

    while (recoveredWidth < overflowWidth && buttons.length) {
      const button = buttons.pop();

      overflowButtons.push(button);
      button.role = "menuitem";
      recoveredWidth += button.offsetWidth + gap;
    }

    this.#overflowMenuDropdown.append(...overflowButtons.reverse());
  }

  #setOverflowMenuNonce() {
    this.#overflowMenuButton.setAttribute("nonce", getNonce());
  }

  #getToolbarGap() {
    return parseFloat(window.getComputedStyle(this).columnGap) || 0
  }

  get #dropdowns() {
    return this.querySelectorAll(":scope .lexxy-editor__toolbar-dropdown")
  }

  get #overflowMenuButton() {
    return this.querySelector(".lexxy-editor__toolbar-overflow")
  }

  get #overflowMenuDropdown() {
    return this.#overflowMenuButton?.querySelector(":scope > [data-dropdown-panel]")
  }

  get #overflowableButtons() {
    return Array.from(this.querySelectorAll(":scope > button:not([data-prevent-overflow])"))
  }

  get #buttons() {
    return Array.from(this.querySelectorAll(":scope button"))
  }

  get #toolbarItems() {
    return Array.from(this.querySelectorAll(":scope > *:not(.lexxy-editor__toolbar-overflow)"))
  }

  static get defaultTemplate() {
    const linkInputId = generateDomId("lexxy-link-url");

    return `
      <button class="lexxy-editor__toolbar-button" type="button" name="image" data-command="uploadImage" data-prevent-overflow="true" title="Add images and video">
        ${ToolbarIcons.image}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="file" data-command="uploadFile" title="Upload files">
        ${ToolbarIcons.attachment}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="bold" data-command="bold" title="Bold">
        ${ToolbarIcons.bold}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="italic" data-command="italic" title="Italic">
      ${ToolbarIcons.italic}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="strikethrough" data-command="strikethrough" title="Strikethrough">
        ${ToolbarIcons.strikethrough}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="underline" data-command="underline" title="Underline">
        ${ToolbarIcons.underline}
      </button>

      <lexxy-toolbar-dropdown class="lexxy-editor__toolbar-dropdown">
        <button data-dropdown-trigger class="lexxy-editor__toolbar-button lexxy-editor__toolbar-button--chevron" type="button" name="format" title="Text formatting" aria-haspopup="menu" aria-expanded="false">
          ${ToolbarIcons.heading}
        </button>
        <div data-dropdown-panel role="menu" class="lexxy-editor__toolbar-dropdown-list" hidden>
          <button type="button" name="paragraph" data-command="setFormatParagraph" title="Paragraph" role="menuitem">
            ${ToolbarIcons.paragraph} <span>Normal</span>
          </button>
          <lexxy-heading-dropdown>
            <div class="lexxy-heading-options"></div>
          </lexxy-heading-dropdown>
          <div class="lexxy-editor__toolbar-separator" role="separator"></div>
          <button type="button" name="clear-formatting" data-command="clearFormatting" title="Clear formatting" role="menuitem">
            ${ToolbarIcons.clearFormatting} <span>Clear formatting</span>
          </button>
        </div>
      </lexxy-toolbar-dropdown>

      <lexxy-highlight-dropdown class="lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-dropdown--highlight">
        <button data-dropdown-trigger class="lexxy-editor__toolbar-button lexxy-editor__toolbar-button--chevron" type="button" name="highlight" title="Color highlight" aria-haspopup="menu" aria-expanded="false">
          ${ToolbarIcons.highlight}
        </button>
        <div data-dropdown-panel role="menu" hidden>
          <div class="lexxy-highlight-colors"></div>
          <button data-command="removeHighlight" type="button" class="lexxy-editor__toolbar-button lexxy-editor__toolbar-dropdown-reset" role="menuitem">Remove all coloring</button>
        </div>
      </lexxy-highlight-dropdown>

      <lexxy-link-dropdown class="lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-dropdown--link">
        <button data-dropdown-trigger class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="link" title="Link" data-hotkey="cmd+k ctrl+k" aria-haspopup="dialog" aria-expanded="false">
          ${ToolbarIcons.link}
        </button>
        <div data-dropdown-panel role="dialog" aria-label="Link" hidden>
          <input type="url" placeholder="Enter a URL…" class="input" id="${linkInputId}">
          <div class="lexxy-editor__toolbar-dropdown-actions">
            <button type="button" class="lexxy-editor__toolbar-button" value="link">Link</button>
            <button type="button" class="lexxy-editor__toolbar-button" value="unlink">Unlink</button>
          </div>
        </div>
      </lexxy-link-dropdown>

      <button class="lexxy-editor__toolbar-button" type="button" name="quote" data-command="insertQuoteBlock" title="Quote">
        ${ToolbarIcons.quote}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="code" data-command="insertCodeBlock" title="Code">
        ${ToolbarIcons.code}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="unordered-list" data-command="insertUnorderedList" title="Bullet list">
        ${ToolbarIcons.ul}
      </button>
      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="ordered-list" data-command="insertOrderedList" title="Numbered list">
        ${ToolbarIcons.ol}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="table" data-command="insertTable" title="Insert a table">
        ${ToolbarIcons.table}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="divider" data-command="insertHorizontalDivider" title="Insert a divider">
        ${ToolbarIcons.hr}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-button--push-right" type="button" name="undo" data-command="undo" title="Undo" disabled aria-disabled="true">
        ${ToolbarIcons.undo}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="redo" data-command="redo" title="Redo" disabled aria-disabled="true">
        ${ToolbarIcons.redo}
      </button>

      <lexxy-toolbar-dropdown class="lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-button--push-right lexxy-editor__toolbar-overflow">
        <button data-dropdown-trigger class="lexxy-editor__toolbar-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Show more toolbar buttons">
          ${ToolbarIcons.overflow}
        </button>
        <div data-dropdown-panel role="menu" class="lexxy-editor__toolbar-overflow-menu" aria-label="More toolbar buttons" hidden></div>
      </lexxy-toolbar-dropdown>
    `
  }
}

function debounce(fn, wait) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  }
}

function debounceAsync(fn, wait) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);

    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }, wait);
    })
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextFrame() {
  return new Promise(requestAnimationFrame)
}

class ToolbarDropdown extends HTMLElement {
  #listeners = new ListenerBin()

  connectedCallback() {
    this.#onToolbarEditor(() => {
      this.#registerListeners();
      this.editorReady();
    });
  }

  disconnectedCallback() {
    this.#listeners.dispose();
  }

  editorReady() {}
  onOpen() {}
  onClose() {}

  get trigger() {
    return this.querySelector(":scope > [data-dropdown-trigger]")
  }

  get panel() {
    return this.querySelector(":scope > [data-dropdown-panel]")
  }

  get toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get editorElement() {
    return this.toolbar?.editorElement
  }

  get editor() {
    return this.toolbar?.editor
  }

  get isOpen() {
    return this.panel.hidden === false
  }

  get isClosed() {
    return !this.isOpen
  }

  track(...listeners) {
    this.#listeners.track(...listeners);
  }

  open() {
    if (this.isOpen) return
    this.trigger.setAttribute("aria-expanded", "true");
    this.panel.hidden = false;
    this.onOpen();
    this.#focusFirstInteractive();
  }

  close({ focusEditor = true } = {}) {
    if (focusEditor) this.editor?.focus();

    if (this.isClosed) return
    this.trigger.setAttribute("aria-expanded", "false");
    this.panel.hidden = true;
    this.onClose();
  }

  #registerListeners() {
    this.#listeners.track(
      registerEventListener(this, "keydown", this.#handleKeyDown),
      registerEventListener(this.trigger, "click", this.#handleTriggerClick)
    );
  }

  #handleTriggerClick = () => {
    if (this.isOpen) {
      this.close({ focusEditor: false });
    } else {
      this.toolbar?.closeDropdowns({ except: this });
      this.open();
    }
  }

  async #onToolbarEditor(callback) {
    if (!this.toolbar) return

    await this.toolbar.getEditorElement();
    if (this.isConnected && this.toolbar) callback();
  }

  #handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      this.close();
    }
  }

  async #focusFirstInteractive() {
    this.#interactiveElements[0]?.focus();
    await this.#resetTabIndexValues();
  }

  async #resetTabIndexValues() {
    await nextFrame();
    this.#buttons.forEach((element, index) => {
      element.setAttribute("tabindex", index === 0 ? 0 : "-1");
    });
  }

  get #interactiveElements() {
    return Array.from(this.panel.querySelectorAll("button, input"))
  }

  get #buttons() {
    return Array.from(this.panel.querySelectorAll("button"))
  }
}

const HEADING_BUTTON_SELECTOR = "button.lexxy-heading-button";

const HEADING_PRESETS = [
  { label: "Large Heading", name: "heading-large", command: "setFormatHeadingLarge" },
  { label: "Medium Heading", name: "heading-medium", command: "setFormatHeadingMedium" },
  { label: "Small Heading", name: "heading-small", command: "setFormatHeadingSmall" }
];

class HeadingDropdown extends HTMLElement {
  static labelFor(tag, index) {
    if (index < HEADING_PRESETS.length) {
      return HEADING_PRESETS[index].label
    } else {
      const level = tag.match(/^h(\d+)$/)?.[1];
      if (level) {
        return `Heading ${level}`
      } else {
        return tag.toUpperCase()
      }
    }
  }

  static nameFor(tag, index) {
    if (index < HEADING_PRESETS.length) {
      return HEADING_PRESETS[index].name
    } else {
      const level = tag.match(/^h(\d+)$/)?.[1];
      if (level) {
        return `heading-${level}`
      } else {
        return `heading-${tag}`
      }
    }
  }

  static commandFor(index) {
    if (index < HEADING_PRESETS.length) {
      return HEADING_PRESETS[index].command
    } else {
      return "applyHeadingFormat"
    }
  }

  #listeners = new ListenerBin()

  connectedCallback() {
    this.style.display = "contents";

    this.#onToolbarEditor(() => {
      this.#buttonContainer.style.display = "contents";
      this.#setUpButtons();
      this.#registerButtonHandlers();
      this.#syncActiveHeading();
    });
  }

  disconnectedCallback() {
    this.#listeners.dispose();
  }

  updateActiveHeading(tag) {
    this.#headingButtons.forEach(button => {
      const next = (button.dataset.heading === tag).toString();
      if (button.getAttribute("aria-pressed") !== next) {
        button.setAttribute("aria-pressed", next);
      }
    });
  }

  get #toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get #editorElement() {
    return this.#toolbar?.editorElement
  }

  get #editor() {
    return this.#toolbar?.editor
  }

  async #onToolbarEditor(callback) {
    const toolbar = this.#toolbar;
    if (!toolbar) return

    await toolbar.getEditorElement();
    if (this.isConnected && this.#toolbar) callback();
  }

  #setUpButtons() {
    this.#buttonContainer.innerHTML = "";

    this.#configuredHeadings.forEach((tag, index) => {
      this.#buttonContainer.appendChild(this.#createButton(tag, index));
    });
  }

  #createButton(tag, index) {
    const label = HeadingDropdown.labelFor(tag, index);
    const name = HeadingDropdown.nameFor(tag, index);
    const icon = ToolbarIcons[tag] || "";

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.heading = tag;
    button.dataset.command = HeadingDropdown.commandFor(index);
    button.classList.add("lexxy-heading-button");
    button.name = name;
    button.title = label;
    button.setAttribute("role", "menuitem");
    button.innerHTML = `${icon} <span>${label}</span>`;
    return button
  }

  #registerButtonHandlers() {
    this.#headingButtons.forEach(button => {
      this.#listeners.track(registerEventListener(button, "click", (event) => {
        if (!this.#editor) return

        event.preventDefault();
        this.#editor.dispatchCommand(button.dataset.command, button.dataset.heading);
        this.#editor.focus();
      }));
    });
  }

  #syncActiveHeading() {
    const { headingTag } = this.#editor.read(() => this.#editorElement.selection.getFormat());
    this.updateActiveHeading(headingTag ?? null);
  }

  get #configuredHeadings() {
    return this.#editorElement.config.get("headings")
  }

  get #buttonContainer() {
    return this.querySelector(".lexxy-heading-options")
  }

  get #headingButtons() {
    return Array.from(this.querySelectorAll(HEADING_BUTTON_SELECTOR))
  }
}

const APPLY_HIGHLIGHT_SELECTOR = "button.lexxy-highlight-button";
const REMOVE_HIGHLIGHT_SELECTOR = "[data-command='removeHighlight']";

// Use Symbol instead of null since $getSelectionStyleValueForProperty
// responds differently for backward selections if null is the default
// see https://github.com/facebook/lexical/issues/8013
const NO_STYLE = Symbol("no_style");

class HighlightDropdown extends ToolbarDropdown {
  editorReady() {
    this.#setUpButtons();
    this.#registerButtonHandlers();
  }

  onOpen() {
    this.editor.getEditorState().read(() => {
      this.#updateColorButtonStates($getSelection());
    });
  }

  #registerButtonHandlers() {
    this.#colorButtons.forEach(button => {
      this.track(registerEventListener(button, "click", this.#handleColorButtonClick));
    });
  }

  #setUpButtons() {
    this.#buttonContainer.innerHTML = "";

    const colorGroups = this.editorElement.config.get("highlight.buttons");

    this.#populateButtonGroup("color", colorGroups.color);
    this.#populateButtonGroup("background-color", colorGroups["background-color"]);

    const maxNumberOfColors = Math.max(colorGroups.color.length, colorGroups["background-color"].length);
    this.panel.style.setProperty("--max-colors", maxNumberOfColors);
  }

  #populateButtonGroup(attribute, values) {
    values.forEach((value, index) => {
      this.#buttonContainer.appendChild(this.#createButton(attribute, value, index));
    });
  }

  #createButton(attribute, value, index) {
    return createElement("button", {
      type: "button",
      dataset: { value, style: attribute },
      style: `${attribute}: ${value}`,
      class: "lexxy-editor__toolbar-button lexxy-highlight-button",
      name: `${attribute}-${index}`,
      role: "menuitem"
    })
  }

  #handleColorButtonClick = (event) => {
    event.preventDefault();

    const button = event.target.closest(APPLY_HIGHLIGHT_SELECTOR);
    if (!button) return

    const { style, value } = button.dataset;

    this.editor.dispatchCommand("toggleHighlight", { [style]: value });
    this.close();
  }

  #updateColorButtonStates(selection) {
    if (!$isRangeSelection(selection)) { return }

    // Use non-"" default, so "" indicates mixed highlighting
    const textColor = $getSelectionStyleValueForProperty(selection, "color", NO_STYLE);
    const backgroundColor = $getSelectionStyleValueForProperty(selection, "background-color", NO_STYLE);

    this.#colorButtons.forEach(button => {
      const matchesSelection = button.dataset.value === textColor || button.dataset.value === backgroundColor;
      const next = matchesSelection.toString();
      if (button.getAttribute("aria-pressed") !== next) {
        button.setAttribute("aria-pressed", next);
      }
    });

    const hasHighlight = textColor !== NO_STYLE || backgroundColor !== NO_STYLE;
    this.panel.querySelector(REMOVE_HIGHLIGHT_SELECTOR).disabled = !hasHighlight;
  }

  get #buttonContainer() {
    return this.panel.querySelector(".lexxy-highlight-colors")
  }

  get #colorButtons() {
    return Array.from(this.panel.querySelectorAll(APPLY_HIGHLIGHT_SELECTOR))
  }
}

class LinkDropdown extends ToolbarDropdown {
  editorReady() {
    this.input = this.panel.querySelector("input");

    this.track(
      registerEventListener(this.input, "keydown", this.#handleEnter),
      registerEventListener(this.linkButton, "click", this.#handleLink),
      registerEventListener(this.unlinkButton, "click", this.#handleUnlink)
    );
  }

  onOpen() {
    this.input.value = this.#selectedLinkUrl;
    this.input.required = true;
  }

  onClose() {
    this.input.required = false;
  }

  get linkButton() {
    return this.panel.querySelector("[value='link']")
  }

  get unlinkButton() {
    return this.panel.querySelector("[value='unlink']")
  }

  #handleEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      this.#handleLink(event);
    }
  }

  #handleLink = () => {
    if (!this.input.checkValidity()) {
      this.input.reportValidity();
      return
    }

    this.editor.dispatchCommand("link", this.input.value);
    this.close();
  }

  #handleUnlink = () => {
    this.editor.dispatchCommand("unlink");
    this.close();
  }

  get #selectedLinkUrl() {
    return this.editor.getEditorState().read(() => {
      const linkNode = this.editorElement.selection.nearestNodeOfType(LinkNode);
      return linkNode?.getURL() ?? ""
    })
  }
}

// Sanitizer config is per editor, and passed to each sanitize() call.
//
// Neither of those is incidental. This used to call DOMPurify.setConfig() on the
// shared singleton, which had two distinct consequences:
//
// 1. A persistent config is final — DOMPurify ignores the per-call config once
//    one is set — so it silently disarmed the sanitizing of any host app that
//    also imports dompurify. See config/dom_purify for why we now own our
//    instance; keeping the config per-call means there is no global sanitizer
//    state left even on that instance.
//
// 2. One config for the whole module meant the last editor to connect decided
//    how every other editor on the page sanitized. That is not cosmetic: an
//    editor's `value` is sanitized on read, so a rich editor sharing a page with
//    a plain one would silently drop its own headings, lists and links from the
//    value it submits. Keying on the editor is what fixes that.
//
// Registered against the Lexical editor, which is the identity both call sites
// have to hand: the element has it as `this.editor`, and nodes receive it as the
// second argument to createDOM().
const configs = new WeakMap();

// Only reached if sanitize() is called for an editor that never registered one.
// Falling back to the most recent config keeps the old behaviour rather than
// silently widening the allowlist to DOMPurify's permissive defaults.
let fallbackConfig = {};

function setSanitizerConfig(editor, allowedTags) {
  fallbackConfig = buildConfig(allowedTags);
  configs.set(editor, fallbackConfig);
}

// Re-inflating stored attachment content is an untrusted storage round-trip, so that
// call site opts into DOMPurify's mXSS-safe mode with { safeForXml: true }.
//
// The safe-XML config is derived from *this editor's* config rather than a module
// base, and by spreading it rather than rebuilding: that keeps TRUSTED_TYPES_POLICY
// and ADD_URI_SAFE_ATTR, and keeps the per-editor allowlist that the whole point of
// keying on the editor was to preserve. Building from a shared base here would
// quietly reintroduce the last-editor-wins bug on the one path that handles
// untrusted content.
//
// The serialized `content` attribute survives SAFE_FOR_XML via
// preserveSerializedContentHook in config/dom_purify, which reads the same config
// off the hook's third argument.
function sanitize(html, editor, { safeForXml = false } = {}) {
  const config = configs.get(editor) ?? fallbackConfig;

  return DOMPurify.sanitize(html, safeForXml ? { ...config, SAFE_FOR_XML: true } : config)
}

function bytesToHumanSize(bytes) {
  if (bytes === 0) return "0 B"
  const sizes = [ "B", "KB", "MB", "GB", "TB", "PB" ];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${ value.toFixed(2) } ${ sizes[i] }`
}

function extractFileName(string) {
  return string.split("/").pop()
}

// The content attribute is raw HTML (matching Trix/ActionText). Older Lexxy
// versions JSON-encoded it, so try JSON.parse first for backward compatibility.
function parseAttachmentContent(content) {
  try {
    return JSON.parse(content)
  } catch {
    return content
  }
}

function mimeTypeToExtension(mimeType) {
  if (!mimeType) return null

  const extension = mimeType.split("/")[1];
  return extension
}

class CustomActionTextAttachmentNode extends DecoratorNode {
  static getType() {
    return "custom_action_text_attachment"
  }

  static clone(node) {
    return new CustomActionTextAttachmentNode({ ...node }, node.__key)
  }

  static importJSON(serializedNode) {
    return new CustomActionTextAttachmentNode({ ...serializedNode })
  }

  static importDOM() {
    return {
      [this.TAG_NAME]: (element) => {
        if (!element.getAttribute("content")) {
          return null
        }

        return {
          conversion: (attachment) => {
            // Preserve initial space if present since Lexical removes it
            const nodes = [];
            const previousSibling = attachment.previousSibling;
            if (previousSibling && previousSibling.nodeType === Node.TEXT_NODE && /\s$/.test(previousSibling.textContent)) {
              nodes.push($createTextNode(" "));
            }

            const innerHtml = parseAttachmentContent(attachment.getAttribute("content"));

            nodes.push(new CustomActionTextAttachmentNode({
              sgid: attachment.getAttribute("sgid"),
              innerHtml,
              plainText: attachment.textContent.trim() || extractPlainTextFromHtml(innerHtml),
              contentType: attachment.getAttribute("content-type")
            }));

            const nextSibling = attachment.nextSibling;
            if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && /^\s/.test(nextSibling.textContent)) {
              nodes.push($createTextNode(" "));
            }

            return { node: nodes }
          },
          priority: 2
        }
      }
    }
  }

  static get TAG_NAME() {
    return Lexxy.global.get("attachmentTagName")
  }

  constructor({ tagName, sgid, contentType, innerHtml, plainText } = {}, key) {
    super(key);

    const contentTypeNamespace = Lexxy.global.get("attachmentContentTypeNamespace");

    this.tagName = tagName || CustomActionTextAttachmentNode.TAG_NAME;
    this.sgid = sgid;
    this.contentType = contentType || `application/vnd.${contentTypeNamespace}.unknown`;
    this.innerHtml = innerHtml;
    this.plainText = plainText ?? extractPlainTextFromHtml(innerHtml);
  }

  createDOM(_config, editor) {
    const figure = createElement(this.tagName, { "content-type": this.contentType, "data-lexxy-decorator": true, draggable: true });
    figure.dataset.lexicalNodeKey = this.__key;

    // The editor is passed through so this content is sanitized with its own
    // allowlist rather than whichever editor connected most recently.
    //
    // this.innerHtml is untrusted stored content being re-inflated into the editor,
    // so it goes through DOMPurify's mXSS-safe mode. The serialized `content`
    // attribute survives that via preserveSerializedContentHook.
    figure.insertAdjacentHTML("beforeend", sanitize(this.innerHtml, editor, { safeForXml: true }));

    const deleteButton = createElement("lexxy-node-delete-button");
    figure.appendChild(deleteButton);

    return figure
  }

  updateDOM() {
    return false
  }

  getTextContent() {
    return "\ufeff"
  }

  getReadableTextContent() {
    return this.plainText || `[${this.contentType}]`
  }

  isInline() {
    return true
  }

  exportDOM() {
    const attachment = createElement(this.tagName, {
      sgid: this.sgid,
      content: this.innerHtml,
      "content-type": this.contentType
    });

    return { element: attachment }
  }

  exportJSON() {
    return {
      type: "custom_action_text_attachment",
      version: 1,
      tagName: this.tagName,
      sgid: this.sgid,
      contentType: this.contentType,
      innerHtml: this.innerHtml,
      plainText: this.plainText
    }
  }

  decorate() {
    return null
  }
}

function $isCustomActionTextAttachmentNode(node) {
  return node instanceof CustomActionTextAttachmentNode
}

function dasherize(value) {
  return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`)
}

function isAutolinkableURL(string) {
  return /^(?:[a-z0-9]+:\/\/|www\.)[^\s]+$/i.test(string)
}

function normalizeFilteredText(string) {
  return string
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
}

function filterMatchPosition(text, potentialMatch) {
  const normalizedText = normalizeFilteredText(text);
  const normalizedMatch = normalizeFilteredText(potentialMatch);

  if (!normalizedMatch) return 0

  const match = normalizedText.match(new RegExp(`(?<![\\p{L}\\p{N}])${escapeForRegExp(normalizedMatch)}`, "u"));
  return match ? match.index : -1
}

function upcaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function escapeForRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Parses a value that may arrive as a boolean or as a string (e.g. from DOM
// getAttribute) into a proper boolean. Ensures "false" doesn't evaluate as truthy.
function parseBoolean(value) {
  if (typeof value === "string") return value === "true"
  return Boolean(value)
}

class LexxyExtension {
  #editorElement

  constructor(editorElement) {
    this.#editorElement = editorElement;
  }

  get editorElement() {
    return this.#editorElement
  }

  get editorConfig() {
    return this.#editorElement.config
  }

  // optional: defaults to true
  get enabled() {
    return true
  }

  get lexicalExtension() {
    return null
  }

  get allowedElements() {
    return []
  }

  defineExtension(...args) {
    return defineExtension(...args)
  }

  initializeToolbar(_lexxyToolbar) {
  }

  setEditorValidity(flags, message) {
    this.editorElement.setElementValidity(this, flags, message);
  }

  dispose() {
  }
}

function $containsRangeSelection(node, selection = $getSelection()) {
  if ($isRangeSelection(selection)) {
    const { commonAncestor } = $getCommonAncestor(selection.focus.getNode(), selection.anchor.getNode());
    return $findMatchingParent(commonAncestor, parent => parent.is(node))
  } else {
    return false
  }
}

function $createNodeSelectionWith(...nodes) {
  const selection = $createNodeSelection();
  nodes.forEach(node => selection.add(node.getKey()));
  return selection
}

function $isShadowRoot(node) {
  return $isElementNode(node) && $isRootOrShadowRoot(node) && !$isRootNode(node)
}

function $isSafeForRoot(node) {
  return ($isElementNode(node) || $isDecoratorNode(node)) && !node.isParentRequired()
}

function $makeSafeForRoot(node) {
  if ($isSafeForRoot(node)) {
    return node
  } else if (node.getParent()) {
    return $wrapNodeInElement(node, () => node.createParentElementNode())
  } else {
    // Detached nodes (e.g. clipboard nodes being inserted) can't be `replace`d in place,
    // so append them into a fresh required parent instead.
    return node.createParentElementNode().append(node)
  }
}

function getListType(node) {
  const list = $getNearestNodeOfType(node, ListNode);
  return list?.getListType() ?? null
}

function isEditorFocused(editor) {
  const rootElement = editor.getRootElement();
  return rootElement !== null && rootElement.contains(document.activeElement)
}

function $isAtNodeEdge(point, atStart = null) {
  if (atStart === null) {
    return $isAtNodeEdge(point, true) || $isAtNodeEdge(point, false)
  } else {
    return atStart ? $isAtNodeStart(point) : $isAtNodeEnd(point)
  }
}

function $isAtNodeStart(point) {
  return point.offset === 0
}

function extendTextNodeConversion(conversionName, ...callbacks) {
  return extendConversion(TextNode, conversionName, (conversionOutput, element) => ({
    ...conversionOutput,
    forChild: (lexicalNode, parentNode) => {
      const originalForChild = conversionOutput?.forChild ?? (x => x);
      let childNode = originalForChild(lexicalNode, parentNode);


      if ($isTextNode(childNode)) {
        childNode = callbacks.reduce(
          (childNode, callback) => callback(childNode, element) ?? childNode,
          childNode
        );
        return childNode
      }
    }
  }))
}

function extendConversion(nodeKlass, conversionName, callback = (output => output)) {
  return (element) => {
    const converter = nodeKlass.importDOM()?.[conversionName]?.(element);
    if (!converter) return null

    const conversionOutput = converter.conversion(element);
    if (!conversionOutput) return conversionOutput

    return callback(conversionOutput, element) ?? conversionOutput
  }
}

function $isCursorOnLastLine(selection) {
  const anchorNode = selection.anchor.getNode();
  const elementNode = $isElementNode(anchorNode) ? anchorNode : anchorNode.getParentOrThrow();
  const children = elementNode.getChildren();
  if (children.length === 0) return true

  const lastChild = children[children.length - 1];

  if (anchorNode === elementNode.getLatest() && selection.anchor.offset === children.length) return true
  if (anchorNode === lastChild) return true

  const lastLineBreakIndex = children.findLastIndex(child => $isLineBreakNode(child));
  if (lastLineBreakIndex === -1) return true

  const anchorIndex = children.indexOf(anchorNode);
  return anchorIndex > lastLineBreakIndex
}

function $isBlankNode(node) {
  if (node.getTextContent().trim() !== "") return false

  const children = node.getChildren?.();
  if (!children || children.length === 0) return true

  return children.every(child => {
    if ($isLineBreakNode(child)) return true
    return $isBlankNode(child)
  })
}

function $trimTrailingBlankNodes(parent) {
  for (const child of $lastToFirstIterator(parent)) {
    if ($isBlankNode(child)) {
      child.remove();
    } else {
      break
    }
  }
}

// A list item is structurally empty if it contains no meaningful content.
// Unlike getTextContent().trim() === "", this walks descendants to ensure
// decorator nodes (mentions, attachments whose getTextContent() may return
// invisible characters like \ufeff) are treated as non-empty content.
function $isListItemStructurallyEmpty(listItem) {
  const children = listItem.getChildren();
  for (const child of children) {
    if ($isDecoratorNode(child)) return false
    if ($isLineBreakNode(child)) continue
    if ($isTextNode(child)) {
      if (child.getTextContent().trim() !== "") return false
    } else if ($isElementNode(child)) {
      if (child.getTextContent().trim() !== "") return false
    }
  }
  return true
}

// Returns the document text up to `offset` inside `targetNode`. Non-inline
// element siblings are joined with `\n\n`, matching Lexical's own
// ElementNode.getTextContent behavior.
function $textBeforeOffset(targetNode, offset) {
  const parts = [];
  let done = false;

  function visit(node) {
    if (done) return
    if (node === targetNode) {
      parts.push(node.getTextContent().slice(0, offset));
      done = true;
      return
    }
    if ($isElementNode(node)) {
      const children = node.getChildren();
      for (let i = 0; i < children.length; i++) {
        visit(children[i]);
        if (done) return
        const child = children[i];
        if ($isElementNode(child) && !child.isInline() && i < children.length - 1) {
          parts.push("\n\n");
        }
      }
    } else {
      parts.push(node.getTextContent());
    }
  }

  visit($getRoot());
  return parts.join("")
}

function isAttachmentSpacerTextNode(node, previousNode, index, childCount) {
  return $isTextNode(node)
    && node.getTextContent() === " "
    && index === childCount - 1
    && previousNode instanceof CustomActionTextAttachmentNode
}

function $splitSelectedParagraphsAtInnerLineBreaks(selection) {
  const topLevelElements = new Set();
  for (const node of selection.getNodes()) {
    const topLevel = node.getTopLevelElement();
    if (topLevel) topLevelElements.add(topLevel);
  }

  for (const element of topLevelElements) {
    if (!$isParagraphNode(element)) continue

    const children = element.getChildren();
    if (!children.some($isLineBreakNode)) continue

    const groups = [ [] ];
    for (const child of children) {
      if ($isLineBreakNode(child)) {
        groups.push([]);
        child.remove();
      } else {
        groups[groups.length - 1].push(child);
      }
    }

    for (const group of groups) {
      if (group.length === 0) continue
      const paragraph = $createParagraphNode();
      group.forEach(child => paragraph.append(child));
      element.insertBefore(paragraph);
    }
    if (groups.some(group => group.length > 0)) element.remove();
  }
}

function $expandSelectionToLineBreaksAndSplitAtEdges(selection, fallbackAncestor = (node) => node.getTopLevelElement()) {
  $ensureForwardRangeSelection(selection);
  $shrinkSelectionPastBlockEdges(selection);

  const focusCaret = $caretFromPoint(selection.focus, "next");
  const anchorCaret = $caretFromPoint(selection.anchor, "previous");

  // A collapsed cursor adjacent to a <br> would claim it from both sides via
  // inward-edge; force outward-only walks so each side finds its own boundary.
  const skipInwardEdge = selection.isCollapsed();
  const focusBrCaret = $getCaretAtLineBreakBoundary(focusCaret, skipInwardEdge);
  let anchorBrCaret = $getCaretAtLineBreakBoundary(anchorCaret, skipInwardEdge);

  if (focusBrCaret?.origin.is(anchorBrCaret?.origin)) {
    anchorBrCaret = null;
  }

  // Splitting focus first keeps the anchor <br>'s position stable.
  const focusOuter = focusBrCaret && $splitAroundLineBreak(focusBrCaret);
  const anchorOuter = anchorBrCaret && $splitAroundLineBreak(anchorBrCaret);

  const innerStart = anchorOuter?.getNextSibling() ?? fallbackAncestor(selection.anchor.getNode());
  const innerEnd = focusOuter?.getPreviousSibling() ?? fallbackAncestor(selection.focus.getNode());
  if (!innerStart || !innerEnd) return

  $setSelectionFromCaretRange($getCaretRange(
    $normalizeCaret($getChildCaret(innerStart, "next")),
    $getCaretInDirection(
      $normalizeCaret($getChildCaret(innerEnd, "previous")),
      "next",
    ),
  ));
}

// A selection whose anchor sits at the very end of one block while its focus
// lives in a later block (e.g. selecting a pasted paragraph when the browser
// anchors at the end of the line above) contributes nothing from the anchor's
// block. Pull each endpoint that is flush against a block edge into the block
// that actually holds the selected content, so we don't wrap the empty edge
// block too.
function $shrinkSelectionPastBlockEdges(selection) {
  if (selection.isCollapsed()) return

  const anchorBlock = selection.anchor.getNode().getTopLevelElement();
  const focusBlock = selection.focus.getNode().getTopLevelElement();
  if (!anchorBlock || !focusBlock || anchorBlock.is(focusBlock)) return

  if ($isAtBlockEnd(selection.anchor, anchorBlock)) {
    const nextBlock = $nearestElementSibling(anchorBlock, "next");
    if (nextBlock) selection.anchor.set(nextBlock.getKey(), 0, "element");
  }

  if ($isAtBlockStart(selection.focus, focusBlock)) {
    const previousBlock = $nearestElementSibling(focusBlock, "previous");
    if (previousBlock) selection.focus.set(previousBlock.getKey(), previousBlock.getChildrenSize(), "element");
  }

  // Shrinking moves the endpoints toward each other, so they can cross when
  // both were flush against block edges; callers assume a forward selection.
  $ensureForwardRangeSelection(selection);
}

// Top-level decorator blocks (attachments, horizontal dividers) can't hold a
// selection point, so walk past them to the nearest element sibling. Returns
// null when no element sibling exists in that direction.
function $nearestElementSibling(block, direction) {
  let sibling = block;
  do {
    sibling = direction === "next" ? sibling.getNextSibling() : sibling.getPreviousSibling();
  } while (sibling && !$isElementNode(sibling))
  return sibling
}

function $isAtBlockEnd(point, block) {
  return $isAtBlockBoundary($caretFromPoint(point, "next"), block)
}

function $isAtBlockStart(point, block) {
  return $isAtBlockBoundary($caretFromPoint(point, "previous"), block)
}

// A text point sitting mid-node still has content ahead of it in the caret's
// direction, even though that content is not a sibling node. $getNodeAtCaret
// only sees siblings, so check the text edge before walking the block.
function $isAtBlockBoundary(caret, block) {
  if ($isTextPointCaret(caret) && $isExtendableTextPointCaret(caret)) return false

  let cursor = $normalizeCaret(caret);
  while (cursor && block.isParentOf(cursor.origin)) {
    if (cursor.getNodeAtCaret()) return false
    cursor = cursor.getParentCaret();
  }
  return true
}

function $getCaretAtLineBreakBoundary(caret, skipInwardEdge = false) {
  const paragraph = caret.origin.getTopLevelElement();
  if (!paragraph || !$isParagraphNode(paragraph)) return null

  const lineBreak = (skipInwardEdge ? null : $inwardEdgeLineBreak(caret, paragraph))
    ?? $outwardLineBreak(caret, paragraph);

  return lineBreak ? $getSiblingCaret(lineBreak, caret.direction) : null
}

// Prefer a <br> the cursor is sitting flush against, except when a further <br>
// also exists outward — that one is the real paragraph break for this side.
function $inwardEdgeLineBreak(caret, paragraph) {
  let candidateCaret;

  if (
    ($isChildCaret(caret) && caret.origin.is(paragraph)) ||
    ($isTextPointCaret(caret) && $isExtendableTextPointCaret(caret.getFlipped()))
  ) {
    candidateCaret = null;
  } else if ($isSiblingCaret(caret) && caret.getParentAtCaret().is(paragraph)) {
    candidateCaret = caret;
  } else {
    const childCaret = $paragraphChildCaretAtInwardEdge(caret, paragraph);
    candidateCaret = childCaret ? $rewindSiblingCaret(childCaret) : null;
  }

  if (candidateCaret && $isLineBreakNode(candidateCaret.origin)) {
    return $candidateUnlessShadowed(candidateCaret)
  } else {
    return null
  }
}

function $candidateUnlessShadowed(candidateCaret) {
  const outward = candidateCaret.getNodeAtCaret();
  return $isLineBreakNode(outward) ? null : candidateCaret.origin
}

function $outwardLineBreak(caret, paragraph) {
  const startCaret = $outwardWalkStartCaret(caret, paragraph);
  if (!startCaret) return null

  for (const { origin } of startCaret) {
    if (!origin.getParent().is(paragraph)) break
    if ($isLineBreakNode(origin)) return origin
  }
  return null
}

function $outwardWalkStartCaret(caret, paragraph) {
  if (caret.getParentAtCaret().is(paragraph)) {
    return caret
  } else {
    return $paragraphChildCaretContaining(caret, paragraph)
  }
}

function $paragraphChildCaretContaining(caret, paragraph) {
  let cursor = caret.getSiblingCaret();
  while (cursor && !cursor.origin.getParent()?.is(paragraph)) {
    cursor = cursor.getParentCaret();
  }
  return cursor?.origin.getParent()?.is(paragraph) ? cursor : null
}

// Only succeeds when the cursor is flush against the inward edge of every
// ancestor between itself and the paragraph child.
function $paragraphChildCaretAtInwardEdge(caret, paragraph) {
  let cursor = caret.getSiblingCaret();
  while (cursor && !cursor.origin.getParent()?.is(paragraph)) {
    if (cursor.getNodeAtCaret()) return null
    cursor = cursor.getParentCaret();
  }
  return cursor?.origin.getParent()?.is(paragraph) ? cursor : null
}

function $splitAroundLineBreak(lineBreakCaret) {
  let outer = null;

  if (lineBreakCaret.getNodeAtCaret() === null) {
    lineBreakCaret.origin.remove();
  } else {
    const lineBreak = lineBreakCaret.origin;
    const splitCaret = $getCaretInDirection($rewindSiblingCaret(lineBreakCaret), "next");

    $splitAtPointCaretNext(splitCaret);
    outer = lineBreak.getTopLevelElement();
    lineBreak.remove();
  }

  return outer
}

// Lexical's RangeSelection.insertNodes/insertLineBreak require every selection point to have a
// block ancestor with inline children. An element point on a container of block nodes — e.g. a
// quote holding paragraphs — has none, so Lexical throws invariant #211 or #212. This detects
// such a point so callers can descend it to a leaf before inserting.
function $isPointOnBlockContainer(point) {
  if (point.type !== "element") return false

  const firstChild = point.getNode().getFirstChild();
  return ($isElementNode(firstChild) || $isDecoratorNode(firstChild)) && !firstChild.isInline()
}

function $hasPointOnBlockContainer(selection) {
  return $isRangeSelection(selection) &&
    [ selection.anchor, selection.focus ].some($isPointOnBlockContainer)
}

// Descend any block-container element point in the selection to a leaf position, so a subsequent
// Lexical insert (insertNodes, insertLineBreak, INSERT_PARAGRAPH) doesn't throw invariant #211/#212.
function $normalizeBlockContainerSelection(selection = $getSelection()) {
  if (!$hasPointOnBlockContainer(selection)) return false

  $normalizeSelection__EXPERIMENTAL(selection);
  return true
}

function $consecutiveSiblingGroups(blocks) {
  const ordered = [ ...blocks ].sort((a, b) => a.getIndexWithinParent() - b.getIndexWithinParent());
  const groups = [];

  for (const block of ordered) {
    const lastGroup = groups.at(-1);
    const previous = lastGroup?.at(-1);

    if (previous && previous.getParent().is(block.getParent()) && previous.getNextSibling()?.is(block)) {
      lastGroup.push(block);
    } else {
      groups.push([ block ]);
    }
  }

  return groups
}

// Payload: Record<nodeKey, { patch?, replace? }>
//   - patch: plain object, shallow-merged into the existing node's properties
//   - replace: a LexicalNode instance that replaces the node
const REWRITE_HISTORY_COMMAND = createCommand("REWRITE_HISTORY_COMMAND");

class RewritableHistoryExtension extends LexxyExtension {
  #historyState = null

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/rewritable-history",
      dependencies: [ HistoryExtension ],
      register: (editor, _config, state) => {
        const historyOutput = state.getDependency(HistoryExtension).output;
        this.#historyState = historyOutput.historyState.value;

        return editor.registerCommand(
          REWRITE_HISTORY_COMMAND,
          (rewrites) => this.#rewriteHistory(rewrites),
          COMMAND_PRIORITY_EDITOR
        )
      }
    })
  }

  get historyState() {
    return this.#historyState
  }

  get #allHistoryEntries() {
    const entries = Array.from(this.#historyState.undoStack);
    if (this.#historyState.current) entries.push(this.#historyState.current);
    return entries.concat(this.#historyState.redoStack)
  }

  #rewriteHistory(rewrites) {
    this.#applyRewritesImmediatelyToCurrentState(rewrites);
    this.#applyRewritesToHistory(rewrites);

    return true
  }

  #applyRewritesImmediatelyToCurrentState(rewrites) {
    $getEditor().update(() => {
      for (const [ nodeKey, { patch, replace } ] of Object.entries(rewrites)) {
        const node = $getNodeByKey(nodeKey);
        if (!node) continue

        if (patch) Object.assign(node.getWritable(), patch);
        if (replace) node.replace(replace);
      }
    }, { discrete: true, tag: this.#getBackgroundUpdateTags() });
  }

  #applyRewritesToHistory(rewrites) {
    const nodeKeys = Object.keys(rewrites);

    for (const entry of this.#allHistoryEntries) {
      if (!this.#entryHasSomeKeys(entry, nodeKeys)) continue

      const editorState = entry.editorState = safeCloneEditorState(entry.editorState);

      for (const [ nodeKey, { patch, replace } ] of Object.entries(rewrites)) {
        const node = editorState._nodeMap.get(nodeKey);
        if (!node) continue

        if (patch) {
          this.#patchNodeInEditorState(editorState, node, patch);
        } else if (replace) {
          this.#replaceNodeInEditorState(editorState, node, replace);
        }
      }
    }
  }

  #entryHasSomeKeys(entry, nodeKeys) {
    return nodeKeys.some(key => entry.editorState._nodeMap.has(key))
  }

  #getBackgroundUpdateTags() {
    const tags = [ HISTORY_MERGE_TAG, SKIP_SCROLL_INTO_VIEW_TAG ];
    if (!isEditorFocused(this.editorElement.editor)) { tags.push(SKIP_DOM_SELECTION_TAG); }
    return tags
  }

  #patchNodeInEditorState(editorState, node, patch) {
    editorState._nodeMap.set(node.__key, $cloneNodeWithPatch(node, patch));
  }

  #replaceNodeInEditorState(editorState, node, replaceWith) {
    editorState._nodeMap.set(node.__key, $cloneNodeAdoptingKeys(replaceWith, node));
  }
}

function $cloneNodeWithPatch(node, patch) {
  const clone = $cloneWithProperties(node);
  Object.assign(clone, patch);
  return clone
}

function $cloneNodeAdoptingKeys(node, previousNode) {
  const clone = $cloneWithProperties(node);
  clone.__key = previousNode.__key;
  clone.__parent = previousNode.__parent;
  clone.__prev = previousNode.__prev;
  clone.__next = previousNode.__next;
  return clone
}

// EditorState#clone() keeps the same map reference.
// A new Map is needed to prevent editing Lexical's internal map
// Warning: this bypasses DEV's safety map freezing
function safeCloneEditorState(editorState) {
  const clone = editorState.clone();
  clone._nodeMap = new Map(editorState._nodeMap);
  return clone
}

const INITIAL_PREVIEW_POLL_DELAY_MS = 3000;
const MAX_PREVIEW_POLL_DELAY_MS = 120000;
const MAX_PREVIEW_POLL_ATTEMPTS = 20;


class ActionTextAttachmentNode extends DecoratorNode {
  static getType() {
    return "action_text_attachment"
  }

  static clone(node) {
    return new ActionTextAttachmentNode({ ...node }, node.__key)
  }

  static importJSON(serializedNode) {
    return new ActionTextAttachmentNode({ ...serializedNode })
  }

  static importDOM() {
    return {
      [this.TAG_NAME]: () => {
        return {
          conversion: (attachment) => ({
            node: new ActionTextAttachmentNode({
              sgid: attachment.getAttribute("sgid"),
              src: attachment.getAttribute("url"),
              previewable: attachment.getAttribute("previewable"),
              altText: attachment.getAttribute("alt"),
              caption: attachment.getAttribute("caption"),
              contentType: attachment.getAttribute("content-type"),
              fileName: attachment.getAttribute("filename"),
              fileSize: attachment.getAttribute("filesize"),
              width: attachment.getAttribute("width"),
              height: attachment.getAttribute("height")
            })
          }), priority: 1
        }
      },
      "img": () => {
        return {
          conversion: (img) => {
            const fileName = extractFileName(img.getAttribute("src") ?? "");
            return {
              node: new ActionTextAttachmentNode({
                src: img.getAttribute("src"),
                fileName: fileName,
                caption: img.getAttribute("alt") || "",
                contentType: "image/*",
                width: img.getAttribute("width"),
                height: img.getAttribute("height")
              })
            }
          }, priority: 1
        }
      },
      "video": () => {
        return {
          conversion: (video) => {
            const videoSource = video.getAttribute("src") || video.querySelector("source")?.src;
            const fileName = videoSource?.split("/")?.pop();
            const contentType = video.querySelector("source")?.getAttribute("content-type") || "video/*";

            return {
              node: new ActionTextAttachmentNode({
                src: videoSource,
                fileName: fileName,
                contentType: contentType
              })
            }
          }, priority: 1
        }
      }
    }
  }

  static get TAG_NAME() {
    return Lexxy.global.get("attachmentTagName")
  }

  constructor({ tagName, sgid, src, previewSrc, previewable, previewStatusUrl, pendingPreview, altText, caption, contentType, fileName, fileSize, width, height, uploadError } = {}, key) {
    super(key);

    this.tagName = tagName || ActionTextAttachmentNode.TAG_NAME;
    this.sgid = sgid;
    this.src = src;
    this.previewSrc = previewSrc;
    this.previewable = parseBoolean(previewable);
    this.previewStatusUrl = previewStatusUrl;
    this.pendingPreview = pendingPreview;
    this.altText = altText || "";
    this.caption = caption || "";
    this.contentType = contentType || "";
    this.fileName = fileName || "";
    this.fileSize = fileSize;
    this.width = width;
    this.height = height;
    this.uploadError = uploadError;

    this.editor = $getEditor();
  }

  createDOM() {
    if (this.uploadError) return this.createDOMForError()
    if (this.pendingPreview) return this.#createDOMForPendingPreview()

    const figure = this.createAttachmentFigure();

    if (this.isPreviewableAttachment) {
      figure.appendChild(this.#createDOMForImage());
      figure.appendChild(this.#createEditableCaption());
    } else if (this.isVideo) {
      figure.appendChild(this.#createDOMForFile());
      figure.appendChild(this.#createEditableCaption());
    } else {
      figure.appendChild(this.#createDOMForFile());
      figure.appendChild(this.#createDOMForNotImage());
    }

    return figure
  }

  updateDOM(prevNode, dom) {
    if (this.uploadError !== prevNode.uploadError) return true

    const caption = dom.querySelector("figcaption textarea");
    if (caption && this.caption) {
      caption.value = this.caption;
    }

    return false
  }

  getTextContent() {
    return `[${this.caption || this.fileName}]\n\n`
  }

  isInline() {
    return this.isAttached() && !this.getParent().is($getNearestRootOrShadowRoot(this))
  }

  exportDOM() {
    const attachment = createElement(this.tagName, {
      sgid: this.sgid,
      previewable: this.previewable || null,
      url: this.src,
      alt: this.altText,
      caption: this.caption,
      "content-type": this.contentType,
      filename: this.fileName,
      filesize: this.fileSize,
      width: this.width,
      height: this.height,
      presentation: "gallery"
    });

    return { element: attachment }
  }

  exportJSON() {
    return {
      type: "action_text_attachment",
      version: 1,
      tagName: this.tagName,
      sgid: this.sgid,
      src: this.src,
      previewable: this.previewable,
      previewStatusUrl: this.previewStatusUrl,
      pendingPreview: this.pendingPreview,
      altText: this.altText,
      caption: this.caption,
      contentType: this.contentType,
      fileName: this.fileName,
      fileSize: this.fileSize,
      width: this.width,
      height: this.height
    }
  }

  decorate() {
    return null
  }

  createDOMForError() {
    const figure = this.createAttachmentFigure();
    figure.classList.add("attachment--error");
    figure.appendChild(createElement("div", { innerText: `Error uploading ${this.fileName || "file"}` }));
    return figure
  }

  createAttachmentFigure(previewable = this.isPreviewableAttachment) {
    const figure = createAttachmentFigure(this.contentType, previewable, this.fileName);
    figure.draggable = true;
    figure.dataset.lexicalNodeKey = this.__key;

    const deleteButton = createElement("lexxy-node-delete-button");
    figure.appendChild(deleteButton);

    return figure
  }

  get isPreviewableAttachment() {
    return this.isPreviewableImage || this.previewable
  }

  get isPreviewableImage() {
    return isPreviewableImage(this.contentType)
  }

  get isVideo() {
    return this.contentType.startsWith("video/")
  }

  #createDOMForPendingPreview() {
    const figure = this.createAttachmentFigure(false);
    figure.appendChild(this.#createDOMForFile());
    figure.appendChild(this.#createDOMForNotImage());
    this.#pollForPreview(figure);
    return figure
  }

  patchAndRewriteHistory(patch) {
    this.editor.dispatchCommand(REWRITE_HISTORY_COMMAND, {
      [this.getKey()]: { patch }
    });
  }

  replaceAndRewriteHistory(node) {
    this.editor.dispatchCommand(REWRITE_HISTORY_COMMAND, {
      [this.getKey()]: { replace: node }
    });
  }

  #createDOMForImage(options = {}) {
    const initialSrc = this.previewSrc || this.src;
    const img = createElement("img", { src: initialSrc, draggable: false, alt: this.altText, ...this.#imageDimensions, ...options });

    if (this.previewable && !this.isPreviewableImage) {
      img.onerror = () => this.#swapPreviewToFileDOM(img);
    }

    if (this.previewSrc) {
      this.#preloadAndSwapSrc(img);
    }

    const container = createElement("div", { className: "attachment__container" });
    container.appendChild(img);
    return container
  }

  #preloadAndSwapSrc(img) {
    const previewSrc = this.previewSrc;
    const serverImage = new Image();

    serverImage.onload = () => this.#handleImageLoaded(img, previewSrc);
    serverImage.onerror = () => this.#handleImageLoadError(previewSrc);
    serverImage.src = this.src;
  }

  #handleImageLoaded(img, previewSrc) {
    img.src = this.src;
    this.patchAndRewriteHistory({ previewSrc: null });
    this.#revokePreviewSrc(previewSrc);
  }

  #handleImageLoadError(previewSrc) {
    this.patchAndRewriteHistory({
      previewSrc: null,
      uploadError: true
    });
    this.#revokePreviewSrc(previewSrc);
  }

  #revokePreviewSrc(previewSrc) {
    if (previewSrc?.startsWith("blob:")) URL.revokeObjectURL(previewSrc);
  }

  #swapPreviewToFileDOM(img) {
    const figure = img.closest("figure.attachment");
    if (!figure) return

    this.#swapFigureContent(figure, "attachment--preview", "attachment--file", () => {
      figure.appendChild(this.#createDOMForFile());
      figure.appendChild(this.#createDOMForNotImage());
    });
  }

  // While the file-icon is shown, watch for the preview to become ready.
  // With a status URL, poll it (2xx = processing, anything else = ready).
  // Without one, preload the preview URL once and swap on load.
  #pollForPreview(figure) {
    if (this.previewStatusUrl) {
      this.#waitForPreviewByPollingStatus(figure);
    } else {
      this.#waitForPreviewByPreloadingImage(figure);
    }
  }

  #waitForPreviewByPollingStatus(figure) {
    let attempt = 0;

    const tryStatus = async () => {
      if (!this.editor.read(() => this.isAttached())) return

      try {
        // redirect: "manual" prevents fetch from transparently following a
        // 3xx response — without it, a status endpoint that redirected to,
        // say, the preview URL would resolve to a 200 and look like
        // "still processing." The contract is "any non-2xx means done."
        const response = await fetch(this.previewStatusUrl, { credentials: "include", redirect: "manual" });

        if (!this.editor.read(() => this.isAttached())) return

        if (response.ok) {
          retry();
        } else {
          this.#swapToPreviewDOM(figure, this.src);
        }
      } catch {
        retry();
      }
    };

    const retry = () => {
      attempt++;
      if (attempt < MAX_PREVIEW_POLL_ATTEMPTS && this.editor.read(() => this.isAttached())) {
        const delay = Math.min(2000 * Math.pow(1.5, attempt), MAX_PREVIEW_POLL_DELAY_MS);
        setTimeout(tryStatus, delay);
      }
    };

    // Give the server time to start processing before the first attempt
    setTimeout(tryStatus, INITIAL_PREVIEW_POLL_DELAY_MS);
  }

  #waitForPreviewByPreloadingImage(figure) {
    const img = new Image();
    img.onload = () => {
      if (!this.editor.read(() => this.isAttached())) return
      this.#swapToPreviewDOM(figure, this.src);
    };
    img.onerror = () => {
      // Clear pendingPreview so undo/redo or any JSON round-trip doesn't
      // re-enter the pending flow and issue another fetch. The file icon
      // stays as the stable fallback.
      if (!this.editor.read(() => this.isAttached())) return
      this.patchAndRewriteHistory({ pendingPreview: false });
    };
    img.src = this.src;
  }

  #swapToPreviewDOM(figure, previewSrc) {
    this.#swapFigureContent(figure, "attachment--file", "attachment--preview", () => {
      const img = createElement("img", { src: previewSrc, draggable: false, alt: this.altText });
      img.onerror = () => this.#swapPreviewToFileDOM(img);
      const container = createElement("div", { className: "attachment__container" });
      container.appendChild(img);
      figure.appendChild(container);
      figure.appendChild(this.#createEditableCaption());
    });

    this.patchAndRewriteHistory({ pendingPreview: false });
  }

  #swapFigureContent(figure, fromClass, toClass, renderContent) {
    figure.className = figure.className.replace(fromClass, toClass);

    for (const child of [ ...figure.querySelectorAll(".attachment__container, .attachment__icon, figcaption") ]) {
      child.remove();
    }

    renderContent();
  }

  get #imageDimensions() {
    if (this.width && this.height) {
      return { width: this.width, height: this.height }
    } else {
      return {}
    }
  }

  #createDOMForFile() {
    const extension = this.fileName ? this.fileName.split(".").pop().toLowerCase() : "unknown";
    return createElement("span", { className: "attachment__icon", textContent: `${extension}` })
  }

  #createDOMForNotImage() {
    const figcaption = createElement("figcaption", { className: "attachment__caption" });

    const nameTag = createElement("strong", { className: "attachment__name", textContent: this.caption || this.fileName });

    figcaption.appendChild(nameTag);

    if (this.fileSize) {
      const sizeSpan = createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(this.fileSize) });
      figcaption.appendChild(sizeSpan);
    }

    return figcaption
  }

  #createEditableCaption() {
    const caption = createElement("figcaption", { className: "attachment__caption" });
    const input = createElement("textarea", {
      value: this.caption,
      placeholder: this.fileName,
      rows: "1"
    });

    input.addEventListener("focusin", () => input.placeholder = "Add caption...");
    input.addEventListener("blur", (event) => this.#handleCaptionInputBlurred(event));
    input.addEventListener("keydown", (event) => this.#handleCaptionInputKeydown(event));
    input.addEventListener("copy", (event) => event.stopPropagation());
    input.addEventListener("cut", (event) => event.stopPropagation());
    input.addEventListener("paste", (event) => event.stopPropagation());

    caption.appendChild(input);

    return caption
  }

  #handleCaptionInputBlurred(event) {
    this.#updateCaptionValueFromInput(event.target);
  }

  #updateCaptionValueFromInput(input) {
    input.placeholder = this.fileName;
    this.editor.update(() => {
      this.getWritable().caption = input.value;
    });
  }

  #handleCaptionInputKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.target.blur();

      this.editor.update(() => {
        // Place the cursor after the current image
        this.selectNext(0, 0);
      }, {
        tag: HISTORY_MERGE_TAG
      });
    }

    // Stop all keydown events from bubbling to the Lexical root element.
    // The caption textarea is outside Lexical's content model and should
    // handle its own keyboard events natively (Ctrl+A, Ctrl+C, Ctrl+X, etc.).
    event.stopPropagation();
  }
}

function $createActionTextAttachmentNode(...args) {
  return new ActionTextAttachmentNode(...args)
}

function $isActionTextAttachmentNode(node) {
  return node instanceof ActionTextAttachmentNode
}

function filterDisallowedAttachmentNodes(nodes, editorElement) {
  return nodes
    .filter(node => !isDisallowedAttachment(node, editorElement))
    .map(node => {
      $descendantsMatching([ node ], descendant => isDisallowedAttachment(descendant, editorElement))
        .forEach(descendant => descendant.remove());
      return node
    })
}

function isDisallowedAttachment(node, editorElement) {
  const isAttachmentNode =
    node instanceof CustomActionTextAttachmentNode ||
    node instanceof ActionTextAttachmentNode;
  return isAttachmentNode &&
         !editorElement.permitsAttachmentContentType(node.contentType)
}

// Replaces inline `data:image/...` attachments with upload nodes that flow through the normal
// file upload pipeline.
//
// Without this step, pasted-from-Google-Docs-style content lands in the editor with the entire
// base64 image embedded in the attachment's `src`, which then persists into the saved HTML and
// bloats the stored document.
//
// Each conversion dispatches the cancelable `lexxy:file-accept` event so the host's allowlist (and
// any other listener) can refuse the synthesized File before it's accepted into the upload
// pipeline; on refusal, the node is dropped silently — matching how `Contents#uploadFiles` handles
// file-picker rejections.
function $convertInlineImageDataURIs(nodes, editorElement) {
  const topLevel = nodes
    .map(node => isInlineImageDataURIAttachment(node) ? $tryCreateUploadFromDataURI(node, editorElement) : node)
    .filter(node => node !== null);

  for (const node of topLevel) {
    for (const desc of $descendantsMatching([ node ], isInlineImageDataURIAttachment)) {
      const upload = $tryCreateUploadFromDataURI(desc, editorElement);
      if (upload) {
        desc.replace(upload);
      } else {
        desc.remove();
      }
    }
  }

  return topLevel
}

function isInlineImageDataURIAttachment(node) {
  return node instanceof ActionTextAttachmentNode &&
    /^data:image\/[^,]*;base64,/i.test(node.src ?? "")
}

function $tryCreateUploadFromDataURI(node, editorElement) {
  const file = dataURIToFile(node.src);
  if (file && editorElement.acceptsFile(file)) {
    return editorElement.contents.$createUploadNode(file)
  }
  return null
}

function dataURIToFile(dataURI) {
  try {
    const [ header, data ] = dataURI.split(",");

    // https://datatracker.ietf.org/doc/html/rfc6838#section-4.2
    const mimeType = header.match(/^data:(image\/[A-Za-z0-9][A-Za-z0-9!#$&\-^_.+]*)/)?.[1];
    if (mimeType) {
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const extension = mimeTypeToExtension(mimeType) ?? "png";
      return new File([ bytes ], `pasted-image-${Date.now()}.${extension}`, { type: mimeType })
    } else {
      return null
    }
  } catch {
    return null
  }
}

class HorizontalDividerNode extends DecoratorNode {
  static getType() {
    return "horizontal_divider"
  }

  static clone(node) {
    return new HorizontalDividerNode(node.__key)
  }

  static importJSON(serializedNode) {
    return new HorizontalDividerNode()
  }

  static importDOM() {
    return {
      "hr": (hr) => {
        return {
          conversion: () => ({
            node: new HorizontalDividerNode()
          }),
          priority: 1
        }
      }
    }
  }

  constructor(key) {
    super(key);
  }

  createDOM() {
    const figure = createElement("figure", { className: "horizontal-divider" });
    const hr = createElement("hr");

    figure.appendChild(hr);

    const deleteButton = createElement("lexxy-node-delete-button");
    figure.appendChild(deleteButton);

    return figure
  }

  updateDOM() {
    return true
  }

  getTextContent() {
    return "┄\n\n"
  }

  isInline() {
    return false
  }

  exportDOM() {
    const hr = createElement("hr");
    return { element: hr }
  }

  exportJSON() {
    return {
      type: "horizontal_divider",
      version: 1
    }
  }

  decorate() {
    return null
  }
}

const HORIZONTAL_DIVIDER = {
  dependencies: [ HorizontalDividerNode ],
  export: (node) => {
    return node instanceof HorizontalDividerNode ? "---" : null
  },
  regExpStart: /^-{3,}\s?$/,
  replace: (parentNode, children, match, endMatch, linesInBetween, isImport) => {
    const hrNode = new HorizontalDividerNode();
    parentNode.replace(hrNode);

    if (!isImport) {
      const paragraph = $createParagraphNode();
      hrNode.insertAfter(paragraph);
      paragraph.select();
    }
  },
  type: "multiline-element"
};

const PUNCTUATION_OR_SPACE = /[^\w]/;

// Supplements Lexical's built-in registerMarkdownShortcuts to handle the case
// where a user types a leading tag before text that already ends with a
// trailing tag (e.g. typing ` before `hello`` or ** before **hello**).
//
// Lexical's markdown shortcut handler only triggers format transformations when
// the closing tag is the character just typed. When the opening tag is typed
// instead (e.g. typing ` before `hello`` to form ``hello``), the built-in
// handler doesn't match because it looks backward from the cursor for an
// opening tag, but the cursor is right after it.
//
// This listener detects that scenario for ALL text format transformers
// (backtick, bold, italic, strikethrough, etc.) and applies the appropriate
// format.
function registerMarkdownLeadingTagHandler(editor, transformers) {
  const textFormatTransformers = transformers
    .filter(t => t.type === "text-format")
    .sort((a, b) => b.tag.length - a.tag.length); // Longer tags first

  return editor.registerUpdateListener(({ tags, dirtyLeaves, editorState, prevEditorState }) => {
    if (tags.has("historic") || tags.has("collaboration")) return
    if (editor.isComposing()) return

    const selection = editorState.read($getSelection);
    const prevSelection = prevEditorState.read($getSelection);

    if (!$isRangeSelection(prevSelection) || !$isRangeSelection(selection) || !selection.isCollapsed()) return

    const anchorKey = selection.anchor.key;
    const anchorOffset = selection.anchor.offset;

    if (!dirtyLeaves.has(anchorKey)) return

    const anchorNode = editorState.read(() => $getNodeByKey(anchorKey));
    if (!$isTextNode(anchorNode)) return

    // Only trigger when cursor moved forward (typing)
    const prevOffset = prevSelection.anchor.key === anchorKey ? prevSelection.anchor.offset : 0;
    if (anchorOffset <= prevOffset) return

    const textContent = editorState.read(() => anchorNode.getTextContent());

    // Try each transformer, longest tags first
    for (const transformer of textFormatTransformers) {
      const tag = transformer.tag;
      const tagLen = tag.length;

      // The typed characters must end at the cursor position and form the opening tag
      const openTagStart = anchorOffset - tagLen;
      if (openTagStart < 0) continue

      const candidateOpenTag = textContent.slice(openTagStart, anchorOffset);
      if (candidateOpenTag !== tag) continue

      // Disambiguate from longer tags: if the character before the opening tag
      // is the same as the tag character, this might be part of a longer tag
      // (e.g. seeing `*` when the user is actually typing `**`)
      const tagChar = tag[0];
      if (openTagStart > 0 && textContent[openTagStart - 1] === tagChar) continue

      // Check intraword constraint: if intraword is false, the character before
      // the opening tag must be a space, punctuation, or the start of the text
      if (transformer.intraword === false && openTagStart > 0) {
        const beforeChar = textContent[openTagStart - 1];
        if (beforeChar && !PUNCTUATION_OR_SPACE.test(beforeChar)) continue
      }

      // Search forward for a closing tag in the same text node
      const searchStart = anchorOffset;
      const closeTagIndex = textContent.indexOf(tag, searchStart);
      if (closeTagIndex < 0) continue

      // Disambiguate closing tag from longer tags: if the character right after
      // the closing tag is the same as the tag character, skip
      // (e.g. `*hello**` — the first `*` at index 6 is part of `**`)
      if (textContent[closeTagIndex + tagLen] === tagChar) continue

      // Also check if the character before the closing tag start is the same
      // tag character (e.g. the closing tag might be a suffix of a longer sequence)
      if (closeTagIndex > 0 && textContent[closeTagIndex - 1] === tagChar) continue

      // There must be content between the tags (not just empty or whitespace-adjacent)
      const innerStart = anchorOffset;
      const innerEnd = closeTagIndex;
      if (innerEnd <= innerStart) continue

      // No space immediately after opening tag
      if (textContent[innerStart] === " ") continue

      // No space immediately before closing tag
      if (textContent[innerEnd - 1] === " ") continue

      // Check intraword constraint for closing tag
      if (transformer.intraword === false) {
        const afterCloseChar = textContent[closeTagIndex + tagLen];
        if (afterCloseChar && !PUNCTUATION_OR_SPACE.test(afterCloseChar)) continue
      }

      editor.update(() => {
        const node = $getNodeByKey(anchorKey);
        if (!node || !$isTextNode(node)) return

        const parent = node.getParent();
        if (parent === null || $isCodeNode(parent)) return

        $applyFormatFromLeadingTag(node, openTagStart, transformer);
      });

      break // Only apply the first (longest) matching transformer
    }
  })
}

function $applyFormatFromLeadingTag(anchorNode, openTagStart, transformer) {
  const tag = transformer.tag;
  const tagLen = tag.length;
  const textContent = anchorNode.getTextContent();

  const innerStart = openTagStart + tagLen;
  const closeTagIndex = textContent.indexOf(tag, innerStart);
  if (closeTagIndex < 0) return

  const inner = textContent.slice(innerStart, closeTagIndex);
  if (inner.length === 0) return

  // Remove both tags and apply format
  const before = textContent.slice(0, openTagStart);
  const after = textContent.slice(closeTagIndex + tagLen);

  anchorNode.setTextContent(before + inner + after);

  const nextSelection = $createRangeSelection();
  $setSelection(nextSelection);

  // Select the inner text to apply formatting
  nextSelection.anchor.set(anchorNode.getKey(), openTagStart, "text");
  nextSelection.focus.set(anchorNode.getKey(), openTagStart + inner.length, "text");

  for (const format of transformer.format) {
    if (!nextSelection.hasFormat(format)) {
      nextSelection.formatText(format);
    }
  }

  // Collapse selection to end of formatted text and clear the format
  // so subsequent typing is plain text
  nextSelection.anchor.set(nextSelection.focus.key, nextSelection.focus.offset, nextSelection.focus.type);

  for (const format of transformer.format) {
    if (nextSelection.hasFormat(format)) {
      nextSelection.toggleFormat(format);
    }
  }
}

var theme = {
  text: {
    bold: "lexxy-content__bold",
    italic: "lexxy-content__italic",
    strikethrough: "lexxy-content__strikethrough",
    underline: "lexxy-content__underline",
    highlight: "lexxy-content__highlight"
  },
  tableCellHeader: "lexxy-content__table-cell--header",
  tableCellSelected: "lexxy-content__table-cell--selected",
  tableSelection: "lexxy-content__table--selection",
  tableScrollableWrapper: "lexxy-content__table-wrapper",
  tableCellHighlight: "lexxy-content__table-cell--highlight",
  tableCellFocus: "lexxy-content__table-cell--focus",
  list: {
    nested: {
      listitem: "lexxy-nested-listitem",
    }
  },
  codeHighlight: {
    addition: "code-token__selector",
    atrule: "code-token__attr",
    attr: "code-token__attr",
    "attr-name": "code-token__attr",
    "attr-value": "code-token__selector",
    boolean: "code-token__property",
    bold: "code-token__variable",
    builtin: "code-token__selector",
    cdata: "code-token__comment",
    char: "code-token__selector",
    class: "code-token__function",
    "class-name": "code-token__function",
    color: "code-token__property",
    comment: "code-token__comment",
    constant: "code-token__property",
    coord: "code-token__comment",
    decorator: "code-token__function",
    deleted: "code-token__operator",
    deletion: "code-token__operator",
    directive: "code-token__attr",
    "directive-hash": "code-token__property",
    doctype: "code-token__comment",
    entity: "code-token__operator",
    function: "code-token__function",
    hexcode: "code-token__property",
    important: "code-token__function",
    inserted: "code-token__selector",
    italic: "code-token__comment",
    keyword: "code-token__attr",
    line: "code-token__selector",
    namespace: "code-token__variable",
    number: "code-token__property",
    macro: "code-token__function",
    operator: "code-token__operator",
    parameter: "code-token__variable",
    prolog: "code-token__comment",
    property: "code-token__property",
    punctuation: "code-token__punctuation",
    "raw-string": "code-token__operator",
    regex: "code-token__variable",
    script: "code-token__function",
    selector: "code-token__selector",
    string: "code-token__selector",
    style: "code-token__function",
    symbol: "code-token__property",
    tag: "code-token__property",
    title: "code-token__function",
    "type-definition": "code-token__function",
    url: "code-token__operator",
    variable: "code-token__variable",
  }
};

class UploadRequests {
  #requestsByKey = new Map()

  track(key, request) {
    this.#requestsByKey.set(key, request);
  }

  forget(key) {
    this.#requestsByKey.delete(key);
  }

  abort(key) {
    const request = this.#requestsByKey.get(key);
    if (request) {
      this.#requestsByKey.delete(key);
      request.abort();
    }
  }

  clear() {
    this.#requestsByKey.clear();
  }
}

// Shared, strictly-contained element used to attach ephemeral nodes when we
// need to read computed styles (e.g. canonicalizing style values, resolving
// CSS custom properties). The container is created once and attached to
// `document.body` once; subsequent child mutations happen *inside* the
// contained subtree so they do not invalidate style on the rest of the page.
//
// Without this, `document.body.appendChild(...)` / `element.remove()` calls
// forced the browser to re-evaluate every ancestor-dependent selector (`:has()`,
// descendant combinators, universal sibling rules) across the document on each
// invocation — a 13,000+ element style recalc per call on a typical Basecamp
// page.

let resolverRoot = null;

function styleResolverRoot() {
  if (resolverRoot && resolverRoot.isConnected) return resolverRoot

  resolverRoot = document.createElement("div");
  resolverRoot.setAttribute("aria-hidden", "true");
  resolverRoot.setAttribute("data-lexxy-style-resolver", "");
  // `contain: strict` (size, layout, paint, style) isolates everything.
  // The root itself paints nothing (visibility hidden), has zero
  // geometric impact (position fixed, intrinsic size via contain), and
  // never leaks style invalidation to its ancestors.
  resolverRoot.style.cssText = "contain: strict; position: fixed; top: 0; left: 0; visibility: hidden; pointer-events: none; width: 0; height: 0;";
  document.body.appendChild(resolverRoot);
  return resolverRoot
}

function isSelectionHighlighted(selection) {
  if (!$isRangeSelection(selection)) return false

  if (selection.isCollapsed()) {
    return hasHighlightStyles(selection.style)
  } else {
    return selection.hasFormat("highlight")
  }
}

function getHighlightStyles(selection) {
  if (!$isRangeSelection(selection)) return null

  let styles = getStyleObjectFromCSS(selection.style);
  if (!styles.color && !styles["background-color"]) {
    const anchorNode = selection.anchor.getNode();
    if ($isTextNode(anchorNode)) {
      styles = getStyleObjectFromCSS(anchorNode.getStyle());
    }
  }

  const color = styles.color || null;
  const backgroundColor = styles["background-color"] || null;
  if (!color && !backgroundColor) return null

  return { color, backgroundColor }
}

function hasHighlightStyles(cssOrStyles) {
  const styles = typeof cssOrStyles === "string" ? getStyleObjectFromCSS(cssOrStyles) : cssOrStyles;
  return !!(styles.color || styles["background-color"])
}

function applyCanonicalizers(styles, canonicalizers = []) {
  return canonicalizers.reduce((css, canonicalizer) => {
    return canonicalizer.applyCanonicalization(css)
  }, styles)
}

class StyleCanonicalizer {
  constructor(property, allowedValues= []) {
    this._property = property;
    this._allowedValues = allowedValues;
    this._canonicalValues = this.#allowedValuesIdentityObject;
  }

  applyCanonicalization(css) {
    const styles = { ...getStyleObjectFromCSS(css) };

    styles[this._property] = this.getCanonicalAllowedValue(styles[this._property]);
    if (!styles[this._property]) {
      delete styles[this._property];
    }

    return getCSSFromStyleObject(styles)
  }

  getCanonicalAllowedValue(value) {
    return this._canonicalValues[value] ||= this.#resolveCannonicalValue(value)
  }

  // Private

  get #allowedValuesIdentityObject() {
    return this._allowedValues.reduce((object, value) => ({ ...object, [value]: value }), {})
  }

  #resolveCannonicalValue(value) {
    let index = this.#computedAllowedValues.indexOf(value);
    if (index === -1) {
      index = this.#computedAllowedValues.indexOf(computeStyleValues(this._property, [ value ])[0]);
    }
    return index === -1 ? null : this._allowedValues[index]
  }

  get #computedAllowedValues() {
    return this._computedAllowedValues ||= computeStyleValues(this._property, this._allowedValues)
  }
}

// Separates DOM writes from layout reads to avoid forced reflows, and attaches
// resolver elements to a strictly-contained root (outside the normal document
// flow) so neither the attach nor the detach invalidate styles on the rest of
// the page. Without containment, appending to `document.body` triggered a
// page-wide style recalc on every canonicalization pass.
function computeStyleValues(property, values) {
  const fragment = document.createDocumentFragment();

  const elements = values.map(value => {
    const element = createElement("span", { style: `display: none; ${property}: ${value};` });
    fragment.appendChild(element);
    return element
  });

  styleResolverRoot().appendChild(fragment);

  const computed = elements.map(element =>
    window.getComputedStyle(element).getPropertyValue(property)
  );

  elements.forEach(element => element.remove());
  return computed
}

const TOGGLE_HIGHLIGHT_COMMAND = createCommand();
const REMOVE_HIGHLIGHT_COMMAND = createCommand();
const BLANK_STYLES = { "color": null, "background-color": null };

const hasPastedStylesState = createState("hasPastedStyles", {
  parse: (value) => value || false
});

// Stores pending highlight ranges extracted during HTML import, keyed by CodeNode key.
// The highlight-preserving tokenizer consumes this map when the code retokenizer
// first tokenizes the block. Scoped per editor instance so entries don't leak
// across editors or outlive a torn-down editor.
const pendingCodeHighlights = new WeakMap();

class HighlightExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    const extension = defineExtension({
      dependencies: [ RichTextExtension ],
      name: "lexxy/highlight",
      config: {
        color: { buttons: [], permit: [] },
        "background-color": { buttons: [], permit: [] }
      },
      html: {
        import: {
          mark: $markConversion
        }
      },
      register(editor, config) {
        // keep the ref to the canonicalizers for optimized css conversion
        const canonicalizers = buildCanonicalizers(config);

        // Register the <pre> converter directly in the conversion cache so it
        // coexists with other extensions' "pre" converters (the extension-level
        // html.import uses Object.assign, which means only one "pre" per key).
        $registerPreConversion(editor);

        return mergeRegister(
          editor.registerCommand(TOGGLE_HIGHLIGHT_COMMAND, (styles) => $toggleSelectionStyles(editor, styles), COMMAND_PRIORITY_NORMAL),
          editor.registerCommand(REMOVE_HIGHLIGHT_COMMAND, () => $toggleSelectionStyles(editor, BLANK_STYLES), COMMAND_PRIORITY_NORMAL),
          editor.registerNodeTransform(TextNode, $syncHighlightWithStyle),
          editor.registerNodeTransform(CodeHighlightNode, $syncHighlightWithCodeHighlightNode),
          editor.registerNodeTransform(TextNode, (textNode) => $canonicalizePastedStyles(textNode, canonicalizers))
        )
      }
    });

    return [ extension, this.editorConfig.get("highlight") ]
  }
}

function $applyHighlightStyle(textNode, element) {
  const elementStyles = {
    color: element.style?.color,
    "background-color": element.style?.backgroundColor
  };

  if ($hasUpdateTag(PASTE_TAG)) { $setPastedStyles(textNode); }
  const highlightStyle = getCSSFromStyleObject(elementStyles);

  if (highlightStyle.length) {
    return textNode.setStyle(textNode.getStyle() + highlightStyle)
  }
}

function $markConversion() {
  return {
    conversion: extendTextNodeConversion("mark", $applyHighlightStyle),
    priority: 1
  }
}

// Register a custom <pre> converter directly in the editor's HTML conversion
// cache. We can't use the extension-level html.import because Object.assign
// merges all extensions' converters by tag, and a later extension (e.g.
// TrixContentExtension) would overwrite ours.
function $registerPreConversion(editor) {
  if (!editor._htmlConversions) return

  let preEntries = editor._htmlConversions.get("pre");
  if (!preEntries) {
    preEntries = [];
    editor._htmlConversions.set("pre", preEntries);
  }
  preEntries.push($preConversionWithHighlightsFactory(editor));
}

// Returns a <pre> converter factory scoped to a specific editor instance.
// The factory extracts highlight ranges from <mark> elements before the code
// retokenizer can destroy them. The ranges are stored in pendingCodeHighlights
// and restored by the highlight-preserving tokenizer during retokenization.
function $preConversionWithHighlightsFactory(editor) {
  return function $preConversionWithHighlights(domNode) {
    const highlights = extractHighlightRanges(domNode);
    if (highlights.length === 0) return null

    return {
      conversion: (domNode) => {
        const language = domNode.getAttribute("data-language");
        const codeNode = $createCodeNode(language);
        $getPendingHighlights(editor).set(codeNode.getKey(), highlights);
        return { node: codeNode }
      },
      priority: 2
    }
  }
}

// Walk the DOM tree inside a <pre> element and build a list of
// { start, end, style } ranges for every <mark> element found.
function extractHighlightRanges(preElement) {
  const ranges = [];
  const codeElement = preElement.querySelector("code") || preElement;

  let offset = 0;

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      offset += node.textContent.length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // <br> maps to a LineBreakNode (1 character) in Lexical
      if (node.tagName === "BR") {
        offset += 1;
        return
      }

      const isMark = node.tagName === "MARK";
      const start = offset;

      for (const child of node.childNodes) {
        walk(child);
      }

      if (isMark) {
        const style = extractHighlightStyleFromElement(node);
        if (style) {
          ranges.push({ start, end: offset, style });
        }
      }
    }
  }

  for (const child of codeElement.childNodes) {
    walk(child);
  }

  return ranges
}

function $getPendingHighlights(editor) {
  let map = pendingCodeHighlights.get(editor);
  if (!map) {
    map = new Map();
    pendingCodeHighlights.set(editor, map);
  }
  return map
}

function extractHighlightStyleFromElement(element) {
  const styles = {};
  if (element.style?.color) styles.color = element.style.color;
  if (element.style?.backgroundColor) styles["background-color"] = element.style.backgroundColor;
  const css = getCSSFromStyleObject(styles);
  return css.length > 0 ? css : null
}

// The code retokenizer replaces a code block's children with freshly created
// tokens that carry no styles, which would drop color highlights on every
// edit. This tokenizer wraps the stock Prism tokenizer to restore them: it
// recovers the block's highlight ranges — staged during HTML import, or read
// from the children the fresh tokens are about to replace — and reapplies
// them to the fresh tokens before the retokenizer splices them in.
function buildHighlightPreservingTokenizer(editor) {
  return {
    defaultLanguage: PrismTokenizer.defaultLanguage,
    tokenize(code, language) {
      return PrismTokenizer.tokenize(code, language)
    },
    $tokenize(codeNode, language) {
      const tokens = PrismTokenizer.$tokenize(codeNode, language);
      const highlights = $takeHighlightRanges(editor, codeNode);
      return $applyHighlightRangesToTokens(tokens, highlights)
    }
  }
}

function $takeHighlightRanges(editor, codeNode) {
  const pending = $getPendingHighlights(editor);
  const key = codeNode.getKey();

  if (pending.has(key)) {
    const highlights = pending.get(key);
    pending.delete(key);
    return highlights
  } else if (codeNode.getChildren().some($isCodeHighlightNode)) {
    return $extractHighlightRangesFromCodeNode(codeNode)
  } else {
    // A block that was never tokenized has only plain text children. Styles
    // on those come from import paths that didn't stage ranges (e.g. colored
    // spans in Trix HTML), and the first tokenization discards them.
    return []
  }
}

function $applyHighlightRangesToTokens(tokens, highlights) {
  if (highlights.length === 0) return tokens

  const styledTokens = [];
  let offset = 0;

  for (const token of tokens) {
    if ($isCodeHighlightNode(token)) {
      styledTokens.push(...$splitTokenAtHighlightBoundaries(token, offset, highlights));
    } else {
      styledTokens.push(token);
    }
    offset += token.getTextContentSize();
  }

  return styledTokens
}

// Split a token into segments at highlight boundaries, styling the covered
// segments. We can't use TextNode.splitText() because the fresh tokens aren't
// attached to the tree yet, so we create CodeHighlightNode replacements.
function $splitTokenAtHighlightBoundaries(token, tokenStart, highlights) {
  const text = token.getTextContent();
  const segments = segmentTextByHighlights(text, tokenStart, highlights);

  if (segments.length === 1) {
    const [ segment ] = segments;
    if (segment.style) {
      $applyHighlightStyleToToken(token, segment.style);
    }
    return [ token ]
  } else {
    return segments.map((segment) => {
      const segmentToken = $createCodeHighlightNode(text.slice(segment.start, segment.end), token.getHighlightType());
      if (segment.style) {
        $applyHighlightStyleToToken(segmentToken, segment.style);
      }
      return segmentToken
    })
  }
}

// Partition a token's text into consecutive { start, end, style } segments,
// where offsets are relative to the token and style is null for the stretches
// no highlight covers.
function segmentTextByHighlights(text, tokenStart, highlights) {
  const segments = [];
  let cursor = 0;

  for (const { start, end, style } of highlights) {
    const from = Math.max(start - tokenStart, cursor);
    const to = Math.min(end - tokenStart, text.length);

    if (from < to) {
      if (from > cursor) {
        segments.push({ start: cursor, end: from, style: null });
      }
      segments.push({ start: from, end: to, style });
      cursor = to;
    }
  }

  if (cursor < text.length) {
    segments.push({ start: cursor, end: text.length, style: null });
  }

  return segments
}

function $applyHighlightStyleToToken(token, style) {
  token.setStyle(style);
  $setCodeHighlightFormat(token, true);
}

function $buildChildRanges(codeNode) {
  const childRanges = [];
  let charOffset = 0;

  for (const child of codeNode.getChildren()) {
    if ($isCodeHighlightNode(child) || $isTextNode(child)) {
      const text = child.getTextContent();
      childRanges.push({ node: child, start: charOffset, end: charOffset + text.length });
      charOffset += text.length;
    } else {
      // LineBreakNode, TabNode - count as 1 character each (\n, \t)
      charOffset += 1;
    }
  }

  return childRanges
}

// Extract highlight ranges from the Lexical node tree of a CodeNode.
// This mirrors extractHighlightRanges (which works on DOM elements during
// HTML import) but reads from live CodeHighlightNode children instead.
function $extractHighlightRangesFromCodeNode(codeNode) {
  const ranges = [];
  const childRanges = $buildChildRanges(codeNode);

  for (const { node, start, end } of childRanges) {
    const style = node.getStyle();
    if (style && hasHighlightStyles(style)) {
      ranges.push({ start, end, style });
    }
  }

  return ranges
}

function buildCanonicalizers(config) {
  return [
    new StyleCanonicalizer("color", [ ...config.buttons.color, ...config.permit.color ]),
    new StyleCanonicalizer("background-color", [ ...config.buttons["background-color"], ...config.permit["background-color"] ])
  ]
}

function $toggleSelectionStyles(editor, styles) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return

  const patch = {};
  for (const property in styles) {
    const oldValue = $getSelectionStyleValueForProperty(selection, property);
    patch[property] = toggleOrReplace(oldValue, styles[property]);
  }

  if ($selectionIsInCodeBlock(selection)) {
    $patchCodeHighlightStyles(editor, selection, patch);
  } else {
    $patchStyleText(selection, patch);
  }
}

function $selectionIsInCodeBlock(selection) {
  const nodes = selection.getNodes();
  return nodes.some((node) => {
    // A text node inside a code block may be either a CodeHighlightNode
    // (after retokenization) or a plain TextNode (after splitText or before
    // the retokenizer has run). Check the parent in both cases.
    if ($isCodeHighlightNode(node) || $isTextNode(node)) {
      return $isCodeNode(node.getParent())
    }
    return $isCodeNode(node)
  })
}

function $patchCodeHighlightStyles(editor, selection, patch) {
  // Capture selection state and node keys before the nested update.
  // Accept both CodeHighlightNode and TextNode children of a CodeNode
  // because splitText creates TextNode instances and the retokenizer
  // may not have converted them back to CodeHighlightNodes yet.
  const nodeKeys = selection.getNodes()
    .filter((node) => ($isCodeHighlightNode(node) || $isTextNode(node)) && $isCodeNode(node.getParent()))
    .map((node) => ({
      key: node.getKey(),
      startOffset: $getNodeSelectionOffsets(node, selection)[0],
      endOffset: $getNodeSelectionOffsets(node, selection)[1],
      textSize: node.getTextContentSize()
    }));

  // Use skipTransforms so the retokenizer doesn't rebuild the block in the
  // middle of the toggle, and discrete to force a synchronous commit so the
  // styles are in place before editor.focus() triggers a second update cycle.
  editor.update(() => {
    for (const { key, startOffset, endOffset, textSize } of nodeKeys) {
      const node = $getNodeByKey(key);
      if (!node) continue

      const parent = node.getParent();
      if (!$isCodeNode(parent)) continue
      if (startOffset === endOffset) continue

      if (startOffset === 0 && endOffset === textSize) {
        $applyStylePatchToNode(node, patch);
      } else {
        const splitNodes = node.splitText(startOffset, endOffset);
        const targetNode = splitNodes[startOffset === 0 ? 0 : 1];
        $applyStylePatchToNode(targetNode, patch);
      }
    }
  }, { skipTransforms: true, discrete: true });
}

function $getNodeSelectionOffsets(node, selection) {
  const nodeKey = node.getKey();
  const anchorKey = selection.anchor.key;
  const focusKey = selection.focus.key;
  const textSize = node.getTextContentSize();

  const isAnchor = nodeKey === anchorKey;
  const isFocus = nodeKey === focusKey;

  // Determine if selection is forward or backward
  const isForward = selection.isBackward() === false;

  let start = 0;
  let end = textSize;

  if (isForward) {
    if (isAnchor) start = selection.anchor.offset;
    if (isFocus) end = selection.focus.offset;
  } else {
    if (isFocus) start = selection.focus.offset;
    if (isAnchor) end = selection.anchor.offset;
  }

  return [ start, end ]
}

function $applyStylePatchToNode(node, patch) {
  const prevStyles = getStyleObjectFromCSS(node.getStyle());
  const newStyles = { ...prevStyles };

  for (const [ key, value ] of Object.entries(patch)) {
    if (value === null) {
      delete newStyles[key];
    } else {
      newStyles[key] = value;
    }
  }

  const newCSSText = getCSSFromStyleObject(newStyles);
  node.setStyle(newCSSText);

  // Sync the highlight format using TextNode's setFormat to bypass
  // CodeHighlightNode's no-op override
  const shouldHaveHighlight = hasHighlightStyles(newCSSText);
  const hasHighlight = node.hasFormat("highlight");

  if (shouldHaveHighlight !== hasHighlight) {
    $setCodeHighlightFormat(node, shouldHaveHighlight);
  }
}

function $setCodeHighlightFormat(node, shouldHaveHighlight) {
  const writable = node.getWritable();
  const IS_HIGHLIGHT = 1 << 7;

  if (shouldHaveHighlight) {
    writable.__format |= IS_HIGHLIGHT;
  } else {
    writable.__format &= ~IS_HIGHLIGHT;
  }
}

function toggleOrReplace(oldValue, newValue) {
  return oldValue === newValue ? null : newValue
}

function $syncHighlightWithStyle(textNode) {
  if (hasHighlightStyles(textNode.getStyle()) !== textNode.hasFormat("highlight")) {
    textNode.toggleFormat("highlight");
  }
}

function $syncHighlightWithCodeHighlightNode(node) {
  const parent = node.getParent();
  if (!$isCodeNode(parent)) return

  const shouldHaveHighlight = hasHighlightStyles(node.getStyle());
  const hasHighlight = node.hasFormat("highlight");

  if (shouldHaveHighlight !== hasHighlight) {
    $setCodeHighlightFormat(node, shouldHaveHighlight);
  }
}

function $canonicalizePastedStyles(textNode, canonicalizers = []) {
  if ($hasPastedStyles(textNode)) {
    $setPastedStyles(textNode, false);

    const canonicalizedCSS = applyCanonicalizers(textNode.getStyle(), canonicalizers);
    textNode.setStyle(canonicalizedCSS);

    const selection = $getSelection();
    if (textNode.isSelected(selection)) {
      selection.setStyle(textNode.getStyle());
      selection.setFormat(textNode.getFormat());
    }
  }
}

function $setPastedStyles(textNode, value = true) {
  $setState(textNode, hasPastedStylesState, value);
}

function $hasPastedStyles(textNode) {
  return $getState(textNode, hasPastedStylesState)
}

const COMMANDS = [
  "bold",
  "italic",
  "strikethrough",
  "underline",
  "link",
  "unlink",
  "toggleHighlight",
  "removeHighlight",
  "setFormatHeadingLarge",
  "setFormatHeadingMedium",
  "setFormatHeadingSmall",
  "setFormatParagraph",
  "applyHeadingFormat",
  "clearFormatting",
  "insertUnorderedList",
  "insertOrderedList",
  "insertQuoteBlock",
  "insertCodeBlock",
  "setCodeLanguage",
  "insertHorizontalDivider",
  "uploadImage",
  "uploadFile",

  "insertTable",

  "undo",
  "redo"
];

class CommandDispatcher {
  #selectionBeforeDrag = null
  #listeners = new ListenerBin()

  static configureFor(editorElement) {
    return new CommandDispatcher(editorElement)
  }

  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
    this.selection = editorElement.selection;
    this.contents = editorElement.contents;

    this.#registerCommands();
    this.#registerKeyboardCommands();
    this.#registerDragAndDropHandlers();
  }

  dispatchBold() {
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  }

  dispatchItalic() {
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  }

  dispatchStrikethrough() {
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
  }

  dispatchUnderline() {
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  }

  dispatchToggleHighlight(styles) {
    this.editor.dispatchCommand(TOGGLE_HIGHLIGHT_COMMAND, styles);
  }

  dispatchRemoveHighlight() {
    this.editor.dispatchCommand(REMOVE_HIGHLIGHT_COMMAND);
  }

  dispatchLink(url) {
    this.editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return

      const anchorNode = selection.anchor.getNode();

      if (selection.isCollapsed() && !$getNearestNodeOfType(anchorNode, LinkNode)) {
        const autoLinkNode = $createAutoLinkNode(url);
        const textNode = $createTextNode(url);
        autoLinkNode.append(textNode);
        selection.insertNodes([ autoLinkNode ]);
      } else {
        $toggleLink(url);
      }
    });
  }

  dispatchUnlink() {
    this.editor.update(() => {
      // Let adapters signal whether unlink should target a frozen link key.
      if (this.editorElement.adapter.unlinkFrozenNode?.()) {
        return
      }

      $toggleLink(null);
    });
  }

  dispatchInsertUnorderedList() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode();

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "bullet") {
      this.contents.applyParagraphFormat();
    } else {
      this.contents.applyUnorderedListFormat();
    }
  }

  dispatchInsertOrderedList() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode();

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "number") {
      this.contents.applyParagraphFormat();
    } else {
      this.contents.applyOrderedListFormat();
    }
  }

  dispatchInsertQuoteBlock() {
    this.contents.toggleBlockquote();
  }

  dispatchInsertCodeBlock() {
    if (this.selection.hasSelectedWordsInSingleLine) {
      this.#toggleInlineCode();
    } else {
      this.contents.toggleCodeBlock();
    }
  }

  #toggleInlineCode() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    if (!selection.isCollapsed()) {
      const textNodes = selection.getNodes().filter($isTextNode);
      const applyingCode = !textNodes.every((node) => node.hasFormat("code"));

      if (applyingCode) {
        this.#stripInlineFormattingFromSelection(selection, textNodes);
      }
    }

    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
  }

  // Strip all inline formatting (bold, italic, etc.) from the selected text
  // nodes so that applying code produces a single merged <code> element instead
  // of one per differently-formatted span.
  #stripInlineFormattingFromSelection(selection, textNodes) {
    const isBackward = selection.isBackward();
    const startPoint = isBackward ? selection.focus : selection.anchor;
    const endPoint = isBackward ? selection.anchor : selection.focus;

    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      if (node.getFormat() === 0) continue

      const isFirst = i === 0;
      const isLast = i === textNodes.length - 1;
      const startOffset = isFirst && startPoint.type === "text" ? startPoint.offset : 0;
      const endOffset = isLast && endPoint.type === "text" ? endPoint.offset : node.getTextContentSize();

      if (startOffset === 0 && endOffset === node.getTextContentSize()) {
        node.setFormat(0);
      } else {
        const splits = node.splitText(startOffset, endOffset);
        const target = startOffset === 0 ? splits[0] : splits[1];
        target.setFormat(0);

        if (isFirst && startPoint.type === "text") {
          startPoint.set(target.getKey(), 0, "text");
        }
        if (isLast && endPoint.type === "text") {
          endPoint.set(target.getKey(), endOffset - startOffset, "text");
        }
      }
    }
  }

  dispatchSetCodeLanguage(language) {
    this.editor.update(() => {
      if (!this.selection.isInsideCodeBlock) return

      const codeNode = this.selection.nearestNodeOfType(CodeNode);
      if (!codeNode) return

      codeNode.setLanguage(language);
    });
  }

  dispatchInsertHorizontalDivider() {
    $insertNodeToNearestRoot(new HorizontalDividerNode);
  }

  dispatchSetFormatHeadingLarge() {
    this.#applyConfiguredHeadingFormat(0);
  }

  dispatchSetFormatHeadingMedium() {
    this.#applyConfiguredHeadingFormat(1);
  }

  dispatchSetFormatHeadingSmall() {
    this.#applyConfiguredHeadingFormat(2);
  }

  dispatchSetFormatParagraph() {
    this.contents.applyParagraphFormat();
  }

  dispatchApplyHeadingFormat(tag) {
    this.contents.applyHeadingFormat(tag);
  }

  dispatchClearFormatting() {
    this.contents.clearFormatting();
  }

  dispatchUploadImage() {
    this.#dispatchUploadAttachment("image/*,video/*");
  }

  dispatchUploadFile() {
    this.#dispatchUploadAttachment();
  }

  #dispatchUploadAttachment(accept = null) {
    const attributes = {
      type: "file",
      multiple: true,
      style: "display: none;",
      onchange: ({ target: { files } }) => {
        this.contents.uploadFiles(files, { selectLast: true });
      }
    };

    if (accept) attributes.accept = accept;

    const input = createElement("input", attributes);

    // Append and remove to make testable
    this.editorElement.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 1000);
  }

  dispatchInsertTable() {
    this.editor.dispatchCommand(INSERT_TABLE_COMMAND, { "rows": 3, "columns": 3, "includeHeaders": true });
  }

  dispatchUndo() {
    this.editor.dispatchCommand(UNDO_COMMAND, undefined);
  }

  dispatchRedo() {
    this.editor.dispatchCommand(REDO_COMMAND, undefined);
  }

  dispose() {
    this.#listeners.dispose();
  }

  #applyConfiguredHeadingFormat(index) {
    const tag = this.editorElement.config.get("headings")[index];
    if (tag) this.contents.applyHeadingFormat(tag);
  }

  #registerCommands() {
    for (const command of COMMANDS) {
      const methodName = `dispatch${capitalize(command)}`;
      this.#registerCommandHandler(command, 0, this[methodName].bind(this));
    }
  }

  #registerCommandHandler(command, priority, handler) {
    this.#listeners.track(this.editor.registerCommand(command, handler, priority));
  }

  #registerKeyboardCommands() {
    this.#registerCommandHandler(KEY_ARROW_RIGHT_COMMAND, COMMAND_PRIORITY_NORMAL, this.#handleArrowRightKey.bind(this));
    this.#registerCommandHandler(KEY_TAB_COMMAND, COMMAND_PRIORITY_NORMAL, this.#handleTabKey.bind(this));

    // Run before Lexical's built-in insert handlers to descend an element point on a
    // block container to a leaf, avoiding error #211 on Enter / Shift+Enter in a quote.
    this.#registerCommandHandler(INSERT_LINE_BREAK_COMMAND, COMMAND_PRIORITY_HIGH, this.#normalizeBlockContainerSelection.bind(this));
    this.#registerCommandHandler(INSERT_PARAGRAPH_COMMAND, COMMAND_PRIORITY_HIGH, this.#normalizeBlockContainerSelection.bind(this));
  }

  #normalizeBlockContainerSelection() {
    $normalizeBlockContainerSelection();
    return false
  }

  #handleArrowRightKey(event) {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
    if (this.selection.isInsideCodeBlock || !selection.hasFormat("code")) return false

    const anchorNode = selection.anchor.getNode();
    if (!$isTextNode(anchorNode) || selection.anchor.offset !== anchorNode.getTextContentSize()) return false
    if (anchorNode.getNextSibling() !== null) return false

    event.preventDefault();
    selection.toggleFormat("code");
    return true
  }

  #registerDragAndDropHandlers() {
    if (this.editorElement.supportsAttachments) {
      this.dragCounter = 0;
      this.#listeners.track(
        this.editor.registerRootListener((rootElement) => {
          if (rootElement) {
            const teardowns = [
              registerEventListener(rootElement, "dragover", this.#handleDragOver.bind(this)),
              registerEventListener(rootElement, "drop", this.#handleDrop.bind(this)),
              registerEventListener(rootElement, "dragenter", this.#handleDragEnter.bind(this)),
              registerEventListener(rootElement, "dragleave", this.#handleDragLeave.bind(this))
            ];
            return () => teardowns.forEach((teardown) => teardown())
          }
        })
      );
    }
  }

  #handleDragEnter(event) {
    if (this.#isInternalDrag(event)) return

    this.dragCounter++;
    if (this.dragCounter === 1) {
      this.#saveSelectionBeforeDrag();
      this.editor.getRootElement().classList.add("lexxy-editor--drag-over");
    }
  }

  #handleDragLeave(event) {
    if (this.#isInternalDrag(event)) return

    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.#selectionBeforeDrag = null;
      this.editor.getRootElement().classList.remove("lexxy-editor--drag-over");
    }
  }

  #handleDragOver(event) {
    if (this.#isInternalDrag(event)) return

    event.preventDefault();
  }

  #handleDrop(event) {
    if (this.#isInternalDrag(event)) return

    event.preventDefault();

    this.dragCounter = 0;
    this.editor.getRootElement().classList.remove("lexxy-editor--drag-over");

    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) return

    const files = Array.from(dataTransfer.files);
    if (!files.length) return

    this.#restoreSelectionBeforeDrag();
    this.contents.uploadFiles(files, { selectLast: true });

    this.editor.focus();
  }

  #saveSelectionBeforeDrag() {
    this.editor.getEditorState().read(() => {
      this.#selectionBeforeDrag = $getSelection()?.clone();
    });
  }

  #restoreSelectionBeforeDrag() {
    if (!this.#selectionBeforeDrag) return

    this.editor.update(() => {
      $setSelection(this.#selectionBeforeDrag);
    });

    this.#selectionBeforeDrag = null;
  }

  #isInternalDrag(event) {
    return event.dataTransfer?.types.some((type) => type.startsWith("application/x-lexxy-"))
  }

  #handleTabKey(event) {
    if (this.selection.isInsideList) {
      return this.#handleTabForList(event)
    } else if (this.selection.isInsideCodeBlock) {
      return this.#handleTabForCode()
    }
    return false
  }

  #handleTabForList(event) {
    if (event.shiftKey && !this.selection.isIndentedList) return false

    event.preventDefault();
    const command = event.shiftKey? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND;
    return this.editor.dispatchCommand(command)
  }

  #handleTabForCode() {
    const selection = $getSelection();
    return $isRangeSelection(selection) && selection.isCollapsed()
  }

}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

class Selection {
  #listeners = new ListenerBin()

  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editorContentElement = editorElement.editorContentElement;
    this.editor = this.editorElement.editor;
    this.previouslySelectedKeys = new Set();

    this.#listenForNodeSelections();
    this.#processSelectionChangeCommands();
    this.#containEditorFocus();
    this.#clearStaleInlineCodeFormat();
  }

  get hasNodeSelection() {
    return this.editor.getEditorState().read(() => {
      const selection = $getSelection();
      return selection !== null && $isNodeSelection(selection)
    })
  }

  get cursorPosition() {
    let position = null;

    this.editor.getEditorState().read(() => {
      const range = this.#getValidSelectionRange();
      if (!range) return

      const rect = this.#getReliableRectFromRange(range);
      if (this.#isRectUnreliable(rect)) return

      position = this.#calculateCursorPosition(rect, range);
    });

    return position
  }

  placeCursorAtTheEnd() {
    this.editor.update(() => {
      const root = $getRoot();
      const lastDescendant = root.getLastDescendant();

      if (lastDescendant && $isTextNode(lastDescendant)) {
        lastDescendant.selectEnd();
      } else {
        root.selectEnd();
      }
    });
  }

  selectedNodeWithOffset() {
    const selection = $getSelection();
    if (!selection) return { node: null, offset: 0 }

    if ($isRangeSelection(selection)) {
      return {
        node: selection.anchor.getNode(),
        offset: selection.anchor.offset
      }
    } else if ($isNodeSelection(selection)) {
      const [ node ] = selection.getNodes();
      return {
        node,
        offset: 0
      }
    }

    return { node: null, offset: 0 }
  }

  getFormat() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return {}

    const anchorNode = selection.anchor.getNode();
    if (!anchorNode.getParent()) return {}

    const topLevelElement = anchorNode.getTopLevelElementOrThrow();
    const listType = getListType(anchorNode);
    const headingNode = this.#getNearestHeadingNode(anchorNode);

    return {
      isBold: selection.hasFormat("bold"),
      isItalic: selection.hasFormat("italic"),
      isStrikethrough: selection.hasFormat("strikethrough"),
      isUnderline: selection.hasFormat("underline"),
      isHighlight: isSelectionHighlighted(selection),
      isInLink: $getNearestNodeOfType(anchorNode, LinkNode) !== null,
      isInQuote: $isQuoteNode(topLevelElement),
      isInHeading: headingNode !== null,
      isInCode: this.#isInCode(selection, anchorNode),
      headingTag: headingNode?.getTag() ?? null,
      isInList: listType !== null,
      listType,
      isInTable: $getTableCellNodeFromLexicalNode(anchorNode) !== null
    }
  }

  nearestNodeOfType(nodeType) {
    const anchorNode = $getSelection()?.anchor?.getNode();
    return $getNearestNodeOfType(anchorNode, nodeType)
  }

  get hasSelectedWordsInSingleLine() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return false

    if (selection.isCollapsed()) return false

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    if (anchorNode.getTopLevelElement() !== focusNode.getTopLevelElement()) {
      return false
    }

    const anchorElement = anchorNode.getTopLevelElement();
    if (!anchorElement) return false

    // When anchor and focus are in different block-level children of the same
    // top-level element (e.g. two paragraphs inside a blockquote), this is a
    // multi-line selection, not a single-line one.
    const anchorBlock = $isElementNode(anchorNode) ? anchorNode : anchorNode.getParent();
    const focusBlock = $isElementNode(focusNode) ? focusNode : focusNode.getParent();
    if (anchorBlock !== focusBlock && anchorBlock !== anchorElement) {
      return false
    }

    const nodes = selection.getNodes();
    for (const node of nodes) {
      if ($isLineBreakNode(node)) {
        return false
      }
    }

    return true
  }

  get isInsideList() {
    return this.nearestNodeOfType(ListItemNode)
  }

  get isInsideBlockQuote() {
    return this.nearestNodeOfType(QuoteNode)
  }

  get isIndentedList() {
    const closestListNode = this.nearestNodeOfType(ListNode);
    return closestListNode && ($getListDepth(closestListNode) > 1)
  }

  get isInsideCodeBlock() {
    return this.nearestNodeOfType(CodeNode) !== null
  }

  get isTableCellSelected() {
    const selection = $getSelection();
    const { anchor, focus } = selection;
    if (!$isRangeSelection(selection) || anchor.key !== focus.key) return false

    return this.nearestNodeOfType(TableCellNode) !== null
  }

  get isOnPreviewableImage() {
    return this.previewableImageNode != null
  }

  get previewableImageNode() {
    const firstNode = $getSelection()?.getNodes().at(0);
    return $isActionTextAttachmentNode(firstNode) && firstNode.isPreviewableImage ? firstNode : null
  }

  get isAtNodeStart() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    return anchorNode && offset === 0
  }

  get nodeAfterCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if ($isTextNode(anchorNode)) {
      return this.#getNodeAfterTextNode(anchorNode, offset)
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeAfterElementNode(anchorNode, offset)
    }

    return this.#findNextSiblingUp(anchorNode)
  }

  get topLevelNodeAfterCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if ($isTextNode(anchorNode)) {
      if (offset === anchorNode.getTextContentSize()) return this.#getNextNodeFromTextEnd(anchorNode)
      if (this.#isCursorOnLastVisualLineOfBlock(anchorNode)) {
        const topLevelElement = anchorNode.getTopLevelElement();
        return topLevelElement ? topLevelElement.getNextSibling() : null
      }
      return null
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeAfterElementNode(anchorNode, offset)
    }

    return this.#findNextSiblingUp(anchorNode)
  }

  get nodeBeforeCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if ($isTextNode(anchorNode)) {
      return this.#getNodeBeforeTextNode(anchorNode, offset)
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  get topLevelNodeBeforeCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if ($isTextNode(anchorNode)) {
      if (offset === 0) return this.#getPreviousNodeFromTextStart(anchorNode)
      if (this.#isCursorOnFirstVisualLineOfBlock(anchorNode)) {
        const topLevelElement = anchorNode.getTopLevelElement();
        return topLevelElement ? topLevelElement.getPreviousSibling() : null
      }
      return null
    }

    if ($isElementNode(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  dispose() {
    this.editorElement = null;
    this.editorContentElement = null;
    this.editor = null;
    this.previouslySelectedKeys = null;

    this.#listeners.dispose();
  }

  // When all inline code text is deleted, Lexical's selection retains the stale
  // code format flag. Verify the flag is backed by actual code-formatted content:
  // a code block ancestor or a text node that carries the code format.
  #isInCode(selection, anchorNode) {
    if ($getNearestNodeOfType(anchorNode, CodeNode) !== null) return true
    if (!selection.hasFormat("code")) return false

    return $isTextNode(anchorNode) && anchorNode.hasFormat("code")
  }

  // After deleting all inline code text, Lexical preserves the code format on
  // the selection even though no code-formatted content remains. This listener
  // detects that stale state and clears it so newly typed text won't be
  // code-formatted.
  #clearStaleInlineCodeFormat() {
    this.#listeners.track(this.editor.registerUpdateListener(({ editorState, tags }) => {
      if (tags.has("history-merge") || tags.has("skip-dom-selection")) return

      let isStale = false;

      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return
        if (!selection.hasFormat("code")) return

        const anchorNode = selection.anchor.getNode();
        if (this.#isInCode(selection, anchorNode)) return

        isStale = true;
      });

      if (isStale) {
        setTimeout(() => {
          this.editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection) || !selection.hasFormat("code")) return

            const anchorNode = selection.anchor.getNode();
            if (this.#isInCode(selection, anchorNode)) return

            selection.toggleFormat("code");
          });
        }, 0);
      }
    }));
  }

  get #currentlySelectedKeys() {
    if (this.currentlySelectedKeys) { return this.currentlySelectedKeys }

    this.currentlySelectedKeys = new Set();

    const selection = $getSelection();
    if (selection && $isNodeSelection(selection)) {
      for (const node of selection.getNodes()) {
        this.currentlySelectedKeys.add(node.getKey());
      }
    }

    return this.currentlySelectedKeys
  }

  #processSelectionChangeCommands() {
    this.#listeners.track(
      this.editor.registerCommand(KEY_ARROW_LEFT_COMMAND, handlingDefault(this.#selectPreviousNode.bind(this)), COMMAND_PRIORITY_LOW),
      this.editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, handlingDefault(this.#selectNextNode.bind(this)), COMMAND_PRIORITY_LOW),
      this.editor.registerCommand(KEY_ARROW_UP_COMMAND, handlingDefault(this.#selectPreviousTopLevelNode.bind(this)), COMMAND_PRIORITY_LOW),
      this.editor.registerCommand(KEY_ARROW_DOWN_COMMAND, handlingDefault(this.#selectNextTopLevelNode.bind(this)), COMMAND_PRIORITY_LOW),

      this.editor.registerCommand(DELETE_CHARACTER_COMMAND, this.#selectDecoratorNodeBeforeDeletion.bind(this), COMMAND_PRIORITY_LOW),

      this.editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
        this.#syncSelectedClasses();
      }, COMMAND_PRIORITY_LOW),

      this.editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
        this.#preserveFocusOfOtherFields();
        return false
      }, COMMAND_PRIORITY_CRITICAL)
    );
  }

  // Firefox (152+) keeps window.getSelection() anchored inside the editor after focus
  // moves to another field, and fires document selectionchange for every keystroke
  // typed there. Lexical reads that stale selection, reconciles, and pulls focus back
  // into the editor — stealing it mid-typing. When another text-entry field owns focus,
  // tag the update so Lexical leaves the DOM selection (and with it, focus) alone.
  #preserveFocusOfOtherFields() {
    if (this.#anotherFieldIsFocused) {
      $addUpdateTag(SKIP_DOM_SELECTION_TAG);
    }
  }

  get #anotherFieldIsFocused() {
    const rootElement = this.editor.getRootElement();
    const activeElement = rootElement?.ownerDocument.activeElement;

    return activeElement && !rootElement.contains(activeElement) &&
      (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable)
  }

  #listenForNodeSelections() {
    this.#listeners.track(this.editor.registerCommand(CLICK_COMMAND, ({ target }) => {
      if (!isDOMNode(target)) return false

      const targetNode = $getNearestNodeFromDOMNode(target);
      return $isDecoratorNode(targetNode) && this.#selectInLexical(targetNode)
    }, COMMAND_PRIORITY_LOW));

    this.#listeners.track(
      this.editor.registerRootListener((rootElement) => {
        if (rootElement) {
          return registerEventListener(rootElement, "lexxy:internal:move-to-next-line", () => this.#selectOrAppendNextLine())
        }
      })
    );
  }

  #containEditorFocus() {
    // Workaround for a bizarre Chrome bug where the cursor abandons the editor to focus on not-focusable elements
    // above when navigating UP/DOWN when Lexical shows its fake cursor on custom decorator nodes.
    this.#listeners.track(
      this.editor.registerRootListener((rootElement) => {
        if (rootElement) {
          const handler = (event) => this.#handleArrowKeyOnLexicalCursor(event);
          rootElement.addEventListener("keydown", handler, true);
          return () => rootElement.removeEventListener("keydown", handler, true)
        }
      })
    );
  }

  #handleArrowKeyOnLexicalCursor(event) {
    if (event.key === "ArrowUp") {
      const lexicalCursor = this.editor.getRootElement().querySelector("[data-lexical-cursor]");

      if (lexicalCursor) {
        let currentElement = lexicalCursor.previousElementSibling;
        while (currentElement && currentElement.hasAttribute("data-lexical-cursor")) {
          currentElement = currentElement.previousElementSibling;
        }

        if (!currentElement) {
          event.preventDefault();
        }
      }
    }

    if (event.key === "ArrowDown") {
      const lexicalCursor = this.editor.getRootElement().querySelector("[data-lexical-cursor]");

      if (lexicalCursor) {
        let currentElement = lexicalCursor.nextElementSibling;
        while (currentElement && currentElement.hasAttribute("data-lexical-cursor")) {
          currentElement = currentElement.nextElementSibling;
        }

        if (!currentElement) {
          event.preventDefault();
        }
      }
    }
  }

  #syncSelectedClasses() {
    this.#clearPreviouslyHighlightedItems();
    this.#highlightNewItems();

    this.previouslySelectedKeys = this.#currentlySelectedKeys;
    this.currentlySelectedKeys = null;
  }

  #clearPreviouslyHighlightedItems() {
    for (const key of this.previouslySelectedKeys) {
      if (!this.#currentlySelectedKeys.has(key)) {
        const dom = this.editor.getElementByKey(key);
        if (dom) dom.classList.remove("node--selected");
      }
    }
  }

  #highlightNewItems() {
    for (const key of this.#currentlySelectedKeys) {
      if (!this.previouslySelectedKeys.has(key)) {
        const nodeElement = this.editor.getElementByKey(key);
        if (nodeElement) nodeElement.classList.add("node--selected");
      }
    }
  }

  #selectPreviousNode(event) {
    if (event.shiftKey) {
      return this.#withCurrentNodeSelectionNode((currentNode) => {
        const selection = this.#rangeSelectDecorator(currentNode, "forward");

        // Can't rely on native pass-through with Playwright on firefox
        selection.modify("extend", true, "character");
        return true
      })
    } else {
      return this.#withCurrentNodeSelectionNode((currentNode) => currentNode.selectPrevious())
        || this.#selectInLexical(this.nodeBeforeCursor)
    }
  }

  #selectNextNode(event) {
    if (event.shiftKey) {
      return this.#withCurrentNodeSelectionNode((currentNode) => {
        const selection = this.#rangeSelectDecorator(currentNode, "forward");

        // Can't rely on native pass-through with Playwright on firefox
        selection.modify("extend", false, "character");
        return true
      })
    } else {
      return this.#withCurrentNodeSelectionNode((currentNode) => currentNode.selectNext(0, 0))
        || this.#selectInLexical(this.nodeAfterCursor)
    }
  }

  #selectPreviousTopLevelNode() {
    return this.#withCurrentNodeSelectionNode((currentNode) => currentNode.getTopLevelElement().selectPrevious())
      || this.#selectInLexical(this.topLevelNodeBeforeCursor)
  }

  #selectNextTopLevelNode() {
    return this.#withCurrentNodeSelectionNode((currentNode) => currentNode.getTopLevelElement().selectNext(0, 0))
      || this.#selectInLexical(this.topLevelNodeAfterCursor)
  }

  #withCurrentNodeSelectionNode(fn) {
    if (this.hasNodeSelection) {
      return fn($getSelection().getNodes()[0])
    }
  }

  #rangeSelectDecorator(node, direction = "forward") {
    if ($isDecoratorNode(node)) {
        const [ anchorOffset, focusOffset ] = direction === "forward" ? [ 0, 1 ] : [ 1, 0 ];
        const indexAtNode = node.getIndexWithinParent();

        return node.getParent().select(indexAtNode + anchorOffset, indexAtNode + focusOffset)
    }
  }

  async #selectOrAppendNextLine() {
    this.editor.update(() => {
      const topLevelElement = this.#getTopLevelElementFromSelection();
      if (!topLevelElement) return

      this.#moveToOrCreateNextLine(topLevelElement);
    });
  }

  #getTopLevelElementFromSelection() {
    const selection = $getSelection();
    if (!selection) return null

    if ($isNodeSelection(selection)) {
      return this.#getTopLevelFromNodeSelection(selection)
    }

    if ($isRangeSelection(selection)) {
      return this.#getTopLevelFromRangeSelection(selection)
    }

    return null
  }

  #getTopLevelFromNodeSelection(selection) {
    const nodes = selection.getNodes();
    return nodes.length > 0 ? nodes[0].getTopLevelElement() : null
  }

  #getTopLevelFromRangeSelection(selection) {
    const anchorNode = selection.anchor.getNode();
    return anchorNode.getTopLevelElement()
  }

  #getNearestHeadingNode(anchorNode) {
    const topLevelElement = anchorNode.getTopLevelElementOrThrow();

    let headingNode = $isHeadingNode(topLevelElement) ? topLevelElement : null;
    if (!headingNode) {
      let current = anchorNode.getParent();
      while (current) {
        if ($isHeadingNode(current)) {
          headingNode = current;
          break
        }
        current = current.getParent();
      }
    }

    return headingNode
  }

  #moveToOrCreateNextLine(topLevelElement) {
    const nextSibling = topLevelElement.getNextSibling();

    if (nextSibling) {
      nextSibling.selectStart();
    } else {
      this.#createAndSelectNewParagraph();
    }
  }

  #createAndSelectNewParagraph() {
    const root = $getRoot();
    const newParagraph = $createParagraphNode();
    root.append(newParagraph);
    newParagraph.selectStart();
  }

  #selectInLexical(node) {
    if ($isDecoratorNode(node)) {
      $addUpdateTag(HISTORY_MERGE_TAG);
      const selection = $createNodeSelectionWith(node);
      $setSelection(selection);
      return selection
    } else {
      return false
    }
  }

  #selectDecoratorNodeBeforeDeletion(backwards) {
    if (backwards && this.#removeEmptyListItem()) return true

    const node = backwards ? this.nodeBeforeCursor : this.nodeAfterCursor;
    if (!$isDecoratorNode(node)) return false

    if (this.#collapseListItemToParagraph(node)) return true

    this.#removeEmptyElementAnchorNode();

    const selection = this.#selectInLexical(node);
    return Boolean(selection)
  }

  // When backspace is pressed on an empty list item that has siblings,
  // handle the deletion appropriately:
  //
  // - Middle/end items (has previous sibling): remove the empty item and
  //   place the cursor at the end of the previous sibling. Without this,
  //   Lexical's default collapseAtStart converts the empty item into a
  //   paragraph above the list, causing the cursor to jump away.
  //
  // - First item (no previous sibling): convert to a paragraph above the
  //   list, matching the standard "unwrap list formatting" behavior that
  //   users expect from pressing backspace at the start of a list item.
  //   Inside a blockquote we instead just remove the empty item and move
  //   the cursor into the next one — stranding a paragraph there would
  //   leave the blank line the user is trying to close.
  //
  // When the empty item is the last/only one in the list, we return false
  // and let Lexical's default (convert to paragraph) provide the standard
  // "exit list" behavior.
  #removeEmptyListItem() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

    const anchorNode = selection.anchor.getNode();
    const listItem = $getNearestNodeOfType(anchorNode, ListItemNode);
    if (!listItem) return false

    if (!$isListItemStructurallyEmpty(listItem)) return false

    const nextSibling = listItem.getNextSibling();
    if (!nextSibling) return false

    const previousSibling = listItem.getPreviousSibling();
    const listNode = $getNearestNodeOfType(listItem, ListNode);
    if (!listNode) return false

    if (previousSibling) {
      previousSibling.selectEnd();
      listItem.remove();
    } else if ($isQuoteNode(listNode.getParent())) {
      nextSibling.selectStart();
      listItem.remove();
    } else {
      const paragraph = $createParagraphNode();
      listNode.insertBefore(paragraph);
      listItem.remove();
      paragraph.selectStart();
    }

    return true
  }

  // When the cursor is inside a list item, collapse the list item into a
  // paragraph instead of selecting the decorator. This lets the user
  // delete a list that immediately follows an attachment without the
  // attachment becoming selected. Only applies when the decorator is
  // outside the list item (e.g. a block attachment before the list),
  // not when it's an inline mention inside the list item.
  #collapseListItemToParagraph(decoratorNode) {
    const anchorNode = $getSelection()?.anchor?.getNode();
    const listItem = anchorNode && $getNearestNodeOfType(anchorNode, ListItemNode);
    if (!listItem) return false

    if (listItem.isParentOf(decoratorNode)) return false

    const listNode = $getNearestNodeOfType(listItem, ListNode);
    if (!listNode) return false

    const paragraph = $createParagraphNode();
    const children = listItem.getChildren();
    children.forEach(child => paragraph.append(child));

    if (listNode.getChildrenSize() === 1) {
      listNode.insertBefore(paragraph);
      listNode.remove();
    } else {
      listNode.insertBefore(paragraph);
      listItem.remove();
    }

    paragraph.selectStart();
    return true
  }

  #removeEmptyElementAnchorNode(anchor = $getSelection()?.anchor) {
    const anchorNode = anchor?.getNode();
    if ($isElementNode(anchorNode) && anchorNode?.isEmpty()) anchorNode.remove();
  }

  #getValidSelectionRange() {
    const lexicalSelection = $getSelection();
    if (!lexicalSelection || !lexicalSelection.isCollapsed()) return null

    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.rangeCount === 0) return null

    return nativeSelection.getRangeAt(0)
  }

  #getReliableRectFromRange(range) {
    let rect = range.getBoundingClientRect();

    if (this.#isRectUnreliable(rect)) {
      const marker = this.#createAndInsertMarker(range);
      rect = marker.getBoundingClientRect();
      this.#restoreSelectionAfterMarker(marker);
      marker.remove();
    }

    return rect
  }

  #isRectUnreliable(rect) {
    return rect.width === 0 && rect.height === 0 || rect.top === 0 && rect.left === 0
  }

  #createAndInsertMarker(range) {
    const marker = this.#createMarker();
    range.insertNode(marker);
    return marker
  }

  #createMarker() {
    const marker = document.createElement("span");
    marker.textContent = "\u200b";
    marker.style.display = "inline-block";
    marker.style.width = "1px";
    marker.style.height = "1em";
    marker.style.lineHeight = "normal";
    marker.setAttribute("nonce", getNonce());
    return marker
  }

  #restoreSelectionAfterMarker(marker) {
    const nativeSelection = window.getSelection();
    nativeSelection.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(marker);
    newRange.collapse(true);
    nativeSelection.addRange(newRange);
  }

  #calculateCursorPosition(rect, range) {
    const rootRect = this.editor.getRootElement().getBoundingClientRect();
    const x = rect.left - rootRect.left;
    let y = rect.top - rootRect.top;

    const fontSize = this.#getFontSizeForCursor(range);
    if (!isNaN(fontSize)) {
      y += fontSize;
    }

    return { x, y, fontSize }
  }

  #getFontSizeForCursor(range) {
    const nativeSelection = window.getSelection();
    const anchorNode = nativeSelection.anchorNode;
    const parentElement = this.#getElementFromNode(anchorNode);

    if (parentElement instanceof HTMLElement) {
      const computed = window.getComputedStyle(parentElement);
      return parseFloat(computed.fontSize)
    }

    return 0
  }

  #getElementFromNode(node) {
    return node?.nodeType === Node.TEXT_NODE ? node.parentElement : node
  }

  #getCollapsedSelectionData() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return { anchorNode: null, offset: 0 }
    }

    const { anchor } = selection;
    return { anchorNode: anchor.getNode(), offset: anchor.offset }
  }

  #getNodeAfterTextNode(anchorNode, offset) {
    if (offset === anchorNode.getTextContentSize()) {
      return this.#getNextNodeFromTextEnd(anchorNode)
    }
    return null
  }

  #getNextNodeFromTextEnd(anchorNode) {
    const nextSibling = anchorNode.getNextSibling();
    if ($isDecoratorNode(nextSibling)) {
      return nextSibling
    }
    if (nextSibling != null) {
      return null
    }
    const parent = anchorNode.getParent();
    return parent ? parent.getNextSibling() : null
  }

  #getNodeAfterElementNode(anchorNode, offset) {
    if (offset < anchorNode.getChildrenSize()) {
      return anchorNode.getChildAtIndex(offset)
    }
    return this.#findNextSiblingUp(anchorNode)
  }

  #getNodeBeforeTextNode(anchorNode, offset) {
    if (offset === 0) {
      return this.#getPreviousNodeFromTextStart(anchorNode)
    }
    return null
  }

  #getPreviousNodeFromTextStart(anchorNode) {
    const previousSibling = anchorNode.getPreviousSibling();
    if ($isDecoratorNode(previousSibling)) {
      return previousSibling
    }
    if (previousSibling != null) {
      return null
    }
    const parent = anchorNode.getParent();
    return parent ? parent.getPreviousSibling() : null
  }

  #getNodeBeforeElementNode(anchorNode, offset) {
    if (offset > 0) {
      return anchorNode.getChildAtIndex(offset - 1)
    }
    return this.#findPreviousSiblingUp(anchorNode)
  }

  #findNextSiblingUp(node) {
    let current = node;
    while (current && current.getNextSibling() == null) {
      current = current.getParent();
    }
    return current ? current.getNextSibling() : null
  }

  #findPreviousSiblingUp(node) {
    let current = node;
    while (current && current.getPreviousSibling() == null) {
      current = current.getParent();
    }
    return current ? current.getPreviousSibling() : null
  }

  #isCursorOnFirstVisualLineOfBlock(anchorNode) {
    return this.#isCursorOnEdgeLineOfBlock(anchorNode, "first")
  }

  #isCursorOnLastVisualLineOfBlock(anchorNode) {
    return this.#isCursorOnEdgeLineOfBlock(anchorNode, "last")
  }

  // Check whether the cursor sits on the first or last visual line of its
  // top-level block by comparing the Y position of the cursor with the Y
  // position of the block's start (first line) or end (last line).
  #isCursorOnEdgeLineOfBlock(anchorNode, edge) {
    const topLevelElement = anchorNode.getTopLevelElement();
    if (!topLevelElement) return false

    const domElement = this.editor.getElementByKey(topLevelElement.getKey());
    if (!domElement) return false

    const nativeSelection = window.getSelection();
    if (!nativeSelection?.rangeCount) return false

    const cursorRect = this.#getReliableRectFromRange(nativeSelection.getRangeAt(0));
    if (!cursorRect || this.#isRectUnreliable(cursorRect)) return false

    const edgeRect = this.#getEdgeCharRect(domElement, edge);
    if (!edgeRect || this.#isRectUnreliable(edgeRect)) return false

    const tolerance = edgeRect.height > 0 ? edgeRect.height * 0.5 : 5;
    return Math.abs(cursorRect.top - edgeRect.top) < tolerance
  }

  // Get a reliable bounding rect for the first or last character in a DOM
  // element by creating a non-collapsed range around it.
  #getEdgeCharRect(element, edge) {
    const walker = document.createTreeWalker(element, 4 /* NodeFilter.SHOW_TEXT */);
    let textNode;

    if (edge === "first") {
      textNode = walker.nextNode();
    } else {
      while (walker.nextNode()) textNode = walker.currentNode;
    }

    if (!textNode || textNode.length === 0) return null

    const range = document.createRange();
    if (edge === "first") {
      range.setStart(textNode, 0);
      range.setEnd(textNode, 1);
    } else {
      range.setStart(textNode, textNode.length - 1);
      range.setEnd(textNode, textNode.length);
    }

    return range.getBoundingClientRect()
  }
}

class EditorConfiguration {
  #editorElement
  #config

  constructor(editorElement) {
    this.#editorElement = editorElement;
    this.#config = new Configuration(
      Lexxy.presets.get("default"),
      Lexxy.presets.get(editorElement.preset),
      this.#overrides
    );
  }

  get(path) {
    return this.#config.get(path)
  }

  get #overrides() {
    const overrides = {};
    for (const option of this.#defaultOptions) {
      const attribute = dasherize(option);
      if (this.#editorElement.hasAttribute(attribute)) {
        overrides[option] = this.#parseAttribute(attribute);
      }
    }
    return overrides
  }

  get #defaultOptions() {
    return Object.keys(Lexxy.presets.get("default"))
  }

  #parseAttribute(attribute) {
    const value = this.#editorElement.getAttribute(attribute);
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
}

class ImageGalleryNode extends ElementNode {
  $config() {
    return this.config("image_gallery", {
      extends: ElementNode,
    })
  }

  static transform() {
    return (gallery) => {
      gallery.unwrapEmptyNode()
        || gallery.replaceWithSingularChild()
        || gallery.splitAroundInvalidChild();
    }
  }

  static importDOM() {
    return {
      div: (element) => {
        if (!this.#isGalleryElement(element)) return null

        return {
          conversion: () => {
            return {
              node: $createImageGalleryNode()
            }
          },
          priority: 2
        }
      }
    }
  }

  static canCollapseWith(node) {
    return $isImageGalleryNode(node) || this.isValidChild(node)
  }

  static isValidChild(node) {
    return $isActionTextAttachmentNode(node) && node.isPreviewableImage
  }

  static #isGalleryElement(element) {
    const attachmentChildren = element.querySelectorAll(`:scope > :is(${this.#attachmentTags.join()})`);
    return element.textContent.trim() === ""
      && attachmentChildren.length > 0
      && element.children.length === attachmentChildren.length
  }

  static get #attachmentTags() {
    return Object.keys(ActionTextAttachmentNode.importDOM())
  }

  createDOM() {
    const div = document.createElement("div");
    div.className = this.#galleryClassNames;
    return div
  }

  updateDOM(_prevNode, dom) {
    dom.className = this.#galleryClassNames;
    return false
  }

  canBeEmpty() {
    // Return `true` to conform to `$isBlock(node)`
    // We clean-up empty galleries with a transform
    return true
  }

  collapseAtStart(_selection) {
    return true
  }

  insertNewAfter(selection, restoreSelection) {
    const selectionBeforeLastChild = selection.anchor.getNode().is(this) && selection.anchor.offset == this.getChildrenSize() - 1;
    if (selectionBeforeLastChild) {
      const paragraph = $createParagraphNode();
      this.insertAfter(paragraph, false);
      paragraph.insertAfter(this.getLastChild(), false);
      paragraph.selectEnd();

      // return null as selection has been managed
      return null
    }

    const newNode = $createImageGalleryNode();
    this.insertAfter(newNode, restoreSelection);
    return newNode
  }

  getImageAttachments() {
    const children = this.getChildren();
    return children.filter($isActionTextAttachmentNode)
  }

  exportDOM() {
    const div = document.createElement("div");
    div.className = this.#galleryClassNames;
    return { element: div }
  }

  collapseWith(node, backwards) {
    if (!ImageGalleryNode.canCollapseWith(node)) return false

    if (backwards) {
      $insertFirst(this, node);
    } else {
      this.append(node);
    }

    $unwrapAndFilterDescendants(this, ImageGalleryNode.isValidChild);

    return true
  }

  unwrapEmptyNode() {
    if (this.isEmpty()) {
      const paragraph = $createParagraphNode();
      return this.replace(paragraph)
    }
  }

  replaceWithSingularChild() {
    if (this.#hasSingularChild) {
      const child = this.getFirstChild();
      return this.replace($makeSafeForRoot(child))
    }
  }

  splitAroundInvalidChild() {
    for (const child of $firstToLastIterator(this)) {
      if (ImageGalleryNode.isValidChild(child)) continue

      const poppedNode = $makeSafeForRoot(child);
      const [ topGallery, secondGallery ] = this.splitAtIndex(poppedNode.getIndexWithinParent());
      topGallery.insertAfter(poppedNode);
      poppedNode.selectEnd();

      // remove an empty gallery rather than let it unwrap to a paragraph
      if (secondGallery.isEmpty()) secondGallery.remove();

      break
    }
  }

  splitAtIndex(index) {
    return $splitNode(this, index)
  }

  get #hasSingularChild() {
    return this.getChildrenSize() === 1
  }

  get #galleryClassNames() {
    return `attachment-gallery attachment-gallery--${this.getChildrenSize()}`
  }
}

function $createImageGalleryNode() {
  return new ImageGalleryNode()
}

function $isImageGalleryNode(node) {
  return node instanceof ImageGalleryNode
}

function $findOrCreateGalleryForImage(node) {
  if (!ImageGalleryNode.canCollapseWith(node)) return null

  const existingGallery = $getNearestNodeOfType(node, ImageGalleryNode);
  return existingGallery ?? $wrapNodeInElement(node, $createImageGalleryNode)
}

class Uploader {
  #files

  static for(editorElement, files, options = {}) {
    const UploaderKlass = GalleryUploader.handle(editorElement, files) ? GalleryUploader : Uploader;
    return new UploaderKlass(editorElement, files, options)
  }

  constructor(editorElement, files, options = {}) {
    this.#files = files;
    this.options = options;

    this.editorElement = editorElement;
    this.contents = editorElement.contents;
    this.selection = editorElement.selection;
  }

  get files() {
    return Array.from(this.#files)
  }

  $uploadFiles() {
    this.$createUploadNodes();
    this.$insertUploadNodes();
  }

  $createUploadNodes() {
    this.nodes = this.files.map(file => this.#createUploadNode(file));
  }

  #createUploadNode(file) {
    return this.options.pending
      ? this.contents.$createPendingUploadNode(file)
      : this.contents.$createUploadNode(file)
  }

  $insertUploadNodes() {
    this.contents.insertAtCursor(...this.nodes);
  }
}

class GalleryUploader extends Uploader {
  #gallery

  static handle(editorElement, files) {
    return this.isMultipleImageUpload(files) || this.gallerySelection(editorElement.selection)
  }

  static isMultipleImageUpload(files) {
    let imageFileCount = 0;
    for (const file of files) {
      if (isPreviewableImage(file.type)) imageFileCount++;
      if (imageFileCount > 1) return true
    }
    return false
  }

  static gallerySelection(selection) {
    return selection.isOnPreviewableImage || this.selectionIsAfterGalleryEdge(selection)
  }

  static selectionIsAfterGalleryEdge(selection) {
    return selection.isAtNodeStart && ImageGalleryNode.canCollapseWith(selection.nodeBeforeCursor)
  }

  $insertUploadNodes() {
    this.#findOrCreateGallery();
    this.#insertImagesInGallery();
    this.#insertNonImagesAfterGallery();
  }

  #findOrCreateGallery() {
    if (this.selection.isOnPreviewableImage) {
      // Resolve from the previewable image itself (the selection's first node), not from
      // #selectedNode (the anchor) — those differ when the selection runs from an image
      // into following text, and the anchor text node can't join a gallery (returns null).
      this.#gallery = $findOrCreateGalleryForImage(this.selection.previewableImageNode);
    } else if (this.#selectionIsAfterGalleryEdge) {
      this.#gallery = $findOrCreateGalleryForImage(this.selection.nodeBeforeCursor);
    } else {
      this.#gallery = $createImageGalleryNode();
      this.contents.insertAtCursor(this.#gallery);
    }
  }

  get #selectionIsAfterGalleryEdge() {
    return this.constructor.selectionIsAfterGalleryEdge(this.selection)
  }

  get #selectedNode() {
    const { node } = this.selection.selectedNodeWithOffset();
    return node
  }

  get #galleryInsertPosition() {
    if (this.#selectionIsAfterGalleryEdge) return this.#gallery.getChildrenSize()

    const anchor = $getSelection()?.anchor;
    const galleryHasElementSelection = anchor?.getNode().is(this.#gallery);
    if (galleryHasElementSelection) return anchor.offset

    const selectedNode = this.#selectedNode;
    const childIndex = this.#gallery.isParentOf(selectedNode) && selectedNode.getIndexWithinParent();
    return childIndex !== false ? (childIndex + 1) : 0
  }

  get #imageNodes() {
    return this.nodes.filter(node => ImageGalleryNode.isValidChild(node))
  }

  get #nonImageNodes() {
    return this.nodes.filter(node => !ImageGalleryNode.isValidChild(node))
  }

  #insertImagesInGallery() {
    this.#gallery.splice(this.#galleryInsertPosition, 0, this.#imageNodes);
  }

  #insertNonImagesAfterGallery() {
    let beforeNode = this.#gallery;

    for (const node of this.#nonImageNodes) {
      beforeNode.insertAfter(node);
      beforeNode = node;
    }
  }
}

async function loadFileIntoImage(file, image) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    image.addEventListener("load", () => {
      resolve(image);
    });

    reader.onload = (event) => {
      image.src = event.target.result || null;
    };

    reader.readAsDataURL(file);
  })
}

class ActionTextAttachmentUploadNode extends ActionTextAttachmentNode {
  static getType() {
    return "action_text_attachment_upload"
  }

  static clone(node) {
    return new ActionTextAttachmentUploadNode({ ...node }, node.__key)
  }

  static importJSON(serializedNode) {
    return new ActionTextAttachmentUploadNode({ ...serializedNode })
  }

  // Should never run since this is a transient node. Defined to remove console warning.
  static importDOM() {
    return null
  }

  constructor(node = {}, key) {
    const { file, uploadUrl, blobUrlTemplate, progress, width, height, uploadError, fileName, contentType } = node;
    super({ ...node, contentType: file?.type ?? contentType }, key);
    this.file = file ?? null;
    this.fileName = file?.name ?? fileName;
    this.uploadUrl = uploadUrl;
    this.blobUrlTemplate = blobUrlTemplate;
    this.progress = progress ?? null;
    this.width = width;
    this.height = height;
    this.uploadError = uploadError;
  }

  createDOM() {
    if (this.uploadError) return this.createDOMForError()

    // This side-effect is trigged on DOM load to fire only once and avoid multiple
    // uploads through cloning. The upload is guarded from restarting in case the
    // node is reloaded from saved state such as from history.
    this.#startUploadIfNeeded();

    // Bridge-managed uploads (uploadUrl is null) and restored or remote
    // instances (no local File) don't have file data to show an image
    // preview, so always show the file icon during upload.
    const canPreviewFile = this.isPreviewableAttachment && this.uploadUrl != null && this.file != null;
    const figure = this.createAttachmentFigure(canPreviewFile);

    if (canPreviewFile) {
      const img = figure.appendChild(this.#createDOMForImage());

      // load file locally to set dimensions and prevent vertical shifting
      loadFileIntoImage(this.file, img).then(img => this.#setDimensionsFromImage(img));
    } else {
      figure.appendChild(this.#createDOMForFile());
    }

    figure.appendChild(this.#createCaption());
    figure.appendChild(this.#createProgressBar());

    return figure
  }

  updateDOM(prevNode, dom) {
    if (this.uploadError !== prevNode.uploadError) return true

    if (prevNode.progress !== this.progress) {
      const progress = dom.querySelector("progress");
      progress.value = this.progress ?? 0;
    }

    return false
  }

  exportDOM() {
    return { element: null }
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "action_text_attachment_upload",
      version: 1,
      fileName: this.fileName,
      contentType: this.contentType,
      uploadUrl: this.uploadUrl,
      blobUrlTemplate: this.blobUrlTemplate,
      progress: this.progress,
      width: this.width,
      height: this.height,
      uploadError: this.uploadError
    }
  }

  get #uploadStarted() {
    return this.progress !== null
  }

  #createDOMForImage() {
    return createElement("img")
  }

  #createDOMForFile() {
    const extension = this.#getFileExtension();
    const span = createElement("span", { className: "attachment__icon", textContent: extension });
    return span
  }

  #getFileExtension() {
    return (this.fileName || "").split(".").pop().toLowerCase()
  }

  #createCaption() {
    const figcaption = createElement("figcaption", { className: "attachment__caption" });

    const nameSpan = createElement("span", { className: "attachment__name", textContent: this.caption || this.fileName || "" });
    figcaption.appendChild(nameSpan);

    if (this.file) {
      const sizeSpan = createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(this.file.size) });
      figcaption.appendChild(sizeSpan);
    }

    return figcaption
  }

  #createProgressBar() {
    return createElement("progress", { value: this.progress ?? 0, max: 100 })
  }

  #setDimensionsFromImage({ width, height }) {
    if (this.#hasDimensions) return

    this.patchAndRewriteHistory({ width, height });
  }

  get #hasDimensions() {
    return Boolean(this.width && this.height)
  }

  async #startUploadIfNeeded() {
    if (this.#uploadStarted) return
    if (!this.uploadUrl) return // Bridge-managed upload — skip DirectUpload
    if (!this.file) return // Restored or remote instance — no local File to upload

    this.#setUploadStarted();

    const { DirectUpload } = await import('@rails/activestorage');

    const upload = new DirectUpload(this.file, this.uploadUrl, this);
    upload.delegate = this.#createUploadDelegate();

    this.#dispatchEvent("lexxy:upload-start", { file: this.file });

    upload.create((error, blob) => {
      this.#forgetUploadRequest();

      if (error) {
        this.#dispatchEvent("lexxy:upload-end", { file: this.file, error });
        this.#handleUploadError(error);
      } else {
        this.#dispatchEvent("lexxy:upload-end", { file: this.file, error: null });
        this.editor.update(() => {
          this.$showUploadedAttachment(blob);
        });
      }
    });
  }

  #createUploadDelegate() {
    const shouldAuthenticateUploads = Lexxy.global.get("authenticatedUploads");

    return {
      directUploadWillCreateBlobWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true;
      },
      directUploadWillStoreFileWithXHR: (request) => {
        if (shouldAuthenticateUploads) request.withCredentials = true;

        this.#rememberUploadRequest(request);

        const uploadProgressHandler = (event) => this.#handleUploadProgress(event, request);
        request.upload.addEventListener("progress", uploadProgressHandler);
      }
    }
  }

  #forgetUploadRequest() {
    this.#editorElement?.uploadRequests.forget(this.getKey());
  }

  #rememberUploadRequest(request) {
    this.#editorElement?.uploadRequests.track(this.getKey(), request);
  }

  get #editorElement() {
    return this.editor.getRootElement()?.closest("lexxy-editor")
  }

  #setUploadStarted() {
    this.#setProgress(1);
  }

  #handleUploadProgress(event, request) {
    const progress = Math.round(event.loaded / event.total * 100);
    try {
      this.#setProgress(progress);
      this.#dispatchEvent("lexxy:upload-progress", { file: this.file, progress });
    } catch {
      request.abort();
    }
  }

  #setProgress(progress) {
    this.patchAndRewriteHistory({ progress });
  }

  #handleUploadError(error) {
    console.warn(`Upload error for ${this.file?.name ?? "file"}: ${error}`);

    this.patchAndRewriteHistory({ uploadError: true });
  }

  $showUploadedAttachment(blob) {
    const previewSrc = this.isPreviewableImage && this.file ? URL.createObjectURL(this.file) : null;

    const replacementNode = this.#toActionTextAttachmentNodeWith(blob, previewSrc);
    this.replaceAndRewriteHistory(replacementNode);

    return replacementNode.getKey()
  }

  #toActionTextAttachmentNodeWith(blob, previewSrc) {
    const conversion = new AttachmentNodeConversion(this, blob, previewSrc);
    return conversion.toAttachmentNode()
  }

  #dispatchEvent(name, detail) {
    const figure = this.editor.getElementByKey(this.getKey());
    if (figure) dispatch(figure, name, detail);
  }
}

class AttachmentNodeConversion {
  constructor(uploadNode, blob, previewSrc) {
    this.uploadNode = uploadNode;
    this.blob = blob;
    this.previewSrc = previewSrc;
  }

  toAttachmentNode() {
    return new ActionTextAttachmentNode({
      ...this.uploadNode,
      ...this.#propertiesFromBlob,
      src: this.#src,
      previewSrc: this.previewSrc,
      pendingPreview: this.blob.previewable && !this.uploadNode.isPreviewableImage
    })
  }

  get #propertiesFromBlob() {
    const { blob } = this;
    return {
      sgid: blob.attachable_sgid,
      altText: blob.filename,
      contentType: blob.content_type,
      fileName: blob.filename,
      fileSize: blob.byte_size,
      previewable: blob.previewable,
      previewStatusUrl: blob.preview_status_url
    }
  }

  get #src() {
    return this.blob.previewable ? this.blob.url : this.#blobSrc
  }

  get #blobSrc() {
    return this.uploadNode.blobUrlTemplate
      .replace(":signed_id", this.blob.signed_id)
      .replace(":filename", encodeURIComponent(this.blob.filename))
  }
}

function $createActionTextAttachmentUploadNode(...args) {
  return new ActionTextAttachmentUploadNode(...args)
}

class BaseNodeInserter {
  constructor(selection) {
    this.selection = selection;
  }
}

class CodeNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $getNearestNodeOfType(selection.anchor?.getNode(), CodeNode)
  }

  insertNodes(nodes) {
    if (!this.selection.isCollapsed()) { this.selection.removeText(); }

    $ensureForwardRangeSelection(this.selection);
    const focusNode = this.selection.focus.getNode();
    const codeNode = $getNearestNodeOfType(focusNode, CodeNode);
    const insertionIndex = focusNode.is(codeNode) ? 0 : focusNode.getIndexWithinParent();

    const caret = $getChildCaretAtIndex(codeNode, insertionIndex + 1, "previous");

    // Nodes that are already in the document come from the format-toggle path (existing
    // content converted into this code block). Brand-new nodes (dropped/pasted content)
    // were never attached.
    const existingNodes = new Set(nodes.filter(node => node.isAttached()));
    const trailingNodes = [];

    for (const node of nodes) {
      if (existingNodes.has(node)) {
        if (!node.isAttached()) continue // already pulled in when a converted ancestor was removed
      } else if (!this.#canJoinCodeBlock(node)) {
        trailingNodes.push(node); // e.g. a dropped attachment, which a code block can't hold
        continue
      }

      if (caret.getNodeAtCaret() && $isElementNode(node)) { caret.insert($createLineBreakNode()); }
      caret.insert(this.#convertNodeToCodeChild(node));
    }

    const lastTrailingNode = this.#insertAfterCodeBlock(codeNode, trailingNodes);
    const nodeToSelect = lastTrailingNode ?? caret.getNodeAtCaret();
    nodeToSelect?.selectEnd();
  }

  #canJoinCodeBlock(node) {
    return $isTextNode(node) || $isLineBreakNode(node)
  }

  #insertAfterCodeBlock(codeNode, nodes) {
    let previousNode = codeNode;
    for (const node of nodes) {
      previousNode.insertAfter(node);
      previousNode = node;
    }
    return nodes.at(-1)
  }

  #convertNodeToCodeChild(node) {
    if ($isLineBreakNode(node)) {
      return node
    } else {
      node.remove();
      return $createTextNode(node.getTextContent())
    }
  }
}

class ShadowRootNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isShadowRoot(selection?.anchor?.getNode())
  }

  insertNodes(nodes) {
    const anchorNode = this.selection.anchor.getNode();
    const paragraph = $createParagraphNode();
    anchorNode.append(paragraph);

    paragraph.selectStart().insertNodes(nodes);
  }
}

class NodeSelectionNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isNodeSelection(selection) && selection.getNodes().length > 0
  }

  insertNodes(nodes) {
    // Overrides Lexical's default behavior of _removing_ the currently selected nodes
    // https://github.com/facebook/lexical/blob/v0.38.2/packages/lexical/src/LexicalSelection.ts#L412
    let lastNode = this.selection.getNodes().at(-1);

    for (const node of nodes) {
      // Inserting after a top-level node would make this one a root child. Inline nodes
      // can't live there (Lexical error #99), so wrap them in their required parent first.
      const nodeToInsert = this.#insertsIntoRoot(lastNode) ? $makeSafeForRoot(node) : node;
      lastNode = lastNode.insertAfter(nodeToInsert);
    }
  }

  #insertsIntoRoot(node) {
    return node.is(node.getTopLevelElement())
  }
}

// A list item can only hold inline content, so a block node (such as an image
// attachment) dropped into one corrupts the list: Lexical lifts it into the
// wrong list item and orphans an empty bullet. Block nodes belong at the top
// level instead, splitting the list around the cursor. Inline content keeps
// Lexical's default behavior and stays within the list item.
class ListItemNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $isRangeSelection(selection) &&
      $getNearestNodeOfType(selection.anchor.getNode(), ListItemNode)
  }

  insertNodes(nodes) {
    if (nodes.some(node => this.#isBlockDecorator(node))) {
      this.#insertAroundList(nodes);
    } else {
      this.selection.insertNodes(nodes);
    }
  }

  #insertAroundList(nodes) {
    if (!this.selection.isCollapsed()) { this.selection.removeText(); }

    // Break out of any nesting to the outermost list. Splitting an inner list
    // would leave the block stranded inside an ancestor list item, which is the
    // very corruption we are avoiding. The block must land at the list's level.
    const anchorNode = this.selection.anchor.getNode();
    const outerList = this.#outermostList(anchorNode);
    const topItem = this.#topLevelItemFor(anchorNode, outerList);

    // A blank top-level bullet is just the insertion point (e.g. the user pressed
    // Enter to leave the list); break out of it entirely. A bullet with content —
    // including one wrapping a nested list — splits so its content stays in the list.
    const splitAfterItem = $isBlankNode(topItem) ? topItem.getPreviousSibling() : topItem;
    const splitIndex = splitAfterItem ? splitAfterItem.getIndexWithinParent() + 1 : 0;
    const [ listBefore, listAfter ] = $splitNode(outerList, splitIndex);
    if ($isBlankNode(topItem)) { topItem.remove(); }

    let anchor = listBefore ?? listAfter;
    for (const node of nodes) {
      anchor.insertAfter(node);
      anchor = node;
    }

    this.#removeEmptyList(listBefore);
    this.#removeEmptyList(listAfter);
    nodes.at(-1).selectNext();
  }

  #outermostList(node) {
    return [ node, ...node.getParents() ].reverse().find($isListNode)
  }

  #topLevelItemFor(node, outerList) {
    return [ node, ...node.getParents() ].find(ancestor =>
      $isListItemNode(ancestor) && ancestor.getParent()?.is(outerList)
    )
  }

  #removeEmptyList(list) {
    if ($isListNode(list) && list.isEmpty()) list.remove();
  }

  // Only block decorator nodes (image/file attachments) are intercepted. A list
  // item cannot hold them, so they must break out. Pasted element blocks
  // (paragraphs, quotes) keep Lexical's own list-escape semantics.
  #isBlockDecorator(node) {
    return $isDecoratorNode(node) && !node.isInline()
  }
}

// Lexical's RangeSelection.insertNodes requires every selection point to have a block
// ancestor with inline children. An element point on a container of block nodes — e.g.
// a quote holding paragraphs — has none, so Lexical throws invariant #211 or #212.
// Descend such points to a leaf position before inserting.
class BlockContainerNodeInserter extends BaseNodeInserter {
  static handles(selection) {
    return $hasPointOnBlockContainer(selection)
  }

  insertNodes(nodes) {
    $normalizeSelection__EXPERIMENTAL(this.selection);
    this.selection.insertNodes(nodes);
  }
}

const INSERTERS = [
  CodeNodeInserter,
  ShadowRootNodeInserter,
  NodeSelectionNodeInserter,
  ListItemNodeInserter,
  BlockContainerNodeInserter
];

// Defined here rather than on the base class so the base can stay free of any
// dependency on its subclasses (they import the base), avoiding an import cycle.
BaseNodeInserter.for = (selection) => {
  const inserterClass = INSERTERS.find(inserter => inserter.handles(selection));
  return inserterClass ? new inserterClass(selection) : selection
};

// Word and Outlook never emit <ul>/<ol>/<li>. They simulate lists with flat
// paragraphs that declare their depth in an inline `mso-list:l0 level2 lfo1`
// and carry the bullet or number glyph in a <span style="mso-list:Ignore">.
// Nothing downstream understands either, so the items land as plain paragraphs
// with the marker baked into the text. Rebuild real lists from the level each
// paragraph declares.
//
// Everything this reads lives in inline attributes, so it stays correct after
// the pasted content formatter has dropped Office's style sheet.
class OfficeFormatter {
  constructor(doc) {
    this.doc = doc;
  }

  format() {
    for (const run of this.#listRuns()) {
      this.#replaceWithLists(run);
    }
  }

  // A run is a stretch of Office list paragraphs that are siblings with nothing
  // but whitespace and Word's conditional comments between them. Anything else
  // in between (a heading, a plain paragraph) ends one list and starts another.
  #listRuns() {
    const runs = [];
    const claimed = new Set();

    for (const paragraph of this.doc.querySelectorAll("p[style*='mso-list']")) {
      if (claimed.has(paragraph) || this.#listLevel(paragraph) === null) continue

      const run = [];
      let node = paragraph;
      while (node) {
        run.push(node);
        claimed.add(node);
        node = this.#nextListParagraph(node);
      }
      runs.push(run);
    }

    return runs
  }

  #nextListParagraph(paragraph) {
    let sibling = paragraph.nextSibling;
    while (sibling && this.#isIgnorableBetweenListParagraphs(sibling)) {
      sibling = sibling.nextSibling;
    }

    if (sibling && sibling.nodeType === Node.ELEMENT_NODE && this.#listLevel(sibling) !== null) {
      return sibling
    }

    return null
  }

  #isIgnorableBetweenListParagraphs(node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      return true
    }
    return node.nodeType === Node.TEXT_NODE && node.textContent.trim() === ""
  }

  // Word numbers levels from 1, but a copied selection often starts partway down
  // a list, so every paragraph declares level3 with no level1 above it. Anchoring
  // the run at its own shallowest level is what keeps the result from arriving
  // needlessly deep.
  #replaceWithLists(paragraphs) {
    const levels = paragraphs.map((paragraph) => this.#listLevel(paragraph));
    const baseLevel = Math.min(...levels);
    const roots = [];
    const stack = [];

    paragraphs.forEach((paragraph, index) => {
      const depth = levels[index] - baseLevel + 1;
      const tagName = this.#listTagName(paragraph);

      while (stack.length > depth) {
        stack.pop();
      }
      if (stack.length === depth && stack[depth - 1].tagName !== tagName.toUpperCase()) {
        stack.pop();
      }

      while (stack.length < depth) {
        const list = this.doc.createElement(tagName);
        if (stack.length === 0) {
          roots.push(list);
        } else {
          this.#lastItemOf(stack[stack.length - 1]).appendChild(list);
        }
        stack.push(list);
      }

      stack[stack.length - 1].appendChild(this.#createListItem(paragraph));
    });

    paragraphs[0].replaceWith(...roots);
    for (const paragraph of paragraphs.slice(1)) {
      paragraph.remove();
    }
  }

  #lastItemOf(list) {
    if (!list.lastElementChild) {
      list.appendChild(this.doc.createElement("li"));
    }
    return list.lastElementChild
  }

  // Word writes bullets as the raw glyph of the marker font (Symbol's "·",
  // Wingdings' "§", Courier New's "o") and numbers as the rendered counter
  // ("1.", "a)", "iv)"). A bare letter with no delimiter after it is Courier
  // New's bullet, not a counter, so the delimiter is what tells them apart.
  #listTagName(paragraph) {
    const marker = paragraph.querySelector("[style*='mso-list:Ignore']");
    const text = marker?.textContent || "";

    if (/\d/.test(text) || /^\(?[A-Za-z]+[.)]/.test(text)) {
      return "ol"
    }
    return "ul"
  }

  #createListItem(paragraph) {
    for (const marker of paragraph.querySelectorAll("[style*='mso-list:Ignore']")) {
      marker.remove();
    }

    const item = this.doc.createElement("li");
    item.append(...paragraph.childNodes);
    return item
  }

  #listLevel(element) {
    const match = /mso-list:[^;"']*\blevel(\d+)/.exec(element.getAttribute("style") || "");
    if (match) {
      return parseInt(match[1], 10)
    }
    return null
  }
}

// Properties worth rescuing from a foreign style sheet before #stripStyleElements
// drops it, keyed by the elements that carry them. Word and Outlook declare
// paragraph spacing in the sheet (p.MsoNormal { margin: 0cm }) and never inline,
// so once the sheet goes there is nothing left to say how tightly the author's
// paragraphs sat, and hosts that turn pasted paragraph margins into explicit
// blank lines read tight Office paragraphs as spaced ones and multiply every
// line break.
const PRESERVABLE_STYLES = {
  p: [ "margin-top", "margin-bottom" ]
};

class PastedContentFormatter {
  constructor(doc) {
    this.doc = doc;
  }

  format() {
    this.#inlinePreservableStyles();
    this.#stripStyleElements();
    this.#unwrapPlaceholderAnchors();
    this.#stripTableCellColorStyles();
    new OfficeFormatter(this.doc).format();
    this.#unwrapWrappedListChildren();
    this.#nestStrayListChildren();
    this.#stripStrayListChildren();
    this.#replaceGmailEmojiImgTags();
    return this.doc
  }

  // Runs before #stripStyleElements, to inline anything we still need
  // from an external style before we remove it
  #inlinePreservableStyles() {
    const rules = this.#styleRules();
    if (rules.length === 0) return

    for (const [ selector, properties ] of Object.entries(PRESERVABLE_STYLES)) {
      for (const element of this.doc.querySelectorAll(selector)) {
        this.#inlineDeclaredStyles(element, properties, rules);
      }
    }
  }

  // Spreadsheets (e.g. Excel) copy a <style> block whose rules (td { color:
  // black }, .xlNN { ... }) cascade onto the imported text. That color rides
  // in through the cascade rather than an inline style, so it slips past both
  // the cell-level stripping below and the paste style canonicalizer, leaving
  // pasted tables with foreign text colors that don't adapt to the theme. Drop
  // foreign style sheets so nothing cascades into imported content.
  #stripStyleElements() {
    for (const style of this.doc.querySelectorAll("style")) {
      style.remove();
    }
  }

  // Anchors with non-meaningful hrefs (e.g. "#", "") appear in content copied
  // from rendered views where mentions and interactive elements are wrapped in
  // <a href="#"> tags. Unwrap them so their text content pastes as plain text
  // and real links are preserved.
  #unwrapPlaceholderAnchors() {
    for (const anchor of this.doc.querySelectorAll("a")) {
      const href = anchor.getAttribute("href") || "";
      if (href === "" || href === "#") {
        anchor.replaceWith(...anchor.childNodes);
      }
    }
  }

  // Table cells copied from a page inherit the source theme's inline color
  // styles (e.g. dark-mode backgrounds). Strip them so pasted tables adopt
  // the current theme instead of carrying stale colors.
  #stripTableCellColorStyles() {
    for (const cell of this.doc.querySelectorAll("td, th")) {
      cell.style.removeProperty("background-color");
      cell.style.removeProperty("background");
      cell.style.removeProperty("color");
    }
  }

  // Some sources wrap runs of <li>s in a stray element (e.g. a <div> directly
  // inside the list). Dissolve such wrappers so their items become direct
  // list children and any nested list they hide becomes visible to
  // #nestStrayListChildren below.
  #unwrapWrappedListChildren() {
    for (const list of this.doc.querySelectorAll("ol, ul")) {
      let wrapper = this.#wrappedListChild(list);
      while (wrapper) {
        wrapper.replaceWith(...wrapper.childNodes);
        wrapper = this.#wrappedListChild(list);
      }
    }
  }

  #wrappedListChild(list) {
    for (const child of list.children) {
      if (child.tagName !== "LI" && !this.#isNestedList(child) && this.#containsListItems(child)) {
        return child
      }
    }
    return null
  }

  // Some sources (e.g. Gmail) nest a sublist as a direct child of the parent
  // <ol>/<ul> instead of inside a <li>. Move each nested list into its
  // preceding <li> so the import preserves the nesting instead of dropping it.
  #nestStrayListChildren() {
    for (const list of this.doc.querySelectorAll("ol, ul")) {
      for (const child of Array.from(list.children)) {
        if (child.tagName !== "OL" && child.tagName !== "UL") continue

        const previousItem = child.previousElementSibling;
        if (previousItem && previousItem.tagName === "LI") {
          previousItem.appendChild(child);
        }
      }
    }
  }

  // Only <li> is a valid child of a list. Unwrap remaining stray children
  // that still hold list items (a nested list with no preceding <li> to nest
  // under) so the items survive, and drop stray <br>/whitespace so the import
  // doesn't wrap them into an empty leading item.
  #stripStrayListChildren() {
    for (const list of this.doc.querySelectorAll("ol, ul")) {
      let stray = this.#firstStrayListChild(list);
      while (stray) {
        if (this.#containsListItems(stray)) {
          stray.replaceWith(...stray.childNodes);
        } else {
          stray.remove();
        }

        stray = this.#firstStrayListChild(list);
      }
    }
  }

  // Read the rules from a sheet we build rather than from this.doc.styleSheets: the
  // document came from DOMParser, so it has no browsing context, and WebKit leaves
  // its styleSheets empty. Parsing the text ourselves still expands the shorthands
  // Word writes (margin: 0cm) into the longhands we ask for.
  #styleRules() {
    const css = Array.from(this.doc.querySelectorAll("style"), (style) => style.textContent).join("\n");
    if (css.trim() === "") return []

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);

    const rules = [];
    for (const rule of sheet.cssRules) {
      if (rule instanceof CSSStyleRule) {
        rules.push(rule);
      }
    }
    return rules
  }

  // A declaration the element already carries inline is the author's own and wins.
  #inlineDeclaredStyles(element, properties, rules) {
    for (const property of properties) {
      if (element.style.getPropertyValue(property) === "") {
        const value = this.#declaredValue(rules, element, property);
        if (value) {
          this.#appendStyleProperty(element, property, value);
        }
      }
    }
  }

  // Source order alone doesn't decide the cascade, so when the matching rules
  // disagree we can't say which value wins without resolving specificity. Skip
  // the property rather than guess: guessing is permanent, since the sheet is
  // about to go, and skipping only leaves the host on its own default.
  #declaredValue(rules, element, property) {
    const declared = new Set();
    for (const rule of rules) {
      const value = rule.style.getPropertyValue(property);
      if (value !== "" && element.matches(rule.selectorText)) {
        declared.add(value);
      }
    }

    if (declared.size === 1) {
      return declared.values().next().value
    } else {
      return null
    }
  }

  // Assigning through element.style would reserialize the style attribute and
  // drop the mso-* declarations Word leaves inline (they aren't valid CSS),
  // and OfficeFormatter still needs to read mso-list from them. Append to the
  // attribute instead so the original declarations survive untouched.
  #appendStyleProperty(element, property, value) {
    const style = element.getAttribute("style");
    const declaration = `${property}:${value}`;
    if (style === null || style.trim() === "") {
      element.setAttribute("style", declaration);
    } else {
      element.setAttribute("style", `${style.replace(/;\s*$/, "")};${declaration}`);
    }
  }

  #firstStrayListChild(list) {
    for (const child of list.childNodes) {
      if (child.nodeType !== Node.ELEMENT_NODE || child.tagName !== "LI") {
        return child
      }
    }
    return null
  }

  #isNestedList(node) {
    return node.nodeType === Node.ELEMENT_NODE && (node.tagName === "OL" || node.tagName === "UL")
  }

  #containsListItems(node) {
    return node.nodeType === Node.ELEMENT_NODE && node.querySelector("li") !== null
  }

  // Emoji in gmail: <img data-emoji="😂" class="an1" alt="😂" aria-label="😂" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/17.0/1f602/32.png" loading="lazy" style="height: 1.2em; width: 1.2em; vertical-align: middle;">
  #replaceGmailEmojiImgTags() {
    for (const emojiImg of this.doc.querySelectorAll("img[data-emoji]")) {
      const emoji = emojiImg.dataset.emoji;
      if (emoji === emojiImg.alt) {
        emojiImg.replaceWith(emoji);
      }
    }
  }
}

class Contents {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
  }

  dispose() {
    this.editorElement = null;
    this.editor = null;
  }

  get selection() { return this.editorElement.selection }

  insertHtml(html, { tag } = {}) {
    this.insertDOM(parseHtml(html), { tag });
  }

  insertDOM(doc, { tag } = {}) {
    this.editor.update(() => {
      if ($hasUpdateTag(PASTE_TAG)) this.#formatPastedDOM(doc);

      const nodes = this.editorElement.$generateNodesFromDOM(doc);

      if (!$hasUpdateTag(PASTE_TAG) || !this.#dispatchPastedNodesCommand(nodes)) {
        this.#insertUploadNodes(nodes) || this.insertAtCursor(...nodes);
      }
    }, { tag });
  }

  insertText(text, { tag } = {}) {
    this.editor.update(() => {
      const paragraph = $createParagraphNode();
      text.split("\n").forEach((line, index) => {
        if (index > 0) paragraph.append($createLineBreakNode());
        paragraph.append($createTextNode(line));
      });
      this.insertAtCursor(paragraph);
    }, { tag });
  }

  insertAtCursor(...nodes) {
    const selection = this.#insertableSelection();
    const inserter = BaseNodeInserter.for(selection);

    inserter.insertNodes(nodes);
  }

  applyParagraphFormat() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    $expandSelectionToLineBreaksAndSplitAtEdges(selection, (node) => $getNearestBlockElementAncestorOrThrow(node));
    $setBlocksType(selection, () => $createParagraphNode());
  }

  applyHeadingFormat(tag) {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    $expandSelectionToLineBreaksAndSplitAtEdges(selection);
    $setBlocksType(selection, () => $createHeadingNode(tag));
  }

  applyUnorderedListFormat() {
    this.#applyListFormat("bullet", INSERT_UNORDERED_LIST_COMMAND);
  }

  applyOrderedListFormat() {
    this.#applyListFormat("number", INSERT_ORDERED_LIST_COMMAND);
  }

  clearFormatting() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    $forEachSelectedTextNode(node => {
      node.setFormat(0);
      node.setStyle("");
    });

    $toggleLink(null);

    this.#topLevelElementsInSelection(selection).filter($isQuoteNode).forEach(node => this.#unwrap(node));

    $setBlocksType(selection, () => $createParagraphNode());
  }

  toggleCodeBlock() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    if (this.#insertNodeIfRoot($createCodeNode("plain"))) return

    const blockElements = this.#blockLevelElementsInSelection(selection);
    const allCode = blockElements.every($isCodeNode);

    if (allCode) {
      blockElements.forEach(node => this.#unwrapCodeBlock(node));
    } else {
      $expandSelectionToLineBreaksAndSplitAtEdges(selection);
      const elements = this.#outermostElements(this.#blockLevelElementsInSelection(selection));
      if (elements.length === 0) return

      const codeNode = $createCodeNode("plain");
      elements.at(-1).insertAfter(codeNode);
      codeNode.selectEnd();
      this.insertAtCursor(...elements);
    }
  }

  toggleBlockquote() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    if (this.#insertNodeIfRoot($createQuoteNode())) return

    const topLevelElements = this.#topLevelElementsInSelection(selection);

    const allQuoted = topLevelElements.length > 0 && topLevelElements.every($isQuoteNode);

    if (allQuoted) {
      topLevelElements.forEach(node => this.#unwrap(node));
    } else {
      topLevelElements.filter($isQuoteNode).forEach(node => this.#unwrap(node));

       $expandSelectionToLineBreaksAndSplitAtEdges(selection);
      const elements = this.#topLevelElementsInSelection(selection);
      if (elements.length === 0) return

      const blockquote = $createQuoteNode();
      elements[0].insertBefore(blockquote);
      elements.forEach((element) => blockquote.append(element));
    }
  }

  hasSelectedText() {
    let result = false;

    this.editor.read(() => {
      const selection = $getSelection();
      result = $isRangeSelection(selection) && !selection.isCollapsed();
    });

    return result
  }

  createLink(url) {
    let linkNodeKey = null;

    this.editor.update(() => {
      const textNode = $createTextNode(url);
      const linkNode = $createLinkNode(url);
      linkNode.append(textNode);

      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        BaseNodeInserter.for(selection).insertNodes([ linkNode ]);
        linkNodeKey = linkNode.getKey();
      }
    });

    return linkNodeKey
  }

  createLinkWithSelectedText(url) {
    if (!this.hasSelectedText()) return

    this.editor.update(() => {
      $toggleLink(null);
      $toggleLink(url);
    });
  }

  textBackUntil(string) {
    let result = "";

    this.editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();

      if (!$isTextNode(anchorNode)) return

      const fullText = anchorNode.getTextContent();
      const offset = anchor.offset;

      const lastIndex = fullText.slice(0, offset).lastIndexOf(string);
      if (lastIndex !== -1) {
        result = fullText.slice(lastIndex + string.length, this.#endOffsetAt(fullText, offset));
      }
    });

    return result
  }

  // The query runs from the trigger up to the next boundary, even when the
  // cursor sits inside an existing word — inserting "@" before "Jack" must
  // filter by "Jack" rather than treating the prompt as empty.
  #endOffsetAt(fullText, cursorOffset) {
    for (let offset = cursorOffset; offset < fullText.length; offset++) {
      if (this.#isQueryBoundary(fullText, offset)) {
        return offset
      }
    }

    return fullText.length
  }

  // Whitespace always ends the query. Punctuation ends it too: with "@" typed
  // right before a period, extending across it would glue "." onto everything
  // typed ("B" would query "B."), matching the wrong names or nothing at all.
  // But punctuation joining two word characters is part of a name — "@" before
  // "Anne-Marie" or "O'Connor" must keep the whole name as the query.
  #isQueryBoundary(fullText, offset) {
    const character = fullText[offset];
    if (/\s/.test(character)) return true
    if (!/\p{P}/u.test(character)) return false

    return !(this.#isWordCharacter(fullText[offset - 1]) && this.#isWordCharacter(fullText[offset + 1]))
  }

  #isWordCharacter(character) {
    return character != null && /[\p{L}\p{N}]/u.test(character)
  }

  containsTextBackUntil(string) {
    let result = false;

    this.editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();

      if (!$isTextNode(anchorNode)) return

      const fullText = anchorNode.getTextContent();
      const offset = anchor.offset;

      const textBeforeCursor = fullText.slice(0, offset);

      result = textBeforeCursor.includes(string);
    });

    return result
  }

  replaceTextBackUntil(stringToReplace, replacementNodes) {
    replacementNodes = Array.isArray(replacementNodes) ? replacementNodes : [ replacementNodes ];

    const { anchorNode, offset } = this.#getTextAnchorData();
    if (!anchorNode) return

    const lastIndex = this.#findReplacementStart(anchorNode, offset, stringToReplace);
    if (lastIndex === -1) return

    this.#performTextReplacement(anchorNode, lastIndex, stringToReplace, replacementNodes);
  }

  uploadFiles(files, { selectLast } = {}) {
    if (!this.editorElement) return // Disposed (e.g. on turbo:before-cache); a late drop can still land here

    if (!this.editorElement.supportsAttachments) {
      console.warn("This editor does not supports attachments (it's configured with [attachments=false])");
      return
    }
    const validFiles = Array.from(files).filter(file => this.editorElement.acceptsFile(file));

    this.editor.update(() => {
      const uploader = Uploader.for(this.editorElement, validFiles);
      uploader.$uploadFiles();

      if (selectLast && uploader.nodes?.length) {
        const lastNode = uploader.nodes.at(-1);
        lastNode.selectEnd();
        this.#normalizeSelectionInShadowRoot();
      }
    });
  }

  $createUploadNode(file) {
    return $createActionTextAttachmentUploadNode({
      file,
      uploadUrl: this.editorElement.directUploadUrl,
      blobUrlTemplate: this.editorElement.blobUrlTemplate,
      contentType: file.type,
    })
  }

  $createPendingUploadNode(file) {
    return $createActionTextAttachmentUploadNode({
      file,
      uploadUrl: null,
      blobUrlTemplate: this.editorElement.blobUrlTemplate,
      contentType: file.type,
    })
  }

  insertPendingAttachment(file) {
    if (!this.editorElement.supportsAttachments) return null

    let nodeKey = null;
    this.editor.update(() => {
      const uploadNode = this.$createPendingUploadNode(file);
      this.insertAtCursor(uploadNode);
      nodeKey = uploadNode.getKey();
    });

    return nodeKey ? this.#pendingAttachmentHandle(nodeKey) : null
  }

  insertPendingAttachments(files) {
    const fileList = Array.from(files);
    if (!this.editorElement.supportsAttachments || fileList.length === 0) return []

    let nodeKeys = [];
    this.editor.update(() => {
      const uploader = Uploader.for(this.editorElement, fileList, { pending: true });
      uploader.$uploadFiles();
      nodeKeys = (uploader.nodes ?? []).map(node => node.getKey());
    });

    return nodeKeys.map(nodeKey => this.#pendingAttachmentHandle(nodeKey))
  }

  #pendingAttachmentHandle(initialNodeKey) {
    const editor = this.editor;
    let nodeKey = initialNodeKey;

    return {
      setAttributes(blob) {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (!(node instanceof ActionTextAttachmentUploadNode)) return

          const replacementNodeKey = node.$showUploadedAttachment(blob);
          if (replacementNodeKey) {
            nodeKey = replacementNodeKey;
          }
        }, { tag: HISTORY_MERGE_TAG });
      },
      setUploadProgress(progress) {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (!(node instanceof ActionTextAttachmentUploadNode)) return

          node.getWritable().progress = progress;
        }, { tag: HISTORY_MERGE_TAG });
      },
      remove() {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (node) node.remove();
        });
      }
    }
  }

  replaceNodeWithHTML(nodeKey, html, options = {}) {
    this.editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node) return

      const selection = $getSelection();
      let wasSelected = false;

      if ($isRangeSelection(selection)) {
        const selectedNodes = selection.getNodes();
        wasSelected = selectedNodes.includes(node) || selectedNodes.some(n => n.getParent() === node);

        if (wasSelected) {
          $setSelection(null);
        }
      }

      const replacementNode = options.attachment ? this.#createCustomAttachmentNodeWithHtml(html, options.attachment) : this.#createHtmlNodeWith(html);
      node.replace(replacementNode);

      if (wasSelected) {
        replacementNode.selectEnd();
      }
    });
  }

  insertHTMLBelowNode(nodeKey, html, options = {}) {
    this.editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node) return

      const previousNode = node.getTopLevelElement() || node;

      const newNode = options.attachment ? this.#createCustomAttachmentNodeWithHtml(html, options.attachment) : this.#createHtmlNodeWith(html);
      previousNode.insertAfter(newNode);
    });
  }

  #insertableSelection() {
    const selection = $getSelection();
    if ($isNodeSelection(selection) && selection.getNodes().length === 0) {
      return $getRoot().selectEnd()
    }

    return selection ?? $getRoot().selectEnd()
  }

  #formatPastedDOM(doc) {
    new PastedContentFormatter(doc).format();
  }

  #dispatchPastedNodesCommand(nodes) {
    return this.editor.dispatchCommand(SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, {
      nodes, selection: $getSelection()
    })
  }

  #insertNodeIfRoot(node) {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return false

    const anchorNode = selection.anchor.getNode();
    if ($isRootOrShadowRoot(anchorNode)) {
      anchorNode.append(node);
      node.selectEnd();

      return true
    }

    return false
  }

  #unwrapCodeBlock(codeNode) {
    const children = codeNode.getChildren();
    const groups = [ [] ];

    for (const child of children) {
      if ($isLineBreakNode(child)) {
        groups.push([]);
      } else {
        groups[groups.length - 1].push(child.getTextContent());
      }
    }

    for (const group of groups) {
      const paragraph = $createParagraphNode();
      const text = group.join("");
      if (text) {
        paragraph.append($createTextNode(text));
      }
      codeNode.insertBefore(paragraph);
    }

    codeNode.remove();
  }

  #applyListFormat(listType, command) {
    if (this.selection.isInsideBlockQuote) {
      this.#insertListInsideQuote(listType);
    } else {
      this.#splitParagraphsAtLineBreaksUnlessInsideList();
      this.editor.dispatchCommand(command);
    }
  }

  #insertListInsideQuote(listType) {
    for (const group of $consecutiveSiblingGroups(this.#quotedBlocksInSelection())) {
      this.#wrapBlocksInList(group, listType);
    }
  }

  #quotedBlocksInSelection() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return []

    const blocks = this.#outermostElements(this.#blockLevelElementsInSelection(selection));
    return blocks.filter((block) => $isQuoteNode(block.getParent()))
  }

  #wrapBlocksInList(blocks, listType) {
    const list = $createListNode(listType);
    blocks[0].insertBefore(list);

    for (const block of blocks) {
      const listItem = $createListItemNode();
      if ($isListNode(block)) {
        listItem.append(...block.getChildren().flatMap((item) => item.getChildren()));
      } else {
        listItem.append(...block.getChildren());
      }
      list.append(listItem);
      block.remove();
    }
  }

  #splitParagraphsAtLineBreaksUnlessInsideList() {
    if (this.selection.isInsideList) return

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    $expandSelectionToLineBreaksAndSplitAtEdges(selection);
    $splitSelectedParagraphsAtInnerLineBreaks(selection);
  }

  #blockLevelElementsInSelection(selection) {
    const blocks = new Set();
    for (const node of selection.getNodes()) {
      blocks.add($getNearestBlockElementAncestorOrThrow(node));
    }

    return Array.from(blocks)
  }

  #topLevelElementsInSelection(selection) {
    const elements = new Set();
    for (const node of selection.getNodes()) {
      const topLevel = node.getTopLevelElement();
      if (topLevel) elements.add(topLevel);
    }
    return Array.from(elements)
  }

  // Selections spanning nested structures (a quote and its inner paragraphs,
  // nested list items) yield both an element and its ancestor. Converting the
  // ancestor detaches its whole subtree — including a node freshly inserted
  // inside it — which can leave the selection on removed nodes (Lexical
  // invariant #19). The outermost elements already cover their descendants'
  // text content, so keep only those.
  #outermostElements(elements) {
    return elements.filter((element) => {
      return elements.every((other) => other === element || !element.getParents().includes(other))
    })
  }

  #insertUploadNodes(nodes) {
    if (nodes.every($isActionTextAttachmentNode)) {
      const uploader = Uploader.for(this.editorElement, []);
      uploader.nodes = nodes;
      uploader.$insertUploadNodes();
      return true
    }
  }

  #unwrap(node) {
    const children = node.getChildren();

    if (children.length == 0) {
      node.insertBefore($createParagraphNode());
    } else {
      children.forEach((child) => {
        if ($isTextNode(child) && child.getTextContent().trim() !== "") {
          const newParagraph = $createParagraphNode();
          newParagraph.append(child);
          node.insertBefore(newParagraph);
        } else if (!$isLineBreakNode(child)) {
          node.insertBefore(child);
        }
      });
    }

    node.remove();
  }

  #getTextAnchorData() {
    const selection = $getSelection();
    if (!selection || !selection.isCollapsed()) return { anchorNode: null, offset: 0 }

    const anchor = selection.anchor;
    const anchorNode = anchor.getNode();

    if (!$isTextNode(anchorNode)) return { anchorNode: null, offset: 0 }

    return { anchorNode, offset: anchor.offset }
  }

  // The replaced span must start before the cursor but can extend past it
  // (e.g. "@Jack" when "@" was just inserted before "Jack"), so we bound the
  // match's start with lastIndexOf's fromIndex rather than slicing the text.
  #findReplacementStart(anchorNode, offset, stringToReplace) {
    if (offset === 0) {
      // A negative fromIndex clamps to 0 and could match at the cursor
      return -1
    } else {
      return anchorNode.getTextContent().lastIndexOf(stringToReplace, offset - 1)
    }
  }

  #performTextReplacement(anchorNode, startIndex, stringToReplace, replacementNodes) {
    const fullText = anchorNode.getTextContent();
    const textBeforeString = fullText.slice(0, startIndex);
    const textAfterString = fullText.slice(startIndex + stringToReplace.length);

    const textNodeBefore = this.#cloneTextNodeFormatting(anchorNode, textBeforeString);
    const textNodeAfter = this.#cloneTextNodeFormatting(anchorNode, textAfterString || " ");

    anchorNode.replace(textNodeBefore);

    const lastInsertedNode = this.#insertReplacementNodes(textNodeBefore, replacementNodes);
    lastInsertedNode.insertAfter(textNodeAfter);

    this.#appendLineBreakIfNeeded(textNodeAfter.getParentOrThrow());
    const cursorOffset = textAfterString ? 0 : 1;
    textNodeAfter.select(cursorOffset, cursorOffset);
  }

  #cloneTextNodeFormatting(anchorNode, text) {
    return $createTextNode(text)
      .setFormat(anchorNode.getFormat())
      .setDetail(anchorNode.getDetail())
      .setMode(anchorNode.getMode())
      .setStyle(anchorNode.getStyle())
  }

  #insertReplacementNodes(startNode, replacementNodes) {
    let previousNode = startNode;
    for (const node of replacementNodes) {
      previousNode.insertAfter(node);
      previousNode = node;
    }
    return previousNode
  }

  #appendLineBreakIfNeeded(paragraph) {
    if ($isParagraphNode(paragraph) && this.editorElement.supportsMultiLine) {
      const children = paragraph.getChildren();
      const last = children[children.length - 1];
      const beforeLast = children[children.length - 2];

      if ($isTextNode(last) && last.getTextContent() === "" && (beforeLast && !$isTextNode(beforeLast))) {
        paragraph.append($createLineBreakNode());
      }
    }
  }

  #createCustomAttachmentNodeWithHtml(html, options = {}) {
    const attachmentConfig = typeof options === "object" ? options : {};
    const contentType = attachmentConfig.contentType || "text/html";
    if (!this.editorElement.permitsAttachmentContentType(contentType)) {
      return this.#createHtmlNodeWith(html)
    }
    return new CustomActionTextAttachmentNode({
      sgid: attachmentConfig.sgid || null,
      contentType,
      innerHtml: html,
    })
  }

  #createHtmlNodeWith(html) {
    const htmlNodes = this.editorElement.$generateNodesFromDOM(parseHtml(html));
    return htmlNodes[0] || $createParagraphNode()
  }

  // When the selection anchor is on a shadow root (e.g. a table cell), Lexical's
  // insertNodes can't find a block parent and fails silently. Normalize the
  // selection to point inside the shadow root's content instead.
  #normalizeSelectionInShadowRoot() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode();
    if (!$isShadowRoot(anchorNode)) return

    // Append a paragraph inside the shadow root so there's a valid text-level
    // target for subsequent insertions. This is necessary because decorator
    // nodes (e.g. attachments) at the end of a table cell leave the selection
    // on the cell itself with no block-level descendant to anchor to.
    const paragraph = $createParagraphNode();
    anchorNode.append(paragraph);
    paragraph.selectStart();
  }
}

class Clipboard {
  #listeners = new ListenerBin()

  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
    this.contents = editorElement.contents;

    this.#registerPasteCommands();
  }

  dispose() {
    this.editorElement = null;
    this.editor = null;
    this.contents = null;

    this.#listeners.dispose();
  }

  paste(event) {
    const clipboardData = event.clipboardData;

    if (!clipboardData) return false

    if (this.#isPastingIntoCodeBlock()) {
      this.#pastePlainTextIntoCodeBlock(clipboardData);
      event.preventDefault();
      return true
    }

    if (this.#isPlainTextOrURLPasted(clipboardData)) {
      this.#pastePlainTextOrURL(clipboardData);
      event.preventDefault();
      return true
    }

    const handled = this.#handlePastedFiles(clipboardData);
    if (handled) event.preventDefault();
    return handled
  }

  #registerPasteCommands() {
    this.#listeners.track(
      this.editor.registerCommand(PASTE_COMMAND, this.paste.bind(this), COMMAND_PRIORITY_NORMAL),
      this.editor.registerCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        (payload) => this.#handleParsedClipboardNodes(payload),
        COMMAND_PRIORITY_NORMAL
      )
    );
  }

  #handleParsedClipboardNodes({ nodes, selection }) {
    const url = $bareUrlFromSingleLink(nodes);
    if (url && $isRangeSelection(selection)) {
      this.#insertSingleLinkAt(selection, url);
      return true
    }
  }

  #isPlainTextOrURLPasted(clipboardData) {
    return this.#isOnlyPlainTextPasted(clipboardData) || this.#isOnlyURLPasted(clipboardData)
  }

  #isOnlyPlainTextPasted(clipboardData) {
    const types = Array.from(clipboardData.types);
    return types.length === 1 && types[0] === "text/plain"
  }

  // Browsers expose a copied URL in several shapes:
  //   Safari          [ text/plain, text/uri-list ]
  //   App ShareSheet  [ text/uri-list ]
  //   Chromium macOS  [ text/plain, text/html, (?:text/link-preview) ]
  #isOnlyURLPasted(clipboardData) {
    if (this.#isLexicalClipboardData(clipboardData)) return false

    const types = Array.from(clipboardData.types);
    if (types.includes("text/uri-list")) {
      return types.every(type => type === "text/plain" || type === "text/uri-list")
    }

    if (clipboardData.files.length) return false

    const text = clipboardData.getData("text/plain").trim();
    if (!isAutolinkableURL(text)) return false

    const html = clipboardData.getData("text/html");
    return !html || this.#htmlIsBareLinkToURL(html, text)
  }

  #htmlIsBareLinkToURL(html, url) {
    const doc = parseHtml(html);
    if (doc.body.textContent.trim() !== url) return false

    const links = doc.body.querySelectorAll("a");
    if (links.length === 0) return true
    return links.length === 1 && links[0].getAttribute("href") === url
  }

  #isPastingIntoCodeBlock() {
    let result = false;

    this.editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return

      let currentNode = selection.anchor.getNode();

      while (currentNode) {
        if ($isCodeNode(currentNode)) {
          result = true;
          return
        }
        currentNode = currentNode.getParent();
      }
    });

    return result
  }

  #pastePlainTextIntoCodeBlock(clipboardData) {
    const text = clipboardData.getData("text/plain");
    if (!text) return

    this.editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) selection.insertRawText(text);
    }, { tag: PASTE_TAG });
  }

  #pastePlainTextOrURL(clipboardData) {
    const item = this.#plainTextOrURLItem(clipboardData);
    item.getAsString((text) => {
      const url = text.trim();
      if (isAutolinkableURL(url)) {
        this.#pasteURL(url);
      } else if (this.editorElement.supportsMarkdown) {
        this.#pasteMarkdown(text);
      } else {
        this.#pasteRichText(clipboardData);
      }
    });
  }

  #plainTextOrURLItem(clipboardData) {
    const items = Array.from(clipboardData.items);
    return items.find((item) => item.type === "text/plain") || items.find((item) => item.type === "text/uri-list")
  }

  #pasteURL(url) {
    if (this.contents.hasSelectedText()) {
      this.contents.createLinkWithSelectedText(url);
    } else {
      const nodeKey = this.contents.createLink(url);
      this.#dispatchLinkInsertEvent(nodeKey, { url });
    }
  }

  #insertSingleLinkAt(selection, url) {
    if (!$isRangeSelection(selection)) return

    if (!selection.isCollapsed()) {
      $toggleLink(null);
      $toggleLink(url);
      return
    }

    const linkNode = $createLinkNode(url).append($createTextNode(url));
    BaseNodeInserter.for(selection).insertNodes([ linkNode ]);

    $onUpdate(() => this.#dispatchLinkInsertEvent(linkNode.getKey(), { url }));
  }

  #dispatchLinkInsertEvent(nodeKey, payload) {
    const linkManipulationMethods = {
      replaceLinkWith: (html, options) => this.contents.replaceNodeWithHTML(nodeKey, html, options),
      insertBelowLink: (html, options) => this.contents.insertHTMLBelowNode(nodeKey, html, options)
    };

    dispatch(this.editorElement, "lexxy:insert-link", {
      ...payload,
      ...linkManipulationMethods
    });
  }

  #pasteMarkdown(text) {
    const html = marked(text, { breaks: true });
    const doc = parseHtml(html);

    if (this.#isPlainTextWithoutMarkdown(doc)) {
      this.contents.insertText(text, { tag: PASTE_TAG });
    } else {
      const detail = Object.freeze({
        markdown: text,
        document: doc,
        addBlockSpacing: () => addBlockSpacing(doc)
      });

      dispatch(this.editorElement, "lexxy:insert-markdown", detail);
      this.contents.insertDOM(doc, { tag: PASTE_TAG });
    }
  }

  // Markdown conversion collapses runs of whitespace and unescapes backslashes,
  // silently corrupting plain text such as Windows/UNC file paths. When the text
  // carries no Markdown structure, paste it verbatim instead. A path that wrapped
  // across lines renders as a single paragraph with <br> line breaks (marked runs
  // with breaks: true), which is still plain text we should preserve untouched.
  #isPlainTextWithoutMarkdown(doc) {
    const elements = Array.from(doc.body.children);
    if (elements.length !== 1) return false

    const paragraph = elements[0];
    return paragraph.nodeName === "P"
      && Array.from(paragraph.childNodes).every((node) => node.nodeType === Node.TEXT_NODE || node.nodeName === "BR")
  }

  #pasteRichText(clipboardData) {
    this.editor.update(() => {
      const selection = $getSelection();
      $insertDataTransferForRichText(clipboardData, selection, this.editor);
    }, { tag: PASTE_TAG });
  }

  #handlePastedFiles(clipboardData) {
    if (!this.editorElement.supportsAttachments) return false

    const html = clipboardData.getData("text/html");
    const files = clipboardData.files;

    if (files.length && this.#isCopiedImageHTML(html)) {
      this.#uploadFilesPreservingScroll(files);
      return true
    }

    if (html && !this.#isLexicalClipboardData(clipboardData)) {
      this.contents.insertHtml(html, { tag: PASTE_TAG });
      return true
    }

    if (files.length) {
      this.#uploadFilesPreservingScroll(files);
      return true
    }

    return false
  }

  #isLexicalClipboardData(clipboardData) {
    return Array.from(clipboardData.types).includes("application/x-lexical-editor")
  }

  #isCopiedImageHTML(html) {
    if (!html) return false

    const doc = parseHtml(html);
    const elementChildren = Array.from(doc.body.children);

    return elementChildren.length === 1 && elementChildren[0].tagName === "IMG"
  }

  #uploadFilesPreservingScroll(files) {
    this.#preservingScrollPosition(() => {
      if (files.length) {
        this.contents.uploadFiles(files, { selectLast: true });
      }
    });
  }

  // Deals with an issue in Safari where it scrolls to the tops after pasting attachments
  async #preservingScrollPosition(callback) {
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    callback();

    await nextFrame();

    window.scrollTo(scrollX, scrollY);
    this.editor.focus();
  }
}

function $bareUrlFromSingleLink(nodes) {
  if (nodes.length !== 1) return null

  const node = nodes[0];
  if ($isLinkNode(node)) return $bareUrlFromLink(node)

  if ($isParagraphNode(node)) {
    const children = node.getChildren();
    if (children.length === 1 && $isLinkNode(children[0])) {
      return $bareUrlFromLink(children[0])
    }
  }

  return null
}

function $bareUrlFromLink(linkNode) {
  const url = linkNode.getURL();
  if (!url) return null
  return linkNode.getTextContent() === url ? url : null
}

class Extensions {

  constructor(lexxyElement) {
    this.lexxyElement = lexxyElement;

    this.enabledExtensions = this.#initializeExtensions();
  }

  get lexicalExtensions() {
    return this.enabledExtensions.map(ext => ext.lexicalExtension).filter(Boolean)
  }

  initializeToolbars() {
    const toolbar = this.#lexxyToolbar;
    if (!toolbar) return

    this.#clearPreviousExtensionToolbarButtons(toolbar);
    this.#addExtensionToolbarButtons(toolbar);
    toolbar.requestOverflowRefresh();
  }

  dispose() {
    while (this.enabledExtensions.length) {
      this.enabledExtensions.pop().dispose();
    }
  }

  #clearPreviousExtensionToolbarButtons(toolbar) {
    toolbar.querySelectorAll("[data-lexxy-extension]").forEach(el => el.remove());
  }

  #addExtensionToolbarButtons(toolbar) {
    this.enabledExtensions.forEach(ext => {
      const childrenBefore = new Set(toolbar.children);
      ext.initializeToolbar(toolbar);
      for (const child of toolbar.children) {
        if (!childrenBefore.has(child)) {
          child.setAttribute("data-lexxy-extension", "");
        }
      }
    });
  }

  get allowedElements() {
    return this.enabledExtensions.flatMap(ext => ext.allowedElements)
  }

  get #lexxyToolbar() {
    return this.lexxyElement.toolbar
  }

  get #baseExtensions() {
    return this.lexxyElement.baseExtensions
  }

  get #configuredExtensions() {
    return Lexxy.global.get("extensions")
  }

  #initializeExtensions() {
    const extensionDefinitions = this.#baseExtensions.concat(this.#configuredExtensions);

    return extensionDefinitions.map(
      extension => new extension(this.lexxyElement)
    ).filter(extension => extension.enabled)
  }
}

class BrowserAdapter {
  frozenLinkKey = null

  dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {}
  dispatchEditorInitialized(detail) {}
  freeze() {}
  thaw() {}
  unlinkFrozenNode() {
    return false
  }
}

// Custom TextNode exportDOM that avoids redundant wrapping.
//
// Lexical's built-in TextNode.exportDOM() calls createDOM() which produces semantic tags
// like <strong> for bold and <em> for italic, then unconditionally wraps the result
// with presentational tags (<b>, <i>) for the same formats. This produces redundant markup
// like <b><strong>text</strong></b>.
//
// This custom export skips <b> when <strong> is already present and <i> when <em> is
// already present, while preserving <s> and <u> wrappers which have no semantic equivalents
// in createDOM's output.
//
// Any <span> elements produced by createDOM() are unwrapped, since they only carry
// editor classes that aren't meaningful in exported HTML.

function exportTextNodeDOM(editor, textNode) {
  const element = textNode.createDOM(editor._config, editor);
  element.style.whiteSpace = "pre-wrap";

  if (textNode.hasFormat("lowercase")) {
    element.style.textTransform = "lowercase";
  } else if (textNode.hasFormat("uppercase")) {
    element.style.textTransform = "uppercase";
  } else if (textNode.hasFormat("capitalize")) {
    element.style.textTransform = "capitalize";
  }

  let result = element;

  if (textNode.hasFormat("bold") && !containsTag(element, "strong")) {
    result = wrapWith(result, "b");
  }
  if (textNode.hasFormat("italic") && !containsTag(element, "em")) {
    result = wrapWith(result, "i");
  }
  if (textNode.hasFormat("strikethrough")) {
    result = wrapWith(result, "s");
  }
  if (textNode.hasFormat("underline")) {
    result = wrapWith(result, "u");
  }

  return { element: unwrapSpans(result) }
}

function containsTag(element, tagName) {
  const upperTag = tagName.toUpperCase();
  if (element.tagName === upperTag) return true

  return element.querySelector(tagName) !== null
}

function wrapWith(element, tag) {
  const wrapper = document.createElement(tag);
  wrapper.appendChild(element);
  return wrapper
}

function unwrapSpans(element) {
  if (element.tagName === "SPAN") return element.firstChild

  for (const span of element.querySelectorAll("span")) {
    span.replaceWith(...span.childNodes);
  }

  return element
}

class ProvisionalParagraphNode extends ParagraphNode {
  $config() {
    return this.config("provisonal_paragraph", {
      extends: ParagraphNode,
      importDOM: () => null,
      $transform: (node) => {
        node.concretizeIfEdited(node);
        node.removeUnlessRequired(node);
      }
    })
  }

  static neededBetween(nodeBefore, nodeAfter) {
    return !$isSelectableElement(nodeBefore, "next")
      && !$isSelectableElement(nodeAfter, "previous")
  }

  createDOM(editor) {
    const p = super.createDOM(editor);
    const selected = this.isSelected($getSelection());
    p.classList.add("provisional-paragraph");
    p.classList.toggle("hidden", !selected);
    return p
  }

  updateDOM(_prevNode, dom) {
    const selected = this.isSelected($getSelection());
    dom.classList.toggle("hidden", !selected);
    return false
  }

  getTextContent() {
    return ""
  }

  exportDOM() {
    return {
      element: null
    }
  }

  // override as Lexical has an interesting view of collapsed selection in ElementNodes
  // https://github.com/facebook/lexical/blob/f1e4f66014377b1f2595aec2b0ee17f5b7ef4dfc/packages/lexical/src/LexicalNode.ts#L646
  isSelected(selection = null) {
    const targetSelection = selection || $getSelection();
    if (!targetSelection) return false

    if (targetSelection.getNodes().some(node => node.is(this) || this.isParentOf(node))) return true

    // A collapsed range selection on the parent element at an offset adjacent to
    // this node means the caret is visually at this paragraph's position. Treat it
    // as selected so the paragraph is visible and the caret renders correctly.
    //
    // Both the offset matching our index (cursor just before us) and index + 1
    // (cursor just after us) count, because the provisional paragraph is an
    // invisible spacer: the browser resolves both offsets to the same visual spot.
    if ($isRangeSelection(targetSelection) && targetSelection.isCollapsed()) {
      const { anchor } = targetSelection;
      const parent = this.getParent();
      if (parent && anchor.getNode().is(parent) && anchor.type === "element") {
        const index = this.getIndexWithinParent();
        return anchor.offset === index || anchor.offset === index + 1
      }
    }

    return false
  }

  removeUnlessRequired(self = this.getLatest()) {
    if (!self.required) self.remove();
  }

  concretizeIfEdited(self = this.getLatest()) {
    if (self.getTextContentSize() > 0) {
      self.replace($createParagraphNode(), true);
    }
  }


  get required() {
    return this.isDirectRootChild && ProvisionalParagraphNode.neededBetween(...this.immediateSiblings)
  }

  get isDirectRootChild() {
    const parent = this.getParent();
    return $isRootOrShadowRoot(parent)
  }

  get immediateSiblings() {
    return [ this.getPreviousSibling(), this.getNextSibling() ]
  }
}

function $isProvisionalParagraphNode(node) {
  return node instanceof ProvisionalParagraphNode
}

function $isSelectableElement(node, direction) {
  return $isElementNode(node) && (direction === "next" ? node.canInsertTextBefore() : node.canInsertTextAfter())
}

class ProvisionalParagraphExtension extends LexxyExtension {
  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/provisional-paragraph",
      nodes: [
        ProvisionalParagraphNode
      ],
      register(editor) {
        return mergeRegister(
          // Process Provisional Paragraph Nodes on RootNode changes as sibling status influences whether
          // they are required and their visible/hidden status
          editor.registerNodeTransform(RootNode, $insertRequiredProvisionalParagraphs),
          editor.registerNodeTransform(RootNode, $removeUnneededProvisionalParagraphs),
          editor.registerCommand(SELECTION_CHANGE_COMMAND, $markAllProvisionalParagraphsDirty, COMMAND_PRIORITY_HIGH)
        )
      }
    })
  }
}

function $insertRequiredProvisionalParagraphs(rootNode) {
  const nodeBeforeRootSelection = $nodeBeforeRootSelection(rootNode);

  const firstNode = rootNode.getFirstChild();
  if (ProvisionalParagraphNode.neededBetween(null, firstNode)) {
    $insertFirst(rootNode, new ProvisionalParagraphNode);
  }

  for (const node of $firstToLastIterator(rootNode)) {
    const nextNode = node.getNextSibling();
    if (ProvisionalParagraphNode.neededBetween(node, nextNode)) {
      node.insertAfter(new ProvisionalParagraphNode);
      if (node.is(nodeBeforeRootSelection)) node.selectNext();
    }
  }
}

function $nodeBeforeRootSelection(rootNode) {
  const selection = $getSelection();
  if (!$isRootOrShadowRoot(selection?.anchor?.getNode())) return null

  return rootNode.getChildAtIndex(selection.anchor.offset - 1)
}

function $removeUnneededProvisionalParagraphs(rootNode) {
  for (const provisionalParagraph of $getAllProvisionalParagraphs(rootNode)) {
    provisionalParagraph.removeUnlessRequired();
  }
}

function $markAllProvisionalParagraphsDirty() {
  // Selection-driven visibility updates must not become standalone undo steps.
  $addUpdateTag(HISTORY_MERGE_TAG);

  for (const provisionalParagraph of $getAllProvisionalParagraphs()) {
    provisionalParagraph.markDirty();
  }
}

function $getAllProvisionalParagraphs(rootNode = $getRoot()) {
  return $descendantsMatching(rootNode.getChildren(), $isProvisionalParagraphNode)
}

// Registers code highlighting through the extension system so its node
// transforms exist before the initial editor state is applied. Registering
// after editor creation misses code blocks loaded from the initial value:
// their transform pass has already run, and Lexical's catch-up dirtying
// only sees the committed (still empty) state.
class CodeHighlightingExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/code-highlighting",
      register(editor) {
        return registerCodeHighlighting(editor, buildHighlightPreservingTokenizer(editor))
      }
    })
  }
}

const TRIX_LANGUAGE_ATTR = "language";

class TrixContentExtension extends LexxyExtension {

  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/trix-content",
      html: {
        import: {
          em: (element) => onlyStyledElements(element, {
            conversion: extendTextNodeConversion("i", $applyHighlightStyle),
            priority: 1
          }),
          span: (element) => onlyStyledElements(element, {
            conversion: extendTextNodeConversion("mark", $applyHighlightStyle),
            priority: 1
          }),
          strong: (element) => onlyStyledElements(element, {
            conversion: extendTextNodeConversion("b", $applyHighlightStyle),
            priority: 1
          }),
          del: () => ({
            conversion: extendTextNodeConversion("s", $applyStrikethrough, $applyHighlightStyle),
            priority: 1
          }),
          pre: (element) => onlyPreLanguageElements(element, {
            conversion: extendConversion(CodeNode, "pre", $applyLanguage),
            priority: 1
          })
        }
      }
    })
  }
}

function onlyStyledElements(element, conversion) {
  const elementHighlighted = element.style.color !== "" || element.style.backgroundColor !== "";
  return elementHighlighted ? conversion : null
}

function $applyStrikethrough(textNode) {
  if (!textNode.hasFormat("strikethrough")) textNode.toggleFormat("strikethrough");
  return textNode
}

function onlyPreLanguageElements(element, conversion) {
  return element.hasAttribute(TRIX_LANGUAGE_ATTR) ? conversion : null
}

function $applyLanguage(conversionOutput, element) {
  const language = normalizeCodeLang(element.getAttribute(TRIX_LANGUAGE_ATTR));
  conversionOutput.node.setLanguage(language);
}

class WrappedTableNode extends TableNode {
  $config() {
    return this.config("wrapped_table_node", { extends: TableNode })
  }

  static importDOM() {
    return super.importDOM()
  }

  canInsertTextBefore() {
    return false
  }

  canInsertTextAfter() {
    return false
  }

  exportDOM(editor) {
    const superExport = super.exportDOM(editor);

    return {
      ...superExport,
      after: (tableElement) => {
        if (superExport.after) {
          tableElement = superExport.after(tableElement);
          const clonedTable = tableElement.cloneNode(true);
          const wrappedTable = createElement("figure", { className: "lexxy-content__table-wrapper" }, clonedTable.outerHTML);
          return wrappedTable
        }

        return tableElement
      }
    }
  }
}

class TablesExtension extends LexxyExtension {

  get enabled() {
    return this.editorElement.supportsRichText
  }

  get allowedElements() {
    return [ "figure", "tbody" ]
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/tables",
      nodes: [
        WrappedTableNode,
        {
          replace: TableNode,
          with: () => new WrappedTableNode(),
          withKlass: WrappedTableNode
        },
        TableCellNode,
        TableRowNode
      ],
      register(editor) {
        setScrollableTablesActive(editor, true);

        return mergeRegister(
          registerTablePlugin(editor),

          // Lexxy registers extensions before setRootElement(), but table
          // drag-selection needs a root before wiring its pointer handlers.
          editor.registerRootListener((rootElement) => {
            if (rootElement) {
              return registerTableSelectionObserver(editor, true)
            }
          }),

          // A table in Lexxy is a Lexxy table: cell shading can't be set in the
          // editor, so any cell background only ever comes from foreign content
          // (pasted spreadsheets, loaded documents). Normalize every cell to no
          // background so it adopts the current theme. This also clears
          // Lexical's hardcoded default header background (Lexical #8089).
          editor.registerNodeTransform(TableCellNode, (node) => {
            if (node.getBackgroundColor() !== "") {
              node.setBackgroundColor("");
            }
          }),

          // Bug fix: Fix column header states (Lexical #8090)
          editor.registerNodeTransform(TableCellNode, (node) => {
            const headerState = node.getHeaderStyles();

            if (headerState !== TableCellHeaderStates.ROW) return

            const rowParent = node.getParent();
            const tableNode = rowParent?.getParent();
            if (!tableNode) return

            const rows = tableNode.getChildren();
            const cellIndex = rowParent.getChildren().indexOf(node);

            const cellsInRow = rowParent.getChildren();
            const isHeaderRow = cellsInRow.every(cell =>
              cell.getHeaderStyles() !== TableCellHeaderStates.NO_STATUS
            );

            const isHeaderColumn = rows.every(row => {
              const cell = row.getChildren()[cellIndex];
              return cell && cell.getHeaderStyles() !== TableCellHeaderStates.NO_STATUS
            });

            let newHeaderState = TableCellHeaderStates.NO_STATUS;

            if (isHeaderRow) newHeaderState |= TableCellHeaderStates.ROW;
            if (isHeaderColumn) newHeaderState |= TableCellHeaderStates.COLUMN;

            if (newHeaderState !== headerState) {
              node.setHeaderStyles(newHeaderState, TableCellHeaderStates.BOTH);
            }
          }),

          editor.registerCommand("insertTableRowAfter", () => {
            $insertTableRowAtSelection(true);
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("insertTableRowBefore", () => {
            $insertTableRowAtSelection(false);
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("insertTableColumnAfter", () => {
            $insertTableColumnAtSelection(true);
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("insertTableColumnBefore", () => {
            $insertTableColumnAtSelection(false);
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("deleteTableRow", () => {
            $deleteTableRowAtSelection();
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("deleteTableColumn", () => {
            $deleteTableColumnAtSelection();
          }, COMMAND_PRIORITY_NORMAL),

          editor.registerCommand("deleteTable", () => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return false
            $findTableNode(selection.anchor.getNode())?.remove();
          }, COMMAND_PRIORITY_NORMAL)
        )
      }
    })
  }
}

const MIME_TYPE$1 = "application/x-lexxy-node-key";

class AttachmentDragAndDrop {
  #editor
  #draggedNodeKey = null
  #rafId = null
  #draggingRafId = null
  #listeners = new ListenerBin()

  constructor(editor) {
    this.#editor = editor;

    // Register Lexical commands at HIGH priority to intercept before the
    // base @lexical/rich-text handlers (which return true and consume the events).
    this.#listeners.track(
      editor.registerCommand(DRAGSTART_COMMAND, (event) => this.#handleDragStart(event), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(DROP_COMMAND, (event) => this.#handleDrop(event), COMMAND_PRIORITY_HIGH),
    );

    // Use a root listener to register DOM-level dragover/dragend handlers
    // (these events need throttled rAF handling that works better as DOM listeners).
    this.#listeners.track(editor.registerRootListener((root, prevRoot) => {
      if (prevRoot) {
        prevRoot.removeEventListener("dragover", this.#onDragOver);
        prevRoot.removeEventListener("dragend", this.#onDragEnd);
      }
      if (root) {
        root.addEventListener("dragover", this.#onDragOver);
        root.addEventListener("dragend", this.#onDragEnd);
      }
    }));
  }

  destroy() {
    this.#cleanup();
    this.#listeners.dispose();
  }

  // -- Event handlers --------------------------------------------------------

  #handleDragStart(event) {
    if (event.target.closest?.("textarea")) return false

    const figure = event.target.closest?.("figure.attachment[data-lexical-node-key]");
    if (!figure) return false

    this.#draggedNodeKey = figure.dataset.lexicalNodeKey;
    event.dataTransfer.setData(MIME_TYPE$1, this.#draggedNodeKey);
    event.dataTransfer.effectAllowed = "move";

    // Add dragging class after a tick so it doesn't affect the drag image
    this.#draggingRafId = requestAnimationFrame(() => {
      this.#draggingRafId = null;
      figure.classList.add("lexxy-dragging");
    });

    return true
  }

  #onDragOver = (event) => {
    if (!this.#draggedNodeKey) return

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (!this.#rafId) {
      this.#rafId = requestAnimationFrame(() => {
        this.#rafId = null;
        this.#updateDropTarget(event);
      });
    }
  }

  #handleDrop(event) {
    if (!this.#draggedNodeKey) return false

    event.preventDefault();

    const target = this.#resolveDropTarget(event);
    const draggedKey = this.#draggedNodeKey;
    this.#cleanup();

    if (target) {
      this.#performDrop(draggedKey, target);
    }
    return true
  }

  #onDragEnd = () => {
    this.#cleanup();
  }

  // -- Drop target resolution -----------------------------------------------

  #updateDropTarget(event) {
    this.#clearDropIndicators();

    const target = this.#resolveDropTarget(event);
    if (!target) return

    if (target.type === "gallery" || target.type === "gallery-reorder") {
      target.element.classList.add(`lexxy-drop-target--gallery-${target.position}`);
    } else if (target.type === "list-item") {
      target.element.classList.add(`lexxy-drop-target--list-${target.position}`);
    } else {
      target.element.classList.add(`lexxy-drop-target--block-${target.position}`);
    }
  }

  #resolveDropTarget(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element) return null

    const rootElement = this.#editor.getRootElement();
    if (!rootElement || !rootElement.contains(element)) return null

    // Check if hovering over a previewable image (for gallery merge or reorder)
    const targetFigure = element.closest("figure.attachment--preview[data-lexical-node-key]");
    if (targetFigure && targetFigure.dataset.lexicalNodeKey !== this.#draggedNodeKey) {
      const targetGallery = targetFigure.closest(".attachment-gallery");
      if (targetGallery) {
        // If the dragged image is in the same gallery, this is a reorder
        const draggedFigure = rootElement.querySelector(`[data-lexical-node-key="${this.#draggedNodeKey}"]`);
        if (draggedFigure && targetGallery.contains(draggedFigure)) {
          const position = this.#computeHorizontalPosition(targetFigure, event.clientX);
          return { type: "gallery-reorder", element: targetFigure, nodeKey: targetFigure.dataset.lexicalNodeKey, position }
        }
      }
      const position = this.#computeHorizontalPosition(targetFigure, event.clientX);
      return { type: "gallery", element: targetFigure, nodeKey: targetFigure.dataset.lexicalNodeKey, position }
    }

    // Hovering over the dragged image itself inside a gallery — treat as no-op
    // to prevent fallthrough to the block handler, which would eject it from the gallery.
    if (targetFigure && targetFigure.closest(".attachment-gallery")) return null

    // Check if hovering over a gallery's empty space (for reorder within gallery)
    const targetGallery = element.closest(".attachment-gallery");
    if (targetGallery) {
      let galleryFigure = element.closest("figure.attachment[data-lexical-node-key]");
      if (!galleryFigure) {
        galleryFigure = this.#findNearestFigureInGallery(targetGallery, event.clientX);
      }
      if (galleryFigure && galleryFigure.dataset.lexicalNodeKey !== this.#draggedNodeKey) {
        const position = this.#computeHorizontalPosition(galleryFigure, event.clientX);
        return { type: "gallery-reorder", element: galleryFigure, nodeKey: galleryFigure.dataset.lexicalNodeKey, position }
      }
      // Nearest figure is the dragged image — no-op to avoid block handler fallthrough
      if (galleryFigure) return null
    }

    // Check if hovering over a list item (for list splitting)
    const listItem = element.closest("li");
    if (listItem && rootElement.contains(listItem)) {
      const position = this.#computeVerticalPosition(listItem, event.clientY);
      return { type: "list-item", element: listItem, position }
    }

    // Otherwise, find nearest block-level element for between-block insertion.
    // Normalize so each gap has exactly one indicator: prefer "after" on the
    // previous sibling, falling back to "before" only for the first block.
    const block = this.#findNearestBlock(element, rootElement, event.clientY);
    if (!block) return null

    const position = this.#computeVerticalPosition(block, event.clientY);
    if (position === "before" && block.previousElementSibling) {
      return { type: "block", element: block.previousElementSibling, position: "after" }
    }
    return { type: "block", element: block, position }
  }

  #findNearestBlock(element, rootElement, clientY) {
    let current = element;
    while (current && current !== rootElement) {
      if (current.parentElement === rootElement) return current
      current = current.parentElement;
    }

    // elementFromPoint landed on the root itself (e.g. a margin gap between
    // blocks). Fall back to the nearest child by vertical distance.
    let nearest = null;
    let minDistance = Infinity;
    for (const child of rootElement.children) {
      const rect = child.getBoundingClientRect();
      const distance = Math.min(Math.abs(clientY - rect.top), Math.abs(clientY - rect.bottom));
      if (distance < minDistance) {
        minDistance = distance;
        nearest = child;
      }
    }
    return nearest
  }

  #computeVerticalPosition(element, clientY) {
    const rect = element.getBoundingClientRect();
    return clientY < rect.top + rect.height / 2 ? "before" : "after"
  }

  #computeHorizontalPosition(element, clientX) {
    const rect = element.getBoundingClientRect();
    return clientX < rect.left + rect.width / 2 ? "before" : "after"
  }

  #findNearestFigureInGallery(gallery, clientX) {
    const figures = gallery.querySelectorAll("figure.attachment[data-lexical-node-key]");
    let nearest = null;
    let minDistance = Infinity;
    for (const figure of figures) {
      const rect = figure.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(clientX - center);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = figure;
      }
    }
    return nearest
  }

  // -- Drop indicator --------------------------------------------------------

  static #DROP_CLASSES = [
    "lexxy-drop-target--gallery-before", "lexxy-drop-target--gallery-after",
    "lexxy-drop-target--list-before", "lexxy-drop-target--list-after",
    "lexxy-drop-target--block-before", "lexxy-drop-target--block-after",
  ]

  #clearDropIndicators() {
    const rootElement = this.#editor.getRootElement();
    if (!rootElement) return

    for (const el of rootElement.querySelectorAll("[class*='lexxy-drop-target--']")) {
      el.classList.remove(...AttachmentDragAndDrop.#DROP_CLASSES);
    }
  }

  // -- Node operations -------------------------------------------------------

  #performDrop(draggedKey, target) {
    const draggedNode = $getNodeByKey(draggedKey);
    if (!draggedNode || !$isActionTextAttachmentNode(draggedNode)) return

    if (target.type === "gallery") {
      this.#dropOntoImage(draggedNode, target.nodeKey, target.position);
    } else if (target.type === "gallery-reorder") {
      this.#reorderInGallery(draggedNode, target.nodeKey, target.position);
    } else if (target.type === "list-item") {
      this.#dropIntoList(draggedNode, target);
    } else {
      this.#dropBetweenBlocks(draggedNode, target);
    }

    // Clear selection to prevent a second history entry. Lexical dispatches
    // SELECTION_CHANGE_COMMAND during commit for non-range selections, which
    // creates a separate update. Null selection avoids that dispatch entirely
    // and also prevents Firefox's follow-up selectionchange from dirtying nodes.
    $setSelection(null);
  }

  #dropOntoImage(draggedNode, targetKey, position) {
    const targetNode = $getNodeByKey(targetKey);
    if (!targetNode || !$isActionTextAttachmentNode(targetNode)) return
    if (draggedNode.is(targetNode)) return

    draggedNode.remove();

    const gallery = $findOrCreateGalleryForImage(targetNode);
    if (gallery) {
      if (position === "before") {
        targetNode.insertBefore(draggedNode);
      } else {
        targetNode.insertAfter(draggedNode);
      }
    }
  }

  #reorderInGallery(draggedNode, targetKey, position) {
    const targetNode = $getNodeByKey(targetKey);
    if (!targetNode || draggedNode.is(targetNode)) return

    draggedNode.remove();

    if (position === "before") {
      targetNode.insertBefore(draggedNode);
    } else {
      targetNode.insertAfter(draggedNode);
    }
  }

  #dropIntoList(draggedNode, target) {
    const listItemNode = $getNearestNodeFromDOMNode(target.element);
    if (!listItemNode || !$isListItemNode(listItemNode)) return

    const listNode = listItemNode.getParent();
    if (!listNode || !$isListNode(listNode)) return

    const children = listNode.getChildren();
    const index = children.indexOf(listItemNode);
    if (index === -1) return

    const splitIndex = target.position === "before" ? index : index + 1;

    draggedNode.remove();

    if (splitIndex === 0) {
      listNode.insertBefore(draggedNode);
    } else if (splitIndex >= children.length) {
      listNode.insertAfter(draggedNode);
    } else {
      const [ , listAfter ] = $splitNode(listNode, splitIndex);
      listAfter.insertBefore(draggedNode);
    }
  }

  #dropBetweenBlocks(draggedNode, target) {
    const targetNode = $getNearestNodeFromDOMNode(target.element);
    if (!targetNode) return

    const topLevelTarget = targetNode.getTopLevelElement?.() || targetNode;
    if (draggedNode.is(topLevelTarget)) return

    draggedNode.remove();

    if (target.position === "before") {
      topLevelTarget.insertBefore(draggedNode);
    } else {
      topLevelTarget.insertAfter(draggedNode);
    }
  }

  // -- Lifecycle helpers -----------------------------------------------------

  #cleanup() {
    this.#clearDropIndicators();

    if (this.#draggedNodeKey) {
      const rootElement = this.#editor.getRootElement();
      if (rootElement) {
        const figure = rootElement.querySelector(`[data-lexical-node-key="${this.#draggedNodeKey}"]`);
        figure?.classList.remove("lexxy-dragging");
      }
    }

    this.#draggedNodeKey = null;

    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }

    if (this.#draggingRafId) {
      cancelAnimationFrame(this.#draggingRafId);
      this.#draggingRafId = null;
    }
  }
}

const ATTACHMENT_ATTRIBUTES = [ "alt", "caption", "content", "content-type", "data-direct-upload-id",
  "data-sgid", "filename", "filesize", "height", "presentation", "previewable", "sgid", "url", "width" ];

const UPLOADS_BUSY_MESSAGE = "Please wait for all files to upload";

class AttachmentsExtension extends LexxyExtension {
  #uploadsCount = 0

  get enabled() {
    return this.editorElement.supportsAttachments
  }

  get allowedElements() {
    return [ { tag: ActionTextAttachmentNode.TAG_NAME, attributes: ATTACHMENT_ATTRIBUTES } ]
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/action-text-attachments",
      nodes: [
        ActionTextAttachmentNode,
        ActionTextAttachmentUploadNode,
        ImageGalleryNode
      ],
      register: (editor) => {
        const dragAndDrop = new AttachmentDragAndDrop(editor);

        return mergeRegister(
          editor.registerNodeTransform(ActionTextAttachmentNode, $extractAttachmentFromParagraph),
          editor.registerCommand(DELETE_CHARACTER_COMMAND, $collapseIntoGallery, COMMAND_PRIORITY_NORMAL),
          editor.registerMutationListener(ActionTextAttachmentUploadNode, this.#handleUploadMutations.bind(this)),
          () => dragAndDrop.destroy()
        )
      }
    })
  }

  #handleUploadMutations(mutations) {
    const previousUploadsCount = this.#uploadsCount;
    for (const [ key, mutation ] of mutations) {
      if (mutation === "created") {
        this.#uploadsCount++;
      } else if (mutation === "destroyed") {
        this.#uploadsCount--;
        this.editorElement.uploadRequests.abort(key);
      }
    }

    if (this.#uploadsCount !== previousUploadsCount) {
      this.#setUploadsValidity();
    }
  }

  #setUploadsValidity() {
    if (this.#uploadsCount) {
      this.setEditorValidity({ customError: true }, UPLOADS_BUSY_MESSAGE);
    } else {
      this.setEditorValidity({});
    }
  }
}

// Decorator nodes can be wrapped in a Paragraph Node by Lexical when contained in a <div>
// We remove them, splitting the node as needed
function $extractAttachmentFromParagraph(attachmentNode) {
  const parentNode = attachmentNode.getParent();
  if (!$isParagraphNode(parentNode)) return

  if (parentNode.getChildrenSize() === 1) {
    parentNode.replace(attachmentNode);
  } else {
    const index = attachmentNode.getIndexWithinParent();
    const [ topParagraph, bottomParagraph ] = $splitNode(parentNode, index);
    topParagraph.insertAfter(attachmentNode);

    for (const p of [ topParagraph, bottomParagraph ]) {
      if (p.isEmpty()) p.remove();
    }
  }
}

function $collapseIntoGallery(backwards) {
  const anchor = $getSelection()?.anchor;
  if (!anchor) return false

  if ($collapseAtGalleryEdge(anchor, backwards)) {
    return true
  } else if (backwards) {
    return $collapseAroundEmptyParagraph(anchor)
      || $moveSelectionBeforeGallery(anchor)
  }

  return false
}

function $collapseAroundEmptyParagraph(anchor) {
  const anchorNode = anchor.getNode();
  if (!anchorNode) return false

  const isWithinEmptyParagraph = $isParagraphNode(anchorNode) && anchorNode.isEmpty();
  const previousSibling = anchorNode.getPreviousSibling();
  const topGallery = $findOrCreateGalleryForImage(previousSibling);
  const selectionIndex = topGallery?.getChildrenSize();

  if (isWithinEmptyParagraph && topGallery?.collapseWith(anchorNode.getNextSibling())) {
    topGallery.select(selectionIndex, selectionIndex);
    anchorNode.remove();
    return true
  } else {
    return false
  }
}

function $collapseAtGalleryEdge(anchor, backwards) {
  const anchorNode = anchor.getNode();
  if (!$isImageGalleryNode(anchorNode)) return false

  const isAtGalleryEdge = $isAtNodeEdge(anchor, backwards);
  const sibling = backwards ? anchorNode.getPreviousSibling() : anchorNode.getNextSibling();

  if (isAtGalleryEdge && anchorNode.collapseWith(sibling, backwards)) {
    const selectionOffset = backwards ? 1 : anchorNode.getChildrenSize() - 1;
    anchorNode.select(selectionOffset, selectionOffset);
    return true
  } else {
    return false
  }
}

// Manual selection handling to prevent Lexical merging the gallery with a <p> and unwrapping it
function $moveSelectionBeforeGallery(anchor) {
  const previousNode = anchor.getNode().getPreviousSibling();
  if (!$isImageGalleryNode(anchor.getNode()) || !$isAtNodeEdge(anchor, true) || !previousNode) return false

  if ($isDecoratorNode(previousNode)) {
    // Handled by Lexxy decorator selection behavior
    return false
  } else if (previousNode.isEmpty()) {
    previousNode.remove();
  } else {
    previousNode.selectEnd();
  }

  return true
}

class EarlyEscapeCodeNode extends CodeNode {
  $config() {
    return this.config("early_escape_code", { extends: CodeNode })
  }

  static $fromSelection(selection) {
    const anchorNode = selection.anchor.getNode();
    return $getNearestNodeOfType(anchorNode, EarlyEscapeCodeNode)
      || (anchorNode instanceof EarlyEscapeCodeNode ? anchorNode : null)
  }

  insertNewAfter(selection, restoreSelection) {
    if ($hasUpdateTag(PASTE_TAG) || !selection.isCollapsed()) {
      return super.insertNewAfter(selection, restoreSelection)
    } else if (this.#isCursorAtStart(selection)) {
      return this.#insertParagraphBefore()
    } else if (this.#isCursorOnWhitespaceOnlyLastLine(selection)) {
      return this.#insertBlankLineBelow(selection, restoreSelection)
    } else if (this.#isCursorOnEmptyLastLine(selection)) {
      return this.#escapeToNewParagraphAfter()
    } else {
      return super.insertNewAfter(selection, restoreSelection)
    }
  }

  #isCursorAtStart(selection) {
    const { anchor } = selection;
    if (!$isAtNodeStart(anchor)) return false

    const anchorNode = anchor.getNode();
    return this.is(anchorNode) || this.getFirstChild()?.is(anchorNode)
  }

  #isCursorOnEmptyLastLine(selection) {
    if (!$isCursorOnLastLine(selection)) return false

    const textContent = this.getTextContent();
    return textContent === "" || textContent.endsWith("\n")
  }

  #isCursorOnWhitespaceOnlyLastLine(selection) {
    if (!$isCursorOnLastLine(selection)) return false

    const textContent = this.getTextContent();
    const lastNewlineIndex = textContent.lastIndexOf("\n");
    const lastLine = lastNewlineIndex === -1 ? textContent : textContent.slice(lastNewlineIndex + 1);
    return lastLine.length > 0 && lastLine.trim() === ""
  }

  #insertParagraphBefore() {
    this.insertBefore($createParagraphNode());
    return null
  }

  #insertBlankLineBelow(selection, restoreSelection) {
    super.insertNewAfter(selection, restoreSelection);
    this.getLastChild().remove();
    return null
  }

  #escapeToNewParagraphAfter() {
    $trimTrailingBlankNodes(this);
    const paragraph = $createParagraphNode();
    this.insertAfter(paragraph);
    return paragraph
  }
}

class EarlyEscapeListItemNode extends ListItemNode {
  $config() {
    return this.config("early_escape_listitem", { extends: ListItemNode })
  }

  insertNewAfter(selection, restoreSelection) {
    if (this.#shouldEscape(selection)) {
      return this.#escapeFromList()
    }

    return super.insertNewAfter(selection, restoreSelection)
  }

  get #isInBlockquote() {
    return Boolean($getNearestNodeOfType(this, QuoteNode))
  }

  #shouldEscape(selection) {
    if (this.#isInPasteOperation() || !this.#isInBlockquote) {
      return false
    } else if ($isBlankNode(this)) {
      return true
    } else {
      const paragraph = $getNearestNodeOfType(selection.anchor.getNode(), ParagraphNode);
      return paragraph && $isBlankNode(paragraph) && $isListItemNode(paragraph.getParent())
    }
  }

  #isInPasteOperation() {
    return $hasUpdateTag(PASTE_TAG)
  }

  #escapeFromList() {
    const parentList = this.getParent();
    if (!parentList || !$isListNode(parentList)) return

    const blockquote = parentList.getParent();
    const isInBlockquote = blockquote && $isQuoteNode(blockquote);

    if (isInBlockquote) {
      const hasNonEmptyListItems = this.getNextSiblings().some(
        sibling => $isListItemNode(sibling) && !$isBlankNode(sibling)
      );

      if (hasNonEmptyListItems) {
        return this.#splitBlockquoteWithList()
      }
    }

    const paragraph = $createParagraphNode();
    parentList.insertAfter(paragraph);

    this.remove();
    return paragraph
  }

  #splitBlockquoteWithList() {
    const splitQuotes = $splitNode(this.getParent(), this.getIndexWithinParent());
    this.remove();

    const middleParagraph = $createParagraphNode();
    splitQuotes[0].insertAfter(middleParagraph);

    splitQuotes.forEach($trimTrailingBlankNodes);

    return middleParagraph
  }

}

class FormatEscapeExtension extends LexxyExtension {

  get enabled() {
    return this.editorElement.supportsRichText
  }

  get allowedElements() {
    return [ { tag: "ol", attributes: [ "start" ] }, { tag: "li", attributes: [ "value" ] } ]
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/format-escape",
      nodes: [
        EarlyEscapeCodeNode,
        { replace: CodeNode, with: (node) => new EarlyEscapeCodeNode(node.getLanguage()), withKlass: EarlyEscapeCodeNode },
        EarlyEscapeListItemNode,
        { replace: ListItemNode, with: () => new EarlyEscapeListItemNode(), withKlass: EarlyEscapeListItemNode },
      ],
      register(editor) {
        return mergeRegister(
          editor.registerCommand(
            INSERT_PARAGRAPH_COMMAND,
            () => $escapeFromBlockquote(),
            COMMAND_PRIORITY_HIGH
          ),
          editor.registerCommand(
            KEY_ARROW_DOWN_COMMAND,
            (event) => $handleArrowDownInCodeBlock(event),
            COMMAND_PRIORITY_NORMAL
          ),
          editor.registerNodeTransform(QuoteNode, $ensureQuoteHasParagraphChild)
        )
      }
    })
  }
}

function $escapeFromBlockquote() {
  return $escapeBeforeBlockquoteStart() || $escapeFromBlankBlockquoteParagraph()
}

function $escapeBeforeBlockquoteStart() {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed() || selection.anchor.offset !== 0) return false

  const paragraph = $getNearestNodeOfType(selection.anchor.getNode(), ParagraphNode);
  if (paragraph && !$isBlankNode(paragraph) && !paragraph.getPreviousSibling()) {
    const blockquote = paragraph.getParent();
    if ($isQuoteNode(blockquote)) {
      blockquote.insertBefore($createParagraphNode());
      return true
    }
  }

  return false
}

function $escapeFromBlankBlockquoteParagraph() {
  const anchorNode = $getSelection().anchor.getNode();

  const paragraph = $getNearestNodeOfType(anchorNode, ParagraphNode);
  if (!paragraph || !$isBlankNode(paragraph)) return false

  const blockquote = paragraph.getParent();
  if ($isQuoteNode(blockquote)) {
    const nonEmptySiblings = paragraph.getNextSiblings().filter(sibling => !$isBlankNode(sibling));

    if (nonEmptySiblings.length > 0) {
      $splitQuoteNode(blockquote, paragraph);
    } else {
      blockquote.insertAfter(paragraph);
      paragraph.selectStart();
    }

    return true
  }

  return false
}

function $splitQuoteNode(node, paragraph) {
  const splitQuotes = $splitNode(node, paragraph.getIndexWithinParent());
  splitQuotes[0].insertAfter(paragraph);
  splitQuotes.forEach($trimTrailingBlankNodes);
  paragraph.selectEnd();
}

function $handleArrowDownInCodeBlock(event) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

  const codeNode = EarlyEscapeCodeNode.$fromSelection(selection);
  if (!codeNode) return false

  if ($isCursorOnLastLine(selection) && !codeNode.getNextSibling()) {
    event?.preventDefault();
    const paragraph = $createParagraphNode();
    codeNode.insertAfter(paragraph);
    paragraph.selectEnd();
    return true
  }

  return false
}

function $ensureQuoteHasParagraphChild(quoteNode) {
  if (!quoteNode.isEmpty()) return

  quoteNode.append($createParagraphNode());
  if ($containsRangeSelection(quoteNode)) quoteNode.getFirstChild().select();
}

class LinkOpenerExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/link-opener",
      register: (editor) => mergeRegister$1(
        editor.registerCommand(CLICK_COMMAND, this.#handleClick.bind(this), COMMAND_PRIORITY_NORMAL),
        registerEventListener(this.editorElement.editorContentElement, "auxclick", this.#handleAuxClick.bind(this)),
        registerEventListener(window, "keydown", this.#handleKey.bind(this)),
        registerEventListener(window, "keyup", this.#handleKey.bind(this)),
        registerEventListener(window, "focus", this.#handleFocus.bind(this))
      )
    })
  }

  #handleClick(event) {
    if (this.#isModified(event)) {
      return $openLink(event.target)
    } else {
      return false
    }
  }

  #handleAuxClick(event) {
    if (event.button === 1) {
      this.editorElement.editor.read(() => $openLink(event.target));
    }
  }

  #handleKey(event) {
    this.#updateOpenableAttribute(event);
  }

  // Chrome dispatches events without modifier keys *for a while* after changing tabs
  async #handleFocus() {
    await delay(200);
    this.editorElement.addEventListener("mousemove", this.#updateOpenableAttribute.bind(this), { once: true });
  }

  #updateOpenableAttribute(event) {
    this.editorElement.toggleAttribute("data-links-openable", this.#isModified(event));
  }

  #isModified(event) {
    return IS_APPLE ? event.metaKey : event.ctrlKey
  }
}

function $openLink(target) {
  const node = $getNearestNodeFromDOMNode(target);
  const linkNode = $findMatchingParent(node, $isLinkNode);
  if (linkNode) {
    const url = linkNode.sanitizeUrl(linkNode.getURL());
    window.open(url, "_blank", "noopener,noreferrer");
    return true
  } else {
    return false
  }
}

class PreventLexicalTripleClickExtension extends LexxyExtension {
  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/prevent-lexical-triple-click",
      register: (editor) => editor.registerRootListener((rootElement) => {
        if (rootElement) {
          return registerEventListener(
            rootElement,
            "click",
            this.#handleTripleClick.bind(this),
            { capture: true }
          )
        }
      })
    })
  }

  // Stop propagation of the triple-click to prevent Lexical's handler from running.
  //
  // Lexical's onClick handler implements a triple-click handler that is trivial/anemic/naïve. The
  // intention of the change, made in facebook/lexical#4512, seems to be to deal with browsers'
  // "overselection" behavior, where a triple-click selection might end at offset 0 of the following
  // block, which can cause issues when transforming the selection. But the implementation breaks
  // many common real-world use cases and Lexxy does not demonstrate the behavior it's intended to
  // work around (in headers or tables).
  #handleTripleClick(event) {
    if (event.detail === 3) {
      event.stopPropagation();
    }
  }
}

function caretRect(node, offset) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);

  const rect = range.getBoundingClientRect();
  if (rect.height > 0) {
    return rect
  } else {
    return null
  }
}

function caretFromPoint(clientX, clientY) {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(clientX, clientY);
    if (position) return { node: position.offsetNode, offset: position.offset }
  } else if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(clientX, clientY);
    if (range) return { node: range.startContainer, offset: range.startOffset }
  }

  return null
}

const MIME_TYPE = "application/x-lexxy-custom-attachment-key";

// Custom inline attachments reorder by dropping at a text caret, unlike block
// attachments which insert between blocks or into galleries.
class CustomAttachmentDragAndDrop {
  #editor
  #draggedNodeKey = null
  #draggingRafId = null
  #dragOverRafId = null
  #dropIndicator = null
  #listeners = new ListenerBin()

  constructor(editor) {
    this.#editor = editor;

    // Register at HIGH priority to intercept before the base @lexical/rich-text
    // handlers, which consume drag events. The block-attachment handler also
    // registers here but bails for inline custom attachments, so we get our turn.
    this.#listeners.track(
      editor.registerCommand(DRAGSTART_COMMAND, (event) => this.#handleDragStart(event), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(DROP_COMMAND, (event) => this.#handleDrop(event), COMMAND_PRIORITY_HIGH)
    );

    this.#listeners.track(editor.registerRootListener((root, prevRoot) => {
      if (prevRoot) {
        prevRoot.removeEventListener("dragover", this.#onDragOver);
        prevRoot.removeEventListener("dragend", this.#onDragEnd);
      }
      if (root) {
        root.addEventListener("dragover", this.#onDragOver);
        root.addEventListener("dragend", this.#onDragEnd);
      }
    }));
  }

  destroy() {
    this.#cleanup();
    this.#dropIndicator?.remove();
    this.#dropIndicator = null;
    this.#listeners.dispose();
  }

  #handleDragStart(event) {
    const attachment = this.#customAttachmentElementFrom(event.target);
    if (!attachment) return false

    this.#draggedNodeKey = attachment.dataset.lexicalNodeKey;
    event.dataTransfer.setData(MIME_TYPE, this.#draggedNodeKey);
    event.dataTransfer.effectAllowed = "move";

    this.#draggingRafId = requestAnimationFrame(() => {
      this.#draggingRafId = null;
      attachment.classList.add("lexxy-dragging");
    });

    return true
  }

  #onDragOver = (event) => {
    if (!this.#draggedNodeKey) return

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (!this.#dragOverRafId) {
      this.#dragOverRafId = requestAnimationFrame(() => {
        this.#dragOverRafId = null;
        this.#updateDropIndicator(event);
      });
    }
  }

  #onDragEnd = () => {
    this.#cleanup();
  }

  #handleDrop(event) {
    if (!this.#draggedNodeKey) return false

    event.preventDefault();

    const dropPoint = this.#resolveDropPoint(event);
    const draggedKey = this.#draggedNodeKey;
    this.#cleanup();

    if (dropPoint) {
      this.#moveAttachment(draggedKey, dropPoint);
    }

    return true
  }

  #resolveDropPoint(event) {
    const rootElement = this.#editor.getRootElement();
    if (!rootElement) return null

    const caret = caretFromPoint(event.clientX, event.clientY);
    if (!caret || !rootElement.contains(caret.node)) return null

    // A caret on the root itself points between blocks. Mentions behave like text:
    // they only drop onto an existing line, so snap to the nearest one.
    if (caret.node === rootElement) {
      return this.#nearestLineCaret(rootElement, event.clientY)
    }

    // When mentions sit next to each other with no text between them, the caret
    // lands inside the neighbouring decorator's DOM. Lexical can't resolve a point
    // inside a decorator to an editable position, and the cursor has no business
    // showing there anyway, so snap to just before or after that mention.
    const decorator = this.#decoratorElementContaining(caret.node);
    if (decorator) {
      return this.#dropPointBesideDecorator(decorator, event.clientX)
    } else {
      return caret
    }
  }

  #nearestLineCaret(rootElement, clientY) {
    let nearestLine = null;
    let nearestDistance = Infinity;

    for (const line of rootElement.children) {
      const rect = line.getBoundingClientRect();
      const distance = Math.min(Math.abs(clientY - rect.top), Math.abs(clientY - rect.bottom));
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestLine = line;
      }
    }

    if (!nearestLine) return null

    const rect = nearestLine.getBoundingClientRect();
    if (clientY < rect.top) {
      return { node: nearestLine, offset: 0 }
    } else {
      return { node: nearestLine, offset: nearestLine.childNodes.length }
    }
  }

  #decoratorElementContaining(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return element?.closest("[data-lexxy-decorator][data-lexical-node-key]")
  }

  #dropPointBesideDecorator(decorator, clientX) {
    const rect = decorator.getBoundingClientRect();
    const placement = clientX > rect.left + rect.width / 2 ? "after" : "before";
    return { decoratorKey: decorator.dataset.lexicalNodeKey, placement }
  }

  #moveAttachment(draggedKey, dropPoint) {
    this.#editor.update(() => {
      const draggedNode = $getNodeByKey(draggedKey);
      if (!$isCustomActionTextAttachmentNode(draggedNode)) return

      if (dropPoint.decoratorKey) {
        this.#moveBesideNode(draggedNode, dropPoint);
      } else {
        this.#moveToCaret(draggedNode, dropPoint);
      }
    });
  }

  #moveBesideNode(draggedNode, { decoratorKey, placement }) {
    const targetNode = $getNodeByKey(decoratorKey);
    if (!targetNode || targetNode === draggedNode) return

    draggedNode.remove();
    if (placement === "after") {
      targetNode.insertAfter(draggedNode);
    } else {
      targetNode.insertBefore(draggedNode);
    }
  }

  #moveToCaret(draggedNode, dropPoint) {
    const selection = $createRangeSelectionFromDom({
      anchorNode: dropPoint.node,
      anchorOffset: dropPoint.offset,
      focusNode: dropPoint.node,
      focusOffset: dropPoint.offset
    }, this.#editor);
    if (!selection) return

    $setSelection(selection);

    draggedNode.remove();
    selection.insertNodes([ draggedNode ]);
  }

  #updateDropIndicator(event) {
    this.#hideCaret();

    const dropPoint = this.#resolveDropPoint(event);
    if (dropPoint) this.#showCaret(this.#caretRectFor(dropPoint));
  }

  #caretRectFor(dropPoint) {
    if (dropPoint.decoratorKey) {
      return this.#decoratorEdgeRect(dropPoint)
    }

    const { node, offset } = dropPoint;
    const rect = caretRect(node, offset);
    if (rect) return rect

    // A blank line has no text to measure, so fall back to the line's own box.
    const line = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!line) return null

    const lineRect = line.getBoundingClientRect();
    return { left: lineRect.left, top: lineRect.top, height: lineRect.height }
  }

  #decoratorEdgeRect({ decoratorKey, placement }) {
    const decorator = this.#editor.getRootElement()?.querySelector(`[data-lexical-node-key="${decoratorKey}"]`);
    if (!decorator) return null

    const rect = decorator.getBoundingClientRect();
    const left = placement === "after" ? rect.right : rect.left;
    return { left, top: rect.top, height: rect.height }
  }

  #showCaret(rect) {
    if (!rect) return

    const caret = this.#ensureCaretIndicator();
    caret.style.blockSize = `${rect.height}px`;
    caret.style.insetInlineStart = `${rect.left}px`;
    caret.style.insetBlockStart = `${rect.top}px`;
  }

  #ensureCaretIndicator() {
    this.#dropIndicator ||= createElement("div", { className: "lexxy-drop-caret" });

    this.#editorElement().appendChild(this.#dropIndicator);
    this.#dropIndicator.style.display = "block";
    return this.#dropIndicator
  }

  #editorElement() {
    return this.#editor.getRootElement().closest("lexxy-editor")
  }

  #hideCaret() {
    if (this.#dropIndicator) this.#dropIndicator.style.display = "none";
  }

  #customAttachmentElementFrom(target) {
    return target?.closest?.("[data-lexxy-decorator][data-lexical-node-key]")
  }

  #cleanup() {
    if (this.#draggedNodeKey) {
      const rootElement = this.#editor.getRootElement();
      const attachment = rootElement?.querySelector(`[data-lexical-node-key="${this.#draggedNodeKey}"]`);
      attachment?.classList.remove("lexxy-dragging");
    }

    this.#hideCaret();
    this.#draggedNodeKey = null;

    if (this.#draggingRafId) {
      cancelAnimationFrame(this.#draggingRafId);
      this.#draggingRafId = null;
    }

    if (this.#dragOverRafId) {
      cancelAnimationFrame(this.#dragOverRafId);
      this.#dragOverRafId = null;
    }
  }
}

class CustomAttachmentDragAndDropExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/custom-attachment-drag-and-drop",
      register: (editor) => {
        const dragAndDrop = new CustomAttachmentDragAndDrop(editor);
        return () => dragAndDrop.destroy()
      }
    })
  }
}

const LINE_SEPARATORS = /\r\n|[\n\r\u2028\u2029]/;

// A literal line separator inside a text node renders as a break in the editor, or not at all,
// but never survives serialization to HTML. macOS text replacements deliver U+2028 LINE SEPARATOR,
// and other insertions can carry "\n", so however the text arrives, a transform converts whatever
// lands in a text node into line break nodes.
class LineSeparatorsExtension extends LexxyExtension {
  get lexicalExtension() {
    return this.defineExtension({
      name: "lexxy/line-separators",
      register(editor) {
        return editor.registerNodeTransform(TextNode, $replaceLineSeparatorWithLineBreak)
      }
    })
  }
}

// Replaces the first separator only: the split leaves dirty text nodes behind, so Lexical re-runs
// the transform until none remain.
function $replaceLineSeparatorWithLineBreak(textNode) {
  const match = textNode.getTextContent().match(LINE_SEPARATORS);

  if (match) {
    let separatorNode;
    if (match.index === 0) {
      [ separatorNode ] = textNode.splitText(match[0].length);
    } else {
      [ , separatorNode ] = textNode.splitText(match.index, match.index + match[0].length);
    }
    separatorNode.replace($createLineBreakNode());
  }
}

class LexicalEditorElement extends HTMLElement {
  static formAssociated = true
  static debug = false
  static commands = [ "bold", "italic", "strikethrough" ]

  static observedAttributes = [ "autocapitalize", "connected", "required" ]

  #initialValue = ""
  #previousInternalFormValue = null

  #initializeEventDispatched = false
  #editorInitializedDispatched = false
  #listeners = new ListenerBin()
  #disposables = []
  #historyState = { undo: false, redo: false }

  #validity = new Map()
  #validationTextArea = document.createElement("textarea")
  #uploadRequests

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "presentation";
  }

  get uploadRequests() {
    return this.#uploadRequests
  }

  connectedCallback() {
    this.id ||= generateDomId("lexxy-editor");
    this.config = new EditorConfiguration(this);
    this.extensions = new Extensions(this);
    this.#disposables.push(this.extensions);

    this.editor = this.#createEditor();
    this.#disposables.push(this.editor);
    this.#disposables.push(this.#listeners);

    this.contents = new Contents(this);
    this.#disposables.push(this.contents);

    this.selection = new Selection(this);
    this.#disposables.push(this.selection);

    this.clipboard = new Clipboard(this);
    this.#disposables.push(this.clipboard);

    this.adapter = new BrowserAdapter();
    this.#uploadRequests = new UploadRequests();

    const commandDispatcher = CommandDispatcher.configureFor(this);
    this.#disposables.push(commandDispatcher);

    this.#initialize();

    this.toggleAttribute("connected", true);

    requestAnimationFrame(() => {
      this.#mountRoot();
      this.#handleAutofocus();
      this.#dispatchInitialize();
    });
  }

  disconnectedCallback() {
    this.#initializeEventDispatched = false;
    this.#editorInitializedDispatched = false;

    this.#previousInternalFormValue = null;
    this.valueBeforeDisconnect = this.value;

    this.#clearCachedValues();
    this.#reset(); // Prevent hangs with Safari when morphing
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (typeof this[`${name}ChangedCallback`] === "function") {
      this[`${name}ChangedCallback`](oldValue, newValue);
    }
  }

  autocapitalizeChangedCallback() {
    if (this.editorContentElement) {
      this.#transferAttributeToContentEditable(this.editorContentElement, "autocapitalize");
    }
  }

  connectedChangedCallback(oldValue, newValue) {
    if (this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect());
    }
  }

  requiredChangedCallback() {
    if (this.isConnected) this.#requestValidityRefresh();
  }

  formResetCallback() {
    this.value = this.#initialValue;
    this.editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
  }

  toString() {
    return this.cachedStringValue ??= this.editor?.read(() => {
      return $getReadableTextContent($getRoot())
    })
  }

  get form() {
    return this.internals.form
  }

  get name() {
    return this.getAttribute("name")
  }

  get required() {
    return this.hasAttribute("required")
  }

  get validity() {
    return this.internals.validity
  }

  checkValidity() {
    return this.internals.checkValidity()
  }

  reportValidity() {
    return this.internals.reportValidity()
  }

  setElementValidity(key, flags, message) {
    this.#validity.set(key, { flags, message });
    this.#requestValidityRefresh();
  }

  get toolbarElement() {
    if (!this.#hasToolbar) return null

    this.toolbar ??= this.#findOrCreateDefaultToolbar();
    return this.toolbar
  }

  get baseExtensions() {
    return [
      ProvisionalParagraphExtension,
      CodeHighlightingExtension,
      HighlightExtension,
      TrixContentExtension,
      TablesExtension,
      RewritableHistoryExtension,
      AttachmentsExtension,
      FormatEscapeExtension,
      LinkOpenerExtension,
      PreventLexicalTripleClickExtension,
      CustomAttachmentDragAndDropExtension,
      LineSeparatorsExtension
    ]
  }

  get directUploadUrl() {
    return this.dataset.directUploadUrl
  }

  get blobUrlTemplate() {
    return this.dataset.blobUrlTemplate
  }

  get permittedAttachmentTypes() {
    const raw = this.config.get("permittedAttachmentTypes");
    if (raw == null) {
      return null
    } else {
      const tokens = Array.isArray(raw) ? raw : String(raw).split(/\s+/);
      return Object.freeze(tokens.filter(t => t && t !== "false"))
    }
  }

  permitsAttachmentContentType(contentType) {
    if (!this.supportsAttachments) {
      return false
    } else {
      const list = this.permittedAttachmentTypes;
      return list === null || list.includes(contentType)
    }
  }

  acceptsFile(file) {
    return dispatch(this, "lexxy:file-accept", { file }, true)
  }

  $generateNodesFromDOM(doc, { editor = this.editor } = {}) {
    let nodes = $generateNodesFromDOM(editor, doc);
    if ($hasUpdateTag(PASTE_TAG)) nodes = $convertInlineImageDataURIs(nodes, this);
    return filterDisallowedAttachmentNodes(nodes, this)
  }

  get isEmpty() {
    return [ "<p><br></p>", "<p></p>", "" ].includes(this.value.trim())
  }

  get isBlank() {
    return this.isEmpty || this.toString().match(/^\s*$/g) !== null
  }

  get hasOpenPrompt() {
    return this.querySelector(".lexxy-prompt-menu.lexxy-prompt-menu--visible") !== null
  }

  get preset() {
    return this.getAttribute("preset") || "default"
  }

  get supportsAttachments() {
    return this.config.get("attachments")
  }

  get supportsMarkdown() {
    return this.supportsRichText && this.config.get("markdown")
  }

  get supportsMultiLine() {
    return this.config.get("multiLine") && !this.isSingleLineMode
  }

  get supportsRichText() {
    return this.config.get("richText")
  }

  registerAdapter(adapter) {
    this.adapter = adapter;

    if (!this.editor) return

    this.#dispatchEditorInitialized();
    this.#dispatchAttributesChange();
  }

  freezeSelection() {
    this.adapter.freeze();
  }

  thawSelection() {
    this.adapter.thaw();
  }

  dispatchAttributesChange() {
    this.#dispatchAttributesChange();
  }

  dispatchEditorInitialized() {
    this.#dispatchEditorInitialized();
  }

  // TODO: Deprecate `single-line` attribute
  get isSingleLineMode() {
    return this.hasAttribute("single-line")
  }

  get contentTabIndex() {
    return parseInt(this.editorContentElement?.getAttribute("tabindex") ?? "0")
  }

  focus() {
    // `editor.focus()` commits a reconciler update to position the cursor.
    // Skip if the contenteditable already owns focus — the update would be a
    // no-op but still triggers a full style/layout pass on pages with large
    // DOMs.
    if (this.#isContentFocused) return

    this.editor.focus(() => this.#onFocus());
  }

  get #isContentFocused() {
    return !!this.editor && isEditorFocused(this.editor)
  }

  get value() {
    return this.cachedValue ??= this.#readSanitizedEditorValue()
  }

  set value(html) {
    const editorHasFocus = this.#isContentFocused;

    this.editor.update(() => {
      if (editorHasFocus) {
        // Address Safari inconsistently placing the cursor in the contenteditable by forcing focus back onto the editor
        // Use direct `editor.focus` to bypass the pre-existing focus optimization and skip the callback
        $onUpdate(() => this.editor.focus());
      } else {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
      }


      this.#setEditorHtml(html);
      this.#toggleEmptyStatus();
    }, { discrete: true });
  }

  get canUndo() {
    return this.#historyState.undo
  }

  get canRedo() {
    return this.#historyState.redo
  }

  #readSanitizedEditorValue() {
    return this.editor?.read(() => {
      return sanitize($generateHtmlFromNodes(this.editor, null), this.editor)
    }) ?? null
  }

  #parseHtmlIntoLexicalNodes(html, { editor = this.editor } = {}) {
    if (!html) html = "<p></p>";
    const nodes = this.$generateNodesFromDOM(parseHtml(`${html}`), { editor });

    return nodes
      .filter(this.#isNotWhitespaceOnlyNode)
      .map(this.#wrapTextNode)
  }

  // Whitespace-only text nodes (e.g. "\n" between block elements like <div>) and stray line break
  // nodes are formatting artifacts from the HTML source. They can't be appended to the root node
  // and have no semantic meaning, so we strip them during import.
  #isNotWhitespaceOnlyNode(node) {
    if ($isLineBreakNode(node)) return false
    if ($isTextNode(node) && node.getTextContent().trim() === "") return false
    return true
  }

  // Raw string values produce TextNodes which cannot be appended directly to the RootNode.
  // We wrap those in <p>
  #wrapTextNode(node) {
    if (!$isTextNode(node)) return node

    const paragraph = $createParagraphNode();
    paragraph.append(node);
    return paragraph
  }

  #initialize() {
    this.#registerComponents();
    this.#handleEnter();
    this.#registerFocusEvents();
    this.#registerHistoryEvents();
    this.#registerFileAcceptFilter();
    this.#attachDebugHooks();
    this.#attachToolbar();
    this.#resetBeforeTurboCaches();

    this.#setInternalFormValue(this.value, { suppressEvent: true });
    this.#synchronizeWithChanges();
  }

  #registerFileAcceptFilter() {
    this.#listeners.track(
      registerEventListener(this, "lexxy:file-accept", (event) => {
        if (!this.permitsAttachmentContentType(event.detail.file.type)) {
          event.preventDefault();
        }
      })
    );
  }

  #createEditor() {
    this.editorContentElement ||= this.#createEditorContentElement();
    this.appendChild(this.editorContentElement);

    const editor = buildEditorFromExtensions({
      name: "lexxy/core",
      namespace: "Lexxy",
      theme: theme,
      nodes: this.#lexicalNodes,
      html: {
        export: new Map([ [ TextNode, exportTextNodeDOM ], [ CodeHighlightNode, exportTextNodeDOM ] ])
      },
      $initialEditorState: (editor) => {
        this.#configureSanitizer(editor);
        this.#loadInitialValue(editor);
      },
    },
      ...this.extensions.lexicalExtensions
    );

    return editor
  }

  // Toggling editable around setRootElement skips Lexical's DOM-selection sync,
  // which would otherwise steal focus from elsewhere on the page.
  #mountRoot() {
    this.editor.setEditable(false);
    this.editor.setRootElement(this.editorContentElement);
    this.editor.setEditable(true);
  }

  get #lexicalNodes() {
    const nodes = [ CustomActionTextAttachmentNode ];

    if (this.supportsRichText) {
      nodes.push(
        QuoteNode,
        HeadingNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
        AutoLinkNode,
        HorizontalDividerNode
      );
    }

    return nodes
  }

  #createEditorContentElement() {
    const editorContentElement = createElement("div", {
      id: `${this.id}-content`,
      classList: "lexxy-editor__content",
      contenteditable: true,
      role: "textbox",
      "aria-multiline": true,
      "aria-label": this.#labelText,
      placeholder: this.getAttribute("placeholder")
    });

    this.#ariaAttributes.forEach(attribute => editorContentElement.setAttribute(attribute.name, attribute.value));

    this.#transferAttributeToContentEditable(editorContentElement, "autocapitalize");
    this.#transferAttributeToContentEditable(editorContentElement, "tabindex", { defaultValue: 0, removeSource: true });

    return editorContentElement
  }

  #transferAttributeToContentEditable(element, qualifiedName, { defaultValue = null, removeSource = false } = {}) {
    if (this.hasAttribute(qualifiedName)) {
      element.setAttribute(qualifiedName, this.getAttribute(qualifiedName));
    } else if (defaultValue !== null) {
      element.setAttribute(qualifiedName, defaultValue);
    } else {
      element.removeAttribute(qualifiedName);
    }

    if (removeSource) this.removeAttribute(qualifiedName);
  }

  get #labelText() {
    return Array.from(this.internals.labels).map(label => label.textContent).join(" ")
  }

  get #ariaAttributes() {
    return Array.from(this.attributes).filter(attribute => attribute.name.startsWith("aria-"))
  }

  #setInternalFormValue(html, { suppressEvent = false } = {}) {
    const changed = html !== this.#previousInternalFormValue;

    this.internals.setFormValue(html);
    this.#previousInternalFormValue = html;

    if (changed && !suppressEvent) {
      dispatch(this, "lexxy:change");
    }
  }

  #loadInitialValue(editor) {
    const initialHtml = this.valueBeforeDisconnect || this.getAttribute("value") || "<p><br></p>";

    this.#initialValue = initialHtml;
    this.#setEditorHtml(initialHtml, { editor });
  }

  #setEditorHtml(html, { editor = this.editor } = { }) {
    $getRoot()
      .clear()
      .selectEnd()
      .insertNodes(this.#parseHtmlIntoLexicalNodes(html, { editor }));
  }

  #resetBeforeTurboCaches() {
    this.#listeners.track(
      registerEventListener(document, "turbo:before-cache", this.#handleTurboBeforeCache)
    );
  }

  #handleTurboBeforeCache = (event) => {
    if (!this.closest("[data-turbo-permanent]")) {
      this.#reset();
    }
  }

  #synchronizeWithChanges() {
    this.#listeners.track(this.editor.registerUpdateListener(({ editorState }) => {
      this.#clearCachedValues();
      this.#setInternalFormValue(this.value);
      this.#toggleEmptyStatus();
      this.#requestValidityRefresh();
      this.#dispatchAttributesChange();
    }));
  }

  async #requestValidityRefresh() {
    await nextFrame();

    if (this.isConnected) this.#refreshValidity();
  }

  #refreshValidity() {
    this.#refreshInternalValidity();
    const { validity, message } = this.#calculateValidity();
    this.internals.setValidity(validity, message, this.editorContentElement);
  }

  #refreshInternalValidity() {
    this.#validationTextArea.required = this.required && this.isBlank;
    const flags = this.#validationTextArea.validity;
    const message = this.#validationTextArea.validationMessage;

    this.#validity.set(this, { flags, message });
  }

  #calculateValidity() {
    const validity = {};
    const messages = [];

    for (const { flags, message } of this.#validity.values()) {
      // internal TextArea's ValidityState can contain `valid: true`
      if (flags.valid === true) continue

      for (const flag in flags) {
        if (flags[flag]) {
          validity[flag] = true;
          messages.push(message);
        }
      }
    }

    return { validity, message: messages.join("\n") }
  }

  #clearCachedValues() {
    this.cachedValue = null;
    this.cachedStringValue = null;
  }

  #registerComponents() {
    const registered = [];

    if (this.supportsRichText) {
      registered.push(
        registerRichText(this.editor),
        registerList(this.editor)
      );
      this.#registerTableComponents();
      this.#registerCodeLanguagePicker();
      if (this.supportsMarkdown) {
        const transformers = [ ...TRANSFORMERS, HORIZONTAL_DIVIDER ];
        registered.push(
          registerMarkdownShortcuts(this.editor, transformers),
          registerMarkdownLeadingTagHandler(this.editor, transformers)
        );
      }
    } else {
      registered.push(registerPlainText(this.editor));
    }

    this.#listeners.track(...registered);
  }

  #registerTableComponents() {
    let tableTools = this.querySelector("lexxy-table-tools");
    tableTools ??= createElement("lexxy-table-tools");
    this.append(tableTools);
    this.#disposables.push(tableTools);
  }

  #registerCodeLanguagePicker() {
    let codeLanguagePicker = this.querySelector("lexxy-code-language-picker");
    codeLanguagePicker ??= createElement("lexxy-code-language-picker");
    this.append(codeLanguagePicker);
    this.#disposables.push(codeLanguagePicker);
  }

  #handleEnter() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.#listeners.track(this.editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Prevent CTRL+ENTER
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          return true
        }

        // In single line mode, prevent ENTER
        if (!this.supportsMultiLine) {
          event.preventDefault();
          return true
        }

        return false
      },
      COMMAND_PRIORITY_NORMAL
    ));
  }

  #registerFocusEvents() {
    this.#listeners.track(
      registerEventListener(this, "focusin", this.#handleFocusIn),
      registerEventListener(this, "focusout", this.#handleFocusOut)
    );
  }

  #handleFocusIn(event) {
    if (this.#elementInEditorOrToolbar(event.target) && !this.currentlyFocused) {
      this.#dispatchAttributesChange();
      dispatch(this, "lexxy:focus");
      this.currentlyFocused = true;
    }
  }

  #handleFocusOut(event) {
    if (!this.#elementInEditorOrToolbar(event.relatedTarget)) {
      dispatch(this, "lexxy:blur");
      this.currentlyFocused = false;
    }
  }

  #elementInEditorOrToolbar(element) {
    return this.contains(element) || this.toolbarElement?.contains(element)
  }

  #onFocus() {
    if (this.isEmpty) {
      this.selection.placeCursorAtTheEnd();
    }
  }

  #handleAutofocus() {
    if (!document.querySelector(":focus")) {
      if (this.hasAttribute("autofocus") && document.querySelector("[autofocus]") === this) {
        this.focus();
      }
    }
  }

  #registerHistoryEvents() {
    this.#listeners.track(
      this.editor.registerCommand(CAN_UNDO_COMMAND, (enabled) => { this.#historyState.undo = enabled; }, COMMAND_PRIORITY_NORMAL),
      this.editor.registerCommand(CAN_REDO_COMMAND, (enabled) => { this.#historyState.redo = enabled; }, COMMAND_PRIORITY_NORMAL)
    );
  }

  #attachDebugHooks() {
    return
  }

  #attachToolbar() {
    if (this.#hasToolbar) {
      this.toolbarElement.setEditor(this);
      if (typeof this.toolbarElement.dispose === "function") {
        this.#disposables.push(this.toolbarElement);
      }

      this.extensions.initializeToolbars();
    }
  }

  #findOrCreateDefaultToolbar() {
    const toolbarConfig = this.config.get("toolbar");
    if (typeof toolbarConfig === "string") {
      return document.getElementById(toolbarConfig)
    } else {
      return this.querySelector("lexxy-toolbar") ?? this.#createDefaultToolbar()
    }
  }

  get #hasToolbar() {
    return this.supportsRichText && !!this.config.get("toolbar")
  }

  #createDefaultToolbar() {
    const toolbar = createElement("lexxy-toolbar");
    toolbar.innerHTML = LexicalToolbarElement.defaultTemplate;
    toolbar.setAttribute("data-attachments", this.supportsAttachments); // Drives toolbar CSS styles
    toolbar.configure(this.config.get("toolbar"));
    this.prepend(toolbar);
    return toolbar
  }

  #toggleEmptyStatus() {
    this.classList.toggle("lexxy-editor--empty", this.isEmpty);
  }

  #configureSanitizer(editor) {
    setSanitizerConfig(editor, this.#getAllowedElements(editor));
  }

  #getAllowedElements(editor) {
    return this.#getImportableTags(editor).concat(this.extensions.allowedElements)
  }

  #getImportableTags(editor) {
    const tags = Array.from(editor._htmlConversions.keys());
    return tags.filter(tag => !tag.startsWith("#"))
  }

  #dispatchAttributesChange() {
    let attributes = null;
    let linkHref = null;
    let highlight = null;
    let headingTag = null;

    this.editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return

      const format = this.selection.getFormat();
      if (Object.keys(format).length === 0) return

      const anchorNode = selection.anchor.getNode();
      const linkNode = $getNearestNodeOfType(anchorNode, LinkNode);

      attributes = {
        bold: { active: format.isBold, enabled: true },
        italic: { active: format.isItalic, enabled: true },
        strikethrough: { active: format.isStrikethrough, enabled: true },
        code: { active: format.isInCode, enabled: true },
        highlight: { active: format.isHighlight, enabled: true },
        link: { active: format.isInLink, enabled: true },
        quote: { active: format.isInQuote, enabled: true },
        heading: { active: format.isInHeading, enabled: true },
        "unordered-list": { active: format.isInList && format.listType === "bullet", enabled: true },
        "ordered-list": { active: format.isInList && format.listType === "number", enabled: true },
        undo: { active: false, enabled: this.canUndo },
        redo: { active: false, enabled: this.canRedo }
      };

      linkHref = linkNode ? linkNode.getURL() : null;
      highlight = format.isHighlight ? getHighlightStyles(selection) : null;
      headingTag = format.headingTag ?? null;
    });

    if (attributes) {
      this.adapter.dispatchAttributesChange(attributes, linkHref, highlight, headingTag);
    }
  }

  #dispatchEditorInitialized() {
    if (!this.adapter) return

    this.#editorInitializedDispatched = true;

    this.adapter.dispatchEditorInitialized({
      highlightColors: this.#resolvedHighlightColors,
      headingFormats: this.#supportedHeadingFormats
    });
  }

  #dispatchInitialize() {
    if (this.isConnected && this.adapter) {
      if (!this.#initializeEventDispatched) {
        this.#initializeEventDispatched = true;
        dispatch(this, "lexxy:initialize");
      }

      if (!this.#editorInitializedDispatched) {
        this.#dispatchEditorInitialized();
      }
    }
  }

  get #resolvedHighlightColors() {
    const buttons = this.config.get("highlight.buttons");
    if (!buttons) return null

    const colors = this.#resolveColors("color", buttons.color || []);
    const backgroundColors = this.#resolveColors("background-color", buttons["background-color"] || []);
    return { colors, backgroundColors }
  }

  get #supportedHeadingFormats() {
    if (!this.supportsRichText) return []

    const headings = this.config.get("headings");
    return [
      { label: "Normal", command: "setFormatParagraph", tag: null },
      ...headings.map((tag, index) => ({
        label: HeadingDropdown.labelFor(tag, index),
        command: HeadingDropdown.commandFor(index),
        tag
      }))
    ]
  }

  // Builds one resolver element per CSS value inside a hidden container, attaches
  // the container in a single DOM write, then reads all computed values in one pass
  // — triggering at most one forced reflow. The previous implementation interleaved
  // setProperty/getComputedStyle/removeProperty on the same element, forcing a style
  // recalc on every iteration during editor initialization.
  #resolveColors(property, cssValues) {
    const container = document.createElement("span");
    container.style.display = "none";

    const resolvers = cssValues.map(cssValue => {
      const element = document.createElement("span");
      element.style.setProperty(property, cssValue);
      container.appendChild(element);
      return { element, name: cssValue }
    });

    styleResolverRoot().appendChild(container);

    const resolved = resolvers.map(({ element, name }) => ({
      name,
      value: window.getComputedStyle(element).getPropertyValue(property)
    }));

    container.remove();
    return resolved
  }

  #reset() {
    this.#dispose();
    this.#resetValidity();
    this.#uploadRequests?.clear();
    this.editorContentElement?.remove();
    this.editorContentElement = null;

    // Prevents issues with turbo morphing receiving an empty <lexxy-editor> which wipes
    // out the DOM for the tools, and the old toolbar reference will cause issues
    this.toolbar = null;
  }

  #dispose() {
    while (this.#disposables.length) {
      this.#disposables.pop().dispose();
    }
  }

  #reconnect() {
    this.disconnectedCallback();
    this.valueBeforeDisconnect = null;
    this.connectedCallback();
  }

  #resetValidity() {
    this.#validity = new Map();
  }
}

// Like $getRoot().getTextContent() but uses readable text for custom attachment nodes
// (e.g., mentions) instead of their single-character cursor placeholder.
function $getReadableTextContent(node) {
  if (node instanceof CustomActionTextAttachmentNode) {
    return node.getReadableTextContent()
  }

  if ($isElementNode(node)) {
    let text = "";
    const children = node.getChildren();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const previousChild = children[i - 1];

      if (isAttachmentSpacerTextNode(child, previousChild, i, children.length)) continue

      text += $getReadableTextContent(child);
      if ($isElementNode(child) && i !== children.length - 1 && !child.isInline()) {
        text += "\n\n";
      }
    }
    return text
  }

  return node.getTextContent()
}

class BaseSource {
  // Template method to override
  async buildListItems(filter = "") {
    return Promise.resolve([])
  }

  // Template method to override
  promptItemFor(listItem) {
    return null
  }

  // Protected

  buildListItemElementFor(promptItemElement) {
    const template = promptItemElement.querySelector("template[type='menu']");
    const fragment = template.content.cloneNode(true);
    const listItemElement = createElement("li", { role: "option", id: generateDomId("prompt-item"), tabindex: "0" });
    listItemElement.classList.add("lexxy-prompt-menu__item");
    listItemElement.appendChild(fragment);
    return listItemElement
  }

  async loadPromptItemsFromUrl(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const promptItems = parseHtml(html).querySelectorAll("lexxy-prompt-item");
      return Promise.resolve(Array.from(promptItems))
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

const MAX_RENDERED_SUGGESTIONS$1 = 100;

class LocalFilterSource extends BaseSource {
  async buildListItems(filter = "") {
    const promptItems = await this.fetchPromptItems();
    return this.#buildListItemsFromPromptItems(promptItems, filter)
  }

  // Template method to override
  async fetchPromptItems(filter) {
    return Promise.resolve([])
  }

  promptItemFor(listItem) {
    return this.promptItemByListItem.get(listItem)
  }

  #buildListItemsFromPromptItems(promptItems, filter) {
    this.promptItemByListItem = new WeakMap();

    if (!filter) {
      return this.#buildAllListItems(promptItems)
    }

    const matches = [];
    for (const promptItem of promptItems) {
      const searchableText = promptItem.getAttribute("search");
      const position = filterMatchPosition(searchableText, filter);
      if (position >= 0) {
        matches.push({ promptItem, position });
      }
    }

    matches.sort((a, b) => a.position - b.position);

    const listItems = [];
    for (const { promptItem } of matches) {
      if (listItems.length >= MAX_RENDERED_SUGGESTIONS$1) break
      const listItem = this.buildListItemElementFor(promptItem);
      this.promptItemByListItem.set(listItem, promptItem);
      listItems.push(listItem);
    }
    return listItems
  }

  #buildAllListItems(promptItems) {
    const listItems = [];
    for (const promptItem of promptItems) {
      if (listItems.length >= MAX_RENDERED_SUGGESTIONS$1) break
      const listItem = this.buildListItemElementFor(promptItem);
      this.promptItemByListItem.set(listItem, promptItem);
      listItems.push(listItem);
    }
    return listItems
  }
}

class InlinePromptSource extends LocalFilterSource {
  constructor(inlinePromptItems) {
    super();
    this.inlinePromptItemElements = Array.from(inlinePromptItems);
  }

  async fetchPromptItems() {
    return Promise.resolve(this.inlinePromptItemElements)
  }
}

class DeferredPromptSource extends LocalFilterSource {
  constructor(url) {
    super();
    this.url = url;

    this.fetchPromptItems();
  }

  async fetchPromptItems() {
    this.promptItems ??= await this.loadPromptItemsFromUrl(this.url);

    return Promise.resolve(this.promptItems)
  }
}

const DEBOUNCE_INTERVAL = 200;
const MAX_RENDERED_SUGGESTIONS = 100;

class RemoteFilterSource extends BaseSource {
  constructor(url) {
    super();

    this.baseURL = url;
    this.loadAndFilterListItems = debounceAsync(this.fetchFilteredListItems.bind(this), DEBOUNCE_INTERVAL);
  }

  async buildListItems(filter = "") {
    return await this.loadAndFilterListItems(filter)
  }

  promptItemFor(listItem) {
    return this.promptItemByListItem.get(listItem)
  }

  async fetchFilteredListItems(filter) {
    const promptItems = await this.loadPromptItemsFromUrl(this.#urlFor(filter));
    return this.#buildListItemsFromPromptItems(promptItems)
  }

  #urlFor(filter) {
    const url = new URL(this.baseURL, window.location.origin);
    url.searchParams.append("filter", filter);
    return url.toString()
  }

  #buildListItemsFromPromptItems(promptItems) {
    const listItems = [];
    this.promptItemByListItem = new WeakMap();

    for (const promptItem of promptItems) {
      if (listItems.length >= MAX_RENDERED_SUGGESTIONS) break

      const listItem = this.buildListItemElementFor(promptItem);
      this.promptItemByListItem.set(listItem, promptItem);
      listItems.push(listItem);
    }

    return listItems
  }
}

const NOTHING_FOUND_DEFAULT_MESSAGE = "Nothing found";
const FILTER_DEBOUNCE_INTERVAL = 50;

// Start of line, or after a space or newline.
const DEFAULT_ONLY_AT_PATTERN = "^|[ \\n]";

class LexicalPromptElement extends HTMLElement {
  #globalListeners = new ListenerBin()
  #popoverListeners = new ListenerBin()
  #debouncedFilterOptions = debounce(() => this.#filterOptions(), FILTER_DEBOUNCE_INTERVAL)

  constructor() {
    super();
    this.showPopoverId = 0;
  }

  static observedAttributes = [ "connected" ]

  connectedCallback() {
    this.source = this.#createSource();

    this.#addTriggerListener();
    this.#removePopoverBeforeTurboCaches();
    this.toggleAttribute("connected", true);
  }

  disconnectedCallback() {
    this.#popoverListeners.dispose();
    this.#globalListeners.dispose();
    this.source = null;
    this.#removePopover();
  }


  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect());
    }
  }

  get name() {
    return this.getAttribute("name")
  }

  get trigger() {
    return this.getAttribute("trigger")
  }

  get supportsSpaceInSearches() {
    return this.hasAttribute("supports-space-in-searches")
  }

  get onlyAt() {
    return this.getAttribute("only-at")
  }

  get verticalDirection() {
    return this.getAttribute("vertical-direction")
  }

  get open() {
    return this.popoverElement?.classList?.contains("lexxy-prompt-menu--visible")
  }

  get closed() {
    return !this.open
  }

  get #doesSpaceSelect() {
    return !this.supportsSpaceInSearches
  }

  #createSource() {
    const src = this.getAttribute("src");
    if (src) {
      if (this.hasAttribute("remote-filtering")) {
        return new RemoteFilterSource(src)
      } else {
        return new DeferredPromptSource(src)
      }
    } else {
      return new InlinePromptSource(this.querySelectorAll("lexxy-prompt-item"))
    }
  }

  #addTriggerListener() {
    if (!this.#promptContentTypePermitted) return

    this.#popoverListeners.track(this.#editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (this.#selection.isInsideCodeBlock) return

        const { node, offset } = this.#selection.selectedNodeWithOffset();
        if (!node) return

        if ($isTextNode(node)) {
          const fullText = node.getTextContent();
          const triggerLength = this.trigger.length;

          // Check if we have enough characters for the trigger
          if (offset >= triggerLength) {
            const textBeforeCursor = fullText.slice(offset - triggerLength, offset);

            if (textBeforeCursor === this.trigger) {
              const textBeforeTrigger = $textBeforeOffset(node, offset - triggerLength);

              if (this.#onlyAtRegExp.test(textBeforeTrigger)) {
                this.#popoverListeners.dispose();
                this.#showPopover();
              }
            }
          }
        }
      });
    }));
  }

  get #onlyAtRegExp() {
    return new RegExp(`(?:${this.onlyAt ?? DEFAULT_ONLY_AT_PATTERN})$`)
  }

  get #promptContentTypePermitted() {
    // `insert-editable-text` prompts never create attachments, so the
    // editor's attachment support and content-type allowlist don't apply.
    if (this.hasAttribute("insert-editable-text")) return true

    const el = this.#editorElement;
    if (!el.supportsAttachments) {
      return false
    } else {
      const templates = Array.from(this.querySelectorAll("template[type='editor']"));
      const types = templates.length
        ? templates.map(t => t.getAttribute("content-type") || this.#defaultPromptContentType)
        : [ this.#defaultPromptContentType ];
      return types.some(t => el.permitsAttachmentContentType(t))
    }
  }

  #addCursorPositionListener() {
    this.#popoverListeners.track(this.#editor.registerUpdateListener(({ editorState }) => {
      if (this.closed) return

      editorState.read(() => {
        if (this.#selection.isInsideCodeBlock) {
          this.#hidePopover();
          return
        }

        const { node, offset } = this.#selection.selectedNodeWithOffset();
        if (!node) return

        if (this.#cursorIsTypingSearchTerm(node, offset)) {
          if (!this.popoverElement.hasAttribute("data-anchored")) {
            this.#positionPopover();
          }
        } else {
          this.#hidePopover();
        }
      });
    }));
  }

  // The popover should stay open only while the cursor sits at the end of the
  // trigger and its search term. When the cursor moves away — before the
  // trigger, or past the token into later text — the text between the trigger
  // and the cursor breaks that run and we dismiss. A newline always breaks the
  // run; a space breaks it only for triggers that don't support spaces in
  // searches, since those that do (e.g. `person:`) expect multi-word terms.
  #cursorIsTypingSearchTerm(node, offset) {
    if (!$isTextNode(node) || offset === 0) return false

    const textBeforeCursor = node.getTextContent().slice(0, offset);
    const lastTriggerIndex = textBeforeCursor.lastIndexOf(this.trigger);
    if (lastTriggerIndex === -1) return false

    const searchTerm = textBeforeCursor.slice(lastTriggerIndex + this.trigger.length);
    const breakPattern = this.supportsSpaceInSearches ? /\n/ : /[ \n]/;
    return !breakPattern.test(searchTerm)
  }

  get #editor() {
    return this.#editorElement.editor
  }

  get #editorElement() {
    return this.closest("lexxy-editor")
  }

  get #selection() {
    return this.#editorElement.selection
  }

  async #showPopover() {
    const showId = ++this.showPopoverId;
    this.popoverElement ??= await this.#buildPopover();
    if (this.showPopoverId !== showId) return

    this.#resetPopoverPosition();
    await this.#filterOptions();
    if (this.showPopoverId !== showId) return

    this.popoverElement.classList.toggle("lexxy-prompt-menu--visible", true);
    this.#selectFirstOption();

    this.#popoverListeners.track(
      registerEventListener(this.#editorElement, "keydown", this.#handleKeydownOnPopover),
      registerEventListener(this.#editorElement, "lexxy:change", this.#debouncedFilterOptions)
    );

    this.#registerKeyListeners();
    this.#addCursorPositionListener();
  }

  #registerKeyListeners() {
    // We can't use a regular keydown for Enter as Lexical handles it first
    this.#popoverListeners.track(
      this.#editor.registerCommand(KEY_ENTER_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL),
      this.#editor.registerCommand(KEY_TAB_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL)
    );

    if (this.#doesSpaceSelect) {
      this.#popoverListeners.track(this.#editor.registerCommand(KEY_SPACE_COMMAND, this.#handleSelectedOption.bind(this), COMMAND_PRIORITY_CRITICAL));
      this.#popoverListeners.track(this.#editor.registerCommand(INPUT_COMMAND, this.#handleInputCommand.bind(this), COMMAND_PRIORITY_CRITICAL));
    }

    // Register arrow keys with CRITICAL priority to prevent Lexical's selection handlers from running
    this.#popoverListeners.track(
      this.#editor.registerCommand(KEY_ARROW_UP_COMMAND, this.#handleArrowUp.bind(this), COMMAND_PRIORITY_CRITICAL),
      this.#editor.registerCommand(KEY_ARROW_DOWN_COMMAND, this.#handleArrowDown.bind(this), COMMAND_PRIORITY_CRITICAL)
    );
  }

  #handleArrowUp(event) {
    this.#moveSelectionUp();
    event.preventDefault();
    return true
  }

  #handleArrowDown(event) {
    this.#moveSelectionDown();
    event.preventDefault();
    return true
  }

  #selectFirstOption() {
    const firstOption = this.#listItemElements[0];

    if (firstOption) {
      this.#selectOption(firstOption);
    }
  }

  get #listItemElements() {
    return Array.from(this.popoverElement.querySelectorAll(".lexxy-prompt-menu__item"))
  }

  #selectOption(listItem, { scrollIntoView = false } = {}) {
    this.#clearListItemSelection();
    listItem.toggleAttribute("aria-selected", true);
    if (scrollIntoView) {
      listItem.scrollIntoView({ block: "nearest", container: "nearest", behavior: "smooth" });
    }

    this.#setEditorAssociationAttribute("aria-controls", this.popoverElement.id);
    this.#setEditorAssociationAttribute("aria-activedescendant", listItem.id);
    this.#setEditorAssociationAttribute("aria-haspopup", "listbox");
  }

  #clearListItemSelection() {
    this.#listItemElements.forEach((item) => { item.toggleAttribute("aria-selected", false); });
  }

  #clearSelection() {
    this.#clearListItemSelection();
    this.#editorContentElement.removeAttribute("aria-controls");
    this.#editorContentElement.removeAttribute("aria-activedescendant");
    this.#editorContentElement.removeAttribute("aria-haspopup");
  }

  #setEditorAssociationAttribute(name, value) {
    if (this.#editorContentElement.getAttribute(name) !== value) {
      this.#editorContentElement.setAttribute(name, value);
    }
  }

  // Right after a Turbo history restore the editor reconnects before the DOM selection
  // is re-established, so the cursor geometry is momentarily unavailable. Anchoring then
  // would pin the menu to the editor's left edge for the rest of the open cycle, so we
  // skip it and let a later reposition anchor it once the selection is ready. The menu
  // stays hidden until anchored (see the `[data-anchored]` rule in the stylesheet).
  #positionPopover() {
    const cursorPosition = this.#selection.cursorPosition;
    if (!cursorPosition) return

    const { x, y, fontSize } = cursorPosition;
    const editorRect = this.#editorElement.getBoundingClientRect();
    const contentRect = this.#editorContentElement.getBoundingClientRect();
    const verticalOffset = contentRect.top - editorRect.top;

    if (!this.popoverElement.hasAttribute("data-anchored")) {
      this.#setPopoverOffsetX(x);
      this.#setPopoverOffsetY(y + verticalOffset);
      this.popoverElement.toggleAttribute("data-anchored", true);
    }

    const popoverRect = this.popoverElement.getBoundingClientRect();

    if (popoverRect.right > editorRect.right) {
      this.popoverElement.toggleAttribute("data-clipped-at-right", true);
    }

    const forceTop = this.verticalDirection === "top";
    const forceBottom = this.verticalDirection === "bottom";
    const overflowsWindow = popoverRect.bottom > window.innerHeight;

    if (!forceBottom && (forceTop || overflowsWindow)) {
      this.#setPopoverOffsetY(contentRect.height - y + fontSize);
      this.popoverElement.toggleAttribute("data-clipped-at-bottom", true);
    }
  }

  #setPopoverOffsetX(value) {
    this.popoverElement.style.setProperty("--lexxy-prompt-offset-x", `${value}px`);
  }

  #setPopoverOffsetY(value) {
    this.popoverElement.style.setProperty("--lexxy-prompt-offset-y", `${value}px`);
  }

  #resetPopoverPosition() {
    this.popoverElement.removeAttribute("data-clipped-at-bottom");
    this.popoverElement.removeAttribute("data-clipped-at-right");
    this.popoverElement.removeAttribute("data-anchored");
  }

  async #hidePopover() {
    this.showPopoverId++;
    this.#clearSelection();
    this.popoverElement.classList.toggle("lexxy-prompt-menu--visible", false);
    this.#popoverListeners.dispose();

    await nextFrame();
    this.#addTriggerListener();
  }

  // The popover is appended to the <lexxy-editor> subtree, so Turbo serializes it
  // into the page cache. Removing it before caching prevents an orphaned, unmanaged
  // popover from being restored on history back/forward.
  #removePopoverBeforeTurboCaches() {
    this.#globalListeners.track(
      registerEventListener(document, "turbo:before-cache", () => this.#removePopover())
    );
  }

  #removePopover() {
    this.#popoverListeners.dispose();
    this.popoverElement?.remove();
    this.popoverElement = null;
  }

  #filterOptions = async () => {
    if (this.initialPrompt) {
      this.initialPrompt = false;
      return
    }

    if (this.#editorContents.containsTextBackUntil(this.trigger)) {
      await this.#showFilteredOptions();

      // Re-check after async operation — the trigger may have been consumed
      // (e.g. markdown heading shortcut converted "# " to h1 during the fetch)
      if (!this.#editorContents.containsTextBackUntil(this.trigger)) {
        this.#hidePopover();
        return
      }

      await nextFrame();
      this.#positionPopover();
    } else {
      this.#hidePopover();
    }
  }

  async #showFilteredOptions() {
    const showId = this.showPopoverId;
    const filter = this.#editorContents.textBackUntil(this.trigger);
    const filteredListItems = await this.source.buildListItems(filter);
    if (this.showPopoverId !== showId) return
    if (!this.#editorContents.containsTextBackUntil(this.trigger)) return

    this.popoverElement.innerHTML = "";

    if (filteredListItems.length > 0) {
      this.#showResults(filteredListItems);
    } else {
      this.#showEmptyResults();
    }
    this.#selectFirstOption();
  }

  #showResults(filteredListItems) {
    this.popoverElement.classList.remove("lexxy-prompt-menu--empty");
    this.popoverElement.append(...filteredListItems);
  }

  #showEmptyResults() {
    this.popoverElement.classList.add("lexxy-prompt-menu--empty");
    const el = createElement("li", { textContent: this.#emptyResultsMessage });
    el.classList.add("lexxy-prompt-menu__item--empty");
    this.popoverElement.append(el);
  }

  get #emptyResultsMessage() {
    return this.getAttribute("empty-results") || NOTHING_FOUND_DEFAULT_MESSAGE
  }

  #handleKeydownOnPopover = (event) => {
    if (event.key === "Escape") {
      this.#hidePopover();
      this.#editorElement.focus();
      event.stopPropagation();
    } else if (event.key === ",") {
      event.preventDefault();
      event.stopPropagation();
      this.#optionWasSelected();
      this.#editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(",");
        }
      });
    }
    // Arrow keys are handled via Lexical commands
  }

  // Android Mobile keyboard doesn't trigger KEY_SPACE_COMMAND
  #handleInputCommand(event) {
    if (event.inputType === "insertText" && event.data === " ") return this.#handleSelectedOption(event)
  }

  #moveSelectionDown() {
    const nextIndex = this.#selectedIndex + 1;
    if (nextIndex < this.#listItemElements.length) this.#selectOption(this.#listItemElements[nextIndex], { scrollIntoView: true });
  }

  #moveSelectionUp() {
    const previousIndex = this.#selectedIndex - 1;
    if (previousIndex >= 0) this.#selectOption(this.#listItemElements[previousIndex], { scrollIntoView: true });
  }

  get #selectedIndex() {
    return this.#listItemElements.findIndex((item) => item.hasAttribute("aria-selected"))
  }

  get #selectedListItem() {
    return this.#listItemElements[this.#selectedIndex]
  }

  #handleSelectedOption(event) {
    event.preventDefault();
    event.stopPropagation();
    this.#optionWasSelected();
    return true
  }

  #optionWasSelected() {
    this.#replaceTriggerWithSelectedItem();
    this.#hidePopover();
    this.#editorElement.focus();
  }

  #replaceTriggerWithSelectedItem() {
    const promptItem = this.source.promptItemFor(this.#selectedListItem);

    if (!promptItem) { return }

    const templates = Array.from(promptItem.querySelectorAll("template[type='editor']"));
    const stringToReplace = `${this.trigger}${this.#editorContents.textBackUntil(this.trigger)}`;

    if (this.hasAttribute("insert-editable-text")) {
      this.#insertTemplatesAsEditableText(templates, stringToReplace);
    } else {
      this.#insertTemplatesAsAttachments(templates, stringToReplace, promptItem.getAttribute("sgid"));
    }
  }

  #insertTemplatesAsEditableText(templates, stringToReplace) {
    this.#editor.update(() => {
      const nodes = templates.flatMap(template => this.#buildEditableTextNodes(template));
      this.#editorContents.replaceTextBackUntil(stringToReplace, nodes);
    });
  }

  #buildEditableTextNodes(template) {
    return this.#editorElement.$generateNodesFromDOM(parseHtml(`${template.innerHTML}`))
  }

  #insertTemplatesAsAttachments(templates, stringToReplace, fallbackSgid = null) {
    this.#editor.update(() => {
      const attachmentNodes = this.#buildAttachmentNodes(templates, fallbackSgid);
      const spacedAttachmentNodes = attachmentNodes.flatMap(node => [ node, this.#getSpacerTextNode() ]).slice(0, -1);
      this.#editorContents.replaceTextBackUntil(stringToReplace, spacedAttachmentNodes);
    });
  }

  #buildAttachmentNodes(templates, fallbackSgid = null) {
    return templates
      .filter(template => this.#editorElement.permitsAttachmentContentType(
        template.getAttribute("content-type") || this.#defaultPromptContentType))
      .map(template => this.#buildAttachmentNode(
        template.innerHTML,
        template.getAttribute("content-type") || this.#defaultPromptContentType,
        template.getAttribute("sgid") || fallbackSgid
      ))
  }

  #getSpacerTextNode() {
    return $createTextNode(" ")
  }

  get #defaultPromptContentType() {
    const attachmentContentTypeNamespace = Lexxy.global.get("attachmentContentTypeNamespace");
    return `application/vnd.${attachmentContentTypeNamespace}.${this.name}`
  }

  #buildAttachmentNode(innerHtml, contentType, sgid) {
    return new CustomActionTextAttachmentNode({ sgid, contentType, innerHtml })
  }

  get #editorContents() {
    return this.#editorElement.contents
  }

  get #editorContentElement() {
    return this.#editorElement.editorContentElement
  }

  async #buildPopover() {
    const popoverContainer = createElement("ul", { role: "listbox", id: generateDomId("prompt-popover") }); // Avoiding [popover] due to not being able to position at an arbitrary X, Y position.
    popoverContainer.classList.add("lexxy-prompt-menu");
    popoverContainer.style.position = "absolute";
    popoverContainer.setAttribute("nonce", getNonce());
    popoverContainer.append(...await this.source.buildListItems());
    this.#globalListeners.track(registerEventListener(popoverContainer, "click", this.#handlePopoverClick));
    this.#editorElement.appendChild(popoverContainer);
    return popoverContainer
  }

  #handlePopoverClick = (event) => {
    const listItem = event.target.closest(".lexxy-prompt-menu__item");
    if (listItem) {
      this.#selectOption(listItem);
      this.#optionWasSelected();
    }
  }

  #reconnect() {
    this.disconnectedCallback();
    this.connectedCallback();
  }
}

class CodeLanguagePicker extends HTMLElement {
  #abortController = null
  #listeners = new ListenerBin()

  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor");
    this.editor = this.editorElement.editor;
    this.classList.add("lexxy-floating-controls");
    this.#abortController = new AbortController();
    this.#listeners.track(() => this.#abortController?.abort());

    this.#attachLanguagePicker();
    this.#hide();
    this.#monitorForCodeBlockSelection();
  }

  disconnectedCallback() {
    this.dispose();
  }

  dispose() {
    this.#listeners.dispose();
  }

  #attachLanguagePicker() {
    this.languagePickerElement = this.#findLanguagePicker() ?? this.#createLanguagePicker();

    const signal = this.#abortController.signal;

    this.#listeners.track(registerEventListener(this.languagePickerElement, "change", () => {
      this.#updateCodeBlockLanguage(this.languagePickerElement.value);
    }, { signal }));

    this.#listeners.track(registerEventListener(this.languagePickerElement, "mousedown", (event) => {
      this.#dispatchOpenEvent(event);
    }, { signal }));

    this.languagePickerElement.setAttribute("nonce", getNonce());
    this.appendChild(this.languagePickerElement);
  }

  #findLanguagePicker() {
    return this.querySelector("select")
  }

  #createLanguagePicker() {
    const selectElement = createElement("select", { className: "lexxy-code-language-picker", "aria-label": "Pick a language…", name: "lexxy-code-language" });

    for (const [ value, label ] of Object.entries(this.#languages)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      selectElement.appendChild(option);
    }

    return selectElement
  }

  get #languages() {
    const languages = { ...CODE_LANGUAGE_FRIENDLY_NAME_MAP };

    languages.ruby ||= "Ruby";
    languages.php ||= "PHP";
    languages.go ||= "Go";
    languages.bash ||= "Bash";
    languages.json ||= "JSON";
    languages.diff ||= "Diff";
    languages.kotlin ||= "Kotlin";


    // Place the "plain" entry first, then the rest of language sorted alphabetically
    delete languages.plain;
    const sortedEntries = Object.entries(languages)
      .sort((a, b) => a[1].localeCompare(b[1]));
    return { plain: "Plain text", ...Object.fromEntries(sortedEntries) }
  }

  #dispatchOpenEvent(event) {
    const handled = !dispatch(this.editorElement, "lexxy:code-language-picker-open", {
      languages: this.#bridgeLanguages,
      currentLanguage: this.languagePickerElement.value
    }, true);

    if (handled) {
      event.preventDefault();
    }
  }

  get #bridgeLanguages() {
    return Object.entries(this.#languages).map(([ key, name ]) => ({ key, name }))
  }

  #updateCodeBlockLanguage(language) {
    this.editor.update(() => {
      const codeNode = this.#getCurrentCodeNode();

      if (codeNode) {
        codeNode.setLanguage(language);
      }
    });
  }

  #monitorForCodeBlockSelection() {
    this.#listeners.track(this.editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const codeNode = this.#getCurrentCodeNode();

        if (codeNode) {
          this.#codeNodeWasSelected(codeNode);
        } else {
          this.#hide();
        }
      });
    }));
  }

  #getCurrentCodeNode() {
    return this.editorElement.selection.nearestNodeOfType(CodeNode)
  }

  #codeNodeWasSelected(codeNode) {
    const language = codeNode.getLanguage();

    this.#updateLanguagePickerWith(language);
    this.#show();
    this.#positionLanguagePicker(codeNode);
  }

  #updateLanguagePickerWith(language) {
    if (this.languagePickerElement && language) {
      const normalizedLanguage = normalizeCodeLang(language);
      this.languagePickerElement.value = normalizedLanguage;
    }
  }

  #positionLanguagePicker(codeNode) {
    const codeElement = this.editor.getElementByKey(codeNode.getKey());
    if (!codeElement) return

    const codeRect = codeElement.getBoundingClientRect();
    const editorRect = this.editorElement.getBoundingClientRect();
    const relativeTop = codeRect.top - editorRect.top;
    const relativeRight = editorRect.right - codeRect.right;

    this.style.top = `${relativeTop}px`;
    this.style.right = `${relativeRight}px`;
  }

  #show() {
    this.hidden = false;
  }

  #hide() {
    this.hidden = true;
  }
}

const DELETE_ICON = `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
  <path d="M11.2041 1.01074C12.2128 1.113 13 1.96435 13 3V4H15L15.1025 4.00488C15.6067 4.05621 16 4.48232 16 5C16 5.55228 15.5523 6 15 6H14.8457L14.1416 15.1533C14.0614 16.1953 13.1925 17 12.1475 17H5.85254L5.6582 16.9902C4.76514 16.9041 4.03607 16.2296 3.88184 15.3457L3.8584 15.1533L3.1543 6H3C2.44772 6 2 5.55228 2 5C2 4.44772 2.44772 4 3 4H5V3C5 1.89543 5.89543 1 7 1H11L11.2041 1.01074ZM5.85254 15H12.1475L12.8398 6H5.16016L5.85254 15ZM7 4H11V3H7V4Z"/>
</svg>`;

class NodeDeleteButton extends HTMLElement {
  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor");
    this.editor = this.editorElement.editor;
    this.classList.add("lexxy-floating-controls");

    if (!this.querySelector(".lexxy-node-delete")) {
      this.#attachDeleteButton();
    }
  }

  disconnectedCallback() {
    this.editor = null;
    this.editorElement = null;
  }

  #attachDeleteButton() {
    const container = createElement("div", { className: "lexxy-floating-controls__group" });

    this.deleteButton = createElement("button", {
      className: "lexxy-node-delete",
      type: "button",
      "aria-label": "Remove"
    });
    this.deleteButton.tabIndex = -1;
    this.deleteButton.innerHTML = DELETE_ICON;

    this.handleDeleteClick = () => this.#deleteNode();
    this.deleteButton.addEventListener("click", this.handleDeleteClick);
    container.appendChild(this.deleteButton);

    this.appendChild(container);
  }

  #deleteNode() {
    this.editor.update(() => {
      const node = $getNearestNodeFromDOMNode(this);
      node?.remove();
    });
  }
}

class TableController {
  #listeners = new ListenerBin()

  constructor(editorElement) {
    this.editor = editorElement.editor;
    this.contents = editorElement.contents;
    this.selection = editorElement.selection;

    this.currentTableNodeKey = null;
    this.currentCellKey = null;

    this.#registerKeyHandlers();
  }

  destroy() {
    this.currentTableNodeKey = null;
    this.currentCellKey = null;

    this.#listeners.dispose();
  }

  get currentCell() {
    if (!this.currentCellKey) return null

    return this.editor.getEditorState().read(() => {
      const cell = $getNodeByKey(this.currentCellKey);
      return (cell instanceof TableCellNode) ? cell : null
    })
  }

  get currentTableNode() {
    if (!this.currentTableNodeKey) return null

    return this.editor.getEditorState().read(() => {
      const tableNode = $getNodeByKey(this.currentTableNodeKey);
      return (tableNode instanceof TableNode) ? tableNode : null
    })
  }

  get currentRowCells() {
    const currentRowIndex = this.currentRowIndex;

    const rows = this.tableRows;
    if (!rows) return null

    return this.editor.getEditorState().read(() => {
      return rows[currentRowIndex]?.getChildren() ?? null
    }) ?? null
  }

  get currentRowIndex() {
    const currentCell = this.currentCell;
    if (!currentCell) return 0

    return this.editor.getEditorState().read(() => {
      return $getTableRowIndexFromTableCellNode(currentCell)
    }) ?? 0
  }

  get currentColumnCells() {
    const columnIndex = this.currentColumnIndex;

    const rows = this.tableRows;
    if (!rows) return null

    return this.editor.getEditorState().read(() => {
      return rows.map(row => row.getChildAtIndex(columnIndex))
    }) ?? null
  }

  get currentColumnIndex() {
    const currentCell = this.currentCell;
    if (!currentCell) return 0

    return this.editor.getEditorState().read(() => {
      return $getTableColumnIndexFromTableCellNode(currentCell)
    }) ?? 0
  }

  get tableRows() {
    return this.editor.getEditorState().read(() => {
      return this.currentTableNode?.getChildren()
    }) ?? null
  }

  updateSelectedTable() {
    let cellNode = null;
    let tableNode = null;

    this.editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!selection || !this.selection.isTableCellSelected) return

      const node = selection.getNodes()[0];

      cellNode = $findCellNode(node);
      tableNode = $findTableNode(node);
    });

    this.currentCellKey = cellNode?.getKey() ?? null;
    this.currentTableNodeKey = tableNode?.getKey() ?? null;

    return tableNode
  }

  executeTableCommand(command, customIndex = null) {
    if (command.action === "delete" && command.childType === "table") {
      this.#deleteTable();
      return
    }

    if (command.action === "toggle") {
      this.#executeToggleStyle(command);
      return
    }

    this.#executeCommand(command, customIndex);
  }

  #executeCommand(command, customIndex = null) {
    this.#selectCellAtSelection();
    this.editor.dispatchCommand(this.#commandName(command));
    this.#selectNextBestCell(command, customIndex);
  }

  #executeToggleStyle(command) {
    const childType = command.childType;

    let cells = null;
    let headerState = null;

    if (childType === "row") {
      cells = this.currentRowCells;
      headerState = TableCellHeaderStates.ROW;
    } else if (childType === "column") {
      cells = this.currentColumnCells;
      headerState = TableCellHeaderStates.COLUMN;
    }

    if (!cells || cells.length === 0) return

    this.editor.update(() => {
      const firstCell = $getTableCellNodeFromLexicalNode(cells[0]);
      if (!firstCell) return

      const currentStyle = firstCell.getHeaderStyles();
      const newStyle = currentStyle ^ headerState;

      cells.forEach(cell => {
        this.#setHeaderStyle(cell, newStyle, headerState);
      });
    });
  }

  #deleteTable() {
    this.#selectCellAtSelection();
    this.editor.dispatchCommand("deleteTable");
  }

  #selectCellAtSelection() {
    this.editor.update(() => {
      const selection = $getSelection();
      if (!selection) return

      const node = selection.getNodes()[0];

      $findCellNode(node)?.selectEnd();
    });
  }

  #commandName(command) {
    const { action, childType, direction } = command;

    const childTypeSuffix = upcaseFirst(childType);
    const directionSuffix = action == "insert" ? upcaseFirst(direction) : "";
    return `${action}Table${childTypeSuffix}${directionSuffix}`
  }

  #setHeaderStyle(cell, newStyle, headerState) {
    const tableCellNode = $getTableCellNodeFromLexicalNode(cell);
    tableCellNode?.setHeaderStyles(newStyle, headerState);
  }

  async #selectCellAtIndex(rowIndex, columnIndex) {
    // We wait for next frame, otherwise table operations might not have completed yet.
    await nextFrame();

    if (!this.currentTableNode) return

    const rows = this.tableRows;
    if (!rows) return

    const row = rows[rowIndex];
    if (!row) return

    this.editor.update(() => {
      const cell = $getTableCellNodeFromLexicalNode(row.getChildAtIndex(columnIndex));
      cell?.selectEnd();
    });
  }

  #selectNextBestCell(command, customIndex = null) {
    const { childType, direction } = command;

    let rowIndex = this.currentRowIndex;
    let columnIndex = customIndex !== null ? customIndex : this.currentColumnIndex;

    const deleteOffset = command.action === "delete" ? -1 : 0;
    const offset = direction === "after" ? 1 : deleteOffset;

    if (childType === "row") {
      rowIndex += offset;
    } else if (childType === "column") {
      columnIndex += offset;
    }

    this.#selectCellAtIndex(rowIndex, columnIndex);
  }

  #selectNextRow() {
    const rows = this.tableRows;
    if (!rows) return

    const nextRow = rows.at(this.currentRowIndex + 1);
    if (!nextRow) return

    this.editor.update(() => {
      nextRow.getChildAtIndex(this.currentColumnIndex)?.selectEnd();
    });
  }

  #selectPreviousCell() {
    const cell = this.currentCell;
    if (!cell) return

    this.editor.update(() => {
      cell.selectPrevious();
    });
  }

  #insertRowAndSelectFirstCell() {
    this.executeTableCommand({ action: "insert", childType: "row", direction: "after" }, 0);
  }

  #deleteRowAndSelectLastCell() {
    this.executeTableCommand({ action: "delete", childType: "row" }, -1);
  }

  #deleteRowAndSelectNextNode() {
    const tableNode = this.currentTableNode;
    this.executeTableCommand({ action: "delete", childType: "row" });

    this.editor.update(() => {
      const next = tableNode?.getNextSibling();
      if ($isParagraphNode(next)) {
        next.selectStart();
      } else {
        const newParagraph = $createParagraphNode();
        this.currentTableNode.insertAfter(newParagraph);
        newParagraph.selectStart();
      }
    });
  }

  #isCurrentCellEmpty() {
    if (!this.currentTableNode) return false

    const cell = this.currentCell;
    if (!cell) return false

    return cell.getTextContent().trim() === ""
  }

  #isCurrentRowLast() {
    if (!this.currentTableNode) return false

    const rows = this.tableRows;
    if (!rows) return false

    return rows.length === this.currentRowIndex + 1
  }

  #isCurrentRowEmpty() {
    if (!this.currentTableNode) return false

    const cells = this.currentRowCells;
    if (!cells) return false

    return cells.every(cell => cell.getTextContent().trim() === "")
  }

  #isFirstCellInRow() {
    if (!this.currentTableNode) return false

    const cells = this.currentRowCells;
    if (!cells) return false

    return cells.indexOf(this.currentCell) === 0
  }

  #registerKeyHandlers() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.#listeners.track(
      this.editor.registerCommand(KEY_BACKSPACE_COMMAND, (event) => this.#handleBackspaceKey(event), COMMAND_PRIORITY_HIGH),
      this.editor.registerCommand(KEY_ENTER_COMMAND, (event) => this.#handleEnterKey(event), COMMAND_PRIORITY_HIGH)
    );
  }

  #handleBackspaceKey(event) {
    if (!this.currentTableNode) return false

    if (this.#isCurrentRowEmpty() && this.#isFirstCellInRow()) {
      event.preventDefault();
      this.#deleteRowAndSelectLastCell();
      return true
    }

    if (this.#isCurrentCellEmpty() && !this.#isFirstCellInRow()) {
      event.preventDefault();
      this.#selectPreviousCell();
      return true
    }

    return false
  }

  #handleEnterKey(event) {
    if ((event.ctrlKey || event.metaKey) || event.shiftKey || !this.currentTableNode) return false

    if (this.selection.isInsideList || this.selection.isInsideCodeBlock) return false

    event.preventDefault();

    if (this.#isCurrentRowLast() && this.#isCurrentRowEmpty()) {
      this.#deleteRowAndSelectNextNode();
    } else if (this.#isCurrentRowLast()) {
      this.#insertRowAndSelectFirstCell();
    } else {
      this.#selectNextRow();
    }

    return true
  }
}

var TableIcons = {
  "insert-row-before":
    `<svg  viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.86804e-07 15C8.29055e-07 15.8284 0.671574 16.5 1.5 16.5H15L15.1533 16.4922C15.8593 16.4205 16.4205 15.8593 16.4922 15.1533L16.5 15V4.5L16.4922 4.34668C16.4154 3.59028 15.7767 3 15 3H13.5L13.5 4.5H15V9H1.5L1.5 4.5L3 4.5V3H1.5C0.671574 3 1.20956e-06 3.67157 1.24577e-06 4.5L7.86804e-07 15ZM15 10.5V15H1.5L1.5 10.5H15Z"/>
    <path d="M4.5 4.5H7.5V7.5H9V4.5H12L12 3L9 3V6.55671e-08L7.5 0V3L4.5 3V4.5Z"/>
    </svg>`,

  "insert-row-after":
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.86804e-07 13.5C7.50592e-07 14.3284 0.671574 15 1.5 15H3V13.5H1.5L1.5 9L15 9V13.5H13.5V15H15C15.7767 15 16.4154 14.4097 16.4922 13.6533L16.5 13.5V3L16.4922 2.84668C16.4205 2.14069 15.8593 1.57949 15.1533 1.50781L15 1.5L1.5 1.5C0.671574 1.5 1.28803e-06 2.17157 1.24577e-06 3L7.86804e-07 13.5ZM15 3V7.5L1.5 7.5L1.5 3L15 3Z"/>
    <path d="M7.5 15V18H9V15H12V13.5H9V10.5H7.5V13.5H4.5V15H7.5Z"/>
    </svg>`,

  "delete-row":
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.4922 12.1533C16.4154 12.9097 15.7767 13.5 15 13.5L12 13.5V12H15V6L1.5 6L1.5 12H4.5V13.5H1.5C0.723337 13.5 0.0846104 12.9097 0.00781328 12.1533L7.86804e-07 12L1.04907e-06 6C1.17362e-06 5.22334 0.590278 4.58461 1.34668 4.50781L1.5 4.5L15 4.5C15.8284 4.5 16.5 5.17157 16.5 6V12L16.4922 12.1533Z"/>
    <path d="M10.3711 15.9316L8.25 13.8096L6.12793 15.9316L5.06738 14.8711L7.18945 12.75L5.06738 10.6289L6.12793 9.56836L8.25 11.6895L10.3711 9.56836L11.4316 10.6289L9.31055 12.75L11.4316 14.8711L10.3711 15.9316Z"/>
    </svg>`,

  "toggle-row":
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.00781328 13.6533C0.0846108 14.4097 0.723337 15 1.5 15L15 15L15.1533 14.9922C15.8593 14.9205 16.4205 14.3593 16.4922 13.6533L16.5 13.5V4.5L16.4922 4.34668C16.4205 3.64069 15.8593 3.07949 15.1533 3.00781L15 3L1.5 3C0.671574 3 1.24863e-06 3.67157 1.18021e-06 4.5L7.86804e-07 13.5L0.00781328 13.6533ZM15 9V13.5L1.5 13.5L1.5 9L15 9Z"/>
    </svg>`,

  "insert-column-before":
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 0C3.67157 0 3 0.671573 3 1.5V3H4.5V1.5H9V15H4.5V13.5H3V15C3 15.7767 3.59028 16.4154 4.34668 16.4922L4.5 16.5H15L15.1533 16.4922C15.8593 16.4205 16.4205 15.8593 16.4922 15.1533L16.5 15V1.5C16.5 0.671573 15.8284 6.03989e-09 15 0H4.5ZM15 15H10.5V1.5H15V15Z"/>
    <path d="M3 7.5H0V9H3V12H4.5V9H7.5V7.5H4.5V4.5H3V7.5Z"/>
    </svg>`,

  "insert-column-after":
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 0C14.3284 0 15 0.671573 15 1.5V3H13.5V1.5H9V15H13.5V13.5H15V15C15 15.7767 14.4097 16.4154 13.6533 16.4922L13.5 16.5H3L2.84668 16.4922C2.14069 16.4205 1.57949 15.8593 1.50781 15.1533L1.5 15V1.5C1.5 0.671573 2.17157 6.03989e-09 3 0H13.5ZM3 15H7.5V1.5H3V15Z"/>
    <path d="M15 7.5H18V9H15V12H13.5V9H10.5V7.5H13.5V4.5H15V7.5Z"/>
    </svg>`,

  "delete-column":
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.1533 0.0078125C12.9097 0.0846097 13.5 0.723336 13.5 1.5V4.5H12V1.5H6V15H12V12H13.5V15C13.5 15.7767 12.9097 16.4154 12.1533 16.4922L12 16.5H6C5.22334 16.5 4.58461 15.9097 4.50781 15.1533L4.5 15V1.5C4.5 0.671573 5.17157 2.41596e-08 6 0H12L12.1533 0.0078125Z"/>
    <path d="M15.9316 6.12891L13.8105 8.24902L15.9326 10.3711L14.8711 11.4316L12.75 9.31055L10.6289 11.4316L9.56738 10.3711L11.6885 8.24902L9.56836 6.12891L10.6289 5.06836L12.75 7.18848L14.8711 5.06836L15.9316 6.12891Z"/>
    </svg>`,

  "toggle-column":
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.6533 17.9922C14.4097 17.9154 15 17.2767 15 16.5L15 3L14.9922 2.84668C14.9205 2.14069 14.3593 1.57949 13.6533 1.50781L13.5 1.5L4.5 1.5L4.34668 1.50781C3.59028 1.58461 3 2.22334 3 3L3 16.5C3 17.2767 3.59028 17.9154 4.34668 17.9922L4.5 18L13.5 18L13.6533 17.9922ZM9 3L13.5 3L13.5 16.5L9 16.5L9 3Z"/>
    </svg>`,

  "delete-table":
    `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.2041 1.01074C12.2128 1.113 13 1.96435 13 3V4H15L15.1025 4.00488C15.6067 4.05621 16 4.48232 16 5C16 5.55228 15.5523 6 15 6H14.8457L14.1416 15.1533C14.0614 16.1953 13.1925 17 12.1475 17H5.85254L5.6582 16.9902C4.76514 16.9041 4.03607 16.2296 3.88184 15.3457L3.8584 15.1533L3.1543 6H3C2.44772 6 2 5.55228 2 5C2 4.44772 2.44772 4 3 4H5V3C5 1.89543 5.89543 1 7 1H11L11.2041 1.01074ZM5.85254 15H12.1475L12.8398 6H5.16016L5.85254 15ZM7 4H11V3H7V4Z"/>
    </svg>`
};

class TableTools extends HTMLElement {
  #listeners = new ListenerBin()

  connectedCallback() {
    this.tableController = new TableController(this.#editorElement);
    this.classList.add("lexxy-floating-controls");
    this.role = "toolbar";

    this.#setUpButtons();
    this.#hide();
    this.#monitorForTableSelection();
    this.#registerKeyboardShortcuts();
  }

  disconnectedCallback() {
    this.dispose();
  }

  dispose() {
    this.#listeners.dispose();

    this.tableController?.destroy();
    this.tableController = null;
  }

  get #editor() {
    return this.#editorElement.editor
  }

  get #editorElement() {
    return this.closest("lexxy-editor")
  }

  get #tableToolsButtons() {
    return Array.from(this.querySelectorAll("button, details > summary"))
  }

  #setUpButtons() {
    this.innerHTML = "";

    this.appendChild(this.#createRowButtonsContainer());
    this.appendChild(this.#createColumnButtonsContainer());

    this.appendChild(this.#createDeleteTableButton());
    this.#listeners.track(registerEventListener(this, "keydown", this.#handleToolsKeydown));
  }

  #createButtonsContainer(childType, setCountProperty, moreMenu) {
    const container = createElement("div", { className: `lexxy-floating-controls__group lexxy-table-control lexxy-table-control--${childType}` });

    const plusButton = this.#createButton(`Add ${childType}`, { action: "insert", childType, direction: "after" }, "+");
    const minusButton = this.#createButton(`Remove ${childType}`, { action: "delete", childType }, "−");

    const dropdown = createElement("details", { className: "lexxy-table-control__more-menu" });
    dropdown.setAttribute("name", "lexxy-dropdown");
    dropdown.tabIndex = -1;

    const count = createElement("summary", {}, `_ ${childType}s`);
    setCountProperty(count);
    dropdown.appendChild(count);

    dropdown.appendChild(moreMenu);

    container.appendChild(minusButton);
    container.appendChild(dropdown);
    container.appendChild(plusButton);

    return container
  }

  #createRowButtonsContainer() {
    return this.#createButtonsContainer(
      "row",
      (count) => { this.rowCount = count; },
      this.#createMoreMenuSection("row")
    )
  }

  #createColumnButtonsContainer() {
    return this.#createButtonsContainer(
      "column",
      (count) => { this.columnCount = count; },
      this.#createMoreMenuSection("column")
    )
  }

  #createMoreMenuSection(childType) {
    const section = createElement("div", { className: "lexxy-floating-controls__group lexxy-table-control__more-menu-details" });
    const addBeforeButton = this.#createButton(`Add ${childType} before`, { action: "insert", childType, direction: "before" });
    const addAfterButton = this.#createButton(`Add ${childType} after`, { action: "insert", childType, direction: "after" });
    const toggleStyleButton = this.#createButton(`Toggle ${childType} style`, { action: "toggle", childType });
    const deleteButton = this.#createButton(`Remove ${childType}`, { action: "delete", childType });

    section.appendChild(addBeforeButton);
    section.appendChild(addAfterButton);
    section.appendChild(toggleStyleButton);
    section.appendChild(deleteButton);

    return section
  }

  #createDeleteTableButton() {
    const container = createElement("div", { className: "lexxy-table-control lexxy-floating-controls__group" });

    const deleteTableButton = this.#createButton("Delete this table?", { action: "delete", childType: "table" });
    deleteTableButton.classList.add("lexxy-table-control__button--delete-table");

    container.appendChild(deleteTableButton);

    this.deleteContainer = container;

    return container
  }

  #createButton(label, command = {}, icon = this.#icon(command)) {
    const button = createElement("button", {
      className: "lexxy-table-control__button",
      "aria-label": label,
      type: "button"
    });
    button.tabIndex = -1;
    button.innerHTML = `${icon} <span>${label}</span>`;

    button.dataset.action = command.action;
    button.dataset.childType = command.childType;
    button.dataset.direction = command.direction;

    button.addEventListener("click", () => this.#executeTableCommand(command));

    button.addEventListener("mouseover", () => this.#handleCommandButtonHover());
    button.addEventListener("focus", () => this.#handleCommandButtonHover());
    button.addEventListener("mouseout", () => this.#handleCommandButtonHover());

    return button
  }

  #registerKeyboardShortcuts() {
    this.#listeners.track(this.#editor.registerCommand(KEY_DOWN_COMMAND, this.#focusToolbarOnAltF10, COMMAND_PRIORITY_HIGH));
  }

  #focusToolbarOnAltF10 = (event) => {
    if (this.#hasSelectedTable && event.altKey && event.key === "F10") {
      event.preventDefault();
      // Ask for the ring explicitly: a programmatic focus coming from a mouse-focused
      // editor otherwise inherits the mouse modality and paints no focus ring.
      this.#tableToolsButtons[0]?.focus({ focusVisible: true });
      return true
    } else {
      return false
    }
  }

  get #hasSelectedTable() {
    return this.tableController?.currentTableNodeKey != null
  }

  #handleToolsKeydown = (event) => {
    if (event.key === "Escape") {
      this.#handleEscapeKey();
    } else {
      handleRollingTabIndex(this.#tableToolsButtons, event);
    }
  }

  #handleEscapeKey() {
    const cell = this.tableController.currentCell;
    if (!cell) return

    this.#editor.update(() => {
      cell.select();
      this.#editor.focus();
    });

    this.#update();
  }

  async #handleCommandButtonHover() {
    await nextFrame();

    this.#clearCellStyles();

    const activeElement = this.querySelector("button:hover, button:focus");
    if (!activeElement) return

    const command = {
      action: activeElement.dataset.action,
      childType: activeElement.dataset.childType,
      direction: activeElement.dataset.direction
    };

    let cellsToHighlight = null;

    switch (command.childType) {
      case "row":
        cellsToHighlight = this.tableController.currentRowCells;
        break
      case "column":
        cellsToHighlight = this.tableController.currentColumnCells;
        break
      case "table":
        cellsToHighlight = this.tableController.tableRows;
        break
    }

    if (!cellsToHighlight) return

    cellsToHighlight.forEach(cell => {
      const cellElement = this.#editor.getElementByKey(cell.getKey());
      if (!cellElement) return

      cellElement.classList.toggle(theme.tableCellHighlight, true);
      Object.assign(cellElement.dataset, command);
    });
  }

  #monitorForTableSelection() {
    this.#listeners.track(this.#editor.registerUpdateListener(() => {
      const tableNode = this.#editor.getRootElement() && this.tableController.updateSelectedTable();

      if (tableNode) {
        this.#show();
      } else {
        this.#hide();
      }
    }));
  }

  #executeTableCommand(command) {
    this.tableController.executeTableCommand(command);
    this.#update();
  }

  #show() {
    this.#updateButtonsPosition();
    this.style.display = "flex";
    this.#updateRowColumnCount();
    this.#closeMoreMenu();
    this.#handleCommandButtonHover();
  }

  #hide() {
    this.style.display = "none";
    this.#clearCellStyles();
  }

  #update() {
    this.#updateButtonsPosition();
    this.#updateRowColumnCount();
    this.#closeMoreMenu();
    this.#handleCommandButtonHover();
  }

  #closeMoreMenu() {
    this.querySelector("details[open]")?.removeAttribute("open");
  }

  #updateButtonsPosition() {
    const tableNode = this.tableController.currentTableNode;
    if (!tableNode) return

    const tableElement = this.#editor.getElementByKey(tableNode.getKey());
    if (!tableElement) return

    const tableRect = tableElement.getBoundingClientRect();
    const editorRect = this.#editorElement.getBoundingClientRect();

    const relativeTop = tableRect.top - editorRect.top;
    const relativeCenter = (tableRect.left + tableRect.right) / 2 - editorRect.left;
    this.style.top = `${relativeTop}px`;
    this.style.left = `${relativeCenter}px`;
  }

  #updateRowColumnCount() {
    const tableNode = this.tableController.currentTableNode;
    if (!tableNode) return

    const tableElement = $getElementForTableNode(this.#editor, tableNode);
    if (!tableElement) return

    const rowCount = tableElement.rows;
    const columnCount = tableElement.columns;

    this.rowCount.textContent = `${rowCount} row${rowCount === 1 ? "" : "s"}`;
    this.columnCount.textContent = `${columnCount} column${columnCount === 1 ? "" : "s"}`;
  }

  #setTableCellFocus() {
    const cell = this.tableController.currentCell;
    if (!cell) return

    const cellElement = this.#editor.getElementByKey(cell.getKey());
    if (!cellElement) return

    cellElement.classList.add(theme.tableCellFocus);
  }

  #clearCellStyles() {
    this.#editorElement.querySelectorAll(`.${theme.tableCellFocus}`)?.forEach(cell => {
      cell.classList.remove(theme.tableCellFocus);
    });

    this.#editorElement.querySelectorAll(`.${theme.tableCellHighlight}`)?.forEach(cell => {
      cell.classList.remove(theme.tableCellHighlight);
      cell.removeAttribute("data-action");
      cell.removeAttribute("data-child-type");
      cell.removeAttribute("data-direction");
    });

    this.#setTableCellFocus();
  }

  #icon(command) {
    const { action, childType } = command;
    const direction = (action == "insert" ? command.direction : null);
    const iconId = [ action, childType, direction ].filter(Boolean).join("-");
    return TableIcons[iconId]
  }
}

function defineElements() {
  const elements = {
    // Toolbar must be registered BEFORE Editor
    "lexxy-toolbar": LexicalToolbarElement,
    "lexxy-toolbar-dropdown": ToolbarDropdown,
    "lexxy-heading-dropdown": HeadingDropdown,
    "lexxy-highlight-dropdown": HighlightDropdown,
    "lexxy-link-dropdown": LinkDropdown,

    "lexxy-editor": LexicalEditorElement,

    // Prompt must be registered AFTER Editor
    "lexxy-prompt": LexicalPromptElement,
    "lexxy-code-language-picker": CodeLanguagePicker,
    "lexxy-node-delete-button": NodeDeleteButton,
    "lexxy-table-tools": TableTools
  };

  Object.entries(elements).forEach(([ name, element ]) => {
    customElements.define(name, element);
  });
}

class NativeAdapter {
  frozenLinkKey = null

  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editorContentElement = editorElement.editorContentElement;
  }

  dispatchAttributesChange(attributes, linkHref, highlight, headingTag) {
    dispatch(this.editorElement, "lexxy:attributes-change", {
      attributes,
      link: linkHref ? { href: linkHref } : null,
      highlight,
      headingTag
    });
  }

  dispatchEditorInitialized(detail) {
    dispatch(this.editorElement, "lexxy:editor-initialized", detail);
  }

  freeze() {
    let frozenLinkKey = null;
    this.editorElement.editor?.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return

      const linkNode = $getNearestNodeOfType(selection.anchor.getNode(), LinkNode);
      if (linkNode) {
        frozenLinkKey = linkNode.getKey();
      }
    });

    this.frozenLinkKey = frozenLinkKey;
    this.editorContentElement.contentEditable = "false";
  }

  thaw() {
    this.editorContentElement.contentEditable = "true";
  }

  unlinkFrozenNode() {
    const key = this.frozenLinkKey;
    if (!key) return false

    const linkNode = $getNodeByKey(key);
    if (!$isLinkNode(linkNode)) {
      this.frozenLinkKey = null;
      return false
    }

    const children = linkNode.getChildren();
    for (const child of children) {
      linkNode.insertBefore(child);
    }
    linkNode.remove();

    // Select the former link text so a follow-up createLink can re-wrap it.
    const firstText = this.#findFirstTextDescendant(children);
    const lastText = this.#findLastTextDescendant(children);
    if (firstText && lastText) {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.anchor.set(firstText.getKey(), 0, "text");
        selection.focus.set(lastText.getKey(), lastText.getTextContent().length, "text");
      }
    }

    this.frozenLinkKey = null;
    return true
  }

  #findFirstTextDescendant(nodes) {
    for (const node of nodes) {
      if ($isTextNode(node)) return node
      if ($isElementNode(node)) {
        const nestedTextNode = this.#findFirstTextDescendant(node.getChildren());
        if (nestedTextNode) return nestedTextNode
      }
    }

    return null
  }

  #findLastTextDescendant(nodes) {
    for (let index = nodes.length - 1; index >= 0; index--) {
      const node = nodes[index];
      if ($isTextNode(node)) return node
      if ($isElementNode(node)) {
        const nestedTextNode = this.#findLastTextDescendant(node.getChildren());
        if (nestedTextNode) return nestedTextNode
      }
    }

    return null
  }
}

const configure = Lexxy.configure;

// Pushing elements definition to after the current call stack to allow global configuration to take place first
setTimeout(defineElements, 0);

export { $createActionTextAttachmentNode, $createActionTextAttachmentUploadNode, $isActionTextAttachmentNode, $isCustomActionTextAttachmentNode, ActionTextAttachmentNode, ActionTextAttachmentUploadNode, CustomActionTextAttachmentNode, LexxyExtension as Extension, HorizontalDividerNode, NativeAdapter, REWRITE_HISTORY_COMMAND, configure };
