import { DirectUpload } from '@rails/activestorage';

/*! @license DOMPurify 3.3.0 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.0/LICENSE */

const {
  entries,
  setPrototypeOf,
  isFrozen,
  getPrototypeOf,
  getOwnPropertyDescriptor
} = Object;
let {
  freeze,
  seal,
  create
} = Object; // eslint-disable-line import/no-mutable-exports
let {
  apply,
  construct
} = typeof Reflect !== 'undefined' && Reflect;
if (!freeze) {
  freeze = function freeze(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
const arrayForEach = unapply(Array.prototype.forEach);
const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
const arrayPop = unapply(Array.prototype.pop);
const arrayPush = unapply(Array.prototype.push);
const arraySplice = unapply(Array.prototype.splice);
const stringToLowerCase = unapply(String.prototype.toLowerCase);
const stringToString = unapply(String.prototype.toString);
const stringMatch = unapply(String.prototype.match);
const stringReplace = unapply(String.prototype.replace);
const stringIndexOf = unapply(String.prototype.indexOf);
const stringTrim = unapply(String.prototype.trim);
const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
const regExpTest = unapply(RegExp.prototype.test);
const typeErrorCreate = unconstruct(TypeError);
/**
 * Creates a new function that calls the given function with a specified thisArg and arguments.
 *
 * @param func - The function to be wrapped and called.
 * @returns A new function that calls the given function with a specified thisArg and arguments.
 */
function unapply(func) {
  return function (thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
/**
 * Creates a new function that constructs an instance of the given constructor function with the provided arguments.
 *
 * @param func - The constructor function to be wrapped and called.
 * @returns A new function that constructs an instance of the given constructor function with the provided arguments.
 */
function unconstruct(Func) {
  return function () {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
/**
 * Add properties to a lookup table
 *
 * @param set - The set to which elements will be added.
 * @param array - The array containing elements to be added to the set.
 * @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
 * @returns The modified set with added elements.
 */
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    // Make 'in' and truthy checks like Boolean(set.constructor)
    // independent of any properties defined on Object.prototype.
    // Prevent prototype setters from intercepting set as a this value.
    setPrototypeOf(set, null);
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === 'string') {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        // Config presets (e.g. tags.js, attrs.js) are immutable.
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
/**
 * Clean up an array to harden against CSPP
 *
 * @param array - The array to be cleaned.
 * @returns The cleaned version of the array
 */
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
/**
 * Shallow clone an object
 *
 * @param object - The object to be cloned.
 * @returns A new object that copies the original.
 */
function clone(object) {
  const newObject = create(null);
  for (const [property, value] of entries(object)) {
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (Array.isArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
/**
 * This method automatically checks if the prop is function or getter and behaves accordingly.
 *
 * @param object - The object to look up the getter function in its prototype chain.
 * @param prop - The property name for which to find the getter function.
 * @returns The getter function found in the prototype chain or a fallback function.
 */
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === 'function') {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}

const html$1 = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'search', 'section', 'select', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);
const svg$1 = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'enterkeyhint', 'exportparts', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'inputmode', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'part', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'view', 'vkern']);
const svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);
// List of SVG elements that are disallowed by default.
// We still need to know them so that we can do namespace
// checks properly in case one wants to add them to
// allow-list.
const svgDisallowed = freeze(['animate', 'color-profile', 'cursor', 'discard', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignobject', 'hatch', 'hatchpath', 'mesh', 'meshgradient', 'meshpatch', 'meshrow', 'missing-glyph', 'script', 'set', 'solidcolor', 'unknown', 'use']);
const mathMl$1 = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'mprescripts']);
// Similarly to SVG, we want to know all MathML elements,
// even those that we disallow by default.
const mathMlDisallowed = freeze(['maction', 'maligngroup', 'malignmark', 'mlongdiv', 'mscarries', 'mscarry', 'msgroup', 'mstack', 'msline', 'msrow', 'semantics', 'annotation', 'annotation-xml', 'mprescripts', 'none']);
const text = freeze(['#text']);

const html = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'exportparts', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inert', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'nonce', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'part', 'pattern', 'placeholder', 'playsinline', 'popover', 'popovertarget', 'popovertargetaction', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'slot', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'wrap', 'xmlns', 'slot']);
const svg = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'amplitude', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clippathunits', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'exponent', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'intercept', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'mask-type', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'slope', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'systemlanguage', 'tabindex', 'tablevalues', 'targetx', 'targety', 'transform', 'transform-origin', 'text-anchor', 'text-decoration', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);
const mathMl = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnsalign', 'columnlines', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lspace', 'lquote', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);
const xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);

// eslint-disable-next-line unicorn/better-regex
const MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm); // Specify template detection regex for SAFE_FOR_TEMPLATES mode
const ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
const TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm); // eslint-disable-line unicorn/better-regex
const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/); // eslint-disable-line no-useless-escape
const ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
const IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
);
const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
const ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g // eslint-disable-line no-control-regex
);
const DOCTYPE_NAME = seal(/^html$/i);
const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);

var EXPRESSIONS = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ARIA_ATTR: ARIA_ATTR,
  ATTR_WHITESPACE: ATTR_WHITESPACE,
  CUSTOM_ELEMENT: CUSTOM_ELEMENT,
  DATA_ATTR: DATA_ATTR,
  DOCTYPE_NAME: DOCTYPE_NAME,
  ERB_EXPR: ERB_EXPR,
  IS_ALLOWED_URI: IS_ALLOWED_URI,
  IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA,
  MUSTACHE_EXPR: MUSTACHE_EXPR,
  TMPLIT_EXPR: TMPLIT_EXPR
});

/* eslint-disable @typescript-eslint/indent */
// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
const NODE_TYPE = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9};
const getGlobal = function getGlobal() {
  return typeof window === 'undefined' ? null : window;
};
/**
 * Creates a no-op policy for internal use only.
 * Don't export this function outside this module!
 * @param trustedTypes The policy factory.
 * @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
 * @return The policy created (or null, if Trusted Types
 * are not supported or creating the policy failed).
 */
const _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
    return null;
  }
  // Allow the callers to control the unique policy name
  // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
  // Policy creation with duplicate names throws in Trusted Types.
  let suffix = null;
  const ATTR_NAME = 'data-tt-policy-suffix';
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = 'dompurify' + (suffix ? '#' + suffix : '');
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html) {
        return html;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    // Policy creation failed (most likely another DOMPurify script has
    // already run). Skip creating the policy, as this will only cause errors
    // if TT are enforced.
    console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
    return null;
  }
};
const _createHooksMap = function _createHooksMap() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function createDOMPurify() {
  let window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();
  const DOMPurify = root => createDOMPurify(root);
  DOMPurify.version = '3.3.0';
  DOMPurify.removed = [];
  if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
    // Not running in a browser, provide a factory function
    // so that you can pass your own Window
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let {
    document
  } = window;
  const originalDocument = document;
  const currentScript = originalDocument.currentScript;
  const {
    DocumentFragment,
    HTMLTemplateElement,
    Node,
    Element,
    NodeFilter,
    NamedNodeMap = window.NamedNodeMap || window.MozNamedAttrMap,
    HTMLFormElement,
    DOMParser,
    trustedTypes
  } = window;
  const ElementPrototype = Element.prototype;
  const cloneNode = lookupGetter(ElementPrototype, 'cloneNode');
  const remove = lookupGetter(ElementPrototype, 'remove');
  const getNextSibling = lookupGetter(ElementPrototype, 'nextSibling');
  const getChildNodes = lookupGetter(ElementPrototype, 'childNodes');
  const getParentNode = lookupGetter(ElementPrototype, 'parentNode');
  // As per issue #47, the web-components registry is inherited by a
  // new document created via createHTMLDocument. As per the spec
  // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
  // a new empty registry is used when creating a template contents owner
  // document, so we use that as our parent document to ensure nothing
  // is inherited.
  if (typeof HTMLTemplateElement === 'function') {
    const template = document.createElement('template');
    if (template.content && template.content.ownerDocument) {
      document = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = '';
  const {
    implementation,
    createNodeIterator,
    createDocumentFragment,
    getElementsByTagName
  } = document;
  const {
    importNode
  } = originalDocument;
  let hooks = _createHooksMap();
  /**
   * Expose whether this browser supports running the full DOMPurify.
   */
  DOMPurify.isSupported = typeof entries === 'function' && typeof getParentNode === 'function' && implementation && implementation.createHTMLDocument !== undefined;
  const {
    MUSTACHE_EXPR,
    ERB_EXPR,
    TMPLIT_EXPR,
    DATA_ATTR,
    ARIA_ATTR,
    IS_SCRIPT_OR_DATA,
    ATTR_WHITESPACE,
    CUSTOM_ELEMENT
  } = EXPRESSIONS;
  let {
    IS_ALLOWED_URI: IS_ALLOWED_URI$1
  } = EXPRESSIONS;
  /**
   * We consider the elements and attributes below to be safe. Ideally
   * don't add any new ones but feel free to remove unwanted ones.
   */
  /* allowed element names */
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  /* Allowed attribute names */
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  /*
   * Configure how DOMPurify should handle custom elements and their attributes as well as customized built-in elements.
   * @property {RegExp|Function|null} tagNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any custom elements)
   * @property {RegExp|Function|null} attributeNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any attributes not on the allow list)
   * @property {boolean} allowCustomizedBuiltInElements allow custom elements derived from built-ins if they pass CUSTOM_ELEMENT_HANDLING.tagNameCheck. Default: `false`.
   */
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
  let FORBID_TAGS = null;
  /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
  let FORBID_ATTR = null;
  /* Config object to store ADD_TAGS/ADD_ATTR functions (when used as functions) */
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  /* Decide if ARIA attributes are okay */
  let ALLOW_ARIA_ATTR = true;
  /* Decide if custom data attributes are okay */
  let ALLOW_DATA_ATTR = true;
  /* Decide if unknown protocols are okay */
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  /* Decide if self-closing tags in attributes are allowed.
   * Usually removed due to a mXSS issue in jQuery 3.0 */
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  /* Output should be safe for common template engines.
   * This means, DOMPurify removes data attributes, mustaches and ERB
   */
  let SAFE_FOR_TEMPLATES = false;
  /* Output should be safe even for XML used within HTML and alike.
   * This means, DOMPurify removes comments when containing risky content.
   */
  let SAFE_FOR_XML = true;
  /* Decide if document with <html>... should be returned */
  let WHOLE_DOCUMENT = false;
  /* Track whether config is already set on this instance of DOMPurify. */
  let SET_CONFIG = false;
  /* Decide if all elements (e.g. style, script) must be children of
   * document.body. By default, browsers might move them to document.head */
  let FORCE_BODY = false;
  /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
   * string (or a TrustedHTML object if Trusted Types are supported).
   * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
   */
  let RETURN_DOM = false;
  /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
   * string  (or a TrustedHTML object if Trusted Types are supported) */
  let RETURN_DOM_FRAGMENT = false;
  /* Try to return a Trusted Type object instead of a string, return a string in
   * case Trusted Types are not supported  */
  let RETURN_TRUSTED_TYPE = false;
  /* Output should be free from DOM clobbering attacks?
   * This sanitizes markups named with colliding, clobberable built-in DOM APIs.
   */
  let SANITIZE_DOM = true;
  /* Achieve full DOM Clobbering protection by isolating the namespace of named
   * properties and JS variables, mitigating attacks that abuse the HTML/DOM spec rules.
   *
   * HTML/DOM spec rules that enable DOM Clobbering:
   *   - Named Access on Window (§7.3.3)
   *   - DOM Tree Accessors (§3.1.5)
   *   - Form Element Parent-Child Relations (§4.10.3)
   *   - Iframe srcdoc / Nested WindowProxies (§4.8.5)
   *   - HTMLCollection (§4.2.10.2)
   *
   * Namespace isolation is implemented by prefixing `id` and `name` attributes
   * with a constant string, i.e., `user-content-`
   */
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = 'user-content-';
  /* Keep element content when removing element? */
  let KEEP_CONTENT = true;
  /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
   * of importing it into a new Document and returning a sanitized copy */
  let IN_PLACE = false;
  /* Allow usage of profiles like html, svg and mathMl */
  let USE_PROFILES = {};
  /* Tags to ignore content of when KEEP_CONTENT is true */
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);
  /* Tags that are safe for data: URIs */
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);
  /* Attributes safe for values like "javascript:" */
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'role', 'summary', 'title', 'value', 'style', 'xmlns']);
  const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
  /* Document namespace */
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  /* Allowed XHTML+XML namespaces */
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ['mi', 'mo', 'mn', 'ms', 'mtext']);
  let HTML_INTEGRATION_POINTS = addToSet({}, ['annotation-xml']);
  // Certain elements are allowed in both SVG and HTML
  // namespace. We need to specify them explicitly
  // so that they don't get erroneously deleted from
  // HTML namespace.
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ['title', 'style', 'font', 'a', 'script']);
  /* Parsing of strict XHTML documents */
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ['application/xhtml+xml', 'text/html'];
  const DEFAULT_PARSER_MEDIA_TYPE = 'text/html';
  let transformCaseFunc = null;
  /* Keep a reference to config to pass to hooks */
  let CONFIG = null;
  /* Ideally, do not touch anything below this line */
  /* ______________________________________________ */
  const formElement = document.createElement('form');
  const isRegexOrFunction = function isRegexOrFunction(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  /**
   * _parseConfig
   *
   * @param cfg optional config literal
   */
  // eslint-disable-next-line complexity
  const _parseConfig = function _parseConfig() {
    let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    /* Shield configuration object from tampering */
    if (!cfg || typeof cfg !== 'object') {
      cfg = {};
    }
    /* Shield configuration object from prototype pollution */
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE =
    // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    // HTML tags and attributes are not case-sensitive, converting to lowercase. Keeping XHTML as is.
    transformCaseFunc = PARSER_MEDIA_TYPE === 'application/xhtml+xml' ? stringToString : stringToLowerCase;
    /* Set configuration parameters */
    ALLOWED_TAGS = objectHasOwnProperty(cfg, 'ALLOWED_TAGS') ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = objectHasOwnProperty(cfg, 'ALLOWED_ATTR') ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, 'ALLOWED_NAMESPACES') ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, 'ADD_URI_SAFE_ATTR') ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = objectHasOwnProperty(cfg, 'ADD_DATA_URI_TAGS') ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
    FORBID_CONTENTS = objectHasOwnProperty(cfg, 'FORBID_CONTENTS') ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
    FORBID_TAGS = objectHasOwnProperty(cfg, 'FORBID_TAGS') ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
    FORBID_ATTR = objectHasOwnProperty(cfg, 'FORBID_ATTR') ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
    USE_PROFILES = objectHasOwnProperty(cfg, 'USE_PROFILES') ? cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false; // Default true
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false; // Default true
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
    RETURN_DOM = cfg.RETURN_DOM || false; // Default false
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
    FORCE_BODY = cfg.FORCE_BODY || false; // Default false
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false; // Default false
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
    IN_PLACE = cfg.IN_PLACE || false; // Default false
    IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
    HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
    CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === 'boolean') {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
    }
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    /* Parse profile info */
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = [];
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    /* Merge configuration parameters */
    if (cfg.ADD_TAGS) {
      if (typeof cfg.ADD_TAGS === 'function') {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (cfg.ADD_ATTR) {
      if (typeof cfg.ADD_ATTR === 'function') {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (cfg.ADD_URI_SAFE_ATTR) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (cfg.FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    /* Add #text in case KEEP_CONTENT is set to true */
    if (KEEP_CONTENT) {
      ALLOWED_TAGS['#text'] = true;
    }
    /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
    }
    /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ['tbody']);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== 'function') {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== 'function') {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      // Overwrite existing TrustedTypes policy.
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      // Sign local variables required by `sanitize`.
      emptyHTML = trustedTypesPolicy.createHTML('');
    } else {
      // Uninitialized policy, attempt to initialize the internal dompurify policy.
      if (trustedTypesPolicy === undefined) {
        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      }
      // If creating the internal policy succeeded sign internal variables.
      if (trustedTypesPolicy !== null && typeof emptyHTML === 'string') {
        emptyHTML = trustedTypesPolicy.createHTML('');
      }
    }
    // Prevent further manipulation of configuration.
    // Not available in IE8, Safari 5, etc.
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  /* Keep track of all possible SVG and MathML tags
   * so that we can perform the namespace checks
   * correctly. */
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  /**
   * @param element a DOM element whose namespace is being checked
   * @returns Return false if the element has a
   *  namespace that a spec-compliant parser would never
   *  return. Return true otherwise.
   */
  const _checkValidNamespace = function _checkValidNamespace(element) {
    let parent = getParentNode(element);
    // In JSDOM, if we're inside shadow DOM, then parentNode
    // can be null. We just simulate parent in this case.
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: 'template'
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      // The only way to switch from HTML namespace to SVG
      // is via <svg>. If it happens via any other tag, then
      // it should be killed.
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === 'svg';
      }
      // The only way to switch from MathML to SVG is via`
      // svg if parent is either <annotation-xml> or MathML
      // text integration points.
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === 'svg' && (parentTagName === 'annotation-xml' || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      // We only allow elements that are defined in SVG
      // spec. All others are disallowed in SVG namespace.
      return Boolean(ALL_SVG_TAGS[tagName]);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      // The only way to switch from HTML namespace to MathML
      // is via <math>. If it happens via any other tag, then
      // it should be killed.
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === 'math';
      }
      // The only way to switch from SVG to MathML is via
      // <math> and HTML integration points
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === 'math' && HTML_INTEGRATION_POINTS[parentTagName];
      }
      // We only allow elements that are defined in MathML
      // spec. All others are disallowed in MathML namespace.
      return Boolean(ALL_MATHML_TAGS[tagName]);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      // The only way to switch from SVG to HTML is via
      // HTML integration points, and from MathML to HTML
      // is via MathML text integration points
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      // We disallow tags that are specific for MathML
      // or SVG and should never appear in HTML namespace
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    }
    // For XHTML and XML documents that support custom namespaces
    if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    // The code should never reach this place (this means
    // that the element somehow got namespace that is not
    // HTML, SVG, MathML or allowed via ALLOWED_NAMESPACES).
    // Return false just in case.
    return false;
  };
  /**
   * _forceRemove
   *
   * @param node a DOM node
   */
  const _forceRemove = function _forceRemove(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove(node);
    }
  };
  /**
   * _removeAttribute
   *
   * @param name an Attribute name
   * @param element a DOM node
   */
  const _removeAttribute = function _removeAttribute(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    // We void attribute values for unremovable "is" attributes
    if (name === 'is') {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {}
      } else {
        try {
          element.setAttribute(name, '');
        } catch (_) {}
      }
    }
  };
  /**
   * _initDocument
   *
   * @param dirty - a string of dirty markup
   * @return a DOM, filled with the dirty markup
   */
  const _initDocument = function _initDocument(dirty) {
    /* Create a HTML document */
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = '<remove></remove>' + dirty;
    } else {
      /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && NAMESPACE === HTML_NAMESPACE) {
      // Root of XHTML doc must contain xmlns declaration (see https://www.w3.org/TR/xhtml1/normative.html#strict)
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + '</body></html>';
    }
    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    /*
     * Use the DOMParser API by default, fallback later if needs be
     * DOMParser not work for svg when has multiple root element.
     */
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {}
    }
    /* Use createHTMLDocument in case DOMParser is not available */
    if (!doc || !doc.documentElement) {
      doc = implementation.createDocument(NAMESPACE, 'template', null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
        // Syntax error if dirtyPayload is invalid xml
      }
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    /* Work on whole document or just its body */
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  /**
   * Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
   *
   * @param root The root element or node to start traversing on.
   * @return The created NodeIterator
   */
  const _createNodeIterator = function _createNodeIterator(root) {
    return createNodeIterator.call(root.ownerDocument || root, root,
    // eslint-disable-next-line no-bitwise
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
  };
  /**
   * _isClobbered
   *
   * @param element element to check for clobbering attacks
   * @return true if clobbered, false if safe
   */
  const _isClobbered = function _isClobbered(element) {
    return element instanceof HTMLFormElement && (typeof element.nodeName !== 'string' || typeof element.textContent !== 'string' || typeof element.removeChild !== 'function' || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== 'function' || typeof element.setAttribute !== 'function' || typeof element.namespaceURI !== 'string' || typeof element.insertBefore !== 'function' || typeof element.hasChildNodes !== 'function');
  };
  /**
   * Checks whether the given object is a DOM node.
   *
   * @param value object to check whether it's a DOM node
   * @return true is object is a DOM node
   */
  const _isNode = function _isNode(value) {
    return typeof Node === 'function' && value instanceof Node;
  };
  function _executeHooks(hooks, currentNode, data) {
    arrayForEach(hooks, hook => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  /**
   * _sanitizeElements
   *
   * @protect nodeName
   * @protect textContent
   * @protect removeChild
   * @param currentNode to check for permission to exist
   * @return true if node was killed, false if left alive
   */
  const _sanitizeElements = function _sanitizeElements(currentNode) {
    let content = null;
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    /* Check if element is clobbered or can clobber */
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Now let's check the element's type and name */
    const tagName = transformCaseFunc(currentNode.nodeName);
    /* Execute a hook if present */
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    /* Detect mXSS attempts abusing namespace confusion */
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove any occurrence of processing instructions */
    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove any kind of possibly harmful comments */
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove element if anything forbids its presence */
    if (!(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName])) {
      /* Check if we have a custom element to handle */
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      /* Keep content except for bad-listed elements */
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const childClone = cloneNode(childNodes[i], true);
            childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
            parentNode.insertBefore(childClone, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    }
    /* Check whether element has a valid namespace */
    if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Make sure that older browsers don't get fallback-tag mXSS */
    if ((tagName === 'noscript' || tagName === 'noembed' || tagName === 'noframes') && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Sanitize element content to be template-safe */
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      /* Get the element's text content */
      content = currentNode.textContent;
      arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
        content = stringReplace(content, expr, ' ');
      });
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  /**
   * _isValidAttribute
   *
   * @param lcTag Lowercase tag name of containing element.
   * @param lcName Lowercase attribute name.
   * @param value Attribute value.
   * @return Returns true if `value` is valid, otherwise false.
   */
  // eslint-disable-next-line complexity
  const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
    /* Make sure attribute cannot clobber */
    if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
      return false;
    }
    /* Allow valid data-* attributes: At least one character after "-"
        (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
        XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
        We don't need to check the value; it's always URI safe. */
    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR, lcName)) ; else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR, lcName)) ; else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)) ; else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
      if (
      // First condition does a very basic check if a) it's basically a valid custom element tagname AND
      // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
      // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
      _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) ||
      // Alternative, second condition checks if it's an `is`-attribute, AND
      // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
      lcName === 'is' && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))) ; else {
        return false;
      }
      /* Check value is safe. First, is attr inert? If so, is safe */
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ; else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE, ''))) ; else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag]) ; else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA, stringReplace(value, ATTR_WHITESPACE, ''))) ; else if (value) {
      return false;
    } else ;
    return true;
  };
  /**
   * _isBasicCustomElement
   * checks if at least one dash is included in tagName, and it's not the first char
   * for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
   *
   * @param tagName name of the tag of the node to sanitize
   * @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
   */
  const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
    return tagName !== 'annotation-xml' && stringMatch(tagName, CUSTOM_ELEMENT);
  };
  /**
   * _sanitizeAttributes
   *
   * @protect attributes
   * @protect nodeName
   * @protect removeAttribute
   * @protect setAttribute
   *
   * @param currentNode to sanitize
   */
  const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const {
      attributes
    } = currentNode;
    /* Check if we have attributes; if not we might have a text node */
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: '',
      attrValue: '',
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: undefined
    };
    let l = attributes.length;
    /* Go backwards over all attributes; safely remove bad ones */
    while (l--) {
      const attr = attributes[l];
      const {
        name,
        namespaceURI,
        value: attrValue
      } = attr;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === 'value' ? initValue : stringTrim(initValue);
      /* Execute a hook if present */
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      /* Full DOM Clobbering protection via namespace isolation,
       * Prefix id and name attributes with `user-content-`
       */
      if (SANITIZE_NAMED_PROPS && (lcName === 'id' || lcName === 'name')) {
        // Remove the attribute with this value
        _removeAttribute(name, currentNode);
        // Prefix the value and later re-create the attribute with the sanitized value
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      /* Work around a security issue with comments inside attributes */
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|title|textarea)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Make sure we cannot easily use animated hrefs, even if animations are allowed */
      if (lcName === 'attributename' && stringMatch(value, 'href')) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Did the hooks approve of the attribute? */
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      /* Did the hooks approve of the attribute? */
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Work around a security issue in jQuery 3.0 */
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Sanitize attribute content to be template-safe */
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
          value = stringReplace(value, expr, ' ');
        });
      }
      /* Is `value` valid for this attribute? */
      const lcTag = transformCaseFunc(currentNode.nodeName);
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Handle attributes that require Trusted Types */
      if (trustedTypesPolicy && typeof trustedTypes === 'object' && typeof trustedTypes.getAttributeType === 'function') {
        if (namespaceURI) ; else {
          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
            case 'TrustedHTML':
              {
                value = trustedTypesPolicy.createHTML(value);
                break;
              }
            case 'TrustedScriptURL':
              {
                value = trustedTypesPolicy.createScriptURL(value);
                break;
              }
          }
        }
      }
      /* Handle invalid data-* attribute set by try-catching it */
      if (value !== initValue) {
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
            currentNode.setAttribute(name, value);
          }
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
          } else {
            arrayPop(DOMPurify.removed);
          }
        } catch (_) {
          _removeAttribute(name, currentNode);
        }
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  /**
   * _sanitizeShadowDOM
   *
   * @param fragment to iterate over recursively
   */
  const _sanitizeShadowDOM = function _sanitizeShadowDOM(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      /* Execute a hook if present */
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      /* Sanitize tags and elements */
      _sanitizeElements(shadowNode);
      /* Check attributes next */
      _sanitizeAttributes(shadowNode);
      /* Deep shadow DOM detected */
      if (shadowNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(shadowNode.content);
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  // eslint-disable-next-line complexity
  DOMPurify.sanitize = function (dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    /* Make sure we have a string to sanitize.
      DO NOT return early, as this will return the wrong type if
      the user has requested a DOM object rather than a string */
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = '<!-->';
    }
    /* Stringify, in case dirty is an object */
    if (typeof dirty !== 'string' && !_isNode(dirty)) {
      if (typeof dirty.toString === 'function') {
        dirty = dirty.toString();
        if (typeof dirty !== 'string') {
          throw typeErrorCreate('dirty is not a string, aborting');
        }
      } else {
        throw typeErrorCreate('toString is not a function');
      }
    }
    /* Return dirty HTML if DOMPurify cannot run */
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    /* Assign config vars */
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }
    /* Clean up removed elements */
    DOMPurify.removed = [];
    /* Check if dirty is correctly typed for IN_PLACE */
    if (typeof dirty === 'string') {
      IN_PLACE = false;
    }
    if (IN_PLACE) {
      /* Do some early pre-sanitization to avoid unsafe root nodes */
      if (dirty.nodeName) {
        const tagName = transformCaseFunc(dirty.nodeName);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate('root node is forbidden and cannot be sanitized in-place');
        }
      }
    } else if (dirty instanceof Node) {
      /* If dirty is a DOM element, append to an empty document to avoid
         elements being stripped by the parser */
      body = _initDocument('<!---->');
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === 'BODY') {
        /* Node is already a body, use as is */
        body = importedNode;
      } else if (importedNode.nodeName === 'HTML') {
        body = importedNode;
      } else {
        // eslint-disable-next-line unicorn/prefer-dom-node-append
        body.appendChild(importedNode);
      }
    } else {
      /* Exit directly if we have nothing to do */
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT &&
      // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf('<') === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }
      /* Initialize the document to work on */
      body = _initDocument(dirty);
      /* Check we have a DOM node from the data */
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : '';
      }
    }
    /* Remove first element node (ours) if FORCE_BODY is set */
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    /* Get node iterator */
    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
    /* Now start iterating over the created document */
    while (currentNode = nodeIterator.nextNode()) {
      /* Sanitize tags and elements */
      _sanitizeElements(currentNode);
      /* Check attributes next */
      _sanitizeAttributes(currentNode);
      /* Shadow DOM detected, sanitize it */
      if (currentNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(currentNode.content);
      }
    }
    /* If we sanitized `dirty` in-place, return it. */
    if (IN_PLACE) {
      return dirty;
    }
    /* Return sanitized string or DOM */
    if (RETURN_DOM) {
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          // eslint-disable-next-line unicorn/prefer-dom-node-append
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        /*
          AdoptNode() is not used because internal state is not reset
          (e.g. the past names map of a HTMLFormElement), this is safe
          in theory but we would rather not risk another attack vector.
          The state that is cloned by importNode() is explicitly defined
          by the specs.
        */
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    /* Serialize doctype if allowed */
    if (WHOLE_DOCUMENT && ALLOWED_TAGS['!doctype'] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = '<!DOCTYPE ' + body.ownerDocument.doctype.name + '>\n' + serializedHTML;
    }
    /* Sanitize final string template-safe */
    if (SAFE_FOR_TEMPLATES) {
      arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
        serializedHTML = stringReplace(serializedHTML, expr, ' ');
      });
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function () {
    let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
  };
  DOMPurify.clearConfig = function () {
    CONFIG = null;
    SET_CONFIG = false;
  };
  DOMPurify.isValidAttribute = function (tag, attr, value) {
    /* Initialize shared config vars if necessary. */
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function (entryPoint, hookFunction) {
    if (typeof hookFunction !== 'function') {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function (entryPoint, hookFunction) {
    if (hookFunction !== undefined) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? undefined : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function (entryPoint) {
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function () {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function t(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);throw n.search=r.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}function e(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);n.search=r.toString(),console.warn(`Minified Lexical warning #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);}const n="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,r=n&&"documentMode"in document?document.documentMode:null,i=n&&/Mac|iPod|iPhone|iPad/.test(navigator.platform),o=n&&/^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent),s=!(!n||!("InputEvent"in window)||r)&&"getTargetRanges"in new window.InputEvent("input"),l=n&&/Version\/[\d.]+.*Safari/.test(navigator.userAgent),c=n&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,a=n&&/Android/.test(navigator.userAgent),u=n&&/^(?=.*Chrome).*/i.test(navigator.userAgent),f=n&&a&&u,d=n&&/AppleWebKit\/[\d.]+/.test(navigator.userAgent)&&i&&!u;function h$1(...t){const e=[];for(const n of t)if(n&&"string"==typeof n)for(const[t]of n.matchAll(/\S+/g))e.push(t);return e}const g$1=0,_$2=1,p=2,T$3=128,b$4=1,w$4=2,E$4=3,O$2=4,M$5=5,A$3=6,P$3=l||c||d?" ":"​",D$4="\n\n",F$5=o?" ":P$3,L$2="֑-߿יִ-﷽ﹰ-ﻼ",I$3="A-Za-zÀ-ÖØ-öø-ʸ̀-֐ࠀ-῿‎Ⰰ-﬜︀-﹯﻽-￿",K$5=new RegExp("^[^"+I$3+"]*["+L$2+"]"),z$4=new RegExp("^[^"+L$2+"]*["+I$3+"]"),R$5={bold:1,capitalize:1024,code:16,highlight:T$3,italic:2,lowercase:256,strikethrough:4,subscript:32,superscript:64,underline:8,uppercase:512},B$3={directionless:1,unmergeable:2},W$6={center:2,end:6,justify:4,left:1,right:3,start:5},J$5={[w$4]:"center",[A$3]:"end",[O$2]:"justify",[b$4]:"left",[E$4]:"right",[M$5]:"start"},j$3={normal:0,segmented:2,token:1},$$4={[g$1]:"normal",[p]:"segmented",[_$2]:"token"},V$5="$config";function Y$4(t,e,n,r,i,o){let s=t.getFirstChild();for(;null!==s;){const t=s.__key;s.__parent===e&&(Si(s)&&Y$4(s,t,n,r,i,o),n.has(t)||o.delete(t),i.push(t)),s=s.getNextSibling();}}let q$4=false,H$3=0;function G$4(t){H$3=t.timeStamp;}function X$4(t,e,n){const r="BR"===t.nodeName,i=e.__lexicalLineBreak;return i&&(t===i||r&&t.previousSibling===i)||r&&void 0!==So(t,n)}function Q$5(t,e,n){const r=ps(ss(n));let i=null,o=null;null!==r&&r.anchorNode===t&&(i=r.anchorOffset,o=r.focusOffset);const s=t.nodeValue;null!==s&&Fo(e,s,i,o,false);}function Z$4(t,e,n){if(yr(t)){const e=t.anchor.getNode();if(e.is(n)&&t.format!==e.getFormat())return  false}return co(e)&&n.isAttached()}function tt$3(t,e,n,r){for(let i=t;i&&!Fs(i);i=Zo(i)){const t=So(i,e);if(void 0!==t){const e=xo(t,n);if(e)return Ti(e)||!Cs(i)?void 0:[i,e]}else if(i===r)return [r,bo(n)]}}function et$4(t,e,n){q$4=true;const r=performance.now()-H$3>100;try{yi(t,()=>{const i=Lr()||function(t){return t.getEditorState().read(()=>{const t=Lr();return null!==t?t.clone():null})}(t),s=new Map,l=t.getRootElement(),c=t._editorState,a=t._blockCursorElement;let u=!1,f="";for(let n=0;n<e.length;n++){const d=e[n],h=d.type,g=d.target,_=tt$3(g,t,c,l);if(!_)continue;const[p,y]=_;if("characterData"===h)r&&lr(y)&&co(g)&&Z$4(i,g,y)&&Q$5(g,y,t);else if("childList"===h){u=!0;const e=d.addedNodes;for(let n=0;n<e.length;n++){const r=e[n],i=Co(r),s=r.parentNode;if(null!=s&&r!==a&&null===i&&!X$4(r,s,t)){if(o){const t=(Cs(r)?r.innerText:null)||r.nodeValue;t&&(f+=t);}s.removeChild(r);}}const n=d.removedNodes,r=n.length;if(r>0){let e=0;for(let i=0;i<r;i++){const r=n[i];(X$4(r,g,t)||a===r)&&(g.appendChild(r),e++);}r!==e&&s.set(p,y);}}}if(s.size>0)for(const[e,n]of s)n.reconcileObservedMutation(e,t);const d=n.takeRecords();if(d.length>0){for(let e=0;e<d.length;e++){const n=d[e],r=n.addedNodes,i=n.target;for(let e=0;e<r.length;e++){const n=r[e],o=n.parentNode;null==o||"BR"!==n.nodeName||X$4(n,i,t)||o.removeChild(n);}}n.takeRecords();}null!==i&&(u&&wo(i),o&&Ho(t)&&i.insertRawText(f));});}finally{q$4=false;}}function nt$4(t){const e=t._observer;if(null!==e){et$4(t,e.takeRecords(),e);}}function rt$3(t){!function(t){0===H$3&&ss(t).addEventListener("textInput",G$4,true);}(t),t._observer=new MutationObserver((e,n)=>{et$4(t,e,n);});}let it$3 = class it{key;parse;unparse;isEqual;defaultValue;constructor(t,e){this.key=t,this.parse=e.parse.bind(e),this.unparse=(e.unparse||gt$3).bind(e),this.isEqual=(e.isEqual||Object.is).bind(e),this.defaultValue=this.parse(void 0);}};function ot$4(t,e){return new it$3(t,e)}function st$4(t,e,n="latest"){const r=("latest"===n?t.getLatest():t).__state;return r?r.getValue(e):e.defaultValue}function ct$4(t,e,n){let r;if(ei(),"function"==typeof n){const i=t.getLatest(),o=st$4(i,e);if(r=n(o),e.isEqual(o,r))return i}else r=n;const i=t.getWritable();return ft$2(i).updateFromKnown(e,r),i}function at$2(t){const e=new Map,n=new Set;for(let r="function"==typeof t?t:t.replace;r.prototype&&void 0!==r.prototype.getType;r=Object.getPrototypeOf(r)){const{ownNodeConfig:t}=Is(r);if(t&&t.stateConfigs)for(const r of t.stateConfigs){let t;"stateConfig"in r?(t=r.stateConfig,r.flat&&n.add(t.key)):t=r,e.set(t.key,t);}}return {flatKeys:n,sharedConfigMap:e}}let ut$3 = class ut{node;knownState;unknownState;sharedNodeState;size;constructor(t,e,n=void 0,r=new Map,i=void 0){this.node=t,this.sharedNodeState=e,this.unknownState=n,this.knownState=r;const{sharedConfigMap:o}=this.sharedNodeState,s=void 0!==i?i:function(t,e,n){let r=n.size;if(e)for(const i in e){const e=t.get(i);e&&n.has(e)||r++;}return r}(o,n,r);this.size=s;}getValue(t){const e=this.knownState.get(t);if(void 0!==e)return e;this.sharedNodeState.sharedConfigMap.set(t.key,t);let n=t.defaultValue;if(this.unknownState&&t.key in this.unknownState){const e=this.unknownState[t.key];void 0!==e&&(n=t.parse(e)),this.updateFromKnown(t,n);}return n}getInternalState(){return [this.unknownState,this.knownState]}toJSON(){const t={...this.unknownState},e={};for(const[e,n]of this.knownState)e.isEqual(n,e.defaultValue)?delete t[e.key]:t[e.key]=e.unparse(n);for(const n of this.sharedNodeState.flatKeys)n in t&&(e[n]=t[n],delete t[n]);return ht$4(t)&&(e.$=t),e}getWritable(t){if(this.node===t)return this;const{sharedNodeState:e,unknownState:n}=this,r=new Map(this.knownState);return new ut(t,e,function(t,e,n){let r;if(n)for(const[i,o]of Object.entries(n)){const n=t.get(i);n?e.has(n)||e.set(n,n.parse(o)):(r=r||{},r[i]=o);}return r}(e.sharedConfigMap,r,n),r,this.size)}updateFromKnown(t,e){const n=t.key;this.sharedNodeState.sharedConfigMap.set(n,t);const{knownState:r,unknownState:i}=this;r.has(t)||i&&n in i||(i&&(delete i[n],this.unknownState=ht$4(i)),this.size++),r.set(t,e);}updateFromUnknown(t,e){const n=this.sharedNodeState.sharedConfigMap.get(t);n?this.updateFromKnown(n,n.parse(e)):(this.unknownState=this.unknownState||{},t in this.unknownState||this.size++,this.unknownState[t]=e);}updateFromJSON(t){const{knownState:e}=this;for(const t of e.keys())e.set(t,t.defaultValue);if(this.size=e.size,this.unknownState=void 0,t)for(const[e,n]of Object.entries(t))this.updateFromUnknown(e,n);}};function ft$2(t){const e=t.getWritable(),n=e.__state?e.__state.getWritable(e):new ut$3(e,dt$3(e));return e.__state=n,n}function dt$3(t){return t.__state?t.__state.sharedNodeState:Gi(bs(),t.getType()).sharedNodeState}function ht$4(t){if(t)for(const e in t)return t}function gt$3(t){return t}function _t$3(t,e,n){for(const[r,i]of e.knownState){if(t.has(r.key))continue;t.add(r.key);const e=n?n.getValue(r):r.defaultValue;if(e!==i&&!r.isEqual(e,i))return  true}return  false}function pt$3(t,e,n){const{unknownState:r}=e,i=n?n.unknownState:void 0;if(r)for(const[e,n]of Object.entries(r)){if(t.has(e))continue;t.add(e);if(n!==(i?i[e]:void 0))return  true}return  false}function yt$3(t,e){const n=t.__state;return n&&n.node===t?n.getWritable(e):n}function mt$1(t,e){const n=t.__mode,r=t.__format,i=t.__style,o=e.__mode,s=e.__format,l=e.__style,c=t.__state,a=e.__state;return (null===n||n===o)&&(null===r||r===s)&&(null===i||i===l)&&(null===t.__state||c===a||function(t,e){if(t===e)return  true;if(t&&e&&t.size!==e.size)return  false;const n=new Set;return !(t&&_t$3(n,t,e)||e&&_t$3(n,e,t)||t&&pt$3(n,t,e)||e&&pt$3(n,e,t))}(c,a))}function xt$5(t,e){const n=t.mergeWithSibling(e),r=ii()._normalizedNodes;return r.add(t.__key),r.add(e.__key),n}function Ct$4(t){let e,n,r=t;if(""!==r.__text||!r.isSimpleText()||r.isUnmergeable()){for(;null!==(e=r.getPreviousSibling())&&lr(e)&&e.isSimpleText()&&!e.isUnmergeable();){if(""!==e.__text){if(mt$1(e,r)){r=xt$5(e,r);break}break}e.remove();}for(;null!==(n=r.getNextSibling())&&lr(n)&&n.isSimpleText()&&!n.isUnmergeable();){if(""!==n.__text){if(mt$1(r,n)){r=xt$5(r,n);break}break}n.remove();}}else r.remove();}function St$5(t){return vt$3(t.anchor),vt$3(t.focus),t}function vt$3(t){for(;"element"===t.type;){const e=t.getNode(),n=t.offset;let r,i;if(n===e.getChildrenSize()?(r=e.getChildAtIndex(n-1),i=true):(r=e.getChildAtIndex(n),i=false),lr(r)){t.set(r.__key,i?r.getTextContentSize():0,"text",true);break}if(!Si(r))break;t.set(r.__key,i?r.getChildrenSize():0,"element",true);}}let kt$5,Tt$4,Nt$4,bt$5,wt$5,Et$4,Ot$3,Mt$3,At$4,Pt$4,Dt$3="",Ft$2=null,Lt$4="",It$3="",Kt$2=false,zt$2=false;function Rt$2(t,e){const n=Ot$3.get(t);if(null!==e){const n=ne$1(t);n.parentNode===e&&e.removeChild(n);}if(Mt$3.has(t)||Tt$4._keyToDOMMap.delete(t),Si(n)){const t=Xt(n,Ot$3);Bt$2(t,0,t.length-1,null);} void 0!==n&&Uo(Pt$4,Nt$4,bt$5,n,"destroyed");}function Bt$2(t,e,n,r){let i=e;for(;i<=n;++i){const e=t[i];void 0!==e&&Rt$2(e,r);}}function Wt$1(t,e){t.setProperty("text-align",e);}const Jt$1="40px";function jt$3(t,e){const n=kt$5.theme.indent;if("string"==typeof n){const r=t.classList.contains(n);e>0&&!r?t.classList.add(n):e<1&&r&&t.classList.remove(n);}const r=getComputedStyle(t).getPropertyValue("--lexical-indent-base-value")||Jt$1;t.style.setProperty("padding-inline-start",0===e?"":`calc(${e} * ${r})`);}function $t$1(t,e){const n=t.style;0===e?Wt$1(n,""):1===e?Wt$1(n,"left"):2===e?Wt$1(n,"center"):3===e?Wt$1(n,"right"):4===e?Wt$1(n,"justify"):5===e?Wt$1(n,"start"):6===e&&Wt$1(n,"end");}function Ut$2(t,e){const n=function(t){const e=t.__dir;if(null!==e)return e;if(bi(t))return null;const n=t.getParentOrThrow();return bi(n)&&null===n.__dir?"auto":null}(e);null!==n?t.dir=n:t.removeAttribute("dir");}function Vt(e,n){const r=Mt$3.get(e);void 0===r&&t(60);const i=r.createDOM(kt$5,Tt$4);if(function(t,e,n){const r=n._keyToDOMMap;((function(t,e,n){const r=`__lexicalKey_${e._key}`;t[r]=n;}))(e,n,t),r.set(t,e);}(e,i,Tt$4),lr(r)?i.setAttribute("data-lexical-text","true"):Ti(r)&&i.setAttribute("data-lexical-decorator","true"),Si(r)){const t=r.__indent,e=r.__size;if(Ut$2(i,r),0!==t&&jt$3(i,t),0!==e){const t=e-1;Yt(Xt(r,Mt$3),r,0,t,r.getDOMSlot(i));}const n=r.__format;0!==n&&$t$1(i,n),r.isInline()||Ht$1(null,r,i),Xo(r)&&(Dt$3+=D$4,It$3+=D$4);}else {const t=r.getTextContent();if(Ti(r)){const t=r.decorate(Tt$4,kt$5);null!==t&&Zt(e,t),i.contentEditable="false";}Dt$3+=t,It$3+=t;}return null!==n&&n.insertChild(i),Uo(Pt$4,Nt$4,bt$5,r,"created"),i}function Yt(t,e,n,r,i){const o=Dt$3;Dt$3="";let s=n;for(;s<=r;++s){Vt(t[s],i);const e=Mt$3.get(t[s]);null!==e&&lr(e)&&(null===Ft$2&&(Ft$2=e.getFormat()),""===Lt$4&&(Lt$4=e.getStyle()));}Xo(e)&&(Dt$3+=D$4);i.element.__lexicalTextContent=Dt$3,Dt$3=o+Dt$3;}function qt(t,e){if(t){const n=t.__last;if(n){const t=e.get(n);if(t)return jn(t)?"line-break":Ti(t)&&t.isInline()?"decorator":null}return "empty"}return null}function Ht$1(t,e,n){const r=qt(t,Ot$3),i=qt(e,Mt$3);r!==i&&e.getDOMSlot(n).setManagedLineBreak(i);}function Gt$1(e,n,r){var i;Ft$2=null,Lt$4="",function(e,n,r){const i=Dt$3,o=e.__size,s=n.__size;Dt$3="";const l=r.element;if(1===o&&1===s){const t=e.__first,r=n.__first;if(t===r)Qt(t,l);else {const e=ne$1(t),n=Vt(r,null);try{l.replaceChild(n,e);}catch(i){if("object"==typeof i&&null!=i){const o=`${i.toString()} Parent: ${l.tagName}, new child: {tag: ${n.tagName} key: ${r}}, old child: {tag: ${e.tagName}, key: ${t}}.`;throw new Error(o)}throw i}Rt$2(t,null);}const i=Mt$3.get(r);lr(i)&&(null===Ft$2&&(Ft$2=i.getFormat()),""===Lt$4&&(Lt$4=i.getStyle()));}else {const i=Xt(e,Ot$3),c=Xt(n,Mt$3);if(i.length!==o&&t(227),c.length!==s&&t(228),0===o)0!==s&&Yt(c,n,0,s-1,r);else if(0===s){if(0!==o){const t=null==r.after&&null==r.before&&null==r.element.__lexicalLineBreak;Bt$2(i,0,o-1,t?null:l),t&&(l.textContent="");}}else !function(t,e,n,r,i,o){const s=r-1,l=i-1;let c,a,u=o.getFirstChild(),f=0,d=0;for(;f<=s&&d<=l;){const t=e[f],r=n[d];if(t===r)u=te$1(Qt(r,o.element)),f++,d++;else { void 0===c&&(c=new Set(e)),void 0===a&&(a=new Set(n));const i=a.has(t),s=c.has(r);if(i)if(s){const t=Qo(Tt$4,r);t===u?u=te$1(Qt(r,o.element)):(o.withBefore(u).insertChild(t),Qt(r,o.element)),f++,d++;}else Vt(r,o.withBefore(u)),d++;else u=te$1(ne$1(t)),Rt$2(t,o.element),f++;}const i=Mt$3.get(r);null!==i&&lr(i)&&(null===Ft$2&&(Ft$2=i.getFormat()),""===Lt$4&&(Lt$4=i.getStyle()));}const h=f>s,g=d>l;if(h&&!g){const e=n[l+1],r=void 0===e?null:Tt$4.getElementByKey(e);Yt(n,t,d,l,o.withBefore(r));}else g&&!h&&Bt$2(e,f,s,o.element);}(n,i,c,o,s,r);}Xo(n)&&(Dt$3+=D$4);l.__lexicalTextContent=Dt$3,Dt$3=i+Dt$3;}(e,n,n.getDOMSlot(r)),i=n,null==Ft$2||Ft$2===i.__textFormat||zt$2||i.setTextFormat(Ft$2),function(t){""===Lt$4||Lt$4===t.__textStyle||zt$2||t.setTextStyle(Lt$4);}(n);}function Xt(e,n){const r=[];let i=e.__first;for(;null!==i;){const e=n.get(i);void 0===e&&t(101),r.push(i),i=e.__next;}return r}function Qt(e,n){const r=Ot$3.get(e);let i=Mt$3.get(e);void 0!==r&&void 0!==i||t(61);const o=Kt$2||Et$4.has(e)||wt$5.has(e),s=Qo(Tt$4,e);if(r===i&&!o){if(Si(r)){const t=s.__lexicalTextContent;void 0!==t&&(Dt$3+=t,It$3+=t);}else {const t=r.getTextContent();It$3+=t,Dt$3+=t;}return s}if(r!==i&&o&&Uo(Pt$4,Nt$4,bt$5,i,"updated"),i.updateDOM(r,s,kt$5)){const r=Vt(e,null);return null===n&&t(62),n.replaceChild(r,s),Rt$2(e,null),r}if(Si(r)&&Si(i)){const t=i.__indent;(Kt$2||t!==r.__indent)&&jt$3(s,t);const e=i.__format;if((Kt$2||e!==r.__format)&&$t$1(s,e),o&&(Gt$1(r,i,s),bi(i)||i.isInline()||Ht$1(r,i,s)),Xo(i)&&(Dt$3+=D$4,It$3+=D$4),(Kt$2||i.__dir!==r.__dir)&&(Ut$2(s,i),bi(i)&&!Kt$2))for(const t of i.getChildren())if(Si(t)){Ut$2(Qo(Tt$4,t.getKey()),t);}}else {const t=i.getTextContent();if(Ti(i)){const t=i.decorate(Tt$4,kt$5);null!==t&&Zt(e,t);}Dt$3+=t,It$3+=t;}if(!zt$2&&bi(i)&&i.__cachedText!==It$3){const t=i.getWritable();t.__cachedText=It$3,i=t;}return s}function Zt(t,e){let n=Tt$4._pendingDecorators;const r=Tt$4._decorators;if(null===n){if(r[t]===e)return;n=ko(Tt$4);}n[t]=e;}function te$1(t){let e=t.nextSibling;return null!==e&&e===Tt$4._blockCursorElement&&(e=e.nextSibling),e}function ee$1(t,e,n,r,i,o){Dt$3="",It$3="",Kt$2=2===r,Tt$4=n,kt$5=n._config,Nt$4=n._nodes,bt$5=Tt$4._listeners.mutation,wt$5=i,Et$4=o,Ot$3=t._nodeMap,Mt$3=e._nodeMap,zt$2=e._readOnly,At$4=new Map(n._keyToDOMMap);const s=new Map;return Pt$4=s,Qt("root",null),Tt$4=void 0,Nt$4=void 0,wt$5=void 0,Et$4=void 0,Ot$3=void 0,Mt$3=void 0,kt$5=void 0,At$4=void 0,Pt$4=void 0,s}function ne$1(e){const n=At$4.get(e);return void 0===n&&t(75,e),n}function re$1(t){return {type:t}}const ie$1=re$1("SELECTION_CHANGE_COMMAND"),oe$2=re$1("SELECTION_INSERT_CLIPBOARD_NODES_COMMAND"),se$1=re$1("CLICK_COMMAND"),le$2=re$1("DELETE_CHARACTER_COMMAND"),ce$1=re$1("INSERT_LINE_BREAK_COMMAND"),ae$1=re$1("INSERT_PARAGRAPH_COMMAND"),ue$1=re$1("CONTROLLED_TEXT_INSERTION_COMMAND"),fe$1=re$1("PASTE_COMMAND"),de$1=re$1("REMOVE_TEXT_COMMAND"),he$1=re$1("DELETE_WORD_COMMAND"),ge$1=re$1("DELETE_LINE_COMMAND"),_e$1=re$1("FORMAT_TEXT_COMMAND"),pe$1=re$1("UNDO_COMMAND"),ye$1=re$1("REDO_COMMAND"),me$1=re$1("KEYDOWN_COMMAND"),xe=re$1("KEY_ARROW_RIGHT_COMMAND"),Ce$1=re$1("MOVE_TO_END"),Se$1=re$1("KEY_ARROW_LEFT_COMMAND"),ve$1=re$1("MOVE_TO_START"),ke$1=re$1("KEY_ARROW_UP_COMMAND"),Te$1=re$1("KEY_ARROW_DOWN_COMMAND"),Ne$1=re$1("KEY_ENTER_COMMAND"),be$1=re$1("KEY_SPACE_COMMAND"),we$1=re$1("KEY_BACKSPACE_COMMAND"),Ee$1=re$1("KEY_ESCAPE_COMMAND"),Oe$1=re$1("KEY_DELETE_COMMAND"),Me$1=re$1("KEY_TAB_COMMAND"),Ae$1=re$1("INSERT_TAB_COMMAND"),Pe$1=re$1("INDENT_CONTENT_COMMAND"),De$1=re$1("OUTDENT_CONTENT_COMMAND"),Fe$1=re$1("DROP_COMMAND"),Le$1=re$1("FORMAT_ELEMENT_COMMAND"),Ie$1=re$1("DRAGSTART_COMMAND"),Ke$1=re$1("DRAGOVER_COMMAND"),ze$1=re$1("DRAGEND_COMMAND"),Re$1=re$1("COPY_COMMAND"),Be$1=re$1("CUT_COMMAND"),We$1=re$1("SELECT_ALL_COMMAND"),Je$1=re$1("CLEAR_EDITOR_COMMAND"),je$1=re$1("CLEAR_HISTORY_COMMAND"),$e$1=re$1("CAN_REDO_COMMAND"),Ue$1=re$1("CAN_UNDO_COMMAND"),Ve$1=re$1("FOCUS_COMMAND"),Ye=re$1("BLUR_COMMAND"),qe$1=re$1("KEY_MODIFIER_COMMAND"),He$1=Object.freeze({}),Ge$1=[["keydown",function(t,e){if(Xe$1=t.timeStamp,Qe$1=t.key,e.isComposing())return;if(Go(e,me$1,t))return;if(null==t.key)return;if(cn&&Wo(t))return yi(e,()=>{mn(e,an);}),cn=false,void(an="");if(function(t){return zo(t,"ArrowRight",{shiftKey:"any"})}(t))Go(e,xe,t);else if(function(t){return zo(t,"ArrowRight",Ro)}(t))Go(e,Ce$1,t);else if(function(t){return zo(t,"ArrowLeft",{shiftKey:"any"})}(t))Go(e,Se$1,t);else if(function(t){return zo(t,"ArrowLeft",Ro)}(t))Go(e,ve$1,t);else if(function(t){return zo(t,"ArrowUp",{altKey:"any",shiftKey:"any"})}(t))Go(e,ke$1,t);else if(function(t){return zo(t,"ArrowDown",{altKey:"any",shiftKey:"any"})}(t))Go(e,Te$1,t);else if(function(t){return zo(t,"Enter",{altKey:"any",ctrlKey:"any",metaKey:"any",shiftKey:true})}(t))sn=true,Go(e,Ne$1,t);else if(function(t){return " "===t.key}(t))Go(e,be$1,t);else if(function(t){return i&&zo(t,"o",{ctrlKey:true})}(t))t.preventDefault(),sn=true,Go(e,ce$1,true);else if(function(t){return zo(t,"Enter",{altKey:"any",ctrlKey:"any",metaKey:"any"})}(t))sn=false,Go(e,Ne$1,t);else if(function(t){return zo(t,"Backspace",{shiftKey:"any"})||i&&zo(t,"h",{ctrlKey:true})}(t))Wo(t)?Go(e,we$1,t):(t.preventDefault(),Go(e,le$2,true));else if(function(t){return "Escape"===t.key}(t))Go(e,Ee$1,t);else if(function(t){return zo(t,"Delete",{})||i&&zo(t,"d",{ctrlKey:true})}(t))!function(t){return "Delete"===t.key}(t)?(t.preventDefault(),Go(e,le$2,false)):Go(e,Oe$1,t);else if(function(t){return zo(t,"Backspace",Bo)}(t))t.preventDefault(),Go(e,he$1,true);else if(function(t){return zo(t,"Delete",Bo)}(t))t.preventDefault(),Go(e,he$1,false);else if(function(t){return i&&zo(t,"Backspace",{metaKey:true})}(t))t.preventDefault(),Go(e,ge$1,true);else if(function(t){return i&&(zo(t,"Delete",{metaKey:true})||zo(t,"k",{ctrlKey:true}))}(t))t.preventDefault(),Go(e,ge$1,false);else if(function(t){return zo(t,"b",Ro)}(t))t.preventDefault(),Go(e,_e$1,"bold");else if(function(t){return zo(t,"u",Ro)}(t))t.preventDefault(),Go(e,_e$1,"underline");else if(function(t){return zo(t,"i",Ro)}(t))t.preventDefault(),Go(e,_e$1,"italic");else if(function(t){return zo(t,"Tab",{shiftKey:"any"})}(t))Go(e,Me$1,t);else if(function(t){return zo(t,"z",Ro)}(t))t.preventDefault(),Go(e,pe$1,void 0);else if(function(t){if(i)return zo(t,"z",{metaKey:true,shiftKey:true});return zo(t,"y",{ctrlKey:true})||zo(t,"z",{ctrlKey:true,shiftKey:true})}(t))t.preventDefault(),Go(e,ye$1,void 0);else {const n=e._editorState._selection;null===n||yr(n)?Jo(t)&&(t.preventDefault(),Go(e,We$1,t)):!function(t){return zo(t,"c",Ro)}(t)?!function(t){return zo(t,"x",Ro)}(t)?Jo(t)&&(t.preventDefault(),Go(e,We$1,t)):(t.preventDefault(),Go(e,Be$1,t)):(t.preventDefault(),Go(e,Re$1,t));}(function(t){return t.ctrlKey||t.shiftKey||t.altKey||t.metaKey})(t)&&Go(e,qe$1,t);}],["pointerdown",function(t,e){const n=t.target,r=t.pointerType;Ss(n)&&"touch"!==r&&"pen"!==r&&0===t.button&&yi(e,()=>{Zi(n)||(on=true);});}],["compositionstart",function(t,e){yi(e,()=>{const n=Lr();if(yr(n)&&!e.isComposing()){const r=n.anchor,i=n.anchor.getNode();yo(r.key),(t.timeStamp<Xe$1+30||"element"===r.type||!n.isCollapsed()||i.getFormat()!==n.format||lr(i)&&i.getStyle()!==n.style)&&Go(e,ue$1,F$5);}});}],["compositionend",function(t,e){o?ln=true:c||!l&&!d?yi(e,()=>{mn(e,t.data);}):(cn=true,an=t.data);}],["input",function(t,e){t.stopPropagation(),yi(e,()=>{if(Cs(t.target)&&Zi(t.target))return;const n=Lr(),r=t.data,i=yn(t);if(null!=r&&yr(n)&&dn(n,i,r,t.timeStamp,false)){ln&&(mn(e,r),ln=false);const i=n.anchor.getNode(),a=ps(ss(e));if(null===a)return;const u=n.isBackward(),f=u?n.anchor.offset:n.focus.offset,h=u?n.focus.offset:n.anchor.offset;s&&!n.isCollapsed()&&lr(i)&&null!==a.anchorNode&&i.getTextContent().slice(0,f)+r+i.getTextContent().slice(f+h)===Po(a.anchorNode)||Go(e,ue$1,r);const g=r.length;o&&g>1&&"insertCompositionText"===t.inputType&&!e.isComposing()&&(n.anchor.offset-=g),l||c||d||!e.isComposing()||(Xe$1=0,yo(null));}else {Do(false,e,null!==r?r:void 0),ln&&(mn(e,r||void 0),ln=false);}!function(){ei();const t=ii();nt$4(t);}();},{event:t}),tn=null;}],["click",function(t,e){yi(e,()=>{const n=Lr(),r=ps(ss(e)),i=Ir();if(r)if(yr(n)){const e=n.anchor,o=e.getNode();if("element"===e.type&&0===e.offset&&n.isCollapsed()&&!bi(o)&&1===No().getChildrenSize()&&o.getTopLevelElementOrThrow().isEmpty()&&null!==i&&n.is(i))r.removeAllRanges(),n.dirty=true;else if(3===t.detail&&!n.isCollapsed()){if(o!==n.focus.getNode()){const t=zs(o,t=>Si(t)&&!t.isInline());Si(t)&&t.select(0);}}}else if("touch"===t.pointerType||"pen"===t.pointerType){const n=r.anchorNode;if(Cs(n)||co(n)){wo(Fr(i,r,e,t));}}Go(e,se$1,t);});}],["cut",He$1],["copy",He$1],["dragstart",He$1],["dragover",He$1],["dragend",He$1],["paste",He$1],["focus",He$1],["blur",He$1],["drop",He$1]];s&&Ge$1.push(["beforeinput",(e,n)=>function(e,n){const r=e.inputType,i=yn(e);if("deleteCompositionText"===r||o&&Ho(n))return;if("insertCompositionText"===r)return;yi(n,()=>{const o=Lr();if("deleteContentBackward"===r){if(null===o){const t=Ir();if(!yr(t))return;wo(t.clone());}if(yr(o)){const r=o.anchor.key===o.focus.key;if(s=e.timeStamp,"MediaLast"===Qe$1&&s<Xe$1+30&&n.isComposing()&&r){if(yo(null),Xe$1=0,setTimeout(()=>{yi(n,()=>{yo(null);});},30),yr(o)){const e=o.anchor.getNode();e.markDirty(),lr(e)||t(142),pn(o,e);}}else {yo(null),e.preventDefault();const t=o.anchor.getNode(),i=t.getTextContent(),s=t.canInsertTextAfter(),l=0===o.anchor.offset&&o.focus.offset===i.length;let c=f&&r&&!l&&s;if(c&&o.isCollapsed()&&(c=!Ti(qo(o.anchor,true))),!c){Go(n,le$2,true);const t=Lr();f&&yr(t)&&t.isCollapsed()&&(un=t,setTimeout(()=>un=null));}}return}}var s;if(!yr(o))return;const l=e.data;null!==tn&&Do(false,n,tn),o.dirty&&null===tn||!o.isCollapsed()||bi(o.anchor.getNode())||null===i||o.applyDOMRange(i),tn=null;const a=o.anchor,u=o.focus,d=a.getNode(),h=u.getNode();if("insertText"!==r&&"insertTranspose"!==r)switch(e.preventDefault(),r){case "insertFromYank":case "insertFromDrop":case "insertReplacementText":Go(n,ue$1,e);break;case "insertFromComposition":yo(null),Go(n,ue$1,e);break;case "insertLineBreak":yo(null),Go(n,ce$1,false);break;case "insertParagraph":yo(null),sn&&!c?(sn=false,Go(n,ce$1,false)):Go(n,ae$1,void 0);break;case "insertFromPaste":case "insertFromPasteAsQuotation":Go(n,fe$1,e);break;case "deleteByComposition":(function(t,e){return t!==e||Si(t)||Si(e)||!so(t)||!so(e)})(d,h)&&Go(n,de$1,e);break;case "deleteByDrag":case "deleteByCut":Go(n,de$1,e);break;case "deleteContent":Go(n,le$2,false);break;case "deleteWordBackward":Go(n,he$1,true);break;case "deleteWordForward":Go(n,he$1,false);break;case "deleteHardLineBackward":case "deleteSoftLineBackward":Go(n,ge$1,true);break;case "deleteContentForward":case "deleteHardLineForward":case "deleteSoftLineForward":Go(n,ge$1,false);break;case "formatStrikeThrough":Go(n,_e$1,"strikethrough");break;case "formatBold":Go(n,_e$1,"bold");break;case "formatItalic":Go(n,_e$1,"italic");break;case "formatUnderline":Go(n,_e$1,"underline");break;case "historyUndo":Go(n,pe$1,void 0);break;case "historyRedo":Go(n,ye$1,void 0);}else {if("\n"===l)e.preventDefault(),Go(n,ce$1,false);else if(l===D$4)e.preventDefault(),Go(n,ae$1,void 0);else if(null==l&&e.dataTransfer){const t=e.dataTransfer.getData("text/plain");e.preventDefault(),o.insertRawText(t);}else null!=l&&dn(o,i,l,e.timeStamp,true)?(e.preventDefault(),Go(n,ue$1,l)):tn=l;Ze$1=e.timeStamp;}});}(e,n)]);let Xe$1=0,Qe$1=null,Ze$1=0,tn=null;const en=new WeakMap,nn=new WeakMap;let rn=false,on=false,sn=false,ln=false,cn=false,an="",un=null,fn=[0,"",0,"root",0];function dn(t,e,n,r,i){const o=t.anchor,l=t.focus,c=o.getNode(),a=ii(),u=ps(ss(a)),f=null!==u?u.anchorNode:null,d=o.key,h=a.getElementByKey(d),g=n.length;return d!==l.key||!lr(c)||(!i&&(!s||Ze$1<r+50)||c.isDirty()&&g<2||Oo(n))&&o.offset!==l.offset&&!c.isComposing()||lo(c)||c.isDirty()&&g>1||(i||!s)&&null!==h&&!c.isComposing()&&f!==uo(h)||null!==u&&null!==e&&(!e.collapsed||e.startContainer!==u.anchorNode||e.startOffset!==u.anchorOffset)||c.getFormat()!==t.format||c.getStyle()!==t.style||function(t,e){if(e.isSegmented())return  true;if(!t.isCollapsed())return  false;const n=t.anchor.offset,r=e.getParentOrThrow(),i=so(e);return 0===n?!e.canInsertTextBefore()||!r.canInsertTextBefore()&&!e.isComposing()||i||function(t){const e=t.getPreviousSibling();return (lr(e)||Si(e)&&e.isInline())&&!e.canInsertTextAfter()}(e):n===e.getTextContentSize()&&(!e.canInsertTextAfter()||!r.canInsertTextAfter()&&!e.isComposing()||i)}(t,c)}function hn(t,e){return co(t)&&null!==t.nodeValue&&0!==e&&e!==t.nodeValue.length}function gn(e,n,r){const{anchorNode:i,anchorOffset:o,focusNode:s,focusOffset:l}=e;rn&&(rn=false,hn(i,o)&&hn(s,l)&&!un)||yi(n,()=>{if(!r)return void wo(null);if(!eo(n,i,s))return;let c=Lr();if(un&&yr(c)&&c.isCollapsed()){const t=c.anchor,e=un.anchor;(t.key===e.key&&t.offset===e.offset+1||1===t.offset&&e.getNode().is(t.getNode().getPreviousSibling()))&&(c=un.clone(),wo(c));}if(un=null,yr(c)){const r=c.anchor,i=r.getNode();if(c.isCollapsed()){"Range"===e.type&&e.anchorNode===e.focusNode&&(c.dirty=true);const o=ss(n).event,s=o?o.timeStamp:performance.now(),[l,a,u,f,d]=fn,h=No(),g=false===n.isComposing()&&""===h.getTextContent();if(s<d+200&&r.offset===u&&r.key===f)_n(c,l,a);else if("text"===r.type)lr(i)||t(141),pn(c,i);else if("element"===r.type&&!g){Si(i)||t(259);const e=r.getNode();e.isEmpty()?function(t,e){const n=e.getTextFormat(),r=e.getTextStyle();_n(t,n,r);}(c,e):_n(c,0,"");}}else {const t=r.key,e=c.focus.key,n=c.getNodes(),i=n.length,s=c.isBackward(),a=s?l:o,u=s?o:l,f=s?e:t,d=s?t:e;let h=2047,g=false;for(let t=0;t<i;t++){const e=n[t],r=e.getTextContentSize();if(lr(e)&&0!==r&&!(0===t&&e.__key===f&&a===r||t===i-1&&e.__key===d&&0===u)&&(g=true,h&=e.getFormat(),0===h))break}c.format=g?h:0;}}Go(n,ie$1,void 0);});}function _n(t,e,n){t.format===e&&t.style===n||(t.format=e,t.style=n,t.dirty=true);}function pn(t,e){_n(t,e.getFormat(),e.getStyle());}function yn(t){if(!t.getTargetRanges)return null;const e=t.getTargetRanges();return 0===e.length?null:e[0]}function mn(t,e){const n=t._compositionKey;if(yo(null),null!==n&&null!=e){if(""===e){const e=xo(n),r=uo(t.getElementByKey(n));return void(null!==r&&null!==r.nodeValue&&lr(e)&&Fo(e,r.nodeValue,null,null,true))}if("\n"===e[e.length-1]){const e=Lr();if(yr(e)){const n=e.focus;return e.anchor.set(n.key,n.offset,n.type),void Go(t,Ne$1,null)}}}Do(true,t,e);}function xn(t){let e=t.__lexicalEventHandles;return void 0===e&&(e=[],t.__lexicalEventHandles=e),e}const Cn=new Map;function Sn(t){const e=ys(t.target);if(null===e)return;const n=ro(e.anchorNode);if(null===n)return;on&&(on=false,yi(n,()=>{const r=Ir(),i=e.anchorNode;if(Cs(i)||co(i)){wo(Fr(r,e,n,t));}}));const r=Mo(n),i=r[r.length-1],o=i._key,s=Cn.get(o),l=s||i;l!==n&&gn(e,l,false),gn(e,n,true),n!==i?Cn.set(o,n):s&&Cn.delete(o);}function vn(t){t._lexicalHandled=true;}function kn(t){return  true===t._lexicalHandled}function Nn(e){const n=en.get(e);if(void 0===n)return void 0;const r=nn.get(n);if(void 0===r)return void 0;const i=r-1;i>=0||t(164),en.delete(e),nn.set(n,i),0===i&&n.removeEventListener("selectionchange",Sn);const o=io(e);no(o)?(!function(t){if(null!==t._parentEditor){const e=Mo(t),n=e[e.length-1]._key;Cn.get(n)===t&&Cn.delete(n);}else Cn.delete(t._key);}(o),e.__lexicalEditor=null):o&&t(198);const s=xn(e);for(let t=0;t<s.length;t++)s[t]();e.__lexicalEventHandles=[];}function bn(t,e,n){ei();const r=t.__key,i=t.getParent();if(null===i)return;const o=function(t){const e=Lr();if(!yr(e)||!Si(t))return e;const{anchor:n,focus:r}=e,i=n.getNode(),o=r.getNode();is(i,t)&&n.set(t.__key,0,"element");is(o,t)&&r.set(t.__key,0,"element");return e}(t);let s=false;if(yr(o)&&e){const e=o.anchor,n=o.focus;e.key===r&&(Rr(e,t,i,t.getPreviousSibling(),t.getNextSibling()),s=true),n.key===r&&(Rr(n,t,i,t.getPreviousSibling(),t.getNextSibling()),s=true);}else xr(o)&&e&&t.isSelected()&&t.selectPrevious();if(yr(o)&&e&&!s){const e=t.getIndexWithinParent();_o(t),Kr(o,i,e,-1);}else _o(t);n||as(i)||i.canBeEmpty()||!i.isEmpty()||bn(i,e),e&&o&&bi(i)&&i.isEmpty()&&i.selectEnd();}function wn(t){return t}const En=Symbol.for("ephemeral");function On(t){return t[En]||false}class Mn{__type;__key;__parent;__prev;__next;__state;static getType(){const{ownNodeType:e}=Is(this);return void 0===e&&t(64,this.name),e}static clone(e){t(65,this.name);}$config(){return {}}config(t,e){const n=e.extends||Object.getPrototypeOf(this.constructor);return Object.assign(e,{extends:n,type:t}),{[t]:e}}afterCloneFrom(t){this.__key===t.__key?(this.__parent=t.__parent,this.__next=t.__next,this.__prev=t.__prev,this.__state=t.__state):t.__state&&(this.__state=t.__state.getWritable(this));}static importDOM;constructor(t){this.__type=this.constructor.getType(),this.__parent=null,this.__prev=null,this.__next=null,Object.defineProperty(this,"__state",{configurable:true,enumerable:false,value:void 0,writable:true}),go(this,t);}getType(){return this.__type}isInline(){t(137,this.constructor.name);}isAttached(){let t=this.__key;for(;null!==t;){if("root"===t)return  true;const e=xo(t);if(null===e)break;t=e.__parent;}return  false}isSelected(t){const e=t||Lr();if(null==e)return  false;const n=e.getNodes().some(t=>t.__key===this.__key);if(lr(this))return n;if(yr(e)&&"element"===e.anchor.type&&"element"===e.focus.type){if(e.isCollapsed())return  false;const t=this.getParent();if(Ti(this)&&this.isInline()&&t){const n=e.isBackward()?e.focus:e.anchor;if(t.is(n.getNode())&&n.offset===t.getChildrenSize()&&this.is(t.getLastChild()))return  false}}return n}getKey(){return this.__key}getIndexWithinParent(){const t=this.getParent();if(null===t)return  -1;let e=t.getFirstChild(),n=0;for(;null!==e;){if(this.is(e))return n;n++,e=e.getNextSibling();}return  -1}getParent(){const t=this.getLatest().__parent;return null===t?null:xo(t)}getParentOrThrow(){const e=this.getParent();return null===e&&t(66,this.__key),e}getTopLevelElement(){let e=this;for(;null!==e;){const n=e.getParent();if(as(n))return Si(e)||e===this&&Ti(e)||t(194),e;e=n;}return null}getTopLevelElementOrThrow(){const e=this.getTopLevelElement();return null===e&&t(67,this.__key),e}getParents(){const t=[];let e=this.getParent();for(;null!==e;)t.push(e),e=e.getParent();return t}getParentKeys(){const t=[];let e=this.getParent();for(;null!==e;)t.push(e.__key),e=e.getParent();return t}getPreviousSibling(){const t=this.getLatest().__prev;return null===t?null:xo(t)}getPreviousSiblings(){const t=[],e=this.getParent();if(null===e)return t;let n=e.getFirstChild();for(;null!==n&&!n.is(this);)t.push(n),n=n.getNextSibling();return t}getNextSibling(){const t=this.getLatest().__next;return null===t?null:xo(t)}getNextSiblings(){const t=[];let e=this.getNextSibling();for(;null!==e;)t.push(e),e=e.getNextSibling();return t}getCommonAncestor(t){const e=Si(this)?this:this.getParent(),n=Si(t)?t:t.getParent(),r=e&&n?ml(e,n):null;return r?r.commonAncestor:null}is(t){return null!=t&&this.__key===t.__key}isBefore(e){const n=ml(this,e);return null!==n&&("descendant"===n.type||("branch"===n.type?-1===_l(n):("same"!==n.type&&"ancestor"!==n.type&&t(279),false)))}isParentOf(t){const e=ml(this,t);return null!==e&&"ancestor"===e.type}getNodesBetween(e){const n=this.isBefore(e),r=[],i=new Set;let o=this;for(;null!==o;){const s=o.__key;if(i.has(s)||(i.add(s),r.push(o)),o===e)break;const l=Si(o)?n?o.getFirstChild():o.getLastChild():null;if(null!==l){o=l;continue}const c=n?o.getNextSibling():o.getPreviousSibling();if(null!==c){o=c;continue}const a=o.getParentOrThrow();if(i.has(a.__key)||r.push(a),a===e)break;let u=null,f=a;do{if(null===f&&t(68),u=n?f.getNextSibling():f.getPreviousSibling(),f=f.getParent(),null===f)break;null!==u||i.has(f.__key)||r.push(f);}while(null===u);o=u;}return n||r.reverse(),r}isDirty(){const t=ii()._dirtyLeaves;return null!==t&&t.has(this.__key)}getLatest(){if(On(this))return this;const e=xo(this.__key);return null===e&&t(113),e}getWritable(){if(On(this))return this;ei();const t=ri(),e=ii(),n=t._nodeMap,r=this.__key,i=this.getLatest(),o=e._cloneNotNeeded,s=Lr();if(null!==s&&s.setCachedNodes(null),o.has(r))return po(i),i;const l=Ms(i);return o.add(r),po(l),n.set(r,l),l}getTextContent(){return ""}getTextContentSize(){return this.getTextContent().length}createDOM(e,n){t(70);}updateDOM(e,n,r){t(71);}exportDOM(t){return {element:this.createDOM(t._config,t)}}exportJSON(){const t=this.__state?this.__state.toJSON():void 0;return {type:this.__type,version:1,...t}}static importJSON(e){t(18,this.name);}updateFromJSON(t){return function(t,e){const n=t.getWritable(),r=e.$;let i=r;for(const t of dt$3(n).flatKeys)t in e&&(void 0!==i&&i!==r||(i={...r}),i[t]=e[t]);return (n.__state||i)&&ft$2(t).updateFromJSON(i),n}(this,t)}static transform(){return null}remove(t){bn(this,true,t);}replace(e,n){ei();let r=Lr();null!==r&&(r=r.clone()),ds(this,e);const i=this.getLatest(),o=this.__key,s=e.__key,l=e.getWritable(),c=this.getParentOrThrow().getWritable(),a=c.__size;_o(l);const u=i.getPreviousSibling(),f=i.getNextSibling(),d=i.__prev,h=i.__next,g=i.__parent;if(bn(i,false,true),null===u)c.__first=s;else {u.getWritable().__next=s;}if(l.__prev=d,null===f)c.__last=s;else {f.getWritable().__prev=s;}if(l.__next=h,l.__parent=g,c.__size=a,n&&(Si(this)&&Si(l)||t(139),this.getChildren().forEach(t=>{l.append(t);})),yr(r)){wo(r);const t=r.anchor,e=r.focus;t.key===o&&_r(t,l),e.key===o&&_r(e,l);}return mo()===o&&yo(s),l}insertAfter(t,e=true){ei(),ds(this,t);const n=this.getWritable(),r=t.getWritable(),i=r.getParent(),o=Lr();let s=false,l=false;if(null!==i){const e=t.getIndexWithinParent();if(_o(r),yr(o)){const t=i.__key,n=o.anchor,r=o.focus;s="element"===n.type&&n.key===t&&n.offset===e+1,l="element"===r.type&&r.key===t&&r.offset===e+1;}}const c=this.getNextSibling(),a=this.getParentOrThrow().getWritable(),u=r.__key,f=n.__next;if(null===c)a.__last=u;else {c.getWritable().__prev=u;}if(a.__size++,n.__next=u,r.__next=f,r.__prev=n.__key,r.__parent=n.__parent,e&&yr(o)){const t=this.getIndexWithinParent();Kr(o,a,t+1);const e=a.__key;s&&o.anchor.set(e,t+2,"element"),l&&o.focus.set(e,t+2,"element");}return t}insertBefore(t,e=true){ei(),ds(this,t);const n=this.getWritable(),r=t.getWritable(),i=r.__key;_o(r);const o=this.getPreviousSibling(),s=this.getParentOrThrow().getWritable(),l=n.__prev,c=this.getIndexWithinParent();if(null===o)s.__first=i;else {o.getWritable().__next=i;}s.__size++,n.__prev=i,r.__prev=l,r.__next=n.__key,r.__parent=n.__parent;const a=Lr();if(e&&yr(a)){Kr(a,this.getParentOrThrow(),c);}return t}isParentRequired(){return  false}createParentElementNode(){return Li()}selectStart(){return this.selectPrevious()}selectEnd(){return this.selectNext(0,0)}selectPrevious(t,e){ei();const n=this.getPreviousSibling(),r=this.getParentOrThrow();if(null===n)return r.select(0,0);if(Si(n))return n.select();if(!lr(n)){const t=n.getIndexWithinParent()+1;return r.select(t,t)}return n.select(t,e)}selectNext(t,e){ei();const n=this.getNextSibling(),r=this.getParentOrThrow();if(null===n)return r.select();if(Si(n))return n.select(0,0);if(!lr(n)){const t=n.getIndexWithinParent();return r.select(t,t)}return n.select(t,e)}markDirty(){this.getWritable();}reconcileObservedMutation(t,e){this.markDirty();}}const An="historic",Pn="history-push",Dn="history-merge",Fn="paste",Ln="collaboration",Kn="skip-scroll-into-view",zn="skip-dom-selection",Rn="skip-selection-focus";class Bn extends Mn{static getType(){return "linebreak"}static clone(t){return new Bn(t.__key)}constructor(t){super(t);}getTextContent(){return "\n"}createDOM(){return document.createElement("br")}updateDOM(){return  false}isInline(){return  true}static importDOM(){return {br:t=>function(t){const e=t.parentElement;if(null!==e&&Ts(e)){const n=e.firstChild;if(n===t||n.nextSibling===t&&$n(n)){const n=e.lastChild;if(n===t||n.previousSibling===t&&$n(n))return  true}}return  false}(t)||function(t){const e=t.parentElement;if(null!==e&&Ts(e)){const n=e.firstChild;if(n===t||n.nextSibling===t&&$n(n))return  false;const r=e.lastChild;if(r===t||r.previousSibling===t&&$n(r))return  true}return  false}(t)?null:{conversion:Wn,priority:0}}}static importJSON(t){return Jn().updateFromJSON(t)}}function Wn(t){return {node:Jn()}}function Jn(){return fs(new Bn)}function jn(t){return t instanceof Bn}function $n(t){return co(t)&&/^( |\t|\r?\n)+$/.test(t.textContent||"")}function Un(t,e){return 16&e?"code":e&T$3?"mark":32&e?"sub":64&e?"sup":null}function Vn(t,e){return 1&e?"strong":2&e?"em":"span"}function Yn(t,e,n,r,i){const o=r.classList;let s=$o(i,"base");void 0!==s&&o.add(...s),s=$o(i,"underlineStrikethrough");let l=false;const c=8&e&&4&e;void 0!==s&&(8&n&&4&n?(l=true,c||o.add(...s)):c&&o.remove(...s));for(const t in R$5){const r=R$5[t];if(s=$o(i,t),void 0!==s)if(n&r){if(l&&("underline"===t||"strikethrough"===t)){e&r&&o.remove(...s);continue}(0===(e&r)||c&&"underline"===t||"strikethrough"===t)&&o.add(...s);}else e&r&&o.remove(...s);}}function qn(t,e,n){const r=e.firstChild,i=n.isComposing(),s=t+(i?P$3:"");if(null==r)e.textContent=s;else {const t=r.nodeValue;if(t!==s)if(i||o){const[e,n,i]=function(t,e){const n=t.length,r=e.length;let i=0,o=0;for(;i<n&&i<r&&t[i]===e[i];)i++;for(;o+i<n&&o+i<r&&t[n-o-1]===e[r-o-1];)o++;return [i,n-i-o,e.slice(i,r-o)]}(t,s);0!==n&&r.deleteData(e,n),r.insertData(e,i);}else r.nodeValue=s;}}function Hn(t,e,n,r,i,o){qn(i,t,e);const s=o.theme.text;void 0!==s&&Yn(0,0,r,t,s);}function Gn(t,e){const n=document.createElement(e);return n.appendChild(t),n}class Xn extends Mn{__text;__format;__style;__mode;__detail;static getType(){return "text"}static clone(t){return new Xn(t.__text,t.__key)}afterCloneFrom(t){super.afterCloneFrom(t),this.__text=t.__text,this.__format=t.__format,this.__style=t.__style,this.__mode=t.__mode,this.__detail=t.__detail;}constructor(t="",e){super(e),this.__text=t,this.__format=0,this.__style="",this.__mode=0,this.__detail=0;}getFormat(){return this.getLatest().__format}getDetail(){return this.getLatest().__detail}getMode(){const t=this.getLatest();return $$4[t.__mode]}getStyle(){return this.getLatest().__style}isToken(){return 1===this.getLatest().__mode}isComposing(){return this.__key===mo()}isSegmented(){return 2===this.getLatest().__mode}isDirectionless(){return !!(1&this.getLatest().__detail)}isUnmergeable(){return !!(2&this.getLatest().__detail)}hasFormat(t){const e=R$5[t];return 0!==(this.getFormat()&e)}isSimpleText(){return "text"===this.__type&&0===this.__mode}getTextContent(){return this.getLatest().__text}getFormatFlags(t,e){return fo(this.getLatest().__format,t,e)}canHaveFormat(){return  true}isInline(){return  true}createDOM(t,e){const n=this.__format,r=Un(0,n),i=Vn(0,n),o=null===r?i:r,s=document.createElement(o);let l=s;this.hasFormat("code")&&s.setAttribute("spellcheck","false"),null!==r&&(l=document.createElement(i),s.appendChild(l));Hn(l,this,0,n,this.__text,t);const c=this.__style;return ""!==c&&(s.style.cssText=c),s}updateDOM(e,n,r){const i=this.__text,o=e.__format,s=this.__format,l=Un(0,o),c=Un(0,s),a=Vn(0,o),u=Vn(0,s);if((null===l?a:l)!==(null===c?u:c))return  true;if(l===c&&a!==u){const e=n.firstChild;null==e&&t(48);const o=document.createElement(u);return Hn(o,this,0,s,i,r),n.replaceChild(o,e),false}let f=n;null!==c&&null!==l&&(f=n.firstChild,null==f&&t(49)),qn(i,f,this);const d=r.theme.text;void 0!==d&&o!==s&&Yn(0,o,s,f,d);const h=e.__style,g=this.__style;return h!==g&&(n.style.cssText=g),false}static importDOM(){return {"#text":()=>({conversion:nr,priority:0}),b:()=>({conversion:Zn,priority:0}),code:()=>({conversion:or,priority:0}),em:()=>({conversion:or,priority:0}),i:()=>({conversion:or,priority:0}),mark:()=>({conversion:or,priority:0}),s:()=>({conversion:or,priority:0}),span:()=>({conversion:Qn,priority:0}),strong:()=>({conversion:or,priority:0}),sub:()=>({conversion:or,priority:0}),sup:()=>({conversion:or,priority:0}),u:()=>({conversion:or,priority:0})}}static importJSON(t){return sr().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setTextContent(t.text).setFormat(t.format).setDetail(t.detail).setMode(t.mode).setStyle(t.style)}exportDOM(e){let{element:n}=super.exportDOM(e);return Cs(n)||t(132),n.style.whiteSpace="pre-wrap",this.hasFormat("lowercase")?n.style.textTransform="lowercase":this.hasFormat("uppercase")?n.style.textTransform="uppercase":this.hasFormat("capitalize")&&(n.style.textTransform="capitalize"),this.hasFormat("bold")&&(n=Gn(n,"b")),this.hasFormat("italic")&&(n=Gn(n,"i")),this.hasFormat("strikethrough")&&(n=Gn(n,"s")),this.hasFormat("underline")&&(n=Gn(n,"u")),{element:n}}exportJSON(){return {detail:this.getDetail(),format:this.getFormat(),mode:this.getMode(),style:this.getStyle(),text:this.getTextContent(),...super.exportJSON()}}selectionTransform(t,e){}setFormat(t){const e=this.getWritable();return e.__format="string"==typeof t?R$5[t]:t,e}setDetail(t){const e=this.getWritable();return e.__detail="string"==typeof t?B$3[t]:t,e}setStyle(t){const e=this.getWritable();return e.__style=t,e}toggleFormat(t){const e=fo(this.getFormat(),t,null);return this.setFormat(e)}toggleDirectionless(){const t=this.getWritable();return t.__detail^=1,t}toggleUnmergeable(){const t=this.getWritable();return t.__detail^=2,t}setMode(t){const e=j$3[t];if(this.__mode===e)return this;const n=this.getWritable();return n.__mode=e,n}setTextContent(t){if(this.__text===t)return this;const e=this.getWritable();return e.__text=t,e}select(t,e){ei();let n=t,r=e;const i=Lr(),o=this.getTextContent(),s=this.__key;if("string"==typeof o){const t=o.length;void 0===n&&(n=t),void 0===r&&(r=t);}else n=0,r=0;if(!yr(i))return Mr(s,n,s,r,"text","text");{const t=mo();t!==i.anchor.key&&t!==i.focus.key||yo(s),i.setTextNodeRange(this,n,this,r);}return i}selectStart(){return this.select(0,0)}selectEnd(){const t=this.getTextContentSize();return this.select(t,t)}spliceText(t,e,n,r){const i=this.getWritable(),o=i.__text,s=n.length;let l=t;l<0&&(l=s+l,l<0&&(l=0));const c=Lr();if(r&&yr(c)){const e=t+s;c.setTextNodeRange(i,e,i,e);}const a=o.slice(0,l)+n+o.slice(l+e);return i.__text=a,i}canInsertTextBefore(){return  true}canInsertTextAfter(){return  true}splitText(...t){ei();const e=this.getLatest(),n=e.getTextContent();if(""===n)return [];const r=e.__key,i=mo(),o=n.length;t.sort((t,e)=>t-e),t.push(o);const s=[],l=t.length;for(let e=0,r=0;e<o&&r<=l;r++){const i=t[r];i>e&&(s.push(n.slice(e,i)),e=i);}const c=s.length;if(1===c)return [e];const a=s[0],u=e.getParent();let f;const d=e.getFormat(),h=e.getStyle(),g=e.__detail;let _=false,p=null,y=null;const m=Lr();if(yr(m)){const[t,e]=m.isBackward()?[m.focus,m.anchor]:[m.anchor,m.focus];"text"===t.type&&t.key===r&&(p=t),"text"===e.type&&e.key===r&&(y=e);}e.isSegmented()?(f=sr(a),f.__format=d,f.__style=h,f.__detail=g,f.__state=yt$3(e,f),_=true):f=e.setTextContent(a);const x=[f];for(let t=1;t<c;t++){const n=sr(s[t]);n.__format=d,n.__style=h,n.__detail=g,n.__state=yt$3(e,n);const o=n.__key;i===r&&yo(o),x.push(n);}const C=p?p.offset:null,S=y?y.offset:null;let v=0;for(const t of x){if(!p&&!y)break;const e=v+t.getTextContentSize();if(null!==p&&null!==C&&C<=e&&C>=v&&(p.set(t.getKey(),C-v,"text"),C<e&&(p=null)),null!==y&&null!==S&&S<=e&&S>=v){y.set(t.getKey(),S-v,"text");break}v=e;}if(null!==u){!function(t){const e=t.getPreviousSibling(),n=t.getNextSibling();null!==e&&po(e);null!==n&&po(n);}(this);const t=u.getWritable(),e=this.getIndexWithinParent();_?(t.splice(e,0,x),this.remove()):t.splice(e,1,x),yr(m)&&Kr(m,u,e,c-1);}return x}mergeWithSibling(e){const n=e===this.getPreviousSibling();n||e===this.getNextSibling()||t(50);const r=this.__key,i=e.__key,o=this.__text,s=o.length;mo()===i&&yo(r);const l=Lr();if(yr(l)){const t=l.anchor,o=l.focus;null!==t&&t.key===i&&Br(t,n,r,e,s),null!==o&&o.key===i&&Br(o,n,r,e,s);}const c=e.__text,a=n?c+o:o+c;this.setTextContent(a);const u=this.getWritable();return e.remove(),u}isTextEntity(){return  false}}function Qn(t){return {forChild:cr(t.style),node:null}}function Zn(t){const e=t,n="normal"===e.style.fontWeight;return {forChild:cr(e.style,n?void 0:"bold"),node:null}}const tr=new WeakMap;function er(t){if(!Cs(t))return  false;if("PRE"===t.nodeName)return  true;const e=t.style.whiteSpace;return "string"==typeof e&&e.startsWith("pre")}function nr(e){const n=e;null===e.parentElement&&t(129);let r=n.textContent||"";if(null!==function(t){let e,n=t.parentNode;const r=[t];for(;null!==n&&void 0===(e=tr.get(n))&&!er(n);)r.push(n),n=n.parentNode;const i=void 0===e?n:e;for(let t=0;t<r.length;t++)tr.set(r[t],i);return i}(n)){const t=r.split(/(\r?\n|\t)/),e=[],n=t.length;for(let r=0;r<n;r++){const n=t[r];"\n"===n||"\r\n"===n?e.push(Jn()):"\t"===n?e.push(ur()):""!==n&&e.push(sr(n));}return {node:e}}if(r=r.replace(/\r/g,"").replace(/[ \t\n]+/g," "),""===r)return {node:null};if(" "===r[0]){let t=n,e=true;for(;null!==t&&null!==(t=rr(t,false));){const n=t.textContent||"";if(n.length>0){/[ \t\n]$/.test(n)&&(r=r.slice(1)),e=false;break}}e&&(r=r.slice(1));}if(" "===r[r.length-1]){let t=n,e=true;for(;null!==t&&null!==(t=rr(t,true));){if((t.textContent||"").replace(/^( |\t|\r?\n)+/,"").length>0){e=false;break}}e&&(r=r.slice(0,r.length-1));}return ""===r?{node:null}:{node:sr(r)}}function rr(t,e){let n=t;for(;;){let t;for(;null===(t=e?n.nextSibling:n.previousSibling);){const t=n.parentElement;if(null===t)return null;n=t;}if(n=t,Cs(n)){const t=n.style.display;if(""===t&&!ks(n)||""!==t&&!t.startsWith("inline"))return null}let r=n;for(;null!==(r=e?n.firstChild:n.lastChild);)n=r;if(co(n))return n;if("BR"===n.nodeName)return null}}const ir={code:"code",em:"italic",i:"italic",mark:"highlight",s:"strikethrough",strong:"bold",sub:"subscript",sup:"superscript",u:"underline"};function or(t){const e=ir[t.nodeName.toLowerCase()];return void 0===e?{node:null}:{forChild:cr(t.style,e),node:null}}function sr(t=""){return fs(new Xn(t))}function lr(t){return t instanceof Xn}function cr(t,e){const n=t.fontWeight,r=t.textDecoration.split(" "),i="700"===n||"bold"===n,o=r.includes("line-through"),s="italic"===t.fontStyle,l=r.includes("underline"),c=t.verticalAlign;return t=>lr(t)?(i&&!t.hasFormat("bold")&&t.toggleFormat("bold"),o&&!t.hasFormat("strikethrough")&&t.toggleFormat("strikethrough"),s&&!t.hasFormat("italic")&&t.toggleFormat("italic"),l&&!t.hasFormat("underline")&&t.toggleFormat("underline"),"sub"!==c||t.hasFormat("subscript")||t.toggleFormat("subscript"),"super"!==c||t.hasFormat("superscript")||t.toggleFormat("superscript"),e&&!t.hasFormat(e)&&t.toggleFormat(e),t):t}class ar extends Xn{static getType(){return "tab"}static clone(t){return new ar(t.__key)}constructor(t){super("\t",t),this.__detail=2;}static importDOM(){return null}createDOM(t){const e=super.createDOM(t),n=$o(t.theme,"tab");if(void 0!==n){e.classList.add(...n);}return e}static importJSON(t){return ur().updateFromJSON(t)}setTextContent(t){return "\t"!==t&&""!==t&&e(126),super.setTextContent("\t")}spliceText(e,n,r,i){return ""===r&&0===n||"\t"===r&&1===n||t(286),this}setDetail(e){return 2!==e&&t(127),this}setMode(e){return "normal"!==e&&t(128),this}canInsertTextBefore(){return  false}canInsertTextAfter(){return  false}}function ur(){return fs(new ar)}function fr(t){return t instanceof ar}class dr{key;offset;type;_selection;constructor(t,e,n){this._selection=null,this.key=t,this.offset=e,this.type=n;}is(t){return this.key===t.key&&this.offset===t.offset&&this.type===t.type}isBefore(t){if(this.key===t.key)return this.offset<t.offset;return gl(El(xl(this,"next")),El(xl(t,"next")))<0}getNode(){const e=xo(this.key);return null===e&&t(20),e}set(t,e,n,r){const i=this._selection,o=this.key;r&&this.key===t&&this.offset===e&&this.type===n||(this.key=t,this.offset=e,this.type=n,ti()||(mo()===o&&yo(t),null!==i&&(i.setCachedNodes(null),i.dirty=true)));}}function hr(t,e,n){return new dr(t,e,n)}function gr(t,e){let n=e.__key,r=t.offset,i="element";if(lr(e)){i="text";const t=e.getTextContentSize();r>t&&(r=t);}else if(!Si(e)){const t=e.getNextSibling();if(lr(t))n=t.__key,r=0,i="text";else {const t=e.getParent();t&&(n=t.__key,r=e.getIndexWithinParent()+1);}}t.set(n,r,i);}function _r(t,e){if(Si(e)){const n=e.getLastDescendant();Si(n)||lr(n)?gr(t,n):gr(t,e);}else gr(t,e);}class pr{_nodes;_cachedNodes;dirty;constructor(t){this._cachedNodes=null,this._nodes=t,this.dirty=false;}getCachedNodes(){return this._cachedNodes}setCachedNodes(t){this._cachedNodes=t;}is(t){if(!xr(t))return  false;const e=this._nodes,n=t._nodes;return e.size===n.size&&Array.from(e).every(t=>n.has(t))}isCollapsed(){return  false}isBackward(){return  false}getStartEndPoints(){return null}add(t){this.dirty=true,this._nodes.add(t),this._cachedNodes=null;}delete(t){this.dirty=true,this._nodes.delete(t),this._cachedNodes=null;}clear(){this.dirty=true,this._nodes.clear(),this._cachedNodes=null;}has(t){return this._nodes.has(t)}clone(){return new pr(new Set(this._nodes))}extract(){return this.getNodes()}insertRawText(t){}insertText(){}insertNodes(t){const e=this.getNodes(),n=e.length,r=e[n-1];let i;if(lr(r))i=r.select();else {const t=r.getIndexWithinParent()+1;i=r.getParentOrThrow().select(t,t);}i.insertNodes(t);for(let t=0;t<n;t++)e[t].remove();}getNodes(){const t=this._cachedNodes;if(null!==t)return t;const e=this._nodes,n=[];for(const t of e){const e=xo(t);null!==e&&n.push(e);}return ti()||(this._cachedNodes=n),n}getTextContent(){const t=this.getNodes();let e="";for(let n=0;n<t.length;n++)e+=t[n].getTextContent();return e}deleteNodes(){const t=this.getNodes();if((Lr()||Ir())===this&&t[0]){const e=tl(t[0],"next");Sl(dl(e,e));}for(const e of t)e.remove();}}function yr(t){return t instanceof mr}class mr{format;style;anchor;focus;_cachedNodes;dirty;constructor(t,e,n,r){this.anchor=t,this.focus=e,t._selection=this,e._selection=this,this._cachedNodes=null,this.format=n,this.style=r,this.dirty=false;}getCachedNodes(){return this._cachedNodes}setCachedNodes(t){this._cachedNodes=t;}is(t){return !!yr(t)&&(this.anchor.is(t.anchor)&&this.focus.is(t.focus)&&this.format===t.format&&this.style===t.style)}isCollapsed(){return this.anchor.is(this.focus)}getNodes(){const t=this._cachedNodes;if(null!==t)return t;const e=function(t){const e=[],[n,r]=t.getTextSlices();n&&e.push(n.caret.origin);const i=new Set,o=new Set;for(const n of t)if(Gs(n)){const{origin:t}=n;0===e.length?i.add(t):(o.add(t),e.push(t));}else {const{origin:t}=n;Si(t)&&o.has(t)||e.push(t);}r&&e.push(r.caret.origin);if(Hs(t.focus)&&Si(t.focus.origin)&&null===t.focus.getNodeAtCaret())for(let n=il(t.focus.origin,"previous");Gs(n)&&i.has(n.origin)&&!n.origin.isEmpty()&&n.origin.is(e[e.length-1]);n=sl(n))i.delete(n.origin),e.pop();for(;e.length>1;){const t=e[e.length-1];if(!Si(t)||o.has(t)||t.isEmpty()||i.has(t))break;e.pop();}if(0===e.length&&t.isCollapsed()){const n=El(t.anchor),r=El(t.anchor.getFlipped()),i=t=>Ys(t)?t.origin:t.getNodeAtCaret(),o=i(n)||i(r)||(t.anchor.getNodeAtCaret()?n.origin:r.origin);e.push(o);}return e}(Al(kl(this),"next"));return ti()||(this._cachedNodes=e),e}setTextNodeRange(t,e,n,r){this.anchor.set(t.__key,e,"text"),this.focus.set(n.__key,r,"text");}getTextContent(){const t=this.getNodes();if(0===t.length)return "";const e=t[0],n=t[t.length-1],r=this.anchor,i=this.focus,o=r.isBefore(i),[s,l]=Sr(this);let c="",a=true;for(let u=0;u<t.length;u++){const f=t[u];if(Si(f)&&!f.isInline())a||(c+="\n"),a=!f.isEmpty();else if(a=false,lr(f)){let t=f.getTextContent();f===e?f===n?"element"===r.type&&"element"===i.type&&i.offset!==r.offset||(t=s<l?t.slice(s,l):t.slice(l,s)):t=o?t.slice(s):t.slice(l):f===n&&(t=o?t.slice(0,l):t.slice(0,s)),c+=t;}else !Ti(f)&&!jn(f)||f===n&&this.isCollapsed()||(c+=f.getTextContent());}return c}applyDOMRange(t){const e=ii(),n=e.getEditorState()._selection,r=Er(t.startContainer,t.startOffset,t.endContainer,t.endOffset,e,n);if(null===r)return;const[i,o]=r;this.anchor.set(i.key,i.offset,i.type,true),this.focus.set(o.key,o.offset,o.type,true),St$5(this);}clone(){const t=this.anchor,e=this.focus;return new mr(hr(t.key,t.offset,t.type),hr(e.key,e.offset,e.type),this.format,this.style)}toggleFormat(t){this.format=fo(this.format,t,null),this.dirty=true;}setFormat(t){this.format=t,this.dirty=true;}setStyle(t){this.style=t,this.dirty=true;}hasFormat(t){const e=R$5[t];return 0!==(this.format&e)}insertRawText(t){const e=t.split(/(\r?\n|\t)/),n=[],r=e.length;for(let t=0;t<r;t++){const r=e[t];"\n"===r||"\r\n"===r?n.push(Jn()):"\t"===r?n.push(ur()):n.push(sr(r));}this.insertNodes(n);}insertText(e){const n=this.anchor,r=this.focus,i=this.format,o=this.style;let s=n,l=r;!this.isCollapsed()&&r.isBefore(n)&&(s=r,l=n),"element"===s.type&&function(t,e,n,r){const i=t.getNode(),o=i.getChildAtIndex(t.offset),s=sr();if(s.setFormat(n),s.setStyle(r),Ii(o))o.splice(0,0,[s]);else {const t=bi(i)?Li().append(s):s;null===o?i.append(t):o.insertBefore(t);}t.is(e)&&e.set(s.__key,0,"text"),t.set(s.__key,0,"text");}(s,l,i,o),"element"===l.type&&Cl(l,El(xl(l,"next")));const c=s.offset;let a=l.offset;const u=this.getNodes(),f=u.length;let d=u[0];lr(d)||t(26);const h=d.getTextContent().length,g=d.getParentOrThrow();let _=u[f-1];if(1===f&&"element"===l.type&&(a=h,l.set(s.key,a,"text")),this.isCollapsed()&&c===h&&(lo(d)||!d.canInsertTextAfter()||!g.canInsertTextAfter()&&null===d.getNextSibling())){let t=d.getNextSibling();if(lr(t)&&t.canInsertTextBefore()&&!lo(t)||(t=sr(),t.setFormat(i),t.setStyle(o),g.canInsertTextAfter()?d.insertAfter(t):g.insertAfter(t)),t.select(0,0),d=t,""!==e)return void this.insertText(e)}else if(this.isCollapsed()&&0===c&&(lo(d)||!d.canInsertTextBefore()||!g.canInsertTextBefore()&&null===d.getPreviousSibling())){let t=d.getPreviousSibling();if(lr(t)&&!lo(t)||(t=sr(),t.setFormat(i),g.canInsertTextBefore()?d.insertBefore(t):g.insertBefore(t)),t.select(),d=t,""!==e)return void this.insertText(e)}else if(d.isSegmented()&&c!==h){const t=sr(d.getTextContent());t.setFormat(i),d.replace(t),d=t;}else if(!this.isCollapsed()&&""!==e){const t=_.getParent();if(!g.canInsertTextBefore()||!g.canInsertTextAfter()||Si(t)&&(!t.canInsertTextBefore()||!t.canInsertTextAfter()))return this.insertText(""),wr(this.anchor,this.focus,null),void this.insertText(e)}if(1===f){if(so(d)){const t=sr(e);return t.select(),void d.replace(t)}const t=d.getFormat(),n=d.getStyle();if(c!==a||t===i&&n===o){if(fr(d)){const t=sr(e);return t.setFormat(i),t.setStyle(o),t.select(),void d.replace(t)}}else {if(""!==d.getTextContent()){const t=sr(e);if(t.setFormat(i),t.setStyle(o),t.select(),0===c)d.insertBefore(t,false);else {const[e]=d.splitText(c);e.insertAfter(t,false);}return void(t.isComposing()&&"text"===this.anchor.type&&(this.anchor.offset-=e.length))}d.setFormat(i),d.setStyle(o);}const r=a-c;d=d.spliceText(c,r,e,true),""===d.getTextContent()?d.remove():"text"===this.anchor.type&&(d.isComposing()?this.anchor.offset-=e.length:(this.format=t,this.style=n));}else {const t=new Set([...d.getParentKeys(),..._.getParentKeys()]),n=Si(d)?d:d.getParentOrThrow();let r=Si(_)?_:_.getParentOrThrow(),i=_;if(!n.is(r)&&r.isInline())do{i=r,r=r.getParentOrThrow();}while(r.isInline());if("text"===l.type&&(0!==a||""===_.getTextContent())||"element"===l.type&&_.getIndexWithinParent()<a)if(lr(_)&&!so(_)&&a!==_.getTextContentSize()){if(_.isSegmented()){const t=sr(_.getTextContent());_.replace(t),_=t;}bi(l.getNode())||"text"!==l.type||(_=_.spliceText(0,a,"")),t.add(_.__key);}else {const t=_.getParentOrThrow();t.canBeEmpty()||1!==t.getChildrenSize()?_.remove():t.remove();}else t.add(_.__key);const o=r.getChildren(),s=new Set(u),g=n.is(r),p=n.isInline()&&null===d.getNextSibling()?n:d;for(let t=o.length-1;t>=0;t--){const e=o[t];if(e.is(d)||Si(e)&&e.isParentOf(d))break;e.isAttached()&&(!s.has(e)||e.is(i)?g||p.insertAfter(e,false):e.remove());}if(!g){let e=r,n=null;for(;null!==e;){const r=e.getChildren(),i=r.length;(0===i||r[i-1].is(n))&&(t.delete(e.__key),n=e),e=e.getParent();}}if(so(d))if(c===h)d.select();else {const t=sr(e);t.select(),d.replace(t);}else d=d.spliceText(c,h-c,e,true),""===d.getTextContent()?d.remove():d.isComposing()&&"text"===this.anchor.type&&(this.anchor.offset-=e.length);for(let e=1;e<f;e++){const n=u[e],r=n.__key;t.has(r)||n.remove();}}}removeText(){const t=Lr()===this;vl(this,wl(kl(this))),t&&Lr()!==this&&wo(this);}formatText(t,e=null){if(this.isCollapsed())return this.toggleFormat(t),void yo(null);const n=this.getNodes(),r=[];for(const t of n)lr(t)&&r.push(t);const i=e=>{n.forEach(n=>{if(Si(n)){const r=n.getFormatFlags(t,e);n.setTextFormat(r);}});},o=r.length;if(0===o)return this.toggleFormat(t),yo(null),void i(e);const s=this.anchor,l=this.focus,c=this.isBackward(),a=c?l:s,u=c?s:l;let f=0,d=r[0],h="element"===a.type?0:a.offset;if("text"===a.type&&h===d.getTextContentSize()&&(f=1,d=r[1],h=0),null==d)return;const g=d.getFormatFlags(t,e);i(g);const _=o-1;let p=r[_];const y="text"===u.type?u.offset:p.getTextContentSize();if(d.is(p)){if(h===y)return;if(lo(d)||0===h&&y===d.getTextContentSize())d.setFormat(g);else {const t=d.splitText(h,y),e=0===h?t[0]:t[1];e.setFormat(g),"text"===a.type&&a.set(e.__key,0,"text"),"text"===u.type&&u.set(e.__key,y-h,"text");}return void(this.format=g)}0===h||lo(d)||([,d]=d.splitText(h),h=0),d.setFormat(g);const m=p.getFormatFlags(t,g);y>0&&(y===p.getTextContentSize()||lo(p)||([p]=p.splitText(y)),p.setFormat(m));for(let e=f+1;e<_;e++){const n=r[e],i=n.getFormatFlags(t,m);n.setFormat(i);}"text"===a.type&&a.set(d.__key,h,"text"),"text"===u.type&&u.set(p.__key,y,"text"),this.format=g|m;}insertNodes(e){if(0===e.length)return;if(this.isCollapsed()||this.removeText(),"root"===this.anchor.key){this.insertParagraph();const n=Lr();return yr(n)||t(134),n.insertNodes(e)}const n=(this.isBackward()?this.focus:this.anchor).getNode(),r=zs(n,Ns),i=e[e.length-1];if(Si(r)&&"__language"in r){if("__language"in e[0])this.insertText(e[0].getTextContent());else {const t=Ur(this);r.splice(t,0,e),i.selectEnd();}return}if(!e.some(t=>(Si(t)||Ti(t))&&!t.isInline())){Si(r)||t(211,n.constructor.name,n.getType());const o=Ur(this);return r.splice(o,0,e),void i.selectEnd()}const o=function(t){const e=Li();let n=null;for(let r=0;r<t.length;r++){const i=t[r],o=jn(i);if(o||Ti(i)&&i.isInline()||Si(i)&&i.isInline()||lr(i)||i.isParentRequired()){if(null===n&&(n=i.createParentElementNode(),e.append(n),o))continue;null!==n&&n.append(i);}else e.append(i),n=null;}return e}(e),s=o.getLastDescendant(),l=o.getChildren(),c=!Si(r)||!r.isEmpty()?this.insertParagraph():null,a=l[l.length-1];let u=l[0];var f;Si(f=u)&&Ns(f)&&!f.isEmpty()&&Si(r)&&(!r.isEmpty()||r.canMergeWhenEmpty())&&(Si(r)||t(211,n.constructor.name,n.getType()),r.append(...u.getChildren()),u=l[1]),u&&(null===r&&t(212,n.constructor.name,n.getType()),function(e,n){const r=n.getParentOrThrow().getLastChild();let i=n;const o=[n];for(;i!==r;)i.getNextSibling()||t(140),i=i.getNextSibling(),o.push(i);let s=e;for(const t of o)s=s.insertAfter(t);}(r,u));const d=zs(s,Ns);c&&Si(d)&&(c.canMergeWhenEmpty()||Ns(a))&&(d.append(...c.getChildren()),c.remove()),Si(r)&&r.isEmpty()&&r.remove(),s.selectEnd();const h=Si(r)?r.getLastChild():null;jn(h)&&d!==r&&h.remove();}insertParagraph(){if("root"===this.anchor.key){const t=Li();return No().splice(this.anchor.offset,0,[t]),t.select(),t}const e=Ur(this),n=zs(this.anchor.getNode(),Ns);Si(n)||t(213);const r=n.getChildAtIndex(e),i=r?[r,...r.getNextSiblings()]:[],o=n.insertNewAfter(this,false);return o?(o.append(...i),o.selectStart(),o):null}insertLineBreak(t){const e=Jn();if(this.insertNodes([e]),t){const t=e.getParentOrThrow(),n=e.getIndexWithinParent();t.select(n,n);}}extract(){const t=[...this.getNodes()],e=t.length;let n=t[0],r=t[e-1];const[i,o]=Sr(this),s=this.isBackward(),[l,c]=s?[this.focus,this.anchor]:[this.anchor,this.focus],[a,u]=s?[o,i]:[i,o];if(0===e)return [];if(1===e){if(lr(n)&&!this.isCollapsed()){const t=n.splitText(a,u),e=0===a?t[0]:t[1];return e?(l.set(e.getKey(),0,"text"),c.set(e.getKey(),e.getTextContentSize(),"text"),[e]):[]}return [n]}if(lr(n)&&(a===n.getTextContentSize()?t.shift():0!==a&&([,n]=n.splitText(a),t[0]=n,l.set(n.getKey(),0,"text"))),lr(r)){const e=r.getTextContent().length;0===u?t.pop():u!==e&&([r]=r.splitText(u),t[t.length-1]=r,c.set(r.getKey(),r.getTextContentSize(),"text"));}return t}modify(t,e,n){if(Yr(this,t,e,n))return;const r="move"===t,i=ii(),o=ps(ss(i));if(!o)return;const s=i._blockCursorElement,l=i._rootElement,c=this.focus.getNode();if(null===l||null===s||!Si(c)||c.isInline()||c.canBeEmpty()||_s(s,i,l),this.dirty){let t=Qo(i,this.anchor.key),e=Qo(i,this.focus.key);"text"===this.anchor.type&&(t=uo(t)),"text"===this.focus.type&&(e=uo(e)),t&&e&&Wr(o,t,this.anchor.offset,e,this.focus.offset);}if(function(t,e,n,r){t.modify(e,n,r);}(o,t,e?"backward":"forward",n),o.rangeCount>0){const t=o.getRangeAt(0),n=this.anchor.getNode(),i=bi(n)?n:cs(n);if(this.applyDOMRange(t),this.dirty=true,!r){const n=this.getNodes(),r=[];let s=false;for(let t=0;t<n.length;t++){const e=n[t];is(e,i)?r.push(e):s=true;}if(s&&r.length>0)if(e){const t=r[0];Si(t)?t.selectStart():t.getParentOrThrow().selectStart();}else {const t=r[r.length-1];Si(t)?t.selectEnd():t.getParentOrThrow().selectEnd();}o.anchorNode===t.startContainer&&o.anchorOffset===t.startOffset||function(t){const e=t.focus,n=t.anchor,r=n.key,i=n.offset,o=n.type;n.set(e.key,e.offset,e.type,true),e.set(r,i,o,true);}(this);}}"lineboundary"===n&&Yr(this,t,e,n,"decorators");}forwardDeletion(t,e,n){if(!n&&("element"===t.type&&Si(e)&&t.offset===e.getChildrenSize()||"text"===t.type&&t.offset===e.getTextContentSize())){const t=e.getParent(),n=e.getNextSibling()||(null===t?null:t.getNextSibling());if(Si(n)&&n.isShadowRoot())return  true}return  false}deleteCharacter(t){const e=this.isCollapsed();if(this.isCollapsed()){const e=this.anchor;let n=e.getNode();if(this.forwardDeletion(e,n,t))return;const r=ul(xl(e,t?"previous":"next"));if(r.getTextSlices().every(t=>null===t||0===t.distance)){let t={type:"initial"};for(const e of r.iterNodeCarets("shadowRoot"))if(Gs(e))if(e.origin.isInline());else {if(e.origin.isShadowRoot()){if("merge-block"===t.type)break;if(Si(r.anchor.origin)&&r.anchor.origin.isEmpty()){const t=El(e);vl(this,dl(t,t)),r.anchor.origin.remove();}return}"merge-next-block"!==t.type&&"merge-block"!==t.type||(t={block:t.block,caret:e,type:"merge-block"});}else {if("merge-block"===t.type)break;if(Hs(e)){if(Si(e.origin)){if(e.origin.isInline()){if(!e.origin.isParentOf(r.anchor.origin))break}else t={block:e.origin,type:"merge-next-block"};continue}if(Ti(e.origin)){if(e.origin.isIsolated());else if("merge-next-block"===t.type&&(e.origin.isKeyboardSelectable()||!e.origin.isInline())&&Si(r.anchor.origin)&&r.anchor.origin.isEmpty()){r.anchor.origin.remove();const t=Pr();t.add(e.origin.getKey()),wo(t);}else e.origin.remove();return}break}}if("merge-block"===t.type){const{caret:e,block:n}=t;return vl(this,dl(!e.origin.isEmpty()&&n.isEmpty()?Tl(tl(n,e.direction)):r.anchor,e)),this.removeText()}}const i=this.focus;if(this.modify("extend",t,"character"),this.isCollapsed()){if(t&&0===e.offset&&vr(this,e.getNode()))return}else {const r="text"===i.type?i.getNode():null;if(n="text"===e.type?e.getNode():null,null!==r&&r.isSegmented()){const e=i.offset,o=r.getTextContentSize();if(r.is(n)||t&&e!==o||!t&&0!==e)return void Tr(r,t,e)}else if(null!==n&&n.isSegmented()){const i=e.offset,o=n.getTextContentSize();if(n.is(r)||t&&0!==i||!t&&i!==o)return void Tr(n,t,i)}!function(t,e){const n=t.anchor,r=t.focus,i=n.getNode(),o=r.getNode();if(i===o&&"text"===n.type&&"text"===r.type){const t=n.offset,o=r.offset,s=t<o,l=s?t:o,c=s?o:t,a=c-1;if(l!==a){(function(t){return !(Oo(t)||kr(t))})(i.getTextContent().slice(l,c))&&(e?r.set(r.key,a,r.type):n.set(n.key,a,n.type));}}}(this,t);}}if(this.removeText(),t&&!e&&this.isCollapsed()&&"element"===this.anchor.type&&0===this.anchor.offset){const t=this.anchor.getNode();t.isEmpty()&&bi(t.getParent())&&null===t.getPreviousSibling()&&vr(this,t);}}deleteLine(t){this.isCollapsed()&&this.modify("extend",t,"lineboundary"),this.isCollapsed()?this.deleteCharacter(t):this.removeText();}deleteWord(t){if(this.isCollapsed()){const e=this.anchor,n=e.getNode();if(this.forwardDeletion(e,n,t))return;this.modify("extend",t,"word");}this.removeText();}isBackward(){return this.focus.isBefore(this.anchor)}getStartEndPoints(){return [this.anchor,this.focus]}}function xr(t){return t instanceof pr}function Cr(t){const e=t.offset;if("text"===t.type)return e;const n=t.getNode();return e===n.getChildrenSize()?n.getTextContent().length:0}function Sr(t){const e=t.getStartEndPoints();if(null===e)return [0,0];const[n,r]=e;return "element"===n.type&&"element"===r.type&&n.key===r.key&&n.offset===r.offset?[0,0]:[Cr(n),Cr(r)]}function vr(t,e){for(let n=e;n;n=n.getParent()){if(Si(n)){if(n.collapseAtStart(t))return  true;if(as(n))break}if(n.getPreviousSibling())break}return  false}const kr=(()=>{try{const t=new RegExp("\\p{Emoji}","u"),e=t.test.bind(t);if(e("❤️")&&e("#️⃣")&&e("👍"))return e}catch(t){}return ()=>false})();function Tr(t,e,n){const r=t,i=r.getTextContent().split(/(?=\s)/g),o=i.length;let s=0,l=0;for(let t=0;t<o;t++){const r=t===o-1;if(l=s,s+=i[t].length,e&&s===n||s>n||r){i.splice(t,1),r&&(l=void 0);break}}const c=i.join("").trim();""===c?r.remove():(r.setTextContent(c),r.select(l,l));}function Nr(e,n,r,i){let o,s=n;if(Cs(e)){let l=false;const c=e.childNodes,a=c.length,u=i._blockCursorElement;s===a&&(l=true,s=a-1);let f=c[s],d=false;if(f===u)f=c[s+1],d=true;else if(null!==u){const t=u.parentNode;if(e===t){n>Array.prototype.indexOf.call(t.children,u)&&s--;}}if(o=Eo(f),lr(o))s=nl(o,l?"next":"previous");else {let c=Eo(e);if(null===c)return null;if(Si(c)){const a=i.getElementByKey(c.getKey());null===a&&t(214);const u=c.getDOMSlot(a);[c,s]=u.resolveChildIndex(c,a,e,n),Si(c)||t(215),l&&s>=c.getChildrenSize()&&(s=Math.max(0,c.getChildrenSize()-1));let f=c.getChildAtIndex(s);if(Si(f)&&function(t,e,n){const r=t.getParent();return null===n||null===r||!r.canBeEmpty()||r!==n.getNode()}(f,0,r)){const t=l?f.getLastDescendant():f.getFirstDescendant();null===t?c=f:(f=t,c=Si(f)?f:f.getParentOrThrow()),s=0;}lr(f)?(o=f,c=null,s=nl(f,l?"next":"previous")):f!==c&&l&&!d&&(Si(c)||t(216),s=Math.min(c.getChildrenSize(),s+1));}else {const t=c.getIndexWithinParent();s=0===n&&Ti(c)&&Eo(e)===c?t:t+1,c=c.getParentOrThrow();}if(Si(c))return hr(c.__key,s,"element")}}else o=Eo(e);return lr(o)?hr(o.__key,nl(o,s,"clamp"),"text"):null}function br(t,e,n){const r=t.offset,i=t.getNode();if(0===r){const r=i.getPreviousSibling(),o=i.getParent();if(e){if((n||!e)&&null===r&&Si(o)&&o.isInline()){const e=o.getPreviousSibling();lr(e)&&t.set(e.__key,e.getTextContent().length,"text");}}else Si(r)&&!n&&r.isInline()?t.set(r.__key,r.getChildrenSize(),"element"):lr(r)&&t.set(r.__key,r.getTextContent().length,"text");}else if(r===i.getTextContent().length){const r=i.getNextSibling(),o=i.getParent();if(e&&Si(r)&&r.isInline())t.set(r.__key,0,"element");else if((n||e)&&null===r&&Si(o)&&o.isInline()&&!o.canInsertTextAfter()){const e=o.getNextSibling();lr(e)&&t.set(e.__key,0,"text");}}}function wr(t,e,n){if("text"===t.type&&"text"===e.type){const r=t.isBefore(e),i=t.is(e);br(t,r,i),br(e,!r,i),i&&e.set(t.key,t.offset,t.type);const o=ii();if(o.isComposing()&&o._compositionKey!==t.key&&yr(n)){const r=n.anchor,i=n.focus;t.set(r.key,r.offset,r.type,true),e.set(i.key,i.offset,i.type,true);}}}function Er(t,e,n,r,i,o){if(null===t||null===n||!eo(i,t,n))return null;const s=Nr(t,e,yr(o)?o.anchor:null,i);if(null===s)return null;const l=Nr(n,r,yr(o)?o.focus:null,i);if(null===l)return null;if("element"===s.type&&"element"===l.type){const e=Eo(t),r=Eo(n);if(Ti(e)&&Ti(r))return null}return wr(s,l,o),[s,l]}function Or(t){return Si(t)&&!t.isInline()}function Mr(t,e,n,r,i,o){const s=ri(),l=new mr(hr(t,e,i),hr(n,r,o),0,"");return l.dirty=true,s._selection=l,l}function Ar(){const t=hr("root",0,"element"),e=hr("root",0,"element");return new mr(t,e,0,"")}function Pr(){return new pr(new Set)}function Fr(t,e,n,r){const i=n._window;if(null===i)return null;const o=r||i.event,s=o?o.type:void 0,l="selectionchange"===s,c=!q$4&&(l||"beforeinput"===s||"compositionstart"===s||"compositionend"===s||"click"===s&&o&&3===o.detail||"drop"===s||void 0===s);let a,u,f,d;if(yr(t)&&!c)return t.clone();if(null===e)return null;if(a=e.anchorNode,u=e.focusNode,f=e.anchorOffset,d=e.focusOffset,(l||void 0===s)&&yr(t)&&!eo(n,a,u))return t.clone();const h=Er(a,f,u,d,n,t);if(null===h)return null;const[g,_]=h;return new mr(g,_,yr(t)?t.format:0,yr(t)?t.style:"")}function Lr(){return ri()._selection}function Ir(){return ii()._editorState._selection}function Kr(t,e,n,r=1){const i=t.anchor,o=t.focus,s=i.getNode(),l=o.getNode();if(!e.is(s)&&!e.is(l))return;const c=e.__key;if(t.isCollapsed()){const e=i.offset;if(n<=e&&r>0||n<e&&r<0){const n=Math.max(0,e+r);i.set(c,n,"element"),o.set(c,n,"element"),zr(t);}}else {const s=t.isBackward(),l=s?o:i,a=l.getNode(),u=s?i:o,f=u.getNode();if(e.is(a)){const t=l.offset;(n<=t&&r>0||n<t&&r<0)&&l.set(c,Math.max(0,t+r),"element");}if(e.is(f)){const t=u.offset;(n<=t&&r>0||n<t&&r<0)&&u.set(c,Math.max(0,t+r),"element");}}zr(t);}function zr(t){const e=t.anchor,n=e.offset,r=t.focus,i=r.offset,o=e.getNode(),s=r.getNode();if(t.isCollapsed()){if(!Si(o))return;const t=o.getChildrenSize(),i=n>=t,s=i?o.getChildAtIndex(t-1):o.getChildAtIndex(n);if(lr(s)){let t=0;i&&(t=s.getTextContentSize()),e.set(s.__key,t,"text"),r.set(s.__key,t,"text");}return}if(Si(o)){const t=o.getChildrenSize(),r=n>=t,i=r?o.getChildAtIndex(t-1):o.getChildAtIndex(n);if(lr(i)){let t=0;r&&(t=i.getTextContentSize()),e.set(i.__key,t,"text");}}if(Si(s)){const t=s.getChildrenSize(),e=i>=t,n=e?s.getChildAtIndex(t-1):s.getChildAtIndex(i);if(lr(n)){let t=0;e&&(t=n.getTextContentSize()),r.set(n.__key,t,"text");}}}function Rr(t,e,n,r,i){let o=null,s=0,l=null;null!==r?(o=r.__key,lr(r)?(s=r.getTextContentSize(),l="text"):Si(r)&&(s=r.getChildrenSize(),l="element")):null!==i&&(o=i.__key,lr(i)?l="text":Si(i)&&(l="element")),null!==o&&null!==l?t.set(o,s,l):(s=e.getIndexWithinParent(),-1===s&&(s=n.getChildrenSize()),t.set(n.__key,s,"element"));}function Br(t,e,n,r,i){"text"===t.type?t.set(n,t.offset+(e?0:i),"text"):t.offset>r.getIndexWithinParent()&&t.set(t.key,t.offset-1,"element");}function Wr(t,e,n,r,i){try{t.setBaseAndExtent(e,n,r,i);}catch(t){}}function Jr(t,e,n,r,i,o,s){const l=r.anchorNode,c=r.focusNode,a=r.anchorOffset,u=r.focusOffset,f=document.activeElement;if(i.has(Ln)&&f!==o||null!==f&&to(f))return;if(!yr(e))return void(null!==t&&eo(n,l,c)&&r.removeAllRanges());const d=e.anchor,h=e.focus,g=d.key,_=h.key,p=Qo(n,g),y=Qo(n,_),m=d.offset,x=h.offset,C=e.format,S=e.style,v=e.isCollapsed();let k=p,T=y,N=false;if("text"===d.type){k=uo(p);const t=d.getNode();N=t.getFormat()!==C||t.getStyle()!==S;}else yr(t)&&"text"===t.anchor.type&&(N=true);var b,w,E,O,M;if(("text"===h.type&&(T=uo(y)),null!==k&&null!==T)&&(v&&(null===t||N||yr(t)&&(t.format!==C||t.style!==S))&&(b=C,w=S,E=m,O=g,M=performance.now(),fn=[b,w,E,O,M]),a!==m||u!==x||l!==k||c!==T||"Range"===r.type&&v||(null!==f&&o.contains(f)||i.has(Rn)||o.focus({preventScroll:true}),"element"===d.type))){if(Wr(r,k,m,T,x),!i.has(Kn)&&e.isCollapsed()&&null!==o&&o===document.activeElement){const t=yr(e)&&"element"===e.anchor.type?k.childNodes[m]||null:r.rangeCount>0?r.getRangeAt(0):null;if(null!==t){let e;if(t instanceof Text){const n=document.createRange();n.selectNode(t),e=n.getBoundingClientRect();}else e=t.getBoundingClientRect();!function(t,e,n){const r=ts(n),i=os(r);if(null===r||null===i)return;let{top:o,bottom:s}=e,l=0,c=0,a=n;for(;null!==a;){const e=a===r.body;if(e)l=0,c=ss(t).innerHeight;else {const t=a.getBoundingClientRect();l=t.top,c=t.bottom;}let n=0;if(o<l?n=-(l-o):s>c&&(n=s-c),0!==n)if(e)i.scrollBy(0,n);else {const t=a.scrollTop;a.scrollTop+=n;const e=a.scrollTop-t;o-=e,s-=e;}if(e)break;a=Zo(a);}}(n,e,o);}}rn=true;}}function jr(t){let e=Lr()||Ir();null===e&&(e=No().selectEnd()),e.insertNodes(t);}function Ur(e){let n=e;e.isCollapsed()||n.removeText();const r=Lr();yr(r)&&(n=r),yr(n)||t(161);const i=n.anchor;let o=i.getNode(),s=i.offset;for(;!Ns(o);){const t=o;if([o,s]=Vr(o,s),t.is(o))break}return s}function Vr(t,e){const n=t.getParent();if(!n){const t=Li();return No().append(t),t.select(),[No(),0]}if(lr(t)){const r=t.splitText(e);if(0===r.length)return [n,t.getIndexWithinParent()];const i=0===e?0:1;return [n,r[0].getIndexWithinParent()+i]}if(!Si(t)||0===e)return [n,t.getIndexWithinParent()];const r=t.getChildAtIndex(e);if(r){const n=new mr(hr(t.__key,e,"element"),hr(t.__key,e,"element"),0,""),i=t.insertNewAfter(n);i&&i.append(r,...r.getNextSiblings());}return [n,t.getIndexWithinParent()+1]}function Yr(t,e,n,r,i="decorators-and-blocks"){if("move"===e&&"character"===r&&!t.isCollapsed()){const[e,r]=n===t.isBackward()?[t.focus,t.anchor]:[t.anchor,t.focus];return r.set(e.key,e.offset,e.type),true}const o=xl(t.focus,n?"previous":"next"),s="lineboundary"===r,l="move"===e;let c=o,a="decorators-and-blocks"===i;if(!Ol(c)){for(const t of c){a=false;const{origin:e}=t;if(!Ti(e)||e.isIsolated()||(c=t,!s||!e.isInline()))break}if(a)for(const t of ul(o).iterNodeCarets("extend"===e?"shadowRoot":"root")){if(Gs(t))t.origin.isInline()||(c=t);else {if(Si(t.origin))continue;Ti(t.origin)&&!t.origin.isInline()&&(c=t);}break}}if(c===o)return  false;if(l&&!s&&Ti(c.origin)&&c.origin.isKeyboardSelectable()){const t=Pr();return t.add(c.origin.getKey()),wo(t),true}return c=El(c),l&&Cl(t.anchor,c),Cl(t.focus,c),a||!s}let qr=null,Hr=null,Gr=false,Xr=false,Qr=0;const Zr={characterData:true,childList:true,subtree:true};function ti(){return Gr||null!==qr&&qr._readOnly}function ei(){Gr&&t(13);}function ni(){Qr>99&&t(14);}function ri(){return null===qr&&t(195,oi()),qr}function ii(){return null===Hr&&t(196,oi()),Hr}function oi(){let t=0;const e=new Set,n=Ui.version;if("undefined"!=typeof window)for(const r of document.querySelectorAll("[contenteditable]")){const i=io(r);if(no(i))t++;else if(i){let t=String(i.constructor.version||"<0.17.1");t===n&&(t+=" (separately built, likely a bundler configuration issue)"),e.add(t);}}let r=` Detected on the page: ${t} compatible editor(s) with version ${n}`;return e.size&&(r+=` and incompatible editors with versions ${Array.from(e).join(", ")}`),r}function si(){return Hr}function li(t,e,n){const r=e.__type,i=Gi(t,r);let o=n.get(r);void 0===o&&(o=Array.from(i.transforms),n.set(r,o));const s=o.length;for(let t=0;t<s&&(o[t](e),e.isAttached());t++);}function ci(t,e){return void 0!==t&&t.__key!==e&&t.isAttached()}function ai(t,e){if(!e)return;const n=t._updateTags;let r=e;Array.isArray(e)||(r=[e]);for(const t of r)n.add(t);}function ui(t){return fi(t,ii()._nodes)}function fi(e,n){const r=e.type,i=n.get(r);void 0===i&&t(17,r);const o=i.klass;e.type!==o.getType()&&t(18,o.name);const s=o.importJSON(e),l=e.children;if(Si(s)&&Array.isArray(l))for(let t=0;t<l.length;t++){const e=fi(l[t],n);s.append(e);}return s}function di(t,e,n){const r=qr,i=Gr,o=Hr;qr=e,Gr=true,Hr=t;try{return n()}finally{qr=r,Gr=i,Hr=o;}}function hi(t,e){const n=t._pendingEditorState,r=t._rootElement,i=t._headless||null===r;if(null===n)return;const o=t._editorState,s=o._selection,l=n._selection,c=0!==t._dirtyType,a=qr,u=Gr,f=Hr,d=t._updating,g=t._observer;let _=null;if(t._pendingEditorState=null,t._editorState=n,!i&&c&&null!==g){Hr=t,qr=n,Gr=false,t._updating=true;try{const e=t._dirtyType,r=t._dirtyElements,i=t._dirtyLeaves;g.disconnect(),_=ee$1(o,n,t,e,r,i);}catch(e){if(e instanceof Error&&t._onError(e),Xr)throw e;return Ji(t,null,r,n),rt$3(t),t._dirtyType=2,Xr=true,hi(t,o),void(Xr=false)}finally{g.observe(r,Zr),t._updating=d,qr=a,Gr=u,Hr=f;}}n._readOnly||(n._readOnly=true);const p=t._dirtyLeaves,y=t._dirtyElements,m=t._normalizedNodes,x=t._updateTags,C=t._deferred;c&&(t._dirtyType=0,t._cloneNotNeeded.clear(),t._dirtyLeaves=new Set,t._dirtyElements=new Map,t._normalizedNodes=new Set,t._updateTags=new Set),function(t,e){const n=t._decorators;let r=t._pendingDecorators||n;const i=e._nodeMap;let o;for(o in r)i.has(o)||(r===n&&(r=ko(t)),delete r[o]);}(t,n);const S=i?null:ps(ss(t));if(t._editable&&null!==S&&(c||null===l||l.dirty||!l.is(s))&&null!==r&&!x.has(zn)){Hr=t,qr=n;try{if(null!==g&&g.disconnect(),c||null===l||l.dirty){const e=t._blockCursorElement;null!==e&&_s(e,t,r),Jr(s,l,t,S,x,r);}!function(t,e,n){let r=t._blockCursorElement;if(yr(n)&&n.isCollapsed()&&"element"===n.anchor.type&&e.contains(document.activeElement)){const i=n.anchor,o=i.getNode(),s=i.offset;let l=!1,c=null;if(s===o.getChildrenSize()){gs(o.getChildAtIndex(s-1))&&(l=!0);}else {const e=o.getChildAtIndex(s);if(null!==e&&gs(e)){const n=e.getPreviousSibling();(null===n||gs(n))&&(l=!0,c=t.getElementByKey(e.__key));}}if(l){const n=t.getElementByKey(o.__key);return null===r&&(t._blockCursorElement=r=function(t){const e=t.theme,n=document.createElement("div");n.contentEditable="false",n.setAttribute("data-lexical-cursor","true");let r=e.blockCursor;if(void 0!==r){if("string"==typeof r){const t=h$1(r);r=e.blockCursor=t;}void 0!==r&&n.classList.add(...r);}return n}(t._config)),e.style.caretColor="transparent",void(null===c?n.appendChild(r):n.insertBefore(r,c))}}null!==r&&_s(r,t,e);}(t,r,l);}finally{null!==g&&g.observe(r,Zr),Hr=f,qr=a;}}null!==_&&function(t,e,n,r,i){const o=Array.from(t._listeners.mutation),s=o.length;for(let t=0;t<s;t++){const[s,l]=o[t];for(const t of l){const o=e.get(t);void 0!==o&&s(o,{dirtyLeaves:r,prevEditorState:i,updateTags:n});}}}(t,_,x,p,o),yr(l)||null===l||null!==s&&s.is(l)||t.dispatchCommand(ie$1,void 0);const v=t._pendingDecorators;null!==v&&(t._decorators=v,t._pendingDecorators=null,gi("decorator",t,true,v)),function(t,e,n){const r=To(e),i=To(n);r!==i&&gi("textcontent",t,true,i);}(t,e||o,n),gi("update",t,true,{dirtyElements:y,dirtyLeaves:p,editorState:n,mutatedNodes:_,normalizedNodes:m,prevEditorState:e||o,tags:x}),function(t,e){if(t._deferred=[],0!==e.length){const n=t._updating;t._updating=true;try{for(let t=0;t<e.length;t++)e[t]();}finally{t._updating=n;}}}(t,C),function(t){const e=t._updates;if(0!==e.length){const n=e.shift();if(n){const[e,r]=n;pi(t,e,r);}}}(t);}function gi(t,e,n,...r){const i=e._updating;e._updating=n;try{const n=Array.from(e._listeners[t]);for(let t=0;t<n.length;t++)n[t].apply(null,r);}finally{e._updating=i;}}function _i(e,n){const r=e._updates;let i=n||false;for(;0!==r.length;){const n=r.shift();if(n){const[r,o]=n,s=e._pendingEditorState;let l;void 0!==o&&(l=o.onUpdate,o.skipTransforms&&(i=true),o.discrete&&(null===s&&t(191),s._flushSync=true),l&&e._deferred.push(l),ai(e,o.tag)),null==s?pi(e,r,o):r();}}return i}function pi(e,n,r){const i=e._updateTags;let o,s=false,l=false;void 0!==r&&(o=r.onUpdate,ai(e,r.tag),s=r.skipTransforms||false,l=r.discrete||false),o&&e._deferred.push(o);const c=e._editorState;let a=e._pendingEditorState,u=false;(null===a||a._readOnly)&&(a=e._pendingEditorState=wi(a||c),u=true),a._flushSync=l;const f=qr,d=Gr,h=Hr,g=e._updating;qr=a,Gr=false,e._updating=true,Hr=e;const _=e._headless||null===e.getRootElement();Yi(null);try{u&&(_?null!==c._selection&&(a._selection=c._selection.clone()):a._selection=function(t,e){const n=t.getEditorState()._selection,r=ps(ss(t));return yr(n)||null==n?Fr(n,r,t,e):n.clone()}(e,r&&r.event||null));const i=e._compositionKey;n(),s=_i(e,s),function(t,e){const n=e.getEditorState()._selection,r=t._selection;if(yr(r)){const t=r.anchor,e=r.focus;let i;if("text"===t.type&&(i=t.getNode(),i.selectionTransform(n,r)),"text"===e.type){const t=e.getNode();i!==t&&t.selectionTransform(n,r);}}}(a,e),0!==e._dirtyType&&(s?function(t,e){const n=e._dirtyLeaves,r=t._nodeMap;for(const t of n){const e=r.get(t);lr(e)&&e.isAttached()&&e.isSimpleText()&&!e.isUnmergeable()&&Ct$4(e);}}(a,e):function(t,e){const n=e._dirtyLeaves,r=e._dirtyElements,i=t._nodeMap,o=mo(),s=new Map;let l=n,c=l.size,a=r,u=a.size;for(;c>0||u>0;){if(c>0){e._dirtyLeaves=new Set;for(const t of l){const r=i.get(t);lr(r)&&r.isAttached()&&r.isSimpleText()&&!r.isUnmergeable()&&Ct$4(r),void 0!==r&&ci(r,o)&&li(e,r,s),n.add(t);}if(l=e._dirtyLeaves,c=l.size,c>0){Qr++;continue}}e._dirtyLeaves=new Set,e._dirtyElements=new Map,a.delete("root")&&a.set("root",!0);for(const t of a){const n=t[0],l=t[1];if(r.set(n,l),!l)continue;const c=i.get(n);void 0!==c&&ci(c,o)&&li(e,c,s);}l=e._dirtyLeaves,c=l.size,a=e._dirtyElements,u=a.size,Qr++;}e._dirtyLeaves=n,e._dirtyElements=r;}(a,e),_i(e),function(t,e,n,r){const i=t._nodeMap,o=e._nodeMap,s=[];for(const[t]of r){const e=o.get(t);void 0!==e&&(e.isAttached()||(Si(e)&&Y$4(e,t,i,o,s,r),i.has(t)||r.delete(t),s.push(t)));}for(const t of s)o.delete(t);for(const t of n){const e=o.get(t);void 0===e||e.isAttached()||(i.has(t)||n.delete(t),o.delete(t));}}(c,a,e._dirtyLeaves,e._dirtyElements));i!==e._compositionKey&&(a._flushSync=!0);const o=a._selection;if(yr(o)){const e=a._nodeMap,n=o.anchor.key,r=o.focus.key;void 0!==e.get(n)&&void 0!==e.get(r)||t(19);}else xr(o)&&0===o._nodes.size&&(a._selection=null);}catch(t){return t instanceof Error&&e._onError(t),e._pendingEditorState=c,e._dirtyType=2,e._cloneNotNeeded.clear(),e._dirtyLeaves=new Set,e._dirtyElements.clear(),void hi(e)}finally{qr=f,Gr=d,Hr=h,e._updating=g,Qr=0;}const p=0!==e._dirtyType||e._deferred.length>0||function(t,e){const n=e.getEditorState()._selection,r=t._selection;if(null!==r){if(r.dirty||!r.is(n))return  true}else if(null!==n)return  true;return  false}(a,e);p?a._flushSync?(a._flushSync=false,hi(e)):u&&Qi(()=>{hi(e);}):(a._flushSync=false,u&&(i.clear(),e._deferred=[],e._pendingEditorState=null));}function yi(t,e,n){Hr===t&&void 0===n?e():pi(t,e,n);}class mi{element;before;after;constructor(t,e,n){this.element=t,this.before=e||null,this.after=n||null;}withBefore(t){return new mi(this.element,t,this.after)}withAfter(t){return new mi(this.element,this.before,t)}withElement(t){return this.element===t?this:new mi(t,this.before,this.after)}insertChild(e){const n=this.before||this.getManagedLineBreak();return null!==n&&n.parentElement!==this.element&&t(222),this.element.insertBefore(e,n),this}removeChild(e){return e.parentElement!==this.element&&t(223),this.element.removeChild(e),this}replaceChild(e,n){return n.parentElement!==this.element&&t(224),this.element.replaceChild(e,n),this}getFirstChild(){const t=this.after?this.after.nextSibling:this.element.firstChild;return t===this.before||t===this.getManagedLineBreak()?null:t}getManagedLineBreak(){return this.element.__lexicalLineBreak||null}setManagedLineBreak(t){if(null===t)this.removeManagedLineBreak();else {const e="decorator"===t&&(d||c||l);this.insertManagedLineBreak(e);}}removeManagedLineBreak(){const t=this.getManagedLineBreak();if(t){const e=this.element,n="IMG"===t.nodeName?t.nextSibling:null;n&&e.removeChild(n),e.removeChild(t),e.__lexicalLineBreak=void 0;}}insertManagedLineBreak(t){const e=this.getManagedLineBreak();if(e){if(t===("IMG"===e.nodeName))return;this.removeManagedLineBreak();}const n=this.element,r=this.before,i=document.createElement("br");if(n.insertBefore(i,r),t){const t=document.createElement("img");t.setAttribute("data-lexical-linebreak","true"),t.style.cssText="display: inline !important; border: 0px !important; margin: 0px !important;",t.alt="",n.insertBefore(t,i),n.__lexicalLineBreak=t;}else n.__lexicalLineBreak=i;}getFirstChildOffset(){let t=0;for(let e=this.after;null!==e;e=e.previousSibling)t++;return t}resolveChildIndex(t,e,n,r){if(n===this.element){const e=this.getFirstChildOffset();return [t,Math.min(e+t.getChildrenSize(),Math.max(e,r))]}const i=xi(e,n);i.push(r);const o=xi(e,this.element);let s=t.getIndexWithinParent();for(let t=0;t<o.length;t++){const e=i[t],n=o[t];if(void 0===e||e<n)break;if(e>n){s+=1;break}}return [t.getParentOrThrow(),s]}}function xi(e,n){const r=[];let i=n;for(;i!==e&&null!==i;i=i.parentNode){let t=0;for(let e=i.previousSibling;null!==e;e=e.previousSibling)t++;r.push(t);}return i!==e&&t(225),r.reverse()}class Ci extends Mn{__first;__last;__size;__format;__style;__indent;__dir;__textFormat;__textStyle;constructor(t){super(t),this.__first=null,this.__last=null,this.__size=0,this.__format=0,this.__style="",this.__indent=0,this.__dir=null,this.__textFormat=0,this.__textStyle="";}afterCloneFrom(t){super.afterCloneFrom(t),this.__key===t.__key&&(this.__first=t.__first,this.__last=t.__last,this.__size=t.__size),this.__indent=t.__indent,this.__format=t.__format,this.__style=t.__style,this.__dir=t.__dir,this.__textFormat=t.__textFormat,this.__textStyle=t.__textStyle;}getFormat(){return this.getLatest().__format}getFormatType(){const t=this.getFormat();return J$5[t]||""}getStyle(){return this.getLatest().__style}getIndent(){return this.getLatest().__indent}getChildren(){const t=[];let e=this.getFirstChild();for(;null!==e;)t.push(e),e=e.getNextSibling();return t}getChildrenKeys(){const t=[];let e=this.getFirstChild();for(;null!==e;)t.push(e.__key),e=e.getNextSibling();return t}getChildrenSize(){return this.getLatest().__size}isEmpty(){return 0===this.getChildrenSize()}isDirty(){const t=ii()._dirtyElements;return null!==t&&t.has(this.__key)}isLastChild(){const t=this.getLatest(),e=this.getParentOrThrow().getLastChild();return null!==e&&e.is(t)}getAllTextNodes(){const t=[];let e=this.getFirstChild();for(;null!==e;){if(lr(e)&&t.push(e),Si(e)){const n=e.getAllTextNodes();t.push(...n);}e=e.getNextSibling();}return t}getFirstDescendant(){let t=this.getFirstChild();for(;Si(t);){const e=t.getFirstChild();if(null===e)break;t=e;}return t}getLastDescendant(){let t=this.getLastChild();for(;Si(t);){const e=t.getLastChild();if(null===e)break;t=e;}return t}getDescendantByIndex(t){const e=this.getChildren(),n=e.length;if(t>=n){const t=e[n-1];return Si(t)&&t.getLastDescendant()||t||null}const r=e[t];return Si(r)&&r.getFirstDescendant()||r||null}getFirstChild(){const t=this.getLatest().__first;return null===t?null:xo(t)}getFirstChildOrThrow(){const e=this.getFirstChild();return null===e&&t(45,this.__key),e}getLastChild(){const t=this.getLatest().__last;return null===t?null:xo(t)}getLastChildOrThrow(){const e=this.getLastChild();return null===e&&t(96,this.__key),e}getChildAtIndex(t){const e=this.getChildrenSize();let n,r;if(t<e/2){for(n=this.getFirstChild(),r=0;null!==n&&r<=t;){if(r===t)return n;n=n.getNextSibling(),r++;}return null}for(n=this.getLastChild(),r=e-1;null!==n&&r>=t;){if(r===t)return n;n=n.getPreviousSibling(),r--;}return null}getTextContent(){let t="";const e=this.getChildren(),n=e.length;for(let r=0;r<n;r++){const i=e[r];t+=i.getTextContent(),Si(i)&&r!==n-1&&!i.isInline()&&(t+=D$4);}return t}getTextContentSize(){let t=0;const e=this.getChildren(),n=e.length;for(let r=0;r<n;r++){const i=e[r];t+=i.getTextContentSize(),Si(i)&&r!==n-1&&!i.isInline()&&(t+=2);}return t}getDirection(){return this.getLatest().__dir}getTextFormat(){return this.getLatest().__textFormat}hasFormat(t){if(""!==t){const e=W$6[t];return 0!==(this.getFormat()&e)}return  false}hasTextFormat(t){const e=R$5[t];return 0!==(this.getTextFormat()&e)}getFormatFlags(t,e){return fo(this.getLatest().__textFormat,t,e)}getTextStyle(){return this.getLatest().__textStyle}select(t,e){ei();const n=Lr();let r=t,i=e;const o=this.getChildrenSize();if(!this.canBeEmpty())if(0===t&&0===e){const t=this.getFirstChild();if(lr(t)||Si(t))return t.select(0,0)}else if(!(void 0!==t&&t!==o||void 0!==e&&e!==o)){const t=this.getLastChild();if(lr(t)||Si(t))return t.select()} void 0===r&&(r=o),void 0===i&&(i=o);const s=this.__key;return yr(n)?(n.anchor.set(s,r,"element"),n.focus.set(s,i,"element"),n.dirty=true,n):Mr(s,r,s,i,"element","element")}selectStart(){const t=this.getFirstDescendant();return t?t.selectStart():this.select()}selectEnd(){const t=this.getLastDescendant();return t?t.selectEnd():this.select()}clear(){const t=this.getWritable();return this.getChildren().forEach(t=>t.remove()),t}append(...t){return this.splice(this.getChildrenSize(),0,t)}setDirection(t){const e=this.getWritable();return e.__dir=t,e}setFormat(t){return this.getWritable().__format=""!==t?W$6[t]:0,this}setStyle(t){return this.getWritable().__style=t||"",this}setTextFormat(t){const e=this.getWritable();return e.__textFormat=t,e}setTextStyle(t){const e=this.getWritable();return e.__textStyle=t,e}setIndent(t){return this.getWritable().__indent=t,this}splice(e,n,r){On(this)&&t(324,this.__key,this.__type);const i=this.getChildrenSize(),o=this.getWritable();e+n<=i||t(226,String(e),String(n),String(i));const s=o.__key,l=[],c=[],a=this.getChildAtIndex(e+n);let u=null,f=i-n+r.length;if(0!==e)if(e===i)u=this.getLastChild();else {const t=this.getChildAtIndex(e);null!==t&&(u=t.getPreviousSibling());}if(n>0){let e=null===u?this.getFirstChild():u.getNextSibling();for(let r=0;r<n;r++){null===e&&t(100);const n=e.getNextSibling(),r=e.__key;_o(e.getWritable()),c.push(r),e=n;}}let d=u;for(const e of r){null!==d&&e.is(d)&&(u=d=d.getPreviousSibling());const n=e.getWritable();n.__parent===s&&f--,_o(n);const r=e.__key;if(null===d)o.__first=r,n.__prev=null;else {const t=d.getWritable();t.__next=r,n.__prev=t.__key;}e.__key===s&&t(76),n.__parent=s,l.push(r),d=e;}if(e+n===i){if(null!==d){d.getWritable().__next=null,o.__last=d.__key;}}else if(null!==a){const t=a.getWritable();if(null!==d){const e=d.getWritable();t.__prev=d.__key,e.__next=a.__key;}else t.__prev=null;}if(o.__size=f,c.length){const t=Lr();if(yr(t)){const e=new Set(c),n=new Set(l),{anchor:r,focus:i}=t;vi(r,e,n)&&Rr(r,r.getNode(),this,u,a),vi(i,e,n)&&Rr(i,i.getNode(),this,u,a),0!==f||this.canBeEmpty()||as(this)||this.remove();}}return o}getDOMSlot(t){return new mi(t)}exportDOM(t){const{element:e}=super.exportDOM(t);if(Cs(e)){const t=this.getIndent();t>0&&(e.style.paddingInlineStart=40*t+"px");const n=this.getDirection();n&&(e.dir=n);}return {element:e}}exportJSON(){const t={children:[],direction:this.getDirection(),format:this.getFormatType(),indent:this.getIndent(),...super.exportJSON()},e=this.getTextFormat(),n=this.getTextStyle();return 0!==e&&(t.textFormat=e),""!==n&&(t.textStyle=n),t}updateFromJSON(t){return super.updateFromJSON(t).setFormat(t.format).setIndent(t.indent).setDirection(t.direction).setTextFormat(t.textFormat||0).setTextStyle(t.textStyle||"")}insertNewAfter(t,e){return null}canIndent(){return  true}collapseAtStart(t){return  false}excludeFromCopy(t){return  false}canReplaceWith(t){return  true}canInsertAfter(t){return  true}canBeEmpty(){return  true}canInsertTextBefore(){return  true}canInsertTextAfter(){return  true}isInline(){return  false}isShadowRoot(){return  false}canMergeWith(t){return  false}extractWithChild(t,e,n){return  false}canMergeWhenEmpty(){return  false}reconcileObservedMutation(t,e){const n=this.getDOMSlot(t);let r=n.getFirstChild();for(let t=this.getFirstChild();t;t=t.getNextSibling()){const i=e.getElementByKey(t.getKey());null!==i&&(null==r?(n.insertChild(i),r=i):r!==i&&n.replaceChild(i,r),r=r.nextSibling);}}}function Si(t){return t instanceof Ci}function vi(t,e,n){let r=t.getNode();for(;r;){const t=r.__key;if(e.has(t)&&!n.has(t))return  true;r=r.getParent();}return  false}class ki extends Mn{decorate(t,e){return null}isIsolated(){return  false}isInline(){return  true}isKeyboardSelectable(){return  true}}function Ti(t){return t instanceof ki}class Ni extends Ci{__cachedText;static getType(){return "root"}static clone(){return new Ni}constructor(){super("root"),this.__cachedText=null;}getTopLevelElementOrThrow(){t(51);}getTextContent(){const t=this.__cachedText;return !ti()&&0!==ii()._dirtyType||null===t?super.getTextContent():t}remove(){t(52);}replace(e){t(53);}insertBefore(e){t(54);}insertAfter(e){t(55);}updateDOM(t,e){return  false}splice(e,n,r){for(const e of r)Si(e)||Ti(e)||t(282);return super.splice(e,n,r)}static importJSON(t){return No().updateFromJSON(t)}collapseAtStart(){return  true}}function bi(t){return t instanceof Ni}function wi(t){return new Ai(new Map(t._nodeMap))}function Ei(){return new Ai(new Map([["root",new Ni]]))}function Oi(e){const n=e.exportJSON(),r=e.constructor;if(n.type!==r.getType()&&t(130,r.name),Si(e)){const i=n.children;Array.isArray(i)||t(59,r.name);const o=e.getChildren();for(let t=0;t<o.length;t++){const e=Oi(o[t]);i.push(e);}}return n}function Mi(t){return t instanceof Ai}class Ai{_nodeMap;_selection;_flushSync;_readOnly;constructor(t,e){this._nodeMap=t,this._selection=e||null,this._flushSync=false,this._readOnly=false;}isEmpty(){return 1===this._nodeMap.size&&null===this._selection}read(t,e){return di(e&&e.editor||null,this,t)}clone(t){const e=new Ai(this._nodeMap,void 0===t?this._selection:t);return e._readOnly=true,e}toJSON(){return di(null,this,()=>({root:Oi(No())}))}}class Pi extends Ci{static getType(){return "artificial"}createDOM(t){return document.createElement("div")}}class Di extends Ci{static getType(){return "paragraph"}static clone(t){return new Di(t.__key)}createDOM(t){const e=document.createElement("p"),n=$o(t.theme,"paragraph");if(void 0!==n){e.classList.add(...n);}return e}updateDOM(t,e,n){return  false}static importDOM(){return {p:t=>({conversion:Fi,priority:0})}}exportDOM(t){const{element:e}=super.exportDOM(t);if(Cs(e)){this.isEmpty()&&e.append(document.createElement("br"));const t=this.getFormatType();t&&(e.style.textAlign=t);}return {element:e}}static importJSON(t){return Li().updateFromJSON(t)}exportJSON(){return {...super.exportJSON(),textFormat:this.getTextFormat(),textStyle:this.getTextStyle()}}insertNewAfter(t,e){const n=Li();n.setTextFormat(t.format),n.setTextStyle(t.style);const r=this.getDirection();return n.setDirection(r),n.setFormat(this.getFormatType()),n.setStyle(this.getStyle()),this.insertAfter(n,e),n}collapseAtStart(){const t=this.getChildren();if(0===t.length||lr(t[0])&&""===t[0].getTextContent().trim()){if(null!==this.getNextSibling())return this.selectNext(),this.remove(),true;if(null!==this.getPreviousSibling())return this.selectPrevious(),this.remove(),true}return  false}}function Fi(t){const e=Li();return t.style&&(e.setFormat(t.style.textAlign),Ps(t,e)),{node:e}}function Li(){return fs(new Di)}function Ii(t){return t instanceof Di}const Ki=0,zi=1,Ri=2,Bi=3,Wi=4;function Ji(t,e,n,r){const i=t._keyToDOMMap;i.clear(),t._editorState=Ei(),t._pendingEditorState=r,t._compositionKey=null,t._dirtyType=0,t._cloneNotNeeded.clear(),t._dirtyLeaves=new Set,t._dirtyElements.clear(),t._normalizedNodes=new Set,t._updateTags=new Set,t._updates=[],t._blockCursorElement=null;const o=t._observer;null!==o&&(o.disconnect(),t._observer=null),null!==e&&(e.textContent=""),null!==n&&(n.textContent="",i.set("root",n));}function ji(t){const e=new Set,n=new Set;let r=t;for(;r;){const{ownNodeConfig:t}=Is(r),i=r.transform;if(!n.has(i)){n.add(i);const t=r.transform();t&&e.add(t);}if(t){const n=t.$transform;n&&e.add(n),r=t.extends;}else {const t=Object.getPrototypeOf(r);r=t.prototype instanceof Mn&&t!==Mn?t:void 0;}}return e}function $i(t){const e=t||{},n=si(),r=e.theme||{},i=void 0===t?n:e.parentEditor||null,o=e.disableEvents||false,s=Ei(),l=e.namespace||(null!==i?i._config.namespace:Ao()),c=e.editorState,a=[Ni,Xn,Bn,ar,Di,Pi,...e.nodes||[]],{onError:u,html:f}=e,d=void 0===e.editable||e.editable;let h;if(void 0===t&&null!==n)h=n._nodes;else {h=new Map;for(let t=0;t<a.length;t++){let e=a[t],n=null,r=null;if("function"!=typeof e){const t=e;e=t.replace,n=t.with,r=t.withKlass||null;}Is(e);const i=e.getType(),o=ji(e);h.set(i,{exportDOM:f&&f.export?f.export.get(e):void 0,klass:e,replace:n,replaceWithKlass:r,sharedNodeState:at$2(a[t]),transforms:o});}}const g=new Ui(s,i,h,{disableEvents:o,namespace:l,theme:r},u||console.error,function(t,e){const n=new Map,r=new Set,i=t=>{Object.keys(t).forEach(e=>{let r=n.get(e);void 0===r&&(r=[],n.set(e,r)),r.push(t[e]);});};return t.forEach(t=>{const e=t.klass.importDOM;if(null==e||r.has(e))return;r.add(e);const n=e.call(t.klass);null!==n&&i(n);}),e&&i(e),n}(h,f?f.import:void 0),d,t);return void 0!==c&&(g._pendingEditorState=c,g._dirtyType=2),g}class Ui{static version;_headless;_parentEditor;_rootElement;_editorState;_pendingEditorState;_compositionKey;_deferred;_keyToDOMMap;_updates;_updating;_listeners;_commands;_nodes;_decorators;_pendingDecorators;_config;_dirtyType;_cloneNotNeeded;_dirtyLeaves;_dirtyElements;_normalizedNodes;_updateTags;_observer;_key;_onError;_htmlConversions;_window;_editable;_blockCursorElement;_createEditorArgs;constructor(t,e,n,r,i,o,s,l){this._createEditorArgs=l,this._parentEditor=e,this._rootElement=null,this._editorState=t,this._pendingEditorState=null,this._compositionKey=null,this._deferred=[],this._keyToDOMMap=new Map,this._updates=[],this._updating=false,this._listeners={decorator:new Set,editable:new Set,mutation:new Map,root:new Set,textcontent:new Set,update:new Set},this._commands=new Map,this._config=r,this._nodes=n,this._decorators={},this._pendingDecorators=null,this._dirtyType=0,this._cloneNotNeeded=new Set,this._dirtyLeaves=new Set,this._dirtyElements=new Map,this._normalizedNodes=new Set,this._updateTags=new Set,this._observer=null,this._key=Ao(),this._onError=i,this._htmlConversions=o,this._editable=s,this._headless=null!==e&&e._headless,this._window=null,this._blockCursorElement=null;}isComposing(){return null!=this._compositionKey}registerUpdateListener(t){const e=this._listeners.update;return e.add(t),()=>{e.delete(t);}}registerEditableListener(t){const e=this._listeners.editable;return e.add(t),()=>{e.delete(t);}}registerDecoratorListener(t){const e=this._listeners.decorator;return e.add(t),()=>{e.delete(t);}}registerTextContentListener(t){const e=this._listeners.textcontent;return e.add(t),()=>{e.delete(t);}}registerRootListener(t){const e=this._listeners.root;return t(this._rootElement,null),e.add(t),()=>{t(null,this._rootElement),e.delete(t);}}registerCommand(e,n,r){ void 0===r&&t(35);const i=this._commands;i.has(e)||i.set(e,[new Set,new Set,new Set,new Set,new Set]);const o=i.get(e);void 0===o&&t(36,String(e));const s=o[r];return s.add(n),()=>{s.delete(n),o.every(t=>0===t.size)&&i.delete(e);}}registerMutationListener(t,e,n){const r=this.resolveRegisteredNodeAfterReplacements(this.getRegisteredNode(t)).klass,i=this._listeners.mutation;let o=i.get(e);void 0===o&&(o=new Set,i.set(e,o)),o.add(r);const s=n&&n.skipInitialization;return void 0!==s&&s||this.initializeMutationListener(e,r),()=>{o.delete(r),0===o.size&&i.delete(e);}}getRegisteredNode(e){const n=this._nodes.get(e.getType());return void 0===n&&t(37,e.name),n}resolveRegisteredNodeAfterReplacements(t){for(;t.replaceWithKlass;)t=this.getRegisteredNode(t.replaceWithKlass);return t}initializeMutationListener(t,e){const n=this._editorState,r=Os(n).get(e.getType());if(!r)return;const i=new Map;for(const t of r.keys())i.set(t,"created");i.size>0&&t(i,{dirtyLeaves:new Set,prevEditorState:n,updateTags:new Set(["registerMutationListener"])});}registerNodeTransformToKlass(t,e){const n=this.getRegisteredNode(t);return n.transforms.add(e),n}registerNodeTransform(t,e){const n=this.registerNodeTransformToKlass(t,e),r=[n],i=n.replaceWithKlass;if(null!=i){const t=this.registerNodeTransformToKlass(i,e);r.push(t);}return function(t,e){const n=Os(t.getEditorState()),r=[];for(const t of e){const e=n.get(t);e&&r.push(e);}if(0===r.length)return;t.update(()=>{for(const t of r)for(const e of t.keys()){const t=xo(e);t&&t.markDirty();}},null===t._pendingEditorState?{tag:Dn}:void 0);}(this,r.map(t=>t.klass.getType())),()=>{r.forEach(t=>t.transforms.delete(e));}}hasNode(t){return this._nodes.has(t.getType())}hasNodes(t){return t.every(this.hasNode.bind(this))}dispatchCommand(t,e){return Go(this,t,e)}getDecorators(){return this._decorators}getRootElement(){return this._rootElement}getKey(){return this._key}setRootElement(t){const e=this._rootElement;if(t!==e){const n=$o(this._config.theme,"root"),r=this._pendingEditorState||this._editorState;if(this._rootElement=t,Ji(this,e,t,r),null!==e&&(this._config.disableEvents||Nn(e),null!=n&&e.classList.remove(...n)),null!==t){const e=os(t),r=t.style;r.userSelect="text",r.whiteSpace="pre-wrap",r.wordBreak="break-word",t.setAttribute("data-lexical-editor","true"),this._window=e,this._dirtyType=2,rt$3(this),this._updateTags.add(Dn),hi(this),this._config.disableEvents||function(t,e){const n=t.ownerDocument;en.set(t,n);const r=nn.get(n)??0;r<1&&n.addEventListener("selectionchange",Sn),nn.set(n,r+1),t.__lexicalEditor=e;const i=xn(t);for(let n=0;n<Ge$1.length;n++){const[r,o]=Ge$1[n],s="function"==typeof o?t=>{kn(t)||(vn(t),(e.isEditable()||"click"===r)&&o(t,e));}:t=>{if(kn(t))return;vn(t);const n=e.isEditable();switch(r){case "cut":return n&&Go(e,Be$1,t);case "copy":return Go(e,Re$1,t);case "paste":return n&&Go(e,fe$1,t);case "dragstart":return n&&Go(e,Ie$1,t);case "dragover":return n&&Go(e,Ke$1,t);case "dragend":return n&&Go(e,ze$1,t);case "focus":return n&&Go(e,Ve$1,t);case "blur":return n&&Go(e,Ye,t);case "drop":return n&&Go(e,Fe$1,t)}};t.addEventListener(r,s),i.push(()=>{t.removeEventListener(r,s);});}}(t,this),null!=n&&t.classList.add(...n);}else this._window=null,this._updateTags.add(Dn),hi(this);gi("root",this,false,t,e);}}getElementByKey(t){return this._keyToDOMMap.get(t)||null}getEditorState(){return this._editorState}setEditorState(e,n){e.isEmpty()&&t(38);let r=e;r._readOnly&&(r=wi(e),r._selection=e._selection?e._selection.clone():null),nt$4(this);const i=this._pendingEditorState,o=this._updateTags,s=void 0!==n?n.tag:null;null===i||i.isEmpty()||(null!=s&&o.add(s),hi(this)),this._pendingEditorState=r,this._dirtyType=2,this._dirtyElements.set("root",false),this._compositionKey=null,null!=s&&o.add(s),this._updating||hi(this);}parseEditorState(t,e){return function(t,e,n){const r=Ei(),i=qr,o=Gr,s=Hr,l=e._dirtyElements,c=e._dirtyLeaves,a=e._cloneNotNeeded,u=e._dirtyType;e._dirtyElements=new Map,e._dirtyLeaves=new Set,e._cloneNotNeeded=new Set,e._dirtyType=0,qr=r,Gr=false,Hr=e,Yi(null);try{const i=e._nodes;fi(t.root,i),n&&n(),r._readOnly=!0;}catch(t){t instanceof Error&&e._onError(t);}finally{e._dirtyElements=l,e._dirtyLeaves=c,e._cloneNotNeeded=a,e._dirtyType=u,qr=i,Gr=o,Hr=s;}return r}("string"==typeof t?JSON.parse(t):t,this,e)}read(t){return hi(this),this.getEditorState().read(t,{editor:this})}update(t,e){!function(t,e,n){t._updating?t._updates.push([e,n]):pi(t,e,n);}(this,t,e);}focus(t,e={}){const n=this._rootElement;null!==n&&(n.setAttribute("autocapitalize","off"),yi(this,()=>{const r=Lr(),i=No();null!==r?r.dirty||wo(r.clone()):0!==i.getChildrenSize()&&("rootStart"===e.defaultSelection?i.selectStart():i.selectEnd()),ns("focus"),rs(()=>{n.removeAttribute("autocapitalize"),t&&t();});}),null===this._pendingEditorState&&n.removeAttribute("autocapitalize"));}blur(){const t=this._rootElement;null!==t&&t.blur();const e=ps(this._window);null!==e&&e.removeAllRanges();}isEditable(){return this._editable}setEditable(t){this._editable!==t&&(this._editable=t,gi("editable",this,true,t));}toJSON(){return {editorState:this._editorState.toJSON()}}}Ui.version="0.38.2+prod.esm";let Vi=null;function Yi(t){Vi=t;}let qi=1;function Gi(e,n){const r=Xi(e,n);return void 0===r&&t(30,n),r}function Xi(t,e){return t._nodes.get(e)}const Qi="function"==typeof queueMicrotask?queueMicrotask:t=>{Promise.resolve().then(t);};function Zi(t){return Ti(vo(t))}function to(t){const e=document.activeElement;if(!Cs(e))return  false;const n=e.nodeName;return Ti(vo(t))&&("INPUT"===n||"TEXTAREA"===n||"true"===e.contentEditable&&null==io(e))}function eo(t,e,n){const r=t.getRootElement();try{return null!==r&&r.contains(e)&&r.contains(n)&&null!==e&&!to(e)&&ro(e)===t}catch(t){return  false}}function no(t){return t instanceof Ui}function ro(t){let e=t;for(;null!=e;){const t=io(e);if(no(t))return t;e=Zo(e);}return null}function io(t){return t?t.__lexicalEditor:null}function oo(t){return K$5.test(t)?"rtl":z$4.test(t)?"ltr":null}function so(t){return fr(t)||t.isToken()}function lo(t){return so(t)||t.isSegmented()}function co(t){return Ss(t)&&3===t.nodeType}function ao(t){return Ss(t)&&9===t.nodeType}function uo(t){let e=t;for(;null!=e;){if(co(e))return e;e=e.firstChild;}return null}function fo(t,e,n){const r=R$5[e];if(null!==n&&(t&r)===(n&r))return t;let i=t^r;return "subscript"===e?i&=-65:"superscript"===e?i&=-33:"lowercase"===e?(i&=-513,i&=-1025):"uppercase"===e?(i&=-257,i&=-1025):"capitalize"===e&&(i&=-257,i&=-513),i}function ho(t){return lr(t)||jn(t)||Ti(t)}function go(t,e){const n=function(){const t=Vi;return Vi=null,t}();if(null!=(e=e||n&&n.__key))return void(t.__key=e);ei(),ni();const r=ii(),i=ri(),o=""+qi++;i._nodeMap.set(o,t),Si(t)?r._dirtyElements.set(o,true):r._dirtyLeaves.add(o),r._cloneNotNeeded.add(o),r._dirtyType=1,t.__key=o;}function _o(t){const e=t.getParent();if(null!==e){const n=t.getWritable(),r=e.getWritable(),i=t.getPreviousSibling(),o=t.getNextSibling(),s=null!==o?o.__key:null,l=null!==i?i.__key:null,c=null!==i?i.getWritable():null,a=null!==o?o.getWritable():null;null===i&&(r.__first=s),null===o&&(r.__last=l),null!==c&&(c.__next=s),null!==a&&(a.__prev=l),n.__prev=null,n.__next=null,n.__parent=null,r.__size--;}}function po(e){ni(),On(e)&&t(323,e.__key,e.__type);const n=e.getLatest(),r=n.__parent,i=ri(),o=ii(),s=i._nodeMap,l=o._dirtyElements;null!==r&&function(t,e,n){let r=t;for(;null!==r;){if(n.has(r))return;const t=e.get(r);if(void 0===t)break;n.set(r,false),r=t.__parent;}}(r,s,l);const c=n.__key;o._dirtyType=1,Si(e)?l.set(c,true):o._dirtyLeaves.add(c);}function yo(t){ei();const e=ii(),n=e._compositionKey;if(t!==n){if(e._compositionKey=t,null!==n){const t=xo(n);null!==t&&t.getWritable();}if(null!==t){const e=xo(t);null!==e&&e.getWritable();}}}function mo(){if(ti())return null;return ii()._compositionKey}function xo(t,e){const n=(e||ri())._nodeMap.get(t);return void 0===n?null:n}function Co(t,e){const n=So(t,ii());return void 0!==n?xo(n,e):null}function So(t,e){return t[`__lexicalKey_${e._key}`]}function vo(t,e){let n=t;for(;null!=n;){const t=Co(n,e);if(null!==t)return t;n=Zo(n);}return null}function ko(t){const e=t._decorators,n=Object.assign({},e);return t._pendingDecorators=n,n}function To(t){return t.read(()=>No().getTextContent())}function No(){return bo(ri())}function bo(t){return t._nodeMap.get("root")}function wo(t){ei();const e=ri();null!==t&&(t.dirty=true,t.setCachedNodes(null)),e._selection=t;}function Eo(t){const e=ii(),n=function(t,e){let n=t;for(;null!=n;){const t=So(n,e);if(void 0!==t)return t;n=Zo(n);}return null}(t,e);if(null===n){return t===e.getRootElement()?xo("root"):null}return xo(n)}function Oo(t){return /[\uD800-\uDBFF][\uDC00-\uDFFF]/g.test(t)}function Mo(t){const e=[];let n=t;for(;null!==n;)e.push(n),n=n._parentEditor;return e}function Ao(){return Math.random().toString(36).replace(/[^a-z]+/g,"").substring(0,5)}function Po(t){return co(t)?t.nodeValue:null}function Do(t,e,n){const r=ps(ss(e));if(null===r)return;const i=r.anchorNode;let{anchorOffset:o,focusOffset:s}=r;if(null!==i){let e=Po(i);const r=vo(i);if(null!==e&&lr(r)){if(e===P$3&&n){const t=n.length;e=n,o=t,s=t;}null!==e&&Fo(r,e,o,s,t);}}}function Fo(t,e,n,r,i){let o=t;if(o.isAttached()&&(i||!o.isDirty())){const s=o.isComposing();let a=e;(s||i)&&e[e.length-1]===P$3&&(a=e.slice(0,-1));const u=o.getTextContent();if(i||a!==u){if(""===a){if(yo(null),l||c||d)o.remove();else {const t=ii();setTimeout(()=>{t.update(()=>{o.isAttached()&&o.remove();});},20);}return}const e=o.getParent(),i=Ir(),u=o.getTextContentSize(),f=mo(),h=o.getKey();if(o.isToken()||null!==f&&h===f&&!s||yr(i)&&(null!==e&&!e.canInsertTextBefore()&&0===i.anchor.offset||i.anchor.key===t.__key&&0===i.anchor.offset&&!o.canInsertTextBefore()&&!s||i.focus.key===t.__key&&i.focus.offset===u&&!o.canInsertTextAfter()&&!s))return void o.markDirty();const g=Lr();if(!yr(g)||null===n||null===r)return void Lo(o,a,g);if(g.setTextNodeRange(o,n,o,r),o.isSegmented()){const t=sr(o.getTextContent());o.replace(t),o=t;}Lo(o,a,g);}}}function Lo(t,e,n){if(t.setTextContent(e),yr(n)){const e=t.getKey();for(const r of ["anchor","focus"]){const i=n[r];"text"===i.type&&i.key===e&&(i.offset=nl(t,i.offset,"clamp"));}}}function Io(t,e,n){const r=e[n]||false;return "any"===r||r===t[n]}function Ko(t,e){return Io(t,e,"altKey")&&Io(t,e,"ctrlKey")&&Io(t,e,"shiftKey")&&Io(t,e,"metaKey")}function zo(t,e,n){return Ko(t,n)&&t.key.toLowerCase()===e.toLowerCase()}const Ro={ctrlKey:!i,metaKey:i},Bo={altKey:i,ctrlKey:!i};function Wo(t){return "Backspace"===t.key}function Jo(t){return zo(t,"a",Ro)}function jo(t){const e=No();if(yr(t)){const e=t.anchor,n=t.focus,r=e.getNode().getTopLevelElementOrThrow().getParentOrThrow();return e.set(r.getKey(),0,"element"),n.set(r.getKey(),r.getChildrenSize(),"element"),St$5(t),t}{const t=e.select(0,e.getChildrenSize());return wo(St$5(t)),t}}function $o(t,e){ void 0===t.__lexicalClassNameCache&&(t.__lexicalClassNameCache={});const n=t.__lexicalClassNameCache,r=n[e];if(void 0!==r)return r;const i=t[e];if("string"==typeof i){const t=h$1(i);return n[e]=t,t}return i}function Uo(e,n,r,i,o){if(0===r.size)return;const s=i.__type,l=i.__key,c=n.get(s);void 0===c&&t(33,s);const a=c.klass;let u=e.get(a);void 0===u&&(u=new Map,e.set(a,u));const f=u.get(l),d="destroyed"===f&&"created"===o;(void 0===f||d)&&u.set(l,d?"updated":o);}function Yo(t,e,n){const r=t.getParent();let i=n,o=t;return null!==r&&(e&&0===n?(i=o.getIndexWithinParent(),o=r):e||n!==o.getChildrenSize()||(i=o.getIndexWithinParent()+1,o=r)),o.getChildAtIndex(e?i-1:i)}function qo(t,e){const n=t.offset;if("element"===t.type){return Yo(t.getNode(),e,n)}{const r=t.getNode();if(e&&0===n||!e&&n===r.getTextContentSize()){const t=e?r.getPreviousSibling():r.getNextSibling();return null===t?Yo(r.getParentOrThrow(),e,r.getIndexWithinParent()+(e?0:1)):t}}return null}function Ho(t){const e=ss(t).event,n=e&&e.inputType;return "insertFromPaste"===n||"insertFromPasteAsQuotation"===n}function Go(t,e,n){return function(t,e,n){const r=Mo(t);for(let i=4;i>=0;i--)for(let o=0;o<r.length;o++){const s=r[o],l=s._commands.get(e);if(void 0!==l){const e=l[i];if(void 0!==e){const r=Array.from(e),i=r.length;let o=false;if(yi(s,()=>{for(let e=0;e<i;e++)if(r[e](n,t))return void(o=true)}),o)return o}}}return  false}(t,e,n)}function Xo(t){return !bi(t)&&!t.isLastChild()&&!t.isInline()}function Qo(e,n){const r=e._keyToDOMMap.get(n);return void 0===r&&t(75,n),r}function Zo(t){const e=t.assignedSlot||t.parentElement;return vs(e)?e.host:e}function ts(t){return ao(t)?t:Cs(t)?t.ownerDocument:null}function ns(t){ei();ii()._updateTags.add(t);}function rs(t){ei();ii()._deferred.push(t);}function is(t,e){let n=t.getParent();for(;null!==n;){if(n.is(e))return  true;n=n.getParent();}return  false}function os(t){const e=ts(t);return e?e.defaultView:null}function ss(e){const n=e._window;return null===n&&t(78),n}function cs(t){let e=t.getParentOrThrow();for(;null!==e;){if(as(e))return e;e=e.getParentOrThrow();}return e}function as(t){return bi(t)||Si(t)&&t.isShadowRoot()}function fs(e){const n=ii(),r=e.getType(),i=Xi(n,r);void 0===i&&t(200,e.constructor.name,r);const{replace:o,replaceWithKlass:s}=i;if(null!==o){const n=o(e),i=n.constructor;return null!==s?n instanceof s||t(201,s.name,s.getType(),i.name,i.getType(),e.constructor.name,r):n instanceof e.constructor&&i!==e.constructor||t(202,i.name,i.getType(),e.constructor.name,r),n.__key===e.__key&&t(203,e.constructor.name,r,i.name,i.getType()),n}return e}function ds(e,n){!bi(e.getParent())||Si(n)||Ti(n)||t(99);}function hs(e){const n=xo(e);return null===n&&t(63,e),n}function gs(t){return (Ti(t)||Si(t)&&!t.canBeEmpty())&&!t.isInline()}function _s(t,e,n){n.style.removeProperty("caret-color"),e._blockCursorElement=null;const r=t.parentElement;null!==r&&r.removeChild(t);}function ps(t){return n?(t||window).getSelection():null}function ys(t){const e=os(t);return e?e.getSelection():null}function xs(t){return Cs(t)&&"A"===t.tagName}function Cs(t){return Ss(t)&&1===t.nodeType}function Ss(t){return "object"==typeof t&&null!==t&&"nodeType"in t&&"number"==typeof t.nodeType}function vs(t){return Ss(t)&&11===t.nodeType}function ks(t){const e=new RegExp(/^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|mark|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var|#text)$/,"i");return null!==t.nodeName.match(e)}function Ts(t){const e=new RegExp(/^(address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|hr|li|main|nav|noscript|ol|p|pre|section|table|td|tfoot|ul|video)$/,"i");return null!==t.nodeName.match(e)}function Ns(t){if(Ti(t)&&!t.isInline())return  true;if(!Si(t)||as(t))return  false;const e=t.getFirstChild(),n=null===e||jn(e)||lr(e)||e.isInline();return !t.isInline()&&false!==t.canBeEmpty()&&n}function bs(){return ii()}const ws=new WeakMap,Es=new Map;function Os(e){if(!e._readOnly&&e.isEmpty())return Es;e._readOnly||t(192);let n=ws.get(e);return n||(n=function(t){const e=new Map;for(const[n,r]of t._nodeMap){const t=r.__type;let i=e.get(t);i||(i=new Map,e.set(t,i)),i.set(n,r);}return e}(e),ws.set(e,n)),n}function Ms(t){const e=t.constructor.clone(t);return e.afterCloneFrom(t),e}function As(t){return (e=Ms(t))[En]=true,e;var e;}function Ps(t,e){const n=parseInt(t.style.paddingInlineStart,10)||0,r=Math.round(n/40);e.setIndent(r);}function Fs(t){return  true===t.__lexicalUnmanaged}function Ls(t,e){return function(t,e){return Object.prototype.hasOwnProperty.call(t,e)}(t,e)&&t[e]!==Mn[e]}function Is(e){const n=V$5 in e.prototype?e.prototype[V$5]():void 0,r=function(e){if(!(e===Mn||e.prototype instanceof Mn)){let n="<unknown>",r="<unknown>";try{n=e.getType();}catch(t){}try{Ui.version&&(r=JSON.parse(Ui.version));}catch(t){}t(290,e.name,n,r);}return e===ki||e===Ci||e===Mn}(e),i=!r&&Ls(e,"getType")?e.getType():void 0;let o,s=i;if(n)if(i)o=n[i];else for(const[t,e]of Object.entries(n))s=t,o=e;if(!r&&s&&(Ls(e,"getType")||(e.getType=()=>s),Ls(e,"clone")||(e.clone=t=>(Yi(t),new e)),Ls(e,"importJSON")||(e.importJSON=o&&o.$importJSON||(t=>(new e).updateFromJSON(t))),!Ls(e,"importDOM")&&o)){const{importDOM:t}=o;t&&(e.importDOM=()=>t);}return {ownNodeConfig:o,ownNodeType:s}}function Ks(t){const e=bs();ei();return new(e.resolveRegisteredNodeAfterReplacements(e.getRegisteredNode(t)).klass)}const zs=(t,e)=>{let n=t;for(;null!=n&&!bi(n);){if(e(n))return n;n=n.getParent();}return null},Rs={next:"previous",previous:"next"};class Bs{origin;constructor(t){this.origin=t;}[Symbol.iterator](){return hl({hasNext:Hs,initial:this.getAdjacentCaret(),map:t=>t,step:t=>t.getAdjacentCaret()})}getAdjacentCaret(){return tl(this.getNodeAtCaret(),this.direction)}getSiblingCaret(){return tl(this.origin,this.direction)}remove(){const t=this.getNodeAtCaret();return t&&t.remove(),this}replaceOrInsert(t,e){const n=this.getNodeAtCaret();return t.is(this.origin)||t.is(n)||(null===n?this.insert(t):n.replace(t,e)),this}splice(e,n,r="next"){const i=r===this.direction?n:Array.from(n).reverse();let o=this;const s=this.getParentAtCaret(),l=new Map;for(let t=o.getAdjacentCaret();null!==t&&l.size<e;t=t.getAdjacentCaret()){const e=t.origin.getWritable();l.set(e.getKey(),e);}for(const e of i){if(l.size>0){const n=o.getNodeAtCaret();if(n)if(l.delete(n.getKey()),l.delete(e.getKey()),n.is(e)||o.origin.is(e));else {const t=e.getParent();t&&t.is(s)&&e.remove(),n.replace(e);}else null===n&&t(263,Array.from(l).join(" "));}else o.insert(e);o=tl(e,this.direction);}for(const t of l.values())t.remove();return this}}class Ws extends Bs{type="child";getLatest(){const t=this.origin.getLatest();return t===this.origin?this:il(t,this.direction)}getParentCaret(t="root"){return tl($s(this.getParentAtCaret(),t),this.direction)}getFlipped(){const t=js(this.direction);return tl(this.getNodeAtCaret(),t)||il(this.origin,t)}getParentAtCaret(){return this.origin}getChildCaret(){return this}isSameNodeCaret(t){return t instanceof Ws&&this.direction===t.direction&&this.origin.is(t.origin)}isSamePointCaret(t){return this.isSameNodeCaret(t)}}const Js={root:bi,shadowRoot:as};function js(t){return Rs[t]}function $s(t,e="root"){return Js[e](t)?null:t}class Us extends Bs{type="sibling";getLatest(){const t=this.origin.getLatest();return t===this.origin?this:tl(t,this.direction)}getSiblingCaret(){return this}getParentAtCaret(){return this.origin.getParent()}getChildCaret(){return Si(this.origin)?il(this.origin,this.direction):null}getParentCaret(t="root"){return tl($s(this.getParentAtCaret(),t),this.direction)}getFlipped(){const t=js(this.direction);return tl(this.getNodeAtCaret(),t)||il(this.origin.getParentOrThrow(),t)}isSamePointCaret(t){return t instanceof Us&&this.direction===t.direction&&this.origin.is(t.origin)}isSameNodeCaret(t){return (t instanceof Us||t instanceof Vs)&&this.direction===t.direction&&this.origin.is(t.origin)}}class Vs extends Bs{type="text";offset;constructor(t,e){super(t),this.offset=e;}getLatest(){const t=this.origin.getLatest();return t===this.origin?this:el(t,this.direction,this.offset)}getParentAtCaret(){return this.origin.getParent()}getChildCaret(){return null}getParentCaret(t="root"){return tl($s(this.getParentAtCaret(),t),this.direction)}getFlipped(){return el(this.origin,js(this.direction),this.offset)}isSamePointCaret(t){return t instanceof Vs&&this.direction===t.direction&&this.origin.is(t.origin)&&this.offset===t.offset}isSameNodeCaret(t){return (t instanceof Us||t instanceof Vs)&&this.direction===t.direction&&this.origin.is(t.origin)}getSiblingCaret(){return tl(this.origin,this.direction)}}function Ys(t){return t instanceof Vs}function Hs(t){return t instanceof Us}function Gs(t){return t instanceof Ws}const Xs={next:class extends Vs{direction="next";getNodeAtCaret(){return this.origin.getNextSibling()}insert(t){return this.origin.insertAfter(t),this}},previous:class extends Vs{direction="previous";getNodeAtCaret(){return this.origin.getPreviousSibling()}insert(t){return this.origin.insertBefore(t),this}}},Qs={next:class extends Us{direction="next";getNodeAtCaret(){return this.origin.getNextSibling()}insert(t){return this.origin.insertAfter(t),this}},previous:class extends Us{direction="previous";getNodeAtCaret(){return this.origin.getPreviousSibling()}insert(t){return this.origin.insertBefore(t),this}}},Zs={next:class extends Ws{direction="next";getNodeAtCaret(){return this.origin.getFirstChild()}insert(t){return this.origin.splice(0,0,[t]),this}},previous:class extends Ws{direction="previous";getNodeAtCaret(){return this.origin.getLastChild()}insert(t){return this.origin.splice(this.origin.getChildrenSize(),0,[t]),this}}};function tl(t,e){return t?new Qs[e](t):null}function el(t,e,n){return t?new Xs[e](t,nl(t,n)):null}function nl(t,n,r="error"){const i=t.getTextContentSize();let o="next"===n?i:"previous"===n?0:n;return (o<0||o>i)&&("clamp"!==r&&e(284,String(n),String(i),t.getKey()),o=o<0?0:i),o}function rl(t,e){return new cl(t,e)}function il(t,e){return Si(t)?new Zs[e](t):null}function ol(t){return t&&t.getChildCaret()||t}function sl(t){return t&&ol(t.getAdjacentCaret())}class ll{type="node-caret-range";direction;anchor;focus;constructor(t,e,n){this.anchor=t,this.focus=e,this.direction=n;}getLatest(){const t=this.anchor.getLatest(),e=this.focus.getLatest();return t===this.anchor&&e===this.focus?this:new ll(t,e,this.direction)}isCollapsed(){return this.anchor.isSamePointCaret(this.focus)}getTextSlices(){const t=t=>{const e=this[t].getLatest();return Ys(e)?function(t,e){const{direction:n,origin:r}=t,i=nl(r,"focus"===e?js(n):n);return rl(t,i-t.offset)}(e,t):null},e=t("anchor"),n=t("focus");if(e&&n){const{caret:t}=e,{caret:r}=n;if(t.isSameNodeCaret(r))return [rl(t,r.offset-t.offset),null]}return [e,n]}iterNodeCarets(t="root"){const e=Ys(this.anchor)?this.anchor.getSiblingCaret():this.anchor.getLatest(),n=this.focus.getLatest(),r=Ys(n),i=e=>e.isSameNodeCaret(n)?null:sl(e)||e.getParentCaret(t);return hl({hasNext:t=>null!==t&&!(r&&n.isSameNodeCaret(t)),initial:e.isSameNodeCaret(n)?null:i(e),map:t=>t,step:i})}[Symbol.iterator](){return this.iterNodeCarets("root")}}class cl{type="slice";caret;distance;constructor(t,e){this.caret=t,this.distance=e;}getSliceIndices(){const{distance:t,caret:{offset:e}}=this,n=e+t;return n<e?[n,e]:[e,n]}getTextContent(){const[t,e]=this.getSliceIndices();return this.caret.origin.getTextContent().slice(t,e)}getTextContentSize(){return Math.abs(this.distance)}removeTextSlice(){const{caret:{origin:t,direction:e}}=this,[n,r]=this.getSliceIndices(),i=t.getTextContent();return el(t.setTextContent(i.slice(0,n)+i.slice(r)),e,n)}}function ul(t){return dl(t,tl(No(),t.direction))}function fl(t){return dl(t,t)}function dl(e,n){return e.direction!==n.direction&&t(265),new ll(e,n,e.direction)}function hl(t){const{initial:e,hasNext:n,step:r,map:i}=t;let o=e;return {[Symbol.iterator](){return this},next(){if(!n(o))return {done:true,value:void 0};const t={done:false,value:i(o)};return o=r(o),t}}}function gl(e,n){const r=ml(e.origin,n.origin);switch(null===r&&t(275,e.origin.getKey(),n.origin.getKey()),r.type){case "same":{const t="text"===e.type,r="text"===n.type;return t&&r?function(t,e){return Math.sign(t-e)}(e.offset,n.offset):e.type===n.type?0:t?-1:r?1:"child"===e.type?-1:1}case "ancestor":return "child"===e.type?-1:1;case "descendant":return "child"===n.type?1:-1;case "branch":return _l(r)}}function _l(t){const{a:e,b:n}=t,r=e.__key,i=n.__key;let o=e,s=n;for(;o&&s;o=o.getNextSibling(),s=s.getNextSibling()){if(o.__key===i)return  -1;if(s.__key===r)return 1}return null===o?1:-1}function pl(t,e){return e.is(t)}function yl(t){return Si(t)?[t.getLatest(),null]:[t.getParent(),t.getLatest()]}function ml(e,n){if(e.is(n))return {commonAncestor:e,type:"same"};const r=new Map;for(let[t,n]=yl(e);t;n=t,t=t.getParent())r.set(t,n);for(let[i,o]=yl(n);i;o=i,i=i.getParent()){const s=r.get(i);if(void 0!==s)return null===s?(pl(e,i)||t(276),{commonAncestor:i,type:"ancestor"}):null===o?(pl(n,i)||t(277),{commonAncestor:i,type:"descendant"}):((Si(s)||pl(e,s))&&(Si(o)||pl(n,o))&&i.is(s.getParent())&&i.is(o.getParent())||t(278),{a:s,b:o,commonAncestor:i,type:"branch"})}return null}function xl(e,n){const{type:r,key:i,offset:o}=e,s=hs(e.key);return "text"===r?(lr(s)||t(266,s.getType(),i),el(s,n,o)):(Si(s)||t(267,s.getType(),i),Pl(s,e.offset,n))}function Cl(e,n){const{origin:r,direction:i}=n,o="next"===i;Ys(n)?e.set(r.getKey(),n.offset,"text"):Hs(n)?lr(r)?e.set(r.getKey(),nl(r,i),"text"):e.set(r.getParentOrThrow().getKey(),r.getIndexWithinParent()+(o?1:0),"element"):(Gs(n)&&Si(r)||t(268),e.set(r.getKey(),o?0:r.getChildrenSize(),"element"));}function Sl(t){const e=Lr(),n=yr(e)?e:Ar();return vl(n,t),wo(n),n}function vl(t,e){Cl(t.anchor,e.anchor),Cl(t.focus,e.focus);}function kl(t){const{anchor:e,focus:n}=t,r=xl(e,"next"),i=xl(n,"next"),o=gl(r,i)<=0?"next":"previous";return dl(Ml(r,o),Ml(i,o))}function Tl(t){const{direction:e,origin:n}=t,r=tl(n,js(e)).getNodeAtCaret();return r?tl(r,e):il(n.getParentOrThrow(),e)}function Nl(t,e="root"){const n=[t];for(let r=Gs(t)?t.getParentCaret(e):t.getSiblingCaret();null!==r;r=r.getParentCaret(e))n.push(Tl(r));return n}function bl(t){return !!t&&t.origin.isAttached()}function wl(e,n="removeEmptySlices"){if(e.isCollapsed())return e;const r="root",i="next";let o=n;const s=Al(e,i),l=Nl(s.anchor,r),c=Nl(s.focus.getFlipped(),r),a=new Set,u=[];for(const t of s.iterNodeCarets(r))if(Gs(t))a.add(t.origin.getKey());else if(Hs(t)){const{origin:e}=t;Si(e)&&!a.has(e.getKey())||u.push(e);}for(const t of u)t.remove();for(const t of s.getTextSlices()){if(!t)continue;const{origin:e}=t.caret,n=e.getTextContentSize(),r=Tl(tl(e,i)),s=e.getMode();if(Math.abs(t.distance)===n&&"removeEmptySlices"===o||"token"===s&&0!==t.distance)r.remove();else if(0!==t.distance){o="removeEmptySlices";let e=t.removeTextSlice();const n=t.caret.origin;if("segmented"===s){const t=e.origin,n=sr(t.getTextContent()).setStyle(t.getStyle()).setFormat(t.getFormat());r.replaceOrInsert(n),e=el(n,i,e.offset);}n.is(l[0].origin)&&(l[0]=e),n.is(c[0].origin)&&(c[0]=e.getFlipped());}}let f,d;for(const t of l)if(bl(t)){f=El(t);break}for(const t of c)if(bl(t)){d=El(t);break}const h=function(t,e,n){if(!t||!e)return null;const r=t.getParentAtCaret(),i=e.getParentAtCaret();if(!r||!i)return null;const o=r.getParents().reverse();o.push(r);const s=i.getParents().reverse();s.push(i);const l=Math.min(o.length,s.length);let c;for(c=0;c<l&&o[c]===s[c];c++);const a=(t,e)=>{let n;for(let r=c;r<t.length;r++){const i=t[r];if(as(i))return;!n&&e(i)&&(n=i);}return n},u=a(o,Ns),f=u&&a(s,t=>n.has(t.getKey())&&Ns(t));return u&&f?[u,f]:null}(f,d,a);if(h){const[t,e]=h;il(t,"previous").splice(0,e.getChildren()),e.remove();}const g=[f,d,...l,...c].find(bl);if(g){return fl(Ml(El(g),e.direction))}t(269,JSON.stringify(l.map(t=>t.origin.__key)));}function El(t){const e=function(t){let e=t;for(;Gs(e);){const t=sl(e);if(!Gs(t))break;e=t;}return e}(t.getLatest()),{direction:n}=e;if(lr(e.origin))return Ys(e)?e:el(e.origin,n,n);const r=e.getAdjacentCaret();return Hs(r)&&lr(r.origin)?el(r.origin,n,js(n)):e}function Ol(t){return Ys(t)&&t.offset!==nl(t.origin,t.direction)}function Ml(t,e){return t.direction===e?t:t.getFlipped()}function Al(t,e){return t.direction===e?t:dl(Ml(t.focus,e),Ml(t.anchor,e))}function Pl(t,e,n){let r=il(t,"next");for(let t=0;t<e;t++){const t=r.getAdjacentCaret();if(null===t)break;r=t;}return Ml(r,n)}function Kl(t){return t}function zl(...t){return t}function Bl(t){return t}function Wl(t,e){if(!e||t===e)return t;for(const n in e)if(t[n]!==e[n])return {...t,...e};return t}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function K$4(e,...t){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",e);for(const e of t)o.append("v",e);throw n.search=o.toString(),Error(`Minified Lexical error #${e}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}const P$2=new Map;function F$4(e){const t={};if(!e)return t;const n=e.split(";");for(const e of n)if(""!==e){const[n,o]=e.split(/:([^]+)/);n&&o&&(t[n.trim()]=o.trim());}return t}function b$3(e){let t=P$2.get(e);return void 0===t&&(t=F$4(e),P$2.set(e,t)),t}function R$4(e){let t="";for(const n in e)n&&(t+=`${n}: ${e[n]};`);return t}function O$1(e){const n=bs().getElementByKey(e.getKey());if(null===n)return null;const o=n.ownerDocument.defaultView;return null===o?null:o.getComputedStyle(n)}function z$3(e){return O$1(bi(e)?e:e.getParentOrThrow())}function A$2(e){const t=z$3(e);return null!==t&&"rtl"===t.direction}function M$4(e,t,n="self"){const o=e.getStartEndPoints();if(t.isSelected(e)&&!lo(t)&&null!==o){const[l,r]=o,s=e.isBackward(),i=l.getNode(),c=r.getNode(),f=t.is(i),u=t.is(c);if(f||u){const[o,l]=Sr(e),r=i.is(c),f=t.is(s?c:i),u=t.is(s?i:c);let d,p=0;if(r)p=o>l?l:o,d=o>l?o:l;else if(f){p=s?l:o,d=void 0;}else if(u){p=0,d=s?o:l;}const h=t.__text.slice(p,d);h!==t.__text&&("clone"===n&&(t=As(t)),t.__text=h);}}return t}function $$3(e){const t=e.getStyle(),n=F$4(t);P$2.set(t,n);}function D$3(t,n){(yr(t)?t.isCollapsed():lr(t)||Si(t))||K$4(280);const l=b$3(yr(t)?t.style:lr(t)?t.getStyle():t.getTextStyle()),r=Object.entries(n).reduce((e,[n,o])=>("function"==typeof o?e[n]=o(l[n],t):null===o?delete e[n]:e[n]=o,e),{...l}),s=R$4(r);yr(t)||lr(t)?t.setStyle(s):t.setTextStyle(s),P$2.set(s,r);}function U$5(e,t){if(yr(e)&&e.isCollapsed()){D$3(e,t);const n=e.anchor.getNode();Si(n)&&n.isEmpty()&&D$3(n,t);}j$2(e=>{D$3(e,t);});}function j$2(t){const n=Lr();if(!n)return;const o=new Map,l=e=>o.get(e.getKey())||[0,e.getTextContentSize()];if(yr(n))for(const e of kl(n).getTextSlices())e&&o.set(e.caret.origin.getKey(),e.getSliceIndices());const r=n.getNodes();for(const n of r){if(!lr(n)||!n.canHaveFormat())continue;const[o,r]=l(n);if(r!==o)if(lo(n)||0===o&&r===n.getTextContentSize())t(n);else {t(n.splitText(o,r)[0===o?0:1]);}}yr(n)&&"text"===n.anchor.type&&"text"===n.focus.type&&n.anchor.key===n.focus.key&&H$2(n);}function H$2(e){if(e.isBackward()){const{anchor:t,focus:n}=e,{key:o,offset:l,type:r}=t;t.set(n.key,n.offset,n.type),n.set(o,l,r);}}function Q$4(e){const t=Y$3(e);return null!==t&&"vertical-rl"===t.writingMode}function Y$3(e){const t=e.anchor.getNode();return Si(t)?O$1(t):z$3(t)}function Z$3(e,t){let n=Q$4(e)?!t:t;te(e)&&(n=!n);const l=xl(e.focus,n?"previous":"next");if(Ol(l))return  false;for(const e of ul(l)){if(Gs(e))return !e.origin.isInline();if(!Si(e.origin)){if(Ti(e.origin))return  true;break}}return  false}function ee(e,t,n,o){e.modify(t?"extend":"move",n,o);}function te(e){const t=Y$3(e);return null!==t&&"rtl"===t.direction}function ne(e,t,n){const o=te(e);let l;l=Q$4(e)||o?!n:n,ee(e,t,l,"character");}function oe$1(e,t,n){const o=b$3(e.getStyle());return null!==o&&o[t]||n}function le$1(t,n,o=""){let l=null;const r=t.getNodes(),s=t.anchor,c=t.focus,f=t.isBackward(),u=f?c.offset:s.offset,g=f?c.getNode():s.getNode();if(yr(t)&&t.isCollapsed()&&""!==t.style){const e=b$3(t.style);if(null!==e&&n in e)return e[n]}for(let t=0;t<r.length;t++){const s=r[t];if((0===t||0!==u||!s.is(g))&&lr(s)){const e=oe$1(s,n,o);if(null===l)l=e;else if(l!==e){l="";break}}}return null===l?o:l}

const ALLOWED_HTML_TAGS = [ "a", "action-text-attachment", "b", "blockquote", "br", "code", "em",
  "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "mark", "ol", "p", "pre", "q", "s", "strong", "ul" ];

const ALLOWED_HTML_ATTRIBUTES = [ "alt", "caption", "class", "content", "content-type", "contenteditable",
  "data-direct-upload-id", "data-sgid", "filename", "filesize", "height", "href", "presentation",
  "previewable", "sgid", "src", "style", "title", "url", "width" ];

const ALLOWED_STYLE_PROPERTIES = [ "color", "background-color" ];

function styleFilterHook(_currentNode, hookEvent) {
  if (hookEvent.attrName === "style" && hookEvent.attrValue) {
    const styles = { ...b$3(hookEvent.attrValue) };
    const sanitizedStyles = { };

    for (const property in styles) {
      if (ALLOWED_STYLE_PROPERTIES.includes(property)) {
        sanitizedStyles[property] = styles[property];
      }
    }

    if (Object.keys(sanitizedStyles).length) {
      hookEvent.attrValue = R$4(sanitizedStyles);
    } else {
      hookEvent.keepAttr = false;
    }
  }
}

purify.addHook("uponSanitizeAttribute", styleFilterHook);

purify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "strong" || data.tagName === "em") {
    node.removeAttribute("class");
  }
});

purify.setConfig({
  ALLOWED_TAGS: ALLOWED_HTML_TAGS,
  ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
  SAFE_FOR_XML: false // So that it does not strip attributes that contains serialized HTML (like content)
});

function getNonce() {
  const element = document.head.querySelector("meta[name=csp-nonce]");
  return element?.content
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function R$3(t,...e){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",t);for(const t of e)o.append("v",t);throw n.search=o.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}const T$2="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,B$2=T$2&&"documentMode"in document?document.documentMode:null;!(!T$2||!("InputEvent"in window)||B$2)&&"getTargetRanges"in new window.InputEvent("input");function F$3(...t){const e=[];for(const n of t)if(n&&"string"==typeof n)for(const[t]of n.matchAll(/\S+/g))e.push(t);return e}function U$4(...t){return ()=>{for(let e=t.length-1;e>=0;e--)t[e]();t.length=0;}}function lt$3(t,...e){const n=F$3(...e);n.length>0&&t.classList.add(...n);}function ut$2(t,...e){const n=F$3(...e);n.length>0&&t.classList.remove(...n);}function ft$1(t){return t?t.getAdjacentCaret():null}function wt$4(t,e){let n=t;for(;null!=n;){if(n instanceof e)return n;n=n.getParent();}return null}function xt$4(t){const e=zs(t,t=>Si(t)&&!t.isInline());return Si(e)||R$3(4,t.__key),e}function Lt$3(t,e){return null!==t&&Object.getPrototypeOf(t).constructor.name===e.name}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const T$1=Symbol.for("preact-signals");function B$1(){if(Z$2>1)return void Z$2--;let t,e=false;for(;void 0!==V$4;){let n=V$4;for(V$4=void 0,J$4++;void 0!==n;){const i=n.o;if(n.o=void 0,n.f&=-3,!(8&n.f)&&Y$2(n))try{n.c();}catch(n){e||(t=n,e=true);}n=i;}}if(J$4=0,Z$2--,e)throw t}function F$2(t){if(Z$2>0)return t();Z$2++;try{return t()}finally{B$1();}}let G$3,V$4;function W$5(t){const e=G$3;G$3=void 0;try{return t()}finally{G$3=e;}}let Z$2=0,J$4=0,H$1=0;function q$3(t){if(void 0===G$3)return;let e=t.n;return void 0===e||e.t!==G$3?(e={i:0,S:t,p:G$3.s,n:void 0,t:G$3,e:void 0,x:void 0,r:e},void 0!==G$3.s&&(G$3.s.n=e),G$3.s=e,t.n=e,32&G$3.f&&t.S(e),e):-1===e.i?(e.i=0,void 0!==e.n&&(e.n.p=e.p,void 0!==e.p&&(e.p.n=e.n),e.p=G$3.s,e.n=void 0,G$3.s.n=e,G$3.s=e),e):void 0}function Q$3(t,e){this.v=t,this.i=0,this.n=void 0,this.t=void 0,this.W=null==e?void 0:e.watched,this.Z=null==e?void 0:e.unwatched,this.name=null==e?void 0:e.name;}function X$3(t,e){return new Q$3(t,e)}function Y$2(t){for(let e=t.s;void 0!==e;e=e.n)if(e.S.i!==e.i||!e.S.h()||e.S.i!==e.i)return  true;return  false}function tt$2(t){for(let e=t.s;void 0!==e;e=e.n){const n=e.S.n;if(void 0!==n&&(e.r=n),e.S.n=e,e.i=-1,void 0===e.n){t.s=e;break}}}function et$3(t){let e,n=t.s;for(;void 0!==n;){const t=n.p;-1===n.i?(n.S.U(n),void 0!==t&&(t.n=n.n),void 0!==n.n&&(n.n.p=t)):e=n,n.S.n=n.r,void 0!==n.r&&(n.r=void 0),n=t;}t.s=e;}function nt$3(t,e){Q$3.call(this,void 0),this.x=t,this.s=void 0,this.g=H$1-1,this.f=4,this.W=null==e?void 0:e.watched,this.Z=null==e?void 0:e.unwatched,this.name=null==e?void 0:e.name;}function ot$3(t){const e=t.u;if(t.u=void 0,"function"==typeof e){Z$2++;const n=G$3;G$3=void 0;try{e();}catch(e){throw t.f&=-2,t.f|=8,st$3(t),e}finally{G$3=n,B$1();}}}function st$3(t){for(let e=t.s;void 0!==e;e=e.n)e.S.U(e);t.x=void 0,t.s=void 0,ot$3(t);}function rt$2(t){if(G$3!==this)throw new Error("Out-of-order effect");et$3(this),G$3=t,this.f&=-2,8&this.f&&st$3(this),B$1();}function ct$3(t,e){this.x=t,this.u=void 0,this.s=void 0,this.o=void 0,this.f=32,this.name=null==e?void 0:e.name;}function dt$2(t,e){const n=new ct$3(t,e);try{n.c();}catch(t){throw n.d(),t}const i=n.d.bind(n);return i[Symbol.dispose]=i,i}function at$1(t,e={}){const n={};for(const i in t){const o=e[i],s=X$3(void 0===o?t[i]:o);n[i]=s;}return n}Q$3.prototype.brand=T$1,Q$3.prototype.h=function(){return  true},Q$3.prototype.S=function(t){const e=this.t;e!==t&&void 0===t.e&&(t.x=e,this.t=t,void 0!==e?e.e=t:W$5(()=>{var t;null==(t=this.W)||t.call(this);}));},Q$3.prototype.U=function(t){if(void 0!==this.t){const e=t.e,n=t.x;void 0!==e&&(e.x=n,t.e=void 0),void 0!==n&&(n.e=e,t.x=void 0),t===this.t&&(this.t=n,void 0===n&&W$5(()=>{var t;null==(t=this.Z)||t.call(this);}));}},Q$3.prototype.subscribe=function(t){return dt$2(()=>{const e=this.value,n=G$3;G$3=void 0;try{t(e);}finally{G$3=n;}},{name:"sub"})},Q$3.prototype.valueOf=function(){return this.value},Q$3.prototype.toString=function(){return this.value+""},Q$3.prototype.toJSON=function(){return this.value},Q$3.prototype.peek=function(){const t=G$3;G$3=void 0;try{return this.value}finally{G$3=t;}},Object.defineProperty(Q$3.prototype,"value",{get(){const t=q$3(this);return void 0!==t&&(t.i=this.i),this.v},set(t){if(t!==this.v){if(J$4>100)throw new Error("Cycle detected");this.v=t,this.i++,H$1++,Z$2++;try{for(let t=this.t;void 0!==t;t=t.x)t.t.N();}finally{B$1();}}}}),nt$3.prototype=new Q$3,nt$3.prototype.h=function(){if(this.f&=-3,1&this.f)return  false;if(32==(36&this.f))return  true;if(this.f&=-5,this.g===H$1)return  true;if(this.g=H$1,this.f|=1,this.i>0&&!Y$2(this))return this.f&=-2,true;const t=G$3;try{tt$2(this),G$3=this;const t=this.x();(16&this.f||this.v!==t||0===this.i)&&(this.v=t,this.f&=-17,this.i++);}catch(t){this.v=t,this.f|=16,this.i++;}return G$3=t,et$3(this),this.f&=-2,true},nt$3.prototype.S=function(t){if(void 0===this.t){this.f|=36;for(let t=this.s;void 0!==t;t=t.n)t.S.S(t);}Q$3.prototype.S.call(this,t);},nt$3.prototype.U=function(t){if(void 0!==this.t&&(Q$3.prototype.U.call(this,t),void 0===this.t)){this.f&=-33;for(let t=this.s;void 0!==t;t=t.n)t.S.U(t);}},nt$3.prototype.N=function(){if(!(2&this.f)){this.f|=6;for(let t=this.t;void 0!==t;t=t.x)t.t.N();}},Object.defineProperty(nt$3.prototype,"value",{get(){if(1&this.f)throw new Error("Cycle detected");const t=q$3(this);if(this.h(),void 0!==t&&(t.i=this.i),16&this.f)throw this.v;return this.v}}),ct$3.prototype.c=function(){const t=this.S();try{if(8&this.f)return;if(void 0===this.x)return;const t=this.x();"function"==typeof t&&(this.u=t);}finally{t();}},ct$3.prototype.S=function(){if(1&this.f)throw new Error("Cycle detected");this.f|=1,this.f&=-9,ot$3(this),tt$2(this),Z$2++;const t=G$3;return G$3=this,rt$2.bind(this,t)},ct$3.prototype.N=function(){2&this.f||(this.f|=2,this.o=V$4,V$4=this);},ct$3.prototype.d=function(){this.f|=8,1&this.f||st$3(this);},ct$3.prototype.dispose=function(){this.d();};function pt$2(t){return ("function"==typeof t.nodes?t.nodes():t.nodes)||[]}function xt$3(t,...e){const n=new URL("https://lexical.dev/docs/error"),i=new URLSearchParams;i.append("code",t);for(const t of e)i.append("v",t);throw n.search=i.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}function yt$2(t,e){if(t&&e&&!Array.isArray(e)&&"object"==typeof t&&"object"==typeof e){const n=t,i=e;for(const t in i)n[t]=yt$2(n[t],i[t]);return t}return e}const St$4=0,Et$3=1,bt$4=2,wt$3=3,Nt$3=4,Ot$2=5,Rt$1=6,Mt$2=7;function Ct$3(t){return t.id===St$4}function Dt$2(t){return t.id===bt$4}function _t$2(t){return function(t){return t.id===Et$3}(t)||xt$3(305,String(t.id),String(Et$3)),Object.assign(t,{id:bt$4})}const It$2=new Set;let jt$2 = class jt{builder;configs;_dependency;_peerNameSet;extension;state;_signal;constructor(t,e){this.builder=t,this.extension=e,this.configs=new Set,this.state={id:St$4};}mergeConfigs(){let t=this.extension.config||{};const e=this.extension.mergeConfig?this.extension.mergeConfig.bind(this.extension):Wl;for(const n of this.configs)t=e(t,n);return t}init(t){const e=this.state;Dt$2(e)||xt$3(306,String(e.id));const n={getDependency:this.getInitDependency.bind(this),getDirectDependentNames:this.getDirectDependentNames.bind(this),getPeer:this.getInitPeer.bind(this),getPeerNameSet:this.getPeerNameSet.bind(this)},i={...n,getDependency:this.getDependency.bind(this),getInitResult:this.getInitResult.bind(this),getPeer:this.getPeer.bind(this)},o=function(t,e,n){return Object.assign(t,{config:e,id:wt$3,registerState:n})}(e,this.mergeConfigs(),n);let s;this.state=o,this.extension.init&&(s=this.extension.init(t,o.config,n)),this.state=function(t,e,n){return Object.assign(t,{id:Nt$3,initResult:e,registerState:n})}(o,s,i);}build(t){const e=this.state;let n;e.id!==Nt$3&&xt$3(307,String(e.id),String(Ot$2)),this.extension.build&&(n=this.extension.build(t,e.config,e.registerState));const i={...e.registerState,getOutput:()=>n,getSignal:this.getSignal.bind(this)};this.state=function(t,e,n){return Object.assign(t,{id:Ot$2,output:e,registerState:n})}(e,n,i);}register(t,e){this._signal=e;const n=this.state;n.id!==Ot$2&&xt$3(308,String(n.id),String(Ot$2));const i=this.extension.register&&this.extension.register(t,n.config,n.registerState);return this.state=function(t){return Object.assign(t,{id:Rt$1})}(n),()=>{const t=this.state;t.id!==Mt$2&&xt$3(309,String(n.id),String(Mt$2)),this.state=function(t){return Object.assign(t,{id:Ot$2})}(t),i&&i();}}afterRegistration(t){const e=this.state;let n;return e.id!==Rt$1&&xt$3(310,String(e.id),String(Rt$1)),this.extension.afterRegistration&&(n=this.extension.afterRegistration(t,e.config,e.registerState)),this.state=function(t){return Object.assign(t,{id:Mt$2})}(e),n}getSignal(){return void 0===this._signal&&xt$3(311),this._signal}getInitResult(){ void 0===this.extension.init&&xt$3(312,this.extension.name);const t=this.state;return function(t){return t.id>=Nt$3}(t)||xt$3(313,String(t.id),String(Nt$3)),t.initResult}getInitPeer(t){const e=this.builder.extensionNameMap.get(t);return e?e.getExtensionInitDependency():void 0}getExtensionInitDependency(){const t=this.state;return function(t){return t.id>=wt$3}(t)||xt$3(314,String(t.id),String(wt$3)),{config:t.config}}getPeer(t){const e=this.builder.extensionNameMap.get(t);return e?e.getExtensionDependency():void 0}getInitDependency(t){const e=this.builder.getExtensionRep(t);return void 0===e&&xt$3(315,this.extension.name,t.name),e.getExtensionInitDependency()}getDependency(t){const e=this.builder.getExtensionRep(t);return void 0===e&&xt$3(315,this.extension.name,t.name),e.getExtensionDependency()}getState(){const t=this.state;return function(t){return t.id>=Mt$2}(t)||xt$3(316,String(t.id),String(Mt$2)),t}getDirectDependentNames(){return this.builder.incomingEdges.get(this.extension.name)||It$2}getPeerNameSet(){let t=this._peerNameSet;return t||(t=new Set((this.extension.peerDependencies||[]).map(([t])=>t)),this._peerNameSet=t),t}getExtensionDependency(){if(!this._dependency){const t=this.state;((function(t){return t.id>=Ot$2}))(t)||xt$3(317,this.extension.name),this._dependency={config:t.config,init:t.initResult,output:t.output};}return this._dependency}};const At$3={tag:Dn};function Pt$3(){const t=No();t.isEmpty()&&t.append(Li());}const Kt$1=Kl({config:Bl({setOptions:At$3,updateOptions:At$3}),init:({$initialEditorState:t=Pt$3})=>({$initialEditorState:t,initialized:false}),afterRegistration(t,{updateOptions:e,setOptions:n},i){const o=i.getInitResult();if(!o.initialized){o.initialized=true;const{$initialEditorState:i}=o;if(Mi(i))t.setEditorState(i,n);else if("function"==typeof i)t.update(()=>{i(t);},e);else if(i&&("string"==typeof i||"object"==typeof i)){const e=t.parseEditorState(i);t.setEditorState(e,n);}}return ()=>{}},name:"@lexical/extension/InitialState",nodes:[Ni,Xn,Bn,ar,Di]}),kt$4=Symbol.for("@lexical/extension/LexicalBuilder");function zt$1(){}function Ut$1(t){throw t}function Lt$2(t){return Array.isArray(t)?t:[t]}const Tt$3="0.38.2+prod.esm";let Bt$1 = class Bt{roots;extensionNameMap;outgoingConfigEdges;incomingEdges;conflicts;_sortedExtensionReps;PACKAGE_VERSION;constructor(t){this.outgoingConfigEdges=new Map,this.incomingEdges=new Map,this.extensionNameMap=new Map,this.conflicts=new Map,this.PACKAGE_VERSION=Tt$3,this.roots=t;for(const e of t)this.addExtension(e);}static fromExtensions(t){const e=[Lt$2(Kt$1)];for(const n of t)e.push(Lt$2(n));return new Bt(e)}static maybeFromEditor(t){const e=t[kt$4];return e&&(e.PACKAGE_VERSION!==Tt$3&&xt$3(292,e.PACKAGE_VERSION,Tt$3),e instanceof Bt||xt$3(293)),e}static fromEditor(t){const e=Bt.maybeFromEditor(t);return void 0===e&&xt$3(294),e}constructEditor(){const{$initialEditorState:t,onError:e,...n}=this.buildCreateEditorArgs(),i=Object.assign($i({...n,...e?{onError:t=>{e(t,i);}}:{}}),{[kt$4]:this});for(const t of this.sortedExtensionReps())t.build(i);return i}buildEditor(){let t=zt$1;function e(){try{t();}finally{t=zt$1;}}const n=Object.assign(this.constructEditor(),{dispose:e,[Symbol.dispose]:e});return t=U$4(this.registerEditor(n),()=>n.setRootElement(null)),n}hasExtensionByName(t){return this.extensionNameMap.has(t)}getExtensionRep(t){const e=this.extensionNameMap.get(t.name);if(e)return e.extension!==t&&xt$3(295,t.name),e}addEdge(t,e,n){const i=this.outgoingConfigEdges.get(t);i?i.set(e,n):this.outgoingConfigEdges.set(t,new Map([[e,n]]));const o=this.incomingEdges.get(e);o?o.add(t):this.incomingEdges.set(e,new Set([t]));}addExtension(t){ void 0!==this._sortedExtensionReps&&xt$3(296);const e=Lt$2(t),[n]=e;"string"!=typeof n.name&&xt$3(297,typeof n.name);let i=this.extensionNameMap.get(n.name);if(void 0!==i&&i.extension!==n&&xt$3(298,n.name),!i){i=new jt$2(this,n),this.extensionNameMap.set(n.name,i);const t=this.conflicts.get(n.name);"string"==typeof t&&xt$3(299,n.name,t);for(const t of n.conflictsWith||[])this.extensionNameMap.has(t)&&xt$3(299,n.name,t),this.conflicts.set(t,n.name);for(const t of n.dependencies||[]){const e=Lt$2(t);this.addEdge(n.name,e[0].name,e.slice(1)),this.addExtension(e);}for(const[t,e]of n.peerDependencies||[])this.addEdge(n.name,t,e?[e]:[]);}}sortedExtensionReps(){if(this._sortedExtensionReps)return this._sortedExtensionReps;const t=[],e=(n,i)=>{let o=n.state;if(Dt$2(o))return;const s=n.extension.name;var r;Ct$3(o)||xt$3(300,s,i||"[unknown]"),Ct$3(r=o)||xt$3(304,String(r.id),String(St$4)),o=Object.assign(r,{id:Et$3}),n.state=o;const c=this.outgoingConfigEdges.get(s);if(c)for(const t of c.keys()){const n=this.extensionNameMap.get(t);n&&e(n,s);}o=_t$2(o),n.state=o,t.push(n);};for(const t of this.extensionNameMap.values())Ct$3(t.state)&&e(t);for(const e of t)for(const[t,n]of this.outgoingConfigEdges.get(e.extension.name)||[])if(n.length>0){const e=this.extensionNameMap.get(t);if(e)for(const t of n)e.configs.add(t);}for(const[t,...e]of this.roots)if(e.length>0){const n=this.extensionNameMap.get(t.name);void 0===n&&xt$3(301,t.name);for(const t of e)n.configs.add(t);}return this._sortedExtensionReps=t,this._sortedExtensionReps}registerEditor(t){const e=this.sortedExtensionReps(),n=new AbortController,i=[()=>n.abort()],o=n.signal;for(const n of e){const e=n.register(t,o);e&&i.push(e);}for(const n of e){const e=n.afterRegistration(t);e&&i.push(e);}return U$4(...i)}buildCreateEditorArgs(){const t={},e=new Set,n=new Map,i=new Map,o={},s={},r=this.sortedExtensionReps();for(const c of r){const{extension:r}=c;if(void 0!==r.onError&&(t.onError=r.onError),void 0!==r.disableEvents&&(t.disableEvents=r.disableEvents),void 0!==r.parentEditor&&(t.parentEditor=r.parentEditor),void 0!==r.editable&&(t.editable=r.editable),void 0!==r.namespace&&(t.namespace=r.namespace),void 0!==r.$initialEditorState&&(t.$initialEditorState=r.$initialEditorState),r.nodes)for(const t of pt$2(r)){if("function"!=typeof t){const e=n.get(t.replace);e&&xt$3(302,r.name,t.replace.name,e.extension.name),n.set(t.replace,c);}e.add(t);}if(r.html){if(r.html.export)for(const[t,e]of r.html.export.entries())i.set(t,e);r.html.import&&Object.assign(o,r.html.import);}r.theme&&yt$2(s,r.theme);}Object.keys(s).length>0&&(t.theme=s),e.size&&(t.nodes=[...e]);const c=Object.keys(o).length>0,d=i.size>0;(c||d)&&(t.html={},c&&(t.html.import=o),d&&(t.html.export=i));for(const e of r)e.init(t);return t.onError||(t.onError=Ut$1),t}};function Gt(t,e){const n=Bt$1.fromEditor(t).extensionNameMap.get(e);return n?n.getExtensionDependency():void 0}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function K$3(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);throw n.search=r.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}function W$4(t){let e=1,n=t.getParent();for(;null!=n;){if(ot$2(n)){const t=n.getParent();if(dt$1(t)){e++,n=t.getParent();continue}K$3(40);}return e}return e}function J$3(t){let e=t.getParent();dt$1(e)||K$3(40);let n=e;for(;null!==n;)n=n.getParent(),dt$1(n)&&(e=n);return e}function U$3(t){let e=[];const n=t.getChildren().filter(ot$2);for(let t=0;t<n.length;t++){const r=n[t],i=r.getFirstChild();dt$1(i)?e=e.concat(U$3(i)):e.push(r);}return e}function $$2(t){return ot$2(t)&&dt$1(t.getFirstChild())}function V$3(t){return st$2().append(t)}function z$2(t,e){return ot$2(t)&&(0===e.length||1===e.length&&t.is(e[0])&&0===t.getChildrenSize())}function j$1(t){const e=Lr();if(null!==e){let n=e.getNodes();if(yr(e)){const r=e.getStartEndPoints();null===r&&K$3(143);const[i]=r,s=i.getNode(),o=s.getParent();if(as(s)){const t=s.getFirstChild();if(t)n=t.selectStart().getNodes();else {const t=Li();s.append(t),n=t.select().getNodes();}}else if(z$2(s,n)){const e=ht$3(t);if(as(o)){s.replace(e);const t=st$2();Si(s)&&(t.setFormat(s.getFormatType()),t.setIndent(s.getIndent())),e.append(t);}else if(ot$2(s)){const t=s.getParentOrThrow();q$2(e,t.getChildren()),t.replace(e);}return}}const r=new Set;for(let e=0;e<n.length;e++){const i=n[e];if(Si(i)&&i.isEmpty()&&!ot$2(i)&&!r.has(i.getKey())){H(i,t);continue}let s=ho(i)?i.getParent():ot$2(i)&&i.isEmpty()?i:null;for(;null!=s;){const e=s.getKey();if(dt$1(s)){if(!r.has(e)){const n=ht$3(t);q$2(n,s.getChildren()),s.replace(n),r.add(e);}break}{const n=s.getParent();if(as(n)&&!r.has(e)){r.add(e),H(s,t);break}s=n;}}}}}function q$2(t,e){t.splice(t.getChildrenSize(),0,e);}function H(t,e){if(dt$1(t))return t;const n=t.getPreviousSibling(),r=t.getNextSibling(),i=st$2();let s;if(q$2(i,t.getChildren()),dt$1(n)&&e===n.getListType())n.append(i),dt$1(r)&&e===r.getListType()&&(q$2(n,r.getChildren()),r.remove()),s=n;else if(dt$1(r)&&e===r.getListType())r.getFirstChildOrThrow().insertBefore(i),s=r;else {const n=ht$3(e);n.append(i),t.replace(n),s=n;}return i.setFormat(t.getFormatType()),i.setIndent(t.getIndent()),t.remove(),s}function X$2(t,e){const n=t.getLastChild(),r=e.getFirstChild();n&&r&&$$2(n)&&$$2(r)&&(X$2(n.getFirstChild(),r.getFirstChild()),r.remove());const i=e.getChildren();i.length>0&&t.append(...i),e.remove();}function G$2(){const t=Lr();if(yr(t)){const e=new Set,r=t.getNodes(),i=t.anchor.getNode();if(z$2(i,r))e.add(J$3(i));else for(let t=0;t<r.length;t++){const i=r[t];if(ho(i)){const t=wt$4(i,nt$2);null!=t&&e.add(J$3(t));}}for(const n of e){let e=n;const r=U$3(n);for(const n of r){const r=Li().setTextStyle(t.style).setTextFormat(t.format);q$2(r,n.getChildren()),e.insertAfter(r),e=r,n.__key===t.anchor.key&&Cl(t.anchor,El(il(r,"next"))),n.__key===t.focus.key&&Cl(t.focus,El(il(r,"next"))),n.remove();}n.remove();}}}function Q$2(t){const e="check"!==t.getListType();let n=t.getStart();for(const r of t.getChildren())ot$2(r)&&(r.getValue()!==n&&r.setValue(n),e&&null!=r.getLatest().__checked&&r.setChecked(void 0),dt$1(r.getFirstChild())||n++);}function Y$1(t){const e=new Set;if($$2(t)||e.has(t.getKey()))return;const n=t.getParent(),r=t.getNextSibling(),i=t.getPreviousSibling();if($$2(r)&&$$2(i)){const n=i.getFirstChild();if(dt$1(n)){n.append(t);const i=r.getFirstChild();if(dt$1(i)){q$2(n,i.getChildren()),r.remove(),e.add(r.getKey());}}}else if($$2(r)){const e=r.getFirstChild();if(dt$1(e)){const n=e.getFirstChild();null!==n&&n.insertBefore(t);}}else if($$2(i)){const e=i.getFirstChild();dt$1(e)&&e.append(t);}else if(dt$1(n)){const e=st$2().setTextFormat(t.getTextFormat()).setTextStyle(t.getTextStyle()),s=ht$3(n.getListType()).setTextFormat(n.getTextFormat()).setTextStyle(n.getTextStyle());e.append(s),s.append(t),i?i.insertAfter(e):r?r.insertBefore(e):n.append(e);}}function Z$1(t){if($$2(t))return;const e=t.getParent(),n=e?e.getParent():void 0;if(dt$1(n?n.getParent():void 0)&&ot$2(n)&&dt$1(e)){const r=e?e.getFirstChild():void 0,i=e?e.getLastChild():void 0;if(t.is(r))n.insertBefore(t),e.isEmpty()&&n.remove();else if(t.is(i))n.insertAfter(t),e.isEmpty()&&n.remove();else {const r=e.getListType(),i=st$2(),s=ht$3(r);i.append(s),t.getPreviousSiblings().forEach(t=>s.append(t));const o=st$2(),l=ht$3(r);o.append(l),q$2(l,t.getNextSiblings()),n.insertBefore(i),n.insertAfter(o),n.replace(t);}}}function tt$1(){const t=Lr();if(!yr(t)||!t.isCollapsed())return  false;const e=t.anchor.getNode();if(!ot$2(e)||0!==e.getChildrenSize())return  false;const n=J$3(e),r=e.getParent();dt$1(r)||K$3(40);const i=r.getParent();let s;if(as(i))s=Li(),n.insertAfter(s);else {if(!ot$2(i))return  false;s=st$2(),i.insertAfter(s);}s.setTextStyle(t.style).setTextFormat(t.format).select();const o=e.getNextSiblings();if(o.length>0){const t=ht$3(r.getListType());if(ot$2(s)){const e=st$2();e.append(t),s.insertAfter(e);}else s.insertAfter(t);t.append(...o);}return function(t){let e=t;for(;null==e.getNextSibling()&&null==e.getPreviousSibling();){const t=e.getParent();if(null==t||!ot$2(t)&&!dt$1(t))break;e=t;}e.remove();}(e),true}function et$2(...t){const e=[];for(const n of t)if(n&&"string"==typeof n)for(const[t]of n.matchAll(/\S+/g))e.push(t);return e}let nt$2 = class nt extends Ci{__value;__checked;$config(){return this.config("listitem",{$transform:t=>{if(null==t.__checked)return;const e=t.getParent();dt$1(e)&&"check"!==e.getListType()&&null!=t.getChecked()&&t.setChecked(void 0);},extends:Ci,importDOM:wn({li:()=>({conversion:rt$1,priority:0})})})}constructor(t=1,e=void 0,n){super(n),this.__value=void 0===t?1:t,this.__checked=e;}afterCloneFrom(t){super.afterCloneFrom(t),this.__value=t.__value,this.__checked=t.__checked;}createDOM(t){const e=document.createElement("li");return this.updateListItemDOM(null,e,t),e}updateListItemDOM(t,e,n){!function(t,e,n){const r=e.getParent();!dt$1(r)||"check"!==r.getListType()||dt$1(e.getFirstChild())?(t.removeAttribute("role"),t.removeAttribute("tabIndex"),t.removeAttribute("aria-checked")):(t.setAttribute("role","checkbox"),t.setAttribute("tabIndex","-1"),n&&e.__checked===n.__checked||t.setAttribute("aria-checked",e.getChecked()?"true":"false"));}(e,this,t),e.value=this.__value,function(t,e,n){const s=[],o=[],l=e.list,c=l?l.listitem:void 0;let a;l&&l.nested&&(a=l.nested.listitem);void 0!==c&&s.push(...et$2(c));if(l){const t=n.getParent(),e=dt$1(t)&&"check"===t.getListType(),r=n.getChecked();e&&!r||o.push(l.listitemUnchecked),e&&r||o.push(l.listitemChecked),e&&s.push(r?l.listitemChecked:l.listitemUnchecked);}if(void 0!==a){const t=et$2(a);n.getChildren().some(t=>dt$1(t))?s.push(...t):o.push(...t);}o.length>0&&ut$2(t,...o);s.length>0&&lt$3(t,...s);}(e,n.theme,this);const s=t?t.__style:"",o=this.__style;s!==o&&(""===o?e.removeAttribute("style"):e.style.cssText=o),function(t,e,n){const r=b$3(e.__textStyle);for(const e in r)t.style.setProperty(`--listitem-marker-${e}`,r[e]);if(n)for(const e in b$3(n.__textStyle))e in r||t.style.removeProperty(`--listitem-marker-${e}`);}(e,this,t);}updateDOM(t,e,n){const r=e;return this.updateListItemDOM(t,r,n),false}updateFromJSON(t){return super.updateFromJSON(t).setValue(t.value).setChecked(t.checked)}exportDOM(t){const e=this.createDOM(t._config),n=this.getFormatType();n&&(e.style.textAlign=n);const r=this.getDirection();return r&&(e.dir=r),{element:e}}exportJSON(){return {...super.exportJSON(),checked:this.getChecked(),value:this.getValue()}}append(...t){for(let e=0;e<t.length;e++){const n=t[e];if(Si(n)&&this.canMergeWith(n)){const t=n.getChildren();this.append(...t),n.remove();}else super.append(n);}return this}replace(t,e){if(ot$2(t))return super.replace(t);this.setIndent(0);const n=this.getParentOrThrow();if(!dt$1(n))return t;if(n.__first===this.getKey())n.insertBefore(t);else if(n.__last===this.getKey())n.insertAfter(t);else {const e=ht$3(n.getListType());let r=this.getNextSibling();for(;r;){const t=r;r=r.getNextSibling(),e.append(t);}n.insertAfter(t),t.insertAfter(e);}return e&&(Si(t)||K$3(139),this.getChildren().forEach(e=>{t.append(e);})),this.remove(),0===n.getChildrenSize()&&n.remove(),t}insertAfter(t,e=true){const n=this.getParentOrThrow();if(dt$1(n)||K$3(39),ot$2(t))return super.insertAfter(t,e);const r=this.getNextSiblings();if(n.insertAfter(t,e),0!==r.length){const i=ht$3(n.getListType());r.forEach(t=>i.append(t)),t.insertAfter(i,e);}return t}remove(t){const e=this.getPreviousSibling(),n=this.getNextSibling();super.remove(t),e&&n&&$$2(e)&&$$2(n)&&(X$2(e.getFirstChild(),n.getFirstChild()),n.remove());}insertNewAfter(t,e=true){const n=st$2().updateFromJSON(this.exportJSON()).setChecked(!this.getChecked()&&void 0);return this.insertAfter(n,e),n}collapseAtStart(t){const e=Li();this.getChildren().forEach(t=>e.append(t));const n=this.getParentOrThrow(),r=n.getParentOrThrow(),i=ot$2(r);if(1===n.getChildrenSize())if(i)n.remove(),r.select();else {n.insertBefore(e),n.remove();const r=t.anchor,i=t.focus,s=e.getKey();"element"===r.type&&r.getNode().is(this)&&r.set(s,r.offset,"element"),"element"===i.type&&i.getNode().is(this)&&i.set(s,i.offset,"element");}else n.insertBefore(e),this.remove();return  true}getValue(){return this.getLatest().__value}setValue(t){const e=this.getWritable();return e.__value=t,e}getChecked(){const t=this.getLatest();let e;const n=this.getParent();return dt$1(n)&&(e=n.getListType()),"check"===e?Boolean(t.__checked):void 0}setChecked(t){const e=this.getWritable();return e.__checked=t,e}toggleChecked(){const t=this.getWritable();return t.setChecked(!t.__checked)}getIndent(){const t=this.getParent();if(null===t||!this.isAttached())return this.getLatest().__indent;let e=t.getParentOrThrow(),n=0;for(;ot$2(e);)e=e.getParentOrThrow().getParentOrThrow(),n++;return n}setIndent(t){"number"!=typeof t&&K$3(117),(t=Math.floor(t))>=0||K$3(199);let e=this.getIndent();for(;e!==t;)e<t?(Y$1(this),e++):(Z$1(this),e--);return this}canInsertAfter(t){return ot$2(t)}canReplaceWith(t){return ot$2(t)}canMergeWith(t){return ot$2(t)||Ii(t)}extractWithChild(t,e){if(!yr(e))return  false;const n=e.anchor.getNode(),r=e.focus.getNode();return this.isParentOf(n)&&this.isParentOf(r)&&this.getTextContent().length===e.getTextContent().length}isParentRequired(){return  true}createParentElementNode(){return ht$3("bullet")}canMergeWhenEmpty(){return  true}};function rt$1(t){if(t.classList.contains("task-list-item"))for(const e of t.children)if("INPUT"===e.tagName)return it$2(e);if(t.classList.contains("joplin-checkbox"))for(const e of t.children)if(e.classList.contains("checkbox-wrapper")&&e.children.length>0&&"INPUT"===e.children[0].tagName)return it$2(e.children[0]);const e=t.getAttribute("aria-checked");return {node:st$2("true"===e||"false"!==e&&void 0)}}function it$2(t){if(!("checkbox"===t.getAttribute("type")))return {node:null};return {node:st$2(t.hasAttribute("checked"))}}function st$2(t){return fs(new nt$2(void 0,t))}function ot$2(t){return t instanceof nt$2}let lt$2 = class lt extends Ci{__tag;__start;__listType;$config(){return this.config("list",{$transform:t=>{!function(t){const e=t.getNextSibling();dt$1(e)&&t.getListType()===e.getListType()&&X$2(t,e);}(t),Q$2(t);},extends:Ci,importDOM:wn({ol:()=>({conversion:gt$2,priority:0}),ul:()=>({conversion:gt$2,priority:0})})})}constructor(t="number",e=1,n){super(n);const r=ut$1[t]||t;this.__listType=r,this.__tag="number"===r?"ol":"ul",this.__start=e;}afterCloneFrom(t){super.afterCloneFrom(t),this.__listType=t.__listType,this.__tag=t.__tag,this.__start=t.__start;}getTag(){return this.getLatest().__tag}setListType(t){const e=this.getWritable();return e.__listType=t,e.__tag="number"===t?"ol":"ul",e}getListType(){return this.getLatest().__listType}getStart(){return this.getLatest().__start}setStart(t){const e=this.getWritable();return e.__start=t,e}createDOM(t,e){const n=this.__tag,r=document.createElement(n);return 1!==this.__start&&r.setAttribute("start",String(this.__start)),r.__lexicalListType=this.__listType,ct$2(r,t.theme,this),r}updateDOM(t,e,n){return t.__tag!==this.__tag||t.__listType!==this.__listType||(ct$2(e,n.theme,this),false)}updateFromJSON(t){return super.updateFromJSON(t).setListType(t.listType).setStart(t.start)}exportDOM(t){const e=this.createDOM(t._config,t);return Cs(e)&&(1!==this.__start&&e.setAttribute("start",String(this.__start)),"check"===this.__listType&&e.setAttribute("__lexicalListType","check")),{element:e}}exportJSON(){return {...super.exportJSON(),listType:this.getListType(),start:this.getStart(),tag:this.getTag()}}canBeEmpty(){return  false}canIndent(){return  false}splice(t,e,n){let r=n;for(let t=0;t<n.length;t++){const e=n[t];ot$2(e)||(r===n&&(r=[...n]),r[t]=st$2().append(!Si(e)||dt$1(e)||e.isInline()?e:sr(e.getTextContent())));}return super.splice(t,e,r)}extractWithChild(t){return ot$2(t)}};function ct$2(t,e,n){const s=[],o=[],l=e.list;if(void 0!==l){const t=l[`${n.__tag}Depth`]||[],e=W$4(n)-1,r=e%t.length,i=t[r],c=l[n.__tag];let a;const g=l.nested,u=l.checklist;if(void 0!==g&&g.list&&(a=g.list),void 0!==c&&s.push(c),void 0!==u&&"check"===n.__listType&&s.push(u),void 0!==i){s.push(...et$2(i));for(let e=0;e<t.length;e++)e!==r&&o.push(n.__tag+e);}if(void 0!==a){const t=et$2(a);e>1?s.push(...t):o.push(...t);}}o.length>0&&ut$2(t,...o),s.length>0&&lt$3(t,...s);}function at(t){const e=[];for(let n=0;n<t.length;n++){const r=t[n];if(ot$2(r)){e.push(r);const t=r.getChildren();t.length>1&&t.forEach(t=>{dt$1(t)&&e.push(V$3(t));});}else e.push(V$3(r));}return e}function gt$2(t){const e=t.nodeName.toLowerCase();let n=null;if("ol"===e){n=ht$3("number",t.start);}else "ul"===e&&(n=function(t){if("check"===t.getAttribute("__lexicallisttype")||t.classList.contains("contains-task-list")||"1"===t.getAttribute("data-is-checklist"))return  true;for(const e of t.childNodes)if(Cs(e)&&e.hasAttribute("aria-checked"))return  true;return  false}(t)?ht$3("check"):ht$3("bullet"));return {after:at,node:n}}const ut$1={ol:"number",ul:"bullet"};function ht$3(t="number",e=1){return fs(new lt$2(t,e))}function dt$1(t){return t instanceof lt$2}const vt$2=re$1("UPDATE_LIST_START_COMMAND"),St$3=re$1("INSERT_UNORDERED_LIST_COMMAND"),xt$2=re$1("INSERT_ORDERED_LIST_COMMAND"),kt$3=re$1("REMOVE_LIST_COMMAND");function bt$3(t){return U$4(t.registerCommand(xt$2,()=>(j$1("number"),true),zi),t.registerCommand(vt$2,t=>{const{listNodeKey:e,newStart:n}=t,r=xo(e);return !!dt$1(r)&&("number"===r.getListType()&&(r.setStart(n),Q$2(r)),true)},zi),t.registerCommand(St$3,()=>(j$1("bullet"),true),zi),t.registerCommand(kt$3,()=>(G$2(),true),zi),t.registerCommand(ae$1,()=>tt$1(),zi),t.registerNodeTransform(nt$2,t=>{const e=t.getFirstChild();if(e){if(lr(e)){const n=e.getStyle(),r=e.getFormat();t.getTextStyle()!==n&&t.setTextStyle(n),t.getTextFormat()!==r&&t.setTextFormat(r);}}else {const e=Lr();yr(e)&&(e.style!==t.getTextStyle()||e.format!==t.getTextFormat())&&e.isCollapsed()&&t.is(e.anchor.getNode())&&t.setTextStyle(e.style).setTextFormat(e.format);}}),t.registerNodeTransform(Xn,t=>{const e=t.getParent();if(ot$2(e)&&t.is(e.getFirstChild())){const n=t.getStyle(),r=t.getFormat();n===e.getTextStyle()&&r===e.getTextFormat()||e.setTextStyle(n).setTextFormat(r);}}))}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function m$1(e,n){const t=ao(n)?n.body.childNodes:n.childNodes;let l=[];const r=[];for(const n of t)if(!w$3.has(n.nodeName)){const t=y$2(n,e,r,false);null!==t&&(l=l.concat(t));}return function(e){for(const n of e)n.getNextSibling()instanceof Pi&&n.insertAfter(Jn());for(const n of e){const e=n.getChildren();for(const t of e)n.insertBefore(t);n.remove();}}(r),l}function g(e,n){if("undefined"==typeof document||"undefined"==typeof window&&void 0===global.window)throw new Error("To use $generateHtmlFromNodes in headless mode please initialize a headless browser implementation such as JSDom before calling this function.");const t=document.createElement("div"),o=No().getChildren();for(let l=0;l<o.length;l++){x$2(e,o[l],t,n);}return t.innerHTML}function x$2(t,o,l,u=null){let f=null===u||o.isSelected(u);const a=Si(o)&&o.excludeFromCopy("html");let d=o;null!==u&&lr(o)&&(d=M$4(u,o,"clone"));const p=Si(d)?d.getChildren():[],h=Xi(t,d.getType());let m;m=h&&void 0!==h.exportDOM?h.exportDOM(t,d):d.exportDOM(t);const{element:g,after:w}=m;if(!g)return  false;const y=document.createDocumentFragment();for(let e=0;e<p.length;e++){const n=p[e],l=x$2(t,n,y,u);!f&&Si(o)&&l&&o.extractWithChild(n,u,"html")&&(f=true);}if(f&&!a){if((Cs(g)||vs(g))&&g.append(y),l.append(g),w){const e=w.call(d,g);e&&(vs(g)?g.replaceChildren(e):g.replaceWith(e));}}else l.append(y);return f}const w$3=new Set(["STYLE","SCRIPT"]);function y$2(e,n,o,l,i=new Map,s){let c=[];if(w$3.has(e.nodeName))return c;let m=null;const g=function(e,n){const{nodeName:t}=e,o=n._htmlConversions.get(t.toLowerCase());let l=null;if(void 0!==o)for(const n of o){const t=n(e);null!==t&&(null===l||(l.priority||0)<=(t.priority||0))&&(l=t);}return null!==l?l.conversion:null}(e,n),x=g?g(e):null;let b=null;if(null!==x){b=x.after;const n=x.node;if(m=Array.isArray(n)?n[n.length-1]:n,null!==m){for(const[,e]of i)if(m=e(m,s),!m)break;m&&c.push(...Array.isArray(n)?n:[m]);}null!=x.forChild&&i.set(e.nodeName,x.forChild);}const S=e.childNodes;let v=[];const N=(null==m||!as(m))&&(null!=m&&Or(m)||l);for(let e=0;e<S.length;e++)v.push(...y$2(S[e],n,o,N,new Map(i),m));return null!=b&&(v=b(v)),Ts(e)&&(v=C$2(e,v,N?()=>{const e=new Pi;return o.push(e),e}:Li)),null==m?v.length>0?c=c.concat(v):Ts(e)&&function(e){if(null==e.nextSibling||null==e.previousSibling)return  false;return ks(e.nextSibling)&&ks(e.previousSibling)}(e)&&(c=c.concat(Jn())):Si(m)&&m.append(...v),c}function C$2(e,n,t){const o=e.style.textAlign,l=[];let r=[];for(let e=0;e<n.length;e++){const i=n[e];if(Or(i))o&&!i.getFormat()&&i.setFormat(o),l.push(i);else if(r.push(i),e===n.length-1||e<n.length-1&&Or(n[e+1])){const e=t();e.setFormat(o),e.append(...r),l.push(e),r=[];}}return l}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function v$2(t,...e){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",t);for(const t of e)o.append("v",t);throw n.search=o.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}function D$2(e,n=Lr()){return null==n&&v$2(166),yr(n)&&n.isCollapsed()||0===n.getNodes().length?"":g(e,n)}function S$1(t,e=Lr()){return null==e&&v$2(166),yr(e)&&e.isCollapsed()||0===e.getNodes().length?null:JSON.stringify(E$3(t,e))}function R$2(t,n,o){const r=t.getData("application/x-lexical-editor");if(r)try{const t=JSON.parse(r);if(t.namespace===o._config.namespace&&Array.isArray(t.nodes)){return A$1(o,L$1(t.nodes),n)}}catch(t){console.error(t);}const c=t.getData("text/html"),a=t.getData("text/plain");if(c&&a!==c)try{const t=(new DOMParser).parseFromString(function(t){if(window.trustedTypes&&window.trustedTypes.createPolicy){return window.trustedTypes.createPolicy("lexical",{createHTML:t=>t}).createHTML(t)}return t}(c),"text/html");return A$1(o,m$1(o,t),n)}catch(t){console.error(t);}const u=a||t.getData("text/uri-list");if(null!=u)if(yr(n)){const t=u.split(/(\r?\n|\t)/);""===t[t.length-1]&&t.pop();for(let e=0;e<t.length;e++){const n=Lr();if(yr(n)){const o=t[e];"\n"===o||"\r\n"===o?n.insertParagraph():"\t"===o?n.insertNodes([ur()]):n.insertText(o);}}}else n.insertRawText(u);}function A$1(t,e,n){t.dispatchCommand(oe$2,{nodes:e,selection:n})||(n.insertNodes(e),function(t){if(yr(t)&&t.isCollapsed()){const e=t.anchor;let n=null;const o=xl(e,"previous");if(o)if(Ys(o))n=o.origin;else {const t=dl(o,il(No(),"next").getFlipped());for(const e of t){if(lr(e.origin)){n=e.origin;break}if(Si(e.origin)&&!e.origin.isInline())break}}if(n&&lr(n)){const e=n.getFormat(),o=n.getStyle();t.format===e&&t.style===o||(t.format=e,t.style=o,t.dirty=true);}}}(n));}function P$1(t,e,n,r=[]){let i=null===e||n.isSelected(e);const l=Si(n)&&n.excludeFromCopy("html");let s=n;null!==e&&lr(s)&&(s=M$4(e,s,"clone"));const c=Si(s)?s.getChildren():[],a=function(t){const e=t.exportJSON(),n=t.constructor;if(e.type!==n.getType()&&v$2(58,n.name),Si(t)){const t=e.children;Array.isArray(t)||v$2(59,n.name);}return e}(s);lr(s)&&0===s.getTextContentSize()&&(i=false);for(let o=0;o<c.length;o++){const r=c[o],l=P$1(t,e,r,a.children);!i&&Si(n)&&l&&n.extractWithChild(r,e,"clone")&&(i=true);}if(i&&!l)r.push(a);else if(Array.isArray(a.children))for(let t=0;t<a.children.length;t++){const e=a.children[t];r.push(e);}return i}function E$3(t,e){const n=[],o=No().getChildren();for(let r=0;r<o.length;r++){P$1(t,e,o[r],n);}return {namespace:t._config.namespace,nodes:n}}function L$1(t){const e=[];for(let o=0;o<t.length;o++){const r=t[o],i=ui(r);lr(i)&&$$3(i),e.push(i);}return e}let b$2=null;async function F$1(t,e,n){if(null!==b$2)return  false;if(null!==e)return new Promise((o,r)=>{t.update(()=>{o(M$3(t,e,n));});});const o=t.getRootElement(),i=t._window||window,l=i.document,s=ps(i);if(null===o||null===s)return  false;const c=l.createElement("span");c.style.cssText="position: fixed; top: -1000px;",c.append(l.createTextNode("#")),o.append(c);const a=new Range;return a.setStart(c,0),a.setEnd(c,1),s.removeAllRanges(),s.addRange(a),new Promise((e,o)=>{const s=t.registerCommand(Re$1,o=>(Lt$3(o,ClipboardEvent)&&(s(),null!==b$2&&(i.clearTimeout(b$2),b$2=null),e(M$3(t,o,n))),true),Wi);b$2=i.setTimeout(()=>{s(),b$2=null,e(false);},50),l.execCommand("copy"),c.remove();})}function M$3(t,e,n){if(void 0===n){const e=ps(t._window),o=Lr();if(!o||o.isCollapsed())return  false;if(!e)return  false;const r=e.anchorNode,l=e.focusNode;if(null!==r&&null!==l&&!eo(t,r,l))return  false;n=_$1(o);}e.preventDefault();const o=e.clipboardData;return null!==o&&(J$2(o,n),true)}const O=[["text/html",D$2],["application/x-lexical-editor",S$1]];function _$1(t=Lr()){const e={"text/plain":t?t.getTextContent():""};if(t){const n=bs();for(const[o,r]of O){const i=r(n,t);null!==i&&(e[o]=i);}}return e}function J$2(t,e){for(const[n]of O) void 0===e[n]&&t.setData(n,"");for(const n in e){const o=e[n];void 0!==o&&t.setData(n,o);}}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function gt$1(t,e){if(void 0!==document.caretRangeFromPoint){const n=document.caretRangeFromPoint(t,e);return null===n?null:{node:n.startContainer,offset:n.startOffset}}if("undefined"!==document.caretPositionFromPoint){const n=document.caretPositionFromPoint(t,e);return null===n?null:{node:n.offsetNode,offset:n.offset}}return null}const pt$1="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,ht$2=pt$1&&"documentMode"in document?document.documentMode:null,vt$1=pt$1&&/Mac|iPod|iPhone|iPad/.test(navigator.platform),Ct$2=!(!pt$1||!("InputEvent"in window)||ht$2)&&"getTargetRanges"in new window.InputEvent("input"),yt$1=pt$1&&/Version\/[\d.]+.*Safari/.test(navigator.userAgent),xt$1=pt$1&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,Dt$1=pt$1&&/^(?=.*Chrome).*/i.test(navigator.userAgent),Nt$2=pt$1&&/AppleWebKit\/[\d.]+/.test(navigator.userAgent)&&vt$1&&!Dt$1,wt$2=re$1("DRAG_DROP_PASTE_FILE");let Et$2 = class Et extends Ci{static getType(){return "quote"}static clone(t){return new Et(t.__key)}createDOM(t){const e=document.createElement("blockquote");return lt$3(e,t.theme.quote),e}updateDOM(t,e){return  false}static importDOM(){return {blockquote:t=>({conversion:Ft$1,priority:0})}}exportDOM(t){const{element:e}=super.exportDOM(t);if(Cs(e)){this.isEmpty()&&e.append(document.createElement("br"));const t=this.getFormatType();t&&(e.style.textAlign=t);const n=this.getDirection();n&&(e.dir=n);}return {element:e}}static importJSON(t){return _t$1().updateFromJSON(t)}insertNewAfter(t,e){const n=Li(),r=this.getDirection();return n.setDirection(r),this.insertAfter(n,e),n}collapseAtStart(){const t=Li();return this.getChildren().forEach(e=>t.append(e)),this.replace(t),true}canMergeWhenEmpty(){return  true}};function _t$1(){return fs(new Et$2)}function Ot$1(t){return t instanceof Et$2}let Pt$2 = class Pt extends Ci{__tag;static getType(){return "heading"}static clone(t){return new Pt(t.__tag,t.__key)}constructor(t,e){super(e),this.__tag=t;}getTag(){return this.__tag}setTag(t){const e=this.getWritable();return this.__tag=t,e}createDOM(t){const e=this.__tag,n=document.createElement(e),r=t.theme.heading;if(void 0!==r){const t=r[e];lt$3(n,t);}return n}updateDOM(t,e,n){return t.__tag!==this.__tag}static importDOM(){return {h1:t=>({conversion:At$2,priority:0}),h2:t=>({conversion:At$2,priority:0}),h3:t=>({conversion:At$2,priority:0}),h4:t=>({conversion:At$2,priority:0}),h5:t=>({conversion:At$2,priority:0}),h6:t=>({conversion:At$2,priority:0}),p:t=>{const e=t.firstChild;return null!==e&&Tt$2(e)?{conversion:()=>({node:null}),priority:3}:null},span:t=>Tt$2(t)?{conversion:t=>({node:St$2("h1")}),priority:3}:null}}exportDOM(t){const{element:e}=super.exportDOM(t);if(Cs(e)){this.isEmpty()&&e.append(document.createElement("br"));const t=this.getFormatType();t&&(e.style.textAlign=t);const n=this.getDirection();n&&(e.dir=n);}return {element:e}}static importJSON(t){return St$2(t.tag).updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setTag(t.tag)}exportJSON(){return {...super.exportJSON(),tag:this.getTag()}}insertNewAfter(t,e=true){const n=t?t.anchor.offset:0,r=this.getLastDescendant(),o=!r||t&&t.anchor.key===r.getKey()&&n===r.getTextContentSize()||!t?Li():St$2(this.getTag()),i=this.getDirection();if(o.setDirection(i),this.insertAfter(o,e),0===n&&!this.isEmpty()&&t){const t=Li();t.select(),this.replace(t,true);}return o}collapseAtStart(){const t=this.isEmpty()?Li():St$2(this.getTag());return this.getChildren().forEach(e=>t.append(e)),this.replace(t),true}extractWithChild(){return  true}};function Tt$2(t){return "span"===t.nodeName.toLowerCase()&&"26pt"===t.style.fontSize}function At$2(t){const e=t.nodeName.toLowerCase();let n=null;return "h1"!==e&&"h2"!==e&&"h3"!==e&&"h4"!==e&&"h5"!==e&&"h6"!==e||(n=St$2(e),null!==t.style&&(Ps(t,n),n.setFormat(t.style.textAlign))),{node:n}}function Ft$1(t){const e=_t$1();return null!==t.style&&(e.setFormat(t.style.textAlign),Ps(t,e)),{node:e}}function St$2(t="h1"){return fs(new Pt$2(t))}function It$1(t){return t instanceof Pt$2}function Mt$1(t){let e=null;if(Lt$3(t,DragEvent)?e=t.dataTransfer:Lt$3(t,ClipboardEvent)&&(e=t.clipboardData),null===e)return [false,[],false];const n=e.types,r=n.includes("Files"),o=n.includes("text/html")||n.includes("text/plain");return [r,Array.from(e.files),o]}function bt$2(t){const e=Lr();if(!yr(e))return  false;const n=new Set,r=e.getNodes();for(let e=0;e<r.length;e++){const o=r[e],i=o.getKey();if(n.has(i))continue;const s=zs(o,t=>Si(t)&&!t.isInline());if(null===s)continue;const c=s.getKey();s.canIndent()&&!n.has(c)&&(n.add(c),t(s));}return n.size>0}function Kt(t){const e=vo(t);return Ti(e)}function kt$2(t){for(const e of ["lowercase","uppercase","capitalize"])t.hasFormat(e)&&t.toggleFormat(e);}function Jt(n){return U$4(n.registerCommand(se$1,t=>{const e=Lr();return !!xr(e)&&(e.clear(),true)},Ki),n.registerCommand(le$2,t=>{const e=Lr();return yr(e)?(e.deleteCharacter(t),true):!!xr(e)&&(e.deleteNodes(),true)},Ki),n.registerCommand(he$1,t=>{const e=Lr();return !!yr(e)&&(e.deleteWord(t),true)},Ki),n.registerCommand(ge$1,t=>{const e=Lr();return !!yr(e)&&(e.deleteLine(t),true)},Ki),n.registerCommand(ue$1,e=>{const r=Lr();if("string"==typeof e)null!==r&&r.insertText(e);else {if(null===r)return  false;const o=e.dataTransfer;if(null!=o)R$2(o,r,n);else if(yr(r)){const t=e.data;return t&&r.insertText(t),true}}return  true},Ki),n.registerCommand(de$1,()=>{const t=Lr();return !!yr(t)&&(t.removeText(),true)},Ki),n.registerCommand(_e$1,t=>{const e=Lr();return !!yr(e)&&(e.formatText(t),true)},Ki),n.registerCommand(Le$1,t=>{const e=Lr();if(!yr(e)&&!xr(e))return  false;const n=e.getNodes();for(const e of n){const n=zs(e,t=>Si(t)&&!t.isInline());null!==n&&n.setFormat(t);}return  true},Ki),n.registerCommand(ce$1,t=>{const e=Lr();return !!yr(e)&&(e.insertLineBreak(t),true)},Ki),n.registerCommand(ae$1,()=>{const t=Lr();return !!yr(t)&&(t.insertParagraph(),true)},Ki),n.registerCommand(Ae$1,()=>(jr([ur()]),true),Ki),n.registerCommand(Pe$1,()=>bt$2(t=>{const e=t.getIndent();t.setIndent(e+1);}),Ki),n.registerCommand(De$1,()=>bt$2(t=>{const e=t.getIndent();e>0&&t.setIndent(Math.max(0,e-1));}),Ki),n.registerCommand(ke$1,t=>{const e=Lr();if(xr(e)){const n=e.getNodes();if(n.length>0)return t.preventDefault(),n[0].selectPrevious(),true}else if(yr(e)){const n=qo(e.focus,true);if(!t.shiftKey&&Ti(n)&&!n.isIsolated()&&!n.isInline())return n.selectPrevious(),t.preventDefault(),true}return  false},Ki),n.registerCommand(Te$1,t=>{const e=Lr();if(xr(e)){const n=e.getNodes();if(n.length>0)return t.preventDefault(),n[0].selectNext(0,0),true}else if(yr(e)){if(function(t){const e=t.focus;return "root"===e.key&&e.offset===No().getChildrenSize()}(e))return t.preventDefault(),true;const n=qo(e.focus,false);if(!t.shiftKey&&Ti(n)&&!n.isIsolated()&&!n.isInline())return n.selectNext(),t.preventDefault(),true}return  false},Ki),n.registerCommand(Se$1,t=>{const e=Lr();if(xr(e)){const n=e.getNodes();if(n.length>0)return t.preventDefault(),A$2(n[0])?n[0].selectNext(0,0):n[0].selectPrevious(),true}if(!yr(e))return  false;if(Z$3(e,true)){const n=t.shiftKey;return t.preventDefault(),ne(e,n,true),true}return  false},Ki),n.registerCommand(xe,t=>{const e=Lr();if(xr(e)){const n=e.getNodes();if(n.length>0)return t.preventDefault(),A$2(n[0])?n[0].selectPrevious():n[0].selectNext(0,0),true}if(!yr(e))return  false;const n=t.shiftKey;return !!Z$3(e,false)&&(t.preventDefault(),ne(e,n,false),true)},Ki),n.registerCommand(we$1,t=>{if(Kt(t.target))return  false;const e=Lr();if(yr(e)){if(function(t){if(!t.isCollapsed())return  false;const{anchor:e}=t;if(0!==e.offset)return  false;const n=e.getNode();if(bi(n))return  false;const r=xt$4(n);return r.getIndent()>0&&(r.is(n)||n.is(r.getFirstDescendant()))}(e))return t.preventDefault(),n.dispatchCommand(De$1,void 0);if(xt$1&&"ko-KR"===navigator.language)return  false}else if(!xr(e))return  false;return t.preventDefault(),n.dispatchCommand(le$2,true)},Ki),n.registerCommand(Oe$1,t=>{if(Kt(t.target))return  false;const e=Lr();return !(!yr(e)&&!xr(e))&&(t.preventDefault(),n.dispatchCommand(le$2,false))},Ki),n.registerCommand(Ne$1,t=>{const e=Lr();if(!yr(e))return  false;if(kt$2(e),null!==t){if((xt$1||yt$1||Nt$2)&&Ct$2)return  false;if(t.preventDefault(),t.shiftKey)return n.dispatchCommand(ce$1,false)}return n.dispatchCommand(ae$1,void 0)},Ki),n.registerCommand(Ee$1,()=>{const t=Lr();return !!yr(t)&&(n.blur(),true)},Ki),n.registerCommand(Fe$1,t=>{const[,e]=Mt$1(t);if(e.length>0){const r=gt$1(t.clientX,t.clientY);if(null!==r){const{offset:t,node:o}=r,i=vo(o);if(null!==i){const e=Ar();if(lr(i))e.anchor.set(i.getKey(),t,"text"),e.focus.set(i.getKey(),t,"text");else {const t=i.getParentOrThrow().getKey(),n=i.getIndexWithinParent()+1;e.anchor.set(t,n,"element"),e.focus.set(t,n,"element");}const n=St$5(e);wo(n);}n.dispatchCommand(wt$2,e);}return t.preventDefault(),true}const r=Lr();return !!yr(r)},Ki),n.registerCommand(Ie$1,t=>{const[e]=Mt$1(t),n=Lr();return !(e&&!yr(n))},Ki),n.registerCommand(Ke$1,t=>{const[e]=Mt$1(t),n=Lr();if(e&&!yr(n))return  false;const r=gt$1(t.clientX,t.clientY);if(null!==r){const e=vo(r.node);Ti(e)&&t.preventDefault();}return  true},Ki),n.registerCommand(We$1,()=>(jo(),true),Ki),n.registerCommand(Re$1,t=>(F$1(n,Lt$3(t,ClipboardEvent)?t:null),true),Ki),n.registerCommand(Be$1,t=>(async function(t,n){await F$1(n,Lt$3(t,ClipboardEvent)?t:null),n.update(()=>{const t=Lr();yr(t)?t.removeText():xr(t)&&t.getNodes().forEach(t=>t.remove());});}(t,n),true),Ki),n.registerCommand(fe$1,e=>{const[,r,o]=Mt$1(e);if(r.length>0&&!o)return n.dispatchCommand(wt$2,r),true;if(Ss(e.target)&&to(e.target))return  false;return null!==Lr()&&(function(e,n){e.preventDefault(),n.update(()=>{const r=Lr(),o=Lt$3(e,InputEvent)||Lt$3(e,KeyboardEvent)?null:e.clipboardData;null!=o&&null!==r&&R$2(o,r,n);},{tag:Fn});}(e,n),true)},Ki),n.registerCommand(be$1,t=>{const e=Lr();return yr(e)&&kt$2(e),false},Ki),n.registerCommand(Me$1,t=>{const e=Lr();return yr(e)&&kt$2(e),false},Ki))}

/* **********************************************
     Begin prism-core.js
********************************************** */

/// <reference lib="WebWorker"/>

var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
			? self // if in worker
			: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Lea Verou <https://lea.verou.me>
 * @namespace
 * @public
 */
var Prism$1 = (function (_self) {

	// Private helper vars
	var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
	var uniqueId = 0;

	// The grammar object for plaintext
	var plainTextGrammar = {};


	var _ = {
		/**
		 * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
		 * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
		 * additional languages or plugins yourself.
		 *
		 * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
		 *
		 * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
		 * empty Prism object into the global scope before loading the Prism script like this:
		 *
		 * ```js
		 * window.Prism = window.Prism || {};
		 * Prism.manual = true;
		 * // add a new <script> to load Prism's script
		 * ```
		 *
		 * @default false
		 * @type {boolean}
		 * @memberof Prism
		 * @public
		 */
		manual: _self.Prism && _self.Prism.manual,
		/**
		 * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
		 * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
		 * own worker, you don't want it to do this.
		 *
		 * By setting this value to `true`, Prism will not add its own listeners to the worker.
		 *
		 * You obviously have to change this value before Prism executes. To do this, you can add an
		 * empty Prism object into the global scope before loading the Prism script like this:
		 *
		 * ```js
		 * window.Prism = window.Prism || {};
		 * Prism.disableWorkerMessageHandler = true;
		 * // Load Prism's script
		 * ```
		 *
		 * @default false
		 * @type {boolean}
		 * @memberof Prism
		 * @public
		 */
		disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

		/**
		 * A namespace for utility methods.
		 *
		 * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
		 * change or disappear at any time.
		 *
		 * @namespace
		 * @memberof Prism
		 */
		util: {
			encode: function encode(tokens) {
				if (tokens instanceof Token) {
					return new Token(tokens.type, encode(tokens.content), tokens.alias);
				} else if (Array.isArray(tokens)) {
					return tokens.map(encode);
				} else {
					return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
				}
			},

			/**
			 * Returns the name of the type of the given value.
			 *
			 * @param {any} o
			 * @returns {string}
			 * @example
			 * type(null)      === 'Null'
			 * type(undefined) === 'Undefined'
			 * type(123)       === 'Number'
			 * type('foo')     === 'String'
			 * type(true)      === 'Boolean'
			 * type([1, 2])    === 'Array'
			 * type({})        === 'Object'
			 * type(String)    === 'Function'
			 * type(/abc+/)    === 'RegExp'
			 */
			type: function (o) {
				return Object.prototype.toString.call(o).slice(8, -1);
			},

			/**
			 * Returns a unique number for the given object. Later calls will still return the same number.
			 *
			 * @param {Object} obj
			 * @returns {number}
			 */
			objId: function (obj) {
				if (!obj['__id']) {
					Object.defineProperty(obj, '__id', { value: ++uniqueId });
				}
				return obj['__id'];
			},

			/**
			 * Creates a deep clone of the given object.
			 *
			 * The main intended use of this function is to clone language definitions.
			 *
			 * @param {T} o
			 * @param {Record<number, any>} [visited]
			 * @returns {T}
			 * @template T
			 */
			clone: function deepClone(o, visited) {
				visited = visited || {};

				var clone; var id;
				switch (_.util.type(o)) {
					case 'Object':
						id = _.util.objId(o);
						if (visited[id]) {
							return visited[id];
						}
						clone = /** @type {Record<string, any>} */ ({});
						visited[id] = clone;

						for (var key in o) {
							if (o.hasOwnProperty(key)) {
								clone[key] = deepClone(o[key], visited);
							}
						}

						return /** @type {any} */ (clone);

					case 'Array':
						id = _.util.objId(o);
						if (visited[id]) {
							return visited[id];
						}
						clone = [];
						visited[id] = clone;

						(/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
							clone[i] = deepClone(v, visited);
						});

						return /** @type {any} */ (clone);

					default:
						return o;
				}
			},

			/**
			 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
			 *
			 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
			 *
			 * @param {Element} element
			 * @returns {string}
			 */
			getLanguage: function (element) {
				while (element) {
					var m = lang.exec(element.className);
					if (m) {
						return m[1].toLowerCase();
					}
					element = element.parentElement;
				}
				return 'none';
			},

			/**
			 * Sets the Prism `language-xxxx` class of the given element.
			 *
			 * @param {Element} element
			 * @param {string} language
			 * @returns {void}
			 */
			setLanguage: function (element, language) {
				// remove all `language-xxxx` classes
				// (this might leave behind a leading space)
				element.className = element.className.replace(RegExp(lang, 'gi'), '');

				// add the new `language-xxxx` class
				// (using `classList` will automatically clean up spaces for us)
				element.classList.add('language-' + language);
			},

			/**
			 * Returns the script element that is currently executing.
			 *
			 * This does __not__ work for line script element.
			 *
			 * @returns {HTMLScriptElement | null}
			 */
			currentScript: function () {
				if (typeof document === 'undefined') {
					return null;
				}
				if (document.currentScript && document.currentScript.tagName === 'SCRIPT' && 1 < 2 /* hack to trip TS' flow analysis */) {
					return /** @type {any} */ (document.currentScript);
				}

				// IE11 workaround
				// we'll get the src of the current script by parsing IE11's error stack trace
				// this will not work for inline scripts

				try {
					throw new Error();
				} catch (err) {
					// Get file src url from stack. Specifically works with the format of stack traces in IE.
					// A stack will look like this:
					//
					// Error
					//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
					//    at Global code (http://localhost/components/prism-core.js:606:1)

					var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
					if (src) {
						var scripts = document.getElementsByTagName('script');
						for (var i in scripts) {
							if (scripts[i].src == src) {
								return scripts[i];
							}
						}
					}
					return null;
				}
			},

			/**
			 * Returns whether a given class is active for `element`.
			 *
			 * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
			 * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
			 * given class is just the given class with a `no-` prefix.
			 *
			 * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
			 * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
			 * ancestors have the given class or the negated version of it, then the default activation will be returned.
			 *
			 * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
			 * version of it, the class is considered active.
			 *
			 * @param {Element} element
			 * @param {string} className
			 * @param {boolean} [defaultActivation=false]
			 * @returns {boolean}
			 */
			isActive: function (element, className, defaultActivation) {
				var no = 'no-' + className;

				while (element) {
					var classList = element.classList;
					if (classList.contains(className)) {
						return true;
					}
					if (classList.contains(no)) {
						return false;
					}
					element = element.parentElement;
				}
				return !!defaultActivation;
			}
		},

		/**
		 * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
		 *
		 * @namespace
		 * @memberof Prism
		 * @public
		 */
		languages: {
			/**
			 * The grammar for plain, unformatted text.
			 */
			plain: plainTextGrammar,
			plaintext: plainTextGrammar,
			text: plainTextGrammar,
			txt: plainTextGrammar,

			/**
			 * Creates a deep copy of the language with the given id and appends the given tokens.
			 *
			 * If a token in `redef` also appears in the copied language, then the existing token in the copied language
			 * will be overwritten at its original position.
			 *
			 * ## Best practices
			 *
			 * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
			 * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
			 * understand the language definition because, normally, the order of tokens matters in Prism grammars.
			 *
			 * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
			 * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
			 *
			 * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
			 * @param {Grammar} redef The new tokens to append.
			 * @returns {Grammar} The new language created.
			 * @public
			 * @example
			 * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
			 *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
			 *     // at its original position
			 *     'comment': { ... },
			 *     // CSS doesn't have a 'color' token, so this token will be appended
			 *     'color': /\b(?:red|green|blue)\b/
			 * });
			 */
			extend: function (id, redef) {
				var lang = _.util.clone(_.languages[id]);

				for (var key in redef) {
					lang[key] = redef[key];
				}

				return lang;
			},

			/**
			 * Inserts tokens _before_ another token in a language definition or any other grammar.
			 *
			 * ## Usage
			 *
			 * This helper method makes it easy to modify existing languages. For example, the CSS language definition
			 * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
			 * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
			 * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
			 * this:
			 *
			 * ```js
			 * Prism.languages.markup.style = {
			 *     // token
			 * };
			 * ```
			 *
			 * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
			 * before existing tokens. For the CSS example above, you would use it like this:
			 *
			 * ```js
			 * Prism.languages.insertBefore('markup', 'cdata', {
			 *     'style': {
			 *         // token
			 *     }
			 * });
			 * ```
			 *
			 * ## Special cases
			 *
			 * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
			 * will be ignored.
			 *
			 * This behavior can be used to insert tokens after `before`:
			 *
			 * ```js
			 * Prism.languages.insertBefore('markup', 'comment', {
			 *     'comment': Prism.languages.markup.comment,
			 *     // tokens after 'comment'
			 * });
			 * ```
			 *
			 * ## Limitations
			 *
			 * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
			 * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
			 * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
			 * deleting properties which is necessary to insert at arbitrary positions.
			 *
			 * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
			 * Instead, it will create a new object and replace all references to the target object with the new one. This
			 * can be done without temporarily deleting properties, so the iteration order is well-defined.
			 *
			 * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
			 * you hold the target object in a variable, then the value of the variable will not change.
			 *
			 * ```js
			 * var oldMarkup = Prism.languages.markup;
			 * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
			 *
			 * assert(oldMarkup !== Prism.languages.markup);
			 * assert(newMarkup === Prism.languages.markup);
			 * ```
			 *
			 * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
			 * object to be modified.
			 * @param {string} before The key to insert before.
			 * @param {Grammar} insert An object containing the key-value pairs to be inserted.
			 * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
			 * object to be modified.
			 *
			 * Defaults to `Prism.languages`.
			 * @returns {Grammar} The new grammar object.
			 * @public
			 */
			insertBefore: function (inside, before, insert, root) {
				root = root || /** @type {any} */ (_.languages);
				var grammar = root[inside];
				/** @type {Grammar} */
				var ret = {};

				for (var token in grammar) {
					if (grammar.hasOwnProperty(token)) {

						if (token == before) {
							for (var newToken in insert) {
								if (insert.hasOwnProperty(newToken)) {
									ret[newToken] = insert[newToken];
								}
							}
						}

						// Do not insert token which also occur in insert. See #1525
						if (!insert.hasOwnProperty(token)) {
							ret[token] = grammar[token];
						}
					}
				}

				var old = root[inside];
				root[inside] = ret;

				// Update references in other language definitions
				_.languages.DFS(_.languages, function (key, value) {
					if (value === old && key != inside) {
						this[key] = ret;
					}
				});

				return ret;
			},

			// Traverse a language definition with Depth First Search
			DFS: function DFS(o, callback, type, visited) {
				visited = visited || {};

				var objId = _.util.objId;

				for (var i in o) {
					if (o.hasOwnProperty(i)) {
						callback.call(o, i, o[i], type || i);

						var property = o[i];
						var propertyType = _.util.type(property);

						if (propertyType === 'Object' && !visited[objId(property)]) {
							visited[objId(property)] = true;
							DFS(property, callback, null, visited);
						} else if (propertyType === 'Array' && !visited[objId(property)]) {
							visited[objId(property)] = true;
							DFS(property, callback, i, visited);
						}
					}
				}
			}
		},

		plugins: {},

		/**
		 * This is the most high-level function in Prism’s API.
		 * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
		 * each one of them.
		 *
		 * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
		 *
		 * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
		 * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
		 * @memberof Prism
		 * @public
		 */
		highlightAll: function (async, callback) {
			_.highlightAllUnder(document, async, callback);
		},

		/**
		 * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
		 * {@link Prism.highlightElement} on each one of them.
		 *
		 * The following hooks will be run:
		 * 1. `before-highlightall`
		 * 2. `before-all-elements-highlight`
		 * 3. All hooks of {@link Prism.highlightElement} for each element.
		 *
		 * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
		 * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
		 * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
		 * @memberof Prism
		 * @public
		 */
		highlightAllUnder: function (container, async, callback) {
			var env = {
				callback: callback,
				container: container,
				selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
			};

			_.hooks.run('before-highlightall', env);

			env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

			_.hooks.run('before-all-elements-highlight', env);

			for (var i = 0, element; (element = env.elements[i++]);) {
				_.highlightElement(element, async === true, env.callback);
			}
		},

		/**
		 * Highlights the code inside a single element.
		 *
		 * The following hooks will be run:
		 * 1. `before-sanity-check`
		 * 2. `before-highlight`
		 * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
		 * 4. `before-insert`
		 * 5. `after-highlight`
		 * 6. `complete`
		 *
		 * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
		 * the element's language.
		 *
		 * @param {Element} element The element containing the code.
		 * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
		 * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
		 * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
		 * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
		 *
		 * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
		 * asynchronous highlighting to work. You can build your own bundle on the
		 * [Download page](https://prismjs.com/download.html).
		 * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
		 * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
		 * @memberof Prism
		 * @public
		 */
		highlightElement: function (element, async, callback) {
			// Find language
			var language = _.util.getLanguage(element);
			var grammar = _.languages[language];

			// Set language on the element, if not present
			_.util.setLanguage(element, language);

			// Set language on the parent, for styling
			var parent = element.parentElement;
			if (parent && parent.nodeName.toLowerCase() === 'pre') {
				_.util.setLanguage(parent, language);
			}

			var code = element.textContent;

			var env = {
				element: element,
				language: language,
				grammar: grammar,
				code: code
			};

			function insertHighlightedCode(highlightedCode) {
				env.highlightedCode = highlightedCode;

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
				callback && callback.call(env.element);
			}

			_.hooks.run('before-sanity-check', env);

			// plugins may change/add the parent/element
			parent = env.element.parentElement;
			if (parent && parent.nodeName.toLowerCase() === 'pre' && !parent.hasAttribute('tabindex')) {
				parent.setAttribute('tabindex', '0');
			}

			if (!env.code) {
				_.hooks.run('complete', env);
				callback && callback.call(env.element);
				return;
			}

			_.hooks.run('before-highlight', env);

			if (!env.grammar) {
				insertHighlightedCode(_.util.encode(env.code));
				return;
			}

			if (async && _self.Worker) {
				var worker = new Worker(_.filename);

				worker.onmessage = function (evt) {
					insertHighlightedCode(evt.data);
				};

				worker.postMessage(JSON.stringify({
					language: env.language,
					code: env.code,
					immediateClose: true
				}));
			} else {
				insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
			}
		},

		/**
		 * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
		 * and the language definitions to use, and returns a string with the HTML produced.
		 *
		 * The following hooks will be run:
		 * 1. `before-tokenize`
		 * 2. `after-tokenize`
		 * 3. `wrap`: On each {@link Token}.
		 *
		 * @param {string} text A string with the code to be highlighted.
		 * @param {Grammar} grammar An object containing the tokens to use.
		 *
		 * Usually a language definition like `Prism.languages.markup`.
		 * @param {string} language The name of the language definition passed to `grammar`.
		 * @returns {string} The highlighted HTML.
		 * @memberof Prism
		 * @public
		 * @example
		 * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
		 */
		highlight: function (text, grammar, language) {
			var env = {
				code: text,
				grammar: grammar,
				language: language
			};
			_.hooks.run('before-tokenize', env);
			if (!env.grammar) {
				throw new Error('The language "' + env.language + '" has no grammar.');
			}
			env.tokens = _.tokenize(env.code, env.grammar);
			_.hooks.run('after-tokenize', env);
			return Token.stringify(_.util.encode(env.tokens), env.language);
		},

		/**
		 * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
		 * and the language definitions to use, and returns an array with the tokenized code.
		 *
		 * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
		 *
		 * This method could be useful in other contexts as well, as a very crude parser.
		 *
		 * @param {string} text A string with the code to be highlighted.
		 * @param {Grammar} grammar An object containing the tokens to use.
		 *
		 * Usually a language definition like `Prism.languages.markup`.
		 * @returns {TokenStream} An array of strings and tokens, a token stream.
		 * @memberof Prism
		 * @public
		 * @example
		 * let code = `var foo = 0;`;
		 * let tokens = Prism.tokenize(code, Prism.languages.javascript);
		 * tokens.forEach(token => {
		 *     if (token instanceof Prism.Token && token.type === 'number') {
		 *         console.log(`Found numeric literal: ${token.content}`);
		 *     }
		 * });
		 */
		tokenize: function (text, grammar) {
			var rest = grammar.rest;
			if (rest) {
				for (var token in rest) {
					grammar[token] = rest[token];
				}

				delete grammar.rest;
			}

			var tokenList = new LinkedList();
			addAfter(tokenList, tokenList.head, text);

			matchGrammar(text, tokenList, grammar, tokenList.head, 0);

			return toArray(tokenList);
		},

		/**
		 * @namespace
		 * @memberof Prism
		 * @public
		 */
		hooks: {
			all: {},

			/**
			 * Adds the given callback to the list of callbacks for the given hook.
			 *
			 * The callback will be invoked when the hook it is registered for is run.
			 * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
			 *
			 * One callback function can be registered to multiple hooks and the same hook multiple times.
			 *
			 * @param {string} name The name of the hook.
			 * @param {HookCallback} callback The callback function which is given environment variables.
			 * @public
			 */
			add: function (name, callback) {
				var hooks = _.hooks.all;

				hooks[name] = hooks[name] || [];

				hooks[name].push(callback);
			},

			/**
			 * Runs a hook invoking all registered callbacks with the given environment variables.
			 *
			 * Callbacks will be invoked synchronously and in the order in which they were registered.
			 *
			 * @param {string} name The name of the hook.
			 * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
			 * @public
			 */
			run: function (name, env) {
				var callbacks = _.hooks.all[name];

				if (!callbacks || !callbacks.length) {
					return;
				}

				for (var i = 0, callback; (callback = callbacks[i++]);) {
					callback(env);
				}
			}
		},

		Token: Token
	};
	_self.Prism = _;


	// Typescript note:
	// The following can be used to import the Token type in JSDoc:
	//
	//   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

	/**
	 * Creates a new token.
	 *
	 * @param {string} type See {@link Token#type type}
	 * @param {string | TokenStream} content See {@link Token#content content}
	 * @param {string|string[]} [alias] The alias(es) of the token.
	 * @param {string} [matchedStr=""] A copy of the full string this token was created from.
	 * @class
	 * @global
	 * @public
	 */
	function Token(type, content, alias, matchedStr) {
		/**
		 * The type of the token.
		 *
		 * This is usually the key of a pattern in a {@link Grammar}.
		 *
		 * @type {string}
		 * @see GrammarToken
		 * @public
		 */
		this.type = type;
		/**
		 * The strings or tokens contained by this token.
		 *
		 * This will be a token stream if the pattern matched also defined an `inside` grammar.
		 *
		 * @type {string | TokenStream}
		 * @public
		 */
		this.content = content;
		/**
		 * The alias(es) of the token.
		 *
		 * @type {string|string[]}
		 * @see GrammarToken
		 * @public
		 */
		this.alias = alias;
		// Copy of the full string this token was created from
		this.length = (matchedStr || '').length | 0;
	}

	/**
	 * A token stream is an array of strings and {@link Token Token} objects.
	 *
	 * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
	 * them.
	 *
	 * 1. No adjacent strings.
	 * 2. No empty strings.
	 *
	 *    The only exception here is the token stream that only contains the empty string and nothing else.
	 *
	 * @typedef {Array<string | Token>} TokenStream
	 * @global
	 * @public
	 */

	/**
	 * Converts the given token or token stream to an HTML representation.
	 *
	 * The following hooks will be run:
	 * 1. `wrap`: On each {@link Token}.
	 *
	 * @param {string | Token | TokenStream} o The token or token stream to be converted.
	 * @param {string} language The name of current language.
	 * @returns {string} The HTML representation of the token or token stream.
	 * @memberof Token
	 * @static
	 */
	Token.stringify = function stringify(o, language) {
		if (typeof o == 'string') {
			return o;
		}
		if (Array.isArray(o)) {
			var s = '';
			o.forEach(function (e) {
				s += stringify(e, language);
			});
			return s;
		}

		var env = {
			type: o.type,
			content: stringify(o.content, language),
			tag: 'span',
			classes: ['token', o.type],
			attributes: {},
			language: language
		};

		var aliases = o.alias;
		if (aliases) {
			if (Array.isArray(aliases)) {
				Array.prototype.push.apply(env.classes, aliases);
			} else {
				env.classes.push(aliases);
			}
		}

		_.hooks.run('wrap', env);

		var attributes = '';
		for (var name in env.attributes) {
			attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
		}

		return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
	};

	/**
	 * @param {RegExp} pattern
	 * @param {number} pos
	 * @param {string} text
	 * @param {boolean} lookbehind
	 * @returns {RegExpExecArray | null}
	 */
	function matchPattern(pattern, pos, text, lookbehind) {
		pattern.lastIndex = pos;
		var match = pattern.exec(text);
		if (match && lookbehind && match[1]) {
			// change the match to remove the text matched by the Prism lookbehind group
			var lookbehindLength = match[1].length;
			match.index += lookbehindLength;
			match[0] = match[0].slice(lookbehindLength);
		}
		return match;
	}

	/**
	 * @param {string} text
	 * @param {LinkedList<string | Token>} tokenList
	 * @param {any} grammar
	 * @param {LinkedListNode<string | Token>} startNode
	 * @param {number} startPos
	 * @param {RematchOptions} [rematch]
	 * @returns {void}
	 * @private
	 *
	 * @typedef RematchOptions
	 * @property {string} cause
	 * @property {number} reach
	 */
	function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
		for (var token in grammar) {
			if (!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			var patterns = grammar[token];
			patterns = Array.isArray(patterns) ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				if (rematch && rematch.cause == token + ',' + j) {
					return;
				}

				var patternObj = patterns[j];
				var inside = patternObj.inside;
				var lookbehind = !!patternObj.lookbehind;
				var greedy = !!patternObj.greedy;
				var alias = patternObj.alias;

				if (greedy && !patternObj.pattern.global) {
					// Without the global flag, lastIndex won't work
					var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
					patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
				}

				/** @type {RegExp} */
				var pattern = patternObj.pattern || patternObj;

				for ( // iterate the token list and keep track of the current token/string position
					var currentNode = startNode.next, pos = startPos;
					currentNode !== tokenList.tail;
					pos += currentNode.value.length, currentNode = currentNode.next
				) {

					if (rematch && pos >= rematch.reach) {
						break;
					}

					var str = currentNode.value;

					if (tokenList.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						return;
					}

					if (str instanceof Token) {
						continue;
					}

					var removeCount = 1; // this is the to parameter of removeBetween
					var match;

					if (greedy) {
						match = matchPattern(pattern, pos, text, lookbehind);
						if (!match || match.index >= text.length) {
							break;
						}

						var from = match.index;
						var to = match.index + match[0].length;
						var p = pos;

						// find the node that contains the match
						p += currentNode.value.length;
						while (from >= p) {
							currentNode = currentNode.next;
							p += currentNode.value.length;
						}
						// adjust pos (and p)
						p -= currentNode.value.length;
						pos = p;

						// the current node is a Token, then the match starts inside another Token, which is invalid
						if (currentNode.value instanceof Token) {
							continue;
						}

						// find the last node which is affected by this match
						for (
							var k = currentNode;
							k !== tokenList.tail && (p < to || typeof k.value === 'string');
							k = k.next
						) {
							removeCount++;
							p += k.value.length;
						}
						removeCount--;

						// replace with the new match
						str = text.slice(pos, p);
						match.index -= pos;
					} else {
						match = matchPattern(pattern, 0, str, lookbehind);
						if (!match) {
							continue;
						}
					}

					// eslint-disable-next-line no-redeclare
					var from = match.index;
					var matchStr = match[0];
					var before = str.slice(0, from);
					var after = str.slice(from + matchStr.length);

					var reach = pos + str.length;
					if (rematch && reach > rematch.reach) {
						rematch.reach = reach;
					}

					var removeFrom = currentNode.prev;

					if (before) {
						removeFrom = addAfter(tokenList, removeFrom, before);
						pos += before.length;
					}

					removeRange(tokenList, removeFrom, removeCount);

					var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
					currentNode = addAfter(tokenList, removeFrom, wrapped);

					if (after) {
						addAfter(tokenList, currentNode, after);
					}

					if (removeCount > 1) {
						// at least one Token object was removed, so we have to do some rematching
						// this can only happen if the current pattern is greedy

						/** @type {RematchOptions} */
						var nestedRematch = {
							cause: token + ',' + j,
							reach: reach
						};
						matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

						// the reach might have been extended because of the rematching
						if (rematch && nestedRematch.reach > rematch.reach) {
							rematch.reach = nestedRematch.reach;
						}
					}
				}
			}
		}
	}

	/**
	 * @typedef LinkedListNode
	 * @property {T} value
	 * @property {LinkedListNode<T> | null} prev The previous node.
	 * @property {LinkedListNode<T> | null} next The next node.
	 * @template T
	 * @private
	 */

	/**
	 * @template T
	 * @private
	 */
	function LinkedList() {
		/** @type {LinkedListNode<T>} */
		var head = { value: null, prev: null, next: null };
		/** @type {LinkedListNode<T>} */
		var tail = { value: null, prev: head, next: null };
		head.next = tail;

		/** @type {LinkedListNode<T>} */
		this.head = head;
		/** @type {LinkedListNode<T>} */
		this.tail = tail;
		this.length = 0;
	}

	/**
	 * Adds a new node with the given value to the list.
	 *
	 * @param {LinkedList<T>} list
	 * @param {LinkedListNode<T>} node
	 * @param {T} value
	 * @returns {LinkedListNode<T>} The added node.
	 * @template T
	 */
	function addAfter(list, node, value) {
		// assumes that node != list.tail && values.length >= 0
		var next = node.next;

		var newNode = { value: value, prev: node, next: next };
		node.next = newNode;
		next.prev = newNode;
		list.length++;

		return newNode;
	}
	/**
	 * Removes `count` nodes after the given node. The given node will not be removed.
	 *
	 * @param {LinkedList<T>} list
	 * @param {LinkedListNode<T>} node
	 * @param {number} count
	 * @template T
	 */
	function removeRange(list, node, count) {
		var next = node.next;
		for (var i = 0; i < count && next !== list.tail; i++) {
			next = next.next;
		}
		node.next = next;
		next.prev = node;
		list.length -= i;
	}
	/**
	 * @param {LinkedList<T>} list
	 * @returns {T[]}
	 * @template T
	 */
	function toArray(list) {
		var array = [];
		var node = list.head.next;
		while (node !== list.tail) {
			array.push(node.value);
			node = node.next;
		}
		return array;
	}


	if (!_self.document) {
		if (!_self.addEventListener) {
			// in Node.js
			return _;
		}

		if (!_.disableWorkerMessageHandler) {
			// In worker
			_self.addEventListener('message', function (evt) {
				var message = JSON.parse(evt.data);
				var lang = message.language;
				var code = message.code;
				var immediateClose = message.immediateClose;

				_self.postMessage(_.highlight(code, _.languages[lang], lang));
				if (immediateClose) {
					_self.close();
				}
			}, false);
		}

		return _;
	}

	// Get current script and highlight
	var script = _.util.currentScript();

	if (script) {
		_.filename = script.src;

		if (script.hasAttribute('data-manual')) {
			_.manual = true;
		}
	}

	function highlightAutomaticallyCallback() {
		if (!_.manual) {
			_.highlightAll();
		}
	}

	if (!_.manual) {
		// If the document state is "loading", then we'll use DOMContentLoaded.
		// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
		// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
		// might take longer one animation frame to execute which can create a race condition where only some plugins have
		// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
		// See https://github.com/PrismJS/prism/issues/2102
		var readyState = document.readyState;
		if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
			document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
		} else {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(highlightAutomaticallyCallback);
			} else {
				window.setTimeout(highlightAutomaticallyCallback, 16);
			}
		}
	}

	return _;

}(_self));

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism$1;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
	global.Prism = Prism$1;
}

// some additional documentation/types

/**
 * The expansion of a simple `RegExp` literal to support additional properties.
 *
 * @typedef GrammarToken
 * @property {RegExp} pattern The regular expression of the token.
 * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
 * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
 * @property {boolean} [greedy=false] Whether the token is greedy.
 * @property {string|string[]} [alias] An optional alias or list of aliases.
 * @property {Grammar} [inside] The nested grammar of this token.
 *
 * The `inside` grammar will be used to tokenize the text value of each token of this kind.
 *
 * This can be used to make nested and even recursive language definitions.
 *
 * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
 * each another.
 * @global
 * @public
 */

/**
 * @typedef Grammar
 * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
 * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
 * @global
 * @public
 */

/**
 * A function which will invoked after an element was successfully highlighted.
 *
 * @callback HighlightCallback
 * @param {Element} element The element successfully highlighted.
 * @returns {void}
 * @global
 * @public
 */

/**
 * @callback HookCallback
 * @param {Object<string, any>} env The environment variables of the hook.
 * @returns {void}
 * @global
 * @public
 */


/* **********************************************
     Begin prism-markup.js
********************************************** */

Prism$1.languages.markup = {
	'comment': {
		pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
		greedy: true
	},
	'prolog': {
		pattern: /<\?[\s\S]+?\?>/,
		greedy: true
	},
	'doctype': {
		// https://www.w3.org/TR/xml/#NT-doctypedecl
		pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
		greedy: true,
		inside: {
			'internal-subset': {
				pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
				lookbehind: true,
				greedy: true,
				inside: null // see below
			},
			'string': {
				pattern: /"[^"]*"|'[^']*'/,
				greedy: true
			},
			'punctuation': /^<!|>$|[[\]]/,
			'doctype-tag': /^DOCTYPE/i,
			'name': /[^\s<>'"]+/
		}
	},
	'cdata': {
		pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
		greedy: true
	},
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
		greedy: true,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'special-attr': [],
			'attr-value': {
				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
				inside: {
					'punctuation': [
						{
							pattern: /^=/,
							alias: 'attr-equals'
						},
						{
							pattern: /^(\s*)["']|["']$/,
							lookbehind: true
						}
					]
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': [
		{
			pattern: /&[\da-z]{1,8};/i,
			alias: 'named-entity'
		},
		/&#x?[\da-f]{1,8};/i
	]
};

Prism$1.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism$1.languages.markup['entity'];
Prism$1.languages.markup['doctype'].inside['internal-subset'].inside = Prism$1.languages.markup;

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism$1.hooks.add('wrap', function (env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Object.defineProperty(Prism$1.languages.markup.tag, 'addInlined', {
	/**
	 * Adds an inlined language to markup.
	 *
	 * An example of an inlined language is CSS with `<style>` tags.
	 *
	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
	 * case insensitive.
	 * @param {string} lang The language key.
	 * @example
	 * addInlined('style', 'css');
	 */
	value: function addInlined(tagName, lang) {
		var includedCdataInside = {};
		includedCdataInside['language-' + lang] = {
			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
			lookbehind: true,
			inside: Prism$1.languages[lang]
		};
		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

		var inside = {
			'included-cdata': {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				inside: includedCdataInside
			}
		};
		inside['language-' + lang] = {
			pattern: /[\s\S]+/,
			inside: Prism$1.languages[lang]
		};

		var def = {};
		def[tagName] = {
			pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
			lookbehind: true,
			greedy: true,
			inside: inside
		};

		Prism$1.languages.insertBefore('markup', 'cdata', def);
	}
});
Object.defineProperty(Prism$1.languages.markup.tag, 'addAttribute', {
	/**
	 * Adds an pattern to highlight languages embedded in HTML attributes.
	 *
	 * An example of an inlined language is CSS with `style` attributes.
	 *
	 * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
	 * case insensitive.
	 * @param {string} lang The language key.
	 * @example
	 * addAttribute('style', 'css');
	 */
	value: function (attrName, lang) {
		Prism$1.languages.markup.tag.inside['special-attr'].push({
			pattern: RegExp(
				/(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
				'i'
			),
			lookbehind: true,
			inside: {
				'attr-name': /^[^\s=]+/,
				'attr-value': {
					pattern: /=[\s\S]+/,
					inside: {
						'value': {
							pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
							lookbehind: true,
							alias: [lang, 'language-' + lang],
							inside: Prism$1.languages[lang]
						},
						'punctuation': [
							{
								pattern: /^=/,
								alias: 'attr-equals'
							},
							/"|'/
						]
					}
				}
			}
		});
	}
});

Prism$1.languages.html = Prism$1.languages.markup;
Prism$1.languages.mathml = Prism$1.languages.markup;
Prism$1.languages.svg = Prism$1.languages.markup;

Prism$1.languages.xml = Prism$1.languages.extend('markup', {});
Prism$1.languages.ssml = Prism$1.languages.xml;
Prism$1.languages.atom = Prism$1.languages.xml;
Prism$1.languages.rss = Prism$1.languages.xml;


/* **********************************************
     Begin prism-css.js
********************************************** */

(function (Prism) {

	var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

	Prism.languages.css = {
		'comment': /\/\*[\s\S]*?\*\//,
		'atrule': {
			pattern: RegExp('@[\\w-](?:' + /[^;{\s"']|\s+(?!\s)/.source + '|' + string.source + ')*?' + /(?:;|(?=\s*\{))/.source),
			inside: {
				'rule': /^@[\w-]+/,
				'selector-function-argument': {
					pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
					lookbehind: true,
					alias: 'selector'
				},
				'keyword': {
					pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
					lookbehind: true
				}
				// See rest below
			}
		},
		'url': {
			// https://drafts.csswg.org/css-values-3/#urls
			pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
			greedy: true,
			inside: {
				'function': /^url/i,
				'punctuation': /^\(|\)$/,
				'string': {
					pattern: RegExp('^' + string.source + '$'),
					alias: 'url'
				}
			}
		},
		'selector': {
			pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
			lookbehind: true
		},
		'string': {
			pattern: string,
			greedy: true
		},
		'property': {
			pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
			lookbehind: true
		},
		'important': /!important\b/i,
		'function': {
			pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
			lookbehind: true
		},
		'punctuation': /[(){};:,]/
	};

	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

	var markup = Prism.languages.markup;
	if (markup) {
		markup.tag.addInlined('style', 'css');
		markup.tag.addAttribute('style', 'css');
	}

}(Prism$1));


/* **********************************************
     Begin prism-clike.js
********************************************** */

Prism$1.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true,
			greedy: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
		lookbehind: true,
		inside: {
			'punctuation': /[.\\]/
		}
	},
	'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
	'boolean': /\b(?:false|true)\b/,
	'function': /\b\w+(?=\()/,
	'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
	'punctuation': /[{}[\];(),.:]/
};


/* **********************************************
     Begin prism-javascript.js
********************************************** */

Prism$1.languages.javascript = Prism$1.languages.extend('clike', {
	'class-name': [
		Prism$1.languages.clike['class-name'],
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
			lookbehind: true
		}
	],
	'keyword': [
		{
			pattern: /((?:^|\})\s*)catch\b/,
			lookbehind: true
		},
		{
			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: true
		},
	],
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
	'number': {
		pattern: RegExp(
			/(^|[^\w$])/.source +
			'(?:' +
			(
				// constant
				/NaN|Infinity/.source +
				'|' +
				// binary integer
				/0[bB][01]+(?:_[01]+)*n?/.source +
				'|' +
				// octal integer
				/0[oO][0-7]+(?:_[0-7]+)*n?/.source +
				'|' +
				// hexadecimal integer
				/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
				'|' +
				// decimal bigint
				/\d+(?:_\d+)*n/.source +
				'|' +
				// decimal number (integer or float) but no bigint
				/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
			) +
			')' +
			/(?![\w$])/.source
		),
		lookbehind: true
	},
	'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});

Prism$1.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

Prism$1.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: RegExp(
			// lookbehind
			// eslint-disable-next-line regexp/no-dupe-characters-character-class
			/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
			// Regex pattern:
			// There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
			// classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
			// with the only syntax, so we have to define 2 different regex patterns.
			/\//.source +
			'(?:' +
			/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source +
			'|' +
			// `v` flag syntax. This supports 3 levels of nested character classes.
			/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source +
			')' +
			// lookahead
			/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
		),
		lookbehind: true,
		greedy: true,
		inside: {
			'regex-source': {
				pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
				lookbehind: true,
				alias: 'language-regex',
				inside: Prism$1.languages.regex
			},
			'regex-delimiter': /^\/|\/$/,
			'regex-flags': /^[a-z]+$/,
		}
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
		alias: 'function'
	},
	'parameter': [
		{
			pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
			lookbehind: true,
			inside: Prism$1.languages.javascript
		},
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
			lookbehind: true,
			inside: Prism$1.languages.javascript
		},
		{
			pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
			lookbehind: true,
			inside: Prism$1.languages.javascript
		},
		{
			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
			lookbehind: true,
			inside: Prism$1.languages.javascript
		}
	],
	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism$1.languages.insertBefore('javascript', 'string', {
	'hashbang': {
		pattern: /^#!.*/,
		greedy: true,
		alias: 'comment'
	},
	'template-string': {
		pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
		greedy: true,
		inside: {
			'template-punctuation': {
				pattern: /^`|`$/,
				alias: 'string'
			},
			'interpolation': {
				pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
				lookbehind: true,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism$1.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	},
	'string-property': {
		pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
		lookbehind: true,
		greedy: true,
		alias: 'property'
	}
});

Prism$1.languages.insertBefore('javascript', 'operator', {
	'literal-property': {
		pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
		lookbehind: true,
		alias: 'property'
	},
});

if (Prism$1.languages.markup) {
	Prism$1.languages.markup.tag.addInlined('script', 'javascript');

	// add attribute support for all DOM events.
	// https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
	Prism$1.languages.markup.tag.addAttribute(
		/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
		'javascript'
	);
}

Prism$1.languages.js = Prism$1.languages.javascript;


/* **********************************************
     Begin prism-file-highlight.js
********************************************** */

(function () {

	if (typeof Prism$1 === 'undefined' || typeof document === 'undefined') {
		return;
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
	if (!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}

	var LOADING_MESSAGE = 'Loading…';
	var FAILURE_MESSAGE = function (status, message) {
		return '✖ Error ' + status + ' while fetching file: ' + message;
	};
	var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';

	var EXTENSIONS = {
		'js': 'javascript',
		'py': 'python',
		'rb': 'ruby',
		'ps1': 'powershell',
		'psm1': 'powershell',
		'sh': 'bash',
		'bat': 'batch',
		'h': 'c',
		'tex': 'latex'
	};

	var STATUS_ATTR = 'data-src-status';
	var STATUS_LOADING = 'loading';
	var STATUS_LOADED = 'loaded';
	var STATUS_FAILED = 'failed';

	var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])'
		+ ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';

	/**
	 * Loads the given file.
	 *
	 * @param {string} src The URL or path of the source file to load.
	 * @param {(result: string) => void} success
	 * @param {(reason: string) => void} error
	 */
	function loadFile(src, success, error) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', src, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				if (xhr.status < 400 && xhr.responseText) {
					success(xhr.responseText);
				} else {
					if (xhr.status >= 400) {
						error(FAILURE_MESSAGE(xhr.status, xhr.statusText));
					} else {
						error(FAILURE_EMPTY_MESSAGE);
					}
				}
			}
		};
		xhr.send(null);
	}

	/**
	 * Parses the given range.
	 *
	 * This returns a range with inclusive ends.
	 *
	 * @param {string | null | undefined} range
	 * @returns {[number, number | undefined] | undefined}
	 */
	function parseRange(range) {
		var m = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(range || '');
		if (m) {
			var start = Number(m[1]);
			var comma = m[2];
			var end = m[3];

			if (!comma) {
				return [start, start];
			}
			if (!end) {
				return [start, undefined];
			}
			return [start, Number(end)];
		}
		return undefined;
	}

	Prism$1.hooks.add('before-highlightall', function (env) {
		env.selector += ', ' + SELECTOR;
	});

	Prism$1.hooks.add('before-sanity-check', function (env) {
		var pre = /** @type {HTMLPreElement} */ (env.element);
		if (pre.matches(SELECTOR)) {
			env.code = ''; // fast-path the whole thing and go to complete

			pre.setAttribute(STATUS_ATTR, STATUS_LOADING); // mark as loading

			// add code element with loading message
			var code = pre.appendChild(document.createElement('CODE'));
			code.textContent = LOADING_MESSAGE;

			var src = pre.getAttribute('data-src');

			var language = env.language;
			if (language === 'none') {
				// the language might be 'none' because there is no language set;
				// in this case, we want to use the extension as the language
				var extension = (/\.(\w+)$/.exec(src) || [, 'none'])[1];
				language = EXTENSIONS[extension] || extension;
			}

			// set language classes
			Prism$1.util.setLanguage(code, language);
			Prism$1.util.setLanguage(pre, language);

			// preload the language
			var autoloader = Prism$1.plugins.autoloader;
			if (autoloader) {
				autoloader.loadLanguages(language);
			}

			// load file
			loadFile(
				src,
				function (text) {
					// mark as loaded
					pre.setAttribute(STATUS_ATTR, STATUS_LOADED);

					// handle data-range
					var range = parseRange(pre.getAttribute('data-range'));
					if (range) {
						var lines = text.split(/\r\n?|\n/g);

						// the range is one-based and inclusive on both ends
						var start = range[0];
						var end = range[1] == null ? lines.length : range[1];

						if (start < 0) { start += lines.length; }
						start = Math.max(0, Math.min(start - 1, lines.length));
						if (end < 0) { end += lines.length; }
						end = Math.max(0, Math.min(end, lines.length));

						text = lines.slice(start, end).join('\n');

						// add data-start for line numbers
						if (!pre.hasAttribute('data-start')) {
							pre.setAttribute('data-start', String(start + 1));
						}
					}

					// highlight code
					code.textContent = text;
					Prism$1.highlightElement(code);
				},
				function (error) {
					// mark as failed
					pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

					code.textContent = error;
				}
			);
		}
	});

	Prism$1.plugins.fileHighlight = {
		/**
		 * Executes the File Highlight plugin for all matching `pre` elements under the given container.
		 *
		 * Note: Elements which are already loaded or currently loading will not be touched by this method.
		 *
		 * @param {ParentNode} [container=document]
		 */
		highlight: function highlight(container) {
			var elements = (container || document).querySelectorAll(SELECTOR);

			for (var i = 0, element; (element = elements[i++]);) {
				Prism$1.highlightElement(element);
			}
		}
	};

	var logged = false;
	/** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */
	Prism$1.fileHighlight = function () {
		if (!logged) {
			console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
			logged = true;
		}
		Prism$1.plugins.fileHighlight.highlight.apply(this, arguments);
	};

}());

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true,
			greedy: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
		lookbehind: true,
		inside: {
			'punctuation': /[.\\]/
		}
	},
	'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
	'boolean': /\b(?:false|true)\b/,
	'function': /\b\w+(?=\()/,
	'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
	'class-name': [
		Prism.languages.clike['class-name'],
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
			lookbehind: true
		}
	],
	'keyword': [
		{
			pattern: /((?:^|\})\s*)catch\b/,
			lookbehind: true
		},
		{
			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: true
		},
	],
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
	'number': {
		pattern: RegExp(
			/(^|[^\w$])/.source +
			'(?:' +
			(
				// constant
				/NaN|Infinity/.source +
				'|' +
				// binary integer
				/0[bB][01]+(?:_[01]+)*n?/.source +
				'|' +
				// octal integer
				/0[oO][0-7]+(?:_[0-7]+)*n?/.source +
				'|' +
				// hexadecimal integer
				/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
				'|' +
				// decimal bigint
				/\d+(?:_\d+)*n/.source +
				'|' +
				// decimal number (integer or float) but no bigint
				/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
			) +
			')' +
			/(?![\w$])/.source
		),
		lookbehind: true
	},
	'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: RegExp(
			// lookbehind
			// eslint-disable-next-line regexp/no-dupe-characters-character-class
			/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
			// Regex pattern:
			// There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
			// classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
			// with the only syntax, so we have to define 2 different regex patterns.
			/\//.source +
			'(?:' +
			/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source +
			'|' +
			// `v` flag syntax. This supports 3 levels of nested character classes.
			/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source +
			')' +
			// lookahead
			/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
		),
		lookbehind: true,
		greedy: true,
		inside: {
			'regex-source': {
				pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
				lookbehind: true,
				alias: 'language-regex',
				inside: Prism.languages.regex
			},
			'regex-delimiter': /^\/|\/$/,
			'regex-flags': /^[a-z]+$/,
		}
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
		alias: 'function'
	},
	'parameter': [
		{
			pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		}
	],
	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
	'hashbang': {
		pattern: /^#!.*/,
		greedy: true,
		alias: 'comment'
	},
	'template-string': {
		pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
		greedy: true,
		inside: {
			'template-punctuation': {
				pattern: /^`|`$/,
				alias: 'string'
			},
			'interpolation': {
				pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
				lookbehind: true,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	},
	'string-property': {
		pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
		lookbehind: true,
		greedy: true,
		alias: 'property'
	}
});

Prism.languages.insertBefore('javascript', 'operator', {
	'literal-property': {
		pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
		lookbehind: true,
		alias: 'property'
	},
});

if (Prism.languages.markup) {
	Prism.languages.markup.tag.addInlined('script', 'javascript');

	// add attribute support for all DOM events.
	// https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
	Prism.languages.markup.tag.addAttribute(
		/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
		'javascript'
	);
}

Prism.languages.js = Prism.languages.javascript;

Prism.languages.markup = {
	'comment': {
		pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
		greedy: true
	},
	'prolog': {
		pattern: /<\?[\s\S]+?\?>/,
		greedy: true
	},
	'doctype': {
		// https://www.w3.org/TR/xml/#NT-doctypedecl
		pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
		greedy: true,
		inside: {
			'internal-subset': {
				pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
				lookbehind: true,
				greedy: true,
				inside: null // see below
			},
			'string': {
				pattern: /"[^"]*"|'[^']*'/,
				greedy: true
			},
			'punctuation': /^<!|>$|[[\]]/,
			'doctype-tag': /^DOCTYPE/i,
			'name': /[^\s<>'"]+/
		}
	},
	'cdata': {
		pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
		greedy: true
	},
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
		greedy: true,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'special-attr': [],
			'attr-value': {
				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
				inside: {
					'punctuation': [
						{
							pattern: /^=/,
							alias: 'attr-equals'
						},
						{
							pattern: /^(\s*)["']|["']$/,
							lookbehind: true
						}
					]
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': [
		{
			pattern: /&[\da-z]{1,8};/i,
			alias: 'named-entity'
		},
		/&#x?[\da-f]{1,8};/i
	]
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism.languages.markup['entity'];
Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function (env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
	/**
	 * Adds an inlined language to markup.
	 *
	 * An example of an inlined language is CSS with `<style>` tags.
	 *
	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
	 * case insensitive.
	 * @param {string} lang The language key.
	 * @example
	 * addInlined('style', 'css');
	 */
	value: function addInlined(tagName, lang) {
		var includedCdataInside = {};
		includedCdataInside['language-' + lang] = {
			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
			lookbehind: true,
			inside: Prism.languages[lang]
		};
		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

		var inside = {
			'included-cdata': {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				inside: includedCdataInside
			}
		};
		inside['language-' + lang] = {
			pattern: /[\s\S]+/,
			inside: Prism.languages[lang]
		};

		var def = {};
		def[tagName] = {
			pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
			lookbehind: true,
			greedy: true,
			inside: inside
		};

		Prism.languages.insertBefore('markup', 'cdata', def);
	}
});
Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
	/**
	 * Adds an pattern to highlight languages embedded in HTML attributes.
	 *
	 * An example of an inlined language is CSS with `style` attributes.
	 *
	 * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
	 * case insensitive.
	 * @param {string} lang The language key.
	 * @example
	 * addAttribute('style', 'css');
	 */
	value: function (attrName, lang) {
		Prism.languages.markup.tag.inside['special-attr'].push({
			pattern: RegExp(
				/(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
				'i'
			),
			lookbehind: true,
			inside: {
				'attr-name': /^[^\s=]+/,
				'attr-value': {
					pattern: /=[\s\S]+/,
					inside: {
						'value': {
							pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
							lookbehind: true,
							alias: [lang, 'language-' + lang],
							inside: Prism.languages[lang]
						},
						'punctuation': [
							{
								pattern: /^=/,
								alias: 'attr-equals'
							},
							/"|'/
						]
					}
				}
			}
		});
	}
});

Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.ssml = Prism.languages.xml;
Prism.languages.atom = Prism.languages.xml;
Prism.languages.rss = Prism.languages.xml;

(function (Prism) {

	// Allow only one line break
	var inner = /(?:\\.|[^\\\n\r]|(?:\n|\r\n?)(?![\r\n]))/.source;

	/**
	 * This function is intended for the creation of the bold or italic pattern.
	 *
	 * This also adds a lookbehind group to the given pattern to ensure that the pattern is not backslash-escaped.
	 *
	 * _Note:_ Keep in mind that this adds a capturing group.
	 *
	 * @param {string} pattern
	 * @returns {RegExp}
	 */
	function createInline(pattern) {
		pattern = pattern.replace(/<inner>/g, function () { return inner; });
		return RegExp(/((?:^|[^\\])(?:\\{2})*)/.source + '(?:' + pattern + ')');
	}


	var tableCell = /(?:\\.|``(?:[^`\r\n]|`(?!`))+``|`[^`\r\n]+`|[^\\|\r\n`])+/.source;
	var tableRow = /\|?__(?:\|__)+\|?(?:(?:\n|\r\n?)|(?![\s\S]))/.source.replace(/__/g, function () { return tableCell; });
	var tableLine = /\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)+\|?(?:\n|\r\n?)/.source;


	Prism.languages.markdown = Prism.languages.extend('markup', {});
	Prism.languages.insertBefore('markdown', 'prolog', {
		'front-matter-block': {
			pattern: /(^(?:\s*[\r\n])?)---(?!.)[\s\S]*?[\r\n]---(?!.)/,
			lookbehind: true,
			greedy: true,
			inside: {
				'punctuation': /^---|---$/,
				'front-matter': {
					pattern: /\S+(?:\s+\S+)*/,
					alias: ['yaml', 'language-yaml'],
					inside: Prism.languages.yaml
				}
			}
		},
		'blockquote': {
			// > ...
			pattern: /^>(?:[\t ]*>)*/m,
			alias: 'punctuation'
		},
		'table': {
			pattern: RegExp('^' + tableRow + tableLine + '(?:' + tableRow + ')*', 'm'),
			inside: {
				'table-data-rows': {
					pattern: RegExp('^(' + tableRow + tableLine + ')(?:' + tableRow + ')*$'),
					lookbehind: true,
					inside: {
						'table-data': {
							pattern: RegExp(tableCell),
							inside: Prism.languages.markdown
						},
						'punctuation': /\|/
					}
				},
				'table-line': {
					pattern: RegExp('^(' + tableRow + ')' + tableLine + '$'),
					lookbehind: true,
					inside: {
						'punctuation': /\||:?-{3,}:?/
					}
				},
				'table-header-row': {
					pattern: RegExp('^' + tableRow + '$'),
					inside: {
						'table-header': {
							pattern: RegExp(tableCell),
							alias: 'important',
							inside: Prism.languages.markdown
						},
						'punctuation': /\|/
					}
				}
			}
		},
		'code': [
			{
				// Prefixed by 4 spaces or 1 tab and preceded by an empty line
				pattern: /((?:^|\n)[ \t]*\n|(?:^|\r\n?)[ \t]*\r\n?)(?: {4}|\t).+(?:(?:\n|\r\n?)(?: {4}|\t).+)*/,
				lookbehind: true,
				alias: 'keyword'
			},
			{
				// ```optional language
				// code block
				// ```
				pattern: /^```[\s\S]*?^```$/m,
				greedy: true,
				inside: {
					'code-block': {
						pattern: /^(```.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^```$)/m,
						lookbehind: true
					},
					'code-language': {
						pattern: /^(```).+/,
						lookbehind: true
					},
					'punctuation': /```/
				}
			}
		],
		'title': [
			{
				// title 1
				// =======

				// title 2
				// -------
				pattern: /\S.*(?:\n|\r\n?)(?:==+|--+)(?=[ \t]*$)/m,
				alias: 'important',
				inside: {
					punctuation: /==+$|--+$/
				}
			},
			{
				// # title 1
				// ###### title 6
				pattern: /(^\s*)#.+/m,
				lookbehind: true,
				alias: 'important',
				inside: {
					punctuation: /^#+|#+$/
				}
			}
		],
		'hr': {
			// ***
			// ---
			// * * *
			// -----------
			pattern: /(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
			lookbehind: true,
			alias: 'punctuation'
		},
		'list': {
			// * item
			// + item
			// - item
			// 1. item
			pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
			lookbehind: true,
			alias: 'punctuation'
		},
		'url-reference': {
			// [id]: http://example.com "Optional title"
			// [id]: http://example.com 'Optional title'
			// [id]: http://example.com (Optional title)
			// [id]: <http://example.com> "Optional title"
			pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
			inside: {
				'variable': {
					pattern: /^(!?\[)[^\]]+/,
					lookbehind: true
				},
				'string': /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
				'punctuation': /^[\[\]!:]|[<>]/
			},
			alias: 'url'
		},
		'bold': {
			// **strong**
			// __strong__

			// allow one nested instance of italic text using the same delimiter
			pattern: createInline(/\b__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__\b|\*\*(?:(?!\*)<inner>|\*(?:(?!\*)<inner>)+\*)+\*\*/.source),
			lookbehind: true,
			greedy: true,
			inside: {
				'content': {
					pattern: /(^..)[\s\S]+(?=..$)/,
					lookbehind: true,
					inside: {} // see below
				},
				'punctuation': /\*\*|__/
			}
		},
		'italic': {
			// *em*
			// _em_

			// allow one nested instance of bold text using the same delimiter
			pattern: createInline(/\b_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_\b|\*(?:(?!\*)<inner>|\*\*(?:(?!\*)<inner>)+\*\*)+\*/.source),
			lookbehind: true,
			greedy: true,
			inside: {
				'content': {
					pattern: /(^.)[\s\S]+(?=.$)/,
					lookbehind: true,
					inside: {} // see below
				},
				'punctuation': /[*_]/
			}
		},
		'strike': {
			// ~~strike through~~
			// ~strike~
			// eslint-disable-next-line regexp/strict
			pattern: createInline(/(~~?)(?:(?!~)<inner>)+\2/.source),
			lookbehind: true,
			greedy: true,
			inside: {
				'content': {
					pattern: /(^~~?)[\s\S]+(?=\1$)/,
					lookbehind: true,
					inside: {} // see below
				},
				'punctuation': /~~?/
			}
		},
		'code-snippet': {
			// `code`
			// ``code``
			pattern: /(^|[^\\`])(?:``[^`\r\n]+(?:`[^`\r\n]+)*``(?!`)|`[^`\r\n]+`(?!`))/,
			lookbehind: true,
			greedy: true,
			alias: ['code', 'keyword']
		},
		'url': {
			// [example](http://example.com "Optional title")
			// [example][id]
			// [example] [id]
			pattern: createInline(/!?\[(?:(?!\])<inner>)+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)|[ \t]?\[(?:(?!\])<inner>)+\])/.source),
			lookbehind: true,
			greedy: true,
			inside: {
				'operator': /^!/,
				'content': {
					pattern: /(^\[)[^\]]+(?=\])/,
					lookbehind: true,
					inside: {} // see below
				},
				'variable': {
					pattern: /(^\][ \t]?\[)[^\]]+(?=\]$)/,
					lookbehind: true
				},
				'url': {
					pattern: /(^\]\()[^\s)]+/,
					lookbehind: true
				},
				'string': {
					pattern: /(^[ \t]+)"(?:\\.|[^"\\])*"(?=\)$)/,
					lookbehind: true
				}
			}
		}
	});

	['url', 'bold', 'italic', 'strike'].forEach(function (token) {
		['url', 'bold', 'italic', 'strike', 'code-snippet'].forEach(function (inside) {
			if (token !== inside) {
				Prism.languages.markdown[token].inside.content.inside[inside] = Prism.languages.markdown[inside];
			}
		});
	});

	Prism.hooks.add('after-tokenize', function (env) {
		if (env.language !== 'markdown' && env.language !== 'md') {
			return;
		}

		function walkTokens(tokens) {
			if (!tokens || typeof tokens === 'string') {
				return;
			}

			for (var i = 0, l = tokens.length; i < l; i++) {
				var token = tokens[i];

				if (token.type !== 'code') {
					walkTokens(token.content);
					continue;
				}

				/*
				 * Add the correct `language-xxxx` class to this code block. Keep in mind that the `code-language` token
				 * is optional. But the grammar is defined so that there is only one case we have to handle:
				 *
				 * token.content = [
				 *     <span class="punctuation">```</span>,
				 *     <span class="code-language">xxxx</span>,
				 *     '\n', // exactly one new lines (\r or \n or \r\n)
				 *     <span class="code-block">...</span>,
				 *     '\n', // exactly one new lines again
				 *     <span class="punctuation">```</span>
				 * ];
				 */

				var codeLang = token.content[1];
				var codeBlock = token.content[3];

				if (codeLang && codeBlock &&
					codeLang.type === 'code-language' && codeBlock.type === 'code-block' &&
					typeof codeLang.content === 'string') {

					// this might be a language that Prism does not support

					// do some replacements to support C++, C#, and F#
					var lang = codeLang.content.replace(/\b#/g, 'sharp').replace(/\b\+\+/g, 'pp');
					// only use the first word
					lang = (/[a-z][\w-]*/i.exec(lang) || [''])[0].toLowerCase();
					var alias = 'language-' + lang;

					// add alias
					if (!codeBlock.alias) {
						codeBlock.alias = [alias];
					} else if (typeof codeBlock.alias === 'string') {
						codeBlock.alias = [codeBlock.alias, alias];
					} else {
						codeBlock.alias.push(alias);
					}
				}
			}
		}

		walkTokens(env.tokens);
	});

	Prism.hooks.add('wrap', function (env) {
		if (env.type !== 'code-block') {
			return;
		}

		var codeLang = '';
		for (var i = 0, l = env.classes.length; i < l; i++) {
			var cls = env.classes[i];
			var match = /language-(.+)/.exec(cls);
			if (match) {
				codeLang = match[1];
				break;
			}
		}

		var grammar = Prism.languages[codeLang];

		if (!grammar) {
			if (codeLang && codeLang !== 'none' && Prism.plugins.autoloader) {
				var id = 'md-' + new Date().valueOf() + '-' + Math.floor(Math.random() * 1e16);
				env.attributes['id'] = id;

				Prism.plugins.autoloader.loadLanguages(codeLang, function () {
					var ele = document.getElementById(id);
					if (ele) {
						ele.innerHTML = Prism.highlight(ele.textContent, Prism.languages[codeLang], codeLang);
					}
				});
			}
		} else {
			env.content = Prism.highlight(textContent(env.content), grammar, codeLang);
		}
	});

	var tagPattern = RegExp(Prism.languages.markup.tag.pattern.source, 'gi');

	/**
	 * A list of known entity names.
	 *
	 * This will always be incomplete to save space. The current list is the one used by lowdash's unescape function.
	 *
	 * @see {@link https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/unescape.js#L2}
	 */
	var KNOWN_ENTITY_NAMES = {
		'amp': '&',
		'lt': '<',
		'gt': '>',
		'quot': '"',
	};

	// IE 11 doesn't support `String.fromCodePoint`
	var fromCodePoint = String.fromCodePoint || String.fromCharCode;

	/**
	 * Returns the text content of a given HTML source code string.
	 *
	 * @param {string} html
	 * @returns {string}
	 */
	function textContent(html) {
		// remove all tags
		var text = html.replace(tagPattern, '');

		// decode known entities
		text = text.replace(/&(\w{1,8}|#x?[\da-f]{1,8});/gi, function (m, code) {
			code = code.toLowerCase();

			if (code[0] === '#') {
				var value;
				if (code[1] === 'x') {
					value = parseInt(code.slice(2), 16);
				} else {
					value = Number(code.slice(1));
				}

				return fromCodePoint(value);
			} else {
				var known = KNOWN_ENTITY_NAMES[code];
				if (known) {
					return known;
				}

				// unable to decode
				return m;
			}
		});

		return text;
	}

	Prism.languages.md = Prism.languages.markdown;

}(Prism));

Prism.languages.c = Prism.languages.extend('clike', {
	'comment': {
		pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
		greedy: true
	},
	'string': {
		// https://en.cppreference.com/w/c/language/string_literal
		pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
		greedy: true
	},
	'class-name': {
		pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,
		lookbehind: true
	},
	'keyword': /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,
	'function': /\b[a-z_]\w*(?=\s*\()/i,
	'number': /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,
	'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/
});

Prism.languages.insertBefore('c', 'string', {
	'char': {
		// https://en.cppreference.com/w/c/language/character_constant
		pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,
		greedy: true
	}
});

Prism.languages.insertBefore('c', 'string', {
	'macro': {
		// allow for multiline macro definitions
		// spaces after the # character compile fine with gcc
		pattern: /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,
		lookbehind: true,
		greedy: true,
		alias: 'property',
		inside: {
			'string': [
				{
					// highlight the path of the include statement as a string
					pattern: /^(#\s*include\s*)<[^>]+>/,
					lookbehind: true
				},
				Prism.languages.c['string']
			],
			'char': Prism.languages.c['char'],
			'comment': Prism.languages.c['comment'],
			'macro-name': [
				{
					pattern: /(^#\s*define\s+)\w+\b(?!\()/i,
					lookbehind: true
				},
				{
					pattern: /(^#\s*define\s+)\w+\b(?=\()/i,
					lookbehind: true,
					alias: 'function'
				}
			],
			// highlight macro directives as keywords
			'directive': {
				pattern: /^(#\s*)[a-z]+/,
				lookbehind: true,
				alias: 'keyword'
			},
			'directive-hash': /^#/,
			'punctuation': /##|\\(?=[\r\n])/,
			'expression': {
				pattern: /\S[\s\S]*/,
				inside: Prism.languages.c
			}
		}
	}
});

Prism.languages.insertBefore('c', 'function', {
	// highlight predefined macros as constants
	'constant': /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/
});

delete Prism.languages.c['boolean'];

(function (Prism) {

	var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

	Prism.languages.css = {
		'comment': /\/\*[\s\S]*?\*\//,
		'atrule': {
			pattern: RegExp('@[\\w-](?:' + /[^;{\s"']|\s+(?!\s)/.source + '|' + string.source + ')*?' + /(?:;|(?=\s*\{))/.source),
			inside: {
				'rule': /^@[\w-]+/,
				'selector-function-argument': {
					pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
					lookbehind: true,
					alias: 'selector'
				},
				'keyword': {
					pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
					lookbehind: true
				}
				// See rest below
			}
		},
		'url': {
			// https://drafts.csswg.org/css-values-3/#urls
			pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
			greedy: true,
			inside: {
				'function': /^url/i,
				'punctuation': /^\(|\)$/,
				'string': {
					pattern: RegExp('^' + string.source + '$'),
					alias: 'url'
				}
			}
		},
		'selector': {
			pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
			lookbehind: true
		},
		'string': {
			pattern: string,
			greedy: true
		},
		'property': {
			pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
			lookbehind: true
		},
		'important': /!important\b/i,
		'function': {
			pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
			lookbehind: true
		},
		'punctuation': /[(){};:,]/
	};

	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

	var markup = Prism.languages.markup;
	if (markup) {
		markup.tag.addInlined('style', 'css');
		markup.tag.addAttribute('style', 'css');
	}

}(Prism));

Prism.languages.objectivec = Prism.languages.extend('c', {
	'string': {
		pattern: /@?"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
		greedy: true
	},
	'keyword': /\b(?:asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|in|inline|int|long|register|return|self|short|signed|sizeof|static|struct|super|switch|typedef|typeof|union|unsigned|void|volatile|while)\b|(?:@interface|@end|@implementation|@protocol|@class|@public|@protected|@private|@property|@try|@catch|@finally|@throw|@synthesize|@dynamic|@selector)\b/,
	'operator': /-[->]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|\|?|[~^%?*\/@]/
});

delete Prism.languages.objectivec['class-name'];

Prism.languages.objc = Prism.languages.objectivec;

Prism.languages.sql = {
	'comment': {
		pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
		lookbehind: true
	},
	'variable': [
		{
			pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
			greedy: true
		},
		/@[\w.$]+/
	],
	'string': {
		pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
		greedy: true,
		lookbehind: true
	},
	'identifier': {
		pattern: /(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/,
		greedy: true,
		lookbehind: true,
		inside: {
			'punctuation': /^`|`$/
		}
	},
	'function': /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, // Should we highlight user defined functions too?
	'keyword': /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
	'boolean': /\b(?:FALSE|NULL|TRUE)\b/i,
	'number': /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
	'operator': /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
	'punctuation': /[;[\]()`,.]/
};

(function (Prism) {

	var powershell = Prism.languages.powershell = {
		'comment': [
			{
				pattern: /(^|[^`])<#[\s\S]*?#>/,
				lookbehind: true
			},
			{
				pattern: /(^|[^`])#.*/,
				lookbehind: true
			}
		],
		'string': [
			{
				pattern: /"(?:`[\s\S]|[^`"])*"/,
				greedy: true,
				inside: null // see below
			},
			{
				pattern: /'(?:[^']|'')*'/,
				greedy: true
			}
		],
		// Matches name spaces as well as casts, attribute decorators. Force starting with letter to avoid matching array indices
		// Supports two levels of nested brackets (e.g. `[OutputType([System.Collections.Generic.List[int]])]`)
		'namespace': /\[[a-z](?:\[(?:\[[^\]]*\]|[^\[\]])*\]|[^\[\]])*\]/i,
		'boolean': /\$(?:false|true)\b/i,
		'variable': /\$\w+\b/,
		// Cmdlets and aliases. Aliases should come last, otherwise "write" gets preferred over "write-host" for example
		// Get-Command | ?{ $_.ModuleName -match "Microsoft.PowerShell.(Util|Core|Management)" }
		// Get-Alias | ?{ $_.ReferencedCommand.Module.Name -match "Microsoft.PowerShell.(Util|Core|Management)" }
		'function': [
			/\b(?:Add|Approve|Assert|Backup|Block|Checkpoint|Clear|Close|Compare|Complete|Compress|Confirm|Connect|Convert|ConvertFrom|ConvertTo|Copy|Debug|Deny|Disable|Disconnect|Dismount|Edit|Enable|Enter|Exit|Expand|Export|Find|ForEach|Format|Get|Grant|Group|Hide|Import|Initialize|Install|Invoke|Join|Limit|Lock|Measure|Merge|Move|New|Open|Optimize|Out|Ping|Pop|Protect|Publish|Push|Read|Receive|Redo|Register|Remove|Rename|Repair|Request|Reset|Resize|Resolve|Restart|Restore|Resume|Revoke|Save|Search|Select|Send|Set|Show|Skip|Sort|Split|Start|Step|Stop|Submit|Suspend|Switch|Sync|Tee|Test|Trace|Unblock|Undo|Uninstall|Unlock|Unprotect|Unpublish|Unregister|Update|Use|Wait|Watch|Where|Write)-[a-z]+\b/i,
			/\b(?:ac|cat|chdir|clc|cli|clp|clv|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|ebp|echo|epal|epcsv|epsn|erase|fc|fl|ft|fw|gal|gbp|gc|gci|gcs|gdr|gi|gl|gm|gp|gps|group|gsv|gu|gv|gwmi|iex|ii|ipal|ipcsv|ipsn|irm|iwmi|iwr|kill|lp|ls|measure|mi|mount|move|mp|mv|nal|ndr|ni|nv|ogv|popd|ps|pushd|pwd|rbp|rd|rdr|ren|ri|rm|rmdir|rni|rnp|rp|rv|rvpa|rwmi|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls|sort|sp|spps|spsv|start|sv|swmi|tee|trcm|type|write)\b/i
		],
		// per http://technet.microsoft.com/en-us/library/hh847744.aspx
		'keyword': /\b(?:Begin|Break|Catch|Class|Continue|Data|Define|Do|DynamicParam|Else|ElseIf|End|Exit|Filter|Finally|For|ForEach|From|Function|If|InlineScript|Parallel|Param|Process|Return|Sequence|Switch|Throw|Trap|Try|Until|Using|Var|While|Workflow)\b/i,
		'operator': {
			pattern: /(^|\W)(?:!|-(?:b?(?:and|x?or)|as|(?:Not)?(?:Contains|In|Like|Match)|eq|ge|gt|is(?:Not)?|Join|le|lt|ne|not|Replace|sh[lr])\b|-[-=]?|\+[+=]?|[*\/%]=?)/i,
			lookbehind: true
		},
		'punctuation': /[|{}[\];(),.]/
	};

	// Variable interpolation inside strings, and nested expressions
	powershell.string[0].inside = {
		'function': {
			// Allow for one level of nesting
			pattern: /(^|[^`])\$\((?:\$\([^\r\n()]*\)|(?!\$\()[^\r\n)])*\)/,
			lookbehind: true,
			inside: powershell
		},
		'boolean': powershell.boolean,
		'variable': powershell.variable,
	};

}(Prism));

Prism.languages.python = {
	'comment': {
		pattern: /(^|[^\\])#.*/,
		lookbehind: true,
		greedy: true
	},
	'string-interpolation': {
		pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
		greedy: true,
		inside: {
			'interpolation': {
				// "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
				pattern: /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
				lookbehind: true,
				inside: {
					'format-spec': {
						pattern: /(:)[^:(){}]+(?=\}$)/,
						lookbehind: true
					},
					'conversion-option': {
						pattern: /![sra](?=[:}]$)/,
						alias: 'punctuation'
					},
					rest: null
				}
			},
			'string': /[\s\S]+/
		}
	},
	'triple-quoted-string': {
		pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
		greedy: true,
		alias: 'string'
	},
	'string': {
		pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
		greedy: true
	},
	'function': {
		pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
		lookbehind: true
	},
	'class-name': {
		pattern: /(\bclass\s+)\w+/i,
		lookbehind: true
	},
	'decorator': {
		pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
		lookbehind: true,
		alias: ['annotation', 'punctuation'],
		inside: {
			'punctuation': /\./
		}
	},
	'keyword': /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
	'builtin': /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
	'boolean': /\b(?:False|None|True)\b/,
	'number': /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
	'operator': /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.python['string-interpolation'].inside['interpolation'].inside.rest = Prism.languages.python;

Prism.languages.py = Prism.languages.python;

(function (Prism) {

	var multilineComment = /\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|<self>)*\*\//.source;
	for (var i = 0; i < 2; i++) {
		// support 4 levels of nested comments
		multilineComment = multilineComment.replace(/<self>/g, function () { return multilineComment; });
	}
	multilineComment = multilineComment.replace(/<self>/g, function () { return /[^\s\S]/.source; });


	Prism.languages.rust = {
		'comment': [
			{
				pattern: RegExp(/(^|[^\\])/.source + multilineComment),
				lookbehind: true,
				greedy: true
			},
			{
				pattern: /(^|[^\\:])\/\/.*/,
				lookbehind: true,
				greedy: true
			}
		],
		'string': {
			pattern: /b?"(?:\\[\s\S]|[^\\"])*"|b?r(#*)"(?:[^"]|"(?!\1))*"\1/,
			greedy: true
		},
		'char': {
			pattern: /b?'(?:\\(?:x[0-7][\da-fA-F]|u\{(?:[\da-fA-F]_*){1,6}\}|.)|[^\\\r\n\t'])'/,
			greedy: true
		},
		'attribute': {
			pattern: /#!?\[(?:[^\[\]"]|"(?:\\[\s\S]|[^\\"])*")*\]/,
			greedy: true,
			alias: 'attr-name',
			inside: {
				'string': null // see below
			}
		},

		// Closure params should not be confused with bitwise OR |
		'closure-params': {
			pattern: /([=(,:]\s*|\bmove\s*)\|[^|]*\||\|[^|]*\|(?=\s*(?:\{|->))/,
			lookbehind: true,
			greedy: true,
			inside: {
				'closure-punctuation': {
					pattern: /^\||\|$/,
					alias: 'punctuation'
				},
				rest: null // see below
			}
		},

		'lifetime-annotation': {
			pattern: /'\w+/,
			alias: 'symbol'
		},

		'fragment-specifier': {
			pattern: /(\$\w+:)[a-z]+/,
			lookbehind: true,
			alias: 'punctuation'
		},
		'variable': /\$\w+/,

		'function-definition': {
			pattern: /(\bfn\s+)\w+/,
			lookbehind: true,
			alias: 'function'
		},
		'type-definition': {
			pattern: /(\b(?:enum|struct|trait|type|union)\s+)\w+/,
			lookbehind: true,
			alias: 'class-name'
		},
		'module-declaration': [
			{
				pattern: /(\b(?:crate|mod)\s+)[a-z][a-z_\d]*/,
				lookbehind: true,
				alias: 'namespace'
			},
			{
				pattern: /(\b(?:crate|self|super)\s*)::\s*[a-z][a-z_\d]*\b(?:\s*::(?:\s*[a-z][a-z_\d]*\s*::)*)?/,
				lookbehind: true,
				alias: 'namespace',
				inside: {
					'punctuation': /::/
				}
			}
		],
		'keyword': [
			// https://github.com/rust-lang/reference/blob/master/src/keywords.md
			/\b(?:Self|abstract|as|async|await|become|box|break|const|continue|crate|do|dyn|else|enum|extern|final|fn|for|if|impl|in|let|loop|macro|match|mod|move|mut|override|priv|pub|ref|return|self|static|struct|super|trait|try|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\b/,
			// primitives and str
			// https://doc.rust-lang.org/stable/rust-by-example/primitives.html
			/\b(?:bool|char|f(?:32|64)|[ui](?:8|16|32|64|128|size)|str)\b/
		],

		// functions can technically start with an upper-case letter, but this will introduce a lot of false positives
		// and Rust's naming conventions recommend snake_case anyway.
		// https://doc.rust-lang.org/1.0.0/style/style/naming/README.html
		'function': /\b[a-z_]\w*(?=\s*(?:::\s*<|\())/,
		'macro': {
			pattern: /\b\w+!/,
			alias: 'property'
		},
		'constant': /\b[A-Z_][A-Z_\d]+\b/,
		'class-name': /\b[A-Z]\w*\b/,

		'namespace': {
			pattern: /(?:\b[a-z][a-z_\d]*\s*::\s*)*\b[a-z][a-z_\d]*\s*::(?!\s*<)/,
			inside: {
				'punctuation': /::/
			}
		},

		// Hex, oct, bin, dec numbers with visual separators and type suffix
		'number': /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\d(?:_?\d)*)?\.)?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:f32|f64|[iu](?:8|16|32|64|size)?))?\b/,
		'boolean': /\b(?:false|true)\b/,
		'punctuation': /->|\.\.=|\.{1,3}|::|[{}[\];(),:]/,
		'operator': /[-+*\/%!^]=?|=[=>]?|&[&=]?|\|[|=]?|<<?=?|>>?=?|[@?]/
	};

	Prism.languages.rust['closure-params'].inside.rest = Prism.languages.rust;
	Prism.languages.rust['attribute'].inside['string'] = Prism.languages.rust['string'];

}(Prism));

Prism.languages.swift = {
	'comment': {
		// Nested comments are supported up to 2 levels
		pattern: /(^|[^\\:])(?:\/\/.*|\/\*(?:[^/*]|\/(?!\*)|\*(?!\/)|\/\*(?:[^*]|\*(?!\/))*\*\/)*\*\/)/,
		lookbehind: true,
		greedy: true
	},
	'string-literal': [
		// https://docs.swift.org/swift-book/LanguageGuide/StringsAndCharacters.html
		{
			pattern: RegExp(
				/(^|[^"#])/.source
				+ '(?:'
				// single-line string
				+ /"(?:\\(?:\((?:[^()]|\([^()]*\))*\)|\r\n|[^(])|[^\\\r\n"])*"/.source
				+ '|'
				// multi-line string
				+ /"""(?:\\(?:\((?:[^()]|\([^()]*\))*\)|[^(])|[^\\"]|"(?!""))*"""/.source
				+ ')'
				+ /(?!["#])/.source
			),
			lookbehind: true,
			greedy: true,
			inside: {
				'interpolation': {
					pattern: /(\\\()(?:[^()]|\([^()]*\))*(?=\))/,
					lookbehind: true,
					inside: null // see below
				},
				'interpolation-punctuation': {
					pattern: /^\)|\\\($/,
					alias: 'punctuation'
				},
				'punctuation': /\\(?=[\r\n])/,
				'string': /[\s\S]+/
			}
		},
		{
			pattern: RegExp(
				/(^|[^"#])(#+)/.source
				+ '(?:'
				// single-line string
				+ /"(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|\r\n|[^#])|[^\\\r\n])*?"/.source
				+ '|'
				// multi-line string
				+ /"""(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|[^#])|[^\\])*?"""/.source
				+ ')'
				+ '\\2'
			),
			lookbehind: true,
			greedy: true,
			inside: {
				'interpolation': {
					pattern: /(\\#+\()(?:[^()]|\([^()]*\))*(?=\))/,
					lookbehind: true,
					inside: null // see below
				},
				'interpolation-punctuation': {
					pattern: /^\)|\\#+\($/,
					alias: 'punctuation'
				},
				'string': /[\s\S]+/
			}
		},
	],

	'directive': {
		// directives with conditions
		pattern: RegExp(
			/#/.source
			+ '(?:'
			+ (
				/(?:elseif|if)\b/.source
				+ '(?:[ \t]*'
				// This regex is a little complex. It's equivalent to this:
				//   (?:![ \t]*)?(?:\b\w+\b(?:[ \t]*<round>)?|<round>)(?:[ \t]*(?:&&|\|\|))?
				// where <round> is a general parentheses expression.
				+ /(?:![ \t]*)?(?:\b\w+\b(?:[ \t]*\((?:[^()]|\([^()]*\))*\))?|\((?:[^()]|\([^()]*\))*\))(?:[ \t]*(?:&&|\|\|))?/.source
				+ ')+'
			)
			+ '|'
			+ /(?:else|endif)\b/.source
			+ ')'
		),
		alias: 'property',
		inside: {
			'directive-name': /^#\w+/,
			'boolean': /\b(?:false|true)\b/,
			'number': /\b\d+(?:\.\d+)*\b/,
			'operator': /!|&&|\|\||[<>]=?/,
			'punctuation': /[(),]/
		}
	},
	'literal': {
		pattern: /#(?:colorLiteral|column|dsohandle|file(?:ID|Literal|Path)?|function|imageLiteral|line)\b/,
		alias: 'constant'
	},
	'other-directive': {
		pattern: /#\w+\b/,
		alias: 'property'
	},

	'attribute': {
		pattern: /@\w+/,
		alias: 'atrule'
	},

	'function-definition': {
		pattern: /(\bfunc\s+)\w+/,
		lookbehind: true,
		alias: 'function'
	},
	'label': {
		// https://docs.swift.org/swift-book/LanguageGuide/ControlFlow.html#ID141
		pattern: /\b(break|continue)\s+\w+|\b[a-zA-Z_]\w*(?=\s*:\s*(?:for|repeat|while)\b)/,
		lookbehind: true,
		alias: 'important'
	},

	'keyword': /\b(?:Any|Protocol|Self|Type|actor|as|assignment|associatedtype|associativity|async|await|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic|else|enum|extension|fallthrough|fileprivate|final|for|func|get|guard|higherThan|if|import|in|indirect|infix|init|inout|internal|is|isolated|lazy|left|let|lowerThan|mutating|none|nonisolated|nonmutating|open|operator|optional|override|postfix|precedencegroup|prefix|private|protocol|public|repeat|required|rethrows|return|right|safe|self|set|some|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|unsafe|var|weak|where|while|willSet)\b/,
	'boolean': /\b(?:false|true)\b/,
	'nil': {
		pattern: /\bnil\b/,
		alias: 'constant'
	},

	'short-argument': /\$\d+\b/,
	'omit': {
		pattern: /\b_\b/,
		alias: 'keyword'
	},
	'number': /\b(?:[\d_]+(?:\.[\de_]+)?|0x[a-f0-9_]+(?:\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i,

	// A class name must start with an upper-case letter and be either 1 letter long or contain a lower-case letter.
	'class-name': /\b[A-Z](?:[A-Z_\d]*[a-z]\w*)?\b/,
	'function': /\b[a-z_]\w*(?=\s*\()/i,
	'constant': /\b(?:[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/,

	// Operators are generic in Swift. Developers can even create new operators (e.g. +++).
	// https://docs.swift.org/swift-book/ReferenceManual/zzSummaryOfTheGrammar.html#ID481
	// This regex only supports ASCII operators.
	'operator': /[-+*/%=!<>&|^~?]+|\.[.\-+*/%=!<>&|^~?]+/,
	'punctuation': /[{}[\]();,.:\\]/
};

Prism.languages.swift['string-literal'].forEach(function (rule) {
	rule.inside['interpolation'].inside = Prism.languages.swift;
});

(function (Prism) {

	Prism.languages.typescript = Prism.languages.extend('javascript', {
		'class-name': {
			pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
			lookbehind: true,
			greedy: true,
			inside: null // see below
		},
		'builtin': /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/,
	});

	// The keywords TypeScript adds to JavaScript
	Prism.languages.typescript.keyword.push(
		/\b(?:abstract|declare|is|keyof|readonly|require)\b/,
		// keywords that have to be followed by an identifier
		/\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
		// This is for `import type *, {}`
		/\btype\b(?=\s*(?:[\{*]|$))/
	);

	// doesn't work with TS because TS is too complex
	delete Prism.languages.typescript['parameter'];
	delete Prism.languages.typescript['literal-property'];

	// a version of typescript specifically for highlighting types
	var typeInside = Prism.languages.extend('typescript', {});
	delete typeInside['class-name'];

	Prism.languages.typescript['class-name'].inside = typeInside;

	Prism.languages.insertBefore('typescript', 'function', {
		'decorator': {
			pattern: /@[$\w\xA0-\uFFFF]+/,
			inside: {
				'at': {
					pattern: /^@/,
					alias: 'operator'
				},
				'function': /^[\s\S]+/
			}
		},
		'generic-function': {
			// e.g. foo<T extends "bar" | "baz">( ...
			pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
			greedy: true,
			inside: {
				'function': /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
				'generic': {
					pattern: /<[\s\S]+/, // everything after the first <
					alias: 'class-name',
					inside: typeInside
				}
			}
		}
	});

	Prism.languages.ts = Prism.languages.typescript;

}(Prism));

(function (Prism) {

	var keywords = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/;

	// full package (optional) + parent classes (optional)
	var classNamePrefix = /(?:[a-z]\w*\s*\.\s*)*(?:[A-Z]\w*\s*\.\s*)*/.source;

	// based on the java naming conventions
	var className = {
		pattern: RegExp(/(^|[^\w.])/.source + classNamePrefix + /[A-Z](?:[\d_A-Z]*[a-z]\w*)?\b/.source),
		lookbehind: true,
		inside: {
			'namespace': {
				pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
				inside: {
					'punctuation': /\./
				}
			},
			'punctuation': /\./
		}
	};

	Prism.languages.java = Prism.languages.extend('clike', {
		'string': {
			pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
			lookbehind: true,
			greedy: true
		},
		'class-name': [
			className,
			{
				// variables, parameters, and constructor references
				// this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
				pattern: RegExp(/(^|[^\w.])/.source + classNamePrefix + /[A-Z]\w*(?=\s+\w+\s*[;,=()]|\s*(?:\[[\s,]*\]\s*)?::\s*new\b)/.source),
				lookbehind: true,
				inside: className.inside
			},
			{
				// class names based on keyword
				// this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
				pattern: RegExp(/(\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\s+)/.source + classNamePrefix + /[A-Z]\w*\b/.source),
				lookbehind: true,
				inside: className.inside
			}
		],
		'keyword': keywords,
		'function': [
			Prism.languages.clike.function,
			{
				pattern: /(::\s*)[a-z_]\w*/,
				lookbehind: true
			}
		],
		'number': /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
		'operator': {
			pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
			lookbehind: true
		},
		'constant': /\b[A-Z][A-Z_\d]+\b/
	});

	Prism.languages.insertBefore('java', 'string', {
		'triple-quoted-string': {
			// http://openjdk.java.net/jeps/355#Description
			pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
			greedy: true,
			alias: 'string'
		},
		'char': {
			pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/,
			greedy: true
		}
	});

	Prism.languages.insertBefore('java', 'class-name', {
		'annotation': {
			pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/,
			lookbehind: true,
			alias: 'punctuation'
		},
		'generics': {
			pattern: /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/,
			inside: {
				'class-name': className,
				'keyword': keywords,
				'punctuation': /[<>(),.:]/,
				'operator': /[?&|]/
			}
		},
		'import': [
			{
				pattern: RegExp(/(\bimport\s+)/.source + classNamePrefix + /(?:[A-Z]\w*|\*)(?=\s*;)/.source),
				lookbehind: true,
				inside: {
					'namespace': className.inside.namespace,
					'punctuation': /\./,
					'operator': /\*/,
					'class-name': /\w+/
				}
			},
			{
				pattern: RegExp(/(\bimport\s+static\s+)/.source + classNamePrefix + /(?:\w+|\*)(?=\s*;)/.source),
				lookbehind: true,
				alias: 'static',
				inside: {
					'namespace': className.inside.namespace,
					'static': /\b\w+$/,
					'punctuation': /\./,
					'operator': /\*/,
					'class-name': /\w+/
				}
			}
		],
		'namespace': {
			pattern: RegExp(
				/(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)(?!<keyword>)[a-z]\w*(?:\.[a-z]\w*)*\.?/
					.source.replace(/<keyword>/g, function () { return keywords.source; })),
			lookbehind: true,
			inside: {
				'punctuation': /\./,
			}
		}
	});
}(Prism));

(function (Prism) {

	var keyword = /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/;
	var modName = /\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g, function () { return keyword.source; });

	Prism.languages.cpp = Prism.languages.extend('c', {
		'class-name': [
			{
				pattern: RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source
					.replace(/<keyword>/g, function () { return keyword.source; })),
				lookbehind: true
			},
			// This is intended to capture the class name of method implementations like:
			//   void foo::bar() const {}
			// However! The `foo` in the above example could also be a namespace, so we only capture the class name if
			// it starts with an uppercase letter. This approximation should give decent results.
			/\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/,
			// This will capture the class name before destructors like:
			//   Foo::~Foo() {}
			/\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i,
			// This also intends to capture the class name of method implementations but here the class has template
			// parameters, so it can't be a namespace (until C++ adds generic namespaces).
			/\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/
		],
		'keyword': keyword,
		'number': {
			pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,
			greedy: true
		},
		'operator': />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
		'boolean': /\b(?:false|true)\b/
	});

	Prism.languages.insertBefore('cpp', 'string', {
		'module': {
			// https://en.cppreference.com/w/cpp/language/modules
			pattern: RegExp(
				/(\b(?:import|module)\s+)/.source +
				'(?:' +
				// header-name
				/"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source +
				'|' +
				// module name or partition or both
				/<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g, function () { return modName; }) +
				')'
			),
			lookbehind: true,
			greedy: true,
			inside: {
				'string': /^[<"][\s\S]+/,
				'operator': /:/,
				'punctuation': /\./
			}
		},
		'raw-string': {
			pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
			alias: 'string',
			greedy: true
		}
	});

	Prism.languages.insertBefore('cpp', 'keyword', {
		'generic-function': {
			pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,
			inside: {
				'function': /^\w+/,
				'generic': {
					pattern: /<[\s\S]+/,
					alias: 'class-name',
					inside: Prism.languages.cpp
				}
			}
		}
	});

	Prism.languages.insertBefore('cpp', 'operator', {
		'double-colon': {
			pattern: /::/,
			alias: 'punctuation'
		}
	});

	Prism.languages.insertBefore('cpp', 'class-name', {
		// the base clause is an optional list of parent classes
		// https://en.cppreference.com/w/cpp/language/class
		'base-clause': {
			pattern: /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,
			lookbehind: true,
			greedy: true,
			inside: Prism.languages.extend('cpp', {})
		}
	});

	Prism.languages.insertBefore('inside', 'double-colon', {
		// All untokenized words that are not namespaces should be class names
		'class-name': /\b[a-z_]\w*\b(?!\s*::)/i
	}, Prism.languages.cpp['base-clause']);

}(Prism));

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function I$2(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);throw n.search=r.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}const M$2="javascript";function R$1(e,n){for(const r of e.childNodes){if(Cs(r)&&r.tagName===n)return  true;R$1(r,n);}return  false}const K$2="data-language",$$1="data-highlight-language",W$3="data-theme";let q$1 = class q extends Ci{__language;__theme;__isSyntaxHighlightSupported;static getType(){return "code"}static clone(t){return new q(t.__language,t.__key)}constructor(t,e){super(e),this.__language=t||void 0,this.__isSyntaxHighlightSupported=false,this.__theme=void 0;}afterCloneFrom(t){super.afterCloneFrom(t),this.__language=t.__language,this.__theme=t.__theme,this.__isSyntaxHighlightSupported=t.__isSyntaxHighlightSupported;}createDOM(t){const n=document.createElement("code");lt$3(n,t.theme.code),n.setAttribute("spellcheck","false");const r=this.getLanguage();r&&(n.setAttribute(K$2,r),this.getIsSyntaxHighlightSupported()&&n.setAttribute($$1,r));const i=this.getTheme();i&&n.setAttribute(W$3,i);const o=this.getStyle();return o&&n.setAttribute("style",o),n}updateDOM(t,e,n){const r=this.__language,i=t.__language;r?r!==i&&e.setAttribute(K$2,r):i&&e.removeAttribute(K$2);const o=this.__isSyntaxHighlightSupported;t.__isSyntaxHighlightSupported&&i?o&&r?r!==i&&e.setAttribute($$1,r):e.removeAttribute($$1):o&&r&&e.setAttribute($$1,r);const s=this.__theme,l=t.__theme;s?s!==l&&e.setAttribute(W$3,s):l&&e.removeAttribute(W$3);const u=this.__style,c=t.__style;return u?u!==c&&e.setAttribute("style",u):c&&e.removeAttribute("style"),false}exportDOM(t){const n=document.createElement("pre");lt$3(n,t._config.theme.code),n.setAttribute("spellcheck","false");const r=this.getLanguage();r&&(n.setAttribute(K$2,r),this.getIsSyntaxHighlightSupported()&&n.setAttribute($$1,r));const i=this.getTheme();i&&n.setAttribute(W$3,i);const o=this.getStyle();return o&&n.setAttribute("style",o),{element:n}}static importDOM(){return {code:t=>null!=t.textContent&&(/\r?\n/.test(t.textContent)||R$1(t,"BR"))?{conversion:Q$1,priority:1}:null,div:()=>({conversion:G$1,priority:1}),pre:()=>({conversion:Q$1,priority:0}),table:t=>tt(t)?{conversion:V$2,priority:3}:null,td:t=>{const e=t,n=e.closest("table");return e.classList.contains("js-file-line")||n&&tt(n)?{conversion:Y,priority:3}:null},tr:t=>{const e=t.closest("table");return e&&tt(e)?{conversion:Y,priority:3}:null}}}static importJSON(t){return U$2().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setLanguage(t.language).setTheme(t.theme)}exportJSON(){return {...super.exportJSON(),language:this.getLanguage(),theme:this.getTheme()}}insertNewAfter(t,e=true){const n=this.getChildren(),r=n.length;if(r>=2&&"\n"===n[r-1].getTextContent()&&"\n"===n[r-2].getTextContent()&&t.isCollapsed()&&t.anchor.key===this.__key&&t.anchor.offset===r){n[r-1].remove(),n[r-2].remove();const t=Li();return this.insertAfter(t,e),t}const{anchor:i,focus:o}=t,a=(i.isBefore(o)?i:o).getNode();if(lr(a)){let t=st$1(a);const e=[];for(;;)if(fr(t))e.push(ur()),t=t.getNextSibling();else {if(!it$1(t))break;{let n=0;const r=t.getTextContent(),i=t.getTextContentSize();for(;n<i&&" "===r[n];)n++;if(0!==n&&e.push(rt(" ".repeat(n))),n!==i)break;t=t.getNextSibling();}}const n=a.splitText(i.offset)[0],r=0===i.offset?0:1,o=n.getIndexWithinParent()+r,s=a.getParentOrThrow(),l=[Jn(),...e];s.splice(o,0,l);const f=e[e.length-1];f?f.select():0===i.offset?n.selectPrevious():n.getNextSibling().selectNext(0,0);}if(X$1(a)){const{offset:e}=t.anchor;a.splice(e,0,[Jn()]),a.select(e+1,e+1);}return null}canIndent(){return  false}collapseAtStart(){const t=Li();return this.getChildren().forEach(e=>t.append(e)),this.replace(t),true}setLanguage(t){const e=this.getWritable();return e.__language=t||void 0,e}getLanguage(){return this.getLatest().__language}setIsSyntaxHighlightSupported(t){const e=this.getWritable();return e.__isSyntaxHighlightSupported=t,e}getIsSyntaxHighlightSupported(){return this.getLatest().__isSyntaxHighlightSupported}setTheme(t){const e=this.getWritable();return e.__theme=t||void 0,e}getTheme(){return this.getLatest().__theme}};function U$2(t,e){return Ks(q$1).setLanguage(t).setTheme(e)}function X$1(t){return t instanceof q$1}function Q$1(t){return {node:U$2(t.getAttribute(K$2))}}function G$1(t){const e=t,n=Z(e);return n||function(t){let e=t.parentElement;for(;null!==e;){if(Z(e))return  true;e=e.parentElement;}return  false}(e)?{node:n?U$2():null}:{node:null}}function V$2(){return {node:U$2()}}function Y(){return {node:null}}function Z(t){return null!==t.style.fontFamily.match("monospace")}function tt(t){return t.classList.contains("js-file-line-container")}let et$1 = class et extends Xn{__highlightType;constructor(t="",e,n){super(t,n),this.__highlightType=e;}static getType(){return "code-highlight"}static clone(t){return new et(t.__text,t.__highlightType||void 0,t.__key)}getHighlightType(){return this.getLatest().__highlightType}setHighlightType(t){const e=this.getWritable();return e.__highlightType=t||void 0,e}canHaveFormat(){return  false}createDOM(t){const n=super.createDOM(t),r=nt$1(t.theme,this.__highlightType);return lt$3(n,r),n}updateDOM(t,r,i){const o=super.updateDOM(t,r,i),s=nt$1(i.theme,t.__highlightType),l=nt$1(i.theme,this.__highlightType);return s!==l&&(s&&ut$2(r,s),l&&lt$3(r,l)),o}static importJSON(t){return rt().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setHighlightType(t.highlightType)}exportJSON(){return {...super.exportJSON(),highlightType:this.getHighlightType()}}setFormat(t){return this}isParentRequired(){return  true}createParentElementNode(){return U$2()}};function nt$1(t,e){return e&&t&&t.codeHighlight&&t.codeHighlight[e]}function rt(t="",e){return fs(new et$1(t,e))}function it$1(t){return t instanceof et$1}function ot$1(t,e){let n=t;for(let i=tl(t,e);i&&(it$1(i.origin)||fr(i.origin));i=ft$1(i))n=i.origin;return n}function st$1(t){return ot$1(t,"previous")}function lt$1(t){return ot$1(t,"next")}function ut(t){const e=st$1(t),n=lt$1(t);let r=e;for(;null!==r;){if(it$1(r)){const t=oo(r.getTextContent());if(null!==t)return t}if(r===n)break;r=r.getNextSibling();}const i=e.getParent();if(Si(i)){const t=i.getDirection();if("ltr"===t||"rtl"===t)return t}return null}function ct$1(t,e){let n=null,r=null,i=t,o=e,s=t.getTextContent();for(;;){if(0===o){if(i=i.getPreviousSibling(),null===i)break;if(it$1(i)||fr(i)||jn(i)||I$2(167),jn(i)){n={node:i,offset:1};break}o=Math.max(0,i.getTextContentSize()-1),s=i.getTextContent();}else o--;const t=s[o];it$1(i)&&" "!==t&&(r={node:i,offset:o});}if(null!==r)return r;let l=null;if(e<t.getTextContentSize())it$1(t)&&(l=t.getTextContent()[e]);else {const e=t.getNextSibling();it$1(e)&&(l=e.getTextContent()[0]);}if(null!==l&&" "!==l)return n;{const r=function(t,e){let n=t,r=e,i=t.getTextContent(),o=t.getTextContentSize();for(;;){if(!it$1(n)||r===o){if(n=n.getNextSibling(),null===n||jn(n))return null;it$1(n)&&(r=0,i=n.getTextContent(),o=n.getTextContentSize());}if(it$1(n)){if(" "!==i[r])return {node:n,offset:r};r++;}}}(t,e);return null!==r?r:n}}function gt(t){const e=lt$1(t);return jn(e)&&I$2(168),e}!function(t){t.languages.diff={coord:[/^(?:\*{3}|-{3}|\+{3}).*$/m,/^@@.*@@$/m,/^\d.*$/m]};var e={"deleted-sign":"-","deleted-arrow":"<","inserted-sign":"+","inserted-arrow":">",unchanged:" ",diff:"!"};Object.keys(e).forEach(function(n){var r=e[n],i=[];/^\w+$/.test(n)||i.push(/\w+/.exec(n)[0]),"diff"===n&&i.push("bold"),t.languages.diff[n]={pattern:RegExp("^(?:["+r+"].*(?:\r\n?|\n|(?![\\s\\S])))+","m"),alias:i,inside:{line:{pattern:/(.)(?=[\s\S]).*(?:\r\n?|\n)?/,lookbehind:true},prefix:{pattern:/[\s\S]/,alias:/\w+/.exec(n)[0]}}};}),Object.defineProperty(t.languages.diff,"PREFIXES",{value:e});}(Prism);const ft=globalThis.Prism||window.Prism,pt={c:"C",clike:"C-like",cpp:"C++",css:"CSS",html:"HTML",java:"Java",js:"JavaScript",markdown:"Markdown",objc:"Objective-C",plain:"Plain Text",powershell:"PowerShell",py:"Python",rust:"Rust",sql:"SQL",swift:"Swift",typescript:"TypeScript",xml:"XML"},ht$1={cpp:"cpp",java:"java",javascript:"js",md:"markdown",plaintext:"plain",python:"py",text:"plain",ts:"typescript"};function dt(t){return ht$1[t]||t}function St$1(t){return "string"==typeof t?t:Array.isArray(t)?t.map(St$1).join(""):St$1(t.content)}function vt(t,e){const n=/^diff-([\w-]+)/i.exec(e),r=t.getTextContent();let i=ft.tokenize(r,ft.languages[n?"diff":e]);return n&&(i=function(t,e){const n=e,r=ft.languages[n],i={tokens:t},o=ft.languages.diff.PREFIXES;for(const t of i.tokens){if("string"==typeof t||!(t.type in o)||!Array.isArray(t.content))continue;const e=t.type;let n=0;const i=()=>(n++,new ft.Token("prefix",o[e],e.replace(/^(\w+).*/,"$1"))),s=t.content.filter(t=>"string"==typeof t||"prefix"!==t.type),l=t.content.length-s.length,u=ft.tokenize(St$1(s),r);u.unshift(i());const c=/\r\n|\n/g,g=t=>{const e=[];c.lastIndex=0;let r,o=0;for(;n<l&&(r=c.exec(t));){const n=r.index+r[0].length;e.push(t.slice(o,n)),o=n,e.push(i());}if(0!==e.length)return o<t.length&&e.push(t.slice(o)),e},a=t=>{for(let e=0;e<t.length&&n<l;e++){const n=t[e];if("string"==typeof n){const r=g(n);r&&(t.splice(e,1,...r),e+=r.length-1);}else if("string"==typeof n.content){const t=g(n.content);t&&(n.content=t);}else Array.isArray(n.content)?a(n.content):a([n.content]);}};a(u),n<l&&u.push(i()),t.content=u;}return i.tokens}(i,n[1])),Tt$1(i)}function Tt$1(t,e){const n=[];for(const r of t)if("string"==typeof r){const t=r.split(/(\n|\t)/),i=t.length;for(let r=0;r<i;r++){const i=t[r];"\n"===i||"\r\n"===i?n.push(Jn()):"\t"===i?n.push(ur()):i.length>0&&n.push(rt(i,e));}}else {const{content:t,alias:e}=r;"string"==typeof t?n.push(...Tt$1([t],"prefix"===r.type&&"string"==typeof e?e:r.type)):Array.isArray(t)&&n.push(...Tt$1(t,"unchanged"===r.type?void 0:r.type));}return n}const bt$1={$tokenize(t,e){return vt(t,e||this.defaultLanguage)},defaultLanguage:M$2,tokenize(t,e){return ft.tokenize(t,ft.languages[e||""]||ft.languages[this.defaultLanguage])}};function Ct$1(t,e,n){const r=t.getParent();X$1(r)?wt$1(r,e,n):it$1(t)&&t.replace(sr(t.__text));}function Nt$1(t,e){const n=e.getElementByKey(t.getKey());if(null===n)return;const r=t.getChildren(),i=r.length;if(i===n.__cachedChildrenLength)return;n.__cachedChildrenLength=i;let o="1",s=1;for(let t=0;t<i;t++)jn(r[t])&&(o+="\n"+ ++s);n.setAttribute("data-gutter",o);}const jt$1=new Set;function wt$1(t,e,n){const r=t.getKey();void 0===t.getLanguage()&&t.setLanguage(n.defaultLanguage);const i=t.getLanguage()||n.defaultLanguage;if(!function(t){const e=function(t){const e=/^diff-([\w-]+)/i.exec(t);return e?e[1]:null}(t),n=e||t;try{return !!n&&ft.languages.hasOwnProperty(n)}catch(t){return  false}}(i))return t.getIsSyntaxHighlightSupported()&&t.setIsSyntaxHighlightSupported(false),void async function(){}();t.getIsSyntaxHighlightSupported()||t.setIsSyntaxHighlightSupported(true),jt$1.has(r)||(jt$1.add(r),e.update(()=>{!function(t,e){const n=xo(t);if(!X$1(n)||!n.isAttached())return;const r=Lr();if(!yr(r))return void e();const i=r.anchor,o=i.offset,s="element"===i.type&&jn(n.getChildAtIndex(i.offset-1));let u=0;if(!s){const t=i.getNode();u=o+t.getPreviousSiblings().reduce((t,e)=>t+e.getTextContentSize(),0);}if(!e())return;if(s)return void i.getNode().select(o,o);n.getChildren().some(t=>{const e=lr(t);if(e||jn(t)){const n=t.getTextContentSize();if(e&&n>=u)return t.select(u,u),true;u-=n;}return  false});}(r,()=>{const e=xo(r);if(!X$1(e)||!e.isAttached())return  false;const i=e.getLanguage()||n.defaultLanguage,o=n.$tokenize(e,i),s=function(t,e){let n=0;for(;n<t.length&&kt$1(t[n],e[n]);)n++;const r=t.length,i=e.length,o=Math.min(r,i)-n;let s=0;for(;s<o;)if(s++,!kt$1(t[r-s],e[i-s])){s--;break}const l=n,u=r-s,c=e.slice(n,i-s);return {from:l,nodesForReplacement:c,to:u}}(e.getChildren(),o),{from:l,to:u,nodesForReplacement:c}=s;return !(l===u&&!c.length)&&(t.splice(l,u-l,c),true)});},{onUpdate:()=>{jt$1.delete(r);},skipTransforms:true}));}function kt$1(t,e){return it$1(t)&&it$1(e)&&t.__text===e.__text&&t.__highlightType===e.__highlightType||fr(t)&&fr(e)||jn(t)&&jn(e)}function At$1(t){if(!yr(t))return  false;const e=t.anchor.getNode(),n=X$1(e)?e:e.getParent(),r=t.focus.getNode(),i=X$1(r)?r:r.getParent();return X$1(n)&&n.is(i)}function Pt$1(t){const e=t.getNodes(),n=[];if(1===e.length&&X$1(e[0]))return n;let r=[];for(let t=0;t<e.length;t++){const i=e[t];it$1(i)||fr(i)||jn(i)||I$2(169),jn(i)?r.length>0&&(n.push(r),r=[]):r.push(i);}if(r.length>0){const e=t.isBackward()?t.anchor:t.focus,i=hr(r[0].getKey(),0,"text");e.is(i)||n.push(r);}return n}function Lt$1(t){const e=Lr();if(!yr(e)||!At$1(e))return  false;const n=Pt$1(e),r=n.length;if(0===r&&e.isCollapsed())return t===Pe$1&&e.insertNodes([ur()]),true;if(0===r&&t===Pe$1&&"\n"===e.getTextContent()){const t=ur(),n=Jn(),r=e.isBackward()?"previous":"next";return e.insertNodes([t,n]),Sl(Al(dl(el(t,"next",0),El(tl(n,"next"))),r)),true}for(let i=0;i<r;i++){const r=n[i];if(r.length>0){let n=r[0];if(0===i&&(n=st$1(n)),t===Pe$1){const t=ur();if(n.insertBefore(t),0===i){const r=e.isBackward()?"focus":"anchor",i=hr(n.getKey(),0,"text");e[r].is(i)&&e[r].set(t.getKey(),0,"text");}}else fr(n)&&n.remove();}}return  true}function Ot(t,e){const n=Lr();if(!yr(n))return  false;const{anchor:r,focus:i}=n,o=r.offset,s=i.offset,l=r.getNode(),c=i.getNode(),g=t===ke$1;if(!At$1(n)||!it$1(l)&&!fr(l)||!it$1(c)&&!fr(c))return  false;if(!e.altKey){if(n.isCollapsed()){const t=l.getParentOrThrow();if(g&&0===o&&null===l.getPreviousSibling()){if(null===t.getPreviousSibling())return t.selectPrevious(),e.preventDefault(),true}else if(!g&&o===l.getTextContentSize()&&null===l.getNextSibling()){if(null===t.getNextSibling())return t.selectNext(),e.preventDefault(),true}}return  false}let a,f;if(l.isBefore(c)?(a=st$1(l),f=lt$1(c)):(a=st$1(c),f=lt$1(l)),null==a||null==f)return  false;const p=a.getNodesBetween(f);for(let t=0;t<p.length;t++){const e=p[t];if(!it$1(e)&&!fr(e)&&!jn(e))return  false}e.preventDefault(),e.stopPropagation();const h=g?a.getPreviousSibling():f.getNextSibling();if(!jn(h))return  true;const d=g?h.getPreviousSibling():h.getNextSibling();if(null==d)return  true;const m=it$1(d)||fr(d)||jn(d)?g?st$1(d):lt$1(d):null;let x=null!=m?m:d;return h.remove(),p.forEach(t=>t.remove()),t===ke$1?(p.forEach(t=>x.insertBefore(t)),x.insertBefore(h)):(x.insertAfter(h),x=h,p.forEach(t=>{x.insertAfter(t),x=t;})),n.setTextNodeRange(l,o,c,s),true}function Ht(t,e){const n=Lr();if(!yr(n))return  false;const{anchor:r,focus:i}=n,o=r.getNode(),s=i.getNode(),l=t===ve$1;if(!At$1(n)||!it$1(o)&&!fr(o)||!it$1(s)&&!fr(s))return  false;const c=s;if("rtl"===ut(c)?!l:l){const t=ct$1(c,i.offset);if(null!==t){const{node:e,offset:r}=t;jn(e)?e.selectNext(0,0):n.setTextNodeRange(e,r,e,r);}else c.getParentOrThrow().selectStart();}else {gt(c).select();}return e.preventDefault(),e.stopPropagation(),true}function Et$1(t,e){if(!t.hasNodes([q$1,et$1]))throw new Error("CodeHighlightPlugin: CodeNode or CodeHighlightNode not registered on editor");null==e&&(e=bt$1);const n=[];return  true!==t._headless&&n.push(t.registerMutationListener(q$1,e=>{t.getEditorState().read(()=>{for(const[n,r]of e)if("destroyed"!==r){const e=xo(n);null!==e&&Nt$1(e,t);}});},{skipInitialization:false})),n.push(t.registerNodeTransform(q$1,n=>wt$1(n,t,e)),t.registerNodeTransform(Xn,n=>Ct$1(n,t,e)),t.registerNodeTransform(et$1,n=>Ct$1(n,t,e)),t.registerCommand(Me$1,e=>{const n=function(t){const e=Lr();if(!yr(e)||!At$1(e))return null;const n=t?De$1:Pe$1,r=t?De$1:Ae$1,i=e.anchor,o=e.focus;if(i.is(o))return r;const s=Pt$1(e);if(1!==s.length)return n;const l=s[0];let u,c;0===l.length&&I$2(285),e.isBackward()?(u=o,c=i):(u=i,c=o);const g=st$1(l[0]),a=lt$1(l[0]),f=hr(g.getKey(),0,"text"),p=hr(a.getKey(),a.getTextContentSize(),"text");return u.isBefore(f)||p.isBefore(c)?n:f.isBefore(u)||c.isBefore(p)?r:n}(e.shiftKey);return null!==n&&(e.preventDefault(),t.dispatchCommand(n,void 0),true)},zi),t.registerCommand(Ae$1,()=>!!At$1(Lr())&&(jr([ur()]),true),zi),t.registerCommand(Pe$1,t=>Lt$1(Pe$1),zi),t.registerCommand(De$1,t=>Lt$1(De$1),zi),t.registerCommand(ke$1,t=>{const e=Lr();if(!yr(e))return  false;const{anchor:n}=e,r=n.getNode();return !!At$1(e)&&(e.isCollapsed()&&0===n.offset&&null===r.getPreviousSibling()&&X$1(r.getParentOrThrow())?(t.preventDefault(),true):Ot(ke$1,t))},zi),t.registerCommand(Te$1,t=>{const e=Lr();if(!yr(e))return  false;const{anchor:n}=e,r=n.getNode();return !!At$1(e)&&(e.isCollapsed()&&n.offset===r.getTextContentSize()&&null===r.getNextSibling()&&X$1(r.getParentOrThrow())?(t.preventDefault(),true):Ot(Te$1,t))},zi),t.registerCommand(ve$1,t=>Ht(ve$1,t),zi),t.registerCommand(Ce$1,t=>Ht(Ce$1,t),zi)),U$4(...n)}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const R=new Set(["http:","https:","mailto:","sms:","tel:"]);let y$1 = class y extends Ci{__url;__target;__rel;__title;static getType(){return "link"}static clone(t){return new y(t.__url,{rel:t.__rel,target:t.__target,title:t.__title},t.__key)}constructor(t="",e={},n){super(n);const{target:r=null,rel:i=null,title:l=null}=e;this.__url=t,this.__target=r,this.__rel=i,this.__title=l;}createDOM(e){const n=document.createElement("a");return this.updateLinkDOM(null,n,e),lt$3(n,e.theme.link),n}updateLinkDOM(t,n,r){if(xs(n)){t&&t.__url===this.__url||(n.href=this.sanitizeUrl(this.__url));for(const e of ["target","rel","title"]){const r=`__${e}`,i=this[r];t&&t[r]===i||(i?n[e]=i:n.removeAttribute(e));}}}updateDOM(t,e,n){return this.updateLinkDOM(t,e,n),false}static importDOM(){return {a:t=>({conversion:N$1,priority:1})}}static importJSON(t){return D$1().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setURL(t.url).setRel(t.rel||null).setTarget(t.target||null).setTitle(t.title||null)}sanitizeUrl(t){t=W$2(t);try{const e=new URL(W$2(t));if(!R.has(e.protocol))return "about:blank"}catch(e){return t}return t}exportJSON(){return {...super.exportJSON(),rel:this.getRel(),target:this.getTarget(),title:this.getTitle(),url:this.getURL()}}getURL(){return this.getLatest().__url}setURL(t){const e=this.getWritable();return e.__url=t,e}getTarget(){return this.getLatest().__target}setTarget(t){const e=this.getWritable();return e.__target=t,e}getRel(){return this.getLatest().__rel}setRel(t){const e=this.getWritable();return e.__rel=t,e}getTitle(){return this.getLatest().__title}setTitle(t){const e=this.getWritable();return e.__title=t,e}insertNewAfter(t,e=true){const n=D$1(this.__url,{rel:this.__rel,target:this.__target,title:this.__title});return this.insertAfter(n,e),n}canInsertTextBefore(){return  false}canInsertTextAfter(){return  false}canBeEmpty(){return  false}isInline(){return  true}extractWithChild(t,e,n){if(!yr(e))return  false;const r=e.anchor.getNode(),i=e.focus.getNode();return this.isParentOf(r)&&this.isParentOf(i)&&e.getTextContent().length>0}isEmailURI(){return this.__url.startsWith("mailto:")}isWebSiteURI(){return this.__url.startsWith("https://")||this.__url.startsWith("http://")}};function N$1(t){let n=null;if(xs(t)){const e=t.textContent;(null!==e&&""!==e||t.children.length>0)&&(n=D$1(t.getAttribute("href")||"",{rel:t.getAttribute("rel"),target:t.getAttribute("target"),title:t.getAttribute("title")}));}return {node:n}}function D$1(t="",e){return fs(new y$1(t,e))}function w$2(t){return t instanceof y$1}class A extends y$1{__isUnlinked;constructor(t="",e={},n){super(t,e,n),this.__isUnlinked=void 0!==e.isUnlinked&&null!==e.isUnlinked&&e.isUnlinked;}static getType(){return "autolink"}static clone(t){return new A(t.__url,{isUnlinked:t.__isUnlinked,rel:t.__rel,target:t.__target,title:t.__title},t.__key)}getIsUnlinked(){return this.__isUnlinked}setIsUnlinked(t){const e=this.getWritable();return e.__isUnlinked=t,e}createDOM(t){return this.__isUnlinked?document.createElement("span"):super.createDOM(t)}updateDOM(t,e,n){return super.updateDOM(t,e,n)||t.__isUnlinked!==this.__isUnlinked}static importJSON(t){return I$1().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setIsUnlinked(t.isUnlinked||false)}static importDOM(){return null}exportJSON(){return {...super.exportJSON(),isUnlinked:this.__isUnlinked}}insertNewAfter(t,e=true){const n=this.getParentOrThrow().insertNewAfter(t,e);if(Si(n)){const t=I$1(this.__url,{isUnlinked:this.__isUnlinked,rel:this.__rel,target:this.__target,title:this.__title});return n.append(t),t}return null}}function I$1(t="",e){return fs(new A(t,e))}function E$2(t){return t instanceof A}function M$1(t,e){if("element"===t.type){const n=t.getNode();Si(n)||function(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);throw n.search=r.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}(252);return n.getChildren()[t.offset+e]||null}return null}function J$1(t,e={}){let r;if(t&&"object"==typeof t){const{url:n,...i}=t;r=n,e={...i,...e};}else r=t;const{target:i,title:l}=e,s=void 0===e.rel?"noreferrer":e.rel,u=Lr();if(null===u||!yr(u)&&!xr(u))return;if(xr(u)){const t=u.getNodes();if(0===t.length)return;return void t.forEach(t=>{if(null===r){const e=zs(t,t=>!E$2(t)&&w$2(t));e&&(e.insertBefore(t),0===e.getChildren().length&&e.remove());}else {const e=zs(t,t=>!E$2(t)&&w$2(t));if(e)e.setURL(r),void 0!==i&&e.setTarget(i),void 0!==s&&e.setRel(s);else {const e=D$1(r,{rel:s,target:i});t.insertBefore(e),e.append(t);}}})}const h=u.extract();if(null===r){const t=new Set;return void h.forEach(e=>{const n=e.getParent();if(w$2(n)&&!E$2(n)){const e=n.getKey();if(t.has(e))return;!function(t,e){const n=new Set(e.filter(e=>t.isParentOf(e)).map(t=>t.getKey())),r=t.getChildren(),i=r.filter(t=>n.has(t.getKey()));if(i.length===r.length)return r.forEach(e=>t.insertBefore(e)),void t.remove();const l=r.findIndex(t=>n.has(t.getKey())),s=r.findLastIndex(t=>n.has(t.getKey())),o=0===l,u=s===r.length-1;if(o)i.forEach(e=>t.insertBefore(e));else if(u)for(let e=i.length-1;e>=0;e--)t.insertAfter(i[e]);else {for(let e=i.length-1;e>=0;e--)t.insertAfter(i[e]);const e=r.slice(s+1);if(e.length>0){const n=D$1(t.getURL(),{rel:t.getRel(),target:t.getTarget(),title:t.getTitle()});i[i.length-1].insertAfter(n),e.forEach(t=>n.append(t));}}}(n,h),t.add(e);}})}const p=new Set,_=t=>{p.has(t.getKey())||(p.add(t.getKey()),t.setURL(r),void 0!==i&&t.setTarget(i),void 0!==s&&t.setRel(s),void 0!==l&&t.setTitle(l));};if(1===h.length){const t=h[0],e=zs(t,w$2);if(null!==e)return _(e)}!function(t){const e=Lr();if(!yr(e))return t();const n=St$5(e),r=n.isBackward(),i=M$1(n.anchor,r?-1:0),l=M$1(n.focus,r?0:-1);t();if(i||l){const t=Lr();if(yr(t)){const e=t.clone();if(i){const t=i.getParent();t&&e.anchor.set(t.getKey(),i.getIndexWithinParent()+(r?1:0),"element");}if(l){const t=l.getParent();t&&e.focus.set(t.getKey(),l.getIndexWithinParent()+(r?0:1),"element");}wo(St$5(e));}}}(()=>{let t=null;for(const e of h){if(!e.isAttached())continue;const o=zs(e,w$2);if(o){_(o);continue}if(Si(e)){if(!e.isInline())continue;if(w$2(e)){if(!(E$2(e)||null!==t&&t.getParentOrThrow().isParentOf(e))){_(e),t=e;continue}for(const t of e.getChildren())e.insertBefore(t);e.remove();continue}}const u=e.getPreviousSibling();w$2(u)&&u.is(t)?u.append(e):(t=D$1(r,{rel:s,target:i,title:l}),e.insertAfter(t),t.append(e));}});}const K$1=/^\+?[0-9\s()-]{5,}$/;function W$2(t){return t.match(/^[a-z][a-z0-9+.-]*:/i)||t.match(/^[/#.]/)?t:t.includes("@")?`mailto:${t}`:K$1.test(t)?`tel:${t}`:`https://${t}`}

function getNearestListItemNode(node) {
  let current = node;
  while (current !== null) {
    if (ot$2(current)) return current
    current = current.getParent();
  }
  return null
}

function getListType(node) {
  let current = node;
  while (current) {
    if (dt$1(current)) {
      return current.getListType()
    }
    current = current.getParent();
  }
  return null
}

function isPrintableCharacter(event) {
  // Ignore if modifier keys are pressed (except Shift for uppercase)
  if (event.ctrlKey || event.metaKey || event.altKey) return false

  // Ignore special keys
  if (event.key.length > 1 && event.key !== "Enter" && event.key !== "Space") return false

  // Accept single character keys (letters, numbers, punctuation)
  return event.key.length === 1
}

function extendTextNodeConversion(conversionName, callback = (textNode => textNode)) {
  return extendConversion(Xn, conversionName, (conversionOutput, element) => ({
    ...conversionOutput,
    forChild: (lexicalNode, parentNode) => {
      const originalForChild = conversionOutput?.forChild ?? (x => x);
      let childNode = originalForChild(lexicalNode, parentNode);

      if (lr(childNode)) childNode = callback(childNode, element) ?? childNode;
      return childNode
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

function isSelectionHighlighted(selection) {
  if (!yr(selection)) return false

  if (selection.isCollapsed()) {
    return hasHighlightStyles(selection.style)
  } else {
    return selection.hasFormat("highlight")
  }
}

function hasHighlightStyles(cssOrStyles) {
  const styles = typeof cssOrStyles === "string" ? b$3(cssOrStyles) : cssOrStyles;
  return !!(styles.color || styles["background-color"])
}

class LexicalToolbarElement extends HTMLElement {
  static observedAttributes = [ "connected" ]

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "toolbar";
  }

  connectedCallback() {
    requestAnimationFrame(() => this.#refreshToolbarOverflow());

    this._resizeObserver = new ResizeObserver(() => this.#refreshToolbarOverflow());
    this._resizeObserver.observe(this);
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this.#unbindHotkeys();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect());
    }
  }

  setEditor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
    this.#bindButtons();
    this.#bindHotkeys();
    this.#setTabIndexValues();
    this.#setItemPositionValues();
    this.#monitorSelectionChanges();
    this.#monitorHistoryChanges();
    this.#refreshToolbarOverflow();

    this.toggleAttribute("connected", true);
  }

  #reconnect() {
    this.disconnectedCallback();
    this.connectedCallback();
  }

  #bindButtons() {
    this.addEventListener("click", this.#handleButtonClicked.bind(this));
  }

  #handleButtonClicked({ target }) {
    this.#handleTargetClicked(target, "[data-command]", this.#dispatchButtonCommand.bind(this));
  }

  #handleTargetClicked(target, selector, callback) {
    const button = target.closest(selector);
    if (button) {
      callback(button);
    }
  }

  #dispatchButtonCommand(button) {
    const { command, payload } = button.dataset;
    this.editor.dispatchCommand(command, payload);
  }

  #bindHotkeys() {
    this.editorElement.addEventListener("keydown", this.#handleHotkey);
  }

  #unbindHotkeys() {
    this.editorElement?.removeEventListener("keydown", this.#handleHotkey);
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

  #setTabIndexValues() {
    this.#buttons.forEach((button) => {
      button.setAttribute("tabindex", 0);
    });
  }

  #monitorSelectionChanges() {
    this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        this.#updateButtonStates();
      });
    });
  }

  #monitorHistoryChanges() {
    this.editor.registerUpdateListener(() => {
      this.#updateUndoRedoButtonStates();
    });
  }

  #updateUndoRedoButtonStates() {
    this.editor.getEditorState().read(() => {
      const historyState = this.editorElement.historyState;
      if (historyState) {
        this.#setButtonDisabled("undo", historyState.undoStack.length === 0);
        this.#setButtonDisabled("redo", historyState.redoStack.length === 0);
      }
    });
  }

  #updateButtonStates() {
    const selection = Lr();
    if (!yr(selection)) return

    const anchorNode = selection.anchor.getNode();
    if (!anchorNode.getParent()) { return }

    const topLevelElement = anchorNode.getTopLevelElementOrThrow();

    const isBold = selection.hasFormat("bold");
    const isItalic = selection.hasFormat("italic");
    const isStrikethrough = selection.hasFormat("strikethrough");
    const isHighlight = isSelectionHighlighted(selection);
    const isInLink = this.#isInLink(anchorNode);
    const isInQuote = Ot$1(topLevelElement);
    const isInHeading = It$1(topLevelElement);
    const isInCode = X$1(topLevelElement) || selection.hasFormat("code");
    const isInList = this.#isInList(anchorNode);
    const listType = getListType(anchorNode);

    this.#setButtonPressed("bold", isBold);
    this.#setButtonPressed("italic", isItalic);
    this.#setButtonPressed("strikethrough", isStrikethrough);
    this.#setButtonPressed("highlight", isHighlight);
    this.#setButtonPressed("link", isInLink);
    this.#setButtonPressed("quote", isInQuote);
    this.#setButtonPressed("heading", isInHeading);
    this.#setButtonPressed("code", isInCode);
    this.#setButtonPressed("unordered-list", isInList && listType === "bullet");
    this.#setButtonPressed("ordered-list", isInList && listType === "number");

    this.#updateUndoRedoButtonStates();
  }

  #isInList(node) {
    let current = node;
    while (current) {
      if (dt$1(current) || ot$2(current)) return true
      current = current.getParent();
    }
    return false
  }

  #isInLink(node) {
    let current = node;
    while (current) {
      if (w$2(current)) return true
      current = current.getParent();
    }
    return false
  }

  #setButtonPressed(name, isPressed) {
    const button = this.querySelector(`[name="${name}"]`);
    if (button) {
      button.setAttribute("aria-pressed", isPressed.toString());
    }
  }

  #setButtonDisabled(name, isDisabled) {
    const button = this.querySelector(`[name="${name}"]`);
    if (button) {
      button.disabled = isDisabled;
      button.setAttribute("aria-disabled", isDisabled.toString());
    }
  }

  #toolbarIsOverflowing() {
    return this.scrollWidth > this.clientWidth
  }

  #refreshToolbarOverflow = () => {
    this.#resetToolbar();
    this.#compactMenu();

    this.#overflow.style.display = this.#overflowMenu.children.length ? "block" : "none";
    this.#overflow.setAttribute("nonce", getNonce());

    const isOverflowing = this.#overflowMenu.children.length > 0;
    this.toggleAttribute("overflowing", isOverflowing);
  }

  #compactMenu() {
    const buttons = this.#buttons.reverse();
    let movedToOverflow = false;

    for (const button of buttons) {
      if (this.#toolbarIsOverflowing()) {
        this.#overflowMenu.prepend(button);
        movedToOverflow = true;
      } else {
        if (movedToOverflow) this.#overflowMenu.prepend(button);
        break
      }
    }
  }

  #resetToolbar() {
    const items = Array.from(this.#overflowMenu.children);
    items.sort((a, b) => this.#itemPosition(b) - this.#itemPosition(a));

    items.forEach((item) => {
      const nextItem = this.querySelector(`[data-position="${this.#itemPosition(item) + 1}"]`) ?? this.#overflow;
      this.insertBefore(item, nextItem);
    });
  }

  #itemPosition(item) {
    return parseInt(item.dataset.position ?? "999")
  }

  #setItemPositionValues() {
    this.#toolbarItems.forEach((item, index) => {
      if (item.dataset.position === undefined) {
        item.dataset.position = index;
      }
    });
  }

  get #overflow() {
    return this.querySelector(".lexxy-editor__toolbar-overflow")
  }

  get #overflowMenu() {
    return this.querySelector(".lexxy-editor__toolbar-overflow-menu")
  }

  get #buttons() {
    return Array.from(this.querySelectorAll(":scope > button"))
  }

  get #toolbarItems() {
    return Array.from(this.querySelectorAll(":scope > *:not(.lexxy-editor__toolbar-overflow)"))
  }

  static get defaultTemplate() {
    return `
      <button class="lexxy-editor__toolbar-button" type="button" name="bold" data-command="bold" title="Bold">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 22V2h8.183c1.764 0 3.174.435 4.228 1.304 1.055.87 1.582 2.076 1.582 3.62 0 .8-.148 1.503-.445 2.109a3.94 3.94 0 01-1.194 1.465 4.866 4.866 0 01-1.726.806v.176c.786.078 1.51.312 2.172.703a4.293 4.293 0 011.596 1.627c.403.693.604 1.543.604 2.549 0 1.192-.292 2.207-.877 3.048-.585.84-1.39 1.484-2.416 1.934-1.026.44-2.206.659-3.538.659H5zM8.854 4.974v5.348h2.56c.873 0 1.582-.107 2.129-.322.556-.215.963-.523 1.222-.923.269-.41.403-.904.403-1.48 0-.82-.254-1.46-.762-1.92-.499-.468-1.204-.703-2.115-.703H8.854zm0 8.103v5.949h2.877c1.534 0 2.636-.245 3.307-.733.671-.498 1.007-1.221 1.007-2.168 0-.635-.134-1.178-.403-1.627-.268-.459-.666-.81-1.193-1.055-.518-.244-1.156-.366-1.913-.366H8.854z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="italic" data-command="italic" title="Italic">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.1 4h-1.5l-3.2 16h1.5l-.4 2h-7l.4-2h1.5l3.2-16h-1.5l.4-2h7l-.4 2z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="strikethrough" data-command="strikethrough" title="Strikethrough">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M4.70588 16.1591C4.81459 19.7901 7.48035 22 11.6668 22C15.9854 22 18.724 19.6296 18.724 15.8779C18.724 15.5007 18.6993 15.1427 18.6474 14.8066H14.3721C14.8637 15.2085 15.0799 15.7037 15.0799 16.3471C15.0799 17.7668 13.7532 18.7984 11.8113 18.7984C9.88053 18.7984 8.38582 17.7531 8.21659 16.1591H4.70588ZM5.23953 9.31962H9.88794C9.10723 8.88889 8.75888 8.33882 8.75888 7.57339C8.75888 6.13992 9.96576 5.18793 11.7631 5.18793C13.5852 5.18793 14.8761 6.1797 14.9959 7.81344H18.4102C18.3485 4.31824 15.8038 2 11.752 2C7.867 2 5.09129 4.35802 5.09129 7.92044C5.09129 8.41838 5.14071 8.88477 5.23953 9.31962ZM2.23529 10.6914C1.90767 10.6914 1.59347 10.8359 1.36181 11.0931C1.13015 11.3504 1 11.6993 1 12.0631C1 12.4269 1.13015 12.7758 1.36181 13.0331C1.59347 13.2903 1.90767 13.4348 2.23529 13.4348H20.7647C21.0923 13.4348 21.4065 13.2903 21.6382 13.0331C21.8699 12.7758 22 12.4269 22 12.0631C22 11.6993 21.8699 11.3504 21.6382 11.0931C21.4065 10.8359 21.0923 10.6914 20.7647 10.6914H2.23529Z"/>
        </svg>
      </button>

      <details class="lexxy-editor__toolbar-dropdown" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" name="highlight" title="Color highlight">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.65422 0.711575C7.1856 0.242951 6.42579 0.242951 5.95717 0.711575C5.48853 1.18021 5.48853 1.94 5.95717 2.40864L8.70864 5.16011L2.85422 11.0145C1.44834 12.4204 1.44833 14.6998 2.85422 16.1057L7.86011 21.1115C9.26599 22.5174 11.5454 22.5174 12.9513 21.1115L19.6542 14.4087C20.1228 13.94 20.1228 13.1802 19.6542 12.7115L11.8544 4.91171L11.2542 4.31158L7.65422 0.711575ZM4.55127 12.7115L10.4057 6.85716L17.1087 13.56H4.19981C4.19981 13.253 4.31696 12.9459 4.55127 12.7115ZM23.6057 20.76C23.6057 22.0856 22.5311 23.16 21.2057 23.16C19.8802 23.16 18.8057 22.0856 18.8057 20.76C18.8057 19.5408 19.8212 18.5339 20.918 17.4462C21.0135 17.3516 21.1096 17.2563 21.2057 17.16C21.3018 17.2563 21.398 17.3516 21.4935 17.4462C22.5903 18.5339 23.6057 19.5408 23.6057 20.76Z"/></svg>
        </summary>
        <lexxy-highlight-dropdown class="lexxy-editor__toolbar-dropdown-content">
          <div data-button-group="color" data-values="var(--highlight-1); var(--highlight-2); var(--highlight-3); var(--highlight-4); var(--highlight-5); var(--highlight-6); var(--highlight-7); var(--highlight-8); var(--highlight-9)"></div>
          <div data-button-group="background-color" data-values="var(--highlight-bg-1); var(--highlight-bg-2); var(--highlight-bg-3); var(--highlight-bg-4); var(--highlight-bg-5); var(--highlight-bg-6); var(--highlight-bg-7); var(--highlight-bg-8); var(--highlight-bg-9)"></div>
          <button data-command="removeHighlight" class="lexxy-editor__toolbar-dropdown-reset">Remove all coloring</button>
        </lexxy-highlight-dropdown>
      </details>

      <details class="lexxy-editor__toolbar-dropdown" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" name="link" title="Link" data-hotkey="cmd+k ctrl+k">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.111 9.546a1.5 1.5 0 012.121 0 5.5 5.5 0 010 7.778l-2.828 2.828a5.5 5.5 0 01-7.778 0 5.498 5.498 0 010-7.777l2.828-2.83a1.5 1.5 0 01.355-.262 6.52 6.52 0 00.351 3.799l-1.413 1.414a2.499 2.499 0 000 3.535 2.499 2.499 0 003.535 0l2.83-2.828a2.5 2.5 0 000-3.536 1.5 1.5 0 010-2.121z"/><path d="M12.111 3.89a5.5 5.5 0 117.778 7.777l-2.828 2.829a1.496 1.496 0 01-.355.262 6.522 6.522 0 00-.351-3.8l1.413-1.412a2.5 2.5 0 10-3.536-3.535l-2.828 2.828a2.5 2.5 0 000 3.536 1.5 1.5 0 01-2.122 2.12 5.5 5.5 0 010-7.777l2.83-2.829z"/></svg>
        </summary>
        <lexxy-link-dropdown class="lexxy-editor__toolbar-dropdown-content">
          <form method="dialog">
            <input type="url" placeholder="Enter a URL…" class="input">
            <div class="lexxy-editor__toolbar-dropdown-actions">
              <button type="submit" class="btn" value="link">Link</button>
              <button type="button" class="btn" value="unlink">Unlink</button>
            </div>
          </form>
        </lexxy-link-dropdown>
      </details>

      <button class="lexxy-editor__toolbar-button" type="button" name="quote" data-command="insertQuoteBlock" title="Quote">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 5C8.985 5 11 7.09 11 9.667c0 2.694-.962 5.005-2.187 6.644-.613.82-1.3 1.481-1.978 1.943-.668.454-1.375.746-2.022.746a.563.563 0 01-.52-.36.602.602 0 01.067-.57l.055-.066.009-.009.041-.048a4.25 4.25 0 00.168-.21c.143-.188.336-.47.53-.84a6.743 6.743 0 00.75-2.605C3.705 13.994 2 12.038 2 9.667 2 7.089 4.015 5 6.5 5zM17.5 5C19.985 5 22 7.09 22 9.667c0 2.694-.962 5.005-2.187 6.644-.613.82-1.3 1.481-1.978 1.943-.668.454-1.375.746-2.023.746a.563.563 0 01-.52-.36.602.602 0 01.068-.57l.055-.066.009-.009.041-.048c.039-.045.097-.115.168-.21a6.16 6.16 0 00.53-.84 6.745 6.745 0 00.75-2.605C14.705 13.994 13 12.038 13 9.667 13 7.089 15.015 5 17.5 5z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="heading" data-command="rotateHeadingFormat" title="Heading">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.322 5.315H9.64V22H5.684V5.315H0v-3.31h15.322v3.31z"/><path d="M23.957 11.79H19.92V22h-3.402V11.79H12.48V9.137h11.477v2.653z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="code" data-command="insertCodeBlock" title="Code">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10.121 6l-6 6 6 6-2.12 2.121-7.061-7.06a1.5 1.5 0 010-2.121L8 3.879 10.121 6zM23.06 10.94a1.5 1.5 0 010 2.12L16 20.121 13.88 18l6-6-6-6L16 3.879l7.06 7.06z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="unordered-list" data-command="insertUnorderedList" title="Bullet list">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 5a2 2 0 11-4 0 2 2 0 014 0zM5 12a2 2 0 11-4 0 2 2 0 014 0zM5 19a2 2 0 11-4 0 2 2 0 014 0zM7 5.25C7 4.56 7.56 4 8.25 4h13.5a1.25 1.25 0 110 2.5H8.25C7.56 6.5 7 5.94 7 5.25zM7 12.25c0-.69.56-1.25 1.25-1.25h13.5a1.25 1.25 0 110 2.5H8.25c-.69 0-1.25-.56-1.25-1.25zM7 19.25c0-.69.56-1.25 1.25-1.25h13.5a1.25 1.25 0 110 2.5H8.25c-.69 0-1.25-.56-1.25-1.25z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="ordered-list" data-command="insertOrderedList" title="Numbered list">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 5.25C7 4.56 7.56 4 8.25 4h13.5a1.25 1.25 0 110 2.5H8.25C7.56 6.5 7 5.94 7 5.25zM7 12.25c0-.69.56-1.25 1.25-1.25h13.5a1.25 1.25 0 110 2.5H8.25c-.69 0-1.25-.56-1.25-1.25zM7 19.25c0-.69.56-1.25 1.25-1.25h13.5a1.25 1.25 0 110 2.5H8.25c-.69 0-1.25-.56-1.25-1.25zM4.438 8H3.39V3.684H3.34c-.133.093-.267.188-.402.285l-.407.289a129.5 129.5 0 00-.402.285v-.969l.633-.453c.21-.15.42-.302.629-.453h1.046V8zM2.672 11.258h-1v-.051c0-.206.036-.405.11-.598.075-.195.188-.37.34-.527.15-.156.339-.281.566-.375.229-.094.498-.14.808-.14.367 0 .688.065.961.195s.484.308.633.535c.15.224.226.478.226.762 0 .244-.046.463-.14.656-.091.19-.209.368-.352.535-.14.164-.289.332-.445.504L3.168 14.09v.05h2.238V15H1.723v-.656l1.949-2.102c.096-.101.19-.207.281-.316.091-.112.167-.232.227-.36a.953.953 0 00.09-.41.712.712 0 00-.387-.648.845.845 0 00-.41-.098.81.81 0 00-.43.11.75.75 0 00-.277.293.824.824 0 00-.094.386V11.258zM2.852 19.66v-.812h.562a.917.917 0 00.43-.098.742.742 0 00.293-.266.673.673 0 00.101-.379.654.654 0 00-.234-.523.87.87 0 00-.59-.2.987.987 0 00-.336.055.837.837 0 00-.258.149.712.712 0 00-.172.215.66.66 0 00-.066.25h-.98c.007-.209.053-.403.136-.582.084-.18.203-.336.36-.469.156-.135.346-.24.57-.316.227-.076.486-.115.777-.118a2.33 2.33 0 01.965.176c.271.12.48.285.63.496.15.209.227.448.23.719a1.11 1.11 0 01-.16.637 1.28 1.28 0 01-.825.586v.054c.162.016.33.07.504.164.177.094.328.232.453.415.125.18.189.411.192.695a1.37 1.37 0 01-.157.676c-.104.197-.25.365-.437.503-.188.136-.404.24-.649.313-.242.07-.5.105-.777.105-.401 0-.743-.067-1.027-.203a1.608 1.608 0 01-.649-.547 1.46 1.46 0 01-.238-.75h.969c.01.128.057.243.14.344a.885.885 0 00.332.238c.141.058.3.088.477.09.195 0 .366-.034.512-.101a.798.798 0 00.336-.29.744.744 0 00.117-.425.74.74 0 00-.446-.695 1.082 1.082 0 00-.496-.106h-.59z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="upload" data-command="uploadAttachments" title="Upload file">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 8a2 2 0 110 4 2 2 0 010-4z""/><path d="M22 2a1 1 0 011 1v18a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h20zM3 18.714L9 11l5.25 6.75L17 15l4 4V4H3v14.714z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="divider" data-command="insertHorizontalDivider" title="Insert a divider">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 12C0 11.4477 0.447715 11 1 11H23C23.5523 11 24 11.4477 24 12C24 12.5523 23.5523 13 23 13H1C0.447716 13 0 12.5523 0 12Z"/><path d="M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5C20 6.10457 19.1046 7 18 7H6C4.89543 7 4 6.10457 4 5Z"/><path d="M4 19C4 17.8954 4.89543 17 6 17H18C19.1046 17 20 17.8954 20 19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19Z"/></svg>
      </button>
 
      <div class="lexxy-editor__toolbar-spacer" role="separator"></div>
 
      <button class="lexxy-editor__toolbar-button" type="button" name="undo" data-command="undo" title="Undo" data-hotkey="cmd+z ctrl+z">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5.64648 8.26531C7.93911 6.56386 10.7827 5.77629 13.624 6.05535C16.4655 6.33452 19.1018 7.66079 21.0195 9.77605C22.5839 11.5016 23.5799 13.6516 23.8936 15.9352C24.0115 16.7939 23.2974 17.4997 22.4307 17.4997C21.5641 17.4997 20.8766 16.7915 20.7148 15.9401C20.4295 14.4379 19.7348 13.0321 18.6943 11.8844C17.3 10.3464 15.3835 9.38139 13.3174 9.17839C11.2514 8.97546 9.18359 9.54856 7.5166 10.7858C6.38259 11.6275 5.48981 12.7361 4.90723 13.9997H8.5C9.3283 13.9997 9.99979 14.6714 10 15.4997C10 16.3281 9.32843 16.9997 8.5 16.9997H1.5C0.671573 16.9997 0 16.3281 0 15.4997V8.49968C0.000213656 7.67144 0.671705 6.99968 1.5 6.99968C2.3283 6.99968 2.99979 7.67144 3 8.49968V11.0212C3.7166 9.9704 4.60793 9.03613 5.64648 8.26531Z"/></svg>
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="redo" data-command="redo" title="Redo" data-hotkey="cmd+shift+z ctrl+shift+z ctrl+y">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.2599 8.26531C15.9672 6.56386 13.1237 5.77629 10.2823 6.05535C7.4408 6.33452 4.80455 7.66079 2.88681 9.77605C1.32245 11.5016 0.326407 13.6516 0.0127834 15.9352C-0.105117 16.7939 0.608975 17.4997 1.47567 17.4997C2.34228 17.4997 3.02969 16.7915 3.19149 15.9401C3.47682 14.4379 4.17156 13.0321 5.212 11.8844C6.60637 10.3464 8.52287 9.38139 10.589 9.17839C12.655 8.97546 14.7227 9.54856 16.3897 10.7858C17.5237 11.6275 18.4165 12.7361 18.9991 13.9997H15.4063C14.578 13.9997 13.9066 14.6714 13.9063 15.4997C13.9063 16.3281 14.5779 16.9997 15.4063 16.9997H22.4063C23.2348 16.9997 23.9063 16.3281 23.9063 15.4997V8.49968C23.9061 7.67144 23.2346 6.99968 22.4063 6.99968C21.578 6.99968 20.9066 7.67144 20.9063 8.49968V11.0212C20.1897 9.9704 19.2984 9.03613 18.2599 8.26531Z"/></svg>
      </button>

      <details class="lexxy-editor__toolbar-overflow">
        <summary class="lexxy-editor__toolbar-button" aria-label="Show more toolbar buttons">•••</summary>
        <div class="lexxy-editor__toolbar-overflow-menu" aria-label="More toolbar buttons"></div>
      </details>
    `
  }
}

customElements.define("lexxy-toolbar", LexicalToolbarElement);

/**
 * Original by Samuel Flores
 *
 * Adds the following new token classes:
 *     constant, builtin, variable, symbol, regex
 */
(function (Prism) {
	Prism.languages.ruby = Prism.languages.extend('clike', {
		'comment': {
			pattern: /#.*|^=begin\s[\s\S]*?^=end/m,
			greedy: true
		},
		'class-name': {
			pattern: /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+|\b[A-Z_]\w*(?=\s*\.\s*new\b)/,
			lookbehind: true,
			inside: {
				'punctuation': /[.\\]/
			}
		},
		'keyword': /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/,
		'operator': /\.{2,3}|&\.|===|<?=>|[!=]?~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>!^&|=])=?|[?:]/,
		'punctuation': /[(){}[\].,;]/,
	});

	Prism.languages.insertBefore('ruby', 'operator', {
		'double-colon': {
			pattern: /::/,
			alias: 'punctuation'
		},
	});

	var interpolation = {
		pattern: /((?:^|[^\\])(?:\\{2})*)#\{(?:[^{}]|\{[^{}]*\})*\}/,
		lookbehind: true,
		inside: {
			'content': {
				pattern: /^(#\{)[\s\S]+(?=\}$)/,
				lookbehind: true,
				inside: Prism.languages.ruby
			},
			'delimiter': {
				pattern: /^#\{|\}$/,
				alias: 'punctuation'
			}
		}
	};

	delete Prism.languages.ruby.function;

	var percentExpression = '(?:' + [
		/([^a-zA-Z0-9\s{(\[<=])(?:(?!\1)[^\\]|\\[\s\S])*\1/.source,
		/\((?:[^()\\]|\\[\s\S]|\((?:[^()\\]|\\[\s\S])*\))*\)/.source,
		/\{(?:[^{}\\]|\\[\s\S]|\{(?:[^{}\\]|\\[\s\S])*\})*\}/.source,
		/\[(?:[^\[\]\\]|\\[\s\S]|\[(?:[^\[\]\\]|\\[\s\S])*\])*\]/.source,
		/<(?:[^<>\\]|\\[\s\S]|<(?:[^<>\\]|\\[\s\S])*>)*>/.source
	].join('|') + ')';

	var symbolName = /(?:"(?:\\.|[^"\\\r\n])*"|(?:\b[a-zA-Z_]\w*|[^\s\0-\x7F]+)[?!]?|\$.)/.source;

	Prism.languages.insertBefore('ruby', 'keyword', {
		'regex-literal': [
			{
				pattern: RegExp(/%r/.source + percentExpression + /[egimnosux]{0,6}/.source),
				greedy: true,
				inside: {
					'interpolation': interpolation,
					'regex': /[\s\S]+/
				}
			},
			{
				pattern: /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[egimnosux]{0,6}(?=\s*(?:$|[\r\n,.;})#]))/,
				lookbehind: true,
				greedy: true,
				inside: {
					'interpolation': interpolation,
					'regex': /[\s\S]+/
				}
			}
		],
		'variable': /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
		'symbol': [
			{
				pattern: RegExp(/(^|[^:]):/.source + symbolName),
				lookbehind: true,
				greedy: true
			},
			{
				pattern: RegExp(/([\r\n{(,][ \t]*)/.source + symbolName + /(?=:(?!:))/.source),
				lookbehind: true,
				greedy: true
			},
		],
		'method-definition': {
			pattern: /(\bdef\s+)\w+(?:\s*\.\s*\w+)?/,
			lookbehind: true,
			inside: {
				'function': /\b\w+$/,
				'keyword': /^self\b/,
				'class-name': /^\w+/,
				'punctuation': /\./
			}
		}
	});

	Prism.languages.insertBefore('ruby', 'string', {
		'string-literal': [
			{
				pattern: RegExp(/%[qQiIwWs]?/.source + percentExpression),
				greedy: true,
				inside: {
					'interpolation': interpolation,
					'string': /[\s\S]+/
				}
			},
			{
				pattern: /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/,
				greedy: true,
				inside: {
					'interpolation': interpolation,
					'string': /[\s\S]+/
				}
			},
			{
				pattern: /<<[-~]?([a-z_]\w*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
				alias: 'heredoc-string',
				greedy: true,
				inside: {
					'delimiter': {
						pattern: /^<<[-~]?[a-z_]\w*|\b[a-z_]\w*$/i,
						inside: {
							'symbol': /\b\w+/,
							'punctuation': /^<<[-~]?/
						}
					},
					'interpolation': interpolation,
					'string': /[\s\S]+/
				}
			},
			{
				pattern: /<<[-~]?'([a-z_]\w*)'[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
				alias: 'heredoc-string',
				greedy: true,
				inside: {
					'delimiter': {
						pattern: /^<<[-~]?'[a-z_]\w*'|\b[a-z_]\w*$/i,
						inside: {
							'symbol': /\b\w+/,
							'punctuation': /^<<[-~]?'|'$/,
						}
					},
					'string': /[\s\S]+/
				}
			}
		],
		'command-literal': [
			{
				pattern: RegExp(/%x/.source + percentExpression),
				greedy: true,
				inside: {
					'interpolation': interpolation,
					'command': {
						pattern: /[\s\S]+/,
						alias: 'string'
					}
				}
			},
			{
				pattern: /`(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|[^\\`#\r\n])*`/,
				greedy: true,
				inside: {
					'interpolation': interpolation,
					'command': {
						pattern: /[\s\S]+/,
						alias: 'string'
					}
				}
			}
		]
	});

	delete Prism.languages.ruby.string;

	Prism.languages.insertBefore('ruby', 'number', {
		'builtin': /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Fixnum|Float|Hash|IO|Integer|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|Stat|String|Struct|Symbol|TMS|Thread|ThreadGroup|Time|TrueClass)\b/,
		'constant': /\b[A-Z][A-Z0-9_]*(?:[?!]|\b)/
	});

	Prism.languages.rb = Prism.languages.ruby;
}(Prism));

/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 * Rewritten by Tom Pavelec
 *
 * Supports PHP 5.3 - 8.0
 */
(function (Prism) {
	var comment = /\/\*[\s\S]*?\*\/|\/\/.*|#(?!\[).*/;
	var constant = [
		{
			pattern: /\b(?:false|true)\b/i,
			alias: 'boolean'
		},
		{
			pattern: /(::\s*)\b[a-z_]\w*\b(?!\s*\()/i,
			greedy: true,
			lookbehind: true,
		},
		{
			pattern: /(\b(?:case|const)\s+)\b[a-z_]\w*(?=\s*[;=])/i,
			greedy: true,
			lookbehind: true,
		},
		/\b(?:null)\b/i,
		/\b[A-Z_][A-Z0-9_]*\b(?!\s*\()/,
	];
	var number = /\b0b[01]+(?:_[01]+)*\b|\b0o[0-7]+(?:_[0-7]+)*\b|\b0x[\da-f]+(?:_[\da-f]+)*\b|(?:\b\d+(?:_\d+)*\.?(?:\d+(?:_\d+)*)?|\B\.\d+)(?:e[+-]?\d+)?/i;
	var operator = /<?=>|\?\?=?|\.{3}|\??->|[!=]=?=?|::|\*\*=?|--|\+\+|&&|\|\||<<|>>|[?~]|[/^|%*&<>.+-]=?/;
	var punctuation = /[{}\[\](),:;]/;

	Prism.languages.php = {
		'delimiter': {
			pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
			alias: 'important'
		},
		'comment': comment,
		'variable': /\$+(?:\w+\b|(?=\{))/,
		'package': {
			pattern: /(namespace\s+|use\s+(?:function\s+)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
			lookbehind: true,
			inside: {
				'punctuation': /\\/
			}
		},
		'class-name-definition': {
			pattern: /(\b(?:class|enum|interface|trait)\s+)\b[a-z_]\w*(?!\\)\b/i,
			lookbehind: true,
			alias: 'class-name'
		},
		'function-definition': {
			pattern: /(\bfunction\s+)[a-z_]\w*(?=\s*\()/i,
			lookbehind: true,
			alias: 'function'
		},
		'keyword': [
			{
				pattern: /(\(\s*)\b(?:array|bool|boolean|float|int|integer|object|string)\b(?=\s*\))/i,
				alias: 'type-casting',
				greedy: true,
				lookbehind: true
			},
			{
				pattern: /([(,?]\s*)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|object|self|static|string)\b(?=\s*\$)/i,
				alias: 'type-hint',
				greedy: true,
				lookbehind: true
			},
			{
				pattern: /(\)\s*:\s*(?:\?\s*)?)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|never|object|self|static|string|void)\b/i,
				alias: 'return-type',
				greedy: true,
				lookbehind: true
			},
			{
				pattern: /\b(?:array(?!\s*\()|bool|float|int|iterable|mixed|object|string|void)\b/i,
				alias: 'type-declaration',
				greedy: true
			},
			{
				pattern: /(\|\s*)(?:false|null)\b|\b(?:false|null)(?=\s*\|)/i,
				alias: 'type-declaration',
				greedy: true,
				lookbehind: true
			},
			{
				pattern: /\b(?:parent|self|static)(?=\s*::)/i,
				alias: 'static-context',
				greedy: true
			},
			{
				// yield from
				pattern: /(\byield\s+)from\b/i,
				lookbehind: true
			},
			// `class` is always a keyword unlike other keywords
			/\bclass\b/i,
			{
				// https://www.php.net/manual/en/reserved.keywords.php
				//
				// keywords cannot be preceded by "->"
				// the complex lookbehind means `(?<!(?:->|::)\s*)`
				pattern: /((?:^|[^\s>:]|(?:^|[^-])>|(?:^|[^:]):)\s*)\b(?:abstract|and|array|as|break|callable|case|catch|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|never|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield|__halt_compiler)\b/i,
				lookbehind: true
			}
		],
		'argument-name': {
			pattern: /([(,]\s*)\b[a-z_]\w*(?=\s*:(?!:))/i,
			lookbehind: true
		},
		'class-name': [
			{
				pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self|\s+static))\s+|\bcatch\s*\()\b[a-z_]\w*(?!\\)\b/i,
				greedy: true,
				lookbehind: true
			},
			{
				pattern: /(\|\s*)\b[a-z_]\w*(?!\\)\b/i,
				greedy: true,
				lookbehind: true
			},
			{
				pattern: /\b[a-z_]\w*(?!\\)\b(?=\s*\|)/i,
				greedy: true
			},
			{
				pattern: /(\|\s*)(?:\\?\b[a-z_]\w*)+\b/i,
				alias: 'class-name-fully-qualified',
				greedy: true,
				lookbehind: true,
				inside: {
					'punctuation': /\\/
				}
			},
			{
				pattern: /(?:\\?\b[a-z_]\w*)+\b(?=\s*\|)/i,
				alias: 'class-name-fully-qualified',
				greedy: true,
				inside: {
					'punctuation': /\\/
				}
			},
			{
				pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self\b|\s+static\b))\s+|\bcatch\s*\()(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
				alias: 'class-name-fully-qualified',
				greedy: true,
				lookbehind: true,
				inside: {
					'punctuation': /\\/
				}
			},
			{
				pattern: /\b[a-z_]\w*(?=\s*\$)/i,
				alias: 'type-declaration',
				greedy: true
			},
			{
				pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
				alias: ['class-name-fully-qualified', 'type-declaration'],
				greedy: true,
				inside: {
					'punctuation': /\\/
				}
			},
			{
				pattern: /\b[a-z_]\w*(?=\s*::)/i,
				alias: 'static-context',
				greedy: true
			},
			{
				pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*::)/i,
				alias: ['class-name-fully-qualified', 'static-context'],
				greedy: true,
				inside: {
					'punctuation': /\\/
				}
			},
			{
				pattern: /([(,?]\s*)[a-z_]\w*(?=\s*\$)/i,
				alias: 'type-hint',
				greedy: true,
				lookbehind: true
			},
			{
				pattern: /([(,?]\s*)(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
				alias: ['class-name-fully-qualified', 'type-hint'],
				greedy: true,
				lookbehind: true,
				inside: {
					'punctuation': /\\/
				}
			},
			{
				pattern: /(\)\s*:\s*(?:\?\s*)?)\b[a-z_]\w*(?!\\)\b/i,
				alias: 'return-type',
				greedy: true,
				lookbehind: true
			},
			{
				pattern: /(\)\s*:\s*(?:\?\s*)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
				alias: ['class-name-fully-qualified', 'return-type'],
				greedy: true,
				lookbehind: true,
				inside: {
					'punctuation': /\\/
				}
			}
		],
		'constant': constant,
		'function': {
			pattern: /(^|[^\\\w])\\?[a-z_](?:[\w\\]*\w)?(?=\s*\()/i,
			lookbehind: true,
			inside: {
				'punctuation': /\\/
			}
		},
		'property': {
			pattern: /(->\s*)\w+/,
			lookbehind: true
		},
		'number': number,
		'operator': operator,
		'punctuation': punctuation
	};

	var string_interpolation = {
		pattern: /\{\$(?:\{(?:\{[^{}]+\}|[^{}]+)\}|[^{}])+\}|(^|[^\\{])\$+(?:\w+(?:\[[^\r\n\[\]]+\]|->\w+)?)/,
		lookbehind: true,
		inside: Prism.languages.php
	};

	var string = [
		{
			pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/,
			alias: 'nowdoc-string',
			greedy: true,
			inside: {
				'delimiter': {
					pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
					alias: 'symbol',
					inside: {
						'punctuation': /^<<<'?|[';]$/
					}
				}
			}
		},
		{
			pattern: /<<<(?:"([^"]+)"[\r\n](?:.*[\r\n])*?\1;|([a-z_]\w*)[\r\n](?:.*[\r\n])*?\2;)/i,
			alias: 'heredoc-string',
			greedy: true,
			inside: {
				'delimiter': {
					pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
					alias: 'symbol',
					inside: {
						'punctuation': /^<<<"?|[";]$/
					}
				},
				'interpolation': string_interpolation
			}
		},
		{
			pattern: /`(?:\\[\s\S]|[^\\`])*`/,
			alias: 'backtick-quoted-string',
			greedy: true
		},
		{
			pattern: /'(?:\\[\s\S]|[^\\'])*'/,
			alias: 'single-quoted-string',
			greedy: true
		},
		{
			pattern: /"(?:\\[\s\S]|[^\\"])*"/,
			alias: 'double-quoted-string',
			greedy: true,
			inside: {
				'interpolation': string_interpolation
			}
		}
	];

	Prism.languages.insertBefore('php', 'variable', {
		'string': string,
		'attribute': {
			pattern: /#\[(?:[^"'\/#]|\/(?![*/])|\/\/.*$|#(?!\[).*$|\/\*(?:[^*]|\*(?!\/))*\*\/|"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*')+\](?=\s*[a-z$#])/im,
			greedy: true,
			inside: {
				'attribute-content': {
					pattern: /^(#\[)[\s\S]+(?=\]$)/,
					lookbehind: true,
					// inside can appear subset of php
					inside: {
						'comment': comment,
						'string': string,
						'attribute-class-name': [
							{
								pattern: /([^:]|^)\b[a-z_]\w*(?!\\)\b/i,
								alias: 'class-name',
								greedy: true,
								lookbehind: true
							},
							{
								pattern: /([^:]|^)(?:\\?\b[a-z_]\w*)+/i,
								alias: [
									'class-name',
									'class-name-fully-qualified'
								],
								greedy: true,
								lookbehind: true,
								inside: {
									'punctuation': /\\/
								}
							}
						],
						'constant': constant,
						'number': number,
						'operator': operator,
						'punctuation': punctuation
					}
				},
				'delimiter': {
					pattern: /^#\[|\]$/,
					alias: 'punctuation'
				}
			}
		},
	});

	Prism.hooks.add('before-tokenize', function (env) {
		if (!/<\?/.test(env.code)) {
			return;
		}

		var phpPattern = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#(?!\[))(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|#\[|\/\*(?:[^*]|\*(?!\/))*(?:\*\/|$))*?(?:\?>|$)/g;
		Prism.languages['markup-templating'].buildPlaceholders(env, 'php', phpPattern);
	});

	Prism.hooks.add('after-tokenize', function (env) {
		Prism.languages['markup-templating'].tokenizePlaceholders(env, 'php');
	});

}(Prism));

Prism.languages.go = Prism.languages.extend('clike', {
	'string': {
		pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"|`[^`]*`/,
		lookbehind: true,
		greedy: true
	},
	'keyword': /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
	'boolean': /\b(?:_|false|iota|nil|true)\b/,
	'number': [
		// binary and octal integers
		/\b0(?:b[01_]+|o[0-7_]+)i?\b/i,
		// hexadecimal integers and floats
		/\b0x(?:[a-f\d_]+(?:\.[a-f\d_]*)?|\.[a-f\d_]+)(?:p[+-]?\d+(?:_\d+)*)?i?(?!\w)/i,
		// decimal integers and floats
		/(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?[\d_]+)?i?(?!\w)/i
	],
	'operator': /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
	'builtin': /\b(?:append|bool|byte|cap|close|complex|complex(?:64|128)|copy|delete|error|float(?:32|64)|u?int(?:8|16|32|64)?|imag|len|make|new|panic|print(?:ln)?|real|recover|rune|string|uintptr)\b/
});

Prism.languages.insertBefore('go', 'string', {
	'char': {
		pattern: /'(?:\\.|[^'\\\r\n]){0,10}'/,
		greedy: true
	}
});

delete Prism.languages.go['class-name'];

(function (Prism) {
	// $ set | grep '^[A-Z][^[:space:]]*=' | cut -d= -f1 | tr '\n' '|'
	// + LC_ALL, RANDOM, REPLY, SECONDS.
	// + make sure PS1..4 are here as they are not always set,
	// - some useless things.
	var envVars = '\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b';

	var commandAfterHeredoc = {
		pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
		lookbehind: true,
		alias: 'punctuation', // this looks reasonably well in all themes
		inside: null // see below
	};

	var insideString = {
		'bash': commandAfterHeredoc,
		'environment': {
			pattern: RegExp('\\$' + envVars),
			alias: 'constant'
		},
		'variable': [
			// [0]: Arithmetic Environment
			{
				pattern: /\$?\(\([\s\S]+?\)\)/,
				greedy: true,
				inside: {
					// If there is a $ sign at the beginning highlight $(( and )) as variable
					'variable': [
						{
							pattern: /(^\$\(\([\s\S]+)\)\)/,
							lookbehind: true
						},
						/^\$\(\(/
					],
					'number': /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
					// Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
					'operator': /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
					// If there is no $ sign at the beginning highlight (( and )) as punctuation
					'punctuation': /\(\(?|\)\)?|,|;/
				}
			},
			// [1]: Command Substitution
			{
				pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
				greedy: true,
				inside: {
					'variable': /^\$\(|^`|\)$|`$/
				}
			},
			// [2]: Brace expansion
			{
				pattern: /\$\{[^}]+\}/,
				greedy: true,
				inside: {
					'operator': /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
					'punctuation': /[\[\]]/,
					'environment': {
						pattern: RegExp('(\\{)' + envVars),
						lookbehind: true,
						alias: 'constant'
					}
				}
			},
			/\$(?:\w+|[#?*!@$])/
		],
		// Escape sequences from echo and printf's manuals, and escaped quotes.
		'entity': /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/
	};

	Prism.languages.bash = {
		'shebang': {
			pattern: /^#!\s*\/.*/,
			alias: 'important'
		},
		'comment': {
			pattern: /(^|[^"{\\$])#.*/,
			lookbehind: true
		},
		'function-name': [
			// a) function foo {
			// b) foo() {
			// c) function foo() {
			// but not “foo {”
			{
				// a) and c)
				pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,
				lookbehind: true,
				alias: 'function'
			},
			{
				// b)
				pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/,
				alias: 'function'
			}
		],
		// Highlight variable names as variables in for and select beginnings.
		'for-or-select': {
			pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
			alias: 'variable',
			lookbehind: true
		},
		// Highlight variable names as variables in the left-hand part
		// of assignments (“=” and “+=”).
		'assign-left': {
			pattern: /(^|[\s;|&]|[<>]\()\w+(?:\.\w+)*(?=\+?=)/,
			inside: {
				'environment': {
					pattern: RegExp('(^|[\\s;|&]|[<>]\\()' + envVars),
					lookbehind: true,
					alias: 'constant'
				}
			},
			alias: 'variable',
			lookbehind: true
		},
		// Highlight parameter names as variables
		'parameter': {
			pattern: /(^|\s)-{1,2}(?:\w+:[+-]?)?\w+(?:\.\w+)*(?=[=\s]|$)/,
			alias: 'variable',
			lookbehind: true
		},
		'string': [
			// Support for Here-documents https://en.wikipedia.org/wiki/Here_document
			{
				pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
				lookbehind: true,
				greedy: true,
				inside: insideString
			},
			// Here-document with quotes around the tag
			// → No expansion (so no “inside”).
			{
				pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
				lookbehind: true,
				greedy: true,
				inside: {
					'bash': commandAfterHeredoc
				}
			},
			// “Normal” string
			{
				// https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html
				pattern: /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
				lookbehind: true,
				greedy: true,
				inside: insideString
			},
			{
				// https://www.gnu.org/software/bash/manual/html_node/Single-Quotes.html
				pattern: /(^|[^$\\])'[^']*'/,
				lookbehind: true,
				greedy: true
			},
			{
				// https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
				pattern: /\$'(?:[^'\\]|\\[\s\S])*'/,
				greedy: true,
				inside: {
					'entity': insideString.entity
				}
			}
		],
		'environment': {
			pattern: RegExp('\\$?' + envVars),
			alias: 'constant'
		},
		'variable': insideString.variable,
		'function': {
			pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cargo|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|java|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|sysctl|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		'keyword': {
			pattern: /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		// https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
		'builtin': {
			pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
			lookbehind: true,
			// Alias added to make those easier to distinguish from strings.
			alias: 'class-name'
		},
		'boolean': {
			pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		'file-descriptor': {
			pattern: /\B&\d\b/,
			alias: 'important'
		},
		'operator': {
			// Lots of redirections here, but not just that.
			pattern: /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
			inside: {
				'file-descriptor': {
					pattern: /^\d/,
					alias: 'important'
				}
			}
		},
		'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
		'number': {
			pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
			lookbehind: true
		}
	};

	commandAfterHeredoc.inside = Prism.languages.bash;

	/* Patterns in command substitution. */
	var toBeCopied = [
		'comment',
		'function-name',
		'for-or-select',
		'assign-left',
		'parameter',
		'string',
		'environment',
		'function',
		'keyword',
		'builtin',
		'boolean',
		'file-descriptor',
		'operator',
		'punctuation',
		'number'
	];
	var inside = insideString.variable[1].inside;
	for (var i = 0; i < toBeCopied.length; i++) {
		inside[toBeCopied[i]] = Prism.languages.bash[toBeCopied[i]];
	}

	Prism.languages.sh = Prism.languages.bash;
	Prism.languages.shell = Prism.languages.bash;
}(Prism));

// https://www.json.org/json-en.html
Prism.languages.json = {
	'property': {
		pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
		lookbehind: true,
		greedy: true
	},
	'string': {
		pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
		lookbehind: true,
		greedy: true
	},
	'comment': {
		pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
		greedy: true
	},
	'number': /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
	'punctuation': /[{}[\],]/,
	'operator': /:/,
	'boolean': /\b(?:false|true)\b/,
	'null': {
		pattern: /\bnull\b/,
		alias: 'keyword'
	}
};

Prism.languages.webmanifest = Prism.languages.json;

(function (Prism) {

	Prism.languages.diff = {
		'coord': [
			// Match all kinds of coord lines (prefixed by "+++", "---" or "***").
			/^(?:\*{3}|-{3}|\+{3}).*$/m,
			// Match "@@ ... @@" coord lines in unified diff.
			/^@@.*@@$/m,
			// Match coord lines in normal diff (starts with a number).
			/^\d.*$/m
		]

		// deleted, inserted, unchanged, diff
	};

	/**
	 * A map from the name of a block to its line prefix.
	 *
	 * @type {Object<string, string>}
	 */
	var PREFIXES = {
		'deleted-sign': '-',
		'deleted-arrow': '<',
		'inserted-sign': '+',
		'inserted-arrow': '>',
		'unchanged': ' ',
		'diff': '!',
	};

	// add a token for each prefix
	Object.keys(PREFIXES).forEach(function (name) {
		var prefix = PREFIXES[name];

		var alias = [];
		if (!/^\w+$/.test(name)) { // "deleted-sign" -> "deleted"
			alias.push(/\w+/.exec(name)[0]);
		}
		if (name === 'diff') {
			alias.push('bold');
		}

		Prism.languages.diff[name] = {
			pattern: RegExp('^(?:[' + prefix + '].*(?:\r\n?|\n|(?![\\s\\S])))+', 'm'),
			alias: alias,
			inside: {
				'line': {
					pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/,
					lookbehind: true
				},
				'prefix': {
					pattern: /[\s\S]/,
					alias: /\w+/.exec(name)[0]
				}
			}
		};

	});

	// make prefixes available to Diff plugin
	Object.defineProperty(Prism.languages.diff, 'PREFIXES', {
		value: PREFIXES
	});

}(Prism));

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function z$1(t,e){const n={};for(const o of t){const t=e(o);t&&(n[t]?n[t].push(o):n[t]=[o]);}return n}function U$1(t){const e=z$1(t,t=>t.type);return {element:e.element||[],multilineElement:e["multiline-element"]||[],textFormat:e["text-format"]||[],textMatch:e["text-match"]||[]}}const W$1=/[!-/:-@[-`{-~\s]/;function V$1(t){return lr(t)&&!t.hasFormat("code")}function et(t,...e){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",t);for(const t of e)o.append("v",t);throw n.search=o.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}const nt=/^(\s*)(\d{1,})\.\s/,ot=/^(\s*)[-*+]\s/,it=/^(#{1,6})\s/,st=/^>\s/,lt=/^[ \t]*```([\w-]+)?/,ct=/[ \t]*```$/,mt=ot$4("mdListMarker",{parse:t=>"string"==typeof t&&/^[-*+]$/.test(t)?t:"-"}),ht=t=>(e,n,o,r)=>{const i=t(o);i.append(...n),e.replace(i),r||i.select(0,0);};const xt=t=>(e,n,o,r)=>{const i=e.getPreviousSibling(),s=e.getNextSibling(),l=st$2("check"===t?"x"===o[3]:void 0),c=o[0].trim()[0],f="bullet"!==t&&"check"!==t||c!==mt.parse(c)?void 0:c;if(dt$1(s)&&s.getListType()===t){f&&ct$4(s,mt,f);const t=s.getFirstChild();null!==t?t.insertBefore(l):s.append(l),e.remove();}else if(dt$1(i)&&i.getListType()===t)f&&ct$4(i,mt,f),i.append(l),e.remove();else {const n=ht$3(t,"number"===t?Number(o[2]):void 0);f&&ct$4(n,mt,f),n.append(l),e.replace(n);}l.append(...n),r||l.select(0,0);const a=function(t){const e=t.match(/\t/g),n=t.match(/ /g);let o=0;return e&&(o+=e.length),n&&(o+=Math.floor(n.length/4)),o}(o[1]);a&&l.setIndent(a);},Tt=(t,e,n)=>{const o=[],r=t.getChildren();let i=0;for(const s of r)if(ot$2(s)){if(1===s.getChildrenSize()){const t=s.getFirstChild();if(dt$1(t)){o.push(Tt(t,e,n+1));continue}}const r=" ".repeat(4*n),l=t.getListType(),c=st$4(t,mt),f="number"===l?`${t.getStart()+i}. `:"check"===l?`${c} [${s.getChecked()?"x":" "}] `:c+" ";o.push(r+f+e(s)),i++;}return o.join("\n")},Et={dependencies:[Pt$2],export:(t,e)=>{if(!It$1(t))return null;const n=Number(t.getTag().slice(1));return "#".repeat(n)+" "+e(t)},regExp:it,replace:ht(t=>{const e="h"+t[1].length;return St$2(e)}),type:"element"},Ct={dependencies:[Et$2],export:(t,e)=>{if(!Ot$1(t))return null;const n=e(t).split("\n"),o=[];for(const t of n)o.push("> "+t);return o.join("\n")},regExp:st,replace:(t,e,n,o)=>{if(o){const n=t.getPreviousSibling();if(Ot$1(n))return n.splice(n.getChildrenSize(),0,[Jn(),...e]),void t.remove()}const r=_t$1();r.append(...e),t.replace(r),o||r.select(0,0);},type:"element"},yt={dependencies:[q$1],export:t=>{if(!X$1(t))return null;const e=t.getTextContent();return "```"+(t.getLanguage()||"")+(e?"\n"+e:"")+"\n```"},regExpEnd:{optional:true,regExp:ct},regExpStart:lt,replace:(t,e,n,o,r,i)=>{let s,c;if(!e&&r){if(1===r.length)o?(s=U$2(),c=n[1]+r[0]):(s=U$2(n[1]),c=r[0].startsWith(" ")?r[0].slice(1):r[0]);else {if(s=U$2(n[1]),0===r[0].trim().length)for(;r.length>0&&!r[0].length;)r.shift();else r[0]=r[0].startsWith(" ")?r[0].slice(1):r[0];for(;r.length>0&&!r[r.length-1].length;)r.pop();c=r.join("\n");}const e=sr(c);s.append(e),t.append(s);}else e&&ht(t=>U$2(t?t[1]:void 0))(t,e,n,i);},type:"multiline-element"},$t={dependencies:[lt$2,nt$2],export:(t,e)=>dt$1(t)?Tt(t,e,0):null,regExp:ot,replace:xt("bullet"),type:"element"},St={dependencies:[lt$2,nt$2],export:(t,e)=>dt$1(t)?Tt(t,e,0):null,regExp:nt,replace:xt("number"),type:"element"},bt={format:["code"],tag:"`",type:"text-format"},Ft={format:["highlight"],tag:"==",type:"text-format"},It={format:["bold","italic"],tag:"***",type:"text-format"},wt={format:["bold","italic"],intraword:false,tag:"___",type:"text-format"},Nt={format:["bold"],tag:"**",type:"text-format"},kt={format:["bold"],intraword:false,tag:"__",type:"text-format"},Rt={format:["strikethrough"],tag:"~~",type:"text-format"},Lt={format:["italic"],tag:"*",type:"text-format"},_t={format:["italic"],intraword:false,tag:"_",type:"text-format"},Pt={dependencies:[y$1],export:(t,e,n)=>{if(!w$2(t)||E$2(t))return null;const o=t.getTitle(),r=e(t);return o?`[${r}](${t.getURL()} "${o}")`:`[${r}](${t.getURL()})`},importRegExp:/(?:\[(.+?)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))/,regExp:/(?:\[(.+?)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))$/,replace:(t,e)=>{const[,n,o,r]=e,i=D$1(o,{title:r}),s=n.split("[").length-1,c=n.split("]").length-1;let f=n,a="";if(s<c)return;if(s>c){const t=n.split("[");a="["+t[0],f=t.slice(1).join("[");}const u=sr(f);return u.setFormat(t.getFormat()),i.append(u),t.replace(i),a&&i.insertBefore(sr(a)),u},trigger:")",type:"text-match"},Bt=[Et,Ct,$t,St],Mt=[yt],jt=[bt,It,wt,Nt,kt,Ft,Lt,_t,Rt],At=[Pt],zt=[...Bt,...Mt,...jt,...At];function Ut(t,e,n){const o=n.length;for(let r=e;r>=o;r--){const e=r-o;if(Wt(t,e,n,0,o)&&" "!==t[e+o])return e}return  -1}function Wt(t,e,n,o,r){for(let i=0;i<r;i++)if(t[e+i]!==n[o+i])return  false;return  true}function Dt(t,n=zt){const o=U$1(n),r=z$1(o.textFormat,({tag:t})=>t[t.length-1]),l=z$1(o.textMatch,({trigger:t})=>t);for(const e of n){const n=e.type;if("element"===n||"text-match"===n||"multiline-element"===n){const n=e.dependencies;for(const e of n)t.hasNode(e)||et(173,e.getType());}}const c=(t,n,c)=>{(function(t,e,n,o){const r=t.getParent();if(!as(r)||t.getFirstChild()!==e)return  false;const i=e.getTextContent();if(" "!==i[n-1])return  false;for(const{regExp:r,replace:s}of o){const o=i.match(r);if(o&&o[0].length===(o[0].endsWith(" ")?n:n-1)){const r=e.getNextSiblings(),[i,l]=e.splitText(n);if(false!==s(t,l?[l,...r]:r,o,false))return i.remove(),true}}return  false})(t,n,c,o.element)||function(t,e,n,o){const r=t.getParent();if(!as(r)||t.getFirstChild()!==e)return  false;const i=e.getTextContent();if(" "!==i[n-1])return  false;for(const{regExpStart:r,replace:s,regExpEnd:l}of o){if(l&&!("optional"in l)||l&&"optional"in l&&!l.optional)continue;const o=i.match(r);if(o&&o[0].length===(o[0].endsWith(" ")?n:n-1)){const r=e.getNextSiblings(),[i,l]=e.splitText(n);if(false!==s(t,l?[l,...r]:r,o,null,null,false))return i.remove(),true}}return  false}(t,n,c,o.multilineElement)||function(t,e,n){let o=t.getTextContent();const r=n[o[e-1]];if(null==r)return  false;e<o.length&&(o=o.slice(0,e));for(const e of r){if(!e.replace||!e.regExp)continue;const n=o.match(e.regExp);if(null===n)continue;const r=n.index||0,i=r+n[0].length;let s;return 0===r?[s]=t.splitText(i):[,s]=t.splitText(r,i),s.selectNext(0,0),e.replace(s,n),true}return  false}(n,c,l)||function(t,n,o){const r=t.getTextContent(),l=n-1,c=r[l],f=o[c];if(!f)return  false;for(const n of f){const{tag:o}=n,f=o.length,a=l-f+1;if(f>1&&!Wt(r,a,o,0,f))continue;if(" "===r[a-1])continue;const u=r[l+1];if(false===n.intraword&&u&&!W$1.test(u))continue;const g=t;let p=g,d=Ut(r,a,o),h=p;for(;d<0&&(h=h.getPreviousSibling())&&!jn(h);)if(lr(h)){if(h.hasFormat("code"))continue;const t=h.getTextContent();p=h,d=Ut(t,t.length,o);}if(d<0)continue;if(p===g&&d+f===a)continue;const E=p.getTextContent();if(d>0&&E[d-1]===c)continue;const C=E[d-1];if(false===n.intraword&&C&&!W$1.test(C))continue;const y=g.getTextContent(),$=y.slice(0,a)+y.slice(l+1);g.setTextContent($);const v=p===g?$:E;p.setTextContent(v.slice(0,d)+v.slice(d+f));const S=Lr(),b=Ar();wo(b);const F=l-f*(p===g?2:1)+1;b.anchor.set(p.__key,d,"text"),b.focus.set(g.__key,F,"text");for(const t of n.format)b.hasFormat(t)||b.formatText(t);b.anchor.set(b.focus.key,b.focus.offset,b.focus.type);for(const t of n.format)b.hasFormat(t)&&b.toggleFormat(t);return yr(S)&&(b.format=S.format),true}}(n,c,r);};return t.registerUpdateListener(({tags:n,dirtyLeaves:o,editorState:r,prevEditorState:i})=>{if(n.has(Ln)||n.has(An))return;if(t.isComposing())return;const l=r.read(Lr),f=i.read(Lr);if(!yr(f)||!yr(l)||!l.isCollapsed()||l.is(f))return;const a=l.anchor.key,u=l.anchor.offset,g=r._nodeMap.get(a);!lr(g)||!o.has(a)||1!==u&&u>f.anchor.offset+1||t.update(()=>{if(!V$1(g))return;const t=g.getParent();null===t||X$1(t)||c(t,g,l.anchor.offset);});})}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function x$1(t,e,n,r,o){if(null===t||0===n.size&&0===r.size&&!o)return 0;const i=e._selection,a=t._selection;if(o)return 1;if(!(yr(i)&&yr(a)&&a.isCollapsed()&&i.isCollapsed()))return 0;const s=function(t,e,n){const r=t._nodeMap,o=[];for(const t of e){const e=r.get(t);void 0!==e&&o.push(e);}for(const[t,e]of n){if(!e)continue;const n=r.get(t);void 0===n||bi(n)||o.push(n);}return o}(e,n,r);if(0===s.length)return 0;if(s.length>1){const n=e._nodeMap,r=n.get(i.anchor.key),o=n.get(a.anchor.key);return r&&o&&!t._nodeMap.has(r.__key)&&lr(r)&&1===r.__text.length&&1===i.anchor.offset?2:0}const c=s[0],d=t._nodeMap.get(c.__key);if(!lr(d)||!lr(c)||d.__mode!==c.__mode)return 0;const u=d.__text,l=c.__text;if(u===l)return 0;const f=i.anchor,p=a.anchor;if(f.key!==p.key||"text"!==f.type)return 0;const h=f.offset,m=p.offset,y=l.length-u.length;return 1===y&&m===h-1?2:-1===y&&m===h+1?3:-1===y&&m===h?4:0}function C$1(t,e){let n=Date.now(),r=0;return (o,i,a,s,c,d)=>{const u=Date.now();if(d.has(An))return r=0,n=u,2;const l=x$1(o,i,s,c,t.isComposing()),f=(()=>{const f=null===a||a.editor===t,p=d.has(Pn);if(!p&&f&&d.has(Dn))return 0;if(null===o)return 1;const h=i._selection;if(!(s.size>0||c.size>0))return null!==h?0:2;const m="number"==typeof e?e:e.peek();if(false===p&&0!==l&&l===r&&u<n+m&&f)return 0;if(1===s.size){if(function(t,e,n){const r=e._nodeMap.get(t),o=n._nodeMap.get(t),i=e._selection,a=n._selection;return !(yr(i)&&yr(a)&&"element"===i.anchor.type&&"element"===i.focus.type&&"text"===a.anchor.type&&"text"===a.focus.type||!lr(r)||!lr(o)||r.__parent!==o.__parent)&&JSON.stringify(e.read(()=>r.exportJSON()))===JSON.stringify(n.read(()=>o.exportJSON()))}(Array.from(s)[0],o,i))return 0}return 1})();return n=u,r=l,f}}function v$1(t){t.undoStack=[],t.redoStack=[],t.current=null;}function b$1(t,e,n){const r=C$1(t,n),i=U$4(t.registerCommand(pe$1,()=>(function(t,e){const n=e.redoStack,r=e.undoStack;if(0!==r.length){const o=e.current,i=r.pop();null!==o&&(n.push(o),t.dispatchCommand($e$1,true)),0===r.length&&t.dispatchCommand(Ue$1,false),e.current=i||null,i&&i.editor.setEditorState(i.editorState,{tag:An});}}(t,e),true),Ki),t.registerCommand(ye$1,()=>(function(t,e){const n=e.redoStack,r=e.undoStack;if(0!==n.length){const o=e.current;null!==o&&(r.push(o),t.dispatchCommand(Ue$1,true));const i=n.pop();0===n.length&&t.dispatchCommand($e$1,false),e.current=i||null,i&&i.editor.setEditorState(i.editorState,{tag:An});}}(t,e),true),Ki),t.registerCommand(Je$1,()=>(v$1(e),false),Ki),t.registerCommand(je$1,()=>(v$1(e),t.dispatchCommand($e$1,false),t.dispatchCommand(Ue$1,false),true),Ki),t.registerUpdateListener(({editorState:n,prevEditorState:o,dirtyLeaves:i,dirtyElements:a,tags:s})=>{const c=e.current,d=e.redoStack,u=e.undoStack,l=null===c?null:c.editorState;if(null!==c&&n===l)return;const f=r(o,n,c,i,a,s);if(1===f)0!==d.length&&(e.redoStack=[],t.dispatchCommand($e$1,false)),null!==c&&(u.push({...c}),t.dispatchCommand(Ue$1,true));else if(2===f)return;e.current={editor:t,editorState:n};}));return i}function w$1(){return {current:null,redoStack:[],undoStack:[]}}const E$1=Kl({build:(e,{delay:n,createInitialHistoryState:r,disabled:o})=>at$1({delay:n,disabled:o,historyState:r(e)}),config:Bl({createInitialHistoryState:w$1,delay:300,disabled:"undefined"==typeof window}),name:"@lexical/history/History",register:(t,n,r)=>{const o=r.getOutput();return dt$2(()=>o.disabled.value?void 0:b$1(t,o.historyState.value,o.delay))}});Kl({dependencies:[zl(E$1,{createInitialHistoryState:()=>{throw new Error("SharedHistory did not inherit parent history")},disabled:true})],name:"@lexical/history/SharedHistory",register(t,o,i){const{output:a}=i.getDependency(E$1),s=function(t){return t?Gt(t,E$1.name):null}(t._parentEditor);if(!s)return ()=>{};const c=s.output;return dt$2(()=>F$2(()=>{a.delay.value=c.delay.value,a.historyState.value=c.historyState.value,a.disabled.value=c.disabled.value;}))}});

var theme = {
  text: {
    bold: "lexxy-content__bold",
    italic: "lexxy-content__italic",
    strikethrough: "lexxy-content__strikethrough",
    underline: "lexxy-content__underline",
    highlight: "lexxy-content__highlight"
  },
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

function createElement(name, properties) {
  const element = document.createElement(name);
  for (const [ key, value ] of Object.entries(properties || {})) {
    if (key in element) {
      element[key] = value;
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, value);
    }
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

function dispatchCustomEvent(element, name, detail) {
  const event = new CustomEvent(name, {
    detail: detail,
    bubbles: true,
  });
  element.dispatchEvent(event);
}

function sanitize(html) {
  return purify.sanitize(html)
}

function dispatch(element, eventName, detail = null, cancelable = false) {
  return element.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail, cancelable }))
}

function generateDomId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}`
}

function bytesToHumanSize(bytes) {
  if (bytes === 0) return "0 B"
  const sizes = [ "B", "KB", "MB", "GB", "TB", "PB" ];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${ value.toFixed(2) } ${ sizes[i] }`
}

class ActionTextAttachmentNode extends ki {
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
      "action-text-attachment": (attachment) => {
        return {
          conversion: () => ({
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
          }),
          priority: 1
        }
      },
      "img": (img) => {
        return {
          conversion: () => ({
            node: new ActionTextAttachmentNode({
              src: img.getAttribute("src"),
              caption: img.getAttribute("alt") || "",
              contentType: "image/*",
              width: img.getAttribute("width"),
              height: img.getAttribute("height")
            })
          }),
          priority: 1
        }
      },
      "video": (video) => {
        const videoSource = video.getAttribute("src") || video.querySelector("source")?.src;
        const fileName = videoSource?.split("/")?.pop();
        const contentType = video.querySelector("source")?.getAttribute("content-type") || "video/*";

        return {
          conversion: () => ({
            node: new ActionTextAttachmentNode({
              src: videoSource,
              fileName: fileName,
              contentType: contentType
            })
          }),
          priority: 1
        }
      }
    }
  }

  constructor({ sgid, src, previewable, altText, caption, contentType, fileName, fileSize, width, height }, key) {
    super(key);

    this.sgid = sgid;
    this.src = src;
    this.previewable = previewable;
    this.altText = altText || "";
    this.caption = caption || "";
    this.contentType = contentType || "";
    this.fileName = fileName || "";
    this.fileSize = fileSize;
    this.width = width;
    this.height = height;
  }

  createDOM() {
    const figure = this.createAttachmentFigure();

    figure.addEventListener("click", (event) => {
      this.#select(figure);
    });

    if (this.isPreviewableAttachment) {
      figure.appendChild(this.#createDOMForImage());
      figure.appendChild(this.#createEditableCaption());
    } else {
      figure.appendChild(this.#createDOMForFile());
      figure.appendChild(this.#createDOMForNotImage());
    }

    return figure
  }

  updateDOM() {
    return true
  }

  isInline() {
    return false
  }

  exportDOM() {
    const attachment = createElement("action-text-attachment", {
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
      sgid: this.sgid,
      src: this.src,
      previewable: this.previewable,
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

  createAttachmentFigure() {
    return createAttachmentFigure(this.contentType, this.isPreviewableAttachment, this.fileName)
  }

  get #isPreviewableImage() {
    return isPreviewableImage(this.contentType)
  }

  get isPreviewableAttachment() {
    return this.#isPreviewableImage || this.previewable
  }

  #createDOMForImage() {
    return createElement("img", { src: this.src, alt: this.altText, ...this.#imageDimensions })
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

  #select(figure) {
    dispatchCustomEvent(figure, "lexxy:internal:select-node", { key: this.getKey() });
  }

  #createEditableCaption() {
    const caption = createElement("figcaption", { className: "attachment__caption" });
    const input = createElement("textarea", {
      value: this.caption,
      placeholder: this.fileName,
      rows: "1"
    });

    input.addEventListener("focusin", () => input.placeholder = "Add caption...");
    input.addEventListener("blur", this.#handleCaptionInputBlurred.bind(this));
    input.addEventListener("keydown", this.#handleCaptionInputKeydown.bind(this));

    caption.appendChild(input);

    return caption
  }

  #handleCaptionInputBlurred(event) {
    const input = event.target;

    input.placeholder = this.fileName;
    this.#updateCaptionValueFromInput(input);
  }

  #updateCaptionValueFromInput(input) {
    dispatchCustomEvent(input, "lexxy:internal:invalidate-node", { key: this.getKey(), values: { caption: input.value } });
  }

  #handleCaptionInputKeydown(event) {
    if (event.key === "Enter") {
      this.#updateCaptionValueFromInput(event.target);
      dispatchCustomEvent(event.target, "lexxy:internal:move-to-next-line");
      event.preventDefault();
    }
    event.stopPropagation();
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

  constructor({ file, uploadUrl, blobUrlTemplate, editor, progress }, key) {
    super({ contentType: file.type }, key);
    this.file = file;
    this.uploadUrl = uploadUrl;
    this.blobUrlTemplate = blobUrlTemplate;
    this.src = null;
    this.editor = editor;
    this.progress = progress || 0;
  }

  createDOM() {
    const figure = this.createAttachmentFigure();

    if (this.isPreviewableAttachment) {
      figure.appendChild(this.#createDOMForImage());
    } else {
      figure.appendChild(this.#createDOMForFile());
    }

    figure.appendChild(this.#createCaption());

    const progressBar = createElement("progress", { value: this.progress, max: 100 });
    figure.appendChild(progressBar);

    // We wait for images to download so that we can pass the dimensions down to the attachment. We do this
    // so that we can render images in edit mode with the dimensions set, which prevent vertical layout shifts.
    this.#loadFigure(figure).then(() => this.#startUpload(progressBar, figure));

    return figure
  }

  exportDOM() {
    const img = document.createElement("img");
    if (this.src) {
      img.src = this.src;
    }
    return { element: img }
  }

  exportJSON() {
    return {
      type: "action_text_attachment_upload",
      version: 1,
      progress: this.progress,
      uploadUrl: this.uploadUrl,
      blobUrlTemplate: this.blobUrlTemplate,
      ...super.exportJSON()
    }
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
    return this.file.name.split(".").pop().toLowerCase()
  }

  #createCaption() {
    const figcaption = createElement("figcaption", { className: "attachment__caption" });

    const nameSpan = createElement("span", { className: "attachment__name", textContent: this.file.name || "" });
    const sizeSpan = createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(this.file.size) });
    figcaption.appendChild(nameSpan);
    figcaption.appendChild(sizeSpan);

    return figcaption
  }

  #loadFigure(figure) {
    const image = figure.querySelector("img");
    if (!image) {
      return Promise.resolve()
    } else {
      return loadFileIntoImage(this.file, image)
    }
  }

  #startUpload(progressBar, figure) {
    const upload = new DirectUpload(this.file, this.uploadUrl, this);

    upload.delegate = {
      directUploadWillStoreFileWithXHR: (request) => {
        request.upload.addEventListener("progress", (event) => {
          this.editor.update(() => {
            progressBar.value = Math.round(event.loaded / event.total * 100);
          });
        });
      }
    };

    upload.create((error, blob) => {
      if (error) {
        this.#handleUploadError(figure);
      } else {
        this.#loadFigurePreviewFromBlob(blob, figure).then(() => {
          this.#showUploadedAttachment(figure, blob);
        });
      }
    });
  }

  #handleUploadError(figure) {
    figure.innerHTML = "";
    figure.classList.add("attachment--error");
    figure.appendChild(createElement("div", { innerText: `Error uploading ${this.file?.name ?? "image"}` }));
  }

  async #showUploadedAttachment(figure, blob) {
    this.editor.update(() => {
      const image = figure.querySelector("img");

      const src = this.blobUrlTemplate
                    .replace(":signed_id", blob.signed_id)
                    .replace(":filename", encodeURIComponent(blob.filename));
      const latest = xo(this.getKey());
      if (latest) {
        latest.replace(new ActionTextAttachmentNode({
          sgid: blob.attachable_sgid,
          src: blob.previewable ? blob.url : src,
          altText: blob.filename,
          contentType: blob.content_type,
          fileName: blob.filename,
          fileSize: blob.byte_size,
          width: image?.naturalWidth,
          previewable: blob.previewable,
          height: image?.naturalHeight
        }));
      }
    }, { tag: Dn });
  }

  async #loadFigurePreviewFromBlob(blob, figure) {
    if (blob.previewable) {
      return new Promise((resolve) => {
        this.editor.update(() => {
          const image = this.#createDOMForImage();
          image.addEventListener("load", () => {
            resolve();
          });
          image.src = blob.url;
          figure.insertBefore(image, figure.firstChild);
        });
      })
    } else {
      return Promise.resolve()
    }
  }
}

class HorizontalDividerNode extends ki {
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

    figure.addEventListener("click", (event) => {
      dispatchCustomEvent(figure, "lexxy:internal:select-node", { key: this.getKey() });
    });

    figure.appendChild(hr);

    return figure
  }

  updateDOM() {
    return true
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

const COMMANDS = [
  "bold",
  "italic",
  "strikethrough",
  "link",
  "unlink",
  "toggleHighlight",
  "removeHighlight",
  "rotateHeadingFormat",
  "insertUnorderedList",
  "insertOrderedList",
  "insertQuoteBlock",
  "insertCodeBlock",
  "insertHorizontalDivider",
  "uploadAttachments",
  "undo",
  "redo"
];

class CommandDispatcher {
  static configureFor(editorElement) {
    new CommandDispatcher(editorElement);
  }

  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
    this.selection = editorElement.selection;
    this.contents = editorElement.contents;
    this.clipboard = editorElement.clipboard;
    this.highlighter = editorElement.highlighter;

    this.#registerCommands();
    this.#registerKeyboardCommands();
    this.#registerDragAndDropHandlers();
  }

  dispatchPaste(event) {
    return this.clipboard.paste(event)
  }

  dispatchBold() {
    this.editor.dispatchCommand(_e$1, "bold");
  }

  dispatchItalic() {
    this.editor.dispatchCommand(_e$1, "italic");
  }

  dispatchStrikethrough() {
    this.editor.dispatchCommand(_e$1, "strikethrough");
  }

  dispatchToggleHighlight(styles) {
    this.highlighter.toggle(styles);
  }

  dispatchRemoveHighlight() {
    this.highlighter.remove();
  }

  dispatchLink(url) {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      if (selection.isCollapsed()) {
        const autoLinkNode = I$1(url);
        const textNode = sr(url);
        autoLinkNode.append(textNode);
        selection.insertNodes([ autoLinkNode ]);
      } else {
        J$1(url);
      }
    });
  }

  dispatchUnlink() {
    this.#toggleLink(null);
  }

  dispatchInsertUnorderedList() {
    const selection = Lr();
    if (!selection) return

    const anchorNode = selection.anchor.getNode();

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "bullet") {
      this.contents.unwrapSelectedListItems();
    } else {
      this.editor.dispatchCommand(St$3, undefined);
    }
  }

  dispatchInsertOrderedList() {
    const selection = Lr();
    if (!selection) return

    const anchorNode = selection.anchor.getNode();

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "number") {
      this.contents.unwrapSelectedListItems();
    } else {
      this.editor.dispatchCommand(xt$2, undefined);
    }
  }

  dispatchInsertQuoteBlock() {
    this.contents.toggleNodeWrappingAllSelectedNodes((node) => Ot$1(node), () => _t$1());
  }

  dispatchInsertCodeBlock() {
    this.editor.update(() => {
      if (this.selection.hasSelectedWordsInSingleLine) {
        this.editor.dispatchCommand(_e$1, "code");
      } else {
        this.contents.toggleNodeWrappingAllSelectedLines((node) => X$1(node), () => new q$1("plain"));
      }
    });
  }

  dispatchInsertHorizontalDivider() {
    this.editor.update(() => {
      this.contents.insertAtCursorEnsuringLineBelow(new HorizontalDividerNode());
    });

    this.editor.focus();
  }

  dispatchRotateHeadingFormat() {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow();
      let nextTag = "h2";
      if (It$1(topLevelElement)) {
        const currentTag = topLevelElement.getTag();
        if (currentTag === "h2") {
          nextTag = "h3";
        } else if (currentTag === "h3") {
          nextTag = "h4";
        } else if (currentTag === "h4") {
          nextTag = null;
        } else {
          nextTag = "h2";
        }
      }

      if (nextTag) {
        this.contents.insertNodeWrappingEachSelectedLine(() => St$2(nextTag));
      } else {
        this.contents.removeFormattingFromSelectedLines();
      }
    });
  }

  dispatchUploadAttachments() {
    const input = createElement("input", {
      type: "file",
      multiple: true,
      style: "display: none;",
      onchange: ({ target }) => {
        const files = Array.from(target.files);
        if (!files.length) return

        for (const file of files) {
          this.contents.uploadFile(file);
        }
      }
    });

    this.editorElement.appendChild(input); // Append and remove just for the sake of making it testable
    input.click();
    setTimeout(() => input.remove(), 1000);
  }

  dispatchUndo() {
    this.editor.dispatchCommand(pe$1, undefined);
  }

  dispatchRedo() {
    this.editor.dispatchCommand(ye$1, undefined);
  }

  #registerCommands() {
    for (const command of COMMANDS) {
      const methodName = `dispatch${capitalize(command)}`;
      this.#registerCommandHandler(command, 0, this[methodName].bind(this));
    }

    this.#registerCommandHandler(fe$1, zi, this.dispatchPaste.bind(this));
  }

  #registerCommandHandler(command, priority, handler) {
    this.editor.registerCommand(command, handler, priority);
  }

  #registerKeyboardCommands() {
    this.editor.registerCommand(Me$1, this.#handleListIndentation.bind(this), Ri);
  }

  #registerDragAndDropHandlers() {
    if (this.editorElement.supportsAttachments) {
      this.dragCounter = 0;
      this.editor.getRootElement().addEventListener("dragover", this.#handleDragOver.bind(this));
      this.editor.getRootElement().addEventListener("drop", this.#handleDrop.bind(this));
      this.editor.getRootElement().addEventListener("dragenter", this.#handleDragEnter.bind(this));
      this.editor.getRootElement().addEventListener("dragleave", this.#handleDragLeave.bind(this));
    }
  }

  #handleDragEnter(event) {
    this.dragCounter++;
    if (this.dragCounter === 1) {
      this.editor.getRootElement().classList.add("lexxy-editor--drag-over");
    }
  }

  #handleDragLeave(event) {
    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.editor.getRootElement().classList.remove("lexxy-editor--drag-over");
    }
  }

  #handleDragOver(event) {
    event.preventDefault();
  }

  #handleDrop(event) {
    event.preventDefault();

    this.dragCounter = 0;
    this.editor.getRootElement().classList.remove("lexxy-editor--drag-over");

    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) return

    const files = Array.from(dataTransfer.files);
    if (!files.length) return

    for (const file of files) {
      this.contents.uploadFile(file);
    }

    this.editor.focus();
  }

  #handleListIndentation(event) {
    if (this.selection.isInsideList) {
      event.preventDefault();
      if (event.shiftKey) {
        return this.editor.dispatchCommand(De$1, undefined)
      } else {
        return this.editor.dispatchCommand(Pe$1, undefined)
      }
    }
    return false
  }

  // Not using TOGGLE_LINK_COMMAND because it's not handled unless you use React/LinkPlugin
  #toggleLink(url) {
    this.editor.update(() => {
      if (url === null) {
        J$1(null);
      } else {
        J$1(url);
      }
    });
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
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

function nextFrame() {
  return new Promise(requestAnimationFrame)
}

class Selection {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editorContentElement = editorElement.editorContentElement;
    this.editor = this.editorElement.editor;
    this.previouslySelectedKeys = new Set();

    this.#listenForNodeSelections();
    this.#processSelectionChangeCommands();
    this.#handleInputWhenDecoratorNodesSelected();
    this.#containEditorFocus();
  }

  clear() {
    this.current = null;
  }

  set current(selection) {
    if (xr(selection)) {
      this.editor.getEditorState().read(() => {
        this._current = Lr();
        this.#syncSelectedClasses();
      });
    } else {
      this.editor.update(() => {
        this.#syncSelectedClasses();
        this._current = null;
      });
    }
  }

  get current() {
    return this._current
  }

  get cursorPosition() {
    let position = { x: 0, y: 0 };

    this.editor.getEditorState().read(() => {
      const range = this.#getValidSelectionRange();
      if (!range) return

      const rect = this.#getReliableRectFromRange(range);
      if (!rect) return

      position = this.#calculateCursorPosition(rect, range);
    });

    return position
  }

  placeCursorAtTheEnd() {
    this.editor.update(() => {
      No().selectEnd();
    });
  }

  selectedNodeWithOffset() {
    const selection = Lr();
    if (!selection) return { node: null, offset: 0 }

    if (yr(selection)) {
      return {
        node: selection.anchor.getNode(),
        offset: selection.anchor.offset
      }
    } else if (xr(selection)) {
      const [ node ] = selection.getNodes();
      return {
        node,
        offset: 0
      }
    }

    return { node: null, offset: 0 }
  }

  preservingSelection(fn) {
    let selectionState = null;

    this.editor.getEditorState().read(() => {
      const selection = Lr();
      if (selection && yr(selection)) {
        selectionState = {
          anchor: { key: selection.anchor.key, offset: selection.anchor.offset },
          focus: { key: selection.focus.key, offset: selection.focus.offset }
        };
      }
    });

    fn();

    if (selectionState) {
      this.editor.update(() => {
        const selection = Lr();
        if (selection && yr(selection)) {
          selection.anchor.set(selectionState.anchor.key, selectionState.anchor.offset, "text");
          selection.focus.set(selectionState.focus.key, selectionState.focus.offset, "text");
        }
      });
    }
  }

  get hasSelectedWordsInSingleLine() {
    const selection = Lr();
    if (!yr(selection)) return false

    if (selection.isCollapsed()) return false

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    if (anchorNode.getTopLevelElement() !== focusNode.getTopLevelElement()) {
      return false
    }

    const anchorElement = anchorNode.getTopLevelElement();
    if (!anchorElement) return false

    const nodes = selection.getNodes();
    for (const node of nodes) {
      if (jn(node)) {
        return false
      }
    }

    return true
  }

  get isInsideList() {
    const selection = Lr();
    if (!yr(selection)) return false

    const anchorNode = selection.anchor.getNode();
    return getNearestListItemNode(anchorNode) !== null
  }

  get nodeAfterCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if (lr(anchorNode)) {
      return this.#getNodeAfterTextNode(anchorNode, offset)
    }

    if (Si(anchorNode)) {
      return this.#getNodeAfterElementNode(anchorNode, offset)
    }

    return this.#findNextSiblingUp(anchorNode)
  }

  get topLevelNodeAfterCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if (lr(anchorNode)) {
      return this.#getNextNodeFromTextEnd(anchorNode)
    }

    if (Si(anchorNode)) {
      return this.#getNodeAfterElementNode(anchorNode, offset)
    }

    return this.#findNextSiblingUp(anchorNode)
  }

  get nodeBeforeCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if (lr(anchorNode)) {
      return this.#getNodeBeforeTextNode(anchorNode, offset)
    }

    if (Si(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  get topLevelNodeBeforeCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if (lr(anchorNode)) {
      return this.#getPreviousNodeFromTextStart(anchorNode)
    }

    if (Si(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  get #contents() {
    return this.editorElement.contents
  }

  get #currentlySelectedKeys() {
    if (this._currentlySelectedKeys) { return this._currentlySelectedKeys }

    this._currentlySelectedKeys = new Set();

    const selection = Lr();
    if (selection && xr(selection)) {
      for (const node of selection.getNodes()) {
        this._currentlySelectedKeys.add(node.getKey());
      }
    }

    return this._currentlySelectedKeys
  }

  #processSelectionChangeCommands() {
    this.editor.registerCommand(Se$1, this.#selectPreviousNode.bind(this), zi);
    this.editor.registerCommand(xe, this.#selectNextNode.bind(this), zi);
    this.editor.registerCommand(ke$1, this.#selectPreviousTopLevelNode.bind(this), zi);
    this.editor.registerCommand(Te$1, this.#selectNextTopLevelNode.bind(this), zi);

    this.editor.registerCommand(Oe$1, this.#deleteSelectedOrNext.bind(this), zi);
    this.editor.registerCommand(we$1, this.#deletePreviousOrNext.bind(this), zi);

    this.editor.registerCommand(ie$1, () => {
      this.current = Lr();
    }, zi);
  }

  #listenForNodeSelections() {
    this.editor.getRootElement().addEventListener("lexxy:internal:select-node", async (event) => {
      await nextFrame();

      const { key } = event.detail;
      this.editor.update(() => {
        const node = xo(key);
        if (node) {
          const selection = Pr();
          selection.add(node.getKey());
          wo(selection);
        }
        this.editor.focus();
      });
    });

    this.editor.getRootElement().addEventListener("lexxy:internal:move-to-next-line", (event) => {
      this.#selectOrAppendNextLine();
    });
  }

  // In Safari, when the only node in the document is an attachment, it won't let you enter text
  // before/below it. There is probably a better fix here, but this workaround solves the problem until
  // we find it.
  #handleInputWhenDecoratorNodesSelected() {
    this.editor.getRootElement().addEventListener("keydown", (event) => {
      if (isPrintableCharacter(event)) {
        this.editor.update(() => {
          const selection = Lr();

          if (yr(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode();
            const offset = selection.anchor.offset;

            const nodeBefore = this.#getNodeBeforePosition(anchorNode, offset);
            const nodeAfter = this.#getNodeAfterPosition(anchorNode, offset);

            if (nodeBefore instanceof ki && !nodeBefore.isInline()) {
              event.preventDefault();
              this.#contents.createParagraphAfterNode(nodeBefore, event.key);
              return
            } else if (nodeAfter instanceof ki && !nodeAfter.isInline()) {
              event.preventDefault();
              this.#contents.createParagraphBeforeNode(nodeAfter, event.key);
              return
            }
          }
        });
      }
    }, true);
  }

  #getNodeBeforePosition(node, offset) {
    if (lr(node) && offset === 0) {
      return node.getPreviousSibling()
    }
    if (Si(node) && offset > 0) {
      return node.getChildAtIndex(offset - 1)
    }
    return null
  }

  #getNodeAfterPosition(node, offset) {
    if (lr(node) && offset === node.getTextContentSize()) {
      return node.getNextSibling()
    }
    if (Si(node)) {
      return node.getChildAtIndex(offset)
    }
    return null
  }

  #containEditorFocus() {
    // Workaround for a bizarre Chrome bug where the cursor abandons the editor to focus on not-focusable elements
    // above when navigating UP/DOWN when Lexical shows its fake cursor on custom decorator nodes.
    this.editorContentElement.addEventListener("keydown", (event) => {
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
    }, true);
  }

  #syncSelectedClasses() {
    this.#clearPreviouslyHighlightedItems();
    this.#highlightNewItems();

    this.previouslySelectedKeys = this.#currentlySelectedKeys;
    this._currentlySelectedKeys = null;
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

  async #selectPreviousNode() {
    if (this.current) {
      await this.#withCurrentNode((currentNode) => currentNode.selectPrevious());
    } else {
      this.#selectInLexical(this.nodeBeforeCursor);
    }
  }

  async #selectNextNode() {
    if (this.current) {
      await this.#withCurrentNode((currentNode) => currentNode.selectNext(0, 0));
    } else {
      this.#selectInLexical(this.nodeAfterCursor);
    }
  }

  async #selectPreviousTopLevelNode() {
    if (this.current) {
      await this.#withCurrentNode((currentNode) => currentNode.selectPrevious());
    } else {
      this.#selectInLexical(this.topLevelNodeBeforeCursor);
    }
  }

  async #selectNextTopLevelNode() {
    if (this.current) {
      await this.#withCurrentNode((currentNode) => currentNode.selectNext(0, 0));
    } else {
      this.#selectInLexical(this.topLevelNodeAfterCursor);
    }
  }

  async #withCurrentNode(fn) {
    await nextFrame();
    if (this.current) {
      this.editor.update(() => {
        this.clear();
        fn(this.current.getNodes()[0]);
        this.editor.focus();
      });
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
    const selection = Lr();
    if (!selection) return null

    if (xr(selection)) {
      return this.#getTopLevelFromNodeSelection(selection)
    }

    if (yr(selection)) {
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

  #moveToOrCreateNextLine(topLevelElement) {
    const nextSibling = topLevelElement.getNextSibling();

    if (nextSibling) {
      nextSibling.selectStart();
    } else {
      this.#createAndSelectNewParagraph();
    }
  }

  #createAndSelectNewParagraph() {
    const root = No();
    const newParagraph = Li();
    root.append(newParagraph);
    newParagraph.selectStart();
  }

  #selectInLexical(node) {
    if (!node || !(node instanceof ki)) return

    this.editor.update(() => {
      const selection = Pr();
      selection.add(node.getKey());
      wo(selection);
    });
  }

  #deleteSelectedOrNext() {
    const node = this.nodeAfterCursor;
    if (node instanceof ki) {
      this.#selectInLexical(node);
      return true
    } else {
      this.#contents.deleteSelectedNodes();
    }

    return false
  }

  #deletePreviousOrNext() {
    const node = this.nodeBeforeCursor;
    if (node instanceof ki) {
      this.#selectInLexical(node);
      return true
    } else {
      this.#contents.deleteSelectedNodes();
    }

    return false
  }

  #getValidSelectionRange() {
    const lexicalSelection = Lr();
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
    const selection = Lr();
    if (!yr(selection) || !selection.isCollapsed()) {
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
    if (anchorNode.getNextSibling() instanceof ki) {
      return anchorNode.getNextSibling()
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
    if (anchorNode.getPreviousSibling() instanceof ki) {
      return anchorNode.getPreviousSibling()
    }
    const parent = anchorNode.getParent();
    return parent.getPreviousSibling()
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
}

class CustomActionTextAttachmentNode extends ki {
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
      "action-text-attachment": (attachment) => {
        const content = attachment.getAttribute("content");
        if (!attachment.getAttribute("content")) {
          return null
        }

        return {
          conversion: () => {
            // Preserve initial space if present since Lexical removes it
            const nodes = [];
            const previousSibling = attachment.previousSibling;
            if (previousSibling && previousSibling.nodeType === Node.TEXT_NODE && /\s$/.test(previousSibling.textContent)) {
              nodes.push(sr(" "));
            }

            nodes.push(new CustomActionTextAttachmentNode({
              sgid: attachment.getAttribute("sgid"),
              innerHtml: JSON.parse(content),
              contentType: attachment.getAttribute("content-type")
            }));

            nodes.push(sr(" "));

            return { node: nodes }
          },
          priority: 2
        }
      }
    }
  }

  constructor({ sgid, contentType, innerHtml }, key) {
    super(key);

    this.sgid = sgid;
    this.contentType = contentType || "application/vnd.actiontext.unknown";
    this.innerHtml = innerHtml;
  }

  createDOM() {
    const figure = createElement("action-text-attachment", { "content-type": this.contentType, "data-lexxy-decorator": true });

    figure.addEventListener("click", (event) => {
      dispatchCustomEvent(figure, "lexxy:internal:select-node", { key: this.getKey() });
    });

    figure.insertAdjacentHTML("beforeend", this.innerHtml);

    return figure
  }

  updateDOM() {
    return true
  }

  isInline() {
    return true
  }

  exportDOM() {
    const attachment = createElement("action-text-attachment", {
      sgid: this.sgid,
      content: JSON.stringify(this.innerHtml),
      "content-type": this.contentType
    });

    return { element: attachment }
  }

  exportJSON() {
    return {
      type: "custom_action_text_attachment",
      version: 1,
      sgid: this.sgid,
      contentType: this.contentType,
      innerHtml: this.innerHtml
    }
  }

  decorate() {
    return null
  }
}

class FormatEscaper {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
  }

  monitor() {
    this.editor.registerCommand(
      Ne$1,
      (event) => this.#handleEnterKey(event),
      Bi
    );
  }

  #handleEnterKey(event) {
    const selection = Lr();
    if (!yr(selection)) return false

    const anchorNode = selection.anchor.getNode();

    if (!this.#isInsideBlockquote(anchorNode)) return false

    return this.#handleLists(event, anchorNode)
      || this.#handleBlockquotes(event, anchorNode)
  }

  #handleLists(event, anchorNode) {
    if (this.#shouldEscapeFromEmptyListItem(anchorNode) || this.#shouldEscapeFromEmptyParagraphInListItem(anchorNode)) {
      event.preventDefault();
      this.#escapeFromList(anchorNode);
      return true
    }

    return false
  }

  #handleBlockquotes(event, anchorNode) {
    if (this.#shouldEscapeFromEmptyParagraphInBlockquote(anchorNode)) {
      event.preventDefault();
      this.#escapeFromBlockquote(anchorNode);
      return true
    }

    return false
  }

  #isInsideBlockquote(node) {
    let currentNode = node;

    while (currentNode) {
      if (Ot$1(currentNode)) {
        return true
      }
      currentNode = currentNode.getParent();
    }

    return false
  }

  #shouldEscapeFromEmptyListItem(node) {
    const listItem = this.#getListItemNode(node);
    if (!listItem) return false

    return this.#isNodeEmpty(listItem)
  }

  #shouldEscapeFromEmptyParagraphInListItem(node) {
    const paragraph = this.#getParagraphNode(node);
    if (!paragraph) return false

    if (!this.#isNodeEmpty(paragraph)) return false

    const parent = paragraph.getParent();
    return parent && ot$2(parent)
  }

  #isNodeEmpty(node) {
    if (node.getTextContent().trim() !== "") return false

    const children = node.getChildren();
    if (children.length === 0) return true

    return children.every(child => {
      if (jn(child)) return true
      return this.#isNodeEmpty(child)
    })
  }

  #getListItemNode(node) {
    let currentNode = node;

    while (currentNode) {
      if (ot$2(currentNode)) {
        return currentNode
      }
      currentNode = currentNode.getParent();
    }

    return null
  }

  #escapeFromList(anchorNode) {
    const listItem = this.#getListItemNode(anchorNode);
    if (!listItem) return

    const parentList = listItem.getParent();
    if (!parentList || !dt$1(parentList)) return

    const blockquote = parentList.getParent();
    const isInBlockquote = blockquote && Ot$1(blockquote);

    if (isInBlockquote) {
      const listItemsAfter = this.#getListItemSiblingsAfter(listItem);
      const nonEmptyListItems = listItemsAfter.filter(item => !this.#isNodeEmpty(item));

      if (nonEmptyListItems.length > 0) {
        this.#splitBlockquoteWithList(blockquote, parentList, listItem, nonEmptyListItems);
        return
      }
    }

    const paragraph = Li();
    parentList.insertAfter(paragraph);

    listItem.remove();
    paragraph.selectStart();
  }

  #shouldEscapeFromEmptyParagraphInBlockquote(node) {
    const paragraph = this.#getParagraphNode(node);
    if (!paragraph) return false

    if (!this.#isNodeEmpty(paragraph)) return false

    const parent = paragraph.getParent();
    return parent && Ot$1(parent)
  }

  #getParagraphNode(node) {
    let currentNode = node;

    while (currentNode) {
      if (Ii(currentNode)) {
        return currentNode
      }
      currentNode = currentNode.getParent();
    }

    return null
  }

  #escapeFromBlockquote(anchorNode) {
    const paragraph = this.#getParagraphNode(anchorNode);
    if (!paragraph) return

    const blockquote = paragraph.getParent();
    if (!blockquote || !Ot$1(blockquote)) return

    const siblingsAfter = this.#getSiblingsAfter(paragraph);
    const nonEmptySiblings = siblingsAfter.filter(sibling => !this.#isNodeEmpty(sibling));

    if (nonEmptySiblings.length > 0) {
      this.#splitBlockquote(blockquote, paragraph, nonEmptySiblings);
    } else {
      const newParagraph = Li();
      blockquote.insertAfter(newParagraph);
      paragraph.remove();
      newParagraph.selectStart();
    }
  }

  #getSiblingsAfter(node) {
    const siblings = [];
    let sibling = node.getNextSibling();

    while (sibling) {
      siblings.push(sibling);
      sibling = sibling.getNextSibling();
    }

    return siblings
  }

  #getListItemSiblingsAfter(listItem) {
    const siblings = [];
    let sibling = listItem.getNextSibling();

    while (sibling) {
      if (ot$2(sibling)) {
        siblings.push(sibling);
      }
      sibling = sibling.getNextSibling();
    }

    return siblings
  }

  #splitBlockquoteWithList(blockquote, parentList, emptyListItem, listItemsAfter) {
    const blockquoteSiblingsAfterList = this.#getSiblingsAfter(parentList);
    const nonEmptyBlockquoteSiblings = blockquoteSiblingsAfterList.filter(sibling => !this.#isNodeEmpty(sibling));

    const middleParagraph = Li();
    blockquote.insertAfter(middleParagraph);

    const newList = ht$3(parentList.getListType());

    const newBlockquote = _t$1();
    middleParagraph.insertAfter(newBlockquote);
    newBlockquote.append(newList);

    listItemsAfter.forEach(item => {
      newList.append(item);
    });

    nonEmptyBlockquoteSiblings.forEach(sibling => {
      newBlockquote.append(sibling);
    });

    emptyListItem.remove();

    this.#removeTrailingEmptyListItems(parentList);
    this.#removeTrailingEmptyNodes(newBlockquote);

    if (parentList.getChildrenSize() === 0) {
      parentList.remove();

      if (blockquote.getChildrenSize() === 0) {
        blockquote.remove();
      }
    } else {
      this.#removeTrailingEmptyNodes(blockquote);
    }

    middleParagraph.selectStart();
  }

  #removeTrailingEmptyListItems(list) {
    const items = list.getChildren();
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (ot$2(item) && this.#isNodeEmpty(item)) {
        item.remove();
      } else {
        break
      }
    }
  }

  #removeTrailingEmptyNodes(blockquote) {
    const children = blockquote.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (this.#isNodeEmpty(child)) {
        child.remove();
      } else {
        break
      }
    }
  }

  #splitBlockquote(blockquote, emptyParagraph, siblingsAfter) {
    const newParagraph = Li();
    blockquote.insertAfter(newParagraph);

    const newBlockquote = _t$1();
    newParagraph.insertAfter(newBlockquote);

    siblingsAfter.forEach(sibling => {
      newBlockquote.append(sibling);
    });

    emptyParagraph.remove();

    this.#removeTrailingEmptyNodes(blockquote);
    this.#removeTrailingEmptyNodes(newBlockquote);

    newParagraph.selectStart();
  }
}

class Contents {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;

    new FormatEscaper(editorElement).monitor();
  }

  insertHtml(html) {
    this.editor.update(() => {
      const selection = Lr();

      if (!yr(selection)) return

      const nodes = m$1(this.editor, parseHtml(html));
      selection.insertNodes(nodes);
    });
  }

  insertAtCursor(node) {
    this.editor.update(() => {
      const selection = Lr();
      const selectedNodes = selection?.getNodes();

      if (yr(selection)) {
        jr([ node ]);
      } else if (xr(selection) && selectedNodes && selectedNodes.length > 0) {
        const lastNode = selectedNodes[selectedNodes.length - 1];
        lastNode.insertAfter(node);
      } else {
        const root = No();
        root.append(node);
      }
    });
  }

  insertAtCursorEnsuringLineBelow(node) {
    this.insertAtCursor(node);
    this.#insertLineBelowIfLastNode(node);
  }

  insertNodeWrappingEachSelectedLine(newNodeFn) {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      const selectedNodes = selection.extract();

      selectedNodes.forEach((node) => {
        const parent = node.getParent();
        if (!parent) { return }

        const topLevelElement = node.getTopLevelElementOrThrow();
        const wrappingNode = newNodeFn();
        wrappingNode.append(...topLevelElement.getChildren());
        topLevelElement.replace(wrappingNode);
      });
    });
  }

  toggleNodeWrappingAllSelectedLines(isFormatAppliedFn, newNodeFn) {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow();

      // Check if format is already applied
      if (isFormatAppliedFn(topLevelElement)) {
        this.removeFormattingFromSelectedLines();
      } else {
        this.#insertNodeWrappingAllSelectedLines(newNodeFn);
      }
    });
  }

  toggleNodeWrappingAllSelectedNodes(isFormatAppliedFn, newNodeFn) {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      const topLevelElement = selection.anchor.getNode().getTopLevelElement();

      // Check if format is already applied
      if (topLevelElement && isFormatAppliedFn(topLevelElement)) {
        this.#unwrap(topLevelElement);
      } else {
        this.#insertNodeWrappingAllSelectedNodes(newNodeFn);
      }
    });
  }

  removeFormattingFromSelectedLines() {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow();
      const paragraph = Li();
      paragraph.append(...topLevelElement.getChildren());
      topLevelElement.replace(paragraph);
    });
  }

  hasSelectedText() {
    let result = false;

    this.editor.read(() => {
      const selection = Lr();
      result = yr(selection) && !selection.isCollapsed();
    });

    return result
  }

  unwrapSelectedListItems() {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      const { listItems, parentLists } = this.#collectSelectedListItems(selection);
      if (listItems.size > 0) {
        const newParagraphs = this.#convertListItemsToParagraphs(listItems);
        this.#removeEmptyParentLists(parentLists);
        this.#selectNewParagraphs(newParagraphs);
      }
    });
  }

  createLink(url) {
    let linkNodeKey = null;

    this.editor.update(() => {
      const textNode = sr(url);
      const linkNode = D$1(url);
      linkNode.append(textNode);

      const selection = Lr();
      if (yr(selection)) {
        selection.insertNodes([ linkNode ]);
        linkNodeKey = linkNode.getKey();
      }
    });

    return linkNodeKey
  }

  createLinkWithSelectedText(url) {
    if (!this.hasSelectedText()) return

    this.editor.update(() => {
      J$1(url);
    });
  }

  textBackUntil(string) {
    let result = "";

    this.editor.getEditorState().read(() => {
      const selection = Lr();
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();

      if (!lr(anchorNode)) return

      const fullText = anchorNode.getTextContent();
      const offset = anchor.offset;

      const textBeforeCursor = fullText.slice(0, offset);

      const lastIndex = textBeforeCursor.lastIndexOf(string);
      if (lastIndex !== -1) {
        result = textBeforeCursor.slice(lastIndex + string.length);
      }
    });

    return result
  }

  containsTextBackUntil(string) {
    let result = false;

    this.editor.getEditorState().read(() => {
      const selection = Lr();
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();

      if (!lr(anchorNode)) return

      const fullText = anchorNode.getTextContent();
      const offset = anchor.offset;

      const textBeforeCursor = fullText.slice(0, offset);

      result = textBeforeCursor.includes(string);
    });

    return result
  }

  replaceTextBackUntil(stringToReplace, replacementNodes) {
    replacementNodes = Array.isArray(replacementNodes) ? replacementNodes : [ replacementNodes ];

    this.editor.update(() => {
      const { anchorNode, offset } = this.#getTextAnchorData();
      if (!anchorNode) return

      const lastIndex = this.#findLastIndexBeforeCursor(anchorNode, offset, stringToReplace);
      if (lastIndex === -1) return

      this.#performTextReplacement(anchorNode, offset, lastIndex, replacementNodes);
    });
  }

  createParagraphAfterNode(node, text) {
    const newParagraph = Li();
    node.insertAfter(newParagraph);
    newParagraph.selectStart();

    // Insert the typed text
    if (text) {
      newParagraph.append(sr(text));
      newParagraph.select(1, 1); // Place cursor after the text
    }
  }

  createParagraphBeforeNode(node, text) {
    const newParagraph = Li();
    node.insertBefore(newParagraph);
    newParagraph.selectStart();

    // Insert the typed text
    if (text) {
      newParagraph.append(sr(text));
      newParagraph.select(1, 1); // Place cursor after the text
    }
  }

  uploadFile(file) {
    if (!this.editorElement.supportsAttachments) {
      console.warn("This editor does not supports attachments (it's configured with [attachments=false])");
      return
    }

    if (!this.#shouldUploadFile(file)) {
      return
    }

    const uploadUrl = this.editorElement.directUploadUrl;
    const blobUrlTemplate = this.editorElement.blobUrlTemplate;

    this.editor.update(() => {
      const uploadedImageNode = new ActionTextAttachmentUploadNode({ file: file, uploadUrl: uploadUrl, blobUrlTemplate: blobUrlTemplate, editor: this.editor });
      this.insertAtCursor(uploadedImageNode);
    }, { tag: Dn });
  }

  async deleteSelectedNodes() {
    let focusNode = null;

    this.editor.update(() => {
      if (xr(this.#selection.current)) {
        const nodesToRemove = this.#selection.current.getNodes();
        if (nodesToRemove.length === 0) return

        focusNode = this.#findAdjacentNodeTo(nodesToRemove);
        this.#deleteNodes(nodesToRemove);
      }
    });

    await nextFrame();

    this.editor.update(() => {
      this.#selectAfterDeletion(focusNode);
      this.#selection.clear();
      this.editor.focus();
    });
  }

  replaceNodeWithHTML(nodeKey, html, options = {}) {
    this.editor.update(() => {
      const node = xo(nodeKey);
      if (!node) return

      const selection = Lr();
      let wasSelected = false;

      if (yr(selection)) {
        const selectedNodes = selection.getNodes();
        wasSelected = selectedNodes.includes(node) || selectedNodes.some(n => n.getParent() === node);

        if (wasSelected) {
          wo(null);
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
      const node = xo(nodeKey);
      if (!node) return

      const previousNode = node.getTopLevelElement() || node;

      const newNode = options.attachment ? this.#createCustomAttachmentNodeWithHtml(html, options.attachment) : this.#createHtmlNodeWith(html);
      previousNode.insertAfter(newNode);
    });
  }

  get #selection() {
    return this.editorElement.selection
  }

  #insertLineBelowIfLastNode(node) {
    this.editor.update(() => {
      const nextSibling = node.getNextSibling();
      if (!nextSibling) {
        const newParagraph = Li();
        node.insertAfter(newParagraph);
        newParagraph.selectStart();
      }
    });
  }

  #unwrap(node) {
    const children = node.getChildren();

    children.forEach((child) => {
      node.insertBefore(child);
    });

    node.remove();
  }

  #insertNodeWrappingAllSelectedNodes(newNodeFn) {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      const selectedNodes = selection.extract();
      if (selectedNodes.length === 0) {
        return
      }
      const topLevelElements = new Set();
      selectedNodes.forEach((node) => {
        const topLevel = node.getTopLevelElementOrThrow();
        topLevelElements.add(topLevel);
      });

      const elements = this.#withoutTrailingEmptyParagraphs(Array.from(topLevelElements));
      if (elements.length === 0) {
        this.#removeStandaloneEmptyParagraph();
        this.insertAtCursor(newNodeFn());
        return
      }

      const wrappingNode = newNodeFn();
      elements[0].insertBefore(wrappingNode);
      elements.forEach((element) => {
        wrappingNode.append(element);
      });
    });
  }

  #withoutTrailingEmptyParagraphs(elements) {
    let lastNonEmptyIndex = elements.length - 1;

    // Find the last non-empty paragraph
    while (lastNonEmptyIndex >= 0) {
      const element = elements[lastNonEmptyIndex];
      if (!Ii(element) || !this.#isElementEmpty(element)) {
        break
      }
      lastNonEmptyIndex--;
    }

    return elements.slice(0, lastNonEmptyIndex + 1)
  }

  #isElementEmpty(element) {
    // Check text content first
    if (element.getTextContent().trim() !== "") return false

    // Check if it only contains line breaks
    const children = element.getChildren();
    return children.length === 0 || children.every(child => jn(child))
  }

  #removeStandaloneEmptyParagraph() {
    const root = No();
    if (root.getChildrenSize() === 1) {
      const firstChild = root.getFirstChild();
      if (firstChild && Ii(firstChild) && this.#isElementEmpty(firstChild)) {
        firstChild.remove();
      }
    }
  }

  #insertNodeWrappingAllSelectedLines(newNodeFn) {
    this.editor.update(() => {
      const selection = Lr();
      if (!yr(selection)) return

      if (selection.isCollapsed()) {
        this.#wrapCurrentLine(selection, newNodeFn);
      } else {
        this.#wrapMultipleSelectedLines(selection, newNodeFn);
      }
    });
  }

  #wrapCurrentLine(selection, newNodeFn) {
    const anchorNode = selection.anchor.getNode();
    const topLevelElement = anchorNode.getTopLevelElementOrThrow();

    if (topLevelElement.getTextContent()) {
      const wrappingNode = newNodeFn();
      wrappingNode.append(...topLevelElement.getChildren());
      topLevelElement.replace(wrappingNode);
    } else {
      jr([ newNodeFn() ]);
    }
  }

  #wrapMultipleSelectedLines(selection, newNodeFn) {
    const selectedParagraphs = this.#extractSelectedParagraphs(selection);
    if (selectedParagraphs.length === 0) return

    const { lineSet, nodesToDelete } = this.#extractUniqueLines(selectedParagraphs);
    if (lineSet.size === 0) return

    const wrappingNode = this.#createWrappingNodeWithLines(newNodeFn, lineSet);
    this.#replaceWithWrappingNode(selection, wrappingNode);
    this.#removeNodes(nodesToDelete);
  }

  #extractSelectedParagraphs(selection) {
    const selectedNodes = selection.extract();
    const selectedParagraphs = selectedNodes
      .map((node) => this.#getParagraphFromNode(node))
      .filter(Boolean);

    wo(null);
    return selectedParagraphs
  }

  #getParagraphFromNode(node) {
    if (Ii(node)) return node
    if (lr(node) && node.getParent() && Ii(node.getParent())) {
      return node.getParent()
    }
    return null
  }

  #extractUniqueLines(selectedParagraphs) {
    const lineSet = new Set();
    const nodesToDelete = new Set();

    selectedParagraphs.forEach((paragraphNode) => {
      const textContent = paragraphNode.getTextContent();
      if (textContent) {
        textContent.split("\n").forEach((line) => {
          if (line.trim()) lineSet.add(line);
        });
      }
      nodesToDelete.add(paragraphNode);
    });

    return { lineSet, nodesToDelete }
  }

  #createWrappingNodeWithLines(newNodeFn, lineSet) {
    const wrappingNode = newNodeFn();
    const lines = Array.from(lineSet);

    lines.forEach((lineText, index) => {
      wrappingNode.append(sr(lineText));
      if (index < lines.length - 1) {
        wrappingNode.append(Jn());
      }
    });

    return wrappingNode
  }

  #replaceWithWrappingNode(selection, wrappingNode) {
    const anchorNode = selection.anchor.getNode();
    const parent = anchorNode.getParent();
    if (parent) {
      parent.replace(wrappingNode);
    }
  }

  #removeNodes(nodesToDelete) {
    nodesToDelete.forEach((node) => node.remove());
  }

  #deleteNodes(nodes) {
    // Use splice() instead of node.remove() for proper removal and
    // reconciliation. Would have issues with removing unintended decorator nodes
    // with node.remove()
    nodes.forEach((node) => {
      const parent = node.getParent();
      if (!Si(parent)) return

      const children = parent.getChildren();
      const index = children.indexOf(node);

      if (index >= 0) {
        parent.splice(index, 1, []);
      }
    });
  }

  #findAdjacentNodeTo(nodes) {
    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];

    return firstNode?.getPreviousSibling() || lastNode?.getNextSibling()
  }

  #selectAfterDeletion(focusNode) {
    const root = No();
    if (root.getChildrenSize() === 0) {
      const newParagraph = Li();
      root.append(newParagraph);
      newParagraph.selectStart();
    } else if (focusNode) {
      if (lr(focusNode) || Ii(focusNode)) {
        focusNode.selectEnd();
      } else {
        focusNode.selectNext(0, 0);
      }
    }
  }

  #collectSelectedListItems(selection) {
    const nodes = selection.getNodes();
    const listItems = new Set();
    const parentLists = new Set();

    for (const node of nodes) {
      const listItem = getNearestListItemNode(node);
      if (listItem) {
        listItems.add(listItem);
        const parentList = listItem.getParent();
        if (parentList && dt$1(parentList)) {
          parentLists.add(parentList);
        }
      }
    }

    return { listItems, parentLists }
  }

  #convertListItemsToParagraphs(listItems) {
    const newParagraphs = [];

    for (const listItem of listItems) {
      const paragraph = this.#convertListItemToParagraph(listItem);
      if (paragraph) {
        newParagraphs.push(paragraph);
      }
    }

    return newParagraphs
  }

  #convertListItemToParagraph(listItem) {
    const parentList = listItem.getParent();
    if (!parentList || !dt$1(parentList)) return null

    const paragraph = Li();
    const sublists = this.#extractSublistsAndContent(listItem, paragraph);

    listItem.insertAfter(paragraph);
    this.#insertSublists(paragraph, sublists);
    listItem.remove();

    return paragraph
  }

  #extractSublistsAndContent(listItem, paragraph) {
    const sublists = [];

    listItem.getChildren().forEach((child) => {
      if (dt$1(child)) {
        sublists.push(child);
      } else {
        paragraph.append(child);
      }
    });

    return sublists
  }

  #insertSublists(paragraph, sublists) {
    sublists.forEach((sublist) => {
      paragraph.insertAfter(sublist);
    });
  }

  #removeEmptyParentLists(parentLists) {
    for (const parentList of parentLists) {
      if (dt$1(parentList) && parentList.getChildrenSize() === 0) {
        parentList.remove();
      }
    }
  }

  #selectNewParagraphs(newParagraphs) {
    if (newParagraphs.length === 0) return

    const firstParagraph = newParagraphs[0];
    const lastParagraph = newParagraphs[newParagraphs.length - 1];

    if (newParagraphs.length === 1) {
      firstParagraph.selectEnd();
    } else {
      this.#selectParagraphRange(firstParagraph, lastParagraph);
    }
  }

  #selectParagraphRange(firstParagraph, lastParagraph) {
    firstParagraph.selectStart();
    const currentSelection = Lr();
    if (currentSelection && yr(currentSelection)) {
      currentSelection.anchor.set(firstParagraph.getKey(), 0, "element");
      currentSelection.focus.set(lastParagraph.getKey(), lastParagraph.getChildrenSize(), "element");
    }
  }

  #getTextAnchorData() {
    const selection = Lr();
    if (!selection || !selection.isCollapsed()) return { anchorNode: null, offset: 0 }

    const anchor = selection.anchor;
    const anchorNode = anchor.getNode();

    if (!lr(anchorNode)) return { anchorNode: null, offset: 0 }

    return { anchorNode, offset: anchor.offset }
  }

  #findLastIndexBeforeCursor(anchorNode, offset, stringToReplace) {
    const fullText = anchorNode.getTextContent();
    const textBeforeCursor = fullText.slice(0, offset);
    return textBeforeCursor.lastIndexOf(stringToReplace)
  }

  #performTextReplacement(anchorNode, offset, lastIndex, replacementNodes) {
    const fullText = anchorNode.getTextContent();
    const textBeforeString = fullText.slice(0, lastIndex);
    const textAfterCursor = fullText.slice(offset);

    const textNodeBefore = sr(textBeforeString);
    const textNodeAfter = sr(textAfterCursor || " ");

    anchorNode.replace(textNodeBefore);

    const lastInsertedNode = this.#insertReplacementNodes(textNodeBefore, replacementNodes);
    lastInsertedNode.insertAfter(textNodeAfter);

    this.#appendLineBreakIfNeeded(textNodeAfter.getParentOrThrow());
    const cursorOffset = textAfterCursor ? 0 : 1;
    textNodeAfter.select(cursorOffset, cursorOffset);
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
    if (Ii(paragraph) && !this.editorElement.isSingleLineMode) {
      const children = paragraph.getChildren();
      const last = children[children.length - 1];
      const beforeLast = children[children.length - 2];

      if (lr(last) && last.getTextContent() === "" && (beforeLast && !lr(beforeLast))) {
        paragraph.append(Jn());
      }
    }
  }

  #createCustomAttachmentNodeWithHtml(html, options = {}) {
    const attachmentConfig = typeof options === "object" ? options : {};

    return new CustomActionTextAttachmentNode({
      sgid: attachmentConfig.sgid || null,
      contentType: "text/html",
      innerHtml: html
    })
  }

  #createHtmlNodeWith(html) {
    const htmlNodes = m$1(this.editor, parseHtml(html));
    return htmlNodes[0] || Li()
  }

  #shouldUploadFile(file) {
    return dispatch(this.editorElement, "lexxy:file-accept", { file }, true)
  }
}

/**
 * marked v16.4.1 - a markdown parser
 * Copyright (c) 2011-2025, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */

function L(){return {async:false,breaks:false,extensions:null,gfm:true,hooks:null,pedantic:false,renderer:null,silent:false,tokenizer:null,walkTokens:null}}var T=L();function G(u){T=u;}var I={exec:()=>null};function h(u,e=""){let t=typeof u=="string"?u:u.source,n={replace:(r,i)=>{let s=typeof i=="string"?i:i.source;return s=s.replace(m.caret,"$1"),t=t.replace(r,s),n},getRegex:()=>new RegExp(t,e)};return n}var m={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] /,listReplaceTask:/^\[[ xX]\] +/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:u=>new RegExp(`^( {0,3}${u})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:u=>new RegExp(`^ {0,${Math.min(3,u-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:u=>new RegExp(`^ {0,${Math.min(3,u-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:u=>new RegExp(`^ {0,${Math.min(3,u-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:u=>new RegExp(`^ {0,${Math.min(3,u-1)}}#`),htmlBeginRegex:u=>new RegExp(`^ {0,${Math.min(3,u-1)}}<(?:[a-z].*>|!--)`,"i")},be=/^(?:[ \t]*(?:\n|$))+/,Re=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Te=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,E=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Oe=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,F=/(?:[*+-]|\d{1,9}[.)])/,ie=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,oe=h(ie).replace(/bull/g,F).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),we=h(ie).replace(/bull/g,F).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),j=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,ye=/^[^\n]+/,Q=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,Pe=h(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",Q).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),Se=h(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,F).getRegex(),v="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",U=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,$e=h("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",U).replace("tag",v).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),ae=h(j).replace("hr",E).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex(),_e=h(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",ae).getRegex(),K={blockquote:_e,code:Re,def:Pe,fences:Te,heading:Oe,hr:E,html:$e,lheading:oe,list:Se,newline:be,paragraph:ae,table:I,text:ye},re=h("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",E).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex(),Le={...K,lheading:we,table:re,paragraph:h(j).replace("hr",E).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",re).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex()},Me={...K,html:h(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",U).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:I,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:h(j).replace("hr",E).replace("heading",` *#{1,6} *[^
]`).replace("lheading",oe).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},ze=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,Ae=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,le=/^( {2,}|\\)\n(?!\s*$)/,Ie=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,D=/[\p{P}\p{S}]/u,W=/[\s\p{P}\p{S}]/u,ue=/[^\s\p{P}\p{S}]/u,Ee=h(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,W).getRegex(),pe=/(?!~)[\p{P}\p{S}]/u,Ce=/(?!~)[\s\p{P}\p{S}]/u,Be=/(?:[^\s\p{P}\p{S}]|~)/u,qe=h(/link|code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<!`)(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("code",/(?<!`)(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),ce=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,ve=h(ce,"u").replace(/punct/g,D).getRegex(),De=h(ce,"u").replace(/punct/g,pe).getRegex(),he="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",He=h(he,"gu").replace(/notPunctSpace/g,ue).replace(/punctSpace/g,W).replace(/punct/g,D).getRegex(),Ze=h(he,"gu").replace(/notPunctSpace/g,Be).replace(/punctSpace/g,Ce).replace(/punct/g,pe).getRegex(),Ge=h("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,ue).replace(/punctSpace/g,W).replace(/punct/g,D).getRegex(),Ne=h(/\\(punct)/,"gu").replace(/punct/g,D).getRegex(),Fe=h(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),je=h(U).replace("(?:-->|$)","-->").getRegex(),Qe=h("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",je).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),q=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,Ue=h(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",q).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),de=h(/^!?\[(label)\]\[(ref)\]/).replace("label",q).replace("ref",Q).getRegex(),ke=h(/^!?\[(ref)\](?:\[\])?/).replace("ref",Q).getRegex(),Ke=h("reflink|nolink(?!\\()","g").replace("reflink",de).replace("nolink",ke).getRegex(),se=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,X={_backpedal:I,anyPunctuation:Ne,autolink:Fe,blockSkip:qe,br:le,code:Ae,del:I,emStrongLDelim:ve,emStrongRDelimAst:He,emStrongRDelimUnd:Ge,escape:ze,link:Ue,nolink:ke,punctuation:Ee,reflink:de,reflinkSearch:Ke,tag:Qe,text:Ie,url:I},We={...X,link:h(/^!?\[(label)\]\((.*?)\)/).replace("label",q).getRegex(),reflink:h(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",q).getRegex()},N={...X,emStrongRDelimAst:Ze,emStrongLDelim:De,url:h(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",se).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:h(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",se).getRegex()},Xe={...N,br:h(le).replace("{2,}","*").getRegex(),text:h(N.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},C={normal:K,gfm:Le,pedantic:Me},M={normal:X,gfm:N,breaks:Xe,pedantic:We};var Je={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},ge=u=>Je[u];function w(u,e){if(e){if(m.escapeTest.test(u))return u.replace(m.escapeReplace,ge)}else if(m.escapeTestNoEncode.test(u))return u.replace(m.escapeReplaceNoEncode,ge);return u}function J(u){try{u=encodeURI(u).replace(m.percentDecode,"%");}catch{return null}return u}function V(u,e){let t=u.replace(m.findPipe,(i,s,o)=>{let a=false,l=s;for(;--l>=0&&o[l]==="\\";)a=!a;return a?"|":" |"}),n=t.split(m.splitPipe),r=0;if(n[0].trim()||n.shift(),n.length>0&&!n.at(-1)?.trim()&&n.pop(),e)if(n.length>e)n.splice(e);else for(;n.length<e;)n.push("");for(;r<n.length;r++)n[r]=n[r].trim().replace(m.slashPipe,"|");return n}function z(u,e,t){let n=u.length;if(n===0)return "";let r=0;for(;r<n;){let i=u.charAt(n-r-1);if(i===e&&true)r++;else break}return u.slice(0,n-r)}function fe(u,e){if(u.indexOf(e[1])===-1)return  -1;let t=0;for(let n=0;n<u.length;n++)if(u[n]==="\\")n++;else if(u[n]===e[0])t++;else if(u[n]===e[1]&&(t--,t<0))return n;return t>0?-2:-1}function me(u,e,t,n,r){let i=e.href,s=e.title||null,o=u[1].replace(r.other.outputLinkReplace,"$1");n.state.inLink=true;let a={type:u[0].charAt(0)==="!"?"image":"link",raw:t,href:i,title:s,text:o,tokens:n.inlineTokens(o)};return n.state.inLink=false,a}function Ve(u,e,t){let n=u.match(t.other.indentCodeCompensation);if(n===null)return e;let r=n[1];return e.split(`
`).map(i=>{let s=i.match(t.other.beginningSpace);if(s===null)return i;let[o]=s;return o.length>=r.length?i.slice(r.length):i}).join(`
`)}var y=class{options;rules;lexer;constructor(e){this.options=e||T;}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return {type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let n=t[0].replace(this.rules.other.codeRemoveIndent,"");return {type:"code",raw:t[0],codeBlockStyle:"indented",text:this.options.pedantic?n:z(n,`
`)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let n=t[0],r=Ve(n,t[3]||"",this.rules);return {type:"code",raw:n,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:r}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let n=t[2].trim();if(this.rules.other.endingHash.test(n)){let r=z(n,"#");(this.options.pedantic||!r||this.rules.other.endingSpaceChar.test(r))&&(n=r.trim());}return {type:"heading",raw:t[0],depth:t[1].length,text:n,tokens:this.lexer.inline(n)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return {type:"hr",raw:z(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let n=z(t[0],`
`).split(`
`),r="",i="",s=[];for(;n.length>0;){let o=false,a=[],l;for(l=0;l<n.length;l++)if(this.rules.other.blockquoteStart.test(n[l]))a.push(n[l]),o=true;else if(!o)a.push(n[l]);else break;n=n.slice(l);let c=a.join(`
`),p=c.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");r=r?`${r}
${c}`:c,i=i?`${i}
${p}`:p;let g=this.lexer.state.top;if(this.lexer.state.top=true,this.lexer.blockTokens(p,s,true),this.lexer.state.top=g,n.length===0)break;let d=s.at(-1);if(d?.type==="code")break;if(d?.type==="blockquote"){let R=d,f=R.raw+`
`+n.join(`
`),O=this.blockquote(f);s[s.length-1]=O,r=r.substring(0,r.length-R.raw.length)+O.raw,i=i.substring(0,i.length-R.text.length)+O.text;break}else if(d?.type==="list"){let R=d,f=R.raw+`
`+n.join(`
`),O=this.list(f);s[s.length-1]=O,r=r.substring(0,r.length-d.raw.length)+O.raw,i=i.substring(0,i.length-R.raw.length)+O.raw,n=f.substring(s.at(-1).raw.length).split(`
`);continue}}return {type:"blockquote",raw:r,tokens:s,text:i}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim(),r=n.length>1,i={type:"list",raw:"",ordered:r,start:r?+n.slice(0,-1):"",loose:false,items:[]};n=r?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=r?n:"[*+-]");let s=this.rules.other.listItemRegex(n),o=false;for(;e;){let l=false,c="",p="";if(!(t=s.exec(e))||this.rules.block.hr.test(e))break;c=t[0],e=e.substring(c.length);let g=t[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,H=>" ".repeat(3*H.length)),d=e.split(`
`,1)[0],R=!g.trim(),f=0;if(this.options.pedantic?(f=2,p=g.trimStart()):R?f=t[1].length+1:(f=t[2].search(this.rules.other.nonSpaceChar),f=f>4?1:f,p=g.slice(f),f+=t[1].length),R&&this.rules.other.blankLine.test(d)&&(c+=d+`
`,e=e.substring(d.length+1),l=true),!l){let H=this.rules.other.nextBulletRegex(f),ee=this.rules.other.hrRegex(f),te=this.rules.other.fencesBeginRegex(f),ne=this.rules.other.headingBeginRegex(f),xe=this.rules.other.htmlBeginRegex(f);for(;e;){let Z=e.split(`
`,1)[0],A;if(d=Z,this.options.pedantic?(d=d.replace(this.rules.other.listReplaceNesting,"  "),A=d):A=d.replace(this.rules.other.tabCharGlobal,"    "),te.test(d)||ne.test(d)||xe.test(d)||H.test(d)||ee.test(d))break;if(A.search(this.rules.other.nonSpaceChar)>=f||!d.trim())p+=`
`+A.slice(f);else {if(R||g.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||te.test(g)||ne.test(g)||ee.test(g))break;p+=`
`+d;}!R&&!d.trim()&&(R=true),c+=Z+`
`,e=e.substring(Z.length+1),g=A.slice(f);}}i.loose||(o?i.loose=true:this.rules.other.doubleBlankLine.test(c)&&(o=true));let O=null,Y;this.options.gfm&&(O=this.rules.other.listIsTask.exec(p),O&&(Y=O[0]!=="[ ] ",p=p.replace(this.rules.other.listReplaceTask,""))),i.items.push({type:"list_item",raw:c,task:!!O,checked:Y,loose:false,text:p,tokens:[]}),i.raw+=c;}let a=i.items.at(-1);if(a)a.raw=a.raw.trimEnd(),a.text=a.text.trimEnd();else return;i.raw=i.raw.trimEnd();for(let l=0;l<i.items.length;l++)if(this.lexer.state.top=false,i.items[l].tokens=this.lexer.blockTokens(i.items[l].text,[]),!i.loose){let c=i.items[l].tokens.filter(g=>g.type==="space"),p=c.length>0&&c.some(g=>this.rules.other.anyLine.test(g.raw));i.loose=p;}if(i.loose)for(let l=0;l<i.items.length;l++)i.items[l].loose=true;return i}}html(e){let t=this.rules.block.html.exec(e);if(t)return {type:"html",block:true,raw:t[0],pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:t[0]}}def(e){let t=this.rules.block.def.exec(e);if(t){let n=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),r=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",i=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return {type:"def",tag:n,raw:t[0],href:r,title:i}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let n=V(t[1]),r=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),i=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],s={type:"table",raw:t[0],header:[],align:[],rows:[]};if(n.length===r.length){for(let o of r)this.rules.other.tableAlignRight.test(o)?s.align.push("right"):this.rules.other.tableAlignCenter.test(o)?s.align.push("center"):this.rules.other.tableAlignLeft.test(o)?s.align.push("left"):s.align.push(null);for(let o=0;o<n.length;o++)s.header.push({text:n[o],tokens:this.lexer.inline(n[o]),header:true,align:s.align[o]});for(let o of i)s.rows.push(V(o,s.header.length).map((a,l)=>({text:a,tokens:this.lexer.inline(a),header:false,align:s.align[l]})));return s}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t)return {type:"heading",raw:t[0],depth:t[2].charAt(0)==="="?1:2,text:t[1],tokens:this.lexer.inline(t[1])}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let n=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return {type:"paragraph",raw:t[0],text:n,tokens:this.lexer.inline(n)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return {type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return {type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return !this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=true:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=false),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=true:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=false),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:false,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let n=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(n)){if(!this.rules.other.endAngleBracket.test(n))return;let s=z(n.slice(0,-1),"\\");if((n.length-s.length)%2===0)return}else {let s=fe(t[2],"()");if(s===-2)return;if(s>-1){let a=(t[0].indexOf("!")===0?5:4)+t[1].length+s;t[2]=t[2].substring(0,s),t[0]=t[0].substring(0,a).trim(),t[3]="";}}let r=t[2],i="";if(this.options.pedantic){let s=this.rules.other.pedanticHrefTitle.exec(r);s&&(r=s[1],i=s[3]);}else i=t[3]?t[3].slice(1,-1):"";return r=r.trim(),this.rules.other.startAngleBracket.test(r)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(n)?r=r.slice(1):r=r.slice(1,-1)),me(t,{href:r&&r.replace(this.rules.inline.anyPunctuation,"$1"),title:i&&i.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){let r=(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal," "),i=t[r.toLowerCase()];if(!i){let s=n[0].charAt(0);return {type:"text",raw:s,text:s}}return me(n,i,n[0],this.lexer,this.rules)}}emStrong(e,t,n=""){let r=this.rules.inline.emStrongLDelim.exec(e);if(!r||r[3]&&n.match(this.rules.other.unicodeAlphaNumeric))return;if(!(r[1]||r[2]||"")||!n||this.rules.inline.punctuation.exec(n)){let s=[...r[0]].length-1,o,a,l=s,c=0,p=r[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(p.lastIndex=0,t=t.slice(-1*e.length+s);(r=p.exec(t))!=null;){if(o=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!o)continue;if(a=[...o].length,r[3]||r[4]){l+=a;continue}else if((r[5]||r[6])&&s%3&&!((s+a)%3)){c+=a;continue}if(l-=a,l>0)continue;a=Math.min(a,a+l+c);let g=[...r[0]][0].length,d=e.slice(0,s+r.index+g+a);if(Math.min(s,a)%2){let f=d.slice(1,-1);return {type:"em",raw:d,text:f,tokens:this.lexer.inlineTokens(f)}}let R=d.slice(2,-2);return {type:"strong",raw:d,text:R,tokens:this.lexer.inlineTokens(R)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let n=t[2].replace(this.rules.other.newLineCharGlobal," "),r=this.rules.other.nonSpaceChar.test(n),i=this.rules.other.startingSpaceChar.test(n)&&this.rules.other.endingSpaceChar.test(n);return r&&i&&(n=n.substring(1,n.length-1)),{type:"codespan",raw:t[0],text:n}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return {type:"br",raw:t[0]}}del(e){let t=this.rules.inline.del.exec(e);if(t)return {type:"del",raw:t[0],text:t[2],tokens:this.lexer.inlineTokens(t[2])}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let n,r;return t[2]==="@"?(n=t[1],r="mailto:"+n):(n=t[1],r=n),{type:"link",raw:t[0],text:n,href:r,tokens:[{type:"text",raw:n,text:n}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let n,r;if(t[2]==="@")n=t[0],r="mailto:"+n;else {let i;do i=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??"";while(i!==t[0]);n=t[0],t[1]==="www."?r="http://"+t[0]:r=t[0];}return {type:"link",raw:t[0],text:n,href:r,tokens:[{type:"text",raw:n,text:n}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let n=this.lexer.state.inRawBlock;return {type:"text",raw:t[0],text:t[0],escaped:n}}}};var x=class u{tokens;options;state;tokenizer;inlineQueue;constructor(e){this.tokens=[],this.tokens.links=Object.create(null),this.options=e||T,this.options.tokenizer=this.options.tokenizer||new y,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:false,inRawBlock:false,top:true};let t={other:m,block:C.normal,inline:M.normal};this.options.pedantic?(t.block=C.pedantic,t.inline=M.pedantic):this.options.gfm&&(t.block=C.gfm,this.options.breaks?t.inline=M.breaks:t.inline=M.gfm),this.tokenizer.rules=t;}static get rules(){return {block:C,inline:M}}static lex(e,t){return new u(t).lex(e)}static lexInline(e,t){return new u(t).inlineTokens(e)}lex(e){e=e.replace(m.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let t=0;t<this.inlineQueue.length;t++){let n=this.inlineQueue[t];this.inlineTokens(n.src,n.tokens);}return this.inlineQueue=[],this.tokens}blockTokens(e,t=[],n=false){for(this.options.pedantic&&(e=e.replace(m.tabCharGlobal,"    ").replace(m.spaceLine,""));e;){let r;if(this.options.extensions?.block?.some(s=>(r=s.call({lexer:this},e,t))?(e=e.substring(r.raw.length),t.push(r),true):false))continue;if(r=this.tokenizer.space(e)){e=e.substring(r.raw.length);let s=t.at(-1);r.raw.length===1&&s!==void 0?s.raw+=`
`:t.push(r);continue}if(r=this.tokenizer.code(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="paragraph"||s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.at(-1).src=s.text):t.push(r);continue}if(r=this.tokenizer.fences(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.heading(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.hr(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.blockquote(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.list(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.html(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.def(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="paragraph"||s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.raw,this.inlineQueue.at(-1).src=s.text):this.tokens.links[r.tag]||(this.tokens.links[r.tag]={href:r.href,title:r.title},t.push(r));continue}if(r=this.tokenizer.table(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.lheading(e)){e=e.substring(r.raw.length),t.push(r);continue}let i=e;if(this.options.extensions?.startBlock){let s=1/0,o=e.slice(1),a;this.options.extensions.startBlock.forEach(l=>{a=l.call({lexer:this},o),typeof a=="number"&&a>=0&&(s=Math.min(s,a));}),s<1/0&&s>=0&&(i=e.substring(0,s+1));}if(this.state.top&&(r=this.tokenizer.paragraph(i))){let s=t.at(-1);n&&s?.type==="paragraph"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=s.text):t.push(r),n=i.length!==e.length,e=e.substring(r.raw.length);continue}if(r=this.tokenizer.text(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=s.text):t.push(r);continue}if(e){let s="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(s);break}else throw new Error(s)}}return this.state.top=true,t}inline(e,t=[]){return this.inlineQueue.push({src:e,tokens:t}),t}inlineTokens(e,t=[]){let n=e,r=null;if(this.tokens.links){let o=Object.keys(this.tokens.links);if(o.length>0)for(;(r=this.tokenizer.rules.inline.reflinkSearch.exec(n))!=null;)o.includes(r[0].slice(r[0].lastIndexOf("[")+1,-1))&&(n=n.slice(0,r.index)+"["+"a".repeat(r[0].length-2)+"]"+n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));}for(;(r=this.tokenizer.rules.inline.anyPunctuation.exec(n))!=null;)n=n.slice(0,r.index)+"++"+n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);for(;(r=this.tokenizer.rules.inline.blockSkip.exec(n))!=null;)n=n.slice(0,r.index)+"["+"a".repeat(r[0].length-2)+"]"+n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);n=this.options.hooks?.emStrongMask?.call({lexer:this},n)??n;let i=false,s="";for(;e;){i||(s=""),i=false;let o;if(this.options.extensions?.inline?.some(l=>(o=l.call({lexer:this},e,t))?(e=e.substring(o.raw.length),t.push(o),true):false))continue;if(o=this.tokenizer.escape(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.tag(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.link(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(o.raw.length);let l=t.at(-1);o.type==="text"&&l?.type==="text"?(l.raw+=o.raw,l.text+=o.text):t.push(o);continue}if(o=this.tokenizer.emStrong(e,n,s)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.codespan(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.br(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.del(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.autolink(e)){e=e.substring(o.raw.length),t.push(o);continue}if(!this.state.inLink&&(o=this.tokenizer.url(e))){e=e.substring(o.raw.length),t.push(o);continue}let a=e;if(this.options.extensions?.startInline){let l=1/0,c=e.slice(1),p;this.options.extensions.startInline.forEach(g=>{p=g.call({lexer:this},c),typeof p=="number"&&p>=0&&(l=Math.min(l,p));}),l<1/0&&l>=0&&(a=e.substring(0,l+1));}if(o=this.tokenizer.inlineText(a)){e=e.substring(o.raw.length),o.raw.slice(-1)!=="_"&&(s=o.raw.slice(-1)),i=true;let l=t.at(-1);l?.type==="text"?(l.raw+=o.raw,l.text+=o.text):t.push(o);continue}if(e){let l="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(l);break}else throw new Error(l)}}return t}};var P=class{options;parser;constructor(e){this.options=e||T;}space(e){return ""}code({text:e,lang:t,escaped:n}){let r=(t||"").match(m.notSpaceStart)?.[0],i=e.replace(m.endingNewline,"")+`
`;return r?'<pre><code class="language-'+w(r)+'">'+(n?i:w(i,true))+`</code></pre>
`:"<pre><code>"+(n?i:w(i,true))+`</code></pre>
`}blockquote({tokens:e}){return `<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return ""}heading({tokens:e,depth:t}){return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return `<hr>
`}list(e){let t=e.ordered,n=e.start,r="";for(let o=0;o<e.items.length;o++){let a=e.items[o];r+=this.listitem(a);}let i=t?"ol":"ul",s=t&&n!==1?' start="'+n+'"':"";return "<"+i+s+`>
`+r+"</"+i+`>
`}listitem(e){let t="";if(e.task){let n=this.checkbox({checked:!!e.checked});e.loose?e.tokens[0]?.type==="paragraph"?(e.tokens[0].text=n+" "+e.tokens[0].text,e.tokens[0].tokens&&e.tokens[0].tokens.length>0&&e.tokens[0].tokens[0].type==="text"&&(e.tokens[0].tokens[0].text=n+" "+w(e.tokens[0].tokens[0].text),e.tokens[0].tokens[0].escaped=true)):e.tokens.unshift({type:"text",raw:n+" ",text:n+" ",escaped:true}):t+=n+" ";}return t+=this.parser.parse(e.tokens,!!e.loose),`<li>${t}</li>
`}checkbox({checked:e}){return "<input "+(e?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph({tokens:e}){return `<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",n="";for(let i=0;i<e.header.length;i++)n+=this.tablecell(e.header[i]);t+=this.tablerow({text:n});let r="";for(let i=0;i<e.rows.length;i++){let s=e.rows[i];n="";for(let o=0;o<s.length;o++)n+=this.tablecell(s[o]);r+=this.tablerow({text:n});}return r&&(r=`<tbody>${r}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+r+`</table>
`}tablerow({text:e}){return `<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),n=e.header?"th":"td";return (e.align?`<${n} align="${e.align}">`:`<${n}>`)+t+`</${n}>
`}strong({tokens:e}){return `<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return `<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return `<code>${w(e,true)}</code>`}br(e){return "<br>"}del({tokens:e}){return `<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:n}){let r=this.parser.parseInline(n),i=J(e);if(i===null)return r;e=i;let s='<a href="'+e+'"';return t&&(s+=' title="'+w(t)+'"'),s+=">"+r+"</a>",s}image({href:e,title:t,text:n,tokens:r}){r&&(n=this.parser.parseInline(r,this.parser.textRenderer));let i=J(e);if(i===null)return w(n);e=i;let s=`<img src="${e}" alt="${n}"`;return t&&(s+=` title="${w(t)}"`),s+=">",s}text(e){return "tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:w(e.text)}};var $=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return ""+e}image({text:e}){return ""+e}br(){return ""}};var b=class u{options;renderer;textRenderer;constructor(e){this.options=e||T,this.options.renderer=this.options.renderer||new P,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new $;}static parse(e,t){return new u(t).parse(e)}static parseInline(e,t){return new u(t).parseInline(e)}parse(e,t=true){let n="";for(let r=0;r<e.length;r++){let i=e[r];if(this.options.extensions?.renderers?.[i.type]){let o=i,a=this.options.extensions.renderers[o.type].call({parser:this},o);if(a!==false||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(o.type)){n+=a||"";continue}}let s=i;switch(s.type){case "space":{n+=this.renderer.space(s);continue}case "hr":{n+=this.renderer.hr(s);continue}case "heading":{n+=this.renderer.heading(s);continue}case "code":{n+=this.renderer.code(s);continue}case "table":{n+=this.renderer.table(s);continue}case "blockquote":{n+=this.renderer.blockquote(s);continue}case "list":{n+=this.renderer.list(s);continue}case "html":{n+=this.renderer.html(s);continue}case "def":{n+=this.renderer.def(s);continue}case "paragraph":{n+=this.renderer.paragraph(s);continue}case "text":{let o=s,a=this.renderer.text(o);for(;r+1<e.length&&e[r+1].type==="text";)o=e[++r],a+=`
`+this.renderer.text(o);t?n+=this.renderer.paragraph({type:"paragraph",raw:a,text:a,tokens:[{type:"text",raw:a,text:a,escaped:true}]}):n+=a;continue}default:{let o='Token with "'+s.type+'" type was not found.';if(this.options.silent)return console.error(o),"";throw new Error(o)}}}return n}parseInline(e,t=this.renderer){let n="";for(let r=0;r<e.length;r++){let i=e[r];if(this.options.extensions?.renderers?.[i.type]){let o=this.options.extensions.renderers[i.type].call({parser:this},i);if(o!==false||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(i.type)){n+=o||"";continue}}let s=i;switch(s.type){case "escape":{n+=t.text(s);break}case "html":{n+=t.html(s);break}case "link":{n+=t.link(s);break}case "image":{n+=t.image(s);break}case "strong":{n+=t.strong(s);break}case "em":{n+=t.em(s);break}case "codespan":{n+=t.codespan(s);break}case "br":{n+=t.br(s);break}case "del":{n+=t.del(s);break}case "text":{n+=t.text(s);break}default:{let o='Token with "'+s.type+'" type was not found.';if(this.options.silent)return console.error(o),"";throw new Error(o)}}}return n}};var S=class{options;block;constructor(e){this.options=e||T;}static passThroughHooks=new Set(["preprocess","postprocess","processAllTokens","emStrongMask"]);static passThroughHooksRespectAsync=new Set(["preprocess","postprocess","processAllTokens"]);preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(){return this.block?x.lex:x.lexInline}provideParser(){return this.block?b.parse:b.parseInline}};var B=class{defaults=L();options=this.setOptions;parse=this.parseMarkdown(true);parseInline=this.parseMarkdown(false);Parser=b;Renderer=P;TextRenderer=$;Lexer=x;Tokenizer=y;Hooks=S;constructor(...e){this.use(...e);}walkTokens(e,t){let n=[];for(let r of e)switch(n=n.concat(t.call(this,r)),r.type){case "table":{let i=r;for(let s of i.header)n=n.concat(this.walkTokens(s.tokens,t));for(let s of i.rows)for(let o of s)n=n.concat(this.walkTokens(o.tokens,t));break}case "list":{let i=r;n=n.concat(this.walkTokens(i.items,t));break}default:{let i=r;this.defaults.extensions?.childTokens?.[i.type]?this.defaults.extensions.childTokens[i.type].forEach(s=>{let o=i[s].flat(1/0);n=n.concat(this.walkTokens(o,t));}):i.tokens&&(n=n.concat(this.walkTokens(i.tokens,t)));}}return n}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(n=>{let r={...n};if(r.async=this.defaults.async||r.async||false,n.extensions&&(n.extensions.forEach(i=>{if(!i.name)throw new Error("extension name required");if("renderer"in i){let s=t.renderers[i.name];s?t.renderers[i.name]=function(...o){let a=i.renderer.apply(this,o);return a===false&&(a=s.apply(this,o)),a}:t.renderers[i.name]=i.renderer;}if("tokenizer"in i){if(!i.level||i.level!=="block"&&i.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let s=t[i.level];s?s.unshift(i.tokenizer):t[i.level]=[i.tokenizer],i.start&&(i.level==="block"?t.startBlock?t.startBlock.push(i.start):t.startBlock=[i.start]:i.level==="inline"&&(t.startInline?t.startInline.push(i.start):t.startInline=[i.start]));}"childTokens"in i&&i.childTokens&&(t.childTokens[i.name]=i.childTokens);}),r.extensions=t),n.renderer){let i=this.defaults.renderer||new P(this.defaults);for(let s in n.renderer){if(!(s in i))throw new Error(`renderer '${s}' does not exist`);if(["options","parser"].includes(s))continue;let o=s,a=n.renderer[o],l=i[o];i[o]=(...c)=>{let p=a.apply(i,c);return p===false&&(p=l.apply(i,c)),p||""};}r.renderer=i;}if(n.tokenizer){let i=this.defaults.tokenizer||new y(this.defaults);for(let s in n.tokenizer){if(!(s in i))throw new Error(`tokenizer '${s}' does not exist`);if(["options","rules","lexer"].includes(s))continue;let o=s,a=n.tokenizer[o],l=i[o];i[o]=(...c)=>{let p=a.apply(i,c);return p===false&&(p=l.apply(i,c)),p};}r.tokenizer=i;}if(n.hooks){let i=this.defaults.hooks||new S;for(let s in n.hooks){if(!(s in i))throw new Error(`hook '${s}' does not exist`);if(["options","block"].includes(s))continue;let o=s,a=n.hooks[o],l=i[o];S.passThroughHooks.has(s)?i[o]=c=>{if(this.defaults.async&&S.passThroughHooksRespectAsync.has(s))return (async()=>{let g=await a.call(i,c);return l.call(i,g)})();let p=a.call(i,c);return l.call(i,p)}:i[o]=(...c)=>{if(this.defaults.async)return (async()=>{let g=await a.apply(i,c);return g===false&&(g=await l.apply(i,c)),g})();let p=a.apply(i,c);return p===false&&(p=l.apply(i,c)),p};}r.hooks=i;}if(n.walkTokens){let i=this.defaults.walkTokens,s=n.walkTokens;r.walkTokens=function(o){let a=[];return a.push(s.call(this,o)),i&&(a=a.concat(i.call(this,o))),a};}this.defaults={...this.defaults,...r};}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return x.lex(e,t??this.defaults)}parser(e,t){return b.parse(e,t??this.defaults)}parseMarkdown(e){return (n,r)=>{let i={...r},s={...this.defaults,...i},o=this.onError(!!s.silent,!!s.async);if(this.defaults.async===true&&i.async===false)return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof n>"u"||n===null)return o(new Error("marked(): input parameter is undefined or null"));if(typeof n!="string")return o(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(n)+", string expected"));if(s.hooks&&(s.hooks.options=s,s.hooks.block=e),s.async)return (async()=>{let a=s.hooks?await s.hooks.preprocess(n):n,c=await(s.hooks?await s.hooks.provideLexer():e?x.lex:x.lexInline)(a,s),p=s.hooks?await s.hooks.processAllTokens(c):c;s.walkTokens&&await Promise.all(this.walkTokens(p,s.walkTokens));let d=await(s.hooks?await s.hooks.provideParser():e?b.parse:b.parseInline)(p,s);return s.hooks?await s.hooks.postprocess(d):d})().catch(o);try{s.hooks&&(n=s.hooks.preprocess(n));let l=(s.hooks?s.hooks.provideLexer():e?x.lex:x.lexInline)(n,s);s.hooks&&(l=s.hooks.processAllTokens(l)),s.walkTokens&&this.walkTokens(l,s.walkTokens);let p=(s.hooks?s.hooks.provideParser():e?b.parse:b.parseInline)(l,s);return s.hooks&&(p=s.hooks.postprocess(p)),p}catch(a){return o(a)}}}onError(e,t){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let r="<p>An error occurred:</p><pre>"+w(n.message+"",true)+"</pre>";return t?Promise.resolve(r):r}if(t)return Promise.reject(n);throw n}}};var _=new B;function k(u,e){return _.parse(u,e)}k.options=k.setOptions=function(u){return _.setOptions(u),k.defaults=_.defaults,G(k.defaults),k};k.getDefaults=L;k.defaults=T;k.use=function(...u){return _.use(...u),k.defaults=_.defaults,G(k.defaults),k};k.walkTokens=function(u,e){return _.walkTokens(u,e)};k.parseInline=_.parseInline;k.Parser=b;k.parser=b.parse;k.Renderer=P;k.TextRenderer=$;k.Lexer=x;k.lexer=x.lex;k.Tokenizer=y;k.Hooks=S;k.parse=k;k.options;k.setOptions;k.use;k.walkTokens;k.parseInline;b.parse;x.lex;

function isUrl(string) {
  try {
    new URL(string);
    return true
  } catch {
    return false
  }
}

function normalizeFilteredText(string) {
  return string
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
}

function filterMatches(text, potentialMatch) {
  return normalizeFilteredText(text).includes(normalizeFilteredText(potentialMatch))
}

class Clipboard {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
    this.contents = editorElement.contents;
  }

  paste(event) {
    const clipboardData = event.clipboardData;

    if (!clipboardData) return false

    if (this.#isOnlyPlainTextPasted(clipboardData) && !this.#isPastingIntoCodeBlock()) {
      this.#pastePlainText(clipboardData);
      event.preventDefault();
      return true
    }

    this.#handlePastedFiles(clipboardData);
  }

  #isOnlyPlainTextPasted(clipboardData) {
    const types = Array.from(clipboardData.types);
    return types.length === 1 && types[0] === "text/plain"
  }

  #isPastingIntoCodeBlock() {
    let result = false;

    this.editor.getEditorState().read(() => {
      const selection = Lr();
      if (!yr(selection)) return

      let currentNode = selection.anchor.getNode();

      while (currentNode) {
        if (X$1(currentNode)) {
          result = true;
          return
        }
        currentNode = currentNode.getParent();
      }
    });

    return result
  }

  #pastePlainText(clipboardData) {
    const item = clipboardData.items[0];
    item.getAsString((text) => {
      if (isUrl(text) && this.contents.hasSelectedText()) {
        this.contents.createLinkWithSelectedText(text);
      } else if (isUrl(text)) {
        const nodeKey = this.contents.createLink(text);
        this.#dispatchLinkInsertEvent(nodeKey, { url: text });
      } else {
        this.#pasteMarkdown(text);
      }
    });
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
    const html = k(text);
    this.contents.insertHtml(html);
  }

  #handlePastedFiles(clipboardData) {
    if (!this.editorElement.supportsAttachments) return

    const html = clipboardData.getData("text/html");
    if (html) return // Ignore if image copied from browser since we will load it as a remote image

    this.#preservingScrollPosition(() => {
      for (const item of clipboardData.items) {
        const file = item.getAsFile();
        if (!file) continue

        this.contents.uploadFile(file);
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

class Highlighter {
  constructor(editorElement) {
    this.editor = editorElement.editor;

    this.#registerHighlightTransform();
  }

  toggle(styles) {
    this.editor.update(() => {
      this.#toggleSelectionStyles(styles);
    });
  }

  remove() {
    this.toggle({ "color": null, "background-color": null });
  }

  #registerHighlightTransform() {
    return this.editor.registerNodeTransform(Xn, (textNode) => {
      this.#syncHighlightWithStyle(textNode);
    })
  }

  #toggleSelectionStyles(styles) {
    const selection = Lr();
    if (!yr(selection)) return

    const patch = {};
    for (const property in styles) {
      const oldValue = le$1(selection, property);
      patch[property] = this.#toggleOrReplace(oldValue, styles[property]);
    }

    U$5(selection, patch);
  }

  #toggleOrReplace(oldValue, newValue) {
    return oldValue === newValue ? null : newValue
  }

  #syncHighlightWithStyle(node) {
    if (hasHighlightStyles(node.getStyle()) !== node.hasFormat("highlight")) {
      node.toggleFormat("highlight");
    }
  }
}

class HighlightNode extends Xn {
  $config() {
    return this.config("highlight", { extends: Xn })
  }

  static importDOM() {
    return {
      mark: () => ({
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      })
    }
  }
}

function applyHighlightStyle(textNode, element) {
  const textColor = element.style?.color;
  const backgroundColor = element.style?.backgroundColor;

  let highlightStyle = "";
  if (textColor && textColor !== "") highlightStyle += `color: ${textColor};`;
  if (backgroundColor && backgroundColor !== "") highlightStyle += `background-color: ${backgroundColor};`;

  if (highlightStyle.length) {
    if (!textNode.hasFormat("highlight")) textNode.toggleFormat("highlight");
    return textNode.setStyle(textNode.getStyle() + highlightStyle)
  }
}

const TRIX_LANGUAGE_ATTR = "language";

class TrixTextNode extends Xn {
  $config() {
    return this.config("trix-text", { extends: Xn })
  }

  static importDOM() {
    return {
      // em, span, and strong elements are directly styled in trix
      em: (element) => onlyStyledElements(element, {
        conversion: extendTextNodeConversion("i", applyHighlightStyle),
        priority: 1
      }),
      span: (element) => onlyStyledElements(element, {
        conversion: extendTextNodeConversion("mark", applyHighlightStyle),
        priority: 1
      }),
      strong: (element) => onlyStyledElements(element, {
        conversion: extendTextNodeConversion("b", applyHighlightStyle),
        priority: 1
      }),
      // del => s
      del: () => ({
        conversion: extendTextNodeConversion("s", applyStrikethrough),
        priority: 1
      }),
      // read "language" attribute and normalize
      pre: (element) => onlyPreLanguageElements(element, {
        conversion: extendConversion(q$1, "pre", applyLanguage),
        priority: 1
      })
    }
  }
}

function onlyStyledElements(element, conversion) {
  const elementHighlighted = element.style.color !== "" || element.style.backgroundColor !== "";
  return elementHighlighted ? conversion : null
}

function applyStrikethrough(textNode, element) {
  if (!textNode.hasFormat("strikethrough")) textNode.toggleFormat("strikethrough");
  return applyHighlightStyle(textNode, element)
}

function onlyPreLanguageElements(element, conversion) {
  return element.hasAttribute(TRIX_LANGUAGE_ATTR) ? conversion : null
}

function applyLanguage(conversionOutput, element) {
  const language = dt(element.getAttribute(TRIX_LANGUAGE_ATTR));
  conversionOutput.node.setLanguage(language);
}

class LexicalEditorElement extends HTMLElement {
  static formAssociated = true
  static debug = true
  static commands = [ "bold", "italic", "strikethrough" ]

  static observedAttributes = [ "connected", "required" ]

  #initialValue = ""
  #validationTextArea = document.createElement("textarea")

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "presentation";
  }

  connectedCallback() {
    this.id ??= generateDomId("lexxy-editor");
    this.editor = this.#createEditor();
    this.contents = new Contents(this);
    this.selection = new Selection(this);
    this.clipboard = new Clipboard(this);
    this.highlighter = new Highlighter(this);

    CommandDispatcher.configureFor(this);
    this.#initialize();

    requestAnimationFrame(() => dispatch(this, "lexxy:initialize"));
    this.toggleAttribute("connected", true);

    this.valueBeforeDisconnect = null;
  }

  disconnectedCallback() {
    this.valueBeforeDisconnect = this.value;
    this.#reset(); // Prevent hangs with Safari when morphing
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect());
    }

    if (name === "required" && this.isConnected) {
      this.#validationTextArea.required = this.hasAttribute("required");
      this.#setValidity();
    }
  }

  formResetCallback() {
    this.value = this.#initialValue;
    this.editor.dispatchCommand(je$1, undefined);
  }

  get form() {
    return this.internals.form
  }

  get name() {
    return this.getAttribute("name")
  }

  get toolbarElement() {
    if (!this.#hasToolbar) return null

    this.toolbar = this.toolbar || this.#findOrCreateDefaultToolbar();
    return this.toolbar
  }

  get directUploadUrl() {
    return this.dataset.directUploadUrl
  }

  get blobUrlTemplate() {
    return this.dataset.blobUrlTemplate
  }

  get isSingleLineMode() {
    return this.hasAttribute("single-line")
  }

  get supportsAttachments() {
    return this.getAttribute("attachments") !== "false"
  }

  get contentTabIndex() {
    return parseInt(this.editorContentElement?.getAttribute("tabindex") ?? "0")
  }

  focus() {
    this.editor.focus();
  }

  get value() {
    if (!this.cachedValue) {
      this.editor?.getEditorState().read(() => {
        this.cachedValue = sanitize(g(this.editor, null));
      });
    }

    return this.cachedValue
  }

  set value(html) {
    this.editor.update(() => {
      ns(zn);
      const root = No();
      root.clear();
      if (html !== "") root.append(...this.#parseHtmlIntoLexicalNodes(html));
      root.select();

      this.#toggleEmptyStatus();

      // The first time you set the value, when the editor is empty, it seems to leave Lexical
      // in an inconsistent state until, at least, you focus. You can type but adding attachments
      // fails because no root node detected. This is a workaround to deal with the issue.
      requestAnimationFrame(() => this.editor?.update(() => { }));
    });
  }

  #parseHtmlIntoLexicalNodes(html) {
    if (!html) html = "<p></p>";
    const nodes = m$1(this.editor, parseHtml(`<div>${html}</div>`));
    // Custom decorator block elements such action-text-attachments get wrapped into <p> automatically by Lexical.
    // We flatten those.
    return nodes.map(node => {
      if (node.getType() === "paragraph" && node.getChildrenSize() === 1) {
        const child = node.getFirstChild();
        if (child instanceof ki && !child.isInline()) {
          return child
        }
      }
      return node
    })
  }

  #initialize() {
    this.#synchronizeWithChanges();
    this.#registerComponents();
    this.#listenForInvalidatedNodes();
    this.#handleEnter();
    this.#handleFocus();
    this.#attachDebugHooks();
    this.#attachToolbar();
    this.#loadInitialValue();
    this.#resetBeforeTurboCaches();
  }

  #createEditor() {
    this.editorContentElement = this.editorContentElement || this.#createEditorContentElement();

    const editor = $i({
      namespace: "LexicalEditor",
      onError(error) {
        throw error
      },
      theme: theme,
      nodes: this.#lexicalNodes
    });

    editor.setRootElement(this.editorContentElement);

    return editor
  }

  get #lexicalNodes() {
    const nodes = [
      TrixTextNode,
      HighlightNode,
      Et$2,
      Pt$2,
      lt$2,
      nt$2,
      q$1,
      et$1,
      y$1,
      A,
      HorizontalDividerNode,

      CustomActionTextAttachmentNode,
    ];

    if (this.supportsAttachments) {
      nodes.push(ActionTextAttachmentNode, ActionTextAttachmentUploadNode);
    }

    return nodes
  }

  #createEditorContentElement() {
    const editorContentElement = createElement("div", {
      classList: "lexxy-editor__content",
      contenteditable: true,
      role: "textbox",
      "aria-multiline": true,
      "aria-label": this.#labelText,
      placeholder: this.getAttribute("placeholder")
    });
    editorContentElement.id = `${this.id}-content`;
    this.#ariaAttributes.forEach(attribute => editorContentElement.setAttribute(attribute.name, attribute.value));
    this.appendChild(editorContentElement);

    if (this.getAttribute("tabindex")) {
      editorContentElement.setAttribute("tabindex", this.getAttribute("tabindex"));
      this.removeAttribute("tabindex");
    } else {
      editorContentElement.setAttribute("tabindex", 0);
    }

    return editorContentElement
  }

  get #labelText() {
    return Array.from(this.internals.labels).map(label => label.textContent).join(" ")
  }

  get #ariaAttributes() {
    return Array.from(this.attributes).filter(attribute => attribute.name.startsWith("aria-"))
  }

  set #internalFormValue(html) {
    const changed = this.#internalFormValue !== undefined && this.#internalFormValue !== this.value;

    this.internals.setFormValue(html);
    this._internalFormValue = html;
    this.#validationTextArea.value = this.#isEmpty ? "" : html;

    if (changed) {
      dispatch(this, "lexxy:change");
    }
  }

  get #internalFormValue() {
    return this._internalFormValue
  }

  #loadInitialValue() {
    const initialHtml = this.valueBeforeDisconnect || this.getAttribute("value") || "<p></p>";
    this.value = this.#initialValue = initialHtml;
  }

  #resetBeforeTurboCaches() {
    document.addEventListener("turbo:before-cache", this.#handleTurboBeforeCache);
  }

  #handleTurboBeforeCache = (event) => {
    this.#reset();
  }

  #synchronizeWithChanges() {
    this.#addUnregisterHandler(this.editor.registerUpdateListener(({ editorState }) => {
      this.cachedValue = null;
      this.#internalFormValue = this.value;
      this.#toggleEmptyStatus();
      this.#setValidity();
    }));
  }

  #addUnregisterHandler(handler) {
    this.unregisterHandlers = this.unregisterHandlers || [];
    this.unregisterHandlers.push(handler);
  }

  #unregisterHandlers() {
    this.unregisterHandlers?.forEach((handler) => {
      handler();
    });
    this.unregisterHandlers = null;
  }

  #registerComponents() {
    Jt(this.editor);
    this.historyState = w$1();
    b$1(this.editor, this.historyState, 20);
    bt$3(this.editor);
    this.#registerCodeHiglightingComponents();
    Dt(this.editor, zt);
  }

  #registerCodeHiglightingComponents() {
    Et$1(this.editor);
    this.append(createElement("lexxy-code-language-picker"));
  }

  #listenForInvalidatedNodes() {
    this.editor.getRootElement().addEventListener("lexxy:internal:invalidate-node", (event) => {
      const { key, values } = event.detail;

      this.editor.update(() => {
        const node = xo(key);

        if (node instanceof ActionTextAttachmentNode) {
          const updatedNode = node.getWritable();
          Object.assign(updatedNode, values);
        }
      });
    });
  }

  #handleEnter() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.editor.registerCommand(
      Ne$1,
      (event) => {
        // Prevent CTRL+ENTER
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          return true
        }

        // In single line mode, prevent ENTER
        if (this.isSingleLineMode) {
          event.preventDefault();
          return true
        }

        return false
      },
      Ri
    );
  }

  #handleFocus() {
    // Lexxy handles focus and blur as commands
    // see https://github.com/facebook/lexical/blob/d1a8e84fe9063a4f817655b346b6ff373aa107f0/packages/lexical/src/LexicalEvents.ts#L35
    // and https://stackoverflow.com/a/72212077
    this.editor.registerCommand(Ye, () => { dispatch(this, "lexxy:blur"); }, Ri);
    this.editor.registerCommand(Ve$1, () => { dispatch(this, "lexxy:focus"); }, Ri);
  }

  #attachDebugHooks() {
    if (!LexicalEditorElement.debug) return

    this.#addUnregisterHandler(this.editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        console.debug("HTML: ", this.value);
      });
    }));
  }

  #attachToolbar() {
    if (this.#hasToolbar) {
      this.toolbarElement.setEditor(this);
    }
  }

  #findOrCreateDefaultToolbar() {
    const toolbarId = this.getAttribute("toolbar");
    return toolbarId ? document.getElementById(toolbarId) : this.#createDefaultToolbar()
  }

  get #hasToolbar() {
    return this.getAttribute("toolbar") !== "false"
  }

  #createDefaultToolbar() {
    const toolbar = createElement("lexxy-toolbar");
    toolbar.innerHTML = LexicalToolbarElement.defaultTemplate;
    toolbar.setAttribute("data-attachments", this.supportsAttachments); // Drives toolbar CSS styles
    this.prepend(toolbar);
    return toolbar
  }

  #toggleEmptyStatus() {
    this.classList.toggle("lexxy-editor--empty", this.#isEmpty);
  }

  get #isEmpty() {
    return [ "<p><br></p>", "<p></p>", "" ].includes(this.value.trim())
  }

  #setValidity() {
    if (this.#validationTextArea.validity.valid) {
      this.internals.setValidity({});
    } else {
      this.internals.setValidity(this.#validationTextArea.validity, this.#validationTextArea.validationMessage, this.editorContentElement);
    }
  }

  #reset() {
    this.#unregisterHandlers();

    if (this.editorContentElement) {
      this.editorContentElement.remove();
      this.editorContentElement = null;
    }

    this.contents = null;
    this.editor = null;

    if (this.toolbar) {
      if (!this.getAttribute("toolbar")) { this.toolbar.remove(); }
      this.toolbar = null;
    }

    this.selection = null;

    document.removeEventListener("turbo:before-cache", this.#handleTurboBeforeCache);
  }

  #reconnect() {
    this.disconnectedCallback();
    this.valueBeforeDisconnect = null;
    this.connectedCallback();
  }
}

customElements.define("lexxy-editor", LexicalEditorElement);

class ToolbarDropdown extends HTMLElement {
  connectedCallback() {
    this.container = this.closest("details");

    this.container.addEventListener("toggle", this.#handleToggle.bind(this));
    this.container.addEventListener("keydown", this.#handleKeyDown.bind(this));

    this.#setTabIndexValues();
  }

  disconnectedCallback() {
    this.#removeClickOutsideHandler();
    this.container.removeEventListener("keydown", this.#handleKeyDown.bind(this));
  }

  get toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get editor() {
    return this.toolbar.editor
  }

  close() {
    this.container.removeAttribute("open");
  }

  #handleToggle(event) {
    if (this.container.open) {
      this.#handleOpen(event.target);
    } else {
      this.#handleClose();
    }
  }

  #handleOpen(trigger) {
    this.trigger = trigger;
    this.#interactiveElements[0].focus();
    this.#setupClickOutsideHandler();
  }

  #handleClose() {
    this.trigger = null;
    this.#removeClickOutsideHandler();
    this.editor.focus();
  }

  #setupClickOutsideHandler() {
    if (this.clickOutsideHandler) return

    this.clickOutsideHandler = this.#handleClickOutside.bind(this);
    document.addEventListener("click", this.clickOutsideHandler, true);
  }

  #removeClickOutsideHandler() {
    if (!this.clickOutsideHandler) return

    document.removeEventListener("click", this.clickOutsideHandler, true);
    this.clickOutsideHandler = null;
  }

  #handleClickOutside({ target }) {
    if (this.container.open && !this.container.contains(target)) this.close();
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      this.close();
    }
  }

  async #setTabIndexValues() {
    await nextFrame();
    this.#interactiveElements.forEach((element) => {
      element.setAttribute("tabindex", 0);
    });
  }

  get #interactiveElements() {
    return Array.from(this.querySelectorAll("button, input"))
  }
}

class LinkDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback();
    this.input = this.querySelector("input");

    this.#registerHandlers();
  }

  #registerHandlers() {
    this.container.addEventListener("toggle", this.#handleToggle.bind(this));
    this.addEventListener("submit", this.#handleSubmit.bind(this));
    this.querySelector("[value='unlink']").addEventListener("click", this.#handleUnlink.bind(this));
  }

  #handleToggle({ newState }) {
    this.input.value = this.#selectedLinkUrl;
    this.input.required = newState === "open";
  }

  #handleSubmit(event) {
    const command = event.submitter?.value;
    this.editor.dispatchCommand(command, this.input.value);
    this.close();
  }

  #handleUnlink() {
    this.editor.dispatchCommand("unlink");
    this.close();
  }

  get #selectedLinkUrl() {
    let url = "";

    this.editor.getEditorState().read(() => {
      const selection = Lr();
      if (!yr(selection)) return

      let node = selection.getNodes()[0];
      while (node && node.getParent()) {
        if (w$2(node)) {
          url = node.getURL();
          break
        }
        node = node.getParent();
      }
    });

    return url
  }
}

customElements.define("lexxy-link-dropdown", LinkDropdown);

const APPLY_HIGHLIGHT_SELECTOR = "button.lexxy-highlight-button";
const REMOVE_HIGHLIGHT_SELECTOR = "[data-command='removeHighlight']";

// Use Symbol instead of null since $getSelectionStyleValueForProperty
// responds differently for backward selections if null is the default
// see https://github.com/facebook/lexical/issues/8013
const NO_STYLE = Symbol("no_style");

class HighlightDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback();

    this.#setUpButtons();
    this.#registerHandlers();
  }

  #registerHandlers() {
    this.container.addEventListener("toggle", this.#handleToggle.bind(this));
    this.#colorButtons.forEach(button => button.addEventListener("click", this.#handleColorButtonClick.bind(this)));
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).addEventListener("click", this.#handleRemoveHighlightClick.bind(this));
  }

  #setUpButtons() {
    this.#buttonGroups.forEach(buttonGroup => {
      this.#populateButtonGroup(buttonGroup);
    });
  }

  #populateButtonGroup(buttonGroup) {
    const values = buttonGroup.dataset.values?.split("; ") || [];
    const attribute = buttonGroup.dataset.buttonGroup;
    values.forEach((value, index) => {
      buttonGroup.appendChild(this.#createButton(attribute, value, index));
    });
  }

  #createButton(attribute, value, index) {
    const button = document.createElement("button");
    button.dataset.style = attribute;
    button.style.setProperty(attribute, value);
    button.dataset.value = value;
    button.classList.add("lexxy-highlight-button");
    button.name = attribute + "-" + index;
    return button
  }

  #handleToggle({ newState }) {
    if (newState === "open") {
      this.editor.getEditorState().read(() => {
        this.#updateColorButtonStates(Lr());
      });
    }
  }

  #handleColorButtonClick(event) {
    event.preventDefault();

    const button = event.target.closest(APPLY_HIGHLIGHT_SELECTOR);
    if (!button) return

    const attribute = button.dataset.style;
    const value = button.dataset.value;

    this.editor.dispatchCommand("toggleHighlight", { [attribute]: value });
    this.close();
  }

  #handleRemoveHighlightClick(event) {
    event.preventDefault();

    this.editor.dispatchCommand("removeHighlight");
    this.close();
  }

  #updateColorButtonStates(selection) {
    if (!yr(selection)) { return }

    // Use non-"" default, so "" indicates mixed highlighting
    const textColor = le$1(selection, "color", NO_STYLE);
    const backgroundColor = le$1(selection, "background-color", NO_STYLE);

    this.#colorButtons.forEach(button => {
      const matchesSelection = button.dataset.value === textColor || button.dataset.value === backgroundColor;
      button.setAttribute("aria-pressed", matchesSelection);
    });

    const hasHighlight = textColor !== NO_STYLE || backgroundColor !== NO_STYLE;
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).disabled = !hasHighlight;
  }

  get #buttonGroups() {
    return this.querySelectorAll("[data-button-group]")
  }

  get #colorButtons() {
    return Array.from(this.querySelectorAll(APPLY_HIGHLIGHT_SELECTOR))
  }
}

customElements.define("lexxy-highlight-dropdown", HighlightDropdown);

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
    const listItems = [];
    this.promptItemByListItem = new WeakMap();
    promptItems.forEach((promptItem) => {
      const searchableText = promptItem.getAttribute("search");

      if (!filter || filterMatches(searchableText, filter)) {
        const listItem = this.buildListItemElementFor(promptItem);
        this.promptItemByListItem.set(listItem, promptItem);
        listItems.push(listItem);
      }
    });

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
      const listItem = this.buildListItemElementFor(promptItem);
      this.promptItemByListItem.set(listItem, promptItem);
      listItems.push(listItem);
    }

    return listItems
  }
}

const NOTHING_FOUND_DEFAULT_MESSAGE = "Nothing found";

class LexicalPromptElement extends HTMLElement {
  constructor() {
    super();
    this.keyListeners = [];
  }

  static observedAttributes = [ "connected" ]

  connectedCallback() {
    this.source = this.#createSource();

    this.#addTriggerListener();
    this.toggleAttribute("connected", true);
  }

  disconnectedCallback() {
    this.source = null;
    this.popoverElement = null;
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
    const unregister = this.#editor.registerUpdateListener(() => {
      this.#editor.read(() => {
        const { node, offset } = this.#selection.selectedNodeWithOffset();
        if (!node) return

        if (lr(node) && offset > 0) {
          const fullText = node.getTextContent();
          const charBeforeCursor = fullText[offset - 1];

          // Check if trigger is at the start of the text node (new line case) or preceded by space or newline
          if (charBeforeCursor === this.trigger) {
            const isAtStart = offset === 1;

            const charBeforeTrigger = offset > 1 ? fullText[offset - 2] : null;
            const isPrecededBySpaceOrNewline = charBeforeTrigger === " " || charBeforeTrigger === "\n";

            if (isAtStart || isPrecededBySpaceOrNewline) {
              unregister();
              this.#showPopover();
            }
          }
        }
      });
    });
  }

  #addCursorPositionListener() {
    this.cursorPositionListener = this.#editor.registerUpdateListener(() => {
      if (this.closed) return

      this.#editor.read(() => {
        const { node, offset } = this.#selection.selectedNodeWithOffset();
        if (!node) return

        if (lr(node) && offset > 0) {
          const fullText = node.getTextContent();
          const textBeforeCursor = fullText.slice(0, offset);
          const lastTriggerIndex = textBeforeCursor.lastIndexOf(this.trigger);

          // If trigger is not found, or cursor is at or before the trigger position, hide popover
          if (lastTriggerIndex === -1 || offset <= lastTriggerIndex) {
            this.#hidePopover();
          }
        } else {
          // Cursor is not in a text node or at offset 0, hide popover
          this.#hidePopover();
        }
      });
    });
  }

  #removeCursorPositionListener() {
    if (this.cursorPositionListener) {
      this.cursorPositionListener();
      this.cursorPositionListener = null;
    }
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
    this.popoverElement ??= await this.#buildPopover();
    this.#resetPopoverPosition();
    await this.#filterOptions();
    this.popoverElement.classList.toggle("lexxy-prompt-menu--visible", true);
    this.#selectFirstOption();

    this.#editorElement.addEventListener("keydown", this.#handleKeydownOnPopover);
    this.#editorElement.addEventListener("lexxy:change", this.#filterOptions);

    this.#registerKeyListeners();
    this.#addCursorPositionListener();
  }

  #registerKeyListeners() {
    // We can't use a regular keydown for Enter as Lexical handles it first
    this.keyListeners.push(this.#editor.registerCommand(Ne$1, this.#handleSelectedOption.bind(this), Bi));
    this.keyListeners.push(this.#editor.registerCommand(Me$1, this.#handleSelectedOption.bind(this), Bi));

    if (this.#doesSpaceSelect) {
      this.keyListeners.push(this.#editor.registerCommand(be$1, this.#handleSelectedOption.bind(this), Bi));
    }

    // Register arrow keys with HIGH priority to prevent Lexical's selection handlers from running
    this.keyListeners.push(this.#editor.registerCommand(ke$1, this.#handleArrowUp.bind(this), Bi));
    this.keyListeners.push(this.#editor.registerCommand(Te$1, this.#handleArrowDown.bind(this), Bi));
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

  #selectOption(listItem) {
    this.#clearSelection();
    listItem.toggleAttribute("aria-selected", true);
    listItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    listItem.focus();

    // Preserve selection to prevent cursor jump
    this.#selection.preservingSelection(() => {
      this.#editorElement.focus();
    });

    this.#editorContentElement.setAttribute("aria-controls", this.popoverElement.id);
    this.#editorContentElement.setAttribute("aria-activedescendant", listItem.id);
    this.#editorContentElement.setAttribute("aria-haspopup", "listbox");
  }

  #clearSelection() {
    this.#listItemElements.forEach((item) => { item.toggleAttribute("aria-selected", false); });
    this.#editorContentElement.removeAttribute("aria-controls");
    this.#editorContentElement.removeAttribute("aria-activedescendant");
    this.#editorContentElement.removeAttribute("aria-haspopup");
  }

  #positionPopover() {
    const { x, y, fontSize } = this.#selection.cursorPosition;
    const editorRect = this.#editorElement.getBoundingClientRect();
    const contentRect = this.#editorContentElement.getBoundingClientRect();
    const verticalOffset = contentRect.top - editorRect.top;

    if (!this.popoverElement.hasAttribute("data-anchored")) {
      this.popoverElement.style.left = `${x}px`;
      this.popoverElement.toggleAttribute("data-anchored", true);
    }

    this.popoverElement.style.top = `${y + verticalOffset}px`;
    this.popoverElement.style.bottom = "auto";

    const popoverRect = this.popoverElement.getBoundingClientRect();
    const isClippedAtBottom = popoverRect.bottom > window.innerHeight;

    if (isClippedAtBottom || this.popoverElement.hasAttribute("data-clipped-at-bottom")) {
      this.popoverElement.style.top = `${y + verticalOffset - popoverRect.height - fontSize}px`;
      this.popoverElement.style.bottom = "auto";
      this.popoverElement.toggleAttribute("data-clipped-at-bottom", true);
    }
  }

  #resetPopoverPosition() {
    this.popoverElement.removeAttribute("data-clipped-at-bottom");
    this.popoverElement.removeAttribute("data-anchored");
  }

  async #hidePopover() {
    this.#clearSelection();
    this.popoverElement.classList.toggle("lexxy-prompt-menu--visible", false);
    this.#editorElement.removeEventListener("lexxy:change", this.#filterOptions);
    this.#editorElement.removeEventListener("keydown", this.#handleKeydownOnPopover);

    this.#unregisterKeyListeners();
    this.#removeCursorPositionListener();

    await nextFrame();
    this.#addTriggerListener();
  }

  #unregisterKeyListeners() {
    this.keyListeners.forEach((unregister) => unregister());
    this.keyListeners = [];
  }

  #filterOptions = async () => {
    if (this.initialPrompt) {
      this.initialPrompt = false;
      return
    }

    if (this.#editorContents.containsTextBackUntil(this.trigger)) {
      await this.#showFilteredOptions();
      await nextFrame();
      this.#positionPopover();
    } else {
      this.#hidePopover();
    }
  }

  async #showFilteredOptions() {
    const filter = this.#editorContents.textBackUntil(this.trigger);
    const filteredListItems = await this.source.buildListItems(filter);
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
    const el = createElement("li", { innerHTML: this.#emptyResultsMessage });
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
    }
    // Arrow keys are now handled via Lexical commands with HIGH priority
  }

  #moveSelectionDown() {
    const nextIndex = this.#selectedIndex + 1;
    if (nextIndex < this.#listItemElements.length) this.#selectOption(this.#listItemElements[nextIndex]);
  }

  #moveSelectionUp() {
    const previousIndex = this.#selectedIndex - 1;
    if (previousIndex >= 0) this.#selectOption(this.#listItemElements[previousIndex]);
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

    const template = promptItem.querySelector("template[type='editor']");
    const stringToReplace = `${this.trigger}${this.#editorContents.textBackUntil(this.trigger)}`;

    if (this.hasAttribute("insert-editable-text")) {
      this.#insertTemplateAsEditableText(template, stringToReplace);
    } else {
      this.#insertTemplateAsAttachment(promptItem, template, stringToReplace);
    }
  }

  #insertTemplateAsEditableText(template, stringToReplace) {
    this.#editor.update(() => {
      const nodes = m$1(this.#editor, parseHtml(`${template.innerHTML}`));
      this.#editorContents.replaceTextBackUntil(stringToReplace, nodes);
    });
  }

  #insertTemplateAsAttachment(promptItem, template, stringToReplace) {
    this.#editor.update(() => {
      const attachmentNode = new CustomActionTextAttachmentNode({ sgid: promptItem.getAttribute("sgid"), contentType: `application/vnd.actiontext.${this.name}`, innerHtml: template.innerHTML });
      this.#editorContents.replaceTextBackUntil(stringToReplace, attachmentNode);
    });
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
    popoverContainer.addEventListener("click", this.#handlePopoverClick);
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

customElements.define("lexxy-prompt", LexicalPromptElement);

class CodeLanguagePicker extends HTMLElement {
  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor");
    this.editor = this.editorElement.editor;

    this.#attachLanguagePicker();
    this.#monitorForCodeBlockSelection();
  }

  #attachLanguagePicker() {
    this.languagePickerElement = this.#createLanguagePicker();

    this.languagePickerElement.addEventListener("change", () => {
      this.#updateCodeBlockLanguage(this.languagePickerElement.value);
    });

    this.languagePickerElement.style.position = "absolute";
    this.languagePickerElement.setAttribute("nonce", getNonce());
    this.editorElement.appendChild(this.languagePickerElement);
  }

  #createLanguagePicker() {
    const selectElement = createElement("select", { hidden: true, className: "lexxy-code-language-picker", "aria-label": "Pick a language…", name: "lexxy-code-language" });

    for (const [ value, label ] of Object.entries(this.#languages)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      selectElement.appendChild(option);
    }

    return selectElement
  }

  get #languages() {
    const languages = { ...pt };

    if (!languages.ruby) languages.ruby = "Ruby";
    if (!languages.php) languages.php = "PHP";
    if (!languages.go) languages.go = "Go";
    if (!languages.bash) languages.bash = "Bash";
    if (!languages.json) languages.json = "JSON";
    if (!languages.diff) languages.diff = "Diff";

    const sortedEntries = Object.entries(languages)
      .sort(([ , a ], [ , b ]) => a.localeCompare(b));

    // Place the "plain" entry first, then the rest of language sorted alphabetically
    const plainIndex = sortedEntries.findIndex(([ key ]) => key === "plain");
    const plainEntry = sortedEntries.splice(plainIndex, 1)[0];
    return Object.fromEntries([ plainEntry, ...sortedEntries ])
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
    this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        const codeNode = this.#getCurrentCodeNode();

        if (codeNode) {
          this.#codeNodeWasSelected(codeNode);
        } else {
          this.#hideLanguagePicker();
        }
      });
    });
  }

  #getCurrentCodeNode() {
    const selection = Lr();

    if (!yr(selection)) {
      return null
    }

    const anchorNode = selection.anchor.getNode();
    const parentNode = anchorNode.getParent();

    if (X$1(anchorNode)) {
      return anchorNode
    } else if (X$1(parentNode)) {
      return parentNode
    }

    return null
  }

  #codeNodeWasSelected(codeNode) {
    const language = codeNode.getLanguage();

    this.#updateLanguagePickerWith(language);
    this.#showLanguagePicker();
    this.#positionLanguagePicker(codeNode);
  }

  #updateLanguagePickerWith(language) {
    if (this.languagePickerElement && language) {
      const normalizedLanguage = dt(language);
      this.languagePickerElement.value = normalizedLanguage;
    }
  }

  #positionLanguagePicker(codeNode) {
    const codeElement = this.editor.getElementByKey(codeNode.getKey());
    if (!codeElement) return

    const codeRect = codeElement.getBoundingClientRect();
    const editorRect = this.editorElement.getBoundingClientRect();
    const relativeTop = codeRect.top - editorRect.top;

    this.languagePickerElement.style.top = `${relativeTop}px`;
  }

  #showLanguagePicker() {
    this.languagePickerElement.hidden = false;
  }

  #hideLanguagePicker() {
    this.languagePickerElement.hidden = true;
  }
}

customElements.define("lexxy-code-language-picker", CodeLanguagePicker);

function highlightAll() {
  const elements = document.querySelectorAll("pre[data-language]");

  elements.forEach(preElement => {
    highlightElement(preElement);
  });
}

function highlightElement(preElement) {
  const language = preElement.getAttribute("data-language");

  let code = preElement.innerHTML.replace(/<br\s*\/?>/gi, "\n");

  const grammar = Prism.languages[language];
  if (!grammar) return

  // unescape HTML entities in the code block
  code = new DOMParser().parseFromString(code, "text/html").body.textContent || "";

  const highlightedHtml = Prism.highlight(code, grammar, language);

  const codeElement = createElement("code", { "data-language": language, innerHTML: highlightedHtml });
  preElement.replaceWith(codeElement);
}

// Manual highlighting mode to prevent invocation on every page. See https://prismjs.com/docs/prism
// This must happen before importing any Prism components
window.Prism = window.Prism || {};
Prism.manual = true;

export { highlightAll };
