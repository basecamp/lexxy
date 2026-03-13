var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var prism = {exports: {}};

var hasRequiredPrism;

function requirePrism () {
	if (hasRequiredPrism) return prism.exports;
	hasRequiredPrism = 1;
	(function (module) {
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
		var Prism = (function (_self) {

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

		if (module.exports) {
			module.exports = Prism;
		}

		// hack for components to work correctly in node.js
		if (typeof commonjsGlobal !== 'undefined') {
			commonjsGlobal.Prism = Prism;
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

		}(Prism));


		/* **********************************************
		     Begin prism-clike.js
		********************************************** */

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


		/* **********************************************
		     Begin prism-javascript.js
		********************************************** */

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


		/* **********************************************
		     Begin prism-file-highlight.js
		********************************************** */

		(function () {

			if (typeof Prism === 'undefined' || typeof document === 'undefined') {
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

			Prism.hooks.add('before-highlightall', function (env) {
				env.selector += ', ' + SELECTOR;
			});

			Prism.hooks.add('before-sanity-check', function (env) {
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
					Prism.util.setLanguage(code, language);
					Prism.util.setLanguage(pre, language);

					// preload the language
					var autoloader = Prism.plugins.autoloader;
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
							Prism.highlightElement(code);
						},
						function (error) {
							// mark as failed
							pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

							code.textContent = error;
						}
					);
				}
			});

			Prism.plugins.fileHighlight = {
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
						Prism.highlightElement(element);
					}
				}
			};

			var logged = false;
			/** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */
			Prism.fileHighlight = function () {
				if (!logged) {
					console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
					logged = true;
				}
				Prism.plugins.fileHighlight.highlight.apply(this, arguments);
			};

		}()); 
	} (prism));
	return prism.exports;
}

var prismExports = requirePrism();
var Prism$1 = /*@__PURE__*/getDefaultExportFromCjs(prismExports);

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

(function (Prism) {

	/**
	 * Returns the placeholder for the given language id and index.
	 *
	 * @param {string} language
	 * @param {string|number} index
	 * @returns {string}
	 */
	function getPlaceholder(language, index) {
		return '___' + language.toUpperCase() + index + '___';
	}

	Object.defineProperties(Prism.languages['markup-templating'] = {}, {
		buildPlaceholders: {
			/**
			 * Tokenize all inline templating expressions matching `placeholderPattern`.
			 *
			 * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
			 * `true` will be replaced.
			 *
			 * @param {object} env The environment of the `before-tokenize` hook.
			 * @param {string} language The language id.
			 * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
			 * @param {(match: string) => boolean} [replaceFilter]
			 */
			value: function (env, language, placeholderPattern, replaceFilter) {
				if (env.language !== language) {
					return;
				}

				var tokenStack = env.tokenStack = [];

				env.code = env.code.replace(placeholderPattern, function (match) {
					if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
						return match;
					}
					var i = tokenStack.length;
					var placeholder;

					// Check for existing strings
					while (env.code.indexOf(placeholder = getPlaceholder(language, i)) !== -1) {
						++i;
					}

					// Create a sparse array
					tokenStack[i] = match;

					return placeholder;
				});

				// Switch the grammar to markup
				env.grammar = Prism.languages.markup;
			}
		},
		tokenizePlaceholders: {
			/**
			 * Replace placeholders with proper tokens after tokenizing.
			 *
			 * @param {object} env The environment of the `after-tokenize` hook.
			 * @param {string} language The language id.
			 */
			value: function (env, language) {
				if (env.language !== language || !env.tokenStack) {
					return;
				}

				// Switch the grammar back
				env.grammar = Prism.languages[language];

				var j = 0;
				var keys = Object.keys(env.tokenStack);

				function walkTokens(tokens) {
					for (var i = 0; i < tokens.length; i++) {
						// all placeholders are replaced already
						if (j >= keys.length) {
							break;
						}

						var token = tokens[i];
						if (typeof token === 'string' || (token.content && typeof token.content === 'string')) {
							var k = keys[j];
							var t = env.tokenStack[k];
							var s = typeof token === 'string' ? token : token.content;
							var placeholder = getPlaceholder(language, k);

							var index = s.indexOf(placeholder);
							if (index > -1) {
								++j;

								var before = s.substring(0, index);
								var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), 'language-' + language, t);
								var after = s.substring(index + placeholder.length);

								var replacement = [];
								if (before) {
									replacement.push.apply(replacement, walkTokens([before]));
								}
								replacement.push(middle);
								if (after) {
									replacement.push.apply(replacement, walkTokens([after]));
								}

								if (typeof token === 'string') {
									tokens.splice.apply(tokens, [i, 1].concat(replacement));
								} else {
									token.content = replacement;
								}
							}
						} else if (token.content /* && typeof token.content !== 'string' */) {
							walkTokens(token.content);
						}
					}

					return tokens;
				}

				walkTokens(env.tokens);
			}
		}
	});

}(Prism$1));

var prismRuby = {};

var hasRequiredPrismRuby;

function requirePrismRuby () {
	if (hasRequiredPrismRuby) return prismRuby;
	hasRequiredPrismRuby = 1;
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
	}(Prism$1));
	return prismRuby;
}

requirePrismRuby();

var prismPhp = {};

var hasRequiredPrismPhp;

function requirePrismPhp () {
	if (hasRequiredPrismPhp) return prismPhp;
	hasRequiredPrismPhp = 1;
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

	}(Prism$1));
	return prismPhp;
}

requirePrismPhp();

Prism$1.languages.go = Prism$1.languages.extend('clike', {
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

Prism$1.languages.insertBefore('go', 'string', {
	'char': {
		pattern: /'(?:\\.|[^'\\\r\n]){0,10}'/,
		greedy: true
	}
});

delete Prism$1.languages.go['class-name'];

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
}(Prism$1));

// https://www.json.org/json-en.html
Prism$1.languages.json = {
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

Prism$1.languages.webmanifest = Prism$1.languages.json;

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

}(Prism$1));

// Configure Prism for manual highlighting mode
// This must be set before importing prismjs
window.Prism = window.Prism || {};
window.Prism.manual = true;

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

function t(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);throw n.search=r.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}function e(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);n.search=r.toString(),console.warn(`Minified Lexical warning #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);}const n="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,r=n&&"documentMode"in document?document.documentMode:null,i=n&&/Mac|iPod|iPhone|iPad/.test(navigator.platform),o=n&&/^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent),s$1=!(!n||!("InputEvent"in window)||r)&&"getTargetRanges"in new window.InputEvent("input"),l=n&&/Version\/[\d.]+.*Safari/.test(navigator.userAgent),c=n&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,a=n&&/Android/.test(navigator.userAgent),u=n&&/^(?=.*Chrome).*/i.test(navigator.userAgent),f=n&&a&&u,d$1=n&&/AppleWebKit\/[\d.]+/.test(navigator.userAgent)&&i&&!u,h$1=0,g$1=1,_$4=2,T$2=128,N$2=1,b$4=2,w$4=3,E$5=4,O$2=5,M$5=6,A$2=l||c||d$1?" ":"​",P$2="\n\n",D$4=o?" ":A$2,F$3="֑-߿יִ-﷽ﹰ-ﻼ",L$3="A-Za-zÀ-ÖØ-öø-ʸ̀-֐ࠀ-῿‎Ⰰ-﬜︀-﹯﻽-￿",I$2=new RegExp("^[^"+L$3+"]*["+F$3+"]"),K$5=new RegExp("^[^"+F$3+"]*["+L$3+"]"),z$5={bold:1,capitalize:1024,code:16,highlight:T$2,italic:2,lowercase:256,strikethrough:4,subscript:32,superscript:64,underline:8,uppercase:512},R$4={directionless:1,unmergeable:2},B$4={center:2,end:6,justify:4,left:1,right:3,start:5},W$4={[b$4]:"center",[M$5]:"end",[E$5]:"justify",[N$2]:"left",[w$4]:"right",[O$2]:"start"},J$3={normal:0,segmented:2,token:1},j$4={[h$1]:"normal",[_$4]:"segmented",[g$1]:"token"},$$5="$config";function V$4(t,e,n,r,i,o){let s=t.getFirstChild();for(;null!==s;){const t=s.__key;s.__parent===e&&(Pi(s)&&V$4(s,t,n,r,i,o),n.has(t)||o.delete(t),i.push(t)),s=s.getNextSibling();}}let Y$4=false,q$7=0;function H$5(t){q$7=t.timeStamp;}function G$4(t,e,n){const r="BR"===t.nodeName,i=e.__lexicalLineBreak;return i&&(t===i||r&&t.previousSibling===i)||r&&void 0!==Po(t,n)}function X$4(t,e,n){const r=bs(ps(n));let i=null,o=null;null!==r&&r.anchorNode===t&&(i=r.anchorOffset,o=r.focusOffset);const s=t.nodeValue;null!==s&&$o(e,s,i,o,false);}function Q$6(t,e,n){if(wr(t)){const e=t.anchor.getNode();if(e.is(n)&&t.format!==e.getFormat())return  false}return Co(e)&&n.isAttached()}function Z$5(t,e,n,r){for(let i=t;i&&!Us(i);i=as(i)){const t=Po(i,e);if(void 0!==t){const e=Mo(t,n);if(e)return Li(e)||!Ms(i)?void 0:[i,e]}else if(i===r)return [r,Ko(n)]}}function tt$2(t,e,n){Y$4=true;const r=performance.now()-q$7>100;try{Ei(t,()=>{const i=$r()||function(t){return t.getEditorState().read(()=>{const t=$r();return null!==t?t.clone():null})}(t),s=new Map,l=t.getRootElement(),c=t._editorState,a=t._blockCursorElement;let u=!1,f="";for(let n=0;n<e.length;n++){const d=e[n],h=d.type,g=d.target,_=Z$5(g,t,c,l);if(!_)continue;const[p,y]=_;if("characterData"===h)r&&yr(y)&&Co(g)&&Q$6(i,g,y)&&X$4(g,y,t);else if("childList"===h){u=!0;const e=d.addedNodes;for(let n=0;n<e.length;n++){const r=e[n],i=Ao(r),s=r.parentNode;if(null!=s&&r!==a&&null===i&&!G$4(r,s,t)){if(o){const t=(Ms(r)?r.innerText:null)||r.nodeValue;t&&(f+=t);}s.removeChild(r);}}const n=d.removedNodes,r=n.length;if(r>0){let e=0;for(let i=0;i<r;i++){const r=n[i];(G$4(r,g,t)||a===r)&&(g.appendChild(r),e++);}r!==e&&s.set(p,y);}}}if(s.size>0)for(const[e,n]of s)n.reconcileObservedMutation(e,t);const d=n.takeRecords();if(d.length>0){for(let e=0;e<d.length;e++){const n=d[e],r=n.addedNodes,i=n.target;for(let e=0;e<r.length;e++){const n=r[e],o=n.parentNode;null==o||"BR"!==n.nodeName||G$4(n,i,t)||o.removeChild(n);}}n.takeRecords();}null!==i&&(u&&zo(i),o&&ss(t)&&i.insertRawText(f));});}finally{Y$4=false;}}function et$3(t){const e=t._observer;if(null!==e){tt$2(t,e.takeRecords(),e);}}function nt$3(t){!function(t){0===q$7&&ps(t).addEventListener("textInput",H$5,true);}(t),t._observer=new MutationObserver((e,n)=>{tt$2(t,e,n);});}let rt$4 = class rt{key;parse;unparse;isEqual;defaultValue;constructor(t,e){this.key=t,this.parse=e.parse.bind(e),this.unparse=(e.unparse||ht$4).bind(e),this.isEqual=(e.isEqual||Object.is).bind(e),this.defaultValue=this.parse(void 0);}};function it$2(t,e){return new rt$4(t,e)}function ot$2(t,e,n="latest"){const r=("latest"===n?t.getLatest():t).__state;return r?r.getValue(e):e.defaultValue}function lt$2(t,e,n){let r;if(di(),"function"==typeof n){const i=t.getLatest(),o=ot$2(i,e);if(r=n(o),e.isEqual(o,r))return i}else r=n;const i=t.getWritable();return ut$4(i).updateFromKnown(e,r),i}function ct$3(t){const e=new Map,n=new Set;for(let r="function"==typeof t?t:t.replace;r.prototype&&void 0!==r.prototype.getType;r=Object.getPrototypeOf(r)){const{ownNodeConfig:t}=Vs(r);if(t&&t.stateConfigs)for(const r of t.stateConfigs){let t;"stateConfig"in r?(t=r.stateConfig,r.flat&&n.add(t.key)):t=r,e.set(t.key,t);}}return {flatKeys:n,sharedConfigMap:e}}let at$4 = class at{node;knownState;unknownState;sharedNodeState;size;constructor(t,e,n=void 0,r=new Map,i=void 0){this.node=t,this.sharedNodeState=e,this.unknownState=n,this.knownState=r;const{sharedConfigMap:o}=this.sharedNodeState,s=void 0!==i?i:function(t,e,n){let r=n.size;if(e)for(const i in e){const e=t.get(i);e&&n.has(e)||r++;}return r}(o,n,r);this.size=s;}getValue(t){const e=this.knownState.get(t);if(void 0!==e)return e;this.sharedNodeState.sharedConfigMap.set(t.key,t);let n=t.defaultValue;if(this.unknownState&&t.key in this.unknownState){const e=this.unknownState[t.key];void 0!==e&&(n=t.parse(e)),this.updateFromKnown(t,n);}return n}getInternalState(){return [this.unknownState,this.knownState]}toJSON(){const t={...this.unknownState},e={};for(const[e,n]of this.knownState)e.isEqual(n,e.defaultValue)?delete t[e.key]:t[e.key]=e.unparse(n);for(const n of this.sharedNodeState.flatKeys)n in t&&(e[n]=t[n],delete t[n]);return dt$4(t)&&(e.$=t),e}getWritable(t){if(this.node===t)return this;const{sharedNodeState:e,unknownState:n}=this,r=new Map(this.knownState);return new at(t,e,function(t,e,n){let r;if(n)for(const[i,o]of Object.entries(n)){const n=t.get(i);n?e.has(n)||e.set(n,n.parse(o)):(r=r||{},r[i]=o);}return r}(e.sharedConfigMap,r,n),r,this.size)}updateFromKnown(t,e){const n=t.key;this.sharedNodeState.sharedConfigMap.set(n,t);const{knownState:r,unknownState:i}=this;r.has(t)||i&&n in i||(i&&(delete i[n],this.unknownState=dt$4(i)),this.size++),r.set(t,e);}updateFromUnknown(t,e){const n=this.sharedNodeState.sharedConfigMap.get(t);n?this.updateFromKnown(n,n.parse(e)):(this.unknownState=this.unknownState||{},t in this.unknownState||this.size++,this.unknownState[t]=e);}updateFromJSON(t){const{knownState:e}=this;for(const t of e.keys())e.set(t,t.defaultValue);if(this.size=e.size,this.unknownState=void 0,t)for(const[e,n]of Object.entries(t))this.updateFromUnknown(e,n);}};function ut$4(t){const e=t.getWritable(),n=e.__state?e.__state.getWritable(e):new at$4(e,ft$4(e));return e.__state=n,n}function ft$4(t){return t.__state?t.__state.sharedNodeState:lo(Is(),t.getType()).sharedNodeState}function dt$4(t){if(t)for(const e in t)return t}function ht$4(t){return t}function gt$4(t,e,n){for(const[r,i]of e.knownState){if(t.has(r.key))continue;t.add(r.key);const e=n?n.getValue(r):r.defaultValue;if(e!==i&&!r.isEqual(e,i))return  true}return  false}function _t$5(t,e,n){const{unknownState:r}=e,i=n?n.unknownState:void 0;if(r)for(const[e,n]of Object.entries(r)){if(t.has(e))continue;t.add(e);if(n!==(i?i[e]:void 0))return  true}return  false}function pt$6(t,e){const n=t.__state;return n&&n.node===t?n.getWritable(e):n}function yt$2(t,e){const n=t.__mode,r=t.__format,i=t.__style,o=e.__mode,s=e.__format,l=e.__style,c=t.__state,a=e.__state;return (null===n||n===o)&&(null===r||r===s)&&(null===i||i===l)&&(null===t.__state||c===a||function(t,e){if(t===e)return  true;if(t&&e&&t.size!==e.size)return  false;const n=new Set;return !(t&&gt$4(n,t,e)||e&&gt$4(n,e,t)||t&&_t$5(n,t,e)||e&&_t$5(n,e,t))}(c,a))}function mt$1(t,e){const n=t.mergeWithSibling(e),r=_i()._normalizedNodes;return r.add(t.__key),r.add(e.__key),n}function xt$4(t){let e,n,r=t;if(""!==r.__text||!r.isSimpleText()||r.isUnmergeable()){for(;null!==(e=r.getPreviousSibling())&&yr(e)&&e.isSimpleText()&&!e.isUnmergeable();){if(""!==e.__text){if(yt$2(e,r)){r=mt$1(e,r);break}break}e.remove();}for(;null!==(n=r.getNextSibling())&&yr(n)&&n.isSimpleText()&&!n.isUnmergeable();){if(""!==n.__text){if(yt$2(r,n)){r=mt$1(r,n);break}break}n.remove();}}else r.remove();}function Ct$4(t){return St$4(t.anchor),St$4(t.focus),t}function St$4(t){for(;"element"===t.type;){const e=t.getNode(),n=t.offset;let r,i;if(n===e.getChildrenSize()?(r=e.getChildAtIndex(n-1),i=true):(r=e.getChildAtIndex(n),i=false),yr(r)){t.set(r.__key,i?r.getTextContentSize():0,"text",true);break}if(!Pi(r))break;t.set(r.__key,i?r.getChildrenSize():0,"element",true);}}let vt$5,Tt$5,kt$6,Nt$3,bt$5,wt$4,Et$4,Ot$4,Mt$3,At$6,Pt$6="",Dt$3=null,Ft$3=null,Lt$4=false,It$3=false;function Kt$5(t,e){const n=Et$4.get(t);if(null!==e){const n=ee$3(t);n.parentNode===e&&e.removeChild(n);}if(Ot$4.has(t)||Tt$5._keyToDOMMap.delete(t),Pi(n)){const t=Ht$4(n,Et$4);zt$4(t,0,t.length-1,null);} void 0!==n&&ns(At$6,kt$6,Nt$3,n,"destroyed");}function zt$4(t,e,n,r){for(let i=e;i<=n;++i){const e=t[i];void 0!==e&&Kt$5(e,r);}}function Rt$1(t,e){t.setProperty("text-align",e);}const Bt$4="40px";function Wt$4(t,e){const n=vt$5.theme.indent;if("string"==typeof n){const r=t.classList.contains(n);e>0&&!r?t.classList.add(n):e<1&&r&&t.classList.remove(n);}if(0===e)return void t.style.setProperty("padding-inline-start","");const r=getComputedStyle(Tt$5._rootElement||t).getPropertyValue("--lexical-indent-base-value")||Bt$4;t.style.setProperty("padding-inline-start",`calc(${e} * ${r})`);}function Jt$4(t,e){const n=t.style;0===e?Rt$1(n,""):1===e?Rt$1(n,"left"):2===e?Rt$1(n,"center"):3===e?Rt$1(n,"right"):4===e?Rt$1(n,"justify"):5===e?Rt$1(n,"start"):6===e&&Rt$1(n,"end");}function jt$4(t,e){const n=function(t){const e=t.__dir;if(null!==e)return e;if(Ki(t))return null;const n=t.getParentOrThrow();return Ki(n)&&null===n.__dir?"auto":null}(e);null!==n?t.dir=n:t.removeAttribute("dir");}function Ut$3(e,n){const r=Ot$4.get(e);void 0===r&&t(60);const i=r.createDOM(vt$5,Tt$5);if(function(t,e,n){const r=n._keyToDOMMap;((function(t,e,n){const r=`__lexicalKey_${e._key}`;t[r]=n;}))(e,n,t),r.set(t,e);}(e,i,Tt$5),yr(r)?i.setAttribute("data-lexical-text","true"):Li(r)&&i.setAttribute("data-lexical-decorator","true"),Pi(r)){const t=r.__indent,e=r.__size;if(jt$4(i,r),0!==t&&Wt$4(i,t),0!==e){const t=e-1;$t$3(Ht$4(r,Ot$4),r,0,t,r.getDOMSlot(i));}const n=r.__format;0!==n&&Jt$4(i,n),r.isInline()||Yt$3(null,r,i);}else {const t=r.getTextContent();if(Li(r)){const t=r.decorate(Tt$5,vt$5);null!==t&&Xt$3(e,t),i.contentEditable="false";}Pt$6+=t;}return null!==n&&n.insertChild(i),ns(At$6,kt$6,Nt$3,r,"created"),i}function $t$3(t,e,n,r,i){const o=Pt$6;Pt$6="";let s=n;for(;s<=r;++s){Ut$3(t[s],i);const e=Ot$4.get(t[s]);null!==e&&yr(e)?null===Dt$3&&(Dt$3=e.getFormat(),Ft$3=e.getStyle()):Pi(e)&&s<r&&!e.isInline()&&(Pt$6+=P$2);}i.element.__lexicalTextContent=Pt$6,Pt$6=o+Pt$6;}function Vt$3(t,e){if(t){const n=t.__last;if(n){const t=e.get(n);if(t)return Zn(t)?"line-break":Li(t)&&t.isInline()?"decorator":null}return "empty"}return null}function Yt$3(t,e,n){const r=Vt$3(t,Et$4),i=Vt$3(e,Ot$4);r!==i&&e.getDOMSlot(n).setManagedLineBreak(i);}function qt$3(e,n,r){var i;Dt$3=null,Ft$3=null,function(e,n,r){const i=Pt$6,o=e.__size,s=n.__size;Pt$6="";const l=r.element;if(1===o&&1===s){const t=e.__first,r=n.__first;if(t===r)Gt$3(t,l);else {const e=ee$3(t),n=Ut$3(r,null);try{l.replaceChild(n,e);}catch(i){if("object"==typeof i&&null!=i){const o=`${i.toString()} Parent: ${l.tagName}, new child: {tag: ${n.tagName} key: ${r}}, old child: {tag: ${e.tagName}, key: ${t}}.`;throw new Error(o)}throw i}Kt$5(t,null);}const i=Ot$4.get(r);yr(i)&&null===Dt$3&&(Dt$3=i.getFormat(),Ft$3=i.getStyle());}else {const i=Ht$4(e,Et$4),c=Ht$4(n,Ot$4);if(i.length!==o&&t(227),c.length!==s&&t(228),0===o)0!==s&&$t$3(c,0,0,s-1,r);else if(0===s){if(0!==o){const t=null==r.after&&null==r.before&&null==r.element.__lexicalLineBreak;zt$4(i,0,o-1,t?null:l),t&&(l.textContent="");}}else !function(t,e,n,r,i,o){const s=r-1,l=i-1;let c,a,u=o.getFirstChild(),f=0,d=0;for(;f<=s&&d<=l;){const t=e[f],r=n[d];if(t===r)u=Qt$3(Gt$3(r,o.element)),f++,d++;else {if(void 0===a&&(a=Zt$2(n,d)),void 0===c)c=Zt$2(e,f);else if(!c.has(t)){f++;continue}if(!a.has(t)){u=Qt$3(ee$3(t)),Kt$5(t,o.element),f++,c.delete(t);continue}if(c.has(r)){const t=cs(Tt$5,r);t!==u&&o.withBefore(u).insertChild(t),u=Qt$3(Gt$3(r,o.element)),f++,d++;}else Ut$3(r,o.withBefore(u)),d++;}const i=Ot$4.get(r);null!==i&&yr(i)?null===Dt$3&&(Dt$3=i.getFormat(),Ft$3=i.getStyle()):Pi(i)&&d<=l&&!i.isInline()&&(Pt$6+=P$2);}const h=f>s,g=d>l;if(h&&!g){const t=n[l+1],e=void 0===t?null:Tt$5.getElementByKey(t);$t$3(n,0,d,l,o.withBefore(e));}else g&&!h&&zt$4(e,f,s,o.element);}(0,i,c,o,s,r);}l.__lexicalTextContent=Pt$6,Pt$6=i+Pt$6;}(e,n,n.getDOMSlot(r)),i=n,null==Dt$3||Dt$3===i.__textFormat||It$3||i.setTextFormat(Dt$3),function(t){null==Ft$3||Ft$3===t.__textStyle||It$3||t.setTextStyle(Ft$3);}(n);}function Ht$4(e,n){const r=[];let i=e.__first;for(;null!==i;){const e=n.get(i);void 0===e&&t(101),r.push(i),i=e.__next;}return r}function Gt$3(e,n){const r=Et$4.get(e);let i=Ot$4.get(e);void 0!==r&&void 0!==i||t(61);const o=Lt$4||wt$4.has(e)||bt$5.has(e),s=cs(Tt$5,e);if(r===i&&!o){let t;if(Pi(r)){const e=s.__lexicalTextContent;"string"==typeof e?t=e:(t=r.getTextContent(),s.__lexicalTextContent=t);}else t=r.getTextContent();return Pt$6+=t,s}if(r!==i&&o&&ns(At$6,kt$6,Nt$3,i,"updated"),i.updateDOM(r,s,vt$5)){const r=Ut$3(e,null);return null===n&&t(62),n.replaceChild(r,s),Kt$5(e,null),r}if(Pi(r)){Pi(i)||t(334,e);const n=i.__indent;(Lt$4||n!==r.__indent)&&Wt$4(s,n);const l=i.__format;if((Lt$4||l!==r.__format)&&Jt$4(s,l),o)qt$3(r,i,s),Ki(i)||i.isInline()||Yt$3(r,i,s);else {const t=s.__lexicalTextContent;let e;"string"==typeof t?e=t:(e=r.getTextContent(),s.__lexicalTextContent=e),Pt$6+=e;}if((Lt$4||i.__dir!==r.__dir)&&(jt$4(s,i),Ki(i)&&!Lt$4))for(const t of i.getChildren())if(Pi(t)){jt$4(cs(Tt$5,t.getKey()),t);}}else {const t=i.getTextContent();if(Li(i)){const t=i.decorate(Tt$5,vt$5);null!==t&&Xt$3(e,t);}Pt$6+=t;}if(!It$3&&Ki(i)&&i.__cachedText!==Pt$6){const t=i.getWritable();t.__cachedText=Pt$6,i=t;}return s}function Xt$3(t,e){let n=Tt$5._pendingDecorators;const r=Tt$5._decorators;if(null===n){if(r[t]===e)return;n=Fo(Tt$5);}n[t]=e;}function Qt$3(t){let e=t.nextSibling;return null!==e&&e===Tt$5._blockCursorElement&&(e=e.nextSibling),e}function Zt$2(t,e){const n=new Set;for(let r=e;r<t.length;r++)n.add(t[r]);return n}function te$3(t,e,n,r,i,o){Pt$6="",Lt$4=2===r,Tt$5=n,vt$5=n._config,kt$6=n._nodes,Nt$3=Tt$5._listeners.mutation,bt$5=i,wt$4=o,Et$4=t._nodeMap,Ot$4=e._nodeMap,It$3=e._readOnly,Mt$3=new Map(n._keyToDOMMap);const s=new Map;return At$6=s,Gt$3("root",null),Tt$5=void 0,kt$6=void 0,bt$5=void 0,wt$4=void 0,Et$4=void 0,Ot$4=void 0,vt$5=void 0,Mt$3=void 0,At$6=void 0,s}function ee$3(e){const n=Mt$3.get(e);return void 0===n&&t(75,e),n}function ne$3(t){return {type:t}}const re$2=ne$3("SELECTION_CHANGE_COMMAND"),ie$2=ne$3("SELECTION_INSERT_CLIPBOARD_NODES_COMMAND"),oe$4=ne$3("CLICK_COMMAND"),se$2=ne$3("BEFORE_INPUT_COMMAND"),le$3=ne$3("INPUT_COMMAND"),ce$2=ne$3("COMPOSITION_START_COMMAND"),ae$2=ne$3("COMPOSITION_END_COMMAND"),ue$2=ne$3("DELETE_CHARACTER_COMMAND"),fe$2=ne$3("INSERT_LINE_BREAK_COMMAND"),de$2=ne$3("INSERT_PARAGRAPH_COMMAND"),he$2=ne$3("CONTROLLED_TEXT_INSERTION_COMMAND"),ge$2=ne$3("PASTE_COMMAND"),_e$1=ne$3("REMOVE_TEXT_COMMAND"),pe$2=ne$3("DELETE_WORD_COMMAND"),ye$1=ne$3("DELETE_LINE_COMMAND"),me$2=ne$3("FORMAT_TEXT_COMMAND"),xe$1=ne$3("UNDO_COMMAND"),Ce$1=ne$3("REDO_COMMAND"),Se$2=ne$3("KEYDOWN_COMMAND"),ve$1=ne$3("KEY_ARROW_RIGHT_COMMAND"),Te$1=ne$3("MOVE_TO_END"),ke$3=ne$3("KEY_ARROW_LEFT_COMMAND"),Ne$1=ne$3("MOVE_TO_START"),be$2=ne$3("KEY_ARROW_UP_COMMAND"),we$1=ne$3("KEY_ARROW_DOWN_COMMAND"),Ee$2=ne$3("KEY_ENTER_COMMAND"),Oe$2=ne$3("KEY_SPACE_COMMAND"),Me$2=ne$3("KEY_BACKSPACE_COMMAND"),Ae$2=ne$3("KEY_ESCAPE_COMMAND"),Pe$2=ne$3("KEY_DELETE_COMMAND"),De$2=ne$3("KEY_TAB_COMMAND"),Fe$2=ne$3("INSERT_TAB_COMMAND"),Le$3=ne$3("INDENT_CONTENT_COMMAND"),Ie$2=ne$3("OUTDENT_CONTENT_COMMAND"),Ke$2=ne$3("DROP_COMMAND"),ze$2=ne$3("FORMAT_ELEMENT_COMMAND"),Re$1=ne$3("DRAGSTART_COMMAND"),Be$2=ne$3("DRAGOVER_COMMAND"),We$2=ne$3("DRAGEND_COMMAND"),Je$2=ne$3("COPY_COMMAND"),je$1=ne$3("CUT_COMMAND"),Ue$2=ne$3("SELECT_ALL_COMMAND"),$e$2=ne$3("CLEAR_EDITOR_COMMAND"),Ve$2=ne$3("CLEAR_HISTORY_COMMAND"),Ye$1=ne$3("CAN_REDO_COMMAND"),qe$2=ne$3("CAN_UNDO_COMMAND"),He$2=ne$3("FOCUS_COMMAND"),Ge$1=ne$3("BLUR_COMMAND"),Xe$2=ne$3("KEY_MODIFIER_COMMAND"),Qe$1=Object.freeze({}),Ze$2=[["keydown",function(t,e){if(tn$1=t.timeStamp,en$1=t.key,e.isComposing())return;ls(e,Se$2,t);}],["pointerdown",function(t,e){const n=t.target,r=t.pointerType;As(n)&&"touch"!==r&&"pen"!==r&&0===t.button&&Ei(e,()=>{uo(n)||(cn$1=true);});}],["compositionstart",function(t,e){ls(e,ce$2,t);}],["compositionend",function(t,e){o?un$1=true:c||!l&&!d$1?ls(e,ae$2,t):(fn$1=true,dn$1=t.data);}],["input",function(t,e){t.stopPropagation(),Ei(e,()=>{e.dispatchCommand(le$3,t);},{event:t}),rn$1=null;}],["click",function(t,e){Ei(e,()=>{const n=$r(),r=bs(ps(e)),i=Vr();if(r)if(wr(n)){const e=n.anchor,o=e.getNode();if("element"===e.type&&0===e.offset&&n.isCollapsed()&&!Ki(o)&&1===Io().getChildrenSize()&&o.getTopLevelElementOrThrow().isEmpty()&&null!==i&&n.is(i))r.removeAllRanges(),n.dirty=true;else if(3===t.detail&&!n.isCollapsed()){if(o!==n.focus.getNode()){const t=qs(o,t=>Pi(t)&&!t.isInline());Pi(t)&&t.select(0);}}}else if("touch"===t.pointerType||"pen"===t.pointerType){const n=r.anchorNode;if(Ms(n)||Co(n)){zo(Ur(i,r,e,t));}}ls(e,oe$4,t);});}],["cut",Qe$1],["copy",Qe$1],["dragstart",Qe$1],["dragover",Qe$1],["dragend",Qe$1],["paste",Qe$1],["focus",Qe$1],["blur",Qe$1],["drop",Qe$1]];s$1&&Ze$2.push(["beforeinput",(t,e)=>function(t,e){const n=t.inputType;if("deleteCompositionText"===n||o&&ss(e))return;if("insertCompositionText"===n)return;ls(e,se$2,t);}(t,e)]);let tn$1=0,en$1=null,nn$1=0,rn$1=null;const on$1=new WeakMap,sn$1=new WeakMap;let ln$1=false,cn$1=false,an$1=false,un$1=false,fn$1=false,dn$1="",hn$1=null,gn$1=[0,"",0,"root",0];function _n$1(t,e,n,r,i){const o=t.anchor,l=t.focus,c=o.getNode(),a=_i(),u=bs(ps(a)),f=null!==u?u.anchorNode:null,d=o.key,h=a.getElementByKey(d),g=n.length;return d!==l.key||!yr(c)||(!i&&(!s$1||nn$1<r+50)||c.isDirty()&&g<2||Bo(n))&&o.offset!==l.offset&&!c.isComposing()||xo(c)||c.isDirty()&&g>1||(i||!s$1)&&null!==h&&!c.isComposing()&&f!==vo(h)||null!==u&&null!==e&&(!e.collapsed||e.startContainer!==u.anchorNode||e.startOffset!==u.anchorOffset)||!c.isComposing()&&(c.getFormat()!==t.format||c.getStyle()!==t.style)||function(t,e){if(e.isSegmented())return  true;if(!t.isCollapsed())return  false;const n=t.anchor.offset,r=e.getParentOrThrow(),i=mo(e);return 0===n?!e.canInsertTextBefore()||!r.canInsertTextBefore()&&!e.isComposing()||i||function(t){const e=t.getPreviousSibling();return (yr(e)||Pi(e)&&e.isInline())&&!e.canInsertTextAfter()}(e):n===e.getTextContentSize()&&(!e.canInsertTextAfter()||!r.canInsertTextAfter()&&!e.isComposing()||i)}(t,c)}function pn$1(t,e){return Co(t)&&null!==t.nodeValue&&0!==e&&e!==t.nodeValue.length}function yn$1(e,n,r){const{anchorNode:i,anchorOffset:o,focusNode:s,focusOffset:l}=e;ln$1&&(ln$1=false,pn$1(i,o)&&pn$1(s,l)&&!hn$1)||Ei(n,()=>{if(!r)return void zo(null);if(!ho(n,i,s))return;let c=$r();if(hn$1&&wr(c)&&c.isCollapsed()){const t=c.anchor,e=hn$1.anchor;(t.key===e.key&&t.offset===e.offset+1||1===t.offset&&e.getNode().is(t.getNode().getPreviousSibling()))&&(c=hn$1.clone(),zo(c));}if(hn$1=null,wr(c)){const r=c.anchor,i=r.getNode();if(c.isCollapsed()){"Range"===e.type&&e.anchorNode===e.focusNode&&(c.dirty=true);const o=ps(n).event,s=o?o.timeStamp:performance.now(),[l,a,u,f,d]=gn$1,h=Io(),g=false===n.isComposing()&&""===h.getTextContent();if(s<d+200&&r.offset===u&&r.key===f)mn$1(c,l,a);else if("text"===r.type)yr(i)||t(141),xn$1(c,i);else if("element"===r.type&&!g){Pi(i)||t(259);const e=r.getNode();e.isEmpty()?function(t,e){const n=e.getTextFormat(),r=e.getTextStyle();mn$1(t,n,r);}(c,e):mn$1(c,0,"");}}else {const t=r.key,e=c.focus.key,n=c.getNodes(),i=n.length,s=c.isBackward(),a=s?l:o,u=s?o:l,f=s?e:t,d=s?t:e;let h=2047,g=false;for(let t=0;t<i;t++){const e=n[t],r=e.getTextContentSize();if(yr(e)&&0!==r&&!(0===t&&e.__key===f&&a===r||t===i-1&&e.__key===d&&0===u)&&(g=true,h&=e.getFormat(),0===h))break}c.format=g?h:0;}}ls(n,re$2,void 0);});}function mn$1(t,e,n){t.format===e&&t.style===n||(t.format=e,t.style=n,t.dirty=true);}function xn$1(t,e){mn$1(t,e.getFormat(),e.getStyle());}function Cn$1(t){if(!t.getTargetRanges)return null;const e=t.getTargetRanges();return 0===e.length?null:e[0]}function Sn$1(e){const n=e.inputType,r=Cn$1(e),i=_i(),o=$r();if("deleteContentBackward"===n){if(null===o){const t=Vr();if(!wr(t))return  true;zo(t.clone());}if(wr(o)){const n=o.anchor.key===o.focus.key;if(s=e.timeStamp,"MediaLast"===en$1&&s<tn$1+30&&i.isComposing()&&n){if(Eo(null),tn$1=0,setTimeout(()=>{Ei(i,()=>{Eo(null);});},30),wr(o)){const e=o.anchor.getNode();e.markDirty(),yr(e)||t(142),xn$1(o,e);}}else {Eo(null),e.preventDefault();const t=o.anchor.getNode(),r=t.getTextContent(),s=t.canInsertTextAfter(),l=0===o.anchor.offset&&o.focus.offset===r.length;let c=f&&n&&!l&&s;if(c&&o.isCollapsed()&&(c=!Li(os(o.anchor,true))),!c){ls(i,ue$2,true);const t=$r();f&&wr(t)&&t.isCollapsed()&&(hn$1=t,setTimeout(()=>hn$1=null));}}return  true}}var s;if(!wr(o))return  true;const l=e.data;null!==rn$1&&Uo(false,i,rn$1),o.dirty&&null===rn$1||!o.isCollapsed()||Ki(o.anchor.getNode())||null===r||o.applyDOMRange(r),rn$1=null;const a=o.anchor,u=o.focus,d=a.getNode(),h=u.getNode();if("insertText"===n||"insertTranspose"===n){if("\n"===l)e.preventDefault(),ls(i,fe$2,false);else if(l===P$2)e.preventDefault(),ls(i,de$2,void 0);else if(null==l&&e.dataTransfer){const t=e.dataTransfer.getData("text/plain");e.preventDefault(),o.insertRawText(t);}else null!=l&&_n$1(o,r,l,e.timeStamp,true)?(e.preventDefault(),ls(i,he$2,l)):rn$1=l;return nn$1=e.timeStamp,true}switch(e.preventDefault(),n){case "insertFromYank":case "insertFromDrop":case "insertReplacementText":ls(i,he$2,e);break;case "insertFromComposition":Eo(null),ls(i,he$2,e);break;case "insertLineBreak":Eo(null),ls(i,fe$2,false);break;case "insertParagraph":Eo(null),an$1&&!c?(an$1=false,ls(i,fe$2,false)):ls(i,de$2,void 0);break;case "insertFromPaste":case "insertFromPasteAsQuotation":ls(i,ge$2,e);break;case "deleteByComposition":(function(t,e){return t!==e||Pi(t)||Pi(e)||!mo(t)||!mo(e)})(d,h)&&ls(i,_e$1,e);break;case "deleteByDrag":case "deleteByCut":ls(i,_e$1,e);break;case "deleteContent":ls(i,ue$2,false);break;case "deleteWordBackward":ls(i,pe$2,true);break;case "deleteWordForward":ls(i,pe$2,false);break;case "deleteHardLineBackward":case "deleteSoftLineBackward":ls(i,ye$1,true);break;case "deleteContentForward":case "deleteHardLineForward":case "deleteSoftLineForward":ls(i,ye$1,false);break;case "formatStrikeThrough":ls(i,me$2,"strikethrough");break;case "formatBold":ls(i,me$2,"bold");break;case "formatItalic":ls(i,me$2,"italic");break;case "formatUnderline":ls(i,me$2,"underline");break;case "historyUndo":ls(i,xe$1,void 0);break;case "historyRedo":ls(i,Ce$1,void 0);}return  true}function vn$1(t){if(Ms(t.target)&&uo(t.target))return  true;const e=_i(),n=$r(),r=t.data,i=Cn$1(t);if(null!=r&&wr(n)&&_n$1(n,i,r,t.timeStamp,false)){un$1&&(Nn$1(e,r),un$1=false);const i=n.anchor.getNode(),l=bs(ps(e));if(null===l)return  true;const c=n.isBackward(),a=c?n.anchor.offset:n.focus.offset,u=c?n.focus.offset:n.anchor.offset;s$1&&!n.isCollapsed()&&yr(i)&&null!==l.anchorNode&&i.getTextContent().slice(0,a)+r+i.getTextContent().slice(a+u)===jo(l.anchorNode)||ls(e,he$2,r);const d=r.length;o&&d>1&&"insertCompositionText"===t.inputType&&!e.isComposing()&&(n.anchor.offset-=d),f&&e.isComposing()&&(tn$1=0,Eo(null));}else {Uo(false,e,null!==r?r:void 0),un$1&&(Nn$1(e,r||void 0),un$1=false);}return function(){di();const t=_i();et$3(t);}(),true}function Tn$1(t){const e=_i(),n=$r();if(wr(n)&&!e.isComposing()){const r=n.anchor,i=n.anchor.getNode();Eo(r.key),ds(qn),(t.timeStamp<tn$1+30||"element"===r.type||!n.isCollapsed()||i.getFormat()!==n.format||yr(i)&&i.getStyle()!==n.style)&&ls(e,he$2,D$4);}return  true}function kn$1(t){return Nn$1(_i(),t.data),ds(Hn),true}function Nn$1(t,e){const n=t._compositionKey;if(Eo(null),null!==n&&null!=e){if(""===e){const e=Mo(n),r=vo(t.getElementByKey(n));if(null!==r&&null!==r.nodeValue&&yr(e)){const n=bs(ps(t));let i=null,o=null;null!==n&&n.anchorNode===r&&(i=n.anchorOffset,o=n.focusOffset),$o(e,r.nodeValue,i,o,true);}return}if("\n"===e[e.length-1]){const e=$r();if(wr(e)||Or(e)){if(wr(e)){const t=e.focus;e.anchor.set(t.key,t.offset,t.type);}return void ls(t,Ee$2,null)}}}Uo(true,t,e);}function bn$1(t){const e=_i();if(null==t.key)return  true;if(fn$1){if(Qo(t))return Ei(e,()=>{Nn$1(e,dn$1);}),fn$1=false,dn$1="",true;fn$1=false,dn$1="";}if(function(t){return Ho(t,"ArrowRight",{shiftKey:"any"})}(t))ls(e,ve$1,t);else if(function(t){return Ho(t,"ArrowRight",Go)}(t))ls(e,Te$1,t);else if(function(t){return Ho(t,"ArrowLeft",{shiftKey:"any"})}(t))ls(e,ke$3,t);else if(function(t){return Ho(t,"ArrowLeft",Go)}(t))ls(e,Ne$1,t);else if(function(t){return Ho(t,"ArrowUp",{altKey:"any",shiftKey:"any"})}(t))ls(e,be$2,t);else if(function(t){return Ho(t,"ArrowDown",{altKey:"any",shiftKey:"any"})}(t))ls(e,we$1,t);else if(function(t){return Ho(t,"Enter",{altKey:"any",ctrlKey:"any",metaKey:"any",shiftKey:true})}(t))an$1=true,ls(e,Ee$2,t);else if(function(t){return " "===t.key}(t))ls(e,Oe$2,t);else if(function(t){return i&&Ho(t,"o",{ctrlKey:true})}(t))t.preventDefault(),an$1=true,ls(e,fe$2,true);else if(function(t){return Ho(t,"Enter",{altKey:"any",ctrlKey:"any",metaKey:"any"})}(t))an$1=false,ls(e,Ee$2,t);else if(function(t){return Ho(t,"Backspace",{shiftKey:"any"})||i&&Ho(t,"h",{ctrlKey:true})}(t))Qo(t)?ls(e,Me$2,t):(t.preventDefault(),ls(e,ue$2,true));else if(function(t){return "Escape"===t.key}(t))ls(e,Ae$2,t);else if(function(t){return Ho(t,"Delete",{})||i&&Ho(t,"d",{ctrlKey:true})}(t))!function(t){return "Delete"===t.key}(t)?(t.preventDefault(),ls(e,ue$2,false)):ls(e,Pe$2,t);else if(function(t){return Ho(t,"Backspace",Xo)}(t))t.preventDefault(),ls(e,pe$2,true);else if(function(t){return Ho(t,"Delete",Xo)}(t))t.preventDefault(),ls(e,pe$2,false);else if(function(t){return i&&Ho(t,"Backspace",{metaKey:true})}(t))t.preventDefault(),ls(e,ye$1,true);else if(function(t){return i&&(Ho(t,"Delete",{metaKey:true})||Ho(t,"k",{ctrlKey:true}))}(t))t.preventDefault(),ls(e,ye$1,false);else if(function(t){return Ho(t,"b",Go)}(t))t.preventDefault(),ls(e,me$2,"bold");else if(function(t){return Ho(t,"u",Go)}(t))t.preventDefault(),ls(e,me$2,"underline");else if(function(t){return Ho(t,"i",Go)}(t))t.preventDefault(),ls(e,me$2,"italic");else if(function(t){return Ho(t,"Tab",{shiftKey:"any"})}(t))ls(e,De$2,t);else if(function(t){return Ho(t,"z",Go)}(t))t.preventDefault(),ls(e,xe$1,void 0);else if(function(t){if(i)return Ho(t,"z",{metaKey:true,shiftKey:true});return Ho(t,"y",{ctrlKey:true})||Ho(t,"z",{ctrlKey:true,shiftKey:true})}(t))t.preventDefault(),ls(e,Ce$1,void 0);else {const n=e._editorState._selection;null===n||wr(n)?Zo(t)&&(t.preventDefault(),ls(e,Ue$2,t)):!function(t){return Ho(t,"c",Go)}(t)?!function(t){return Ho(t,"x",Go)}(t)?Zo(t)&&(t.preventDefault(),ls(e,Ue$2,t)):(t.preventDefault(),ls(e,je$1,t)):(t.preventDefault(),ls(e,Je$2,t));}return function(t){return t.ctrlKey||t.shiftKey||t.altKey||t.metaKey}(t)&&e.dispatchCommand(Xe$2,t),true}function wn$1(t){let e=t.__lexicalEventHandles;return void 0===e&&(e=[],t.__lexicalEventHandles=e),e}const En=new Map;function On$1(t){const e=ws(t.target);if(null===e)return;const n=_o(e.anchorNode);if(null===n)return;cn$1&&(cn$1=false,Ei(n,()=>{const r=Vr(),i=e.anchorNode;if(Ms(i)||Co(i)){zo(Ur(r,e,n,t));}}));const r=Wo(n),i=r[r.length-1],o=i._key,s=En.get(o),l=s||i;l!==n&&yn$1(e,l,false),yn$1(e,n,true),n!==i?En.set(o,n):s&&En.delete(o);}function Mn(t){t._lexicalHandled=true;}function An$1(t){return  true===t._lexicalHandled}function Dn(e){const n=on$1.get(e);if(void 0===n)return void 0;const r=sn$1.get(n);if(void 0===r)return void 0;const i=r-1;i>=0||t(164),on$1.delete(e),sn$1.set(n,i),0===i&&n.removeEventListener("selectionchange",On$1);const o=po(e);go(o)?(!function(t){if(null!==t._parentEditor){const e=Wo(t),n=e[e.length-1]._key;En.get(n)===t&&En.delete(n);}else En.delete(t._key);}(o),e.__lexicalEditor=null):o&&t(198);const s=wn$1(e);for(let t=0;t<s.length;t++)s[t]();e.__lexicalEventHandles=[];}function Fn(t,e,n){di();const r=t.__key,i=t.getParent();if(null===i)return;const o=function(t){const e=$r();if(!wr(e)||!Pi(t))return e;const{anchor:n,focus:r}=e,i=n.getNode(),o=r.getNode();gs(i,t)&&n.set(t.__key,0,"element");gs(o,t)&&r.set(t.__key,0,"element");return e}(t);let s=false;if(wr(o)&&e){const e=o.anchor,n=o.focus;e.key===r&&(Hr(e,t,i,t.getPreviousSibling(),t.getNextSibling()),s=true),n.key===r&&(Hr(n,t,i,t.getPreviousSibling(),t.getNextSibling()),s=true);}else Or(o)&&e&&t.isSelected()&&t.selectPrevious();if(wr(o)&&e&&!s){const e=t.getIndexWithinParent();bo(t),Yr(o,i,e,-1);}else bo(t);n||xs(i)||i.canBeEmpty()||!i.isEmpty()||Fn(i,e),e&&o&&Ki(i)&&i.isEmpty()&&i.selectEnd();}function Ln(t){return t}const In=Symbol.for("ephemeral");function Kn$1(t){return t[In]||false}class zn{__type;__key;__parent;__prev;__next;__state;static getType(){const{ownNodeType:e}=Vs(this);return void 0===e&&t(64,this.name),e}static clone(e){t(65,this.name);}$config(){return {}}config(t,e){const n=e.extends||Object.getPrototypeOf(this.constructor);return Object.assign(e,{extends:n,type:t}),{[t]:e}}afterCloneFrom(t){this.__key===t.__key?(this.__parent=t.__parent,this.__next=t.__next,this.__prev=t.__prev,this.__state=t.__state):t.__state&&(this.__state=t.__state.getWritable(this));}static importDOM;constructor(t){this.__type=this.constructor.getType(),this.__parent=null,this.__prev=null,this.__next=null,Object.defineProperty(this,"__state",{configurable:true,enumerable:false,value:void 0,writable:true}),No(this,t);}getType(){return this.__type}isInline(){t(137,this.constructor.name);}isAttached(){let t=this.__key;for(;null!==t;){if("root"===t)return  true;const e=Mo(t);if(null===e)break;t=e.__parent;}return  false}isSelected(t){const e=t||$r();if(null==e)return  false;const n=e.getNodes().some(t=>t.__key===this.__key);if(yr(this))return n;if(wr(e)&&"element"===e.anchor.type&&"element"===e.focus.type){if(e.isCollapsed())return  false;const t=this.getParent();if(Li(this)&&this.isInline()&&t){const n=e.isBackward()?e.focus:e.anchor;if(t.is(n.getNode())&&n.offset===t.getChildrenSize()&&this.is(t.getLastChild()))return  false}}return n}getKey(){return this.__key}getIndexWithinParent(){const t=this.getParent();if(null===t)return  -1;let e=t.getFirstChild(),n=0;for(;null!==e;){if(this.is(e))return n;n++,e=e.getNextSibling();}return  -1}getParent(){const t=this.getLatest().__parent;return null===t?null:Mo(t)}getParentOrThrow(){const e=this.getParent();return null===e&&t(66,this.__key),e}getTopLevelElement(){let e=this;for(;null!==e;){const n=e.getParent();if(xs(n))return Pi(e)||e===this&&Li(e)||t(194),e;e=n;}return null}getTopLevelElementOrThrow(){const e=this.getTopLevelElement();return null===e&&t(67,this.__key),e}getParents(){const t=[];let e=this.getParent();for(;null!==e;)t.push(e),e=e.getParent();return t}getParentKeys(){const t=[];let e=this.getParent();for(;null!==e;)t.push(e.__key),e=e.getParent();return t}getPreviousSibling(){const t=this.getLatest().__prev;return null===t?null:Mo(t)}getPreviousSiblings(){const t=[],e=this.getParent();if(null===e)return t;let n=e.getFirstChild();for(;null!==n&&!n.is(this);)t.push(n),n=n.getNextSibling();return t}getNextSibling(){const t=this.getLatest().__next;return null===t?null:Mo(t)}getNextSiblings(){const t=[];let e=this.getNextSibling();for(;null!==e;)t.push(e),e=e.getNextSibling();return t}getCommonAncestor(t){const e=Pi(this)?this:this.getParent(),n=Pi(t)?t:t.getParent(),r=e&&n?El(e,n):null;return r?r.commonAncestor:null}is(t){return null!=t&&this.__key===t.__key}isBefore(e){const n=El(this,e);return null!==n&&("descendant"===n.type||("branch"===n.type?-1===Nl(n):("same"!==n.type&&"ancestor"!==n.type&&t(279),false)))}isParentOf(t){const e=El(this,t);return null!==e&&"ancestor"===e.type}getNodesBetween(e){const n=this.isBefore(e),r=[],i=new Set;let o=this;for(;null!==o;){const s=o.__key;if(i.has(s)||(i.add(s),r.push(o)),o===e)break;const l=Pi(o)?n?o.getFirstChild():o.getLastChild():null;if(null!==l){o=l;continue}const c=n?o.getNextSibling():o.getPreviousSibling();if(null!==c){o=c;continue}const a=o.getParentOrThrow();if(i.has(a.__key)||r.push(a),a===e)break;let u=null,f=a;do{if(null===f&&t(68),u=n?f.getNextSibling():f.getPreviousSibling(),f=f.getParent(),null===f)break;null!==u||i.has(f.__key)||r.push(f);}while(null===u);o=u;}return n||r.reverse(),r}isDirty(){const t=_i()._dirtyLeaves;return null!==t&&t.has(this.__key)}getLatest(){if(Kn$1(this))return this;const e=Mo(this.__key);return null===e&&t(113),e}getWritable(){if(Kn$1(this))return this;di();const t=gi(),e=_i(),n=t._nodeMap,r=this.__key,i=this.getLatest(),o=e._cloneNotNeeded,s=$r();if(null!==s&&s.setCachedNodes(null),o.has(r))return wo(i),i;const l=Bs(i);return o.add(r),wo(l),n.set(r,l),l}getTextContent(){return ""}getTextContentSize(){return this.getTextContent().length}createDOM(e,n){t(70);}updateDOM(e,n,r){t(71);}exportDOM(t){return {element:this.createDOM(t._config,t)}}exportJSON(){const t=this.__state?this.__state.toJSON():void 0;return {type:this.__type,version:1,...t}}static importJSON(e){t(18,this.name);}updateFromJSON(t){return function(t,e){const n=t.getWritable(),r=e.$;let i=r;for(const t of ft$4(n).flatKeys)t in e&&(void 0!==i&&i!==r||(i={...r}),i[t]=e[t]);return (n.__state||i)&&ut$4(t).updateFromJSON(i),n}(this,t)}static transform(){return null}remove(t){Fn(this,true,t);}replace(e,n){di();let r=$r();null!==r&&(r=r.clone()),vs(this,e);const i=this.getLatest(),o=this.__key,s=e.__key,l=e.getWritable(),c=this.getParentOrThrow().getWritable(),a=c.__size;bo(l);const u=i.getPreviousSibling(),f=i.getNextSibling(),d=i.__prev,h=i.__next,g=i.__parent;if(Fn(i,false,true),null===u)c.__first=s;else {u.getWritable().__next=s;}if(l.__prev=d,null===f)c.__last=s;else {f.getWritable().__prev=s;}if(l.__next=h,l.__parent=g,c.__size=a,n&&(Pi(this)&&Pi(l)||t(139),this.getChildren().forEach(t=>{l.append(t);})),wr(r)){zo(r);const t=r.anchor,e=r.focus;t.key===o&&Nr(t,l),e.key===o&&Nr(e,l);}return Oo()===o&&Eo(s),l}insertAfter(t,e=true){di(),vs(this,t);const n=this.getWritable(),r=t.getWritable(),i=r.getParent(),o=$r();let s=false,l=false;if(null!==i){const e=t.getIndexWithinParent();if(bo(r),wr(o)){const t=i.__key,n=o.anchor,r=o.focus;s="element"===n.type&&n.key===t&&n.offset===e+1,l="element"===r.type&&r.key===t&&r.offset===e+1;}}const c=this.getNextSibling(),a=this.getParentOrThrow().getWritable(),u=r.__key,f=n.__next;if(null===c)a.__last=u;else {c.getWritable().__prev=u;}if(a.__size++,n.__next=u,r.__next=f,r.__prev=n.__key,r.__parent=n.__parent,e&&wr(o)){const t=this.getIndexWithinParent();Yr(o,a,t+1);const e=a.__key;s&&o.anchor.set(e,t+2,"element"),l&&o.focus.set(e,t+2,"element");}return t}insertBefore(t,e=true){di(),vs(this,t);const n=this.getWritable(),r=t.getWritable(),i=r.__key;bo(r);const o=this.getPreviousSibling(),s=this.getParentOrThrow().getWritable(),l=n.__prev,c=this.getIndexWithinParent();if(null===o)s.__first=i;else {o.getWritable().__next=i;}s.__size++,n.__prev=i,r.__prev=l,r.__next=n.__key,r.__parent=n.__parent;const a=$r();if(e&&wr(a)){Yr(a,this.getParentOrThrow(),c);}return t}isParentRequired(){return  false}createParentElementNode(){return Vi()}selectStart(){return this.selectPrevious()}selectEnd(){return this.selectNext(0,0)}selectPrevious(t,e){di();const n=this.getPreviousSibling(),r=this.getParentOrThrow();if(null===n)return r.select(0,0);if(Pi(n))return n.select();if(!yr(n)){const t=n.getIndexWithinParent()+1;return r.select(t,t)}return n.select(t,e)}selectNext(t,e){di();const n=this.getNextSibling(),r=this.getParentOrThrow();if(null===n)return r.select();if(Pi(n))return n.select(0,0);if(!yr(n)){const t=n.getIndexWithinParent();return r.select(t,t)}return n.select(t,e)}markDirty(){this.getWritable();}reconcileObservedMutation(t,e){this.markDirty();}}const Rn$1="historic",Bn="history-push",Wn="history-merge",Jn="paste",jn="collaboration",$n="skip-scroll-into-view",Vn="skip-dom-selection",Yn="skip-selection-focus",qn="composition-start",Hn="composition-end";class Gn extends zn{static getType(){return "linebreak"}static clone(t){return new Gn(t.__key)}constructor(t){super(t);}getTextContent(){return "\n"}createDOM(){return document.createElement("br")}updateDOM(){return  false}isInline(){return  true}static importDOM(){return {br:t=>function(t){const e=t.parentElement;if(null!==e&&Fs(e)){const n=e.firstChild;if(n===t||n.nextSibling===t&&tr(n)){const n=e.lastChild;if(n===t||n.previousSibling===t&&tr(n))return  true}}return  false}(t)||function(t){const e=t.parentElement;if(null!==e&&Fs(e)){const n=e.firstChild;if(n===t||n.nextSibling===t&&tr(n))return  false;const r=e.lastChild;if(r===t||r.previousSibling===t&&tr(r))return  true}return  false}(t)?null:{conversion:Xn,priority:0}}}static importJSON(t){return Qn().updateFromJSON(t)}}function Xn(t){return {node:Qn()}}function Qn(){return Ss(new Gn)}function Zn(t){return t instanceof Gn}function tr(t){return Co(t)&&/^( |\t|\r?\n)+$/.test(t.textContent||"")}function er(t,e){return 16&e?"code":e&T$2?"mark":32&e?"sub":64&e?"sup":null}function nr(t,e){return 1&e?"strong":2&e?"em":"span"}function rr(t,e,n,r,i){const o=r.classList;let s=es(i,"base");void 0!==s&&o.add(...s),s=es(i,"underlineStrikethrough");let l=false;const c=8&e&&4&e;void 0!==s&&(8&n&&4&n?(l=true,c||o.add(...s)):c&&o.remove(...s));for(const t in z$5){const r=z$5[t];if(s=es(i,t),void 0!==s)if(n&r){if(l&&("underline"===t||"strikethrough"===t)){e&r&&o.remove(...s);continue}(0===(e&r)||c&&"underline"===t||"strikethrough"===t)&&o.add(...s);}else e&r&&o.remove(...s);}}function ir(t,e,n){const r=e.firstChild,i=n.isComposing(),s=t+(i?A$2:"");if(null==r)e.textContent=s;else {const t=r.nodeValue;if(t!==s)if(i||o){const[e,n,i]=function(t,e){const n=t.length,r=e.length;let i=0,o=0;for(;i<n&&i<r&&t[i]===e[i];)i++;for(;o+i<n&&o+i<r&&t[n-o-1]===e[r-o-1];)o++;return [i,n-i-o,e.slice(i,r-o)]}(t,s);0!==n&&r.deleteData(e,n),r.insertData(e,i);}else r.nodeValue=s;}}function or(t,e,n,r,i,o){ir(i,t,e);const s=o.theme.text;void 0!==s&&rr(0,0,r,t,s);}function sr(t,e){const n=document.createElement(e);return n.appendChild(t),n}class lr extends zn{__text;__format;__style;__mode;__detail;static getType(){return "text"}static clone(t){return new lr(t.__text,t.__key)}afterCloneFrom(t){super.afterCloneFrom(t),this.__text=t.__text,this.__format=t.__format,this.__style=t.__style,this.__mode=t.__mode,this.__detail=t.__detail;}constructor(t="",e){super(e),this.__text=t,this.__format=0,this.__style="",this.__mode=0,this.__detail=0;}getFormat(){return this.getLatest().__format}getDetail(){return this.getLatest().__detail}getMode(){const t=this.getLatest();return j$4[t.__mode]}getStyle(){return this.getLatest().__style}isToken(){return 1===this.getLatest().__mode}isComposing(){return this.__key===Oo()}isSegmented(){return 2===this.getLatest().__mode}isDirectionless(){return !!(1&this.getLatest().__detail)}isUnmergeable(){return !!(2&this.getLatest().__detail)}hasFormat(t){const e=z$5[t];return 0!==(this.getFormat()&e)}isSimpleText(){return "text"===this.__type&&0===this.__mode}getTextContent(){return this.getLatest().__text}getFormatFlags(t,e){return To(this.getLatest().__format,t,e)}canHaveFormat(){return  true}isInline(){return  true}createDOM(t,e){const n=this.__format,r=er(0,n),i=nr(0,n),o=null===r?i:r,s=document.createElement(o);let l=s;this.hasFormat("code")&&s.setAttribute("spellcheck","false"),null!==r&&(l=document.createElement(i),s.appendChild(l));or(l,this,0,n,this.__text,t);const c=this.__style;return ""!==c&&(s.style.cssText=c),s}updateDOM(e,n,r){const i=this.__text,o=e.__format,s=this.__format,l=er(0,o),c=er(0,s),a=nr(0,o),u=nr(0,s);if((null===l?a:l)!==(null===c?u:c))return  true;if(l===c&&a!==u){const e=n.firstChild;null==e&&t(48);const o=document.createElement(u);return or(o,this,0,s,i,r),n.replaceChild(o,e),false}let f=n;null!==c&&null!==l&&(f=n.firstChild,null==f&&t(49)),ir(i,f,this);const d=r.theme.text;void 0!==d&&o!==s&&rr(0,o,s,f,d);const h=e.__style,g=this.__style;return h!==g&&(n.style.cssText=g),false}static importDOM(){return {"#text":()=>({conversion:dr,priority:0}),b:()=>({conversion:ar,priority:0}),code:()=>({conversion:_r,priority:0}),em:()=>({conversion:_r,priority:0}),i:()=>({conversion:_r,priority:0}),mark:()=>({conversion:_r,priority:0}),s:()=>({conversion:_r,priority:0}),span:()=>({conversion:cr,priority:0}),strong:()=>({conversion:_r,priority:0}),sub:()=>({conversion:_r,priority:0}),sup:()=>({conversion:_r,priority:0}),u:()=>({conversion:_r,priority:0})}}static importJSON(t){return pr().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setTextContent(t.text).setFormat(t.format).setDetail(t.detail).setMode(t.mode).setStyle(t.style)}exportDOM(e){let{element:n}=super.exportDOM(e);return Ms(n)||t(132),n.style.whiteSpace="pre-wrap",this.hasFormat("lowercase")?n.style.textTransform="lowercase":this.hasFormat("uppercase")?n.style.textTransform="uppercase":this.hasFormat("capitalize")&&(n.style.textTransform="capitalize"),this.hasFormat("bold")&&(n=sr(n,"b")),this.hasFormat("italic")&&(n=sr(n,"i")),this.hasFormat("strikethrough")&&(n=sr(n,"s")),this.hasFormat("underline")&&(n=sr(n,"u")),{element:n}}exportJSON(){return {detail:this.getDetail(),format:this.getFormat(),mode:this.getMode(),style:this.getStyle(),text:this.getTextContent(),...super.exportJSON()}}selectionTransform(t,e){}setFormat(t){const e=this.getWritable();return e.__format="string"==typeof t?z$5[t]:t,e}setDetail(t){const e=this.getWritable();return e.__detail="string"==typeof t?R$4[t]:t,e}setStyle(t){const e=this.getWritable();return e.__style=t,e}toggleFormat(t){const e=To(this.getFormat(),t,null);return this.setFormat(e)}toggleDirectionless(){const t=this.getWritable();return t.__detail^=1,t}toggleUnmergeable(){const t=this.getWritable();return t.__detail^=2,t}setMode(t){const e=J$3[t];if(this.__mode===e)return this;const n=this.getWritable();return n.__mode=e,n}setTextContent(t){if(this.__text===t)return this;const e=this.getWritable();return e.__text=t,e}select(t,e){di();let n=t,r=e;const i=$r(),o=this.getTextContent(),s=this.__key;if("string"==typeof o){const t=o.length;void 0===n&&(n=t),void 0===r&&(r=t);}else n=0,r=0;if(!wr(i))return Br(s,n,s,r,"text","text");{const t=Oo();t!==i.anchor.key&&t!==i.focus.key||Eo(s),i.setTextNodeRange(this,n,this,r);}return i}selectStart(){return this.select(0,0)}selectEnd(){const t=this.getTextContentSize();return this.select(t,t)}spliceText(t,e,n,r){const i=this.getWritable(),o=i.__text,s=n.length;let l=t;l<0&&(l=s+l,l<0&&(l=0));const c=$r();if(r&&wr(c)){const e=t+s;c.setTextNodeRange(i,e,i,e);}const a=o.slice(0,l)+n+o.slice(l+e);return i.__text=a,i}canInsertTextBefore(){return  true}canInsertTextAfter(){return  true}splitText(...t){di();const e=this.getLatest(),n=e.getTextContent();if(""===n)return [];const r=e.__key,i=Oo(),o=n.length;t.sort((t,e)=>t-e),t.push(o);const s=[],l=t.length;for(let e=0,r=0;e<o&&r<=l;r++){const i=t[r];i>e&&(s.push(n.slice(e,i)),e=i);}const c=s.length;if(1===c)return [e];const a=s[0],u=e.getParent();let f;const d=e.getFormat(),h=e.getStyle(),g=e.__detail;let _=false,p=null,y=null;const m=$r();if(wr(m)){const[t,e]=m.isBackward()?[m.focus,m.anchor]:[m.anchor,m.focus];"text"===t.type&&t.key===r&&(p=t),"text"===e.type&&e.key===r&&(y=e);}e.isSegmented()?(f=pr(a),f.__format=d,f.__style=h,f.__detail=g,f.__state=pt$6(e,f),_=true):f=e.setTextContent(a);const x=[f];for(let t=1;t<c;t++){const n=pr(s[t]);n.__format=d,n.__style=h,n.__detail=g,n.__state=pt$6(e,n);const o=n.__key;i===r&&Eo(o),x.push(n);}const C=p?p.offset:null,S=y?y.offset:null;let v=0;for(const t of x){if(!p&&!y)break;const e=v+t.getTextContentSize();if(null!==p&&null!==C&&C<=e&&C>=v&&(p.set(t.getKey(),C-v,"text"),C<e&&(p=null)),null!==y&&null!==S&&S<=e&&S>=v){y.set(t.getKey(),S-v,"text");break}v=e;}if(null!==u){!function(t){const e=t.getPreviousSibling(),n=t.getNextSibling();null!==e&&wo(e);null!==n&&wo(n);}(this);const t=u.getWritable(),e=this.getIndexWithinParent();_?(t.splice(e,0,x),this.remove()):t.splice(e,1,x),wr(m)&&Yr(m,u,e,c-1);}return x}mergeWithSibling(e){const n=e===this.getPreviousSibling();n||e===this.getNextSibling()||t(50);const r=this.__key,i=e.__key,o=this.__text,s=o.length;Oo()===i&&Eo(r);const l=$r();if(wr(l)){const t=l.anchor,o=l.focus;null!==t&&t.key===i&&Gr(t,n,r,e,s),null!==o&&o.key===i&&Gr(o,n,r,e,s);}const c=e.__text,a=n?c+o:o+c;this.setTextContent(a);const u=this.getWritable();return e.remove(),u}isTextEntity(){return  false}}function cr(t){return {forChild:mr(t.style),node:null}}function ar(t){const e=t,n="normal"===e.style.fontWeight;return {forChild:mr(e.style,n?void 0:"bold"),node:null}}const ur=new WeakMap;function fr(t){if(!Ms(t))return  false;if("PRE"===t.nodeName)return  true;const e=t.style.whiteSpace;return "string"==typeof e&&e.startsWith("pre")}function dr(e){const n=e;null===e.parentElement&&t(129);let r=n.textContent||"";if(null!==function(t){let e,n=t.parentNode;const r=[t];for(;null!==n&&void 0===(e=ur.get(n))&&!fr(n);)r.push(n),n=n.parentNode;const i=void 0===e?n:e;for(let t=0;t<r.length;t++)ur.set(r[t],i);return i}(n)){const t=r.split(/(\r?\n|\t)/),e=[],n=t.length;for(let r=0;r<n;r++){const n=t[r];"\n"===n||"\r\n"===n?e.push(Qn()):"\t"===n?e.push(Cr()):""!==n&&e.push(pr(n));}return {node:e}}if(r=r.replace(/\r/g,"").replace(/[ \t\n]+/g," "),""===r)return {node:null};if(" "===r[0]){let t=n,e=true;for(;null!==t&&null!==(t=hr(t,false));){const n=t.textContent||"";if(n.length>0){/[ \t\n]$/.test(n)&&(r=r.slice(1)),e=false;break}}e&&(r=r.slice(1));}if(" "===r[r.length-1]){let t=n,e=true;for(;null!==t&&null!==(t=hr(t,true));){if((t.textContent||"").replace(/^( |\t|\r?\n)+/,"").length>0){e=false;break}}e&&(r=r.slice(0,r.length-1));}return ""===r?{node:null}:{node:pr(r)}}function hr(t,e){let n=t;for(;;){let t;for(;null===(t=e?n.nextSibling:n.previousSibling);){const t=n.parentElement;if(null===t)return null;n=t;}if(n=t,Ms(n)){const t=n.style.display;if(""===t&&!Ds(n)||""!==t&&!t.startsWith("inline"))return null}let r=n;for(;null!==(r=e?n.firstChild:n.lastChild);)n=r;if(Co(n))return n;if("BR"===n.nodeName)return null}}const gr={code:"code",em:"italic",i:"italic",mark:"highlight",s:"strikethrough",strong:"bold",sub:"subscript",sup:"superscript",u:"underline"};function _r(t){const e=gr[t.nodeName.toLowerCase()];return void 0===e?{node:null}:{forChild:mr(t.style,e),node:null}}function pr(t=""){return Ss(new lr(t))}function yr(t){return t instanceof lr}function mr(t,e){const n=t.fontWeight,r=t.textDecoration.split(" "),i="700"===n||"bold"===n,o=r.includes("line-through"),s="italic"===t.fontStyle,l=r.includes("underline"),c=t.verticalAlign;return t=>yr(t)?(i&&!t.hasFormat("bold")&&t.toggleFormat("bold"),o&&!t.hasFormat("strikethrough")&&t.toggleFormat("strikethrough"),s&&!t.hasFormat("italic")&&t.toggleFormat("italic"),l&&!t.hasFormat("underline")&&t.toggleFormat("underline"),"sub"!==c||t.hasFormat("subscript")||t.toggleFormat("subscript"),"super"!==c||t.hasFormat("superscript")||t.toggleFormat("superscript"),e&&!t.hasFormat(e)&&t.toggleFormat(e),t):t}class xr extends lr{static getType(){return "tab"}static clone(t){return new xr(t.__key)}constructor(t){super("\t",t),this.__detail=2;}static importDOM(){return null}createDOM(t){const e=super.createDOM(t),n=es(t.theme,"tab");if(void 0!==n){e.classList.add(...n);}return e}static importJSON(t){return Cr().updateFromJSON(t)}setTextContent(t){return "\t"!==t&&""!==t&&e(126),super.setTextContent("\t")}spliceText(e,n,r,i){return ""===r&&0===n||"\t"===r&&1===n||t(286),this}setDetail(e){return 2!==e&&t(127),this}setMode(e){return "normal"!==e&&t(128),this}canInsertTextBefore(){return  false}canInsertTextAfter(){return  false}}function Cr(){return Ss(new xr)}function Sr(t){return t instanceof xr}class vr{key;offset;type;_selection;constructor(t,e,n){this._selection=null,this.key=t,this.offset=e,this.type=n;}is(t){return this.key===t.key&&this.offset===t.offset&&this.type===t.type}isBefore(t){if(this.key===t.key)return this.offset<t.offset;return kl(zl(Ol(this,"next")),zl(Ol(t,"next")))<0}getNode(){const e=Mo(this.key);return null===e&&t(20),e}set(t,e,n,r){const i=this._selection,o=this.key;r&&this.key===t&&this.offset===e&&this.type===n||(this.key=t,this.offset=e,this.type=n,fi()||(Oo()===o&&Eo(t),null!==i&&(i.setCachedNodes(null),i.dirty=true)));}}function Tr(t,e,n){return new vr(t,e,n)}function kr(t,e){let n=e.__key,r=t.offset,i="element";if(yr(e)){i="text";const t=e.getTextContentSize();r>t&&(r=t);}else if(!Pi(e)){const t=e.getNextSibling();if(yr(t))n=t.__key,r=0,i="text";else {const t=e.getParent();t&&(n=t.__key,r=e.getIndexWithinParent()+1);}}t.set(n,r,i);}function Nr(t,e){if(Pi(e)){const n=e.getLastDescendant();Pi(n)||yr(n)?kr(t,n):kr(t,e);}else kr(t,e);}class br{_nodes;_cachedNodes;dirty;constructor(t){this._cachedNodes=null,this._nodes=t,this.dirty=false;}getCachedNodes(){return this._cachedNodes}setCachedNodes(t){this._cachedNodes=t;}is(t){if(!Or(t))return  false;const e=this._nodes,n=t._nodes;return e.size===n.size&&Array.from(e).every(t=>n.has(t))}isCollapsed(){return  false}isBackward(){return  false}getStartEndPoints(){return null}add(t){this.dirty=true,this._nodes.add(t),this._cachedNodes=null;}delete(t){this.dirty=true,this._nodes.delete(t),this._cachedNodes=null;}clear(){this.dirty=true,this._nodes.clear(),this._cachedNodes=null;}has(t){return this._nodes.has(t)}clone(){return new br(new Set(this._nodes))}extract(){return this.getNodes()}insertRawText(t){}insertText(){}insertNodes(t){const e=this.getNodes(),n=e.length,r=e[n-1];let i;if(yr(r))i=r.select();else {const t=r.getIndexWithinParent()+1;i=r.getParentOrThrow().select(t,t);}i.insertNodes(t);for(let t=0;t<n;t++)e[t].remove();}getNodes(){const t=this._cachedNodes;if(null!==t)return t;const e=this._nodes,n=[];for(const t of e){const e=Mo(t);null!==e&&n.push(e);}return fi()||(this._cachedNodes=n),n}getTextContent(){const t=this.getNodes();let e="";for(let n=0;n<t.length;n++)e+=t[n].getTextContent();return e}deleteNodes(){const t=this.getNodes();if(($r()||Vr())===this&&t[0]){const e=ul(t[0],"next");Al(vl(e,e));}for(const e of t)e.remove();}}function wr(t){return t instanceof Er}class Er{format;style;anchor;focus;_cachedNodes;dirty;constructor(t,e,n,r){this.anchor=t,this.focus=e,t._selection=this,e._selection=this,this._cachedNodes=null,this.format=n,this.style=r,this.dirty=false;}getCachedNodes(){return this._cachedNodes}setCachedNodes(t){this._cachedNodes=t;}is(t){return !!wr(t)&&(this.anchor.is(t.anchor)&&this.focus.is(t.focus)&&this.format===t.format&&this.style===t.style)}isCollapsed(){return this.anchor.is(this.focus)}getNodes(){const t=this._cachedNodes;if(null!==t)return t;const e=function(t){const e=[],[n,r]=t.getTextSlices();n&&e.push(n.caret.origin);const i=new Set,o=new Set;for(const n of t)if(sl(n)){const{origin:t}=n;0===e.length?i.add(t):(o.add(t),e.push(t));}else {const{origin:t}=n;Pi(t)&&o.has(t)||e.push(t);}r&&e.push(r.caret.origin);if(ol(t.focus)&&Pi(t.focus.origin)&&null===t.focus.getNodeAtCaret())for(let n=gl(t.focus.origin,"previous");sl(n)&&i.has(n.origin)&&!n.origin.isEmpty()&&n.origin.is(e[e.length-1]);n=pl(n))i.delete(n.origin),e.pop();for(;e.length>1;){const t=e[e.length-1];if(!Pi(t)||o.has(t)||t.isEmpty()||i.has(t))break;e.pop();}if(0===e.length&&t.isCollapsed()){const n=zl(t.anchor),r=zl(t.anchor.getFlipped()),i=t=>rl(t)?t.origin:t.getNodeAtCaret(),o=i(n)||i(r)||(t.anchor.getNodeAtCaret()?n.origin:r.origin);e.push(o);}return e}(Wl(Dl(this),"next"));return fi()||(this._cachedNodes=e),e}setTextNodeRange(t,e,n,r){this.anchor.set(t.__key,e,"text"),this.focus.set(n.__key,r,"text");}getTextContent(){const t=this.getNodes();if(0===t.length)return "";const e=t[0],n=t[t.length-1],r=this.anchor,i=this.focus,o=r.isBefore(i),[s,l]=Ar(this);let c="",a=true;for(let u=0;u<t.length;u++){const f=t[u];if(Pi(f)&&!f.isInline())a||(c+="\n"),a=!f.isEmpty();else if(a=false,yr(f)){let t=f.getTextContent();f===e?f===n?"element"===r.type&&"element"===i.type&&i.offset!==r.offset||(t=s<l?t.slice(s,l):t.slice(l,s)):t=o?t.slice(s):t.slice(l):f===n&&(t=o?t.slice(0,l):t.slice(0,s)),c+=t;}else !Li(f)&&!Zn(f)||f===n&&this.isCollapsed()||(c+=f.getTextContent());}return c}applyDOMRange(t){const e=_i(),n=e.getEditorState()._selection,r=zr(t.startContainer,t.startOffset,t.endContainer,t.endOffset,e,n);if(null===r)return;const[i,o]=r;this.anchor.set(i.key,i.offset,i.type,true),this.focus.set(o.key,o.offset,o.type,true),Ct$4(this);}clone(){const t=this.anchor,e=this.focus;return new Er(Tr(t.key,t.offset,t.type),Tr(e.key,e.offset,e.type),this.format,this.style)}toggleFormat(t){this.format=To(this.format,t,null),this.dirty=true;}setFormat(t){this.format=t,this.dirty=true;}setStyle(t){this.style=t,this.dirty=true;}hasFormat(t){const e=z$5[t];return 0!==(this.format&e)}insertRawText(t){const e=t.split(/(\r?\n|\t)/),n=[],r=e.length;for(let t=0;t<r;t++){const r=e[t];"\n"===r||"\r\n"===r?n.push(Qn()):"\t"===r?n.push(Cr()):n.push(pr(r));}this.insertNodes(n);}insertText(e){const n=this.anchor,r=this.focus,i=this.format,o=this.style;let s=n,l=r;!this.isCollapsed()&&r.isBefore(n)&&(s=r,l=n),"element"===s.type&&function(t,e,n,r){const i=t.getNode(),o=i.getChildAtIndex(t.offset),s=pr();if(s.setFormat(n),s.setStyle(r),Yi(o))o.splice(0,0,[s]);else {const t=Ki(i)?Vi().append(s):s;null===o?i.append(t):o.insertBefore(t);}t.is(e)&&e.set(s.__key,0,"text"),t.set(s.__key,0,"text");}(s,l,i,o),"element"===l.type&&Ml(l,zl(Ol(l,"next")));const c=s.offset;let a=l.offset;const u=this.getNodes(),f=u.length;let d=u[0];yr(d)||t(26);const h=d.getTextContent().length,g=d.getParentOrThrow();let _=u[f-1];if(1===f&&"element"===l.type&&(a=h,l.set(s.key,a,"text")),this.isCollapsed()&&c===h&&(xo(d)||!d.canInsertTextAfter()||!g.canInsertTextAfter()&&null===d.getNextSibling())){let t=d.getNextSibling();if(yr(t)&&t.canInsertTextBefore()&&!xo(t)||(t=pr(),t.setFormat(i),t.setStyle(o),g.canInsertTextAfter()?d.insertAfter(t):g.insertAfter(t)),t.select(0,0),d=t,""!==e)return void this.insertText(e)}else if(this.isCollapsed()&&0===c&&(xo(d)||!d.canInsertTextBefore()||!g.canInsertTextBefore()&&null===d.getPreviousSibling())){let t=d.getPreviousSibling();if(yr(t)&&!xo(t)||(t=pr(),t.setFormat(i),g.canInsertTextBefore()?d.insertBefore(t):g.insertBefore(t)),t.select(),d=t,""!==e)return void this.insertText(e)}else if(d.isSegmented()&&c!==h){const t=pr(d.getTextContent());t.setFormat(i),d.replace(t),d=t;}else if(!this.isCollapsed()&&""!==e){const t=_.getParent();if(!g.canInsertTextBefore()||!g.canInsertTextAfter()||Pi(t)&&(!t.canInsertTextBefore()||!t.canInsertTextAfter()))return this.insertText(""),Kr(this.anchor,this.focus),void this.insertText(e)}if(1===f){if(mo(d)){const t=pr(e);return t.select(),void d.replace(t)}const t=d.getFormat(),n=d.getStyle();if(c!==a||t===i&&n===o){if(Sr(d)){const t=pr(e);return t.setFormat(i),t.setStyle(o),t.select(),void d.replace(t)}}else {if(""!==d.getTextContent()){const t=pr(e);if(t.setFormat(i),t.setStyle(o),t.select(),0===c)d.insertBefore(t,false);else {const[e]=d.splitText(c);e.insertAfter(t,false);}return void(t.isComposing()&&"text"===this.anchor.type&&(this.anchor.offset-=e.length))}d.setFormat(i),d.setStyle(o);}const r=a-c;d=d.spliceText(c,r,e,true),""===d.getTextContent()?d.remove():"text"===this.anchor.type&&(this.format=t,this.style=n,d.isComposing()&&(this.anchor.offset-=e.length));}else {const t=new Set([...d.getParentKeys(),..._.getParentKeys()]),n=Pi(d)?d:d.getParentOrThrow();let r=Pi(_)?_:_.getParentOrThrow(),i=_;if(!n.is(r)&&r.isInline())do{i=r,r=r.getParentOrThrow();}while(r.isInline());if("text"===l.type&&(0!==a||""===_.getTextContent())||"element"===l.type&&_.getIndexWithinParent()<a)if(yr(_)&&!mo(_)&&a!==_.getTextContentSize()){if(_.isSegmented()){const t=pr(_.getTextContent());_.replace(t),_=t;}Ki(l.getNode())||"text"!==l.type||(_=_.spliceText(0,a,"")),t.add(_.__key);}else {const t=_.getParentOrThrow();t.canBeEmpty()||1!==t.getChildrenSize()?_.remove():t.remove();}else t.add(_.__key);const o=r.getChildren(),s=new Set(u),g=n.is(r),p=n.isInline()&&null===d.getNextSibling()?n:d;for(let t=o.length-1;t>=0;t--){const e=o[t];if(e.is(d)||Pi(e)&&e.isParentOf(d))break;e.isAttached()&&(!s.has(e)||e.is(i)?g||p.insertAfter(e,false):e.remove());}if(!g){let e=r,n=null;for(;null!==e;){const r=e.getChildren(),i=r.length;(0===i||r[i-1].is(n))&&(t.delete(e.__key),n=e),e=e.getParent();}}if(mo(d))if(c===h)d.select();else {const t=pr(e);t.select(),d.replace(t);}else d=d.spliceText(c,h-c,e,true),""===d.getTextContent()?d.remove():"text"===this.anchor.type&&(this.format=d.getFormat(),this.style=d.getStyle(),d.isComposing()&&(this.anchor.offset-=e.length));for(let e=1;e<f;e++){const n=u[e],r=n.__key;t.has(r)||n.remove();}}}removeText(){const t=$r()===this;Pl(this,Kl(Dl(this))),t&&$r()!==this&&zo(this);}formatText(t,e=null){if(this.isCollapsed())return this.toggleFormat(t),void Eo(null);const n=this.getNodes(),r=[];for(const t of n)yr(t)&&r.push(t);const i=e=>{n.forEach(n=>{if(Pi(n)){const r=n.getFormatFlags(t,e);n.setTextFormat(r);}});},o=r.length;if(0===o)return this.toggleFormat(t),Eo(null),void i(e);const s=this.anchor,l=this.focus,c=this.isBackward(),a=c?l:s,u=c?s:l;let f=0,d=r[0],h="element"===a.type?0:a.offset;if("text"===a.type&&h===d.getTextContentSize()&&(f=1,d=r[1],h=0),null==d)return;const g=d.getFormatFlags(t,e);i(g);const _=o-1;let p=r[_];const y="text"===u.type?u.offset:p.getTextContentSize();if(d.is(p)){if(h===y)return;if(xo(d)||0===h&&y===d.getTextContentSize())d.setFormat(g);else {const t=d.splitText(h,y),e=0===h?t[0]:t[1];e.setFormat(g),"text"===a.type&&a.set(e.__key,0,"text"),"text"===u.type&&u.set(e.__key,y-h,"text");}return void(this.format=g)}0===h||xo(d)||([,d]=d.splitText(h),h=0),d.setFormat(g);const m=p.getFormatFlags(t,g);y>0&&(y===p.getTextContentSize()||xo(p)||([p]=p.splitText(y)),p.setFormat(m));for(let e=f+1;e<_;e++){const n=r[e],i=n.getFormatFlags(t,m);n.setFormat(i);}"text"===a.type&&a.set(d.__key,h,"text"),"text"===u.type&&u.set(p.__key,y,"text"),this.format=g|m;}insertNodes(e){if(0===e.length)return;if(this.isCollapsed()||this.removeText(),"root"===this.anchor.key){this.insertParagraph();const n=$r();return wr(n)||t(134),n.insertNodes(e)}const n=(this.isBackward()?this.focus:this.anchor).getNode(),r=qs(n,Ls),i=e[e.length-1];if(Pi(r)&&"__language"in r){if("__language"in e[0])this.insertText(e[0].getTextContent());else {const t=ni(this);r.splice(t,0,e),i.selectEnd();}return}if(!e.some(t=>(Pi(t)||Li(t))&&!t.isInline())){Pi(r)||t(211,n.constructor.name,n.getType());const o=ni(this);return r.splice(o,0,e),void i.selectEnd()}const o=function(t){const e=Vi();let n=null;for(let r=0;r<t.length;r++){const i=t[r],o=Zn(i);if(o||Li(i)&&i.isInline()||Pi(i)&&i.isInline()||yr(i)||i.isParentRequired()){if(null===n&&(n=i.createParentElementNode(),e.append(n),o))continue;null!==n&&n.append(i);}else e.append(i),n=null;}return e}(e),s=o.getLastDescendant(),l=o.getChildren(),c=!Pi(r)||!r.isEmpty()?this.insertParagraph():null,a=l[l.length-1];let u=l[0];var f;Pi(f=u)&&Ls(f)&&!f.isEmpty()&&Pi(r)&&(!r.isEmpty()||r.canMergeWhenEmpty())&&(Pi(r)||t(211,n.constructor.name,n.getType()),r.append(...u.getChildren()),u=l[1]),u&&(null===r&&t(212,n.constructor.name,n.getType()),function(e,n){const r=n.getParentOrThrow().getLastChild();let i=n;const o=[n];for(;i!==r;)i.getNextSibling()||t(140),i=i.getNextSibling(),o.push(i);let s=e;for(const t of o)s=s.insertAfter(t);}(r,u));const d=qs(s,Ls);c&&Pi(d)&&(c.canMergeWhenEmpty()||Ls(a))&&(d.append(...c.getChildren()),c.remove()),Pi(r)&&r.isEmpty()&&r.remove(),s.selectEnd();const h=Pi(r)?r.getLastChild():null;Zn(h)&&d!==r&&h.remove();}insertParagraph(){if("root"===this.anchor.key){const t=Vi();return Io().splice(this.anchor.offset,0,[t]),t.select(),t}const e=ni(this),n=qs(this.anchor.getNode(),Ls);Pi(n)||t(213);const r=n.getChildAtIndex(e),i=r?[r,...r.getNextSiblings()]:[],o=n.insertNewAfter(this,false);return o?(o.append(...i),o.selectStart(),o):null}insertLineBreak(t){const e=Qn();if(this.insertNodes([e]),t){const t=e.getParentOrThrow(),n=e.getIndexWithinParent();t.select(n,n);}}extract(){const t=[...this.getNodes()],e=t.length;let n=t[0],r=t[e-1];const[i,o]=Ar(this),s=this.isBackward(),[l,c]=s?[this.focus,this.anchor]:[this.anchor,this.focus],[a,u]=s?[o,i]:[i,o];if(0===e)return [];if(1===e){if(yr(n)&&!this.isCollapsed()){const t=n.splitText(a,u),e=0===a?t[0]:t[1];return e?(l.set(e.getKey(),0,"text"),c.set(e.getKey(),e.getTextContentSize(),"text"),[e]):[]}return [n]}if(yr(n)&&(a===n.getTextContentSize()?t.shift():0!==a&&([,n]=n.splitText(a),t[0]=n,l.set(n.getKey(),0,"text"))),yr(r)){const e=r.getTextContent().length;0===u?t.pop():u!==e&&([r]=r.splitText(u),t[t.length-1]=r,c.set(r.getKey(),r.getTextContentSize(),"text"));}return t}modify(t,e,n){if(ii(this,t,e,n))return;const r="move"===t,i=_i(),o=bs(ps(i));if(!o)return;const s=i._blockCursorElement,l=i._rootElement,c=this.focus.getNode();if(null===l||null===s||!Pi(c)||c.isInline()||c.canBeEmpty()||Ns(s,i,l),this.dirty){let t=cs(i,this.anchor.key),e=cs(i,this.focus.key);"text"===this.anchor.type&&(t=vo(t)),"text"===this.focus.type&&(e=vo(e)),t&&e&&Xr(o,t,this.anchor.offset,e,this.focus.offset);}if(function(t,e,n,r){t.modify(e,n,r);}(o,t,e?"backward":"forward",n),o.rangeCount>0){const t=o.getRangeAt(0),n=this.anchor.getNode(),i=Ki(n)?n:ms(n);if(this.applyDOMRange(t),this.dirty=true,!r){const n=this.getNodes(),r=[];let s=false;for(let t=0;t<n.length;t++){const e=n[t];gs(e,i)?r.push(e):s=true;}if(s&&r.length>0)if(e){const t=r[0];Pi(t)?t.selectStart():t.getParentOrThrow().selectStart();}else {const t=r[r.length-1];Pi(t)?t.selectEnd():t.getParentOrThrow().selectEnd();}o.anchorNode===t.startContainer&&o.anchorOffset===t.startOffset||function(t){const e=t.focus,n=t.anchor,r=n.key,i=n.offset,o=n.type;n.set(e.key,e.offset,e.type,true),e.set(r,i,o,true);}(this);}}"lineboundary"===n&&ii(this,t,e,n,"decorators");}forwardDeletion(t,e,n){if(!n&&("element"===t.type&&Pi(e)&&t.offset===e.getChildrenSize()||"text"===t.type&&t.offset===e.getTextContentSize())){const t=e.getParent(),n=e.getNextSibling()||(null===t?null:t.getNextSibling());if(Pi(n)&&n.isShadowRoot())return  true}return  false}deleteCharacter(t){const e=this.isCollapsed();if(this.isCollapsed()){const e=this.anchor;let n=e.getNode();if(this.forwardDeletion(e,n,t))return;const r=Cl(Ol(e,t?"previous":"next"));if(r.getTextSlices().every(t=>null===t||0===t.distance)){let t={type:"initial"};for(const e of r.iterNodeCarets("shadowRoot"))if(sl(e))if(e.origin.isInline());else {if(e.origin.isShadowRoot()){if("merge-block"===t.type)break;if(Pi(r.anchor.origin)&&r.anchor.origin.isEmpty()){const t=zl(e);Pl(this,vl(t,t)),r.anchor.origin.remove();}return}"merge-next-block"!==t.type&&"merge-block"!==t.type||(t={block:t.block,caret:e,type:"merge-block"});}else {if("merge-block"===t.type)break;if(ol(e)){if(Pi(e.origin)){if(e.origin.isInline()){if(!e.origin.isParentOf(r.anchor.origin))break}else t={block:e.origin,type:"merge-next-block"};continue}if(Li(e.origin)){if(e.origin.isIsolated());else if("merge-next-block"===t.type&&(e.origin.isKeyboardSelectable()||!e.origin.isInline())&&Pi(r.anchor.origin)&&r.anchor.origin.isEmpty()){r.anchor.origin.remove();const t=Jr();t.add(e.origin.getKey()),zo(t);}else e.origin.remove();return}break}}if("merge-block"===t.type){const{caret:e,block:n}=t;return Pl(this,vl(!e.origin.isEmpty()&&n.isEmpty()?Fl(ul(n,e.direction)):r.anchor,e)),this.removeText()}}const i=this.focus;if(this.modify("extend",t,"character"),this.isCollapsed()){if(t&&0===e.offset&&Pr(this,e.getNode()))return}else {const r="text"===i.type?i.getNode():null;if(n="text"===e.type?e.getNode():null,null!==r&&r.isSegmented()){const e=i.offset,o=r.getTextContentSize();if(r.is(n)||t&&e!==o||!t&&0!==e)return void Fr(r,t,e)}else if(null!==n&&n.isSegmented()){const i=e.offset,o=n.getTextContentSize();if(n.is(r)||t&&0!==i||!t&&i!==o)return void Fr(n,t,i)}!function(t,e){const n=t.anchor,r=t.focus,i=n.getNode(),o=r.getNode();if(i===o&&"text"===n.type&&"text"===r.type){const t=n.offset,o=r.offset,s=t<o,l=s?t:o,c=s?o:t,a=c-1;if(l!==a){(function(t){return !(Bo(t)||Dr(t))})(i.getTextContent().slice(l,c))&&(e?r.set(r.key,a,r.type):n.set(n.key,a,n.type));}}}(this,t);}}if(this.removeText(),t&&!e&&this.isCollapsed()&&"element"===this.anchor.type&&0===this.anchor.offset){const t=this.anchor.getNode();t.isEmpty()&&Ki(t.getParent())&&null===t.getPreviousSibling()&&Pr(this,t);}}deleteLine(t){this.isCollapsed()&&this.modify("extend",t,"lineboundary"),this.isCollapsed()?this.deleteCharacter(t):this.removeText();}deleteWord(t){if(this.isCollapsed()){const e=this.anchor,n=e.getNode();if(this.forwardDeletion(e,n,t))return;this.modify("extend",t,"word");}this.removeText();}isBackward(){return this.focus.isBefore(this.anchor)}getStartEndPoints(){return [this.anchor,this.focus]}}function Or(t){return t instanceof br}function Mr(t){const e=t.offset;if("text"===t.type)return e;const n=t.getNode();return e===n.getChildrenSize()?n.getTextContent().length:0}function Ar(t){const e=t.getStartEndPoints();if(null===e)return [0,0];const[n,r]=e;return "element"===n.type&&"element"===r.type&&n.key===r.key&&n.offset===r.offset?[0,0]:[Mr(n),Mr(r)]}function Pr(t,e){for(let n=e;n;n=n.getParent()){if(Pi(n)){if(n.collapseAtStart(t))return  true;if(xs(n))break}if(n.getPreviousSibling())break}return  false}const Dr=(()=>{try{const t=new RegExp("\\p{Emoji}","u"),e=t.test.bind(t);if(e("❤️")&&e("#️⃣")&&e("👍"))return e}catch(t){}return ()=>false})();function Fr(t,e,n){const r=t,i=r.getTextContent().split(/(?=\s)/g),o=i.length;let s=0,l=0;for(let t=0;t<o;t++){const r=t===o-1;if(l=s,s+=i[t].length,e&&s===n||s>n||r){i.splice(t,1),r&&(l=void 0);break}}const c=i.join("").trim();""===c?r.remove():(r.setTextContent(c),r.select(l,l));}function Lr(e,n,r,i){let o,s=n;if(Ms(e)){let l=false;const c=e.childNodes,a=c.length,u=i._blockCursorElement;s===a&&(l=true,s=a-1);let f=c[s],d=false;if(f===u)f=c[s+1],d=true;else if(null!==u){const t=u.parentNode;if(e===t){n>Array.prototype.indexOf.call(t.children,u)&&s--;}}if(o=Ro(f),yr(o))s=dl(o,l?"next":"previous");else {let c=Ro(e);if(null===c)return null;if(Pi(c)){const a=i.getElementByKey(c.getKey());null===a&&t(214);const u=c.getDOMSlot(a);[c,s]=u.resolveChildIndex(c,a,e,n),Pi(c)||t(215),l&&s>=c.getChildrenSize()&&(s=Math.max(0,c.getChildrenSize()-1));let f=c.getChildAtIndex(s);if(Pi(f)&&function(t,e,n){const r=t.getParent();return null===n||null===r||!r.canBeEmpty()||r!==n.getNode()}(f,0,r)){const t=l?f.getLastDescendant():f.getFirstDescendant();null===t?c=f:(f=t,c=Pi(f)?f:f.getParentOrThrow()),s=0;}yr(f)?(o=f,c=null,s=dl(f,l?"next":"previous")):f!==c&&l&&!d&&(Pi(c)||t(216),s=Math.min(c.getChildrenSize(),s+1));}else {const t=c.getIndexWithinParent();s=0===n&&Li(c)&&Ro(e)===c?t:t+1,c=c.getParentOrThrow();}if(Pi(c))return Tr(c.__key,s,"element")}}else o=Ro(e);return yr(o)?Tr(o.__key,dl(o,s,"clamp"),"text"):null}function Ir(t,e,n){const r=t.offset,i=t.getNode();if(0===r){const r=i.getPreviousSibling(),o=i.getParent();if(e){if((n||!e)&&null===r&&Pi(o)&&o.isInline()){const e=o.getPreviousSibling();yr(e)&&t.set(e.__key,e.getTextContent().length,"text");}}else Pi(r)&&!n&&r.isInline()?t.set(r.__key,r.getChildrenSize(),"element"):yr(r)&&t.set(r.__key,r.getTextContent().length,"text");}else if(r===i.getTextContent().length){const r=i.getNextSibling(),o=i.getParent();if(e&&Pi(r)&&r.isInline())t.set(r.__key,0,"element");else if((n||e)&&null===r&&Pi(o)&&o.isInline()&&!o.canInsertTextAfter()){const e=o.getNextSibling();yr(e)&&t.set(e.__key,0,"text");}}}function Kr(t,e,n){if("text"===t.type&&"text"===e.type){const n=t.isBefore(e),r=t.is(e);Ir(t,n,r),Ir(e,!n,r),r&&e.set(t.key,t.offset,t.type);}}function zr(t,e,n,r,i,o){if(null===t||null===n||!ho(i,t,n))return null;const s=Lr(t,e,wr(o)?o.anchor:null,i);if(null===s)return null;const l=Lr(n,r,wr(o)?o.focus:null,i);if(null===l)return null;if("element"===s.type&&"element"===l.type){const e=Ro(t),r=Ro(n);if(Li(e)&&Li(r))return null}return Kr(s,l),[s,l]}function Rr(t){return Pi(t)&&!t.isInline()}function Br(t,e,n,r,i,o){const s=gi(),l=new Er(Tr(t,e,i),Tr(n,r,o),0,"");return l.dirty=true,s._selection=l,l}function Wr(){const t=Tr("root",0,"element"),e=Tr("root",0,"element");return new Er(t,e,0,"")}function Jr(){return new br(new Set)}function jr(t,e){return Ur(null,t,e,null)}function Ur(t,e,n,r){const i=n._window;if(null===i)return null;const o=r||i.event,s=o?o.type:void 0,l="selectionchange"===s,c=!Y$4&&(l||"beforeinput"===s||"compositionstart"===s||"compositionend"===s||"click"===s&&o&&3===o.detail||"drop"===s||void 0===s);let a,u,f,d;if(wr(t)&&!c)return t.clone();if(null===e)return null;if(a=e.anchorNode,u=e.focusNode,f=e.anchorOffset,d=e.focusOffset,(l||void 0===s)&&wr(t)&&!ho(n,a,u))return t.clone();const h=zr(a,f,u,d,n,t);if(null===h)return null;const[g,_]=h;let p=0,y="";if(wr(t)){const e=t.anchor;if(g.key===e.key)p=t.format,y=t.style;else {const t=g.getNode();yr(t)?(p=t.getFormat(),y=t.getStyle()):Pi(t)&&(p=t.getTextFormat(),y=t.getTextStyle());}}return new Er(g,_,p,y)}function $r(){return gi()._selection}function Vr(){return _i()._editorState._selection}function Yr(t,e,n,r=1){const i=t.anchor,o=t.focus,s=i.getNode(),l=o.getNode();if(!e.is(s)&&!e.is(l))return;const c=e.__key;if(t.isCollapsed()){const e=i.offset;if(n<=e&&r>0||n<e&&r<0){const n=Math.max(0,e+r);i.set(c,n,"element"),o.set(c,n,"element"),qr(t);}}else {const s=t.isBackward(),l=s?o:i,a=l.getNode(),u=s?i:o,f=u.getNode();if(e.is(a)){const t=l.offset;(n<=t&&r>0||n<t&&r<0)&&l.set(c,Math.max(0,t+r),"element");}if(e.is(f)){const t=u.offset;(n<=t&&r>0||n<t&&r<0)&&u.set(c,Math.max(0,t+r),"element");}}qr(t);}function qr(t){const e=t.anchor,n=e.offset,r=t.focus,i=r.offset,o=e.getNode(),s=r.getNode();if(t.isCollapsed()){if(!Pi(o))return;const t=o.getChildrenSize(),i=n>=t,s=i?o.getChildAtIndex(t-1):o.getChildAtIndex(n);if(yr(s)){let t=0;i&&(t=s.getTextContentSize()),e.set(s.__key,t,"text"),r.set(s.__key,t,"text");}return}if(Pi(o)){const t=o.getChildrenSize(),r=n>=t,i=r?o.getChildAtIndex(t-1):o.getChildAtIndex(n);if(yr(i)){let t=0;r&&(t=i.getTextContentSize()),e.set(i.__key,t,"text");}}if(Pi(s)){const t=s.getChildrenSize(),e=i>=t,n=e?s.getChildAtIndex(t-1):s.getChildAtIndex(i);if(yr(n)){let t=0;e&&(t=n.getTextContentSize()),r.set(n.__key,t,"text");}}}function Hr(t,e,n,r,i){let o=null,s=0,l=null;null!==r?(o=r.__key,yr(r)?(s=r.getTextContentSize(),l="text"):Pi(r)&&(s=r.getChildrenSize(),l="element")):null!==i&&(o=i.__key,yr(i)?l="text":Pi(i)&&(l="element")),null!==o&&null!==l?t.set(o,s,l):(s=e.getIndexWithinParent(),-1===s&&(s=n.getChildrenSize()),t.set(n.__key,s,"element"));}function Gr(t,e,n,r,i){"text"===t.type?t.set(n,t.offset+(e?0:i),"text"):t.offset>r.getIndexWithinParent()&&t.set(t.key,t.offset-1,"element");}function Xr(t,e,n,r,i){try{t.setBaseAndExtent(e,n,r,i);}catch(t){}}function Qr(t,e,n){const r=cs(t,e.getKey());if(Pi(e)){const t=e.getDOMSlot(r);return [t.element,n+t.getFirstChildOffset()]}return [r,n]}function Zr(t,e,n,r,i,s,l){const c=r.anchorNode,a=r.focusNode,u=r.anchorOffset,f=r.focusOffset,d=document.activeElement;if(i.has(jn)&&d!==s||null!==d&&fo(d))return;if(!wr(e))return void(null!==t&&ho(n,c,a)&&r.removeAllRanges());const h=e.anchor,g=e.focus,_=h.getNode(),p=g.getNode(),[y,m]=Qr(n,_,h.offset),[x,C]=Qr(n,p,g.offset),S=e.format,v=e.style,T=e.isCollapsed();let k=y,N=x,b=false;var w,E,O,M,A;if(("text"===h.type?(k=vo(y),b=_.getFormat()!==S||_.getStyle()!==v):wr(t)&&"text"===t.anchor.type&&(b=true),"text"===g.type&&(N=vo(x)),null!==k&&null!==N)&&(T&&(null===t||b||wr(t)&&(t.format!==S||t.style!==v))&&(w=S,E=v,O=m,M=h.key,A=performance.now(),gn$1=[w,E,O,M,A]),u!==m||f!==C||c!==k||a!==N||"Range"===r.type&&T||(null!==d&&s.contains(d)||i.has(Yn)||s.focus({preventScroll:true}),"element"===h.type))){if(Xr(r,k,m,N,C),!o||!e.isCollapsed()||null===s||i.has(Yn)||null!==document.activeElement&&s.contains(document.activeElement)||s.focus({preventScroll:true}),!i.has($n)&&e.isCollapsed()&&null!==s&&s===document.activeElement){const t=wr(e)&&"element"===e.anchor.type?k.childNodes[m]||null:r.rangeCount>0?r.getRangeAt(0):null;if(null!==t){let e;if(t instanceof Text){const n=document.createRange();n.selectNode(t),e=n.getBoundingClientRect();}else e=t.getBoundingClientRect();!function(t,e,n){const r=us(n),i=_s(r);if(null===r||null===i)return;let{top:o,bottom:s}=e,l=0,c=0,a=n;for(;null!==a;){const e=a===r.body;if(e)l=0,c=ps(t).innerHeight;else {const t=a.getBoundingClientRect();l=t.top,c=t.bottom;}let n=0;if(o<l?n=-(l-o):s>c&&(n=s-c),0!==n)if(e)i.scrollBy(0,n);else {const t=a.scrollTop;a.scrollTop+=n;const e=a.scrollTop-t;o-=e,s-=e;}if(e)break;a=as(a);}}(n,e,s);}}ln$1=true;}}function ti(t){let e=$r()||Vr();null===e&&(e=Io().selectEnd()),e.insertNodes(t);}function ni(e){let n=e;e.isCollapsed()||n.removeText();const r=$r();wr(r)&&(n=r),wr(n)||t(161);const i=n.anchor;let o=i.getNode(),s=i.offset;for(;!Ls(o);){const t=o;if([o,s]=ri(o,s),t.is(o))break}return s}function ri(t,e){const n=t.getParent();if(!n){const t=Vi();return Io().append(t),t.select(),[Io(),0]}if(yr(t)){const r=t.splitText(e);if(0===r.length)return [n,t.getIndexWithinParent()];const i=0===e?0:1;return [n,r[0].getIndexWithinParent()+i]}if(!Pi(t)||0===e)return [n,t.getIndexWithinParent()];const r=t.getChildAtIndex(e);if(r){const n=new Er(Tr(t.__key,e,"element"),Tr(t.__key,e,"element"),0,""),i=t.insertNewAfter(n);i&&i.append(r,...r.getNextSiblings());}return [n,t.getIndexWithinParent()+1]}function ii(t,e,n,r,i="decorators-and-blocks"){if("move"===e&&"character"===r&&!t.isCollapsed()){const[e,r]=n===t.isBackward()?[t.focus,t.anchor]:[t.anchor,t.focus];return r.set(e.key,e.offset,e.type),true}const o=Ol(t.focus,n?"previous":"next"),s="lineboundary"===r,l="move"===e;let c=o,a="decorators-and-blocks"===i;if(!Rl(c)){for(const t of c){a=false;const{origin:e}=t;if(!Li(e)||e.isIsolated()||(c=t,!s||!e.isInline()))break}if(a)for(const t of Cl(o).iterNodeCarets("extend"===e?"shadowRoot":"root")){if(sl(t))t.origin.isInline()||(c=t);else {if(Pi(t.origin))continue;Li(t.origin)&&!t.origin.isInline()&&(c=t);}break}}if(c===o)return  false;if(l&&!s&&Li(c.origin)&&c.origin.isKeyboardSelectable()){const t=Jr();return t.add(c.origin.getKey()),zo(t),true}return c=zl(c),l&&Ml(t.anchor,c),Ml(t.focus,c),a||!s}let oi=null,si=null,li=false,ci=false,ai=0;const ui={characterData:true,childList:true,subtree:true};function fi(){return li||null!==oi&&oi._readOnly}function di(){li&&t(13);}function hi(){ai>99&&t(14);}function gi(){return null===oi&&t(195,pi()),oi}function _i(){return null===si&&t(196,pi()),si}function pi(){let t=0;const e=new Set,n=no.version;if("undefined"!=typeof window)for(const r of document.querySelectorAll("[contenteditable]")){const i=po(r);if(go(i))t++;else if(i){let t=String(i.constructor.version||"<0.17.1");t===n&&(t+=" (separately built, likely a bundler configuration issue)"),e.add(t);}}let r=` Detected on the page: ${t} compatible editor(s) with version ${n}`;return e.size&&(r+=` and incompatible editors with versions ${Array.from(e).join(", ")}`),r}function yi(){return si}function mi(t,e,n){const r=e.__type,i=lo(t,r);let o=n.get(r);void 0===o&&(o=Array.from(i.transforms),n.set(r,o));const s=o.length;for(let t=0;t<s&&(o[t](e),e.isAttached());t++);}function xi(t,e){return void 0!==t&&t.__key!==e&&t.isAttached()}function Ci(t,e){if(!e)return;const n=t._updateTags;let r=e;Array.isArray(e)||(r=[e]);for(const t of r)n.add(t);}function Si(t){return vi(t,_i()._nodes)}function vi(e,n){const r=e.type,i=n.get(r);void 0===i&&t(17,r);const o=i.klass;e.type!==o.getType()&&t(18,o.name);const s=o.importJSON(e),l=e.children;if(Pi(s)&&Array.isArray(l))for(let t=0;t<l.length;t++){const e=vi(l[t],n);s.append(e);}return s}function Ti(t,e,n){const r=oi,i=li,o=si;oi=e,li=true,si=t;try{return n()}finally{oi=r,li=i,si=o;}}function ki(t,e){const n=t._pendingEditorState,r=t._rootElement,i=t._headless||null===r;if(null===n)return;const o=t._editorState,s=o._selection,l=n._selection,c=0!==t._dirtyType,a=oi,u=li,f=si,d=t._updating,h=t._observer;let g=null;if(t._pendingEditorState=null,t._editorState=n,!i&&c&&null!==h){si=t,oi=n,li=false,t._updating=true;try{const e=t._dirtyType,r=t._dirtyElements,i=t._dirtyLeaves;h.disconnect(),g=te$3(o,n,t,e,r,i);}catch(e){if(e instanceof Error&&t._onError(e),ci)throw e;return Zi(t,null,r,n),nt$3(t),t._dirtyType=2,ci=true,ki(t,o),void(ci=false)}finally{h.observe(r,ui),t._updating=d,oi=a,li=u,si=f;}}n._readOnly||(n._readOnly=true);const _=t._dirtyLeaves,p=t._dirtyElements,y=t._normalizedNodes,m=t._updateTags,x=t._deferred;c&&(t._dirtyType=0,t._cloneNotNeeded.clear(),t._dirtyLeaves=new Set,t._dirtyElements=new Map,t._normalizedNodes=new Set,t._updateTags=new Set),function(t,e){const n=t._decorators;let r=t._pendingDecorators||n;const i=e._nodeMap;let o;for(o in r)i.has(o)||(r===n&&(r=Fo(t)),delete r[o]);}(t,n);const C=i?null:bs(ps(t));if(t._editable&&null!==C&&(c||null===l||l.dirty||!l.is(s))&&null!==r&&!m.has(Vn)){si=t,oi=n;try{if(null!==h&&h.disconnect(),c||null===l||l.dirty){const e=t._blockCursorElement;null!==e&&Ns(e,t,r),Zr(s,l,t,C,m,r);}!function(t,e,n){let r=t._blockCursorElement;if(wr(n)&&n.isCollapsed()&&"element"===n.anchor.type&&e.contains(document.activeElement)){const i=n.anchor,o=i.getNode(),s=i.offset;let l=!1,c=null;if(s===o.getChildrenSize()){ks(o.getChildAtIndex(s-1))&&(l=!0);}else {const e=o.getChildAtIndex(s);if(null!==e&&ks(e)){const n=e.getPreviousSibling();(null===n||ks(n))&&(l=!0,c=t.getElementByKey(e.__key));}}if(l){const n=t.getElementByKey(o.__key);return null===r&&(t._blockCursorElement=r=function(t){const e=t.theme,n=document.createElement("div");n.contentEditable="false",n.setAttribute("data-lexical-cursor","true");let r=e.blockCursor;if(void 0!==r){if("string"==typeof r){const t=Ql(r);r=e.blockCursor=t;}void 0!==r&&n.classList.add(...r);}return n}(t._config)),e.style.caretColor="transparent",void(null===c?n.appendChild(r):n.insertBefore(r,c))}}null!==r&&Ns(r,t,e);}(t,r,l);}finally{null!==h&&h.observe(r,ui),si=f,oi=a;}}null!==g&&function(t,e,n,r,i){const o=Array.from(t._listeners.mutation),s=o.length;for(let t=0;t<s;t++){const[s,l]=o[t];for(const t of l){const o=e.get(t);void 0!==o&&s(o,{dirtyLeaves:r,prevEditorState:i,updateTags:n});}}}(t,g,m,_,o),wr(l)||null===l||null!==s&&s.is(l)||t.dispatchCommand(re$2,void 0);const S=t._pendingDecorators;null!==S&&(t._decorators=S,t._pendingDecorators=null,Ni("decorator",t,true,S)),function(t,e,n){const r=Lo(e),i=Lo(n);r!==i&&Ni("textcontent",t,true,i);}(t,e||o,n),Ni("update",t,true,{dirtyElements:p,dirtyLeaves:_,editorState:n,mutatedNodes:g,normalizedNodes:y,prevEditorState:e||o,tags:m}),function(t,e){if(t._deferred=[],0!==e.length){const n=t._updating;t._updating=true;try{for(let t=0;t<e.length;t++)e[t]();}finally{t._updating=n;}}}(t,x),function(t){const e=t._updates;if(0!==e.length){const n=e.shift();if(n){const[e,r]=n;wi(t,e,r);}}}(t);}function Ni(t,e,n,...r){const i=e._updating;e._updating=n;try{const n=Array.from(e._listeners[t]);for(let t=0;t<n.length;t++)n[t].apply(null,r);}finally{e._updating=i;}}function bi(e,n){const r=e._updates;let i=n||false;for(;0!==r.length;){const n=r.shift();if(n){const[r,o]=n,s=e._pendingEditorState;let l;void 0!==o&&(l=o.onUpdate,o.skipTransforms&&(i=true),o.discrete&&(null===s&&t(191),s._flushSync=true),l&&e._deferred.push(l),Ci(e,o.tag)),null==s?wi(e,r,o):r();}}return i}function wi(e,n,r){const i=e._updateTags;let o,s=false,l=false;void 0!==r&&(o=r.onUpdate,Ci(e,r.tag),s=r.skipTransforms||false,l=r.discrete||false),o&&e._deferred.push(o);const c=e._editorState;let a=e._pendingEditorState,u=false;(null===a||a._readOnly)&&(a=e._pendingEditorState=zi(a||c),u=true),a._flushSync=l;const f=oi,d=li,h=si,g=e._updating;oi=a,li=false,e._updating=true,si=e;const _=e._headless||null===e.getRootElement();io(null);try{u&&(_?null!==c._selection&&(a._selection=c._selection.clone()):a._selection=function(t,e){const n=t.getEditorState()._selection,r=bs(ps(t));return wr(n)||null==n?Ur(n,r,t,e):n.clone()}(e,r&&r.event||null));const i=e._compositionKey;n(),s=bi(e,s),function(t,e){const n=e.getEditorState()._selection,r=t._selection;if(wr(r)){const t=r.anchor,e=r.focus;let i;if("text"===t.type&&(i=t.getNode(),i.selectionTransform(n,r)),"text"===e.type){const t=e.getNode();i!==t&&t.selectionTransform(n,r);}}}(a,e),0!==e._dirtyType&&(s?function(t,e){const n=e._dirtyLeaves,r=t._nodeMap;for(const t of n){const e=r.get(t);yr(e)&&e.isAttached()&&e.isSimpleText()&&!e.isUnmergeable()&&xt$4(e);}}(a,e):function(t,e){const n=e._dirtyLeaves,r=e._dirtyElements,i=t._nodeMap,o=Oo(),s=new Map;let l=n,c=l.size,a=r,u=a.size;for(;c>0||u>0;){if(c>0){e._dirtyLeaves=new Set;for(const t of l){const r=i.get(t);yr(r)&&r.isAttached()&&r.isSimpleText()&&!r.isUnmergeable()&&xt$4(r),void 0!==r&&xi(r,o)&&mi(e,r,s),n.add(t);}if(l=e._dirtyLeaves,c=l.size,c>0){ai++;continue}}e._dirtyLeaves=new Set,e._dirtyElements=new Map,a.delete("root")&&a.set("root",!0);for(const t of a){const n=t[0],l=t[1];if(r.set(n,l),!l)continue;const c=i.get(n);void 0!==c&&xi(c,o)&&mi(e,c,s);}l=e._dirtyLeaves,c=l.size,a=e._dirtyElements,u=a.size,ai++;}e._dirtyLeaves=n,e._dirtyElements=r;}(a,e),bi(e),function(t,e,n,r){const i=t._nodeMap,o=e._nodeMap,s=[];for(const[t]of r){const e=o.get(t);void 0!==e&&(e.isAttached()||(Pi(e)&&V$4(e,t,i,o,s,r),i.has(t)||r.delete(t),s.push(t)));}for(const t of s)o.delete(t);for(const t of n){const e=o.get(t);void 0===e||e.isAttached()||(i.has(t)||n.delete(t),o.delete(t));}}(c,a,e._dirtyLeaves,e._dirtyElements));i!==e._compositionKey&&(a._flushSync=!0);const o=a._selection;if(wr(o)){const e=a._nodeMap,n=o.anchor.key,r=o.focus.key;void 0!==e.get(n)&&void 0!==e.get(r)||t(19);}else Or(o)&&0===o._nodes.size&&(a._selection=null);}catch(t){return t instanceof Error&&e._onError(t),e._pendingEditorState=c,e._dirtyType=2,e._cloneNotNeeded.clear(),e._dirtyLeaves=new Set,e._dirtyElements.clear(),void ki(e)}finally{oi=f,li=d,si=h,e._updating=g,ai=0;}const p=0!==e._dirtyType||e._deferred.length>0||function(t,e){const n=e.getEditorState()._selection,r=t._selection;if(null!==r){if(r.dirty||!r.is(n))return  true}else if(null!==n)return  true;return  false}(a,e);p?a._flushSync?(a._flushSync=false,ki(e)):u&&ao(()=>{ki(e);}):(a._flushSync=false,u&&(i.clear(),e._deferred=[],e._pendingEditorState=null));}function Ei(t,e,n){si===t&&void 0===n?e():wi(t,e,n);}class Oi{element;before;after;constructor(t,e,n){this.element=t,this.before=e||null,this.after=n||null;}withBefore(t){return new Oi(this.element,t,this.after)}withAfter(t){return new Oi(this.element,this.before,t)}withElement(t){return this.element===t?this:new Oi(t,this.before,this.after)}insertChild(e){const n=this.before||this.getManagedLineBreak();return null!==n&&n.parentElement!==this.element&&t(222),this.element.insertBefore(e,n),this}removeChild(e){return e.parentElement!==this.element&&t(223),this.element.removeChild(e),this}replaceChild(e,n){return n.parentElement!==this.element&&t(224),this.element.replaceChild(e,n),this}getFirstChild(){const t=this.after?this.after.nextSibling:this.element.firstChild;return t===this.before||t===this.getManagedLineBreak()?null:t}getManagedLineBreak(){return this.element.__lexicalLineBreak||null}setManagedLineBreak(t){if(null===t)this.removeManagedLineBreak();else {const e="decorator"===t&&(d$1||c||l);this.insertManagedLineBreak(e);}}removeManagedLineBreak(){const t=this.getManagedLineBreak();if(t){const e=this.element,n="IMG"===t.nodeName?t.nextSibling:null;n&&e.removeChild(n),e.removeChild(t),e.__lexicalLineBreak=void 0;}}insertManagedLineBreak(t){const e=this.getManagedLineBreak();if(e){if(t===("IMG"===e.nodeName))return;this.removeManagedLineBreak();}const n=this.element,r=this.before,i=document.createElement("br");if(n.insertBefore(i,r),t){const t=document.createElement("img");t.setAttribute("data-lexical-linebreak","true"),t.style.cssText="display: inline !important; border: 0px !important; margin: 0px !important;",t.alt="",n.insertBefore(t,i),n.__lexicalLineBreak=t;}else n.__lexicalLineBreak=i;}getFirstChildOffset(){let t=0;for(let e=this.after;null!==e;e=e.previousSibling)t++;return t}resolveChildIndex(t,e,n,r){if(n===this.element){const e=this.getFirstChildOffset();return [t,Math.min(e+t.getChildrenSize(),Math.max(e,r))]}const i=Mi(e,n);i.push(r);const o=Mi(e,this.element);let s=t.getIndexWithinParent();for(let t=0;t<o.length;t++){const e=i[t],n=o[t];if(void 0===e||e<n)break;if(e>n){s+=1;break}}return [t.getParentOrThrow(),s]}}function Mi(e,n){const r=[];let i=n;for(;i!==e&&null!==i;i=i.parentNode){let t=0;for(let e=i.previousSibling;null!==e;e=e.previousSibling)t++;r.push(t);}return i!==e&&t(225),r.reverse()}class Ai extends zn{__first;__last;__size;__format;__style;__indent;__dir;__textFormat;__textStyle;constructor(t){super(t),this.__first=null,this.__last=null,this.__size=0,this.__format=0,this.__style="",this.__indent=0,this.__dir=null,this.__textFormat=0,this.__textStyle="";}afterCloneFrom(t){super.afterCloneFrom(t),this.__key===t.__key&&(this.__first=t.__first,this.__last=t.__last,this.__size=t.__size),this.__indent=t.__indent,this.__format=t.__format,this.__style=t.__style,this.__dir=t.__dir,this.__textFormat=t.__textFormat,this.__textStyle=t.__textStyle;}getFormat(){return this.getLatest().__format}getFormatType(){const t=this.getFormat();return W$4[t]||""}getStyle(){return this.getLatest().__style}getIndent(){return this.getLatest().__indent}getChildren(){const t=[];let e=this.getFirstChild();for(;null!==e;)t.push(e),e=e.getNextSibling();return t}getChildrenKeys(){const t=[];let e=this.getFirstChild();for(;null!==e;)t.push(e.__key),e=e.getNextSibling();return t}getChildrenSize(){return this.getLatest().__size}isEmpty(){return 0===this.getChildrenSize()}isDirty(){const t=_i()._dirtyElements;return null!==t&&t.has(this.__key)}isLastChild(){const t=this.getLatest(),e=this.getParentOrThrow().getLastChild();return null!==e&&e.is(t)}getAllTextNodes(){const t=[];let e=this.getFirstChild();for(;null!==e;){if(yr(e)&&t.push(e),Pi(e)){const n=e.getAllTextNodes();t.push(...n);}e=e.getNextSibling();}return t}getFirstDescendant(){let t=this.getFirstChild();for(;Pi(t);){const e=t.getFirstChild();if(null===e)break;t=e;}return t}getLastDescendant(){let t=this.getLastChild();for(;Pi(t);){const e=t.getLastChild();if(null===e)break;t=e;}return t}getDescendantByIndex(t){const e=this.getChildren(),n=e.length;if(t>=n){const t=e[n-1];return Pi(t)&&t.getLastDescendant()||t||null}const r=e[t];return Pi(r)&&r.getFirstDescendant()||r||null}getFirstChild(){const t=this.getLatest().__first;return null===t?null:Mo(t)}getFirstChildOrThrow(){const e=this.getFirstChild();return null===e&&t(45,this.__key),e}getLastChild(){const t=this.getLatest().__last;return null===t?null:Mo(t)}getLastChildOrThrow(){const e=this.getLastChild();return null===e&&t(96,this.__key),e}getChildAtIndex(t){const e=this.getChildrenSize();let n,r;if(t<e/2){for(n=this.getFirstChild(),r=0;null!==n&&r<=t;){if(r===t)return n;n=n.getNextSibling(),r++;}return null}for(n=this.getLastChild(),r=e-1;null!==n&&r>=t;){if(r===t)return n;n=n.getPreviousSibling(),r--;}return null}getTextContent(){let t="";const e=this.getChildren(),n=e.length;for(let r=0;r<n;r++){const i=e[r];t+=i.getTextContent(),Pi(i)&&r!==n-1&&!i.isInline()&&(t+=P$2);}return t}getTextContentSize(){let t=0;const e=this.getChildren(),n=e.length;for(let r=0;r<n;r++){const i=e[r];t+=i.getTextContentSize(),Pi(i)&&r!==n-1&&!i.isInline()&&(t+=2);}return t}getDirection(){return this.getLatest().__dir}getTextFormat(){return this.getLatest().__textFormat}hasFormat(t){if(""!==t){const e=B$4[t];return 0!==(this.getFormat()&e)}return  false}hasTextFormat(t){const e=z$5[t];return 0!==(this.getTextFormat()&e)}getFormatFlags(t,e){return To(this.getLatest().__textFormat,t,e)}getTextStyle(){return this.getLatest().__textStyle}select(t,e){di();const n=$r();let r=t,i=e;const o=this.getChildrenSize();if(!this.canBeEmpty())if(0===t&&0===e){const t=this.getFirstChild();if(yr(t)||Pi(t))return t.select(0,0)}else if(!(void 0!==t&&t!==o||void 0!==e&&e!==o)){const t=this.getLastChild();if(yr(t)||Pi(t))return t.select()} void 0===r&&(r=o),void 0===i&&(i=o);const s=this.__key;return wr(n)?(n.anchor.set(s,r,"element"),n.focus.set(s,i,"element"),n.dirty=true,n):Br(s,r,s,i,"element","element")}selectStart(){const t=this.getFirstDescendant();return t?t.selectStart():this.select()}selectEnd(){const t=this.getLastDescendant();return t?t.selectEnd():this.select()}clear(){const t=this.getWritable();return this.getChildren().forEach(t=>t.remove()),t}append(...t){return this.splice(this.getChildrenSize(),0,t)}setDirection(t){const e=this.getWritable();return e.__dir=t,e}setFormat(t){return this.getWritable().__format=""!==t?B$4[t]:0,this}setStyle(t){return this.getWritable().__style=t||"",this}setTextFormat(t){const e=this.getWritable();return e.__textFormat=t,e}setTextStyle(t){const e=this.getWritable();return e.__textStyle=t,e}setIndent(t){return this.getWritable().__indent=t,this}splice(e,n,r){Kn$1(this)&&t(324,this.__key,this.__type);const i=this.getChildrenSize(),o=this.getWritable();e+n<=i||t(226,String(e),String(n),String(i));const s=o.__key,l=[],c=[],a=this.getChildAtIndex(e+n);let u=null,f=i-n+r.length;if(0!==e)if(e===i)u=this.getLastChild();else {const t=this.getChildAtIndex(e);null!==t&&(u=t.getPreviousSibling());}if(n>0){let e=null===u?this.getFirstChild():u.getNextSibling();for(let r=0;r<n;r++){null===e&&t(100);const n=e.getNextSibling(),r=e.__key;bo(e.getWritable()),c.push(r),e=n;}}let d=u;for(const e of r){null!==d&&e.is(d)&&(u=d=d.getPreviousSibling());const n=e.getWritable();n.__parent===s&&f--,bo(n);const r=e.__key;if(null===d)o.__first=r,n.__prev=null;else {const t=d.getWritable();t.__next=r,n.__prev=t.__key;}e.__key===s&&t(76),n.__parent=s,l.push(r),d=e;}if(e+n===i){if(null!==d){d.getWritable().__next=null,o.__last=d.__key;}}else if(null!==a){const t=a.getWritable();if(null!==d){const e=d.getWritable();t.__prev=d.__key,e.__next=a.__key;}else t.__prev=null;}if(o.__size=f,c.length){const t=$r();if(wr(t)){const e=new Set(c),n=new Set(l),{anchor:r,focus:i}=t;Di(r,e,n)&&Hr(r,r.getNode(),this,u,a),Di(i,e,n)&&Hr(i,i.getNode(),this,u,a),0!==f||this.canBeEmpty()||xs(this)||this.remove();}}return o}getDOMSlot(t){return new Oi(t)}exportDOM(t){const{element:e}=super.exportDOM(t);if(Ms(e)){const t=this.getIndent();t>0&&(e.style.paddingInlineStart=40*t+"px");const n=this.getDirection();n&&(e.dir=n);}return {element:e}}exportJSON(){const t={children:[],direction:this.getDirection(),format:this.getFormatType(),indent:this.getIndent(),...super.exportJSON()},e=this.getTextFormat(),n=this.getTextStyle();return 0===e&&""===n||xs(this)||this.getChildren().some(yr)||(0!==e&&(t.textFormat=e),""!==n&&(t.textStyle=n)),t}updateFromJSON(t){return super.updateFromJSON(t).setFormat(t.format).setIndent(t.indent).setDirection(t.direction).setTextFormat(t.textFormat||0).setTextStyle(t.textStyle||"")}insertNewAfter(t,e){return null}canIndent(){return  true}collapseAtStart(t){return  false}excludeFromCopy(t){return  false}canReplaceWith(t){return  true}canInsertAfter(t){return  true}canBeEmpty(){return  true}canInsertTextBefore(){return  true}canInsertTextAfter(){return  true}isInline(){return  false}isShadowRoot(){return  false}canMergeWith(t){return  false}extractWithChild(t,e,n){return  false}canMergeWhenEmpty(){return  false}reconcileObservedMutation(t,e){const n=this.getDOMSlot(t);let r=n.getFirstChild();for(let t=this.getFirstChild();t;t=t.getNextSibling()){const i=e.getElementByKey(t.getKey());null!==i&&(null==r?(n.insertChild(i),r=i):r!==i&&n.replaceChild(i,r),r=r.nextSibling);}}}function Pi(t){return t instanceof Ai}function Di(t,e,n){let r=t.getNode();for(;r;){const t=r.__key;if(e.has(t)&&!n.has(t))return  true;r=r.getParent();}return  false}class Fi extends zn{decorate(t,e){return null}isIsolated(){return  false}isInline(){return  true}isKeyboardSelectable(){return  true}}function Li(t){return t instanceof Fi}class Ii extends Ai{__cachedText;static getType(){return "root"}static clone(){return new Ii}constructor(){super("root"),this.__cachedText=null;}getTopLevelElementOrThrow(){t(51);}getTextContent(){const t=this.__cachedText;return !fi()&&0!==_i()._dirtyType||null===t?super.getTextContent():t}remove(){t(52);}replace(e){t(53);}insertBefore(e){t(54);}insertAfter(e){t(55);}updateDOM(t,e){return  false}splice(e,n,r){for(const e of r)Pi(e)||Li(e)||t(282);return super.splice(e,n,r)}static importJSON(t){return Io().updateFromJSON(t)}collapseAtStart(){return  true}}function Ki(t){return t instanceof Ii}function zi(t){return new Ji(new Map(t._nodeMap))}function Ri(){return new Ji(new Map([["root",new Ii]]))}function Bi(e){const n=e.exportJSON(),r=e.constructor;if(n.type!==r.getType()&&t(130,r.name),Pi(e)){const i=n.children;Array.isArray(i)||t(59,r.name);const o=e.getChildren();for(let t=0;t<o.length;t++){const e=Bi(o[t]);i.push(e);}}return n}function Wi(t){return t instanceof Ji}class Ji{_nodeMap;_selection;_flushSync;_readOnly;constructor(t,e){this._nodeMap=t,this._selection=e||null,this._flushSync=false,this._readOnly=false;}isEmpty(){return 1===this._nodeMap.size&&null===this._selection}read(t,e){return Ti(e&&e.editor||null,this,t)}clone(t){const e=new Ji(this._nodeMap,void 0===t?this._selection:t);return e._readOnly=true,e}toJSON(){return Ti(null,this,()=>({root:Bi(Io())}))}}class ji extends Ai{static getType(){return "artificial"}createDOM(t){return document.createElement("div")}}class Ui extends Ai{static getType(){return "paragraph"}static clone(t){return new Ui(t.__key)}createDOM(t){const e=document.createElement("p"),n=es(t.theme,"paragraph");if(void 0!==n){e.classList.add(...n);}return e}updateDOM(t,e,n){return  false}static importDOM(){return {p:t=>({conversion:$i,priority:0})}}exportDOM(t){const{element:e}=super.exportDOM(t);if(Ms(e)){this.isEmpty()&&e.append(document.createElement("br"));const t=this.getFormatType();t&&(e.style.textAlign=t);}return {element:e}}static importJSON(t){return Vi().updateFromJSON(t)}exportJSON(){const t=super.exportJSON();if(void 0===t.textFormat||void 0===t.textStyle){const e=this.getChildren().find(yr);e?(t.textFormat=e.getFormat(),t.textStyle=e.getStyle()):(t.textFormat=this.getTextFormat(),t.textStyle=this.getTextStyle());}return t}insertNewAfter(t,e){const n=Vi();n.setTextFormat(t.format),n.setTextStyle(t.style);const r=this.getDirection();return n.setDirection(r),n.setFormat(this.getFormatType()),n.setStyle(this.getStyle()),this.insertAfter(n,e),n}collapseAtStart(){const t=this.getChildren();if(0===t.length||yr(t[0])&&""===t[0].getTextContent().trim()){if(null!==this.getNextSibling())return this.selectNext(),this.remove(),true;if(null!==this.getPreviousSibling())return this.selectPrevious(),this.remove(),true}return  false}}function $i(t){const e=Vi();if(t.style&&(e.setFormat(t.style.textAlign),Js(t,e)),""===e.getFormatType()){const n=t.getAttribute("align");n&&n&&n in B$4&&e.setFormat(n);}return {node:e}}function Vi(){return Ss(new Ui)}function Yi(t){return t instanceof Ui}const qi=0,Hi=1,Gi=2,Xi=3,Qi=4;function Zi(t,e,n,r){const i=t._keyToDOMMap;i.clear(),t._editorState=Ri(),t._pendingEditorState=r,t._compositionKey=null,t._dirtyType=0,t._cloneNotNeeded.clear(),t._dirtyLeaves=new Set,t._dirtyElements.clear(),t._normalizedNodes=new Set,t._updateTags=new Set,t._updates=[],t._blockCursorElement=null;const o=t._observer;null!==o&&(o.disconnect(),t._observer=null),null!==e&&(e.textContent=""),null!==n&&(n.textContent="",i.set("root",n));}function to(t){const e=new Set,n=new Set;let r=t;for(;r;){const{ownNodeConfig:t}=Vs(r),i=r.transform;if(!n.has(i)){n.add(i);const t=r.transform();t&&e.add(t);}if(t){const n=t.$transform;n&&e.add(n),r=t.extends;}else {const t=Object.getPrototypeOf(r);r=t.prototype instanceof zn&&t!==zn?t:void 0;}}return e}function eo(t){const e=t||{},n=yi(),r=e.theme||{},i=void 0===t?n:e.parentEditor||null,o=e.disableEvents||false,s=Ri(),l=e.namespace||(null!==i?i._config.namespace:Jo()),c=e.editorState,a=[Ii,lr,Gn,xr,Ui,ji,...e.nodes||[]],{onError:u,html:f}=e,d=void 0===e.editable||e.editable;let h;if(void 0===t&&null!==n)h=n._nodes;else {h=new Map;for(let t=0;t<a.length;t++){let e=a[t],n=null,r=null;if("function"!=typeof e){const t=e;e=t.replace,n=t.with,r=t.withKlass||null;}Vs(e);const i=e.getType(),o=to(e);h.set(i,{exportDOM:f&&f.export?f.export.get(e):void 0,klass:e,replace:n,replaceWithKlass:r,sharedNodeState:ct$3(a[t]),transforms:o});}}const g=new no(s,i,h,{disableEvents:o,namespace:l,theme:r},u||console.error,function(t,e){const n=new Map,r=new Set,i=t=>{Object.keys(t).forEach(e=>{let r=n.get(e);void 0===r&&(r=[],n.set(e,r)),r.push(t[e]);});};return t.forEach(t=>{const e=t.klass.importDOM;if(null==e||r.has(e))return;r.add(e);const n=e.call(t.klass);null!==n&&i(n);}),e&&i(e),n}(h,f?f.import:void 0),d,t);return void 0!==c&&(g._pendingEditorState=c,g._dirtyType=2),function(t){t.registerCommand(se$2,Sn$1,qi),t.registerCommand(le$3,vn$1,qi),t.registerCommand(ce$2,Tn$1,qi),t.registerCommand(ae$2,kn$1,qi),t.registerCommand(Se$2,bn$1,qi);}(g),g}class no{static version;_headless;_parentEditor;_rootElement;_editorState;_pendingEditorState;_compositionKey;_deferred;_keyToDOMMap;_updates;_updating;_listeners;_commands;_nodes;_decorators;_pendingDecorators;_config;_dirtyType;_cloneNotNeeded;_dirtyLeaves;_dirtyElements;_normalizedNodes;_updateTags;_observer;_key;_onError;_htmlConversions;_window;_editable;_blockCursorElement;_createEditorArgs;constructor(t,e,n,r,i,o,s,l){this._createEditorArgs=l,this._parentEditor=e,this._rootElement=null,this._editorState=t,this._pendingEditorState=null,this._compositionKey=null,this._deferred=[],this._keyToDOMMap=new Map,this._updates=[],this._updating=false,this._listeners={decorator:new Set,editable:new Set,mutation:new Map,root:new Set,textcontent:new Set,update:new Set},this._commands=new Map,this._config=r,this._nodes=n,this._decorators={},this._pendingDecorators=null,this._dirtyType=0,this._cloneNotNeeded=new Set,this._dirtyLeaves=new Set,this._dirtyElements=new Map,this._normalizedNodes=new Set,this._updateTags=new Set,this._observer=null,this._key=Jo(),this._onError=i,this._htmlConversions=o,this._editable=s,this._headless=null!==e&&e._headless,this._window=null,this._blockCursorElement=null;}isComposing(){return null!=this._compositionKey}registerUpdateListener(t){const e=this._listeners.update;return e.add(t),()=>{e.delete(t);}}registerEditableListener(t){const e=this._listeners.editable;return e.add(t),()=>{e.delete(t);}}registerDecoratorListener(t){const e=this._listeners.decorator;return e.add(t),()=>{e.delete(t);}}registerTextContentListener(t){const e=this._listeners.textcontent;return e.add(t),()=>{e.delete(t);}}registerRootListener(t){const e=this._listeners.root;return t(this._rootElement,null),e.add(t),()=>{t(null,this._rootElement),e.delete(t);}}registerCommand(e,n,r){ void 0===r&&t(35);const i=this._commands;i.has(e)||i.set(e,[new Set,new Set,new Set,new Set,new Set]);const o=i.get(e);void 0===o&&t(36,String(e));const s=o[r];return s.add(n),()=>{s.delete(n),o.every(t=>0===t.size)&&i.delete(e);}}registerMutationListener(t,e,n){const r=this.resolveRegisteredNodeAfterReplacements(this.getRegisteredNode(t)).klass,i=this._listeners.mutation;let o=i.get(e);void 0===o&&(o=new Set,i.set(e,o)),o.add(r);const s=n&&n.skipInitialization;return void 0!==s&&s||this.initializeMutationListener(e,r),()=>{o.delete(r),0===o.size&&i.delete(e);}}getRegisteredNode(e){const n=this._nodes.get(e.getType());return void 0===n&&t(37,e.name),n}resolveRegisteredNodeAfterReplacements(t){for(;t.replaceWithKlass;)t=this.getRegisteredNode(t.replaceWithKlass);return t}initializeMutationListener(t,e){const n=this._editorState,r=Rs(n).get(e.getType());if(!r)return;const i=new Map;for(const t of r.keys())i.set(t,"created");i.size>0&&t(i,{dirtyLeaves:new Set,prevEditorState:n,updateTags:new Set(["registerMutationListener"])});}registerNodeTransformToKlass(t,e){const n=this.getRegisteredNode(t);return n.transforms.add(e),n}registerNodeTransform(t,e){const n=this.registerNodeTransformToKlass(t,e),r=[n],i=n.replaceWithKlass;if(null!=i){const t=this.registerNodeTransformToKlass(i,e);r.push(t);}return function(t,e){const n=Rs(t.getEditorState()),r=[];for(const t of e){const e=n.get(t);e&&r.push(e);}if(0===r.length)return;t.update(()=>{for(const t of r)for(const e of t.keys()){const t=Mo(e);t&&t.markDirty();}},null===t._pendingEditorState?{tag:Wn}:void 0);}(this,r.map(t=>t.klass.getType())),()=>{r.forEach(t=>t.transforms.delete(e));}}hasNode(t){return this._nodes.has(t.getType())}hasNodes(t){return t.every(this.hasNode.bind(this))}dispatchCommand(t,e){return ls(this,t,e)}getDecorators(){return this._decorators}getRootElement(){return this._rootElement}getKey(){return this._key}setRootElement(t){const e=this._rootElement;if(t!==e){const n=es(this._config.theme,"root"),r=this._pendingEditorState||this._editorState;if(this._rootElement=t,Zi(this,e,t,r),null!==e&&(this._config.disableEvents||Dn(e),null!=n&&e.classList.remove(...n)),null!==t){const e=_s(t),r=t.style;r.userSelect="text",r.whiteSpace="pre-wrap",r.wordBreak="break-word",t.setAttribute("data-lexical-editor","true"),this._window=e,this._dirtyType=2,nt$3(this),this._updateTags.add(Wn),ki(this),this._config.disableEvents||function(t,e){const n=t.ownerDocument;on$1.set(t,n);const r=sn$1.get(n)??0;r<1&&n.addEventListener("selectionchange",On$1),sn$1.set(n,r+1),t.__lexicalEditor=e;const i=wn$1(t);for(let n=0;n<Ze$2.length;n++){const[r,o]=Ze$2[n],s="function"==typeof o?t=>{An$1(t)||(Mn(t),(e.isEditable()||"click"===r)&&o(t,e));}:t=>{if(An$1(t))return;Mn(t);const n=e.isEditable();switch(r){case "cut":return n&&ls(e,je$1,t);case "copy":return ls(e,Je$2,t);case "paste":return n&&ls(e,ge$2,t);case "dragstart":return n&&ls(e,Re$1,t);case "dragover":return n&&ls(e,Be$2,t);case "dragend":return n&&ls(e,We$2,t);case "focus":return n&&ls(e,He$2,t);case "blur":return n&&ls(e,Ge$1,t);case "drop":return n&&ls(e,Ke$2,t)}};t.addEventListener(r,s),i.push(()=>{t.removeEventListener(r,s);});}}(t,this),null!=n&&t.classList.add(...n);}else this._window=null,this._updateTags.add(Wn),ki(this);Ni("root",this,false,t,e);}}getElementByKey(t){return this._keyToDOMMap.get(t)||null}getEditorState(){return this._editorState}setEditorState(e,n){e.isEmpty()&&t(38);let r=e;r._readOnly&&(r=zi(e),r._selection=e._selection?e._selection.clone():null),et$3(this);const i=this._pendingEditorState,o=this._updateTags,s=void 0!==n?n.tag:null;null===i||i.isEmpty()||(null!=s&&o.add(s),ki(this)),this._pendingEditorState=r,this._dirtyType=2,this._dirtyElements.set("root",false),this._compositionKey=null,null!=s&&o.add(s),this._updating||ki(this);}parseEditorState(t,e){return function(t,e,n){const r=Ri(),i=oi,o=li,s=si,l=e._dirtyElements,c=e._dirtyLeaves,a=e._cloneNotNeeded,u=e._dirtyType;e._dirtyElements=new Map,e._dirtyLeaves=new Set,e._cloneNotNeeded=new Set,e._dirtyType=0,oi=r,li=false,si=e,io(null);try{const i=e._nodes;vi(t.root,i),n&&n(),r._readOnly=!0;}catch(t){t instanceof Error&&e._onError(t);}finally{e._dirtyElements=l,e._dirtyLeaves=c,e._cloneNotNeeded=a,e._dirtyType=u,oi=i,li=o,si=s;}return r}("string"==typeof t?JSON.parse(t):t,this,e)}read(t){return ki(this),this.getEditorState().read(t,{editor:this})}update(t,e){!function(t,e,n){t._updating?t._updates.push([e,n]):wi(t,e,n);}(this,t,e);}focus(t,e={}){const n=this._rootElement;null!==n&&(n.setAttribute("autocapitalize","off"),Ei(this,()=>{const r=$r(),i=Io();null!==r?r.dirty||zo(r.clone()):0!==i.getChildrenSize()&&("rootStart"===e.defaultSelection?i.selectStart():i.selectEnd()),ds("focus"),hs(()=>{n.removeAttribute("autocapitalize"),t&&t();});}),null===this._pendingEditorState&&n.removeAttribute("autocapitalize"));}blur(){const t=this._rootElement;null!==t&&t.blur();const e=bs(this._window);null!==e&&e.removeAllRanges();}isEditable(){return this._editable}setEditable(t){this._editable!==t&&(this._editable=t,Ni("editable",this,true,t));}toJSON(){return {editorState:this._editorState.toJSON()}}}no.version="0.41.0+prod.esm";let ro=null;function io(t){ro=t;}let oo=1;function lo(e,n){const r=co(e,n);return void 0===r&&t(30,n),r}function co(t,e){return t._nodes.get(e)}const ao="function"==typeof queueMicrotask?queueMicrotask:t=>{Promise.resolve().then(t);};function uo(t){return Li(Do(t))}function fo(t){const e=document.activeElement;if(!Ms(e))return  false;const n=e.nodeName;return Li(Do(t))&&("INPUT"===n||"TEXTAREA"===n||"true"===e.contentEditable&&null==po(e))}function ho(t,e,n){const r=t.getRootElement();try{return null!==r&&r.contains(e)&&r.contains(n)&&null!==e&&!fo(e)&&_o(e)===t}catch(t){return  false}}function go(t){return t instanceof no}function _o(t){let e=t;for(;null!=e;){const t=po(e);if(go(t))return t;e=as(e);}return null}function po(t){return t?t.__lexicalEditor:null}function yo(t){return I$2.test(t)?"rtl":K$5.test(t)?"ltr":null}function mo(t){return Sr(t)||t.isToken()}function xo(t){return mo(t)||t.isSegmented()}function Co(t){return As(t)&&3===t.nodeType}function So(t){return As(t)&&9===t.nodeType}function vo(t){let e=t;for(;null!=e;){if(Co(e))return e;e=e.firstChild;}return null}function To(t,e,n){const r=z$5[e];if(null!==n&&(t&r)===(n&r))return t;let i=t^r;return "subscript"===e?i&=-65:"superscript"===e?i&=-33:"lowercase"===e?(i&=-513,i&=-1025):"uppercase"===e?(i&=-257,i&=-1025):"capitalize"===e&&(i&=-257,i&=-513),i}function ko(t){return yr(t)||Zn(t)||Li(t)}function No(t,e){const n=function(){const t=ro;return ro=null,t}();if(null!=(e=e||n&&n.__key))return void(t.__key=e);di(),hi();const r=_i(),i=gi(),o=""+oo++;i._nodeMap.set(o,t),Pi(t)?r._dirtyElements.set(o,true):r._dirtyLeaves.add(o),r._cloneNotNeeded.add(o),r._dirtyType=1,t.__key=o;}function bo(t){const e=t.getParent();if(null!==e){const n=t.getWritable(),r=e.getWritable(),i=t.getPreviousSibling(),o=t.getNextSibling(),s=null!==o?o.__key:null,l=null!==i?i.__key:null,c=null!==i?i.getWritable():null,a=null!==o?o.getWritable():null;null===i&&(r.__first=s),null===o&&(r.__last=l),null!==c&&(c.__next=s),null!==a&&(a.__prev=l),n.__prev=null,n.__next=null,n.__parent=null,r.__size--;}}function wo(e){hi(),Kn$1(e)&&t(323,e.__key,e.__type);const n=e.getLatest(),r=n.__parent,i=gi(),o=_i(),s=i._nodeMap,l=o._dirtyElements;null!==r&&function(t,e,n){let r=t;for(;null!==r;){if(n.has(r))return;const t=e.get(r);if(void 0===t)break;n.set(r,false),r=t.__parent;}}(r,s,l);const c=n.__key;o._dirtyType=1,Pi(e)?l.set(c,true):o._dirtyLeaves.add(c);}function Eo(t){di();const e=_i(),n=e._compositionKey;if(t!==n){if(e._compositionKey=t,null!==n){const t=Mo(n);null!==t&&t.getWritable();}if(null!==t){const e=Mo(t);null!==e&&e.getWritable();}}}function Oo(){if(fi())return null;return _i()._compositionKey}function Mo(t,e){const n=(e||gi())._nodeMap.get(t);return void 0===n?null:n}function Ao(t,e){const n=Po(t,_i());return void 0!==n?Mo(n,e):null}function Po(t,e){return t[`__lexicalKey_${e._key}`]}function Do(t,e){let n=t;for(;null!=n;){const t=Ao(n,e);if(null!==t)return t;n=as(n);}return null}function Fo(t){const e=t._decorators,n=Object.assign({},e);return t._pendingDecorators=n,n}function Lo(t){return t.read(()=>Io().getTextContent())}function Io(){return Ko(gi())}function Ko(t){return t._nodeMap.get("root")}function zo(t){di();const e=gi();null!==t&&(t.dirty=true,t.setCachedNodes(null)),e._selection=t;}function Ro(t){const e=_i(),n=function(t,e){let n=t;for(;null!=n;){const t=Po(n,e);if(void 0!==t)return t;n=as(n);}return null}(t,e);if(null===n){return t===e.getRootElement()?Mo("root"):null}return Mo(n)}function Bo(t){return /[\uD800-\uDBFF][\uDC00-\uDFFF]/g.test(t)}function Wo(t){const e=[];let n=t;for(;null!==n;)e.push(n),n=n._parentEditor;return e}function Jo(){return Math.random().toString(36).replace(/[^a-z]+/g,"").substring(0,5)}function jo(t){return Co(t)?t.nodeValue:null}function Uo(t,e,n){const r=bs(ps(e));if(null===r)return;const i=r.anchorNode;let{anchorOffset:o,focusOffset:s}=r;if(null!==i){let e=jo(i);const r=Do(i);if(null!==e&&yr(r)){if((e===A$2||e===D$4)&&n){const t=n.length;e=n,o=t,s=t;}null!==e&&$o(r,e,o,s,t);}}}function $o(t,e,n,r,i){let o=t;if(o.isAttached()&&(i||!o.isDirty())){const s=o.isComposing();let a=e;if((s||i)&&(e.endsWith(A$2)&&(a=e.slice(0,-A$2.length)),i)){const t=D$4;let e;for(;-1!==(e=a.indexOf(t));)a=a.slice(0,e)+a.slice(e+t.length),null!==n&&n>e&&(n=Math.max(e,n-t.length)),null!==r&&r>e&&(r=Math.max(e,r-t.length));}const u=o.getTextContent();if(i||a!==u){if(""===a){if(Eo(null),l||c||d$1)o.remove();else {const t=_i();setTimeout(()=>{t.update(()=>{o.isAttached()&&o.remove();});},20);}return}const e=o.getParent(),i=Vr(),u=o.getTextContentSize(),f=Oo(),h=o.getKey();if(o.isToken()||null!==f&&h===f&&!s||wr(i)&&(null!==e&&!e.canInsertTextBefore()&&0===i.anchor.offset||i.anchor.key===t.__key&&0===i.anchor.offset&&!o.canInsertTextBefore()&&!s||i.focus.key===t.__key&&i.focus.offset===u&&!o.canInsertTextAfter()&&!s))return void o.markDirty();const g=$r();if(!wr(g)||null===n||null===r)return void Vo(o,a,g);if(g.setTextNodeRange(o,n,o,r),o.isSegmented()){const t=pr(o.getTextContent());o.replace(t),o=t;}Vo(o,a,g);}}}function Vo(t,e,n){if(t.setTextContent(e),wr(n)){const e=t.getKey();for(const r of ["anchor","focus"]){const i=n[r];"text"===i.type&&i.key===e&&(i.offset=dl(t,i.offset,"clamp"));}}}function Yo(t,e,n){const r=e[n]||false;return "any"===r||r===t[n]}function qo(t,e){return Yo(t,e,"altKey")&&Yo(t,e,"ctrlKey")&&Yo(t,e,"shiftKey")&&Yo(t,e,"metaKey")}function Ho(t,e,n){if(!qo(t,n))return  false;if(t.key.toLowerCase()===e.toLowerCase())return  true;if(e.length>1)return  false;if(1===t.key.length&&t.key.charCodeAt(0)<=127)return  false;const r="Key"+e.toUpperCase();return t.code===r}const Go={ctrlKey:!i,metaKey:i},Xo={altKey:i,ctrlKey:!i};function Qo(t){return "Backspace"===t.key}function Zo(t){return Ho(t,"a",Go)}function ts(t){const e=Io();if(wr(t)){const e=t.anchor,n=t.focus,r=e.getNode().getTopLevelElementOrThrow().getParentOrThrow();return e.set(r.getKey(),0,"element"),n.set(r.getKey(),r.getChildrenSize(),"element"),Ct$4(t),t}{const t=e.select(0,e.getChildrenSize());return zo(Ct$4(t)),t}}function es(t,e){ void 0===t.__lexicalClassNameCache&&(t.__lexicalClassNameCache={});const n=t.__lexicalClassNameCache,r=n[e];if(void 0!==r)return r;const i=t[e];if("string"==typeof i){const t=Ql(i);return n[e]=t,t}return i}function ns(e,n,r,i,o){if(0===r.size)return;const s=i.__type,l=i.__key,c=n.get(s);void 0===c&&t(33,s);const a=c.klass;let u=e.get(a);void 0===u&&(u=new Map,e.set(a,u));const f=u.get(l),d="destroyed"===f&&"created"===o;(void 0===f||d)&&u.set(l,d?"updated":o);}function is(t,e,n){const r=t.getParent();let i=n,o=t;return null!==r&&(e&&0===n?(i=o.getIndexWithinParent(),o=r):e||n!==o.getChildrenSize()||(i=o.getIndexWithinParent()+1,o=r)),o.getChildAtIndex(e?i-1:i)}function os(t,e){const n=t.offset;if("element"===t.type){return is(t.getNode(),e,n)}{const r=t.getNode();if(e&&0===n||!e&&n===r.getTextContentSize()){const t=e?r.getPreviousSibling():r.getNextSibling();return null===t?is(r.getParentOrThrow(),e,r.getIndexWithinParent()+(e?0:1)):t}}return null}function ss(t){const e=ps(t).event,n=e&&e.inputType;return "insertFromPaste"===n||"insertFromPasteAsQuotation"===n}function ls(t,e,n){return function(t,e,n){const r=Wo(t);for(let i=4;i>=0;i--)for(let o=0;o<r.length;o++){const s=r[o],l=s._commands.get(e);if(void 0!==l){const e=l[i];if(void 0!==e){const r=Array.from(e),i=r.length;let o=false;if(Ei(s,()=>{for(let e=0;e<i;e++)if(r[e](n,t))return void(o=true)}),o)return o}}}return  false}(t,e,n)}function cs(e,n){const r=e._keyToDOMMap.get(n);return void 0===r&&t(75,n),r}function as(t){const e=t.assignedSlot||t.parentElement;return Ps(e)?e.host:e}function us(t){return So(t)?t:Ms(t)?t.ownerDocument:null}function fs(t){return _i()._updateTags.has(t)}function ds(t){di();_i()._updateTags.add(t);}function hs(t){di();_i()._deferred.push(t);}function gs(t,e){let n=t.getParent();for(;null!==n;){if(n.is(e))return  true;n=n.getParent();}return  false}function _s(t){const e=us(t);return e?e.defaultView:null}function ps(e){const n=e._window;return null===n&&t(78),n}function ys(t){return Pi(t)&&t.isInline()||Li(t)&&t.isInline()}function ms(t){let e=t.getParentOrThrow();for(;null!==e;){if(xs(e))return e;e=e.getParentOrThrow();}return e}function xs(t){return Ki(t)||Pi(t)&&t.isShadowRoot()}function Cs(t){const e=t.constructor.clone(t);return No(e,null),e.afterCloneFrom(t),e}function Ss(e){const n=_i(),r=e.getType(),i=co(n,r);void 0===i&&t(200,e.constructor.name,r);const{replace:o,replaceWithKlass:s}=i;if(null!==o){const n=o(e),i=n.constructor;return null!==s?n instanceof s||t(201,s.name,s.getType(),i.name,i.getType(),e.constructor.name,r):n instanceof e.constructor&&i!==e.constructor||t(202,i.name,i.getType(),e.constructor.name,r),n.__key===e.__key&&t(203,e.constructor.name,r,i.name,i.getType()),n}return e}function vs(e,n){!Ki(e.getParent())||Pi(n)||Li(n)||t(99);}function Ts(e){const n=Mo(e);return null===n&&t(63,e),n}function ks(t){return (Li(t)||Pi(t)&&!t.canBeEmpty())&&!t.isInline()}function Ns(t,e,n){n.style.removeProperty("caret-color"),e._blockCursorElement=null;const r=t.parentElement;null!==r&&r.removeChild(t);}function bs(t){return n?(t||window).getSelection():null}function ws(t){const e=_s(t);return e?e.getSelection():null}function Es(e,n){let r=e.getChildAtIndex(n);null==r&&(r=e),xs(e)&&t(102);const i=e=>{const n=e.getParentOrThrow(),o=xs(n),s=e!==r||o?Cs(e):e;if(o)return Pi(e)&&Pi(s)||t(133),e.insertAfter(s),[e,s,s];{const[t,r,o]=i(n),l=e.getNextSiblings();return o.append(s,...l),[t,r,s]}},[o,s]=i(r);return [o,s]}function Os(t){return Ms(t)&&"A"===t.tagName}function Ms(t){return As(t)&&1===t.nodeType}function As(t){return "object"==typeof t&&null!==t&&"nodeType"in t&&"number"==typeof t.nodeType}function Ps(t){return As(t)&&11===t.nodeType}function Ds(t){const e=new RegExp(/^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|mark|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var|#text)$/,"i");return null!==t.nodeName.match(e)}function Fs(t){const e=new RegExp(/^(address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|hr|li|main|nav|noscript|ol|p|pre|section|table|td|tfoot|ul|video)$/,"i");return null!==t.nodeName.match(e)}function Ls(t){if(Li(t)&&!t.isInline())return  true;if(!Pi(t)||xs(t))return  false;const e=t.getFirstChild(),n=null===e||Zn(e)||yr(e)||e.isInline();return !t.isInline()&&false!==t.canBeEmpty()&&n}function Is(){return _i()}const Ks=new WeakMap,zs=new Map;function Rs(e){if(!e._readOnly&&e.isEmpty())return zs;e._readOnly||t(192);let n=Ks.get(e);return n||(n=function(t){const e=new Map;for(const[n,r]of t._nodeMap){const t=r.__type;let i=e.get(t);i||(i=new Map,e.set(t,i)),i.set(n,r);}return e}(e),Ks.set(e,n)),n}function Bs(t){const e=t.constructor.clone(t);return e.afterCloneFrom(t),e}function Ws(t){return (e=Bs(t))[In]=true,e;var e;}function Js(t,e){const n=parseInt(t.style.paddingInlineStart,10)||0,r=Math.round(n/40);e.setIndent(r);}function js(t){t.__lexicalUnmanaged=true;}function Us(t){return  true===t.__lexicalUnmanaged}function $s(t,e){return function(t,e){return Object.prototype.hasOwnProperty.call(t,e)}(t,e)&&t[e]!==zn[e]}function Vs(e){const n=$$5 in e.prototype?e.prototype[$$5]():void 0,r=function(e){if(!(e===zn||e.prototype instanceof zn)){let n="<unknown>",r="<unknown>";try{n=e.getType();}catch(t){}try{no.version&&(r=JSON.parse(no.version));}catch(t){}t(290,e.name,n,r);}return e===Fi||e===Ai||e===zn}(e),i=!r&&$s(e,"getType")?e.getType():void 0;let o,s=i;if(n)if(i)o=n[i];else for(const[t,e]of Object.entries(n))s=t,o=e;if(!r&&s&&($s(e,"getType")||(e.getType=()=>s),$s(e,"clone")||(e.clone=t=>(io(t),new e)),$s(e,"importJSON")||(e.importJSON=o&&o.$importJSON||(t=>(new e).updateFromJSON(t))),!$s(e,"importDOM")&&o)){const{importDOM:t}=o;t&&(e.importDOM=()=>t);}return {ownNodeConfig:o,ownNodeType:s}}function Ys(t){const e=Is();di();return new(e.resolveRegisteredNodeAfterReplacements(e.getRegisteredNode(t)).klass)}const qs=(t,e)=>{let n=t;for(;null!=n&&!Ki(n);){if(e(n))return n;n=n.getParent();}return null},Hs={next:"previous",previous:"next"};class Gs{origin;constructor(t){this.origin=t;}[Symbol.iterator](){return Tl({hasNext:ol,initial:this.getAdjacentCaret(),map:t=>t,step:t=>t.getAdjacentCaret()})}getAdjacentCaret(){return ul(this.getNodeAtCaret(),this.direction)}getSiblingCaret(){return ul(this.origin,this.direction)}remove(){const t=this.getNodeAtCaret();return t&&t.remove(),this}replaceOrInsert(t,e){const n=this.getNodeAtCaret();return t.is(this.origin)||t.is(n)||(null===n?this.insert(t):n.replace(t,e)),this}splice(e,n,r="next"){const i=r===this.direction?n:Array.from(n).reverse();let o=this;const s=this.getParentAtCaret(),l=new Map;for(let t=o.getAdjacentCaret();null!==t&&l.size<e;t=t.getAdjacentCaret()){const e=t.origin.getWritable();l.set(e.getKey(),e);}for(const e of i){if(l.size>0){const n=o.getNodeAtCaret();if(n)if(l.delete(n.getKey()),l.delete(e.getKey()),n.is(e)||o.origin.is(e));else {const t=e.getParent();t&&t.is(s)&&e.remove(),n.replace(e);}else null===n&&t(263,Array.from(l).join(" "));}else o.insert(e);o=ul(e,this.direction);}for(const t of l.values())t.remove();return this}}class Xs extends Gs{type="child";getLatest(){const t=this.origin.getLatest();return t===this.origin?this:gl(t,this.direction)}getParentCaret(t="root"){return ul(tl(this.getParentAtCaret(),t),this.direction)}getFlipped(){const t=Zs(this.direction);return ul(this.getNodeAtCaret(),t)||gl(this.origin,t)}getParentAtCaret(){return this.origin}getChildCaret(){return this}isSameNodeCaret(t){return t instanceof Xs&&this.direction===t.direction&&this.origin.is(t.origin)}isSamePointCaret(t){return this.isSameNodeCaret(t)}}const Qs={root:Ki,shadowRoot:xs};function Zs(t){return Hs[t]}function tl(t,e="root"){return Qs[e](t)?null:t}class el extends Gs{type="sibling";getLatest(){const t=this.origin.getLatest();return t===this.origin?this:ul(t,this.direction)}getSiblingCaret(){return this}getParentAtCaret(){return this.origin.getParent()}getChildCaret(){return Pi(this.origin)?gl(this.origin,this.direction):null}getParentCaret(t="root"){return ul(tl(this.getParentAtCaret(),t),this.direction)}getFlipped(){const t=Zs(this.direction);return ul(this.getNodeAtCaret(),t)||gl(this.origin.getParentOrThrow(),t)}isSamePointCaret(t){return t instanceof el&&this.direction===t.direction&&this.origin.is(t.origin)}isSameNodeCaret(t){return (t instanceof el||t instanceof nl)&&this.direction===t.direction&&this.origin.is(t.origin)}}class nl extends Gs{type="text";offset;constructor(t,e){super(t),this.offset=e;}getLatest(){const t=this.origin.getLatest();return t===this.origin?this:fl(t,this.direction,this.offset)}getParentAtCaret(){return this.origin.getParent()}getChildCaret(){return null}getParentCaret(t="root"){return ul(tl(this.getParentAtCaret(),t),this.direction)}getFlipped(){return fl(this.origin,Zs(this.direction),this.offset)}isSamePointCaret(t){return t instanceof nl&&this.direction===t.direction&&this.origin.is(t.origin)&&this.offset===t.offset}isSameNodeCaret(t){return (t instanceof el||t instanceof nl)&&this.direction===t.direction&&this.origin.is(t.origin)}getSiblingCaret(){return ul(this.origin,this.direction)}}function rl(t){return t instanceof nl}function ol(t){return t instanceof el}function sl(t){return t instanceof Xs}const ll={next:class extends nl{direction="next";getNodeAtCaret(){return this.origin.getNextSibling()}insert(t){return this.origin.insertAfter(t),this}},previous:class extends nl{direction="previous";getNodeAtCaret(){return this.origin.getPreviousSibling()}insert(t){return this.origin.insertBefore(t),this}}},cl={next:class extends el{direction="next";getNodeAtCaret(){return this.origin.getNextSibling()}insert(t){return this.origin.insertAfter(t),this}},previous:class extends el{direction="previous";getNodeAtCaret(){return this.origin.getPreviousSibling()}insert(t){return this.origin.insertBefore(t),this}}},al={next:class extends Xs{direction="next";getNodeAtCaret(){return this.origin.getFirstChild()}insert(t){return this.origin.splice(0,0,[t]),this}},previous:class extends Xs{direction="previous";getNodeAtCaret(){return this.origin.getLastChild()}insert(t){return this.origin.splice(this.origin.getChildrenSize(),0,[t]),this}}};function ul(t,e){return t?new cl[e](t):null}function fl(t,e,n){return t?new ll[e](t,dl(t,n)):null}function dl(t,n,r="error"){const i=t.getTextContentSize();let o="next"===n?i:"previous"===n?0:n;return (o<0||o>i)&&("clamp"!==r&&e(284,String(n),String(i),t.getKey()),o=o<0?0:i),o}function hl(t,e){return new ml(t,e)}function gl(t,e){return Pi(t)?new al[e](t):null}function _l(t){return t&&t.getChildCaret()||t}function pl(t){return t&&_l(t.getAdjacentCaret())}class yl{type="node-caret-range";direction;anchor;focus;constructor(t,e,n){this.anchor=t,this.focus=e,this.direction=n;}getLatest(){const t=this.anchor.getLatest(),e=this.focus.getLatest();return t===this.anchor&&e===this.focus?this:new yl(t,e,this.direction)}isCollapsed(){return this.anchor.isSamePointCaret(this.focus)}getTextSlices(){const t=t=>{const e=this[t].getLatest();return rl(e)?function(t,e){const{direction:n,origin:r}=t,i=dl(r,"focus"===e?Zs(n):n);return hl(t,i-t.offset)}(e,t):null},e=t("anchor"),n=t("focus");if(e&&n){const{caret:t}=e,{caret:r}=n;if(t.isSameNodeCaret(r))return [hl(t,r.offset-t.offset),null]}return [e,n]}iterNodeCarets(t="root"){const e=rl(this.anchor)?this.anchor.getSiblingCaret():this.anchor.getLatest(),n=this.focus.getLatest(),r=rl(n),i=e=>e.isSameNodeCaret(n)?null:pl(e)||e.getParentCaret(t);return Tl({hasNext:t=>null!==t&&!(r&&n.isSameNodeCaret(t)),initial:e.isSameNodeCaret(n)?null:i(e),map:t=>t,step:i})}[Symbol.iterator](){return this.iterNodeCarets("root")}}class ml{type="slice";caret;distance;constructor(t,e){this.caret=t,this.distance=e;}getSliceIndices(){const{distance:t,caret:{offset:e}}=this,n=e+t;return n<e?[n,e]:[e,n]}getTextContent(){const[t,e]=this.getSliceIndices();return this.caret.origin.getTextContent().slice(t,e)}getTextContentSize(){return Math.abs(this.distance)}removeTextSlice(){const{caret:{origin:t,direction:e}}=this,[n,r]=this.getSliceIndices(),i=t.getTextContent();return fl(t.setTextContent(i.slice(0,n)+i.slice(r)),e,n)}}function Cl(t){return vl(t,ul(Io(),t.direction))}function Sl(t){return vl(t,t)}function vl(e,n){return e.direction!==n.direction&&t(265),new yl(e,n,e.direction)}function Tl(t){const{initial:e,hasNext:n,step:r,map:i}=t;let o=e;return {[Symbol.iterator](){return this},next(){if(!n(o))return {done:true,value:void 0};const t={done:false,value:i(o)};return o=r(o),t}}}function kl(e,n){const r=El(e.origin,n.origin);switch(null===r&&t(275,e.origin.getKey(),n.origin.getKey()),r.type){case "same":{const t="text"===e.type,r="text"===n.type;return t&&r?function(t,e){return Math.sign(t-e)}(e.offset,n.offset):e.type===n.type?0:t?-1:r?1:"child"===e.type?-1:1}case "ancestor":return "child"===e.type?-1:1;case "descendant":return "child"===n.type?1:-1;case "branch":return Nl(r)}}function Nl(t){const{a:e,b:n}=t,r=e.__key,i=n.__key;let o=e,s=n;for(;o&&s;o=o.getNextSibling(),s=s.getNextSibling()){if(o.__key===i)return  -1;if(s.__key===r)return 1}return null===o?1:-1}function bl(t,e){return e.is(t)}function wl(t){return Pi(t)?[t.getLatest(),null]:[t.getParent(),t.getLatest()]}function El(e,n){if(e.is(n))return {commonAncestor:e,type:"same"};const r=new Map;for(let[t,n]=wl(e);t;n=t,t=t.getParent())r.set(t,n);for(let[i,o]=wl(n);i;o=i,i=i.getParent()){const s=r.get(i);if(void 0!==s)return null===s?(bl(e,i)||t(276),{commonAncestor:i,type:"ancestor"}):null===o?(bl(n,i)||t(277),{commonAncestor:i,type:"descendant"}):((Pi(s)||bl(e,s))&&(Pi(o)||bl(n,o))&&i.is(s.getParent())&&i.is(o.getParent())||t(278),{a:s,b:o,commonAncestor:i,type:"branch"})}return null}function Ol(e,n){const{type:r,key:i,offset:o}=e,s=Ts(e.key);return "text"===r?(yr(s)||t(266,s.getType(),i),fl(s,n,o)):(Pi(s)||t(267,s.getType(),i),Jl(s,e.offset,n))}function Ml(e,n){const{origin:r,direction:i}=n,o="next"===i;rl(n)?e.set(r.getKey(),n.offset,"text"):ol(n)?yr(r)?e.set(r.getKey(),dl(r,i),"text"):e.set(r.getParentOrThrow().getKey(),r.getIndexWithinParent()+(o?1:0),"element"):(sl(n)&&Pi(r)||t(268),e.set(r.getKey(),o?0:r.getChildrenSize(),"element"));}function Al(t){const e=$r(),n=wr(e)?e:Wr();return Pl(n,t),zo(n),n}function Pl(t,e){Ml(t.anchor,e.anchor),Ml(t.focus,e.focus);}function Dl(t){const{anchor:e,focus:n}=t,r=Ol(e,"next"),i=Ol(n,"next"),o=kl(r,i)<=0?"next":"previous";return vl(Bl(r,o),Bl(i,o))}function Fl(t){const{direction:e,origin:n}=t,r=ul(n,Zs(e)).getNodeAtCaret();return r?ul(r,e):gl(n.getParentOrThrow(),e)}function Ll(t,e="root"){const n=[t];for(let r=sl(t)?t.getParentCaret(e):t.getSiblingCaret();null!==r;r=r.getParentCaret(e))n.push(Fl(r));return n}function Il(t){return !!t&&t.origin.isAttached()}function Kl(e,n="removeEmptySlices"){if(e.isCollapsed())return e;const r="root",i="next";let o=n;const s=Wl(e,i),l=Ll(s.anchor,r),c=Ll(s.focus.getFlipped(),r),a=new Set,u=[];for(const t of s.iterNodeCarets(r))if(sl(t))a.add(t.origin.getKey());else if(ol(t)){const{origin:e}=t;Pi(e)&&!a.has(e.getKey())||u.push(e);}for(const t of u)t.remove();for(const t of s.getTextSlices()){if(!t)continue;const{origin:e}=t.caret,n=e.getTextContentSize(),r=Fl(ul(e,i)),s=e.getMode();if(Math.abs(t.distance)===n&&"removeEmptySlices"===o||"token"===s&&0!==t.distance)r.remove();else if(0!==t.distance){o="removeEmptySlices";let e=t.removeTextSlice();const n=t.caret.origin;if("segmented"===s){const t=e.origin,n=pr(t.getTextContent()).setStyle(t.getStyle()).setFormat(t.getFormat());r.replaceOrInsert(n),e=fl(n,i,e.offset);}n.is(l[0].origin)&&(l[0]=e),n.is(c[0].origin)&&(c[0]=e.getFlipped());}}let f,d;for(const t of l)if(Il(t)){f=zl(t);break}for(const t of c)if(Il(t)){d=zl(t);break}const h=function(t,e,n){if(!t||!e)return null;const r=t.getParentAtCaret(),i=e.getParentAtCaret();if(!r||!i)return null;const o=r.getParents().reverse();o.push(r);const s=i.getParents().reverse();s.push(i);const l=Math.min(o.length,s.length);let c;for(c=0;c<l&&o[c]===s[c];c++);const a=(t,e)=>{let n;for(let r=c;r<t.length;r++){const i=t[r];if(xs(i))return;!n&&e(i)&&(n=i);}return n},u=a(o,Ls),f=u&&a(s,t=>n.has(t.getKey())&&Ls(t));return u&&f?[u,f]:null}(f,d,a);if(h){const[t,e]=h;gl(t,"previous").splice(0,e.getChildren());let n=e.getParent();for(e.remove(true);n&&n.isEmpty();){const t=n;n=n.getParent(),t.remove(true);}}const g=[f,d,...l,...c].find(Il);if(g){return Sl(Bl(zl(g),e.direction))}t(269,JSON.stringify(l.map(t=>t.origin.__key)));}function zl(t){const e=function(t){let e=t;for(;sl(e);){const t=pl(e);if(!sl(t))break;e=t;}return e}(t.getLatest()),{direction:n}=e;if(yr(e.origin))return rl(e)?e:fl(e.origin,n,n);const r=e.getAdjacentCaret();return ol(r)&&yr(r.origin)?fl(r.origin,n,Zs(n)):e}function Rl(t){return rl(t)&&t.offset!==dl(t.origin,t.direction)}function Bl(t,e){return t.direction===e?t:t.getFlipped()}function Wl(t,e){return t.direction===e?t:vl(Bl(t.focus,e),Bl(t.anchor,e))}function Jl(t,e,n){let r=gl(t,"next");for(let t=0;t<e;t++){const t=r.getAdjacentCaret();if(null===t)break;r=t;}return Bl(r,n)}function jl(t,e="root"){let n=0,r=t,i=pl(r);for(;null===i;){if(n--,i=r.getParentCaret(e),!i)return null;r=i,i=pl(r);}return i&&[i,n]}function Ul(e){const{origin:n,offset:r,direction:i}=e;if(r===dl(n,i))return e.getSiblingCaret();if(r===dl(n,Zs(i)))return Fl(e.getSiblingCaret());const[o]=n.splitText(r);return yr(o)||t(281),Bl(ul(o,"next"),i)}function $l(t,e){return  true}function Vl(t,{$copyElementNode:e=Cs,$splitTextPointCaretNext:n=Ul,rootMode:r="shadowRoot",$shouldSplit:i=$l}={}){if(rl(t))return n(t);const o=t.getParentCaret(r);if(o){const{origin:n}=o;if(sl(t)&&(!n.canBeEmpty()||!i(n,"first")))return Fl(o);const r=function(t){const e=[];for(let n=t.getAdjacentCaret();n;n=n.getAdjacentCaret())e.push(n.origin);return e}(t);(r.length>0||n.canBeEmpty()&&i(n,"last"))&&o.insert(e(n).splice(0,0,r));}return o}function Yl(t){return t}function ql(...t){return t}function Gl(t){return t}function Xl(t,e){if(!e||t===e)return t;for(const n in e)if(t[n]!==e[n])return {...t,...e};return t}function Ql(...t){const e=[];for(const n of t)if(n&&"string"==typeof n)for(const[t]of n.matchAll(/\S+/g))e.push(t);return e}function Zl(t,...e){const n=Ql(...e);n.length>0&&t.classList.add(...n);}function tc(t,...e){const n=Ql(...e);n.length>0&&t.classList.remove(...n);}function ec(...t){return ()=>{for(let e=t.length-1;e>=0;e--)t[e]();t.length=0;}}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function K$4(e,...t){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",e);for(const e of t)o.append("v",e);throw n.search=o.toString(),Error(`Minified Lexical error #${e}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}const E$4=new Map;function F$2(e){const t={};if(!e)return t;const n=e.split(";");for(const e of n)if(""!==e){const[n,o]=e.split(/:([^]+)/);n&&o&&(t[n.trim()]=o.trim());}return t}function b$3(e){let t=E$4.get(e);return void 0===t&&(t=F$2(e),E$4.set(e,t)),t}function R$3(e){let t="";for(const n in e)n&&(t+=`${n}: ${e[n]};`);return t}function z$4(e){const n=Is().getElementByKey(e.getKey());if(null===n)return null;const o=n.ownerDocument.defaultView;return null===o?null:o.getComputedStyle(n)}function O$1(e){return z$4(Ki(e)?e:e.getParentOrThrow())}function A$1(e){const t=O$1(e);return null!==t&&"rtl"===t.direction}function M$4(e,t,n="self"){const o=e.getStartEndPoints();if(t.isSelected(e)&&!xo(t)&&null!==o){const[l,r]=o,s=e.isBackward(),i=l.getNode(),c=r.getNode(),f=t.is(i),u=t.is(c);if(f||u){const[o,l]=Ar(e),r=i.is(c),f=t.is(s?c:i),u=t.is(s?i:c);let d,p=0;if(r)p=o>l?l:o,d=o>l?o:l;else if(f){p=s?l:o,d=void 0;}else if(u){p=0,d=s?o:l;}const h=t.__text.slice(p,d);h!==t.__text&&("clone"===n&&(t=Ws(t)),t.__text=h);}}return t}function _$3(e){if("text"===e.type)return e.offset===e.getNode().getTextContentSize();const t=e.getNode();return Pi(t)||K$4(177),e.offset===t.getChildrenSize()}function $$4(e){const t=e.getStyle(),n=F$2(t);E$4.set(t,n);}function D$3(t,n){(wr(t)?t.isCollapsed():yr(t)||Pi(t))||K$4(280);const l=b$3(wr(t)?t.style:yr(t)?t.getStyle():t.getTextStyle()),r=Object.entries(n).reduce((e,[n,o])=>("function"==typeof o?e[n]=o(l[n],t):null===o?delete e[n]:e[n]=o,e),{...l}),s=R$3(r);wr(t)||yr(t)?t.setStyle(s):t.setTextStyle(s),E$4.set(s,r);}function U$2(e,t){if(wr(e)&&e.isCollapsed()){D$3(e,t);const n=e.anchor.getNode();Pi(n)&&n.isEmpty()&&D$3(n,t);}j$3(e=>{D$3(e,t);});const n=e.getNodes();if(n.length>0){const e=new Set;for(const l of n){if(!Pi(l)||!l.canBeEmpty()||0!==l.getChildrenSize())continue;const n=l.getKey();e.has(n)||(e.add(n),D$3(l,t));}}}function j$3(t){const n=$r();if(!n)return;const o=new Map,l=e=>o.get(e.getKey())||[0,e.getTextContentSize()];if(wr(n))for(const e of Dl(n).getTextSlices())e&&o.set(e.caret.origin.getKey(),e.getSliceIndices());const r=n.getNodes();for(const n of r){if(!yr(n)||!n.canHaveFormat())continue;const[o,r]=l(n);if(r!==o)if(xo(n)||0===o&&r===n.getTextContentSize())t(n);else {t(n.splitText(o,r)[0===o?0:1]);}}wr(n)&&"text"===n.anchor.type&&"text"===n.focus.type&&n.anchor.key===n.focus.key&&H$4(n);}function H$4(e){if(e.isBackward()){const{anchor:t,focus:n}=e,{key:o,offset:l,type:r}=t;t.set(n.key,n.offset,n.type),n.set(o,l,r);}}function Q$5(e){const t=Y$3(e);return null!==t&&"vertical-rl"===t.writingMode}function Y$3(e){const t=e.anchor.getNode();return Pi(t)?z$4(t):O$1(t)}function Z$4(e,t){let n=Q$5(e)?!t:t;te$2(e)&&(n=!n);const l=Ol(e.focus,n?"previous":"next");if(Rl(l))return  false;for(const e of Cl(l)){if(sl(e))return !e.origin.isInline();if(!Pi(e.origin)){if(Li(e.origin))return  true;break}}return  false}function ee$2(e,t,n,o){e.modify(t?"extend":"move",n,o);}function te$2(e){const t=Y$3(e);return null!==t&&"rtl"===t.direction}function ne$2(e,t,n){const o=te$2(e);let l;l=Q$5(e)||o?!n:n,ee$2(e,t,l,"character");}function oe$3(e,t,n){const o=b$3(e.getStyle());return null!==o&&o[t]||n}function le$2(t,n,o=""){let l=null;const r=t.getNodes(),s=t.anchor,c=t.focus,f=t.isBackward(),u=f?c.offset:s.offset,g=f?c.getNode():s.getNode();if(wr(t)&&t.isCollapsed()&&""!==t.style){const e=b$3(t.style);if(null!==e&&n in e)return e[n]}for(let t=0;t<r.length;t++){const s=r[t];if((0===t||0!==u||!s.is(g))&&yr(s)){const e=oe$3(s,n,o);if(null===l)l=e;else if(l!==e){l="";break}}}return null===l?o:l}

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

const global$1 = new Configuration({
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
    richText: true,
    toolbar: true,
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
  global: global$1,
  presets,
  configure({ global: newGlobal, ...newPresets }) {
    if (newGlobal) {
      global$1.merge(newGlobal);
    }
    presets.merge(newPresets);
  }
};

const ALLOWED_HTML_TAGS = [ "a", "b", "blockquote", "br", "code", "div", "em",
  "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "mark", "ol", "p", "pre", "q", "s", "strong", "ul", "table", "tbody", "tr", "th", "td" ];

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
      hookEvent.attrValue = R$3(sanitizedStyles);
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

function buildConfig() {
  return {
    ALLOWED_TAGS: ALLOWED_HTML_TAGS.concat(Lexxy.global.get("attachmentTagName")),
    ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
    ADD_URI_SAFE_ATTR: [ "caption", "filename" ],
    SAFE_FOR_XML: false // So that it does not strip attributes that contains serialized HTML (like content)
  }
}

function getNonce() {
  const element = document.head.querySelector("meta[name=csp-nonce]");
  return element?.content
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

function isActiveAndVisible(element) {
  return element && !element.disabled && element.checkVisibility()
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

  "heading":
  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.5 2C12.0523 2 12.5 2.44772 12.5 3V3.5C12.5 4.05228 12.0523 4.5 11.5 4.5H8V15C8 15.5523 7.55228 16 7 16H6.5C5.94772 16 5.5 15.5523 5.5 15V4.5H2C1.44772 4.5 1 4.05228 1 3.5V3C1 2.44772 1.44772 2 2 2H11.5ZM16 7C16.5523 7 17 7.44772 17 8V8.5C17 9.05228 16.5523 9.5 16 9.5H15V15C15 15.5523 14.5523 16 14 16H13.5C12.9477 16 12.5 15.5523 12.5 15V9.5H11.5C10.9477 9.5 10.5 9.05228 10.5 8.5V8C10.5 7.44772 10.9477 7 11.5 7H16Z"/>
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

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "toolbar";

    this.#createEditorPromise();
  }

  connectedCallback() {
    requestAnimationFrame(() => this.#refreshToolbarOverflow());
    this.setAttribute("role", "toolbar");
    this.#installResizeObserver();
  }

  disconnectedCallback() {
    this.#uninstallResizeObserver();
    this.#unbindHotkeys();
    this.#unbindFocusListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "connected" && this.isConnected && oldValue != null && oldValue !== newValue) {
      requestAnimationFrame(() => this.#reconnect());
    }
  }

  setEditor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
    this.selection = editorElement.selection;
    this.#bindButtons();
    this.#bindHotkeys();
    this.#resetTabIndexValues();
    this.#setItemPositionValues();
    this.#monitorSelectionChanges();
    this.#monitorHistoryChanges();
    this.#refreshToolbarOverflow();
    this.#bindFocusListeners();

    this.resolveEditorPromise(editorElement);

    this.toggleAttribute("connected", true);
  }

  async getEditorElement() {
    return this.editorElement || await this.editorPromise
  }

  #reconnect() {
    this.disconnectedCallback();
    this.connectedCallback();
  }

  #createEditorPromise() {
    this.editorPromise = new Promise((resolve) => {
      this.resolveEditorPromise = resolve;
    });
  }

  #installResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => this.#refreshToolbarOverflow());
    this.resizeObserver.observe(this);
  }

  #uninstallResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  #bindButtons() {
    this.addEventListener("click", this.#handleButtonClicked.bind(this));
  }

  #handleButtonClicked(event) {
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
    }, { tag: isKeyboard ? Vn : undefined });
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

  #bindFocusListeners() {
    this.editorElement.addEventListener("lexxy:focus", this.#handleEditorFocus);
    this.editorElement.addEventListener("lexxy:blur", this.#handleEditorBlur);
    this.addEventListener("keydown", this.#handleKeydown);
  }

  #unbindFocusListeners() {
    this.editorElement.removeEventListener("lexxy:focus", this.#handleEditorFocus);
    this.editorElement.removeEventListener("lexxy:blur", this.#handleEditorBlur);
    this.removeEventListener("keydown", this.#handleKeydown);
  }

  #handleEditorFocus = () => {
    this.#focusableItems[0].tabIndex = 0;
  }

  #handleEditorBlur = () => {
    this.#resetTabIndexValues();
    this.#closeDropdowns();
  }

  #handleKeydown = (event) => {
    handleRollingTabIndex(this.#focusableItems, event);
  }

  #resetTabIndexValues() {
    this.#focusableItems.forEach((button) => {
      button.tabIndex = -1;
    });
  }

  #monitorSelectionChanges() {
    this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        this.#updateButtonStates();
        this.#closeDropdowns();
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
    const selection = $r();
    if (!wr(selection)) return

    const anchorNode = selection.anchor.getNode();
    if (!anchorNode.getParent()) { return }

    const { isBold, isItalic, isStrikethrough, isHighlight, isInLink, isInQuote, isInHeading,
      isInCode, isInList, listType, isInTable } = this.selection.getFormat();

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
    this.#setButtonPressed("table", isInTable);

    this.#updateUndoRedoButtonStates();
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
    // Safari can report inconsistent clientWidth values on more than 100% window zoom level,
    // that was affecting the toolbar overflow calculation. We're adding +1 to get around this issue.
    return (this.scrollWidth - this.#overflow.clientWidth) > this.clientWidth + 1
  }

  #refreshToolbarOverflow = () => {
    this.#resetToolbarOverflow();
    this.#compactMenu();

    this.#overflow.style.display = this.#overflowMenu.children.length ? "block" : "none";
    this.#overflow.setAttribute("nonce", getNonce());

    const isOverflowing = this.#overflowMenu.children.length > 0;
    this.toggleAttribute("overflowing", isOverflowing);
    this.#overflowMenu.toggleAttribute("disabled", !isOverflowing);
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

  #resetToolbarOverflow() {
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

  #closeDropdowns() {
   this.#dropdowns.forEach((details) => {
     details.open = false;
   });
 }

  get #dropdowns() {
    return this.querySelectorAll("details")
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

  get #focusableItems() {
    return Array.from(this.querySelectorAll(":scope button, :scope > details > summary"))
  }

  get #toolbarItems() {
    return Array.from(this.querySelectorAll(":scope > *:not(.lexxy-editor__toolbar-overflow)"))
  }

  static get defaultTemplate() {
    return `
      <button class="lexxy-editor__toolbar-button" type="button" name="bold" data-command="bold" title="Bold">
        ${ToolbarIcons.bold}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="italic" data-command="italic" title="Italic">
      ${ToolbarIcons.italic}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="strikethrough" data-command="strikethrough" title="Strikethrough">
      ${ToolbarIcons.strikethrough}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="heading" data-command="rotateHeadingFormat" title="Heading">
        ${ToolbarIcons.heading}
      </button>

      <details class="lexxy-editor__toolbar-dropdown" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" name="highlight" title="Color highlight">
          ${ToolbarIcons.highlight}
        </summary>
        <lexxy-highlight-dropdown class="lexxy-editor__toolbar-dropdown-content">
          <div class="lexxy-highlight-colors"></div>
          <button data-command="removeHighlight" class="lexxy-editor__toolbar-button lexxy-editor__toolbar-dropdown-reset">Remove all coloring</button>
        </lexxy-highlight-dropdown>
      </details>

      <details class="lexxy-editor__toolbar-dropdown" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" name="link" title="Link" data-hotkey="cmd+k ctrl+k">
          ${ToolbarIcons.link}
        </summary>
        <lexxy-link-dropdown class="lexxy-editor__toolbar-dropdown-content">
          <form method="dialog">
            <input type="url" placeholder="Enter a URL…" class="input">
            <div class="lexxy-editor__toolbar-dropdown-actions">
              <button type="submit" class="lexxy-editor__toolbar-button" value="link">Link</button>
              <button type="button" class="lexxy-editor__toolbar-button" value="unlink">Unlink</button>
            </div>
          </form>
        </lexxy-link-dropdown>
      </details>

      <button class="lexxy-editor__toolbar-button" type="button" name="quote" data-command="insertQuoteBlock" title="Quote">
        ${ToolbarIcons.quote}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="code" data-command="insertCodeBlock" title="Code">
        ${ToolbarIcons.code}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="unordered-list" data-command="insertUnorderedList" title="Bullet list">
        ${ToolbarIcons.ul}
      </button>

      <button class="lexxy-editor__toolbar-button lexxy-editor__toolbar-group-end" type="button" name="ordered-list" data-command="insertOrderedList" title="Numbered list">
        ${ToolbarIcons.ol}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="upload" data-command="uploadAttachments" title="Upload file">
        ${ToolbarIcons.attachment}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="table" data-command="insertTable" title="Insert a table">
        ${ToolbarIcons.table}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="divider" data-command="insertHorizontalDivider" title="Insert a divider">
        ${ToolbarIcons.hr}
      </button>
 
      <div class="lexxy-editor__toolbar-spacer" role="separator"></div>
 
      <button class="lexxy-editor__toolbar-button" type="button" name="undo" data-command="undo" title="Undo">
        ${ToolbarIcons.undo}
      </button>

      <button class="lexxy-editor__toolbar-button" type="button" name="redo" data-command="redo" title="Redo">
        ${ToolbarIcons.redo}
      </button>

      <details class="lexxy-editor__toolbar-dropdown lexxy-editor__toolbar-overflow" name="lexxy-dropdown">
        <summary class="lexxy-editor__toolbar-button" aria-label="Show more toolbar buttons">${ToolbarIcons.overflow}</summary>
        <div class="lexxy-editor__toolbar-dropdown-content lexxy-editor__toolbar-overflow-menu" aria-label="More toolbar buttons"></div>
      </details>
    `
  }
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function T$1(t,...e){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",t);for(const t of e)o.append("v",t);throw n.search=o.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}const B$3="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,_$2=B$3&&"documentMode"in document?document.documentMode:null;!(!B$3||!("InputEvent"in window)||_$2)&&"getTargetRanges"in new window.InputEvent("input");function st$3(t,e){return Array.from(at$3(t))}function ut$3(t){return t?t.getAdjacentCaret():null}function at$3(t,e){return dt$3("next",t)}function ft$3(t,e){const n=jl(ul(t,e));return n&&n[0]}function dt$3(t,e,n){const o=Io(),i=e||o,c=Pi(i)?gl(i,t):ul(i,t),a=pt$5(i),f=ft$3(i,t);let d=a;return Tl({hasNext:t=>null!==t,initial:c,map:t=>({depth:d,node:t.origin}),step:t=>{if(t.isSameNodeCaret(f))return null;sl(t)&&d++;const e=jl(t);return !e||e[0].isSameNodeCaret(f)?null:(d+=e[1],e[0])}})}function pt$5(t){let e=-1;for(let n=t;null!==n;n=n.getParent())e++;return e}function vt$4(t,e){let n=t;for(;null!=n;){if(n instanceof e)return n;n=n.getParent();}return null}function yt$1(t){const e=qs(t,t=>Pi(t)&&!t.isInline());return Pi(e)||T$1(4,t.__key),e}function xt$3(t){const e=$r()||Vr();let r;if(wr(e))r=Ol(e.focus,"next");else {if(null!=e){const t=e.getNodes(),n=t[t.length-1];n&&(r=ul(n,"next"));}r=r||gl(Io(),"previous").getFlipped().insert(Vi());}const i=St$3(t,r),l=pl(i),u=sl(l)?zl(l):i;return Al(Sl(u)),t.getLatest()}function St$3(t,e,n){let o=Bl(e,"next");for(let t=o;t;t=Vl(t,n))o=t;return rl(o)&&T$1(283),o.insert(t.isInline()?Vi().append(t):t),Bl(ul(t.getLatest(),"next"),e.direction)}function Ct$3(t,e){const n=e();return t.replace(n),n.append(t),n}function At$5(t,e){return null!==t&&Object.getPrototypeOf(t).constructor.name===e.name}function bt$4(t){const e=$r();if(!wr(e))return  false;const i=new Set,l=e.getNodes();for(let e=0;e<l.length;e++){const n=l[e],o=n.getKey();if(i.has(o))continue;const s=qs(n,t=>Pi(t)&&!t.isInline());if(null===s)continue;const u=s.getKey();s.canIndent()&&!i.has(u)&&(i.add(u),t(s));}return i.size>0}function Pt$5(t,e){gl(t,"next").insert(e);}function Tt$4(t,e){return Bt$3(t,e,null)}function Bt$3(t,e,n){let o=false;for(const i of kt$5(t))e(i)?null!==n&&n(i):(o=true,Pi(i)&&Bt$3(i,e,n||(t=>i.insertAfter(t))),i.remove());return o}function _t$4(t,e){const n=[],o=Array.from(t).reverse();for(let t=o.pop();void 0!==t;t=o.pop())if(e(t))n.push(t);else if(Pi(t))for(const e of kt$5(t))o.push(e);return n}function Kt$4(t){return $t$2(gl(t,"next"))}function kt$5(t){return $t$2(gl(t,"previous"))}function $t$2(t){return Tl({hasNext:ol,initial:t.getAdjacentCaret(),map:t=>t.origin.getLatest(),step:t=>t.getAdjacentCaret()})}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Z$3=Symbol.for("preact-signals");function J$2(){if(Y$2>1)return void Y$2--;let t,e=false;for(;void 0!==Q$4;){let n=Q$4;for(Q$4=void 0,tt$1++;void 0!==n;){const i=n.o;if(n.o=void 0,n.f&=-3,!(8&n.f)&&st$2(n))try{n.c();}catch(n){e||(t=n,e=true);}n=i;}}if(tt$1=0,Y$2--,e)throw t}function H$3(t){if(Y$2>0)return t();Y$2++;try{return t()}finally{J$2();}}let q$6,Q$4;function X$3(t){const e=q$6;q$6=void 0;try{return t()}finally{q$6=e;}}let Y$2=0,tt$1=0,et$2=0;function nt$2(t){if(void 0===q$6)return;let e=t.n;return void 0===e||e.t!==q$6?(e={i:0,S:t,p:q$6.s,n:void 0,t:q$6,e:void 0,x:void 0,r:e},void 0!==q$6.s&&(q$6.s.n=e),q$6.s=e,t.n=e,32&q$6.f&&t.S(e),e):-1===e.i?(e.i=0,void 0!==e.n&&(e.n.p=e.p,void 0!==e.p&&(e.p.n=e.n),e.p=q$6.s,e.n=void 0,q$6.s.n=e,q$6.s=e),e):void 0}function it$1(t,e){this.v=t,this.i=0,this.n=void 0,this.t=void 0,this.W=null==e?void 0:e.watched,this.Z=null==e?void 0:e.unwatched,this.name=null==e?void 0:e.name;}function ot$1(t,e){return new it$1(t,e)}function st$2(t){for(let e=t.s;void 0!==e;e=e.n)if(e.S.i!==e.i||!e.S.h()||e.S.i!==e.i)return  true;return  false}function rt$3(t){for(let e=t.s;void 0!==e;e=e.n){const n=e.S.n;if(void 0!==n&&(e.r=n),e.S.n=e,e.i=-1,void 0===e.n){t.s=e;break}}}function ct$2(t){let e,n=t.s;for(;void 0!==n;){const t=n.p;-1===n.i?(n.S.U(n),void 0!==t&&(t.n=n.n),void 0!==n.n&&(n.n.p=t)):e=n,n.S.n=n.r,void 0!==n.r&&(n.r=void 0),n=t;}t.s=e;}function at$2(t,e){it$1.call(this,void 0),this.x=t,this.s=void 0,this.g=et$2-1,this.f=4,this.W=null==e?void 0:e.watched,this.Z=null==e?void 0:e.unwatched,this.name=null==e?void 0:e.name;}function ut$2(t){const e=t.u;if(t.u=void 0,"function"==typeof e){Y$2++;const n=q$6;q$6=void 0;try{e();}catch(e){throw t.f&=-2,t.f|=8,ft$2(t),e}finally{q$6=n,J$2();}}}function ft$2(t){for(let e=t.s;void 0!==e;e=e.n)e.S.U(e);t.x=void 0,t.s=void 0,ut$2(t);}function ht$3(t){if(q$6!==this)throw new Error("Out-of-order effect");ct$2(this),q$6=t,this.f&=-2,8&this.f&&ft$2(this),J$2();}function lt$1(t,e){this.x=t,this.u=void 0,this.s=void 0,this.o=void 0,this.f=32,this.name=null==e?void 0:e.name;}function gt$3(t,e){const n=new lt$1(t,e);try{n.c();}catch(t){throw n.d(),t}const i=n.d.bind(n);return i[Symbol.dispose]=i,i}function pt$4(t,e={}){const n={};for(const i in t){const o=e[i],s=ot$1(void 0===o?t[i]:o);n[i]=s;}return n}it$1.prototype.brand=Z$3,it$1.prototype.h=function(){return  true},it$1.prototype.S=function(t){const e=this.t;e!==t&&void 0===t.e&&(t.x=e,this.t=t,void 0!==e?e.e=t:X$3(()=>{var t;null==(t=this.W)||t.call(this);}));},it$1.prototype.U=function(t){if(void 0!==this.t){const e=t.e,n=t.x;void 0!==e&&(e.x=n,t.e=void 0),void 0!==n&&(n.e=e,t.x=void 0),t===this.t&&(this.t=n,void 0===n&&X$3(()=>{var t;null==(t=this.Z)||t.call(this);}));}},it$1.prototype.subscribe=function(t){return gt$3(()=>{const e=this.value,n=q$6;q$6=void 0;try{t(e);}finally{q$6=n;}},{name:"sub"})},it$1.prototype.valueOf=function(){return this.value},it$1.prototype.toString=function(){return this.value+""},it$1.prototype.toJSON=function(){return this.value},it$1.prototype.peek=function(){const t=q$6;q$6=void 0;try{return this.value}finally{q$6=t;}},Object.defineProperty(it$1.prototype,"value",{get(){const t=nt$2(this);return void 0!==t&&(t.i=this.i),this.v},set(t){if(t!==this.v){if(tt$1>100)throw new Error("Cycle detected");this.v=t,this.i++,et$2++,Y$2++;try{for(let t=this.t;void 0!==t;t=t.x)t.t.N();}finally{J$2();}}}}),at$2.prototype=new it$1,at$2.prototype.h=function(){if(this.f&=-3,1&this.f)return  false;if(32==(36&this.f))return  true;if(this.f&=-5,this.g===et$2)return  true;if(this.g=et$2,this.f|=1,this.i>0&&!st$2(this))return this.f&=-2,true;const t=q$6;try{rt$3(this),q$6=this;const t=this.x();(16&this.f||this.v!==t||0===this.i)&&(this.v=t,this.f&=-17,this.i++);}catch(t){this.v=t,this.f|=16,this.i++;}return q$6=t,ct$2(this),this.f&=-2,true},at$2.prototype.S=function(t){if(void 0===this.t){this.f|=36;for(let t=this.s;void 0!==t;t=t.n)t.S.S(t);}it$1.prototype.S.call(this,t);},at$2.prototype.U=function(t){if(void 0!==this.t&&(it$1.prototype.U.call(this,t),void 0===this.t)){this.f&=-33;for(let t=this.s;void 0!==t;t=t.n)t.S.U(t);}},at$2.prototype.N=function(){if(!(2&this.f)){this.f|=6;for(let t=this.t;void 0!==t;t=t.x)t.t.N();}},Object.defineProperty(at$2.prototype,"value",{get(){if(1&this.f)throw new Error("Cycle detected");const t=nt$2(this);if(this.h(),void 0!==t&&(t.i=this.i),16&this.f)throw this.v;return this.v}}),lt$1.prototype.c=function(){const t=this.S();try{if(8&this.f)return;if(void 0===this.x)return;const t=this.x();"function"==typeof t&&(this.u=t);}finally{t();}},lt$1.prototype.S=function(){if(1&this.f)throw new Error("Cycle detected");this.f|=1,this.f&=-9,ut$2(this),rt$3(this),Y$2++;const t=q$6;return q$6=this,ht$3.bind(this,t)},lt$1.prototype.N=function(){2&this.f||(this.f|=2,this.o=Q$4,Q$4=this);},lt$1.prototype.d=function(){this.f|=8,1&this.f||ft$2(this);},lt$1.prototype.dispose=function(){this.d();};function Et$3(t){return ("function"==typeof t.nodes?t.nodes():t.nodes)||[]}it$2("format",{parse:t=>"number"==typeof t?t:0});function _t$3(t,...e){const n=new URL("https://lexical.dev/docs/error"),i=new URLSearchParams;i.append("code",t);for(const t of e)i.append("v",t);throw n.search=i.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}function jt$3(t,e){if(t&&e&&!Array.isArray(e)&&"object"==typeof t&&"object"==typeof e){const n=t,i=e;for(const t in i)n[t]=jt$3(n[t],i[t]);return t}return e}const At$4=0,kt$4=1,Pt$4=2,Kt$3=3,$t$1=4,zt$3=5,Ut$2=6,Lt$3=7;function Tt$3(t){return t.id===At$4}function Bt$2(t){return t.id===Pt$4}function Wt$3(t){return function(t){return t.id===kt$4}(t)||_t$3(305,String(t.id),String(kt$4)),Object.assign(t,{id:Pt$4})}const Gt$2=new Set;let Vt$2 = class Vt{builder;configs;_dependency;_peerNameSet;extension;state;_signal;constructor(t,e){this.builder=t,this.extension=e,this.configs=new Set,this.state={id:At$4};}mergeConfigs(){let t=this.extension.config||{};const e=this.extension.mergeConfig?this.extension.mergeConfig.bind(this.extension):Xl;for(const n of this.configs)t=e(t,n);return t}init(t){const e=this.state;Bt$2(e)||_t$3(306,String(e.id));const n={getDependency:this.getInitDependency.bind(this),getDirectDependentNames:this.getDirectDependentNames.bind(this),getPeer:this.getInitPeer.bind(this),getPeerNameSet:this.getPeerNameSet.bind(this)},i={...n,getDependency:this.getDependency.bind(this),getInitResult:this.getInitResult.bind(this),getPeer:this.getPeer.bind(this)},o=function(t,e,n){return Object.assign(t,{config:e,id:Kt$3,registerState:n})}(e,this.mergeConfigs(),n);let s;this.state=o,this.extension.init&&(s=this.extension.init(t,o.config,n)),this.state=function(t,e,n){return Object.assign(t,{id:$t$1,initResult:e,registerState:n})}(o,s,i);}build(t){const e=this.state;let n;e.id!==$t$1&&_t$3(307,String(e.id),String(zt$3)),this.extension.build&&(n=this.extension.build(t,e.config,e.registerState));const i={...e.registerState,getOutput:()=>n,getSignal:this.getSignal.bind(this)};this.state=function(t,e,n){return Object.assign(t,{id:zt$3,output:e,registerState:n})}(e,n,i);}register(t,e){this._signal=e;const n=this.state;n.id!==zt$3&&_t$3(308,String(n.id),String(zt$3));const i=this.extension.register&&this.extension.register(t,n.config,n.registerState);return this.state=function(t){return Object.assign(t,{id:Ut$2})}(n),()=>{const t=this.state;t.id!==Lt$3&&_t$3(309,String(n.id),String(Lt$3)),this.state=function(t){return Object.assign(t,{id:zt$3})}(t),i&&i();}}afterRegistration(t){const e=this.state;let n;return e.id!==Ut$2&&_t$3(310,String(e.id),String(Ut$2)),this.extension.afterRegistration&&(n=this.extension.afterRegistration(t,e.config,e.registerState)),this.state=function(t){return Object.assign(t,{id:Lt$3})}(e),n}getSignal(){return void 0===this._signal&&_t$3(311),this._signal}getInitResult(){ void 0===this.extension.init&&_t$3(312,this.extension.name);const t=this.state;return function(t){return t.id>=$t$1}(t)||_t$3(313,String(t.id),String($t$1)),t.initResult}getInitPeer(t){const e=this.builder.extensionNameMap.get(t);return e?e.getExtensionInitDependency():void 0}getExtensionInitDependency(){const t=this.state;return function(t){return t.id>=Kt$3}(t)||_t$3(314,String(t.id),String(Kt$3)),{config:t.config}}getPeer(t){const e=this.builder.extensionNameMap.get(t);return e?e.getExtensionDependency():void 0}getInitDependency(t){const e=this.builder.getExtensionRep(t);return void 0===e&&_t$3(315,this.extension.name,t.name),e.getExtensionInitDependency()}getDependency(t){const e=this.builder.getExtensionRep(t);return void 0===e&&_t$3(315,this.extension.name,t.name),e.getExtensionDependency()}getState(){const t=this.state;return function(t){return t.id>=Lt$3}(t)||_t$3(316,String(t.id),String(Lt$3)),t}getDirectDependentNames(){return this.builder.incomingEdges.get(this.extension.name)||Gt$2}getPeerNameSet(){let t=this._peerNameSet;return t||(t=new Set((this.extension.peerDependencies||[]).map(([t])=>t)),this._peerNameSet=t),t}getExtensionDependency(){if(!this._dependency){const t=this.state;((function(t){return t.id>=zt$3}))(t)||_t$3(317,this.extension.name),this._dependency={config:t.config,init:t.initResult,output:t.output};}return this._dependency}};const Zt$1={tag:Wn};function Jt$3(){const t=Io();t.isEmpty()&&t.append(Vi());}const Ht$3=Yl({config:Gl({setOptions:Zt$1,updateOptions:Zt$1}),init:({$initialEditorState:t=Jt$3})=>({$initialEditorState:t,initialized:false}),afterRegistration(t,{updateOptions:e,setOptions:n},i){const o=i.getInitResult();if(!o.initialized){o.initialized=true;const{$initialEditorState:i}=o;if(Wi(i))t.setEditorState(i,n);else if("function"==typeof i)t.update(()=>{i(t);},e);else if(i&&("string"==typeof i||"object"==typeof i)){const e=t.parseEditorState(i);t.setEditorState(e,n);}}return ()=>{}},name:"@lexical/extension/InitialState",nodes:[Ii,lr,Gn,xr,Ui]}),qt$2=Symbol.for("@lexical/extension/LexicalBuilder");function Qt$2(...t){return ne$1.fromExtensions(t).buildEditor()}function Xt$2(){}function Yt$2(t){throw t}function te$1(t){return Array.isArray(t)?t:[t]}const ee$1="0.41.0+prod.esm";let ne$1 = class ne{roots;extensionNameMap;outgoingConfigEdges;incomingEdges;conflicts;_sortedExtensionReps;PACKAGE_VERSION;constructor(t){this.outgoingConfigEdges=new Map,this.incomingEdges=new Map,this.extensionNameMap=new Map,this.conflicts=new Map,this.PACKAGE_VERSION=ee$1,this.roots=t;for(const e of t)this.addExtension(e);}static fromExtensions(t){const e=[te$1(Ht$3)];for(const n of t)e.push(te$1(n));return new ne(e)}static maybeFromEditor(t){const e=t[qt$2];return e&&(e.PACKAGE_VERSION!==ee$1&&_t$3(292,e.PACKAGE_VERSION,ee$1),e instanceof ne||_t$3(293)),e}static fromEditor(t){const e=ne.maybeFromEditor(t);return void 0===e&&_t$3(294),e}constructEditor(){const{$initialEditorState:t,onError:e,...n}=this.buildCreateEditorArgs(),i=Object.assign(eo({...n,...e?{onError:t=>{e(t,i);}}:{}}),{[qt$2]:this});for(const t of this.sortedExtensionReps())t.build(i);return i}buildEditor(){let t=Xt$2;function e(){try{t();}finally{t=Xt$2;}}const n=Object.assign(this.constructEditor(),{dispose:e,[Symbol.dispose]:e});return t=ec(this.registerEditor(n),()=>n.setRootElement(null)),n}hasExtensionByName(t){return this.extensionNameMap.has(t)}getExtensionRep(t){const e=this.extensionNameMap.get(t.name);if(e)return e.extension!==t&&_t$3(295,t.name),e}addEdge(t,e,n){const i=this.outgoingConfigEdges.get(t);i?i.set(e,n):this.outgoingConfigEdges.set(t,new Map([[e,n]]));const o=this.incomingEdges.get(e);o?o.add(t):this.incomingEdges.set(e,new Set([t]));}addExtension(t){ void 0!==this._sortedExtensionReps&&_t$3(296);const e=te$1(t),[n]=e;"string"!=typeof n.name&&_t$3(297,typeof n.name);let i=this.extensionNameMap.get(n.name);if(void 0!==i&&i.extension!==n&&_t$3(298,n.name),!i){i=new Vt$2(this,n),this.extensionNameMap.set(n.name,i);const t=this.conflicts.get(n.name);"string"==typeof t&&_t$3(299,n.name,t);for(const t of n.conflictsWith||[])this.extensionNameMap.has(t)&&_t$3(299,n.name,t),this.conflicts.set(t,n.name);for(const t of n.dependencies||[]){const e=te$1(t);this.addEdge(n.name,e[0].name,e.slice(1)),this.addExtension(e);}for(const[t,e]of n.peerDependencies||[])this.addEdge(n.name,t,e?[e]:[]);}}sortedExtensionReps(){if(this._sortedExtensionReps)return this._sortedExtensionReps;const t=[],e=(n,i)=>{let o=n.state;if(Bt$2(o))return;const s=n.extension.name;var r;Tt$3(o)||_t$3(300,s,i||"[unknown]"),Tt$3(r=o)||_t$3(304,String(r.id),String(At$4)),o=Object.assign(r,{id:kt$4}),n.state=o;const c=this.outgoingConfigEdges.get(s);if(c)for(const t of c.keys()){const n=this.extensionNameMap.get(t);n&&e(n,s);}o=Wt$3(o),n.state=o,t.push(n);};for(const t of this.extensionNameMap.values())Tt$3(t.state)&&e(t);for(const e of t)for(const[t,n]of this.outgoingConfigEdges.get(e.extension.name)||[])if(n.length>0){const e=this.extensionNameMap.get(t);if(e)for(const t of n)e.configs.add(t);}for(const[t,...e]of this.roots)if(e.length>0){const n=this.extensionNameMap.get(t.name);void 0===n&&_t$3(301,t.name);for(const t of e)n.configs.add(t);}return this._sortedExtensionReps=t,this._sortedExtensionReps}registerEditor(t){const e=this.sortedExtensionReps(),n=new AbortController,i=[()=>n.abort()],o=n.signal;for(const n of e){const e=n.register(t,o);e&&i.push(e);}for(const n of e){const e=n.afterRegistration(t);e&&i.push(e);}return ec(...i)}buildCreateEditorArgs(){const t={},e=new Set,n=new Map,i=new Map,o={},s={},r=this.sortedExtensionReps();for(const c of r){const{extension:r}=c;if(void 0!==r.onError&&(t.onError=r.onError),void 0!==r.disableEvents&&(t.disableEvents=r.disableEvents),void 0!==r.parentEditor&&(t.parentEditor=r.parentEditor),void 0!==r.editable&&(t.editable=r.editable),void 0!==r.namespace&&(t.namespace=r.namespace),void 0!==r.$initialEditorState&&(t.$initialEditorState=r.$initialEditorState),r.nodes)for(const t of Et$3(r)){if("function"!=typeof t){const e=n.get(t.replace);e&&_t$3(302,r.name,t.replace.name,e.extension.name),n.set(t.replace,c);}e.add(t);}if(r.html){if(r.html.export)for(const[t,e]of r.html.export.entries())i.set(t,e);r.html.import&&Object.assign(o,r.html.import);}r.theme&&jt$3(s,r.theme);}Object.keys(s).length>0&&(t.theme=s),e.size&&(t.nodes=[...e]);const c=Object.keys(o).length>0,a=i.size>0;(c||a)&&(t.html={},c&&(t.html.import=o),a&&(t.html.export=i));for(const e of r)e.init(t);return t.onError||(t.onError=Yt$2),t}};function oe$2(t,e){const n=ne$1.fromEditor(t).extensionNameMap.get(e);return n?n.getExtensionDependency():void 0}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function $$3(e,...t){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",e);for(const e of t)r.append("v",e);throw n.search=r.toString(),Error(`Minified Lexical error #${e}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}function V$3(e){let t=1,n=e.getParent();for(;null!=n;){if(ae$1(n)){const e=n.getParent();if(me$1(e)){t++,n=e.getParent();continue}$$3(40);}return t}return t}function z$3(e){let t=e.getParent();me$1(t)||$$3(40);let n=t;for(;null!==n;)n=n.getParent(),me$1(n)&&(t=n);return t}function X$2(e){let t=[];const n=e.getChildren().filter(ae$1);for(let e=0;e<n.length;e++){const r=n[e],i=r.getFirstChild();me$1(i)?t=t.concat(X$2(i)):t.push(r);}return t}function j$2(e){return ae$1(e)&&me$1(e.getFirstChild())}function q$5(e){return ce$1().append(e)}function H$2(e,t){return ae$1(e)&&(0===t.length||1===t.length&&e.is(t[0])&&0===e.getChildrenSize())}function G$3(e){const t=$r();if(null!==t){let n=t.getNodes();if(wr(t)){const r=t.getStartEndPoints();null===r&&$$3(143);const[i]=r,s=i.getNode(),o=s.getParent();if(xs(s)){const e=s.getFirstChild();if(e)n=e.selectStart().getNodes();else {const e=Vi();s.append(e),n=e.select().getNodes();}}else if(H$2(s,n)){const t=pe$1(e);if(xs(o)){s.replace(t);const e=ce$1();Pi(s)&&(e.setFormat(s.getFormatType()),e.setIndent(s.getIndent())),t.append(e);}else if(ae$1(s)){const e=s.getParentOrThrow();Q$3(t,e.getChildren()),e.replace(t);}return}}const r=new Set;for(let t=0;t<n.length;t++){const i=n[t];if(Pi(i)&&i.isEmpty()&&!ae$1(i)&&!r.has(i.getKey())){Y$1(i,e);continue}let s=ko(i)?i.getParent():ae$1(i)&&i.isEmpty()?i:null;for(;null!=s;){const t=s.getKey();if(me$1(s)){if(!r.has(t)){const n=pe$1(e);Q$3(n,s.getChildren()),s.replace(n),r.add(t);}break}{const n=s.getParent();if(xs(n)&&!r.has(t)){r.add(t),Y$1(s,e);break}s=n;}}}}}function Q$3(e,t){e.splice(e.getChildrenSize(),0,t);}function Y$1(e,t){if(me$1(e))return e;const n=e.getPreviousSibling(),r=e.getNextSibling(),i=ce$1();let s;if(Q$3(i,e.getChildren()),me$1(n)&&t===n.getListType())n.append(i),me$1(r)&&t===r.getListType()&&(Q$3(n,r.getChildren()),r.remove()),s=n;else if(me$1(r)&&t===r.getListType())r.getFirstChildOrThrow().insertBefore(i),s=r;else {const n=pe$1(t);n.append(i),e.replace(n),s=n;}i.setFormat(e.getFormatType()),i.setIndent(e.getIndent());const o=$r();return wr(o)&&(s.getKey()===o.anchor.key&&o.anchor.set(i.getKey(),o.anchor.offset,"element"),s.getKey()===o.focus.key&&o.focus.set(i.getKey(),o.focus.offset,"element")),e.remove(),s}function Z$2(e,t){const n=e.getLastChild(),r=t.getFirstChild();n&&r&&j$2(n)&&j$2(r)&&(Z$2(n.getFirstChild(),r.getFirstChild()),r.remove());const i=t.getChildren();i.length>0&&e.append(...i),t.remove();}function ee(){const e=$r();if(wr(e)){const t=new Set,r=e.getNodes(),i=e.anchor.getNode();if(H$2(i,r))t.add(z$3(i));else for(let e=0;e<r.length;e++){const i=r[e];if(ko(i)){const e=vt$4(i,se$1);null!=e&&t.add(z$3(e));}}for(const n of t){let t=n;const r=X$2(n);for(const n of r){const r=Vi().setTextStyle(e.style).setTextFormat(e.format);Q$3(r,n.getChildren()),t.insertAfter(r),t=r,n.__key===e.anchor.key&&Ml(e.anchor,zl(gl(r,"next"))),n.__key===e.focus.key&&Ml(e.focus,zl(gl(r,"next"))),n.remove();}n.remove();}}}function te(e){const t="check"!==e.getListType();let n=e.getStart();for(const r of e.getChildren())ae$1(r)&&(r.getValue()!==n&&r.setValue(n),t&&null!=r.getLatest().__checked&&r.setChecked(void 0),me$1(r.getFirstChild())||n++);}function ne(e){const t=new Set;if(j$2(e)||t.has(e.getKey()))return;const n=e.getParent(),r=e.getNextSibling(),i=e.getPreviousSibling();if(j$2(r)&&j$2(i)){const n=i.getFirstChild();if(me$1(n)){n.append(e);const i=r.getFirstChild();if(me$1(i)){Q$3(n,i.getChildren()),r.remove(),t.add(r.getKey());}}}else if(j$2(r)){const t=r.getFirstChild();if(me$1(t)){const n=t.getFirstChild();null!==n&&n.insertBefore(e);}}else if(j$2(i)){const t=i.getFirstChild();me$1(t)&&t.append(e);}else if(me$1(n)){const t=ce$1().setTextFormat(e.getTextFormat()).setTextStyle(e.getTextStyle()),s=pe$1(n.getListType()).setTextFormat(n.getTextFormat()).setTextStyle(n.getTextStyle());t.append(s),s.append(e),i?i.insertAfter(t):r?r.insertBefore(t):n.append(t);}}function re$1(e){if(j$2(e))return;const t=e.getParent(),n=t?t.getParent():void 0;if(me$1(n?n.getParent():void 0)&&ae$1(n)&&me$1(t)){const r=t?t.getFirstChild():void 0,i=t?t.getLastChild():void 0;if(e.is(r))n.insertBefore(e),t.isEmpty()&&n.remove();else if(e.is(i))n.insertAfter(e),t.isEmpty()&&n.remove();else {const r=t.getListType(),i=ce$1(),s=pe$1(r);i.append(s),e.getPreviousSiblings().forEach(e=>s.append(e));const o=ce$1(),l=pe$1(r);o.append(l),Q$3(l,e.getNextSiblings()),n.insertBefore(i),n.insertAfter(o),n.replace(e);}}}function ie$1(e=false){const t=$r();if(!wr(t)||!t.isCollapsed())return  false;const n=t.anchor.getNode();let r=null;if(ae$1(n)&&0===n.getChildrenSize())r=n;else if(yr(n)){const e=n.getParent();ae$1(e)&&e.getChildren().every(e=>yr(e)&&""===e.getTextContent().trim())&&(r=e);}if(null===r)return  false;const i=z$3(r),s=r.getParent();me$1(s)||$$3(40);const o=s.getParent();let l;if(xs(o))l=Vi(),i.insertAfter(l);else {if(!ae$1(o))return  false;l=ce$1(),o.insertAfter(l);}l.setTextStyle(t.style).setTextFormat(t.format).select();const c=r.getNextSiblings();if(c.length>0){const t=e?function(e,t){return e.getStart()+t.getIndexWithinParent()}(s,r):1,n=pe$1(s.getListType(),t);if(ae$1(l)){const e=ce$1();e.append(n),l.insertAfter(e);}else l.insertAfter(n);n.append(...c);}return function(e){let t=e;for(;null==t.getNextSibling()&&null==t.getPreviousSibling();){const e=t.getParent();if(null==e||!ae$1(e)&&!me$1(e))break;t=e;}t.remove();}(r),true}let se$1 = class se extends Ai{__value;__checked;$config(){return this.config("listitem",{$transform:e=>{if(null==e.__checked)return;const t=e.getParent();me$1(t)&&"check"!==t.getListType()&&null!=e.getChecked()&&e.setChecked(void 0);},extends:Ai,importDOM:Ln({li:()=>({conversion:oe$1,priority:0})})})}constructor(e=1,t=void 0,n){super(n),this.__value=void 0===e?1:e,this.__checked=t;}afterCloneFrom(e){super.afterCloneFrom(e),this.__value=e.__value,this.__checked=e.__checked;}createDOM(e){const t=document.createElement("li");return this.updateListItemDOM(null,t,e),t}updateListItemDOM(e,t,n){!function(e,t,n){const r=t.getParent();!me$1(r)||"check"!==r.getListType()||me$1(t.getFirstChild())?(e.removeAttribute("role"),e.removeAttribute("tabIndex"),e.removeAttribute("aria-checked")):(e.setAttribute("role","checkbox"),e.setAttribute("tabIndex","-1"),n&&t.__checked===n.__checked||e.setAttribute("aria-checked",t.getChecked()?"true":"false"));}(t,this,e),t.value=this.__value,function(e,t,n){const s=[],o=[],l=t.list,c=l?l.listitem:void 0;let a;l&&l.nested&&(a=l.nested.listitem);void 0!==c&&s.push(...Ql(c));if(l){const e=n.getParent(),t=me$1(e)&&"check"===e.getListType(),r=n.getChecked();t&&!r||o.push(l.listitemUnchecked),t&&r||o.push(l.listitemChecked),t&&s.push(r?l.listitemChecked:l.listitemUnchecked);}if(void 0!==a){const e=Ql(a);n.getChildren().some(e=>me$1(e))?s.push(...e):o.push(...e);}o.length>0&&tc(e,...o);s.length>0&&Zl(e,...s);}(t,n.theme,this);const s=e?e.__style:"",o=this.__style;s!==o&&(""===o?t.removeAttribute("style"):t.style.cssText=o),function(e,t,n){const r=b$3(t.__textStyle);for(const t in r)e.style.setProperty(`--listitem-marker-${t}`,r[t]);if(n)for(const t in b$3(n.__textStyle))t in r||e.style.removeProperty(`--listitem-marker-${t}`);}(t,this,e);}updateDOM(e,t,n){const r=t;return this.updateListItemDOM(e,r,n),false}updateFromJSON(e){return super.updateFromJSON(e).setValue(e.value).setChecked(e.checked)}exportDOM(e){const t=this.createDOM(e._config),n=this.getFormatType();n&&(t.style.textAlign=n);const r=this.getDirection();return r&&(t.dir=r),{element:t}}exportJSON(){return {...super.exportJSON(),checked:this.getChecked(),value:this.getValue()}}append(...e){for(let t=0;t<e.length;t++){const n=e[t];if(Pi(n)&&this.canMergeWith(n)){const e=n.getChildren();this.append(...e),n.remove();}else super.append(n);}return this}replace(e,t){if(ae$1(e))return super.replace(e);this.setIndent(0);const n=this.getParentOrThrow();if(!me$1(n))return e;if(n.__first===this.getKey())n.insertBefore(e);else if(n.__last===this.getKey())n.insertAfter(e);else {const t=pe$1(n.getListType());let r=this.getNextSibling();for(;r;){const e=r;r=r.getNextSibling(),t.append(e);}n.insertAfter(e),e.insertAfter(t);}return t&&(Pi(e)||$$3(139),this.getChildren().forEach(t=>{e.append(t);})),this.remove(),0===n.getChildrenSize()&&n.remove(),e}insertAfter(e,t=true){const n=this.getParentOrThrow();if(me$1(n)||$$3(39),ae$1(e))return super.insertAfter(e,t);const r=this.getNextSiblings();if(n.insertAfter(e,t),0!==r.length){const i=pe$1(n.getListType());r.forEach(e=>i.append(e)),e.insertAfter(i,t);}return e}remove(e){const t=this.getPreviousSibling(),n=this.getNextSibling();super.remove(e),t&&n&&j$2(t)&&j$2(n)&&(Z$2(t.getFirstChild(),n.getFirstChild()),n.remove());}insertNewAfter(e,t=true){const n=ce$1().updateFromJSON(this.exportJSON()).setChecked(!this.getChecked()&&void 0);return this.insertAfter(n,t),n}collapseAtStart(e){const t=Vi();this.getChildren().forEach(e=>t.append(e));const n=this.getParentOrThrow(),r=n.getParentOrThrow(),i=ae$1(r);if(1===n.getChildrenSize())if(i)n.remove(),r.select();else {n.insertBefore(t),n.remove();const r=e.anchor,i=e.focus,s=t.getKey();"element"===r.type&&r.getNode().is(this)&&r.set(s,r.offset,"element"),"element"===i.type&&i.getNode().is(this)&&i.set(s,i.offset,"element");}else n.insertBefore(t),this.remove();return  true}getValue(){return this.getLatest().__value}setValue(e){const t=this.getWritable();return t.__value=e,t}getChecked(){const e=this.getLatest();let t;const n=this.getParent();return me$1(n)&&(t=n.getListType()),"check"===t?Boolean(e.__checked):void 0}setChecked(e){const t=this.getWritable();return t.__checked=e,t}toggleChecked(){const e=this.getWritable();return e.setChecked(!e.__checked)}getIndent(){const e=this.getParent();if(null===e||!this.isAttached())return this.getLatest().__indent;let t=e.getParentOrThrow(),n=0;for(;ae$1(t);)t=t.getParentOrThrow().getParentOrThrow(),n++;return n}setIndent(e){"number"!=typeof e&&$$3(117),(e=Math.floor(e))>=0||$$3(199);let t=this.getIndent();for(;t!==e;)t<e?(ne(this),t++):(re$1(this),t--);return this}canInsertAfter(e){return ae$1(e)}canReplaceWith(e){return ae$1(e)}canMergeWith(e){return ae$1(e)||Yi(e)}extractWithChild(e,t){if(!wr(t))return  false;const n=t.anchor.getNode(),r=t.focus.getNode();return this.isParentOf(n)&&this.isParentOf(r)&&this.getTextContent().length===t.getTextContent().length}isParentRequired(){return  true}createParentElementNode(){return pe$1("bullet")}canMergeWhenEmpty(){return  true}};function oe$1(e){if(e.classList.contains("task-list-item"))for(const t of e.children)if("INPUT"===t.tagName)return le$1(t);if(e.classList.contains("joplin-checkbox"))for(const t of e.children)if(t.classList.contains("checkbox-wrapper")&&t.children.length>0&&"INPUT"===t.children[0].tagName)return le$1(t.children[0]);const t=e.getAttribute("aria-checked");return {node:ce$1("true"===t||"false"!==t&&void 0)}}function le$1(e){if(!("checkbox"===e.getAttribute("type")))return {node:null};return {node:ce$1(e.hasAttribute("checked"))}}function ce$1(e){return Ss(new se$1(void 0,e))}function ae$1(e){return e instanceof se$1}let ue$1 = class ue extends Ai{__tag;__start;__listType;$config(){return this.config("list",{$transform:e=>{!function(e){const t=e.getNextSibling();me$1(t)&&e.getListType()===t.getListType()&&Z$2(e,t);}(e),te(e);},extends:Ai,importDOM:Ln({ol:()=>({conversion:de$1,priority:0}),ul:()=>({conversion:de$1,priority:0})})})}constructor(e="number",t=1,n){super(n);const r=fe$1[e]||e;this.__listType=r,this.__tag="number"===r?"ol":"ul",this.__start=t;}afterCloneFrom(e){super.afterCloneFrom(e),this.__listType=e.__listType,this.__tag=e.__tag,this.__start=e.__start;}getTag(){return this.getLatest().__tag}setListType(e){const t=this.getWritable();return t.__listType=e,t.__tag="number"===e?"ol":"ul",t}getListType(){return this.getLatest().__listType}getStart(){return this.getLatest().__start}setStart(e){const t=this.getWritable();return t.__start=e,t}createDOM(e,t){const n=this.__tag,r=document.createElement(n);return 1!==this.__start&&r.setAttribute("start",String(this.__start)),r.__lexicalListType=this.__listType,ge$1(r,e.theme,this),r}updateDOM(e,t,n){return e.__tag!==this.__tag||e.__listType!==this.__listType||(ge$1(t,n.theme,this),e.__start!==this.__start&&t.setAttribute("start",String(this.__start)),false)}updateFromJSON(e){return super.updateFromJSON(e).setListType(e.listType).setStart(e.start)}exportDOM(e){const t=this.createDOM(e._config,e);return Ms(t)&&(1!==this.__start&&t.setAttribute("start",String(this.__start)),"check"===this.__listType&&t.setAttribute("__lexicalListType","check")),{element:t}}exportJSON(){return {...super.exportJSON(),listType:this.getListType(),start:this.getStart(),tag:this.getTag()}}canBeEmpty(){return  false}canIndent(){return  false}splice(e,t,n){let r=n;for(let e=0;e<n.length;e++){const t=n[e];ae$1(t)||(r===n&&(r=[...n]),r[e]=ce$1().append(!Pi(t)||me$1(t)||t.isInline()?t:pr(t.getTextContent())));}return super.splice(e,t,r)}extractWithChild(e){return ae$1(e)}};function ge$1(e,t,n){const s=[],o=[],l=t.list;if(void 0!==l){const e=l[`${n.__tag}Depth`]||[],t=V$3(n)-1,r=t%e.length,i=e[r],c=l[n.__tag];let a;const u=l.nested,g=l.checklist;if(void 0!==u&&u.list&&(a=u.list),void 0!==c&&s.push(c),void 0!==g&&"check"===n.__listType&&s.push(g),void 0!==i){s.push(...Ql(i));for(let t=0;t<e.length;t++)t!==r&&o.push(n.__tag+t);}if(void 0!==a){const e=Ql(a);t>1?s.push(...e):o.push(...e);}}o.length>0&&tc(e,...o),s.length>0&&Zl(e,...s);}function he$1(e){const t=[];for(let n=0;n<e.length;n++){const r=e[n];if(ae$1(r)){t.push(r);const e=r.getChildren();e.length>1&&e.forEach(e=>{me$1(e)&&t.push(q$5(e));});}else t.push(q$5(r));}return t}function de$1(e){const t=e.nodeName.toLowerCase();let n=null;if("ol"===t){n=pe$1("number",e.start);}else "ul"===t&&(n=function(e){if("check"===e.getAttribute("__lexicallisttype")||e.classList.contains("contains-task-list")||"1"===e.getAttribute("data-is-checklist"))return  true;for(const t of e.childNodes)if(Ms(t)&&t.hasAttribute("aria-checked"))return  true;return  false}(e)?pe$1("check"):pe$1("bullet"));return {after:he$1,node:n}}const fe$1={ol:"number",ul:"bullet"};function pe$1(e="number",t=1){return Ss(new ue$1(e,t))}function me$1(e){return e instanceof ue$1}const Se$1=ne$3("UPDATE_LIST_START_COMMAND"),xe=ne$3("INSERT_UNORDERED_LIST_COMMAND"),ke$2=ne$3("INSERT_ORDERED_LIST_COMMAND"),be$1=ne$3("REMOVE_LIST_COMMAND");function Le$2(e,t){return ec(e.registerCommand(ke$2,()=>(G$3("number"),true),Hi),e.registerCommand(Se$1,e=>{const{listNodeKey:t,newStart:n}=e,r=Mo(t);return !!me$1(r)&&("number"===r.getListType()&&(r.setStart(n),te(r)),true)},Hi),e.registerCommand(xe,()=>(G$3("bullet"),true),Hi),e.registerCommand(be$1,()=>(ee(),true),Hi),e.registerCommand(de$2,()=>ie$1(false),Hi),e.registerNodeTransform(se$1,e=>{const t=e.getFirstChild();if(t){if(yr(t)){const n=t.getStyle(),r=t.getFormat();e.getTextStyle()!==n&&e.setTextStyle(n),e.getTextFormat()!==r&&e.setTextFormat(r);}}else {const t=$r();wr(t)&&(t.style!==e.getTextStyle()||t.format!==e.getTextFormat())&&t.isCollapsed()&&e.is(t.anchor.getNode())&&e.setTextStyle(t.style).setTextFormat(t.format);}}),e.registerNodeTransform(lr,e=>{const t=e.getParent();if(ae$1(t)&&e.is(t.getFirstChild())){const n=e.getStyle(),r=e.getFormat();n===t.getTextStyle()&&r===t.getTextFormat()||t.setTextStyle(n).setTextFormat(r);}}))}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const w$3=new Set(["http:","https:","mailto:","sms:","tel:"]);let E$3 = class E extends Ai{__url;__target;__rel;__title;static getType(){return "link"}static clone(t){return new E(t.__url,{rel:t.__rel,target:t.__target,title:t.__title},t.__key)}constructor(t="",e={},n){super(n);const{target:r=null,rel:i=null,title:s=null}=e;this.__url=t,this.__target=r,this.__rel=i,this.__title=s;}createDOM(e){const n=document.createElement("a");return this.updateLinkDOM(null,n,e),Zl(n,e.theme.link),n}updateLinkDOM(t,n,r){if(Os(n)){t&&t.__url===this.__url||(n.href=this.sanitizeUrl(this.__url));for(const e of ["target","rel","title"]){const r=`__${e}`,i=this[r];t&&t[r]===i||(i?n[e]=i:n.removeAttribute(e));}}}updateDOM(t,e,n){return this.updateLinkDOM(t,e,n),false}static importDOM(){return {a:t=>({conversion:W$3,priority:1})}}static importJSON(t){return K$3().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setURL(t.url).setRel(t.rel||null).setTarget(t.target||null).setTitle(t.title||null)}sanitizeUrl(t){t=Q$2(t);try{const e=new URL(Q$2(t));if(!w$3.has(e.protocol))return "about:blank"}catch(e){return t}return t}exportJSON(){return {...super.exportJSON(),rel:this.getRel(),target:this.getTarget(),title:this.getTitle(),url:this.getURL()}}getURL(){return this.getLatest().__url}setURL(t){const e=this.getWritable();return e.__url=t,e}getTarget(){return this.getLatest().__target}setTarget(t){const e=this.getWritable();return e.__target=t,e}getRel(){return this.getLatest().__rel}setRel(t){const e=this.getWritable();return e.__rel=t,e}getTitle(){return this.getLatest().__title}setTitle(t){const e=this.getWritable();return e.__title=t,e}insertNewAfter(t,e=true){const n=K$3(this.__url,{rel:this.__rel,target:this.__target,title:this.__title});return this.insertAfter(n,e),n}canInsertTextBefore(){return  false}canInsertTextAfter(){return  false}canBeEmpty(){return  false}isInline(){return  true}extractWithChild(t,e,n){if(!wr(e))return  false;const r=e.anchor.getNode(),i=e.focus.getNode();return this.isParentOf(r)&&this.isParentOf(i)&&e.getTextContent().length>0}isEmailURI(){return this.__url.startsWith("mailto:")}isWebSiteURI(){return this.__url.startsWith("https://")||this.__url.startsWith("http://")}};function W$3(t){let n=null;if(Os(t)){const e=t.textContent;(null!==e&&""!==e||t.children.length>0)&&(n=K$3(t.getAttribute("href")||"",{rel:t.getAttribute("rel"),target:t.getAttribute("target"),title:t.getAttribute("title")}));}return {node:n}}function K$3(t="",e){return Ss(new E$3(t,e))}function B$2(t){return t instanceof E$3}let $$2 = class $ extends E$3{__isUnlinked;constructor(t="",e={},n){super(t,e,n),this.__isUnlinked=void 0!==e.isUnlinked&&null!==e.isUnlinked&&e.isUnlinked;}static getType(){return "autolink"}static clone(t){return new $(t.__url,{isUnlinked:t.__isUnlinked,rel:t.__rel,target:t.__target,title:t.__title},t.__key)}getIsUnlinked(){return this.__isUnlinked}setIsUnlinked(t){const e=this.getWritable();return e.__isUnlinked=t,e}createDOM(t){return this.__isUnlinked?document.createElement("span"):super.createDOM(t)}updateDOM(t,e,n){return super.updateDOM(t,e,n)||t.__isUnlinked!==this.__isUnlinked}static importJSON(t){return z$2().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setIsUnlinked(t.isUnlinked||false)}static importDOM(){return null}exportJSON(){return {...super.exportJSON(),isUnlinked:this.__isUnlinked}}insertNewAfter(t,e=true){const n=z$2(this.__url,{isUnlinked:this.__isUnlinked,rel:this.__rel,target:this.__target,title:this.__title});return this.insertAfter(n,e),n}};function z$2(t="",e){return Ss(new $$2(t,e))}function H$1(t){return t instanceof $$2}function G$2(t,e){if("element"===t.type){const n=t.getNode();Pi(n)||function(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);throw n.search=r.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}(252);return n.getChildren()[t.offset+e]||null}return null}function Z$1(t,e={}){let r;if(t&&"object"==typeof t){const{url:n,...i}=t;r=n,e={...i,...e};}else r=t;const{target:i,title:s}=e,l=void 0===e.rel?"noreferrer":e.rel,o=$r();if(null===o||!wr(o)&&!Or(o))return;if(Or(o)){const t=o.getNodes();if(0===t.length)return;return void t.forEach(t=>{if(null===r){const e=qs(t,t=>!H$1(t)&&B$2(t));e&&(e.insertBefore(t),0===e.getChildren().length&&e.remove());}else {const e=qs(t,t=>!H$1(t)&&B$2(t));if(e)e.setURL(r),void 0!==i&&e.setTarget(i),void 0!==l&&e.setRel(l);else {const e=K$3(r,{rel:l,target:i});t.insertBefore(e),e.append(t);}}})}if(o.isCollapsed()&&null===r)for(const t of o.getNodes()){const e=qs(t,t=>!H$1(t)&&B$2(t));return void(null!==e&&(e.getChildren().forEach(t=>{e.insertBefore(t);}),e.remove()))}const a=o.extract();if(null===r){const t=new Set;return void a.forEach(e=>{const r=qs(e,t=>!H$1(t)&&B$2(t));if(null!==r){const e=r.getKey();if(t.has(e))return;!function(t,e){const n=new Set(e.filter(e=>t.isParentOf(e)).map(t=>t.getKey())),r=t.getChildren(),i=r=>n.has(r.getKey())||Pi(r)&&e.some(e=>t.isParentOf(e)&&r.isParentOf(e)),s=r.filter(i);if(s.length===r.length)return r.forEach(e=>t.insertBefore(e)),void t.remove();const l=r.findIndex(i),o=r.findLastIndex(i),u=0===l,a=o===r.length-1;if(u)s.forEach(e=>t.insertBefore(e));else if(a)for(let e=s.length-1;e>=0;e--)t.insertAfter(s[e]);else {for(let e=s.length-1;e>=0;e--)t.insertAfter(s[e]);const e=r.slice(o+1);if(e.length>0){const n=K$3(t.getURL(),{rel:t.getRel(),target:t.getTarget(),title:t.getTitle()});s[s.length-1].insertAfter(n),e.forEach(t=>n.append(t));}}}(r,a),t.add(e);}})}const p=new Set,_=t=>{p.has(t.getKey())||(p.add(t.getKey()),t.setURL(r),void 0!==i&&t.setTarget(i),void 0!==l&&t.setRel(l),void 0!==s&&t.setTitle(s));};if(1===a.length){const t=a[0],e=qs(t,B$2);if(null!==e)return _(e)}!function(t){const e=$r();if(!wr(e))return t();const n=Ct$4(e),r=n.isBackward(),i=G$2(n.anchor,r?-1:0),s=G$2(n.focus,r?0:-1);t();if(i||s){const t=$r();if(wr(t)){const e=t.clone();if(i){const t=i.getParent();t&&e.anchor.set(t.getKey(),i.getIndexWithinParent()+(r?1:0),"element");}if(s){const t=s.getParent();t&&e.focus.set(t.getKey(),s.getIndexWithinParent()+(r?0:1),"element");}zo(Ct$4(e));}}}(()=>{let t=null;for(const e of a){if(!e.isAttached())continue;const o=qs(e,B$2);if(o){_(o);continue}if(Pi(e)){if(!e.isInline())continue;if(B$2(e)){if(!(H$1(e)||null!==t&&t.getParentOrThrow().isParentOf(e))){_(e),t=e;continue}for(const t of e.getChildren())e.insertBefore(t);e.remove();continue}}const u=e.getPreviousSibling();B$2(u)&&u.is(t)?u.append(e):(t=K$3(r,{rel:l,target:i,title:s}),e.insertAfter(t),t.append(e));}});}const q$4=/^\+?[0-9\s()-]{5,}$/;function Q$2(t){return t.match(/^[a-z][a-z0-9+.-]*:/i)||t.match(/^[/#.]/)?t:t.includes("@")?`mailto:${t}`:q$4.test(t)?`tel:${t}`:`https://${t}`}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function m$1(e,n){const t=So(n)?n.body.childNodes:n.childNodes;let l=[];const r=[];for(const n of t)if(!w$2.has(n.nodeName)){const t=y$1(n,e,r,false);null!==t&&(l=l.concat(t));}return function(e){for(const n of e)n.getNextSibling()instanceof ji&&n.insertAfter(Qn());for(const n of e){const e=n.getChildren();for(const t of e)n.insertBefore(t);n.remove();}}(r),l}function g(e,n){if("undefined"==typeof document||"undefined"==typeof window&&void 0===global.window)throw new Error("To use $generateHtmlFromNodes in headless mode please initialize a headless browser implementation such as JSDom before calling this function.");const t=document.createElement("div"),o=Io().getChildren();for(let l=0;l<o.length;l++){x$1(e,o[l],t,n);}return t.innerHTML}function x$1(t,o,l,u=null){let f=null===u||o.isSelected(u);const a=Pi(o)&&o.excludeFromCopy("html");let d=o;null!==u&&yr(o)&&(d=M$4(u,o,"clone"));const p=Pi(d)?d.getChildren():[],h=co(t,d.getType());let m;m=h&&void 0!==h.exportDOM?h.exportDOM(t,d):d.exportDOM(t);const{element:g,after:w}=m;if(!g)return  false;const y=document.createDocumentFragment();for(let e=0;e<p.length;e++){const n=p[e],l=x$1(t,n,y,u);!f&&Pi(o)&&l&&o.extractWithChild(n,u,"html")&&(f=true);}if(f&&!a){if((Ms(g)||Ps(g))&&g.append(y),l.append(g),w){const e=w.call(d,g);e&&(Ps(g)?g.replaceChildren(e):g.replaceWith(e));}}else l.append(y);return f}const w$2=new Set(["STYLE","SCRIPT"]);function y$1(e,n,o,l,i=new Map,s){let c=[];if(w$2.has(e.nodeName))return c;let m=null;const g=function(e,n){const{nodeName:t}=e,o=n._htmlConversions.get(t.toLowerCase());let l=null;if(void 0!==o)for(const n of o){const t=n(e);null!==t&&(null===l||(l.priority||0)<=(t.priority||0))&&(l=t);}return null!==l?l.conversion:null}(e,n),x=g?g(e):null;let b=null;if(null!==x){b=x.after;const n=x.node;if(m=Array.isArray(n)?n[n.length-1]:n,null!==m){for(const[,e]of i)if(m=e(m,s),!m)break;m&&c.push(...Array.isArray(n)?n:[m]);}null!=x.forChild&&i.set(e.nodeName,x.forChild);}const S=e.childNodes;let v=[];const N=(null==m||!xs(m))&&(null!=m&&Rr(m)||l);for(let e=0;e<S.length;e++)v.push(...y$1(S[e],n,o,N,new Map(i),m));return null!=b&&(v=b(v)),Fs(e)&&(v=C$1(e,v,N?()=>{const e=new ji;return o.push(e),e}:Vi)),null==m?v.length>0?c=c.concat(v):Fs(e)&&function(e){if(null==e.nextSibling||null==e.previousSibling)return  false;return Ds(e.nextSibling)&&Ds(e.previousSibling)}(e)&&(c=c.concat(Qn())):Pi(m)&&m.append(...v),c}function C$1(e,n,t){const o=e.style.textAlign,l=[];let r=[];for(let e=0;e<n.length;e++){const i=n[e];if(Rr(i))o&&!i.getFormat()&&i.setFormat(o),l.push(i);else if(r.push(i),e===n.length-1||e<n.length-1&&Rr(n[e+1])){const e=t();e.setFormat(o),e.append(...r),l.push(e),r=[];}}return l}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function v$2(t,...e){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",t);for(const t of e)o.append("v",t);throw n.search=o.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}function D$2(e,n=$r()){return null==n&&v$2(166),wr(n)&&n.isCollapsed()||0===n.getNodes().length?"":g(e,n)}function S$2(t,e=$r()){return null==e&&v$2(166),wr(e)&&e.isCollapsed()||0===e.getNodes().length?null:JSON.stringify(E$2(t,e))}function N$1(t,e){const n=t.getData("text/plain")||t.getData("text/uri-list");null!=n&&e.insertRawText(n);}function R$2(t,n,o){const r=t.getData("application/x-lexical-editor");if(r)try{const t=JSON.parse(r);if(t.namespace===o._config.namespace&&Array.isArray(t.nodes)){return A(o,L$2(t.nodes),n)}}catch(t){console.error(t);}const c=t.getData("text/html"),a=t.getData("text/plain");if(c&&a!==c)try{const t=(new DOMParser).parseFromString(function(t){if(window.trustedTypes&&window.trustedTypes.createPolicy){return window.trustedTypes.createPolicy("lexical",{createHTML:t=>t}).createHTML(t)}return t}(c),"text/html");return A(o,m$1(o,t),n)}catch(t){console.error(t);}const u=a||t.getData("text/uri-list");if(null!=u)if(wr(n)){const t=u.split(/(\r?\n|\t)/);""===t[t.length-1]&&t.pop();for(let e=0;e<t.length;e++){const n=$r();if(wr(n)){const o=t[e];"\n"===o||"\r\n"===o?n.insertParagraph():"\t"===o?n.insertNodes([Cr()]):n.insertText(o);}}}else n.insertRawText(u);}function A(t,e,n){t.dispatchCommand(ie$2,{nodes:e,selection:n})||(n.insertNodes(e),function(t){if(wr(t)&&t.isCollapsed()){const e=t.anchor;let n=null;const o=Ol(e,"previous");if(o)if(rl(o))n=o.origin;else {const t=vl(o,gl(Io(),"next").getFlipped());for(const e of t){if(yr(e.origin)){n=e.origin;break}if(Pi(e.origin)&&!e.origin.isInline())break}}if(n&&yr(n)){const e=n.getFormat(),o=n.getStyle();t.format===e&&t.style===o||(t.format=e,t.style=o,t.dirty=true);}}}(n));}function P$1(t,e,n,r=[]){let i=null===e||n.isSelected(e);const l=Pi(n)&&n.excludeFromCopy("html");let s=n;null!==e&&yr(s)&&(s=M$4(e,s,"clone"));const c=Pi(s)?s.getChildren():[],a=function(t){const e=t.exportJSON(),n=t.constructor;if(e.type!==n.getType()&&v$2(58,n.name),Pi(t)){const t=e.children;Array.isArray(t)||v$2(59,n.name);}return e}(s);yr(s)&&0===s.getTextContentSize()&&(i=false);for(let o=0;o<c.length;o++){const r=c[o],l=P$1(t,e,r,a.children);!i&&Pi(n)&&l&&n.extractWithChild(r,e,"clone")&&(i=true);}if(i&&!l)r.push(a);else if(Array.isArray(a.children))for(let t=0;t<a.children.length;t++){const e=a.children[t];r.push(e);}return i}function E$2(t,e){const n=[],o=Io().getChildren();for(let r=0;r<o.length;r++){P$1(t,e,o[r],n);}return {namespace:t._config.namespace,nodes:n}}function L$2(t){const e=[];for(let o=0;o<t.length;o++){const r=t[o],i=Si(r);yr(i)&&$$4(i),e.push(i);}return e}let b$2=null;async function F$1(t,e,n){if(null!==b$2)return  false;if(null!==e)return new Promise((o,r)=>{t.update(()=>{o(M$3(t,e,n));});});const o=t.getRootElement(),i=t._window||window,l=i.document,s=bs(i);if(null===o||null===s)return  false;const c=l.createElement("span");c.style.cssText="position: fixed; top: -1000px;",c.append(l.createTextNode("#")),o.append(c);const a=new Range;return a.setStart(c,0),a.setEnd(c,1),s.removeAllRanges(),s.addRange(a),new Promise((e,o)=>{const s=t.registerCommand(Je$2,o=>(At$5(o,ClipboardEvent)&&(s(),null!==b$2&&(i.clearTimeout(b$2),b$2=null),e(M$3(t,o,n))),true),Qi);b$2=i.setTimeout(()=>{s(),b$2=null,e(false);},50),l.execCommand("copy"),c.remove();})}function M$3(t,e,n){if(void 0===n){const e=bs(t._window),o=$r();if(!o||o.isCollapsed())return  false;if(!e)return  false;const r=e.anchorNode,l=e.focusNode;if(null!==r&&null!==l&&!ho(t,r,l))return  false;n=_$1(o);}e.preventDefault();const o=e.clipboardData;return null!==o&&(J$1(o,n),true)}const O=[["text/html",D$2],["application/x-lexical-editor",S$2]];function _$1(t=$r()){const e={"text/plain":t?t.getTextContent():""};if(t){const n=Is();for(const[o,r]of O){const i=r(n,t);null!==i&&(e[o]=i);}}return e}function J$1(t,e){for(const[n]of O) void 0===e[n]&&t.setData(n,"");for(const n in e){const o=e[n];void 0!==o&&t.setData(n,o);}}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function s(e){const t=window.location.origin,n=n=>{if(n.origin!==t)return;const o=e.getRootElement();if(document.activeElement!==o)return;const s=n.data;if("string"==typeof s){let t;try{t=JSON.parse(s);}catch(e){return}if(t&&"nuanria_messaging"===t.protocol&&"request"===t.type){const o=t.payload;if(o&&"makeChanges"===o.functionId){const t=o.args;if(t){const[o,s,d,c,g]=t;e.update(()=>{const e=$r();if(wr(e)){const t=e.anchor;let i=t.getNode(),a=0,l=0;if(yr(i)&&o>=0&&s>=0&&(a=o,l=o+s,e.setTextNodeRange(i,a,i,l)),a===l&&""===d||(e.insertRawText(d),i=t.getNode()),yr(i)){a=c,l=c+g;const t=i.getTextContentSize();a=a>t?t:a,l=l>t?t:l,e.setTextNodeRange(i,a,i,l);}n.stopImmediatePropagation();}});}}}}};return window.addEventListener("message",n,true),()=>{window.removeEventListener("message",n,true);}}const d=Yl({build:(e,n,o)=>pt$4(n),config:Gl({disabled:"undefined"==typeof window}),name:"@lexical/dragon",register:(t,n,o)=>gt$3(()=>o.getOutput().disabled.value?void 0:s(t))});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const L$1="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,S$1=L$1&&"documentMode"in document?document.documentMode:null,W$2=L$1&&/Mac|iPod|iPhone|iPad/.test(navigator.platform),B$1=!(!L$1||!("InputEvent"in window)||S$1)&&"getTargetRanges"in new window.InputEvent("input"),I$1=L$1&&/Version\/[\d.]+.*Safari/.test(navigator.userAgent),R$1=L$1&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,V$2=L$1&&/^(?=.*Chrome).*/i.test(navigator.userAgent),j$1=L$1&&/AppleWebKit\/[\d.]+/.test(navigator.userAgent)&&W$2&&!V$2;function q$3(e,n){n.update(()=>{if(null!==e){const r=At$5(e,KeyboardEvent)?null:e.clipboardData,o=$r();if(null!==o&&!o.isCollapsed()&&null!=r){e.preventDefault();const i=D$2(n);null!==i&&r.setData("text/html",i),r.setData("text/plain",o.getTextContent());}}});}function z$1(t){return ec(t.registerCommand(ue$2,e=>{const t=$r();return !!wr(t)&&(t.deleteCharacter(e),true)},qi),t.registerCommand(pe$2,e=>{const t=$r();return !!wr(t)&&(t.deleteWord(e),true)},qi),t.registerCommand(ye$1,e=>{const t=$r();return !!wr(t)&&(t.deleteLine(e),true)},qi),t.registerCommand(he$2,t=>{const n=$r();if(!wr(n))return  false;if("string"==typeof t)n.insertText(t);else {const r=t.dataTransfer;if(null!=r)N$1(r,n);else {const e=t.data;e&&n.insertText(e);}}return  true},qi),t.registerCommand(_e$1,()=>{const e=$r();return !!wr(e)&&(e.removeText(),true)},qi),t.registerCommand(fe$2,e=>{const t=$r();return !!wr(t)&&(t.insertLineBreak(e),true)},qi),t.registerCommand(de$2,()=>{const e=$r();return !!wr(e)&&(e.insertLineBreak(),true)},qi),t.registerCommand(ke$3,e=>{const t=$r();if(!wr(t))return  false;const n=e,i=n.shiftKey;return !!Z$4(t,true)&&(n.preventDefault(),ne$2(t,i,true),true)},qi),t.registerCommand(ve$1,e=>{const t=$r();if(!wr(t))return  false;const n=e,i=n.shiftKey;return !!Z$4(t,false)&&(n.preventDefault(),ne$2(t,i,false),true)},qi),t.registerCommand(Me$2,e=>{const n=$r();return !!wr(n)&&((!R$1||"ko-KR"!==navigator.language)&&(e.preventDefault(),t.dispatchCommand(ue$2,true)))},qi),t.registerCommand(Pe$2,e=>{const n=$r();return !!wr(n)&&(e.preventDefault(),t.dispatchCommand(ue$2,false))},qi),t.registerCommand(Ee$2,e=>{const n=$r();if(!wr(n))return  false;if(null!==e){if((R$1||I$1||j$1)&&B$1)return  false;e.preventDefault();}return t.dispatchCommand(fe$2,false)},qi),t.registerCommand(Ue$2,()=>(ts(),true),qi),t.registerCommand(Je$2,e=>{const n=$r();return !!wr(n)&&(q$3(e,t),true)},qi),t.registerCommand(je$1,e=>{const n=$r();return !!wr(n)&&(function(e,t){q$3(e,t),t.update(()=>{const e=$r();wr(e)&&e.removeText();});}(e,t),true)},qi),t.registerCommand(ge$2,n=>{const r=$r();return !!wr(r)&&(function(t,n){t.preventDefault(),n.update(()=>{const n=$r(),r=At$5(t,ClipboardEvent)?t.clipboardData:null;null!=r&&wr(n)&&N$1(r,n);},{tag:Jn});}(n,t),true)},qi),t.registerCommand(Ke$2,e=>{const t=$r();return !!wr(t)&&(e.preventDefault(),true)},qi),t.registerCommand(Re$1,e=>{const t=$r();return !!wr(t)&&(e.preventDefault(),true)},qi))}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function pt$3(t,e){if(void 0!==document.caretRangeFromPoint){const n=document.caretRangeFromPoint(t,e);return null===n?null:{node:n.startContainer,offset:n.startOffset}}if("undefined"!==document.caretPositionFromPoint){const n=document.caretPositionFromPoint(t,e);return null===n?null:{node:n.offsetNode,offset:n.offset}}return null}const ht$2="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,vt$3=ht$2&&"documentMode"in document?document.documentMode:null,Ct$2=ht$2&&/Mac|iPod|iPhone|iPad/.test(navigator.platform),yt=!(!ht$2||!("InputEvent"in window)||vt$3)&&"getTargetRanges"in new window.InputEvent("input"),xt$2=ht$2&&/Version\/[\d.]+.*Safari/.test(navigator.userAgent),Dt$2=ht$2&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,Nt$2=ht$2&&/^(?=.*Chrome).*/i.test(navigator.userAgent),wt$3=ht$2&&/AppleWebKit\/[\d.]+/.test(navigator.userAgent)&&Ct$2&&!Nt$2,Et$2=ne$3("DRAG_DROP_PASTE_FILE");let _t$2 = class _t extends Ai{static getType(){return "quote"}static clone(t){return new _t(t.__key)}createDOM(t){const e=document.createElement("blockquote");return Zl(e,t.theme.quote),e}updateDOM(t,e){return  false}static importDOM(){return {blockquote:t=>({conversion:St$2,priority:0})}}exportDOM(t){const{element:e}=super.exportDOM(t);if(Ms(e)){this.isEmpty()&&e.append(document.createElement("br"));const t=this.getFormatType();t&&(e.style.textAlign=t);const n=this.getDirection();n&&(e.dir=n);}return {element:e}}static importJSON(t){return Ot$3().updateFromJSON(t)}insertNewAfter(t,e){const n=Vi(),r=this.getDirection();return n.setDirection(r),this.insertAfter(n,e),n}collapseAtStart(){const t=Vi();return this.getChildren().forEach(e=>t.append(e)),this.replace(t),true}canMergeWhenEmpty(){return  true}};function Ot$3(){return Ss(new _t$2)}function Pt$3(t){return t instanceof _t$2}let Tt$2 = class Tt extends Ai{__tag;static getType(){return "heading"}static clone(t){return new Tt(t.__tag,t.__key)}constructor(t,e){super(e),this.__tag=t;}getTag(){return this.__tag}setTag(t){const e=this.getWritable();return this.__tag=t,e}createDOM(t){const e=this.__tag,n=document.createElement(e),r=t.theme.heading;if(void 0!==r){const t=r[e];Zl(n,t);}return n}updateDOM(t,e,n){return t.__tag!==this.__tag}static importDOM(){return {h1:t=>({conversion:At$3,priority:0}),h2:t=>({conversion:At$3,priority:0}),h3:t=>({conversion:At$3,priority:0}),h4:t=>({conversion:At$3,priority:0}),h5:t=>({conversion:At$3,priority:0}),h6:t=>({conversion:At$3,priority:0}),p:t=>{const e=t.firstChild;return null!==e&&Ft$2(e)?{conversion:()=>({node:null}),priority:3}:null},span:t=>Ft$2(t)?{conversion:t=>({node:Mt$2("h1")}),priority:3}:null}}exportDOM(t){const{element:e}=super.exportDOM(t);if(Ms(e)){this.isEmpty()&&e.append(document.createElement("br"));const t=this.getFormatType();t&&(e.style.textAlign=t);const n=this.getDirection();n&&(e.dir=n);}return {element:e}}static importJSON(t){return Mt$2(t.tag).updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setTag(t.tag)}exportJSON(){return {...super.exportJSON(),tag:this.getTag()}}insertNewAfter(t,e=true){const n=t?t.anchor.offset:0,r=this.getLastDescendant(),o=!r||t&&t.anchor.key===r.getKey()&&n===r.getTextContentSize()||!t?Vi():Mt$2(this.getTag()),i=this.getDirection();if(o.setDirection(i),this.insertAfter(o,e),0===n&&!this.isEmpty()&&t){const t=Vi();t.select(),this.replace(t,true);}return o}collapseAtStart(){const t=this.isEmpty()?Vi():Mt$2(this.getTag());return this.getChildren().forEach(e=>t.append(e)),this.replace(t),true}extractWithChild(){return  true}};function Ft$2(t){return "span"===t.nodeName.toLowerCase()&&"26pt"===t.style.fontSize}function At$3(t){const e=t.nodeName.toLowerCase();let n=null;return "h1"!==e&&"h2"!==e&&"h3"!==e&&"h4"!==e&&"h5"!==e&&"h6"!==e||(n=Mt$2(e),null!==t.style&&(Js(t,n),n.setFormat(t.style.textAlign))),{node:n}}function St$2(t){const e=Ot$3();return null!==t.style&&(e.setFormat(t.style.textAlign),Js(t,e)),{node:e}}function Mt$2(t="h1"){return Ss(new Tt$2(t))}function It$2(t){return t instanceof Tt$2}function bt$3(t){let e=null;if(At$5(t,DragEvent)?e=t.dataTransfer:At$5(t,ClipboardEvent)&&(e=t.clipboardData),null===e)return [false,[],false];const n=e.types,r=n.includes("Files"),o=n.includes("text/html")||n.includes("text/plain");return [r,Array.from(e.files),o]}function Kt$2(t){const e=Do(t);return Li(e)}function kt$3(t){for(const e of ["lowercase","uppercase","capitalize"])t.hasFormat(e)&&t.toggleFormat(e);}function Jt$2(n){return ec(n.registerCommand(oe$4,t=>{const e=$r();return !!Or(e)&&(e.clear(),true)},qi),n.registerCommand(ue$2,t=>{const e=$r();return wr(e)?(e.deleteCharacter(t),true):!!Or(e)&&(e.deleteNodes(),true)},qi),n.registerCommand(pe$2,t=>{const e=$r();return !!wr(e)&&(e.deleteWord(t),true)},qi),n.registerCommand(ye$1,t=>{const e=$r();return !!wr(e)&&(e.deleteLine(t),true)},qi),n.registerCommand(he$2,e=>{const r=$r();if("string"==typeof e)null!==r&&r.insertText(e);else {if(null===r)return  false;const o=e.dataTransfer;if(null!=o)R$2(o,r,n);else if(wr(r)){const t=e.data;return t&&r.insertText(t),true}}return  true},qi),n.registerCommand(_e$1,()=>{const t=$r();return !!wr(t)&&(t.removeText(),true)},qi),n.registerCommand(me$2,t=>{const e=$r();return !!wr(e)&&(e.formatText(t),true)},qi),n.registerCommand(ze$2,t=>{const e=$r();if(!wr(e)&&!Or(e))return  false;const n=e.getNodes();for(const e of n){const n=qs(e,t=>Pi(t)&&!t.isInline());null!==n&&n.setFormat(t);}return  true},qi),n.registerCommand(fe$2,t=>{const e=$r();return !!wr(e)&&(e.insertLineBreak(t),true)},qi),n.registerCommand(de$2,()=>{const t=$r();return !!wr(t)&&(t.insertParagraph(),true)},qi),n.registerCommand(Fe$2,()=>{const t=Cr(),e=$r();return wr(e)&&(t.setFormat(e.format),t.setStyle(e.style)),ti([t]),true},qi),n.registerCommand(Le$3,()=>bt$4(t=>{const e=t.getIndent();t.setIndent(e+1);}),qi),n.registerCommand(Ie$2,()=>bt$4(t=>{const e=t.getIndent();e>0&&t.setIndent(Math.max(0,e-1));}),qi),n.registerCommand(be$2,t=>{const e=$r();if(Or(e)){const n=e.getNodes();if(n.length>0)return t.preventDefault(),n[0].selectPrevious(),true}else if(wr(e)){const n=os(e.focus,true);if(!t.shiftKey&&Li(n)&&!n.isIsolated()&&!n.isInline())return n.selectPrevious(),t.preventDefault(),true}return  false},qi),n.registerCommand(we$1,t=>{const e=$r();if(Or(e)){const n=e.getNodes();if(n.length>0)return t.preventDefault(),n[0].selectNext(0,0),true}else if(wr(e)){if(function(t){const e=t.focus;return "root"===e.key&&e.offset===Io().getChildrenSize()}(e))return t.preventDefault(),true;const n=os(e.focus,false);if(!t.shiftKey&&Li(n)&&!n.isIsolated()&&!n.isInline())return n.selectNext(),t.preventDefault(),true}return  false},qi),n.registerCommand(ke$3,t=>{const e=$r();if(Or(e)){const n=e.getNodes();if(n.length>0)return t.preventDefault(),A$1(n[0])?n[0].selectNext(0,0):n[0].selectPrevious(),true}if(!wr(e))return  false;if(Z$4(e,true)){const n=t.shiftKey;return t.preventDefault(),ne$2(e,n,true),true}return  false},qi),n.registerCommand(ve$1,t=>{const e=$r();if(Or(e)){const n=e.getNodes();if(n.length>0)return t.preventDefault(),A$1(n[0])?n[0].selectPrevious():n[0].selectNext(0,0),true}if(!wr(e))return  false;const n=t.shiftKey;return !!Z$4(e,false)&&(t.preventDefault(),ne$2(e,n,false),true)},qi),n.registerCommand(Me$2,t=>{if(Kt$2(t.target))return  false;const e=$r();if(wr(e)){if(function(t){if(!t.isCollapsed())return  false;const{anchor:e}=t;if(0!==e.offset)return  false;const n=e.getNode();if(Ki(n))return  false;const r=yt$1(n);return r.getIndent()>0&&(r.is(n)||n.is(r.getFirstDescendant()))}(e))return t.preventDefault(),n.dispatchCommand(Ie$2,void 0);if(Dt$2&&"ko-KR"===navigator.language)return  false}else if(!Or(e))return  false;return t.preventDefault(),n.dispatchCommand(ue$2,true)},qi),n.registerCommand(Pe$2,t=>{if(Kt$2(t.target))return  false;const e=$r();return !(!wr(e)&&!Or(e))&&(t.preventDefault(),n.dispatchCommand(ue$2,false))},qi),n.registerCommand(Ee$2,t=>{const e=$r();if(!wr(e))return  false;if(kt$3(e),null!==t){if((Dt$2||xt$2||wt$3)&&yt)return  false;if(t.preventDefault(),t.shiftKey)return n.dispatchCommand(fe$2,false)}return n.dispatchCommand(de$2,void 0)},qi),n.registerCommand(Ae$2,()=>{const t=$r();return !!wr(t)&&(n.blur(),true)},qi),n.registerCommand(Ke$2,t=>{const[,e]=bt$3(t);if(e.length>0){const r=pt$3(t.clientX,t.clientY);if(null!==r){const{offset:t,node:o}=r,i=Do(o);if(null!==i){const e=Wr();if(yr(i))e.anchor.set(i.getKey(),t,"text"),e.focus.set(i.getKey(),t,"text");else {const t=i.getParentOrThrow().getKey(),n=i.getIndexWithinParent()+1;e.anchor.set(t,n,"element"),e.focus.set(t,n,"element");}const n=Ct$4(e);zo(n);}n.dispatchCommand(Et$2,e);}return t.preventDefault(),true}const r=$r();return !!wr(r)},qi),n.registerCommand(Re$1,t=>{const[e]=bt$3(t),n=$r();return !(e&&!wr(n))},qi),n.registerCommand(Be$2,t=>{const[e]=bt$3(t),n=$r();if(e&&!wr(n))return  false;const r=pt$3(t.clientX,t.clientY);if(null!==r){const e=Do(r.node);Li(e)&&t.preventDefault();}return  true},qi),n.registerCommand(Ue$2,()=>(ts(),true),qi),n.registerCommand(Je$2,t=>(F$1(n,At$5(t,ClipboardEvent)?t:null),true),qi),n.registerCommand(je$1,t=>(async function(t,n){await F$1(n,At$5(t,ClipboardEvent)?t:null),n.update(()=>{const t=$r();wr(t)?t.removeText():Or(t)&&t.getNodes().forEach(t=>t.remove());});}(t,n),true),qi),n.registerCommand(ge$2,e=>{const[,r,o]=bt$3(e);if(r.length>0&&!o)return n.dispatchCommand(Et$2,r),true;if(As(e.target)&&fo(e.target))return  false;return null!==$r()&&(function(e,n){e.preventDefault(),n.update(()=>{const r=$r(),o=At$5(e,InputEvent)||At$5(e,KeyboardEvent)?null:e.clipboardData;null!=o&&null!==r&&R$2(o,r,n);},{tag:Jn});}(e,n),true)},qi),n.registerCommand(Oe$2,t=>{const e=$r();return wr(e)&&kt$3(e),false},qi),n.registerCommand(De$2,t=>{const e=$r();return wr(e)&&kt$3(e),false},qi))}const Wt$2=Yl({conflictsWith:["@lexical/plain-text"],dependencies:[d],name:"@lexical/rich-text",nodes:()=>[Tt$2,_t$2],register:Jt$2});

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

}(Prism$1));

Prism$1.languages.c = Prism$1.languages.extend('clike', {
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

Prism$1.languages.insertBefore('c', 'string', {
	'char': {
		// https://en.cppreference.com/w/c/language/character_constant
		pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,
		greedy: true
	}
});

Prism$1.languages.insertBefore('c', 'string', {
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
				Prism$1.languages.c['string']
			],
			'char': Prism$1.languages.c['char'],
			'comment': Prism$1.languages.c['comment'],
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
				inside: Prism$1.languages.c
			}
		}
	}
});

Prism$1.languages.insertBefore('c', 'function', {
	// highlight predefined macros as constants
	'constant': /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/
});

delete Prism$1.languages.c['boolean'];

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

Prism$1.languages.objectivec = Prism$1.languages.extend('c', {
	'string': {
		pattern: /@?"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
		greedy: true
	},
	'keyword': /\b(?:asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|in|inline|int|long|register|return|self|short|signed|sizeof|static|struct|super|switch|typedef|typeof|union|unsigned|void|volatile|while)\b|(?:@interface|@end|@implementation|@protocol|@class|@public|@protected|@private|@property|@try|@catch|@finally|@throw|@synthesize|@dynamic|@selector)\b/,
	'operator': /-[->]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|\|?|[~^%?*\/@]/
});

delete Prism$1.languages.objectivec['class-name'];

Prism$1.languages.objc = Prism$1.languages.objectivec;

Prism$1.languages.sql = {
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

}(Prism$1));

var prismPython = {};

var hasRequiredPrismPython;

function requirePrismPython () {
	if (hasRequiredPrismPython) return prismPython;
	hasRequiredPrismPython = 1;
	Prism$1.languages.python = {
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

	Prism$1.languages.python['string-interpolation'].inside['interpolation'].inside.rest = Prism$1.languages.python;

	Prism$1.languages.py = Prism$1.languages.python;
	return prismPython;
}

requirePrismPython();

var prismRust = {};

var hasRequiredPrismRust;

function requirePrismRust () {
	if (hasRequiredPrismRust) return prismRust;
	hasRequiredPrismRust = 1;
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

	}(Prism$1));
	return prismRust;
}

requirePrismRust();

Prism$1.languages.swift = {
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

Prism$1.languages.swift['string-literal'].forEach(function (rule) {
	rule.inside['interpolation'].inside = Prism$1.languages.swift;
});

var prismTypescript = {};

var hasRequiredPrismTypescript;

function requirePrismTypescript () {
	if (hasRequiredPrismTypescript) return prismTypescript;
	hasRequiredPrismTypescript = 1;
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

	}(Prism$1));
	return prismTypescript;
}

requirePrismTypescript();

var prismJava = {};

var hasRequiredPrismJava;

function requirePrismJava () {
	if (hasRequiredPrismJava) return prismJava;
	hasRequiredPrismJava = 1;
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
	}(Prism$1));
	return prismJava;
}

requirePrismJava();

var prismCpp = {};

var hasRequiredPrismCpp;

function requirePrismCpp () {
	if (hasRequiredPrismCpp) return prismCpp;
	hasRequiredPrismCpp = 1;
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

	}(Prism$1));
	return prismCpp;
}

requirePrismCpp();

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function K$2(t,...e){const n=new URL("https://lexical.dev/docs/error"),r=new URLSearchParams;r.append("code",t);for(const t of e)r.append("v",t);throw n.search=r.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}const M$2="javascript";function R(e,n){for(const r of e.childNodes){if(Ms(r)&&r.tagName===n)return  true;R(r,n);}return  false}const $$1="data-language",W$1="data-highlight-language",q$2="data-theme";let U$1 = class U extends Ai{__language;__theme;__isSyntaxHighlightSupported;static getType(){return "code"}static clone(t){return new U(t.__language,t.__key)}constructor(t,e){super(e),this.__language=t||void 0,this.__isSyntaxHighlightSupported=false,this.__theme=void 0;}afterCloneFrom(t){super.afterCloneFrom(t),this.__language=t.__language,this.__theme=t.__theme,this.__isSyntaxHighlightSupported=t.__isSyntaxHighlightSupported;}createDOM(t){const n=document.createElement("code");Zl(n,t.theme.code),n.setAttribute("spellcheck","false");const r=this.getLanguage();r&&(n.setAttribute($$1,r),this.getIsSyntaxHighlightSupported()&&n.setAttribute(W$1,r));const i=this.getTheme();i&&n.setAttribute(q$2,i);const o=this.getStyle();return o&&n.setAttribute("style",o),n}updateDOM(t,e,n){const r=this.__language,i=t.__language;r?r!==i&&e.setAttribute($$1,r):i&&e.removeAttribute($$1);const o=this.__isSyntaxHighlightSupported;t.__isSyntaxHighlightSupported&&i?o&&r?r!==i&&e.setAttribute(W$1,r):e.removeAttribute(W$1):o&&r&&e.setAttribute(W$1,r);const s=this.__theme,l=t.__theme;s?s!==l&&e.setAttribute(q$2,s):l&&e.removeAttribute(q$2);const u=this.__style,c=t.__style;return u?u!==c&&e.setAttribute("style",u):c&&e.removeAttribute("style"),false}exportDOM(t){const n=document.createElement("pre");Zl(n,t._config.theme.code),n.setAttribute("spellcheck","false");const r=this.getLanguage();r&&(n.setAttribute($$1,r),this.getIsSyntaxHighlightSupported()&&n.setAttribute(W$1,r));const i=this.getTheme();i&&n.setAttribute(q$2,i);const o=this.getStyle();return o&&n.setAttribute("style",o),{element:n}}static importDOM(){return {code:t=>null!=t.textContent&&(/\r?\n/.test(t.textContent)||R(t,"BR"))?{conversion:G$1,priority:1}:null,div:()=>({conversion:V$1,priority:1}),pre:()=>({conversion:G$1,priority:0}),table:t=>et$1(t)?{conversion:Y,priority:3}:null,td:t=>{const e=t,n=e.closest("table");return e.classList.contains("js-file-line")||n&&et$1(n)?{conversion:Z,priority:3}:null},tr:t=>{const e=t.closest("table");return e&&et$1(e)?{conversion:Z,priority:3}:null}}}static importJSON(t){return X$1().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setLanguage(t.language).setTheme(t.theme)}exportJSON(){return {...super.exportJSON(),language:this.getLanguage(),theme:this.getTheme()}}insertNewAfter(t,e=true){const n=this.getChildren(),r=n.length;if(r>=2&&"\n"===n[r-1].getTextContent()&&"\n"===n[r-2].getTextContent()&&t.isCollapsed()&&t.anchor.key===this.__key&&t.anchor.offset===r){n[r-1].remove(),n[r-2].remove();const t=Vi();return this.insertAfter(t,e),t}const{anchor:i,focus:o}=t,a=(i.isBefore(o)?i:o).getNode();if(yr(a)){let t=lt(a);const e=[];for(;;)if(Sr(t))e.push(Cr()),t=t.getNextSibling();else {if(!ot(t))break;{let n=0;const r=t.getTextContent(),i=t.getTextContentSize();for(;n<i&&" "===r[n];)n++;if(0!==n&&e.push(it(" ".repeat(n))),n!==i)break;t=t.getNextSibling();}}const n=a.splitText(i.offset)[0],r=0===i.offset?0:1,o=n.getIndexWithinParent()+r,s=a.getParentOrThrow(),l=[Qn(),...e];s.splice(o,0,l);const f=e[e.length-1];f?f.select():0===i.offset?n.selectPrevious():n.getNextSibling().selectNext(0,0);}if(Q$1(a)){const{offset:e}=t.anchor;a.splice(e,0,[Qn()]),a.select(e+1,e+1);}return null}canIndent(){return  false}collapseAtStart(){const t=Vi();return this.getChildren().forEach(e=>t.append(e)),this.replace(t),true}setLanguage(t){const e=this.getWritable();return e.__language=t||void 0,e}getLanguage(){return this.getLatest().__language}setIsSyntaxHighlightSupported(t){const e=this.getWritable();return e.__isSyntaxHighlightSupported=t,e}getIsSyntaxHighlightSupported(){return this.getLatest().__isSyntaxHighlightSupported}setTheme(t){const e=this.getWritable();return e.__theme=t||void 0,e}getTheme(){return this.getLatest().__theme}};function X$1(t,e){return Ys(U$1).setLanguage(t).setTheme(e)}function Q$1(t){return t instanceof U$1}function G$1(t){return {node:X$1(t.getAttribute($$1))}}function V$1(t){const e=t,n=tt(e);return n||function(t){let e=t.parentElement;for(;null!==e;){if(tt(e))return  true;e=e.parentElement;}return  false}(e)?{node:n?X$1():null}:{node:null}}function Y(){return {node:X$1()}}function Z(){return {node:null}}function tt(t){return null!==t.style.fontFamily.match("monospace")}function et$1(t){return t.classList.contains("js-file-line-container")}let nt$1 = class nt extends lr{__highlightType;constructor(t="",e,n){super(t,n),this.__highlightType=e;}static getType(){return "code-highlight"}static clone(t){return new nt(t.__text,t.__highlightType||void 0,t.__key)}getHighlightType(){return this.getLatest().__highlightType}setHighlightType(t){const e=this.getWritable();return e.__highlightType=t||void 0,e}canHaveFormat(){return  false}createDOM(t){const n=super.createDOM(t),r=rt$2(t.theme,this.__highlightType);return Zl(n,r),n}updateDOM(t,r,i){const o=super.updateDOM(t,r,i),s=rt$2(i.theme,t.__highlightType),l=rt$2(i.theme,this.__highlightType);return s!==l&&(s&&tc(r,s),l&&Zl(r,l)),o}static importJSON(t){return it().updateFromJSON(t)}updateFromJSON(t){return super.updateFromJSON(t).setHighlightType(t.highlightType)}exportJSON(){return {...super.exportJSON(),highlightType:this.getHighlightType()}}setFormat(t){return this}isParentRequired(){return  true}createParentElementNode(){return X$1()}};function rt$2(t,e){return e&&t&&t.codeHighlight&&t.codeHighlight[e]}function it(t="",e){return Ss(new nt$1(t,e))}function ot(t){return t instanceof nt$1}function st$1(t,e){let n=t;for(let i=ul(t,e);i&&(ot(i.origin)||Sr(i.origin));i=ut$3(i))n=i.origin;return n}function lt(t){return st$1(t,"previous")}function ut$1(t){return st$1(t,"next")}function ct$1(t){const e=lt(t),n=ut$1(t);let r=e;for(;null!==r;){if(ot(r)){const t=yo(r.getTextContent());if(null!==t)return t}if(r===n)break;r=r.getNextSibling();}const i=e.getParent();if(Pi(i)){const t=i.getDirection();if("ltr"===t||"rtl"===t)return t}return null}function gt$2(t,e){let n=null,r=null,i=t,o=e,s=t.getTextContent();for(;;){if(0===o){if(i=i.getPreviousSibling(),null===i)break;if(ot(i)||Sr(i)||Zn(i)||K$2(167),Zn(i)){n={node:i,offset:1};break}o=Math.max(0,i.getTextContentSize()-1),s=i.getTextContent();}else o--;const t=s[o];ot(i)&&" "!==t&&(r={node:i,offset:o});}if(null!==r)return r;let l=null;if(e<t.getTextContentSize())ot(t)&&(l=t.getTextContent()[e]);else {const e=t.getNextSibling();ot(e)&&(l=e.getTextContent()[0]);}if(null!==l&&" "!==l)return n;{const r=function(t,e){let n=t,r=e,i=t.getTextContent(),o=t.getTextContentSize();for(;;){if(!ot(n)||r===o){if(n=n.getNextSibling(),null===n||Zn(n))return null;ot(n)&&(r=0,i=n.getTextContent(),o=n.getTextContentSize());}if(ot(n)){if(" "!==i[r])return {node:n,offset:r};r++;}}}(t,e);return null!==r?r:n}}function at$1(t){const e=ut$1(t);return Zn(e)&&K$2(168),e}!function(t){t.languages.diff={coord:[/^(?:\*{3}|-{3}|\+{3}).*$/m,/^@@.*@@$/m,/^\d.*$/m]};var e={"deleted-sign":"-","deleted-arrow":"<","inserted-sign":"+","inserted-arrow":">",unchanged:" ",diff:"!"};Object.keys(e).forEach(function(n){var r=e[n],i=[];/^\w+$/.test(n)||i.push(/\w+/.exec(n)[0]),"diff"===n&&i.push("bold"),t.languages.diff[n]={pattern:RegExp("^(?:["+r+"].*(?:\r\n?|\n|(?![\\s\\S])))+","m"),alias:i,inside:{line:{pattern:/(.)(?=[\s\S]).*(?:\r\n?|\n)?/,lookbehind:true},prefix:{pattern:/[\s\S]/,alias:/\w+/.exec(n)[0]}}};}),Object.defineProperty(t.languages.diff,"PREFIXES",{value:e});}(Prism);const pt$2=globalThis.Prism||window.Prism,ht$1={c:"C",clike:"C-like",cpp:"C++",css:"CSS",html:"HTML",java:"Java",js:"JavaScript",markdown:"Markdown",objc:"Objective-C",plain:"Plain Text",powershell:"PowerShell",py:"Python",rust:"Rust",sql:"SQL",swift:"Swift",typescript:"TypeScript",xml:"XML"},dt$2={cpp:"cpp",java:"java",javascript:"js",md:"markdown",plaintext:"plain",python:"py",text:"plain",ts:"typescript"};function mt(t){return dt$2[t]||t}function vt$2(t){return "string"==typeof t?t:Array.isArray(t)?t.map(vt$2).join(""):vt$2(t.content)}function Tt$1(t,e){const n=/^diff-([\w-]+)/i.exec(e),r=t.getTextContent();let i=pt$2.tokenize(r,pt$2.languages[n?"diff":e]);return n&&(i=function(t,e){const n=e,r=pt$2.languages[n],i={tokens:t},o=pt$2.languages.diff.PREFIXES;for(const t of i.tokens){if("string"==typeof t||!(t.type in o)||!Array.isArray(t.content))continue;const e=t.type;let n=0;const i=()=>(n++,new pt$2.Token("prefix",o[e],e.replace(/^(\w+).*/,"$1"))),s=t.content.filter(t=>"string"==typeof t||"prefix"!==t.type),l=t.content.length-s.length,u=pt$2.tokenize(vt$2(s),r);u.unshift(i());const c=/\r\n|\n/g,g=t=>{const e=[];c.lastIndex=0;let r,o=0;for(;n<l&&(r=c.exec(t));){const n=r.index+r[0].length;e.push(t.slice(o,n)),o=n,e.push(i());}if(0!==e.length)return o<t.length&&e.push(t.slice(o)),e},a=t=>{for(let e=0;e<t.length&&n<l;e++){const n=t[e];if("string"==typeof n){const r=g(n);r&&(t.splice(e,1,...r),e+=r.length-1);}else if("string"==typeof n.content){const t=g(n.content);t&&(n.content=t);}else Array.isArray(n.content)?a(n.content):a([n.content]);}};a(u),n<l&&u.push(i()),t.content=u;}return i.tokens}(i,n[1])),bt$2(i)}function bt$2(t,e){const n=[];for(const r of t)if("string"==typeof r){const t=r.split(/(\n|\t)/),i=t.length;for(let r=0;r<i;r++){const i=t[r];"\n"===i||"\r\n"===i?n.push(Qn()):"\t"===i?n.push(Cr()):i.length>0&&n.push(it(i,e));}}else {const{content:t,alias:e}=r;"string"==typeof t?n.push(...bt$2([t],"prefix"===r.type&&"string"==typeof e?e:r.type)):Array.isArray(t)&&n.push(...bt$2(t,"unchanged"===r.type?void 0:r.type));}return n}const Ct$1={$tokenize(t,e){return Tt$1(t,e||this.defaultLanguage)},defaultLanguage:M$2,tokenize(t,e){return pt$2.tokenize(t,pt$2.languages[e||""]||pt$2.languages[this.defaultLanguage])}};function Nt$1(t,e,n){const r=t.getParent();Q$1(r)?kt$2(r,e,n):ot(t)&&t.replace(pr(t.__text));}function jt$2(t,e){const n=e.getElementByKey(t.getKey());if(null===n)return;const r=t.getChildren(),i=r.length;if(i===n.__cachedChildrenLength)return;n.__cachedChildrenLength=i;let o="1",s=1;for(let t=0;t<i;t++)Zn(r[t])&&(o+="\n"+ ++s);n.setAttribute("data-gutter",o);}const wt$2=new Set;function kt$2(t,e,n){const r=t.getKey(),i=e.getKey()+"/"+r;void 0===t.getLanguage()&&t.setLanguage(n.defaultLanguage);const o=t.getLanguage()||n.defaultLanguage;if(!function(t){const e=function(t){const e=/^diff-([\w-]+)/i.exec(t);return e?e[1]:null}(t),n=e||t;try{return !!n&&pt$2.languages.hasOwnProperty(n)}catch(t){return  false}}(o))return t.getIsSyntaxHighlightSupported()&&t.setIsSyntaxHighlightSupported(false),void async function(){}();t.getIsSyntaxHighlightSupported()||t.setIsSyntaxHighlightSupported(true),wt$2.has(i)||(wt$2.add(i),e.update(()=>{!function(t,e){const n=Mo(t);if(!Q$1(n)||!n.isAttached())return;const r=$r();if(!wr(r))return void e();const i=r.anchor,o=i.offset,s="element"===i.type&&Zn(n.getChildAtIndex(i.offset-1));let u=0;if(!s){const t=i.getNode();u=o+t.getPreviousSiblings().reduce((t,e)=>t+e.getTextContentSize(),0);}if(!e())return;if(s)return void i.getNode().select(o,o);n.getChildren().some(t=>{const e=yr(t);if(e||Zn(t)){const n=t.getTextContentSize();if(e&&n>=u)return t.select(u,u),true;u-=n;}return  false});}(r,()=>{const e=Mo(r);if(!Q$1(e)||!e.isAttached())return  false;const i=e.getLanguage()||n.defaultLanguage,o=n.$tokenize(e,i),s=function(t,e){let n=0;for(;n<t.length&&At$2(t[n],e[n]);)n++;const r=t.length,i=e.length,o=Math.min(r,i)-n;let s=0;for(;s<o;)if(s++,!At$2(t[r-s],e[i-s])){s--;break}const l=n,u=r-s,c=e.slice(n,i-s);return {from:l,nodesForReplacement:c,to:u}}(e.getChildren(),o),{from:l,to:u,nodesForReplacement:c}=s;return !(l===u&&!c.length)&&(t.splice(l,u-l,c),true)});},{onUpdate:()=>{wt$2.delete(i);},skipTransforms:true}));}function At$2(t,e){return ot(t)&&ot(e)&&t.__text===e.__text&&t.__highlightType===e.__highlightType||Sr(t)&&Sr(e)||Zn(t)&&Zn(e)}function Lt$2(t){if(!wr(t))return  false;const e=t.anchor.getNode(),n=Q$1(e)?e:e.getParent(),r=t.focus.getNode(),i=Q$1(r)?r:r.getParent();return Q$1(n)&&n.is(i)}function Pt$2(t){const e=t.getNodes(),n=[];if(1===e.length&&Q$1(e[0]))return n;let r=[];for(let t=0;t<e.length;t++){const i=e[t];ot(i)||Sr(i)||Zn(i)||K$2(169),Zn(i)?r.length>0&&(n.push(r),r=[]):r.push(i);}if(r.length>0){const e=t.isBackward()?t.anchor:t.focus,i=Tr(r[0].getKey(),0,"text");e.is(i)||n.push(r);}return n}function Ot$2(t){const e=$r();if(!wr(e)||!Lt$2(e))return  false;const n=Pt$2(e),r=n.length;if(0===r&&e.isCollapsed())return t===Le$3&&e.insertNodes([Cr()]),true;if(0===r&&t===Le$3&&"\n"===e.getTextContent()){const t=Cr(),n=Qn(),r=e.isBackward()?"previous":"next";return e.insertNodes([t,n]),Al(Wl(vl(fl(t,"next",0),zl(ul(n,"next"))),r)),true}for(let i=0;i<r;i++){const r=n[i];if(r.length>0){let n=r[0];if(0===i&&(n=lt(n)),t===Le$3){const t=Cr();if(n.insertBefore(t),0===i){const r=e.isBackward()?"focus":"anchor",i=Tr(n.getKey(),0,"text");e[r].is(i)&&e[r].set(t.getKey(),0,"text");}}else Sr(n)&&n.remove();}}return  true}function Ht$2(t,e){const n=$r();if(!wr(n))return  false;const{anchor:r,focus:i}=n,o=r.offset,s=i.offset,l=r.getNode(),c=i.getNode(),g=t===be$2;if(!Lt$2(n)||!ot(l)&&!Sr(l)||!ot(c)&&!Sr(c))return  false;if(!e.altKey){if(n.isCollapsed()){const t=l.getParentOrThrow();if(g&&0===o&&null===l.getPreviousSibling()){if(null===t.getPreviousSibling())return t.selectPrevious(),e.preventDefault(),true}else if(!g&&o===l.getTextContentSize()&&null===l.getNextSibling()){if(null===t.getNextSibling())return t.selectNext(),e.preventDefault(),true}}return  false}let a,f;if(l.isBefore(c)?(a=lt(l),f=ut$1(c)):(a=lt(c),f=ut$1(l)),null==a||null==f)return  false;const p=a.getNodesBetween(f);for(let t=0;t<p.length;t++){const e=p[t];if(!ot(e)&&!Sr(e)&&!Zn(e))return  false}e.preventDefault(),e.stopPropagation();const h=g?a.getPreviousSibling():f.getNextSibling();if(!Zn(h))return  true;const d=g?h.getPreviousSibling():h.getNextSibling();if(null==d)return  true;const m=ot(d)||Sr(d)||Zn(d)?g?lt(d):ut$1(d):null;let x=null!=m?m:d;return h.remove(),p.forEach(t=>t.remove()),t===be$2?(p.forEach(t=>x.insertBefore(t)),x.insertBefore(h)):(x.insertAfter(h),x=h,p.forEach(t=>{x.insertAfter(t),x=t;})),n.setTextNodeRange(l,o,c,s),true}function Et$1(t,e){const n=$r();if(!wr(n))return  false;const{anchor:r,focus:i}=n,o=r.getNode(),s=i.getNode(),l=t===Ne$1;if(!Lt$2(n)||!ot(o)&&!Sr(o)||!ot(s)&&!Sr(s))return  false;const c=s;if("rtl"===ct$1(c)?!l:l){const t=gt$2(c,i.offset);if(null!==t){const{node:e,offset:r}=t;Zn(e)?e.selectNext(0,0):n.setTextNodeRange(e,r,e,r);}else c.getParentOrThrow().selectStart();}else {at$1(c).select();}return e.preventDefault(),e.stopPropagation(),true}function zt$2(t,e){if(!t.hasNodes([U$1,nt$1]))throw new Error("CodeHighlightPlugin: CodeNode or CodeHighlightNode not registered on editor");null==e&&(e=Ct$1);const n=[];return  true!==t._headless&&n.push(t.registerMutationListener(U$1,e=>{t.getEditorState().read(()=>{for(const[n,r]of e)if("destroyed"!==r){const e=Mo(n);null!==e&&jt$2(e,t);}});},{skipInitialization:false})),n.push(t.registerNodeTransform(U$1,n=>kt$2(n,t,e)),t.registerNodeTransform(lr,n=>Nt$1(n,t,e)),t.registerNodeTransform(nt$1,n=>Nt$1(n,t,e)),t.registerCommand(De$2,e=>{const n=function(t){const e=$r();if(!wr(e)||!Lt$2(e))return null;const n=t?Ie$2:Le$3,r=t?Ie$2:Fe$2,i=e.anchor,o=e.focus;if(i.is(o))return r;const s=Pt$2(e);if(1!==s.length)return n;const l=s[0];let u,c;0===l.length&&K$2(285),e.isBackward()?(u=o,c=i):(u=i,c=o);const g=lt(l[0]),a=ut$1(l[0]),f=Tr(g.getKey(),0,"text"),p=Tr(a.getKey(),a.getTextContentSize(),"text");return u.isBefore(f)||p.isBefore(c)?n:f.isBefore(u)||c.isBefore(p)?r:n}(e.shiftKey);return null!==n&&(e.preventDefault(),t.dispatchCommand(n,void 0),true)},Hi),t.registerCommand(Fe$2,()=>!!Lt$2($r())&&(ti([Cr()]),true),Hi),t.registerCommand(Le$3,t=>Ot$2(Le$3),Hi),t.registerCommand(Ie$2,t=>Ot$2(Ie$2),Hi),t.registerCommand(be$2,t=>{const e=$r();if(!wr(e)||!Lt$2(e))return  false;const n=Io().getFirstDescendant(),{anchor:r}=e,i=r.getNode();return (!n||!i||n.getKey()!==i.getKey())&&Ht$2(be$2,t)},Hi),t.registerCommand(we$1,t=>{const e=$r();if(!wr(e)||!Lt$2(e))return  false;const n=Io().getLastDescendant(),{anchor:r}=e,i=r.getNode();return (!n||!i||n.getKey()!==i.getKey())&&Ht$2(we$1,t)},Hi),t.registerCommand(Ne$1,t=>Et$1(Ne$1,t),Hi),t.registerCommand(Te$1,t=>Et$1(Te$1,t),Hi)),ec(...n)}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function D$1(t,e){const n={};for(const o of t){const t=e(o);t&&(n[t]?n[t].push(o):n[t]=[o]);}return n}function K$1(t){const e=D$1(t,t=>t.type);return {element:e.element||[],multilineElement:e["multiline-element"]||[],textFormat:e["text-format"]||[],textMatch:e["text-match"]||[]}}const q$1=/[!-/:-@[-`{-~\s]/;function rt$1(t){return yr(t)&&!t.hasFormat("code")}function at(t,...e){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",t);for(const t of e)o.append("v",t);throw n.search=o.toString(),Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}const ft$1=/^(\s*)(\d{1,})\.\s/,gt$1=/^(\s*)[-*+]\s/,dt$1=/^(#{1,6})\s/,pt$1=/^>\s/,ht=/^([ \t]*`{3,})([\w-]+)?[ \t]?/,xt$1=/^[ \t]*`{3,}$/,vt$1=it$2("mdListMarker",{parse:t=>"string"==typeof t&&/^[-*+]$/.test(t)?t:"-"}),It$1=it$2("mdCodeFence",{parse:t=>"string"==typeof t&&/^`{3,}$/.test(t)?t:"```"}),St$1=t=>(e,n,o,r)=>{const s=t(o);s.append(...n),e.replace(s),r||s.select(0,0);};const bt$1=t=>(e,n,o,r)=>{const s=e.getPreviousSibling(),i=e.getNextSibling(),l=ce$1("check"===t?"x"===o[3]:void 0),c=o[0].trim()[0],a="bullet"!==t&&"check"!==t||c!==vt$1.parse(c)?void 0:c;if(me$1(i)&&i.getListType()===t){a&&lt$2(i,vt$1,a);const t=i.getFirstChild();null!==t?t.insertBefore(l):i.append(l),e.remove();}else if(me$1(s)&&s.getListType()===t)a&&lt$2(s,vt$1,a),s.append(l),e.remove();else {const n=pe$1(t,"number"===t?Number(o[2]):void 0);a&&lt$2(n,vt$1,a),n.append(l),e.replace(n);}l.append(...n),r||l.select(0,0);const f=function(t){const e=t.match(/\t/g),n=t.match(/ /g);let o=0;return e&&(o+=e.length),n&&(o+=Math.floor(n.length/4)),o}(o[1]);f&&l.setIndent(f);},wt$1=(t,e,n)=>{const o=[],r=t.getChildren();let s=0;for(const i of r)if(ae$1(i)){if(1===i.getChildrenSize()){const t=i.getFirstChild();if(me$1(t)){o.push(wt$1(t,e,n+1));continue}}const r=" ".repeat(4*n),l=t.getListType(),c=ot$2(t,vt$1),a="number"===l?`${t.getStart()+s}. `:"check"===l?`${c} [${i.getChecked()?"x":" "}] `:c+" ";o.push(r+a+e(i)),s++;}return o.join("\n")},Ft$1={dependencies:[Tt$2],export:(t,e)=>{if(!It$2(t))return null;const n=Number(t.getTag().slice(1));return "#".repeat(n)+" "+e(t)},regExp:dt$1,replace:St$1(t=>{const e="h"+t[1].length;return Mt$2(e)}),type:"element"},Lt$1={dependencies:[_t$2],export:(t,e)=>{if(!Pt$3(t))return null;const n=e(t).split("\n"),o=[];for(const t of n)o.push("> "+t);return o.join("\n")},regExp:pt$1,replace:(t,e,n,o)=>{if(o){const n=t.getPreviousSibling();if(Pt$3(n))return n.splice(n.getChildrenSize(),0,[Qn(),...e]),void t.remove()}const r=Ot$3();r.append(...e),t.replace(r),o||r.select(0,0);},type:"element"},Nt={dependencies:[U$1],export:t=>{if(!Q$1(t))return null;const e=t.getTextContent();let n=ot$2(t,It$1);if(e.indexOf(n)>-1){const t=e.match(/`{3,}/g);if(t){const e=Math.max(...t.map(t=>t.length));n="`".repeat(e+1);}}return n+(t.getLanguage()||"")+(e?"\n"+e:"")+"\n"+n},handleImportAfterStartMatch:({lines:t,rootNode:e,startLineIndex:n,startMatch:o})=>{const r=o[1],s=r.trim().length,i=t[n],l=o.index+r.length,c=i.slice(l),a=new RegExp(`\`{${s},}$`);if(a.test(c)){const t=c.match(a),r=c.slice(0,c.lastIndexOf(t[0])),s=[...o];return s[2]="",Nt.replace(e,null,s,t,[r],true),[true,n]}const f=new RegExp(`^[ \\t]*\`{${s},}$`);for(let r=n+1;r<t.length;r++){const s=t[r];if(f.test(s)){const l=s.match(f),c=t.slice(n+1,r),a=i.slice(o[0].length);return a.length>0&&c.unshift(a),Nt.replace(e,null,o,l,c,true),[true,r]}}const g=t.slice(n+1),u=i.slice(o[0].length);return u.length>0&&g.unshift(u),Nt.replace(e,null,o,null,g,true),[true,t.length-1]},regExpEnd:{optional:true,regExp:xt$1},regExpStart:ht,replace:(t,e,n,o,r,s)=>{let i,c;const a=n[1]?n[1].trim():"```",f=n[2]||void 0;if(!e&&r){if(1===r.length)o?(i=X$1(f),c=r[0]):(i=X$1(f),c=r[0].startsWith(" ")?r[0].slice(1):r[0]);else {for(i=X$1(f),r.length>0&&(0===r[0].trim().length?r.shift():r[0].startsWith(" ")&&(r[0]=r[0].slice(1)));r.length>0&&!r[r.length-1].length;)r.pop();c=r.join("\n");}lt$2(i,It$1,a);const e=pr(c);i.append(e),t.append(i);}else e&&St$1(t=>X$1(t?t[2]:void 0))(t,e,n,s);},type:"multiline-element"},kt$1={dependencies:[ue$1,se$1],export:(t,e)=>me$1(t)?wt$1(t,e,0):null,regExp:gt$1,replace:bt$1("bullet"),type:"element"},Mt$1={dependencies:[ue$1,se$1],export:(t,e)=>me$1(t)?wt$1(t,e,0):null,regExp:ft$1,replace:bt$1("number"),type:"element"},_t$1={format:["code"],tag:"`",type:"text-format"},Bt$1={format:["highlight"],tag:"==",type:"text-format"},jt$1={format:["bold","italic"],tag:"***",type:"text-format"},Pt$1={format:["bold","italic"],intraword:false,tag:"___",type:"text-format"},At$1={format:["bold"],tag:"**",type:"text-format"},Ot$1={format:["bold"],intraword:false,tag:"__",type:"text-format"},zt$1={format:["strikethrough"],tag:"~~",type:"text-format"},Ut$1={format:["italic"],tag:"*",type:"text-format"},Wt$1={format:["italic"],intraword:false,tag:"_",type:"text-format"},Dt$1={dependencies:[E$3],export:(t,e,n)=>{if(!B$2(t)||H$1(t))return null;const o=t.getTitle(),r=e(t);return o?`[${r}](${t.getURL()} "${o}")`:`[${r}](${t.getURL()})`},importRegExp:/(?:\[(.+?)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))/,regExp:/(?:\[([^[\]]*(?:\[[^[\]]*\][^[\]]*)*)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))$/,replace:(t,e)=>{if(qs(t,B$2))return;const[,n,o,r]=e,s=K$3(o,{title:r}),i=n.split("[").length-1,c=n.split("]").length-1;let a=n,f="";if(i<c)return;if(i>c){const t=n.split("[");f="["+t[0],a=t.slice(1).join("[");}const g=pr(a);return g.setFormat(t.getFormat()),s.append(g),t.replace(s),f&&s.insertBefore(pr(f)),g},trigger:")",type:"text-match"},Kt$1=[Ft$1,Lt$1,kt$1,Mt$1],qt$1=[Nt],Gt$1=[_t$1,jt$1,Pt$1,At$1,Ot$1,Bt$1,Ut$1,Wt$1,zt$1],Ht$1=[Dt$1],Jt$1=[...Kt$1,...qt$1,...Gt$1,...Ht$1];function Qt$1(t,e,n,o,r){const s=t.getParent();if(!xs(s)||t.getFirstChild()!==e)return  false;const i=e.getTextContent();if(!r&&" "!==i[n-1])return  false;for(const{regExpStart:s,replace:l,regExpEnd:c}of o){if(c&&!("optional"in c)||c&&"optional"in c&&!c.optional)continue;const o=i.match(s);if(o){const s=r||o[0].endsWith(" ")?n:n-1;if(o[0].length!==s)continue;const i=e.getNextSiblings(),[c,a]=e.splitText(n);if(false!==l(t,a?[a,...i]:i,o,null,null,false))return c.remove(),true}}return  false}function Vt$1(t,e,n){const o=n.length;for(let r=e;r>=o;r--){const e=r-o;if(Xt$1(t,e,n,0,o)&&" "!==t[e+o])return e}return  -1}function Xt$1(t,e,n,o,r){for(let s=0;s<r;s++)if(t[e+s]!==n[o+s])return  false;return  true}function Yt$1(t,n=Jt$1){const o=K$1(n),r=D$1(o.textFormat,({tag:t})=>t[t.length-1]),l=D$1(o.textMatch,({trigger:t})=>t);for(const e of n){const n=e.type;if("element"===n||"text-match"===n||"multiline-element"===n){const n=e.dependencies;for(const e of n)t.hasNode(e)||at(173,e.getType());}}const c=(t,n,c)=>{(function(t,e,n,o){const r=t.getParent();if(!xs(r)||t.getFirstChild()!==e)return  false;const s=e.getTextContent();if(" "!==s[n-1])return  false;for(const{regExp:r,replace:i}of o){const o=s.match(r);if(o&&o[0].length===(o[0].endsWith(" ")?n:n-1)){const r=e.getNextSiblings(),[s,l]=e.splitText(n);if(false!==i(t,l?[l,...r]:r,o,false))return s.remove(),true}}return  false})(t,n,c,o.element)||Qt$1(t,n,c,o.multilineElement)||function(t,e,n){let o=t.getTextContent();const r=n[o[e-1]];if(null==r)return  false;e<o.length&&(o=o.slice(0,e));for(const e of r){if(!e.replace||!e.regExp)continue;const n=o.match(e.regExp);if(null===n)continue;const r=n.index||0,s=r+n[0].length;let i;return 0===r?[i]=t.splitText(s):[,i]=t.splitText(r,s),i.selectNext(0,0),e.replace(i,n),true}return  false}(n,c,l)||function(t,n,o){const r=t.getTextContent(),l=n-1,c=r[l],a=o[c];if(!a)return  false;for(const n of a){const{tag:o}=n,a=o.length,f=l-a+1;if(a>1&&!Xt$1(r,f,o,0,a))continue;if(" "===r[f-1])continue;const g=r[l+1];if(false===n.intraword&&g&&!q$1.test(g))continue;const u=t;let d=u,p=Vt$1(r,f,o),h=d;for(;p<0&&(h=h.getPreviousSibling())&&!Zn(h);)if(yr(h)){if(h.hasFormat("code"))continue;const t=h.getTextContent();d=h,p=Vt$1(t,t.length,o);}if(p<0)continue;if(d===u&&p+a===f)continue;const x=d.getTextContent();if(p>0&&x[p-1]===c)continue;const C=x[p-1];if(false===n.intraword&&C&&!q$1.test(C))continue;const T=u.getTextContent(),E=T.slice(0,f)+T.slice(l+1);u.setTextContent(E);const v=d===u?E:x;d.setTextContent(v.slice(0,p)+v.slice(p+a));const I=$r(),S=Wr();zo(S);const b=l-a*(d===u?2:1)+1;S.anchor.set(d.__key,p,"text"),S.focus.set(u.__key,b,"text");for(const t of n.format)S.hasFormat(t)||S.formatText(t);S.anchor.set(S.focus.key,S.focus.offset,S.focus.type);for(const t of n.format)S.hasFormat(t)&&S.toggleFormat(t);return wr(I)&&(S.format=I.format),true}}(n,c,r);};return ec(t.registerUpdateListener(({tags:n,dirtyLeaves:o,editorState:r,prevEditorState:s})=>{if(n.has(jn)||n.has(Rn$1))return;if(t.isComposing())return;const l=r.read($r),a=s.read($r);if(!wr(a)||!wr(l)||!l.isCollapsed()||l.is(a))return;const f=l.anchor.key,g=l.anchor.offset,u=r._nodeMap.get(f);!yr(u)||!o.has(f)||1!==g&&g>a.anchor.offset+1||t.update(()=>{if(!rt$1(u))return;const t=u.getParent();null===t||Q$1(t)||c(t,u,l.anchor.offset);});}),t.registerCommand(Ee$2,t=>{if(null!==t&&t.shiftKey)return  false;const n=$r();if(!wr(n)||!n.isCollapsed())return  false;const r=n.anchor.offset,s=n.anchor.getNode();if(!yr(s)||!rt$1(s))return  false;const l=s.getParent();if(null===l||Q$1(l))return  false;return r===s.getTextContent().length&&(!!Qt$1(l,s,r,o.multilineElement,true)&&(null!==t&&t.preventDefault(),true))},Hi))}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function v$1(t,e,n,r,o){if(null===t||0===n.size&&0===r.size&&!o)return 0;const i=e._selection,a=t._selection;if(o)return 1;if(!(wr(i)&&wr(a)&&a.isCollapsed()&&i.isCollapsed()))return 0;const s=function(t,e,n){const r=t._nodeMap,o=[];for(const t of e){const e=r.get(t);void 0!==e&&o.push(e);}for(const[t,e]of n){if(!e)continue;const n=r.get(t);void 0===n||Ki(n)||o.push(n);}return o}(e,n,r);if(0===s.length)return 0;if(s.length>1){const n=e._nodeMap,r=n.get(i.anchor.key),o=n.get(a.anchor.key);return r&&o&&!t._nodeMap.has(r.__key)&&yr(r)&&1===r.__text.length&&1===i.anchor.offset?2:0}const c=s[0],u=t._nodeMap.get(c.__key);if(!yr(u)||!yr(c)||u.__mode!==c.__mode)return 0;const d=u.__text,l=c.__text;if(d===l)return 0;const f=i.anchor,p=a.anchor;if(f.key!==p.key||"text"!==f.type)return 0;const h=f.offset,m=p.offset,y=l.length-d.length;return 1===y&&m===h-1?2:-1===y&&m===h+1?3:-1===y&&m===h?4:0}function b$1(t,e){let n=Date.now(),r=0,o=Date.now(),i=0,a=null;return (s,c,u,d,l,f)=>{const p=Date.now();if(f.has(qn)&&(o=n,i=r,a=s),f.has(Rn$1))return r=0,n=p,2;f.has(Hn)&&a&&(n=o,r=i,s=a);const h=v$1(s,c,d,l,t.isComposing()),C=(()=>{const o=null===u||u.editor===t,i=f.has(Bn);if(!i&&o&&f.has(Wn))return 0;if(1===h)return 2;if(null===s)return 1;const a=c._selection;if(!(d.size>0||l.size>0))return null!==a?0:2;const m="number"==typeof e?e:e.peek();if(false===i&&0!==h&&h===r&&p<n+m&&o)return 0;if(1===d.size){if(function(t,e,n){const r=e._nodeMap.get(t),o=n._nodeMap.get(t),i=e._selection,a=n._selection;return !(wr(i)&&wr(a)&&"element"===i.anchor.type&&"element"===i.focus.type&&"text"===a.anchor.type&&"text"===a.focus.type||!yr(r)||!yr(o)||r.__parent!==o.__parent)&&JSON.stringify(e.read(()=>r.exportJSON()))===JSON.stringify(n.read(()=>o.exportJSON()))}(Array.from(d)[0],s,c))return 0}return 1})();return n=p,r=h,C}}function w$1(t){t.undoStack=[],t.redoStack=[],t.current=null;}function E$1(t,e,n){const r=b$1(t,n),i=ec(t.registerCommand(xe$1,()=>(function(t,e){const n=e.redoStack,r=e.undoStack;if(0!==r.length){const o=e.current,i=r.pop();null!==o&&(n.push(o),t.dispatchCommand(Ye$1,true)),0===r.length&&t.dispatchCommand(qe$2,false),e.current=i||null,i&&i.editor.setEditorState(i.editorState,{tag:Rn$1});}}(t,e),true),qi),t.registerCommand(Ce$1,()=>(function(t,e){const n=e.redoStack,r=e.undoStack;if(0!==n.length){const o=e.current;null!==o&&(r.push(o),t.dispatchCommand(qe$2,true));const i=n.pop();0===n.length&&t.dispatchCommand(Ye$1,false),e.current=i||null,i&&i.editor.setEditorState(i.editorState,{tag:Rn$1});}}(t,e),true),qi),t.registerCommand($e$2,()=>(w$1(e),false),qi),t.registerCommand(Ve$2,()=>(w$1(e),t.dispatchCommand(Ye$1,false),t.dispatchCommand(qe$2,false),true),qi),t.registerUpdateListener(({editorState:n,prevEditorState:o,dirtyLeaves:i,dirtyElements:a,tags:s})=>{const c=e.current,u=e.redoStack,d=e.undoStack,l=null===c?null:c.editorState;if(null!==c&&n===l)return;const f=r(o,n,c,i,a,s);if(1===f)0!==u.length&&(e.redoStack=[],t.dispatchCommand(Ye$1,false)),null!==c&&(d.push({...c}),t.dispatchCommand(qe$2,true));else if(2===f)return;e.current={editor:t,editorState:n};}));return i}function H(){return {current:null,redoStack:[],undoStack:[]}}const M$1=Yl({build:(e,{delay:n,createInitialHistoryState:r,disabled:o})=>pt$4({delay:n,disabled:o,historyState:r(e)}),config:Gl({createInitialHistoryState:H,delay:300,disabled:"undefined"==typeof window}),name:"@lexical/history/History",register:(t,n,r)=>{const o=r.getOutput();return gt$3(()=>o.disabled.value?void 0:E$1(t,o.historyState.value,o.delay))}});Yl({dependencies:[ql(M$1,{createInitialHistoryState:()=>{throw new Error("SharedHistory did not inherit parent history")},disabled:true})],name:"@lexical/history/SharedHistory",register(t,o,i){const{output:a}=i.getDependency(M$1),s=function(t){return t?oe$2(t,M$1.name):null}(t._parentEditor);if(!s)return ()=>{};const c=s.output;return gt$3(()=>H$3(()=>{a.delay.value=c.delay.value,a.historyState.value=c.historyState.value,a.disabled.value=c.disabled.value;}))}});

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

function createElement(name, properties, content = "") {
  const element = document.createElement(name);
  for (const [ key, value ] of Object.entries(properties || {})) {
    if (key in element) {
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
  const blocks = doc.querySelectorAll("body > :not(h1, h2, h3, h4, h5, h6) + *");
  for (const block of blocks) {
    const spacer = doc.createElement("p");
    spacer.appendChild(doc.createElement("br"));
    block.before(spacer);
  }
}

function generateDomId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}`
}

class HorizontalDividerNode extends Fi {
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

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Fe$1=/^(\d+(?:\.\d+)?)px$/,Ae$1={BOTH:3,COLUMN:2,NO_STATUS:0,ROW:1};let Ke$1 = class Ke extends Ai{__colSpan;__rowSpan;__headerState;__width;__backgroundColor;__verticalAlign;static getType(){return "tablecell"}static clone(e){return new Ke(e.__headerState,e.__colSpan,e.__width,e.__key)}afterCloneFrom(e){super.afterCloneFrom(e),this.__rowSpan=e.__rowSpan,this.__backgroundColor=e.__backgroundColor,this.__verticalAlign=e.__verticalAlign;}static importDOM(){return {td:e=>({conversion:ke$1,priority:0}),th:e=>({conversion:ke$1,priority:0})}}static importJSON(e){return Ee$1().updateFromJSON(e)}updateFromJSON(e){return super.updateFromJSON(e).setHeaderStyles(e.headerState).setColSpan(e.colSpan||1).setRowSpan(e.rowSpan||1).setWidth(e.width||void 0).setBackgroundColor(e.backgroundColor||null).setVerticalAlign(e.verticalAlign||void 0)}constructor(e=Ae$1.NO_STATUS,t=1,n,o){super(o),this.__colSpan=t,this.__rowSpan=1,this.__headerState=e,this.__width=n,this.__backgroundColor=null,this.__verticalAlign=void 0;}createDOM(t){const n=document.createElement(this.getTag());return this.__width&&(n.style.width=`${this.__width}px`),this.__colSpan>1&&(n.colSpan=this.__colSpan),this.__rowSpan>1&&(n.rowSpan=this.__rowSpan),null!==this.__backgroundColor&&(n.style.backgroundColor=this.__backgroundColor),Oe$1(this.__verticalAlign)&&(n.style.verticalAlign=this.__verticalAlign),Zl(n,t.theme.tableCell,this.hasHeader()&&t.theme.tableCellHeader),n}exportDOM(e){const t=super.exportDOM(e);if(Ms(t.element)){const e=t.element;e.setAttribute("data-temporary-table-cell-lexical-key",this.getKey()),e.style.border="1px solid black",this.__colSpan>1&&(e.colSpan=this.__colSpan),this.__rowSpan>1&&(e.rowSpan=this.__rowSpan),e.style.width=`${this.getWidth()||75}px`,e.style.verticalAlign=this.getVerticalAlign()||"top",e.style.textAlign="start",null===this.__backgroundColor&&this.hasHeader()&&(e.style.backgroundColor="#f2f3f5");}return t}exportJSON(){return {...super.exportJSON(),...Oe$1(this.__verticalAlign)&&{verticalAlign:this.__verticalAlign},backgroundColor:this.getBackgroundColor(),colSpan:this.__colSpan,headerState:this.__headerState,rowSpan:this.__rowSpan,width:this.getWidth()}}getColSpan(){return this.getLatest().__colSpan}setColSpan(e){const t=this.getWritable();return t.__colSpan=e,t}getRowSpan(){return this.getLatest().__rowSpan}setRowSpan(e){const t=this.getWritable();return t.__rowSpan=e,t}getTag(){return this.hasHeader()?"th":"td"}setHeaderStyles(e,t=Ae$1.BOTH){const n=this.getWritable();return n.__headerState=e&t|n.__headerState&~t,n}getHeaderStyles(){return this.getLatest().__headerState}setWidth(e){const t=this.getWritable();return t.__width=e,t}getWidth(){return this.getLatest().__width}getBackgroundColor(){return this.getLatest().__backgroundColor}setBackgroundColor(e){const t=this.getWritable();return t.__backgroundColor=e,t}getVerticalAlign(){return this.getLatest().__verticalAlign}setVerticalAlign(e){const t=this.getWritable();return t.__verticalAlign=e||void 0,t}toggleHeaderStyle(e){const t=this.getWritable();return (t.__headerState&e)===e?t.__headerState-=e:t.__headerState+=e,t}hasHeaderState(e){return (this.getHeaderStyles()&e)===e}hasHeader(){return this.getLatest().__headerState!==Ae$1.NO_STATUS}updateDOM(e){return e.__headerState!==this.__headerState||e.__width!==this.__width||e.__colSpan!==this.__colSpan||e.__rowSpan!==this.__rowSpan||e.__backgroundColor!==this.__backgroundColor||e.__verticalAlign!==this.__verticalAlign}isShadowRoot(){return  true}collapseAtStart(){return  true}canBeEmpty(){return  false}canIndent(){return  false}};function Oe$1(e){return "middle"===e||"bottom"===e}function ke$1(e){const t=e,n=e.nodeName.toLowerCase();let o;Fe$1.test(t.style.width)&&(o=parseFloat(t.style.width));let r=Ae$1.NO_STATUS;if("th"===n){const e=t.getAttribute("scope");r="col"===e?Ae$1.COLUMN:Ae$1.ROW;}const l=Ee$1(r,t.colSpan,o);l.__rowSpan=t.rowSpan;const s=t.style.backgroundColor;""!==s&&(l.__backgroundColor=s);const i=t.style.verticalAlign;Oe$1(i)&&(l.__verticalAlign=i);const c=t.style,a=(c&&c.textDecoration||"").split(" "),u="700"===c.fontWeight||"bold"===c.fontWeight,h=a.includes("line-through"),d="italic"===c.fontStyle,C=a.includes("underline");return {after:e=>{const t=[];let n=null;const o=()=>{if(n){const e=n.getFirstChild();Zn(e)&&1===n.getChildrenSize()&&e.remove();}};for(const r of e)ys(r)||yr(r)||Zn(r)?(yr(r)&&(u&&r.toggleFormat("bold"),h&&r.toggleFormat("strikethrough"),d&&r.toggleFormat("italic"),C&&r.toggleFormat("underline")),n?n.append(r):(n=Vi().append(r),t.push(n))):(t.push(r),o(),n=null);return o(),0===t.length&&t.push(Vi()),t},node:l}}function Ee$1(e=Ae$1.NO_STATUS,t=1,n){return Ss(new Ke$1(e,t,n))}function Me$1(e){return e instanceof Ke$1}const $e$1=ne$3("INSERT_TABLE_COMMAND");function We$1(e,...t){const n=new URL("https://lexical.dev/docs/error"),o=new URLSearchParams;o.append("code",e);for(const e of t)o.append("v",e);throw n.search=o.toString(),Error(`Minified Lexical error #${e}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`)}let ze$1 = class ze extends Ai{__height;static getType(){return "tablerow"}static clone(e){return new ze(e.__height,e.__key)}static importDOM(){return {tr:e=>({conversion:He$1,priority:0})}}static importJSON(e){return Le$1().updateFromJSON(e)}updateFromJSON(e){return super.updateFromJSON(e).setHeight(e.height)}constructor(e,t){super(t),this.__height=e;}exportJSON(){const e=this.getHeight();return {...super.exportJSON(),...void 0===e?void 0:{height:e}}}createDOM(t){const n=document.createElement("tr");return this.__height&&(n.style.height=`${this.__height}px`),Zl(n,t.theme.tableRow),n}extractWithChild(e,t,n){return "html"===n}isShadowRoot(){return  true}setHeight(e){const t=this.getWritable();return t.__height=e,t}getHeight(){return this.getLatest().__height}updateDOM(e){return e.__height!==this.__height}canBeEmpty(){return  false}canIndent(){return  false}};function He$1(e){const n=e;let o;return Fe$1.test(n.style.height)&&(o=parseFloat(n.style.height)),{after:e=>_t$4(e,Me$1),node:Le$1(o)}}function Le$1(e){return Ss(new ze$1(e))}function Be$1(e){return e instanceof ze$1}const Pe$1="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,De$1=Pe$1&&"documentMode"in document?document.documentMode:null,Ie$1=Pe$1&&/^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent);function Ue$1(e,t,n=true){const o=bn();for(let r=0;r<e;r++){const e=Le$1();for(let o=0;o<t;o++){let t=Ae$1.NO_STATUS;"object"==typeof n?(0===r&&n.rows&&(t|=Ae$1.ROW),0===o&&n.columns&&(t|=Ae$1.COLUMN)):n&&(0===r&&(t|=Ae$1.ROW),0===o&&(t|=Ae$1.COLUMN));const l=Ee$1(t),s=Vi();s.append(pr()),l.append(s),e.append(l);}o.append(e);}return o}function Je$1(e){const t=qs(e,e=>Me$1(e));return Me$1(t)?t:null}function Ye(e){const t=qs(e,e=>Be$1(e));if(Be$1(t))return t;throw new Error("Expected table cell to be inside of table row.")}function Xe$1(e){const t=qs(e,e=>yn(e));if(yn(t))return t;throw new Error("Expected table cell to be inside of table.")}function qe$1(e){const t=Ye(e);return Xe$1(t).getChildren().findIndex(e=>e.is(t))}function Ve$1(e){return Ye(e).getChildren().findIndex(t=>t.is(e))}Pe$1&&"InputEvent"in window&&!De$1&&new window.InputEvent("input");const Ze$1=(e,t)=>e===Ae$1.BOTH||e===t?t:Ae$1.NO_STATUS;function et(e=true){const t=$r();wr(t)||Rt(t)||We$1(188);const n=t.anchor.getNode(),o=t.focus.getNode(),[r]=wt(n),[l,,s]=wt(o),[,i,c]=_t(s,l,r),{startRow:a}=c,{startRow:u}=i;return e?nt(a+r.__rowSpan>u+l.__rowSpan?r:l,true):nt(u<a?l:r,false)}function nt(e,t=true){const[,,n]=wt(e),[o,r]=_t(n,e,e),l=o[0].length,{startRow:s}=r;let i=null;if(t){const t=s+e.__rowSpan-1,r=o[t],c=Le$1();for(let e=0;e<l;e++){const{cell:n,startRow:o}=r[e];if(o+n.__rowSpan-1<=t){const t=r[e].cell.__headerState,n=Ze$1(t,Ae$1.COLUMN);c.append(Ee$1(n).append(Vi()));}else n.setRowSpan(n.__rowSpan+1);}const a=n.getChildAtIndex(t);Be$1(a)||We$1(256),a.insertAfter(c),i=c;}else {const e=s,t=o[e],r=Le$1();for(let n=0;n<l;n++){const{cell:o,startRow:l}=t[n];if(l===e){const e=t[n].cell.__headerState,o=Ze$1(e,Ae$1.COLUMN);r.append(Ee$1(o).append(Vi()));}else o.setRowSpan(o.__rowSpan+1);}const c=n.getChildAtIndex(e);Be$1(c)||We$1(257),c.insertBefore(r),i=r;}return i}function rt(e=true){const t=$r();wr(t)||Rt(t)||We$1(188);const n=t.anchor.getNode(),o=t.focus.getNode(),[r]=wt(n),[l,,s]=wt(o),[,i,c]=_t(s,l,r),{startColumn:a}=c,{startColumn:u}=i;return e?st(a+r.__colSpan>u+l.__colSpan?r:l,true):st(u<a?l:r,false)}function st(e,t=true,n=true){const[,,o]=wt(e),[r,l]=_t(o,e,e),s=r.length,{startColumn:i}=l,c=t?i+e.__colSpan-1:i-1,a=o.getFirstChild();Be$1(a)||We$1(120);let u=null;function h(e=Ae$1.NO_STATUS){const t=Ee$1(e).append(Vi());return null===u&&(u=t),t}let d=a;e:for(let e=0;e<s;e++){if(0!==e){const e=d.getNextSibling();Be$1(e)||We$1(121),d=e;}const t=r[e],n=t[c<0?0:c].cell.__headerState,o=Ze$1(n,Ae$1.ROW);if(c<0){ft(d,h(o));continue}const{cell:l,startColumn:s,startRow:i}=t[c];if(s+l.__colSpan-1<=c){let n=l,r=i,s=c;for(;r!==e&&n.__rowSpan>1;){if(s-=l.__colSpan,!(s>=0)){d.append(h(o));continue e}{const{cell:e,startRow:o}=t[s];n=e,r=o;}}n.insertAfter(h(o));}else l.setColSpan(l.__colSpan+1);}null!==u&&n&&dt(u);const f=o.getColWidths();if(f){const e=[...f],t=c<0?0:c,n=e[t];e.splice(t,0,n),o.setColWidths(e);}return u}function ct(){const e=$r();wr(e)||Rt(e)||We$1(188);const[t,n]=e.isBackward()?[e.focus.getNode(),e.anchor.getNode()]:[e.anchor.getNode(),e.focus.getNode()],[o,,r]=wt(t),[l]=wt(n),[s,i,c]=_t(r,o,l),{startRow:a}=i,{startRow:u}=c,h=u+l.__rowSpan-1;if(s.length===h-a+1)return void r.remove();const d=s[0].length,f=s[h+1],g=r.getChildAtIndex(h+1);for(let e=h;e>=a;e--){for(let t=d-1;t>=0;t--){const{cell:n,startRow:o,startColumn:r}=s[e][t];if(r===t){if(o<a||o+n.__rowSpan-1>h){const e=Math.max(o,a),t=Math.min(n.__rowSpan+o-1,h),r=e<=t?t-e+1:0;n.setRowSpan(n.__rowSpan-r);}if(o>=a&&o+n.__rowSpan-1>h&&e===h){null===g&&We$1(122);let o=null;for(let n=0;n<t;n++){const t=f[n],r=t.cell;t.startRow===e+1&&(o=r),r.__colSpan>1&&(n+=r.__colSpan-1);}null===o?ft(g,n):o.insertAfter(n);}}}const t=r.getChildAtIndex(e);Be$1(t)||We$1(206,String(e)),t.remove();}if(void 0!==f){const{cell:e}=f[0];dt(e);}else {const e=s[a-1],{cell:t}=e[0];dt(t);}}function ut(){const e=$r();wr(e)||Rt(e)||We$1(188);const t=e.anchor.getNode(),n=e.focus.getNode(),[o,,r]=wt(t),[l]=wt(n),[s,i,c]=_t(r,o,l),{startColumn:a}=i,{startRow:u,startColumn:h}=c,d=Math.min(a,h),f=Math.max(a+o.__colSpan-1,h+l.__colSpan-1),g=f-d+1;if(s[0].length===f-d+1)return r.selectPrevious(),void r.remove();const p=s.length;for(let e=0;e<p;e++)for(let t=d;t<=f;t++){const{cell:n,startColumn:o}=s[e][t];if(o<d){if(t===d){const e=d-o;n.setColSpan(n.__colSpan-Math.min(g,n.__colSpan-e));}}else if(o+n.__colSpan-1>f){if(t===f){const e=f-o+1;n.setColSpan(n.__colSpan-e);}}else n.remove();}const m=s[u],C=a>h?m[a+o.__colSpan]:m[h+l.__colSpan];if(void 0!==C){const{cell:e}=C;dt(e);}else {const e=h<a?m[h-1]:m[a-1],{cell:t}=e;dt(t);}const _=r.getColWidths();if(_){const e=[..._];e.splice(d,g),r.setColWidths(e);}}function dt(e){const t=e.getFirstDescendant();null==t?e.selectStart():t.getParentOrThrow().selectStart();}function ft(e,t){const n=e.getFirstChild();null!==n?n.insertBefore(t):e.append(t);}function gt(e){if(0===e.length)return null;const t=Xe$1(e[0]),[n]=St(t,null,null);let o=1/0,r=-1/0,l=1/0,s=-1/0;const i=new Set;for(const t of n)for(const n of t){if(!n||!n.cell)continue;const t=n.cell.getKey();if(!i.has(t)&&e.some(e=>e.is(n.cell))){i.add(t);const e=n.startRow,c=n.startColumn,a=n.cell.__rowSpan||1,u=n.cell.__colSpan||1;o=Math.min(o,e),r=Math.max(r,e+a-1),l=Math.min(l,c),s=Math.max(s,c+u-1);}}if(o===1/0||l===1/0)return null;const c=r-o+1,a=s-l+1,u=n[o][l];if(!u.cell)return null;const h=u.cell;h.setColSpan(a),h.setRowSpan(c);const d=new Set([h.getKey()]);for(let e=o;e<=r;e++)for(let t=l;t<=s;t++){const o=n[e][t];if(!o.cell)continue;const r=o.cell,l=r.getKey();if(!d.has(l)){d.add(l);pt(r)||h.append(...r.getChildren()),r.remove();}}return 0===h.getChildrenSize()&&h.append(Vi()),h}function pt(e){if(1!==e.getChildrenSize())return  false;const t=e.getFirstChildOrThrow();return !(!Yi(t)||!t.isEmpty())}function Ct(e){const[t,n,o]=wt(e),r=t.__colSpan,l=t.__rowSpan;if(1===r&&1===l)return;const[s,i]=_t(o,t,t),{startColumn:c,startRow:a}=i,u=t.__headerState&Ae$1.COLUMN,h=Array.from({length:r},(e,t)=>{let n=u;for(let e=0;0!==n&&e<s.length;e++)n&=s[e][t+c].cell.__headerState;return n}),d=t.__headerState&Ae$1.ROW,f=Array.from({length:l},(e,t)=>{let n=d;for(let e=0;0!==n&&e<s[0].length;e++)n&=s[t+a][e].cell.__headerState;return n});if(r>1){for(let e=1;e<r;e++)t.insertAfter(Ee$1(h[e]|f[0]).append(Vi()));t.setColSpan(1);}if(l>1){let e;for(let t=1;t<l;t++){const o=a+t,l=s[o];e=(e||n).getNextSibling(),Be$1(e)||We$1(125);let i=null;for(let e=0;e<c;e++){const t=l[e],n=t.cell;t.startRow===o&&(i=n),n.__colSpan>1&&(e+=n.__colSpan-1);}if(null===i)for(let n=r-1;n>=0;n--)ft(e,Ee$1(h[n]|f[t]).append(Vi()));else for(let e=r-1;e>=0;e--)i.insertAfter(Ee$1(h[e]|f[t]).append(Vi()));}t.setRowSpan(1);}}function _t(e,t,n){const[o,r,l]=St(e,t,n);return null===r&&We$1(207),null===l&&We$1(208),[o,r,l]}function St(e,t,n){const o=[];let r=null,l=null;function s(e){let t=o[e];return void 0===t&&(o[e]=t=[]),t}const i=e.getChildren();for(let e=0;e<i.length;e++){const o=i[e];Be$1(o)||We$1(209);const c=s(e);for(let a=o.getFirstChild(),u=0;null!=a;a=a.getNextSibling()){for(Me$1(a)||We$1(147);void 0!==c[u];)u++;const o={cell:a,startColumn:u,startRow:e},{__rowSpan:h,__colSpan:d}=a;for(let t=0;t<h&&!(e+t>=i.length);t++){const n=s(e+t);for(let e=0;e<d;e++)n[u+e]=o;}null!==t&&null===r&&t.is(a)&&(r=o),null!==n&&null===l&&n.is(a)&&(l=o);}}return [o,r,l]}function wt(e){let t;if(e instanceof Ke$1)t=e;else if("__type"in e){const o=qs(e,Me$1);Me$1(o)||We$1(148),t=o;}else {const o=qs(e.getNode(),Me$1);Me$1(o)||We$1(148),t=o;}const o=t.getParent();Be$1(o)||We$1(149);const r=o.getParent();return yn(r)||We$1(210),[t,o,r]}function bt(e,t,n){let o,r=Math.min(t.startColumn,n.startColumn),l=Math.min(t.startRow,n.startRow),s=Math.max(t.startColumn+t.cell.__colSpan-1,n.startColumn+n.cell.__colSpan-1),i=Math.max(t.startRow+t.cell.__rowSpan-1,n.startRow+n.cell.__rowSpan-1);do{o=false;for(let t=0;t<e.length;t++)for(let n=0;n<e[0].length;n++){const c=e[t][n];if(!c)continue;const a=c.startColumn+c.cell.__colSpan-1,u=c.startRow+c.cell.__rowSpan-1,h=c.startColumn<=s&&a>=r,d=c.startRow<=i&&u>=l;if(h&&d){const e=Math.min(r,c.startColumn),t=Math.max(s,a),n=Math.min(l,c.startRow),h=Math.max(i,u);e===r&&t===s&&n===l&&h===i||(r=e,s=t,l=n,i=h,o=true);}}}while(o);return {maxColumn:s,maxRow:i,minColumn:r,minRow:l}}function vt(e){const[t,,n]=wt(e),o=n.getChildren(),r=o.length,l=o[0].getChildren().length,s=new Array(r);for(let e=0;e<r;e++)s[e]=new Array(l);for(let e=0;e<r;e++){const n=o[e].getChildren();let r=0;for(let o=0;o<n.length;o++){for(;s[e][r];)r++;const l=n[o],i=l.__rowSpan||1,c=l.__colSpan||1;for(let t=0;t<i;t++)for(let n=0;n<c;n++)s[e+t][r+n]=l;if(t===l)return {colSpan:c,columnIndex:r,rowIndex:e,rowSpan:i};r+=c;}}return null}function xt(e){const[[t,o,r,l],[s,i,c,a]]=["anchor","focus"].map(t=>{const o=e[t].getNode(),r=qs(o,Me$1);Me$1(r)||We$1(238,t,o.getKey(),o.getType());const l=r.getParent();Be$1(l)||We$1(239,t);const s=l.getParent();return yn(s)||We$1(240,t),[o,r,l,s]});return l.is(a)||We$1(241),{anchorCell:o,anchorNode:t,anchorRow:r,anchorTable:l,focusCell:i,focusNode:s,focusRow:c,focusTable:a}}class Tt{tableKey;anchor;focus;_cachedNodes;dirty;constructor(e,t,n){this.anchor=t,this.focus=n,t._selection=this,n._selection=this,this._cachedNodes=null,this.dirty=false,this.tableKey=e;}getStartEndPoints(){return [this.anchor,this.focus]}isValid(){if("root"===this.tableKey||"root"===this.anchor.key||"element"!==this.anchor.type||"root"===this.focus.key||"element"!==this.focus.type)return  false;const e=Mo(this.tableKey),t=Mo(this.anchor.key),n=Mo(this.focus.key);return null!==e&&null!==t&&null!==n}isBackward(){return this.focus.isBefore(this.anchor)}getCachedNodes(){return this._cachedNodes}setCachedNodes(e){this._cachedNodes=e;}is(e){return Rt(e)&&this.tableKey===e.tableKey&&this.anchor.is(e.anchor)&&this.focus.is(e.focus)}set(e,t,n){this.dirty=this.dirty||e!==this.tableKey||t!==this.anchor.key||n!==this.focus.key,this.tableKey=e,this.anchor.key=t,this.focus.key=n,this._cachedNodes=null;}clone(){return new Tt(this.tableKey,Tr(this.anchor.key,this.anchor.offset,this.anchor.type),Tr(this.focus.key,this.focus.offset,this.focus.type))}isCollapsed(){return  false}extract(){return this.getNodes()}insertRawText(e){}insertText(){}hasFormat(e){let t=0;this.getNodes().filter(Me$1).forEach(e=>{const n=e.getFirstChild();Yi(n)&&(t|=n.getTextFormat());});const n=z$5[e];return 0!==(t&n)}insertNodes(e){const t=this.focus.getNode();Pi(t)||We$1(151);Ct$4(t.select(0,t.getChildrenSize())).insertNodes(e);}getShape(){const{anchorCell:e,focusCell:t}=xt(this),n=vt(e);null===n&&We$1(153);const o=vt(t);null===o&&We$1(155);const r=Math.min(n.columnIndex,o.columnIndex),l=Math.max(n.columnIndex+n.colSpan-1,o.columnIndex+o.colSpan-1),s=Math.min(n.rowIndex,o.rowIndex),i=Math.max(n.rowIndex+n.rowSpan-1,o.rowIndex+o.rowSpan-1);return {fromX:Math.min(r,l),fromY:Math.min(s,i),toX:Math.max(r,l),toY:Math.max(s,i)}}getNodes(){if(!this.isValid())return [];const e=this._cachedNodes;if(null!==e)return e;const{anchorTable:t,anchorCell:n,focusCell:o}=xt(this),r=o.getParents()[1];if(r!==t){if(t.isParentOf(o)){const e=r.getParent();null==e&&We$1(159),this.set(this.tableKey,o.getKey(),e.getKey());}else {const e=t.getParent();null==e&&We$1(158),this.set(this.tableKey,e.getKey(),o.getKey());}return this.getNodes()}const[l,s,i]=_t(t,n,o),{minColumn:c,maxColumn:a,minRow:u,maxRow:h}=bt(l,s,i),d=new Map([[t.getKey(),t]]);let f=null;for(let e=u;e<=h;e++)for(let t=c;t<=a;t++){const{cell:n}=l[e][t],o=n.getParent();Be$1(o)||We$1(160),o!==f&&(d.set(o.getKey(),o),f=o),d.has(n.getKey())||Kt(n,e=>{d.set(e.getKey(),e);});}const g=Array.from(d.values());return fi()||(this._cachedNodes=g),g}getTextContent(){const e=this.getNodes().filter(e=>Me$1(e));let t="";for(let n=0;n<e.length;n++){const o=e[n],r=o.__parent,l=(e[n+1]||{}).__parent;t+=o.getTextContent()+(l!==r?"\n":"\t");}return t}}function Rt(e){return e instanceof Tt}function Ft(){const e=Tr("root",0,"element"),t=Tr("root",0,"element");return new Tt("root",e,t)}function At(e,t,n){e.getKey(),t.getKey(),n.getKey();const o=$r(),r=Rt(o)?o.clone():Ft();return r.set(e.getKey(),t.getKey(),n.getKey()),r}function Kt(e,t){const n=[[e]];for(let e=n.at(-1);void 0!==e&&n.length>0;e=n.at(-1)){const o=e.pop();void 0===o?n.pop():false!==t(o)&&Pi(o)&&n.push(o.getChildren());}}function Ot(e,t=Is()){const n=Mo(e);yn(n)||We$1(231,e);const o=$t(n,t.getElementByKey(e));return null===o&&We$1(232,e),{tableElement:o,tableNode:n}}class kt{focusX;focusY;listenersToRemove;table;isHighlightingCells;anchorX;anchorY;tableNodeKey;anchorCell;focusCell;anchorCellNodeKey;focusCellNodeKey;editor;tableSelection;hasHijackedSelectionStyles;isSelecting;pointerType;shouldCheckSelection;abortController;listenerOptions;nextFocus;constructor(e,t){this.isHighlightingCells=false,this.anchorX=-1,this.anchorY=-1,this.focusX=-1,this.focusY=-1,this.listenersToRemove=new Set,this.tableNodeKey=t,this.editor=e,this.table={columns:0,domRows:[],rows:0},this.tableSelection=null,this.anchorCellNodeKey=null,this.focusCellNodeKey=null,this.anchorCell=null,this.focusCell=null,this.hasHijackedSelectionStyles=false,this.isSelecting=false,this.pointerType=null,this.shouldCheckSelection=false,this.abortController=new AbortController,this.listenerOptions={signal:this.abortController.signal},this.nextFocus=null,this.trackTable();}getTable(){return this.table}removeListeners(){this.abortController.abort("removeListeners"),Array.from(this.listenersToRemove).forEach(e=>e()),this.listenersToRemove.clear();}$lookup(){return Ot(this.tableNodeKey,this.editor)}trackTable(){const e=new MutationObserver(e=>{this.editor.getEditorState().read(()=>{let t=false;for(let n=0;n<e.length;n++){const o=e[n].target.nodeName;if("TABLE"===o||"TBODY"===o||"THEAD"===o||"TR"===o){t=true;break}}if(!t)return;const{tableNode:n,tableElement:o}=this.$lookup();this.table=Jt(n,o);},{editor:this.editor});});this.editor.getEditorState().read(()=>{const{tableNode:t,tableElement:n}=this.$lookup();this.table=Jt(t,n),e.observe(n,{attributes:true,childList:true,subtree:true});},{editor:this.editor});}$clearHighlight(){const e=this.editor;this.isHighlightingCells=false,this.anchorX=-1,this.anchorY=-1,this.focusX=-1,this.focusY=-1,this.tableSelection=null,this.anchorCellNodeKey=null,this.focusCellNodeKey=null,this.anchorCell=null,this.focusCell=null,this.hasHijackedSelectionStyles=false,this.$enableHighlightStyle();const{tableNode:t,tableElement:n}=this.$lookup();Yt(e,Jt(t,n),null),null!==$r()&&(zo(null),e.dispatchCommand(re$2,void 0));}$enableHighlightStyle(){const e=this.editor,{tableElement:t}=this.$lookup();tc(t,e._config.theme.tableSelection),t.classList.remove("disable-selection"),this.hasHijackedSelectionStyles=false;}$disableHighlightStyle(){const{tableElement:t}=this.$lookup();Zl(t,this.editor._config.theme.tableSelection),this.hasHijackedSelectionStyles=true;}$updateTableTableSelection(e){if(null!==e){e.tableKey!==this.tableNodeKey&&We$1(233,e.tableKey,this.tableNodeKey);const t=this.editor;this.tableSelection=e,this.isHighlightingCells=true,this.$disableHighlightStyle(),this.updateDOMSelection(),Yt(t,this.table,this.tableSelection);}else this.$clearHighlight();}setShouldCheckSelection(){this.shouldCheckSelection=true;}getAndClearShouldCheckSelection(){return !!this.shouldCheckSelection&&(this.shouldCheckSelection=false,true)}setNextFocus(e){this.nextFocus=e;}getAndClearNextFocus(){const{nextFocus:e}=this;return null!==e&&(this.nextFocus=null),e}updateDOMSelection(){if(null!==this.anchorCell&&null!==this.focusCell){const e=bs(this.editor._window);e&&e.rangeCount>0&&e.removeAllRanges();}}$setFocusCellForSelection(e,t=false){const n=this.editor,{tableNode:o}=this.$lookup(),r=e.x,l=e.y;if(this.focusCell=e,!this.isHighlightingCells){(t||this.anchorX!==r||this.anchorY!==l||null!=this.tableSelection&&null!=this.anchorCellNodeKey)&&(this.isHighlightingCells=true,this.$disableHighlightStyle());}if(-1!==this.focusX&&-1!==this.focusY&&r===this.focusX&&l===this.focusY)return  false;if(this.focusX=r,this.focusY=l,this.isHighlightingCells){const s=fn(o,e.elem);if(null!=this.tableSelection&&null!=this.anchorCellNodeKey){let e=s;if(null===e&&t&&(e=o.getCellNodeFromCords(r,l,this.table)),null!==e){const t=this.$getAnchorTableCellOrThrow();return this.focusCellNodeKey=e.getKey(),this.tableSelection=At(o,t,e),zo(this.tableSelection),n.dispatchCommand(re$2,void 0),Yt(n,this.table,this.tableSelection),true}}}return  false}$getAnchorTableCell(){return this.anchorCellNodeKey?Mo(this.anchorCellNodeKey):null}$getAnchorTableCellOrThrow(){const e=this.$getAnchorTableCell();return null===e&&We$1(234),e}$getFocusTableCell(){return this.focusCellNodeKey?Mo(this.focusCellNodeKey):null}$getFocusTableCellOrThrow(){const e=this.$getFocusTableCell();return null===e&&We$1(235),e}$setAnchorCellForSelection(e){this.isHighlightingCells=false,this.anchorCell=e,this.anchorX=e.x,this.anchorY=e.y,this.focusX=-1,this.focusY=-1,this.focusCell=null,this.focusCellNodeKey=null;const{tableNode:t}=this.$lookup(),n=fn(t,e.elem);if(null!==n){const e=n.getKey();null!=this.tableSelection?(this.tableSelection=this.tableSelection.clone(),this.tableSelection.set(t.getKey(),e,e)):this.tableSelection=At(t,n,n),this.anchorCellNodeKey=e;}}$formatCells(e){const t=$r();Rt(t)||We$1(236);const n=Wr(),o=n.anchor,r=n.focus,l=t.getNodes().filter(Me$1);l.length>0||We$1(237);const s=l[0].getFirstChild(),i=Yi(s)?s.getFormatFlags(e,null):null;l.forEach(t=>{o.set(t.getKey(),0,"element"),r.set(t.getKey(),t.getChildrenSize(),"element"),n.formatText(e,i);}),zo(t),this.editor.dispatchCommand(re$2,void 0);}$clearText(){const{editor:e}=this,t=Mo(this.tableNodeKey);if(!yn(t))throw new Error("Expected TableNode.");const n=$r();Rt(n)||We$1(253);const o=n.getNodes().filter(Me$1),r=t.getFirstChild(),l=t.getLastChild();if(o.length>0&&null!==r&&null!==l&&Be$1(r)&&Be$1(l)&&o[0]===r.getFirstChild()&&o[o.length-1]===l.getLastChild()){t.selectPrevious();const n=t.getParent();return t.remove(),void(Ki(n)&&n.isEmpty()&&e.dispatchCommand(de$2,void 0))}o.forEach(e=>{if(Pi(e)){const t=Vi(),n=pr();t.append(n),e.append(t),e.getChildren().forEach(e=>{e!==t&&e.remove();});}}),Yt(e,this.table,null),zo(null),e.dispatchCommand(re$2,void 0);}}const Et="__lexicalTableSelection";function Mt(e){return Ms(e)&&"TABLE"===e.nodeName}function $t(e,t){if(!t)return t;const n=Mt(t)?t:e.getDOMSlot(t).element;return "TABLE"!==n.nodeName&&We$1(245,t.nodeName),n}function Wt(e){return e._window}function zt(e,t){for(let n=t,o=null;null!==n;n=n.getParent()){if(e.is(n))return o;Me$1(n)&&(o=n);}return null}const Ht=[[we$1,"down"],[be$2,"up"],[ke$3,"backward"],[ve$1,"forward"]],Lt=[pe$2,ye$1,ue$2],Bt=[Me$2,Pe$2];function Pt(e,t,o,l){const s=o.getRootElement(),i=Wt(o);null!==s&&null!==i||We$1(246);const c=new kt(o,e.getKey()),a=$t(e,t);!function(e,t){null!==Dt(e)&&We$1(205);e[Et]=t;}(a,c),c.listenersToRemove.add(()=>function(e,t){Dt(e)===t&&delete e[Et];}(a,c));const u=t=>{if(c.pointerType=t.pointerType,0!==t.button||!As(t.target)||!i)return;const n=It(t.target);null!==n&&o.update(()=>{const o=Vr();if(Ie$1&&t.shiftKey&&en(o,e)&&(wr(o)||Rt(o))){const r=o.anchor.getNode(),l=zt(e,o.anchor.getNode());if(l)c.$setAnchorCellForSelection(dn(c,l)),c.$setFocusCellForSelection(n),an(t);else {(e.isBefore(r)?e.selectStart():e.selectEnd()).anchor.set(o.anchor.key,o.anchor.offset,o.anchor.type);}}else "touch"!==t.pointerType&&c.$setAnchorCellForSelection(n);}),(e=>{if(c.isSelecting)return;c.isSelecting=true,null!==e&&null===c.anchorCell&&o.update(()=>{c.$setAnchorCellForSelection(e);});const t=()=>{c.isSelecting=false,i.removeEventListener("pointerup",t),i.removeEventListener("pointermove",n);},n=e=>{if(1&~e.buttons&&c.isSelecting)return c.isSelecting=false,i.removeEventListener("pointerup",t),void i.removeEventListener("pointermove",n);if(!As(e.target))return;let r=null;const l=!(Ie$1||a.contains(e.target));if(l)r=Ut(a,e.target);else for(const t of document.elementsFromPoint(e.clientX,e.clientY))if(r=Ut(a,t),r)break;if(r){const e=r;null===c.anchorCell&&o.update(()=>{c.$setAnchorCellForSelection(e);}),null!==c.focusCell&&r.elem===c.focusCell.elem||(c.setNextFocus({focusCell:r,override:l}),o.dispatchCommand(re$2,void 0));}};i.addEventListener("pointerup",t,c.listenerOptions),i.addEventListener("pointermove",n,c.listenerOptions);})(n);};a.addEventListener("pointerdown",u,c.listenerOptions),c.listenersToRemove.add(()=>{a.removeEventListener("pointerdown",u);});const h=e=>{if(e.detail>=3&&As(e.target)){null!==It(e.target)&&e.preventDefault();}};a.addEventListener("mousedown",h,c.listenerOptions),c.listenersToRemove.add(()=>{a.removeEventListener("mousedown",h);});const d=e=>{const t=e.target;0===e.button&&As(t)&&o.update(()=>{const e=$r();Rt(e)&&e.tableKey===c.tableNodeKey&&s.contains(t)&&c.$clearHighlight();});};i.addEventListener("pointerdown",d,c.listenerOptions),c.listenersToRemove.add(()=>{i.removeEventListener("pointerdown",d);});for(const[t,n]of Ht)c.listenersToRemove.add(o.registerCommand(t,t=>cn(o,t,n,e,c),Xi));c.listenersToRemove.add(o.registerCommand(Ae$2,t=>{const n=$r();if(Rt(n)){const o=zt(e,n.focus.getNode());if(null!==o)return an(t),o.selectEnd(),true}return  false},Xi));const f=t=>()=>{const o=$r();if(!en(o,e))return  false;if(Rt(o))return c.$clearText(),true;if(wr(o)){if(!Me$1(zt(e,o.anchor.getNode())))return  false;const r=o.anchor.getNode(),l=o.focus.getNode(),s=e.isParentOf(r),i=e.isParentOf(l);if(s&&!i||i&&!s)return c.$clearText(),true;const a=qs(o.anchor.getNode(),e=>Pi(e)),u=a&&qs(a,e=>Pi(e)&&Me$1(e.getParent()));if(!Pi(u)||!Pi(a))return  false;if(t===ye$1&&null===u.getPreviousSibling())return  true}return  false};for(const e of Lt)c.listenersToRemove.add(o.registerCommand(e,f(e),Xi));const g=t=>{const n=$r();if(!Rt(n)&&!wr(n))return  false;const o=e.isParentOf(n.anchor.getNode());if(o!==e.isParentOf(n.focus.getNode())){const t=o?"anchor":"focus",r=o?"focus":"anchor",{key:l,offset:s,type:i}=n[r];return e[n[t].isBefore(n[r])?"selectPrevious":"selectNext"]()[r].set(l,s,i),false}return !!en(n,e)&&(!!Rt(n)&&(t&&(t.preventDefault(),t.stopPropagation()),c.$clearText(),true))};for(const e of Bt)c.listenersToRemove.add(o.registerCommand(e,g,Xi));return c.listenersToRemove.add(o.registerCommand(je$1,e=>{const t=$r();if(t){if(!Rt(t)&&!wr(t))return  false;F$1(o,At$5(e,ClipboardEvent)?e:null,_$1(t));const n=g(e);return wr(t)?(t.removeText(),true):n}return  false},Xi)),c.listenersToRemove.add(o.registerCommand(me$2,t=>{const o=$r();if(!en(o,e))return  false;if(Rt(o))return c.$formatCells(t),true;if(wr(o)){const e=qs(o.anchor.getNode(),e=>Me$1(e));if(!Me$1(e))return  false}return  false},Xi)),c.listenersToRemove.add(o.registerCommand(ze$2,t=>{const n=$r();if(!Rt(n)||!en(n,e))return  false;const o=n.anchor.getNode(),r=n.focus.getNode();if(!Me$1(o)||!Me$1(r))return  false;if(function(e,t){if(Rt(e)){const n=e.anchor.getNode(),o=e.focus.getNode();if(t&&n&&o){const[e]=_t(t,n,o);return n.getKey()===e[0][0].cell.getKey()&&o.getKey()===e[e.length-1].at(-1).cell.getKey()}}return  false}(n,e))return e.setFormat(t),true;const[l,s,i]=_t(e,o,r),c=Math.max(s.startRow+s.cell.__rowSpan-1,i.startRow+i.cell.__rowSpan-1),a=Math.max(s.startColumn+s.cell.__colSpan-1,i.startColumn+i.cell.__colSpan-1),u=Math.min(s.startRow,i.startRow),h=Math.min(s.startColumn,i.startColumn),d=new Set;for(let e=u;e<=c;e++)for(let n=h;n<=a;n++){const o=l[e][n].cell;if(d.has(o))continue;d.add(o),o.setFormat(t);const r=o.getChildren();for(let e=0;e<r.length;e++){const n=r[e];Pi(n)&&!n.isInline()&&n.setFormat(t);}}return  true},Xi)),c.listenersToRemove.add(o.registerCommand(he$2,t=>{const r=$r();if(!en(r,e))return  false;if(Rt(r))return c.$clearHighlight(),false;if(wr(r)){const l=qs(r.anchor.getNode(),e=>Me$1(e));if(!Me$1(l))return  false;if("string"==typeof t){const n=hn(o,r,e);if(n)return un(n,e,[pr(t)]),true}}return  false},Xi)),l&&c.listenersToRemove.add(o.registerCommand(De$2,t=>{const o=$r();if(!wr(o)||!o.isCollapsed()||!en(o,e))return  false;const r=rn(o.anchor.getNode());return !(null===r||!e.is(ln(r)))&&(an(t),function(e,t){const o="next"===t?"getNextSibling":"getPreviousSibling",r="next"===t?"getFirstChild":"getLastChild",l=e[o]();if(Pi(l))return l.selectEnd();const s=qs(e,Be$1);null===s&&We$1(247);for(let e=s[o]();Be$1(e);e=e[o]()){const t=e[r]();if(Pi(t))return t.selectEnd()}const i=qs(s,yn);null===i&&We$1(248);"next"===t?i.selectNext():i.selectPrevious();}(r,t.shiftKey?"previous":"next"),true)},Xi)),c.listenersToRemove.add(o.registerCommand(He$2,t=>e.isSelected(),Xi)),c.listenersToRemove.add(o.registerCommand(re$2,()=>{const t=$r(),r=Vr(),l=c.getAndClearNextFocus();if(null!==l){const{focusCell:e}=l;if(Rt(t)&&t.tableKey===c.tableNodeKey)return (e.x!==c.focusX||e.y!==c.focusY)&&(c.$setFocusCellForSelection(e),true);if(e!==c.anchorCell&&null!==c.anchorCell&&null!==c.anchorCellNodeKey&&null!==c.tableSelection)return c.$setFocusCellForSelection(e,true),true}if(c.getAndClearShouldCheckSelection()&&wr(r)&&wr(t)&&t.isCollapsed()){const o=t.anchor.getNode(),r=e.getFirstChild(),l=rn(o);if(null!==l&&Be$1(r)){const t=r.getFirstChild();if(Me$1(t)&&e.is(qs(l,n=>n.is(e)||n.is(t))))return t.selectStart(),true}}if(wr(t)){const{anchor:n,focus:l}=t,s=n.getNode(),i=l.getNode(),a=rn(s),u=rn(i),h=!(!a||!e.is(ln(a))),d=!(!u||!e.is(ln(u))),f=h!==d,g=h&&d,p=t.isBackward();if(f){const n=t.clone();if(d){const[t]=_t(e,u,u),o=t[0][0].cell,r=t[t.length-1].at(-1).cell;n.focus.set(p?o.getKey():r.getKey(),p?0:r.getChildrenSize(),"element");}else if(h){const[t]=_t(e,a,a),o=t[0][0].cell,r=t[t.length-1].at(-1).cell;n.anchor.set(p?r.getKey():o.getKey(),p?r.getChildrenSize():0,"element");}zo(n),qt(o,c);}else if(g&&(a.is(u)||(c.$setAnchorCellForSelection(dn(c,a)),c.$setFocusCellForSelection(dn(c,u),true)),"touch"===c.pointerType&&c.isSelecting&&t.isCollapsed()&&wr(r)&&r.isCollapsed())){const e=rn(r.anchor.getNode());e&&!e.is(u)&&(c.$setAnchorCellForSelection(dn(c,e)),c.$setFocusCellForSelection(dn(c,u),true),c.pointerType=null);}}else if(t&&Rt(t)&&t.is(r)&&t.tableKey===e.getKey()){const n=bs(i);if(n&&n.anchorNode&&n.focusNode){const r=Do(n.focusNode),l=r&&!e.isParentOf(r),s=Do(n.anchorNode),i=s&&e.isParentOf(s);if(l&&i&&n.rangeCount>0){const r=jr(n,o);r&&(r.anchor.set(e.getKey(),t.isBackward()?e.getChildrenSize():0,"element"),n.removeAllRanges(),zo(r));}}}return t&&!t.is(r)&&(Rt(t)||Rt(r))&&c.tableSelection&&!c.tableSelection.is(r)?(Rt(t)&&t.tableKey===c.tableNodeKey?c.$updateTableTableSelection(t):!Rt(t)&&Rt(r)&&r.tableKey===c.tableNodeKey&&c.$updateTableTableSelection(null),false):(c.hasHijackedSelectionStyles&&!e.isSelected()?function(e,t){t.$enableHighlightStyle(),Xt(t.table,t=>{const n=t.elem;t.highlighted=false,on(e,t),n.getAttribute("style")||n.removeAttribute("style");});}(o,c):!c.hasHijackedSelectionStyles&&e.isSelected()&&qt(o,c),false)},Xi)),c.listenersToRemove.add(o.registerCommand(de$2,()=>{const t=$r();if(!wr(t)||!t.isCollapsed()||!en(t,e))return  false;const n=hn(o,t,e);return !!n&&(un(n,e),true)},Xi)),c}function Dt(e){return e[Et]||null}function It(e){let t=e;for(;null!=t;){const e=t.nodeName;if("TD"===e||"TH"===e){const e=t._cell;return void 0===e?null:e}t=t.parentNode;}return null}function Ut(e,t){if(!e.contains(t))return null;let n=null;for(let o=t;null!=o;o=o.parentNode){if(o===e)return n;const t=o.nodeName;"TD"!==t&&"TH"!==t||(n=o._cell||null);}return null}function Jt(e,t){const n=[],o={columns:0,domRows:n,rows:0};let r=$t(e,t).querySelector("tr"),l=0,s=0;for(n.length=0;null!=r;){const e=r.nodeName;if("TD"===e||"TH"===e){const e={elem:r,hasBackgroundColor:""!==r.style.backgroundColor,highlighted:false,x:l,y:s};r._cell=e;let t=n[s];void 0===t&&(t=n[s]=[]),t[l]=e;}else {const e=r.firstChild;if(null!=e){r=e;continue}}const t=r.nextSibling;if(null!=t){l++,r=t;continue}const o=r.parentNode;if(null!=o){const e=o.nextSibling;if(null==e)break;s++,l=0,r=e;}}return o.columns=l+1,o.rows=s+1,o}function Yt(e,t,n){const o=new Set(n?n.getNodes():[]);Xt(t,(t,n)=>{const r=t.elem;o.has(n)?(t.highlighted=true,nn(e,t)):(t.highlighted=false,on(e,t),r.getAttribute("style")||r.removeAttribute("style"));});}function Xt(e,t){const{domRows:n}=e;for(let e=0;e<n.length;e++){const o=n[e];if(o)for(let n=0;n<o.length;n++){const r=o[n];if(!r)continue;const l=Do(r.elem);null!==l&&t(r,l,{x:n,y:e});}}}function qt(e,t){t.$disableHighlightStyle(),Xt(t.table,t=>{t.highlighted=true,nn(e,t);});}const Vt=(e,t,n,o,r)=>{const l="forward"===r;switch(r){case "backward":case "forward":return n!==(l?e.table.columns-1:0)?tn(t.getCellNodeFromCordsOrThrow(n+(l?1:-1),o,e.table),l):o!==(l?e.table.rows-1:0)?tn(t.getCellNodeFromCordsOrThrow(l?0:e.table.columns-1,o+(l?1:-1),e.table),l):l?t.selectNext():t.selectPrevious(),true;case "up":return 0!==o?tn(t.getCellNodeFromCordsOrThrow(n,o-1,e.table),false):t.selectPrevious(),true;case "down":return o!==e.table.rows-1?tn(t.getCellNodeFromCordsOrThrow(n,o+1,e.table),true):t.selectNext(),true;default:return  false}};function jt(e,t){let n,o;if(t.startColumn===e.minColumn)n="minColumn";else {if(t.startColumn+t.cell.__colSpan-1!==e.maxColumn)return null;n="maxColumn";}if(t.startRow===e.minRow)o="minRow";else {if(t.startRow+t.cell.__rowSpan-1!==e.maxRow)return null;o="maxRow";}return [n,o]}function Gt([e,t]){return ["minColumn"===e?"maxColumn":"minColumn","minRow"===t?"maxRow":"minRow"]}function Qt(e,t,[n,o]){const r=t[o],l=e[r];void 0===l&&We$1(250,o,String(r));const s=t[n],i=l[s];return void 0===i&&We$1(250,n,String(s)),i}function Zt(e,t,n,o,r){const l=bt(t,n,o),s=function(e,t){const{minColumn:n,maxColumn:o,minRow:r,maxRow:l}=t;let s=1,i=1,c=1,a=1;const u=e[r],h=e[l];for(let e=n;e<=o;e++)s=Math.max(s,u[e].cell.__rowSpan),a=Math.max(a,h[e].cell.__rowSpan);for(let t=r;t<=l;t++)i=Math.max(i,e[t][n].cell.__colSpan),c=Math.max(c,e[t][o].cell.__colSpan);return {bottomSpan:a,leftSpan:i,rightSpan:c,topSpan:s}}(t,l),{topSpan:i,leftSpan:c,bottomSpan:a,rightSpan:u}=s,h=function(e,t){const n=jt(e,t);return null===n&&We$1(249,t.cell.getKey()),n}(l,n),[d,f]=Gt(h);let g=l[d],p=l[f];"forward"===r?g+="maxColumn"===d?1:c:"backward"===r?g-="minColumn"===d?1:u:"down"===r?p+="maxRow"===f?1:i:"up"===r&&(p-="minRow"===f?1:a);const m=t[p];if(void 0===m)return  false;const C=m[g];if(void 0===C)return  false;const[_,S]=function(e,t,n){const o=bt(e,t,n),r=jt(o,t);if(r)return [Qt(e,o,r),Qt(e,o,Gt(r))];const l=jt(o,n);if(l)return [Qt(e,o,Gt(l)),Qt(e,o,l)];const s=["minColumn","minRow"];return [Qt(e,o,s),Qt(e,o,Gt(s))]}(t,n,C),w=dn(e,_.cell),b=dn(e,S.cell);return e.$setAnchorCellForSelection(w),e.$setFocusCellForSelection(b,true),true}function en(e,t){if(wr(e)||Rt(e)){const n=t.isParentOf(e.anchor.getNode()),o=t.isParentOf(e.focus.getNode());return n&&o}return  false}function tn(e,t){t?e.selectStart():e.selectEnd();}function nn(t,n){const o=n.elem,r=t._config.theme;Me$1(Do(o))||We$1(131),Zl(o,r.tableCellSelected);}function on(e,t){const n=t.elem;Me$1(Do(n))||We$1(131);const r=e._config.theme;tc(n,r.tableCellSelected);}function rn(e){const t=qs(e,Me$1);return Me$1(t)?t:null}function ln(e){const t=qs(e,yn);return yn(t)?t:null}function sn(e,t,o,r,l,s,i){const c=Ol(o.focus,l?"previous":"next");if(Rl(c))return  false;let a=c;for(const e of Cl(c).iterNodeCarets("shadowRoot")){if(!ol(e)||!Pi(e.origin))return  false;a=e;}const u=a.getParentAtCaret();if(!Me$1(u))return  false;const h=u,d=function(e){for(const t of Cl(e).iterNodeCarets("root")){const{origin:n}=t;if(Me$1(n)){if(sl(t))return gl(n,e.direction)}else if(!Be$1(n))break}return null}(ul(h,a.direction)),f=qs(h,yn);if(!f||!f.is(s))return  false;const g=e.getElementByKey(h.getKey()),p=It(g);if(!g||!p)return  false;const m=Sn(e,f);if(i.table=m,d)if("extend"===r){const t=It(e.getElementByKey(d.origin.getKey()));if(!t)return  false;i.$setAnchorCellForSelection(p),i.$setFocusCellForSelection(t,true);}else {const e=zl(d);Ml(o.anchor,e),Ml(o.focus,e);}else if("extend"===r)i.$setAnchorCellForSelection(p),i.$setFocusCellForSelection(p,true);else {const e=function(e){const t=pl(e);return sl(t)?zl(t):e}(ul(f,c.direction));Ml(o.anchor,e),Ml(o.focus,e);}return an(t),true}function cn(e,t,o,r,l){if(("up"===o||"down"===o)&&function(e){const t=e.getRootElement();if(!t)return  false;return t.hasAttribute("aria-controls")&&"typeahead-menu"===t.getAttribute("aria-controls")}(e))return  false;const s=$r();if(!en(s,r)){if(wr(s)){if("backward"===o){if(s.focus.offset>0)return  false;const e=function(e){for(let t=e,n=e;null!==n;t=n,n=n.getParent())if(Pi(n)){if(n!==t&&n.getFirstChild()!==t)return null;if(!n.isInline())return n}return null}(s.focus.getNode());if(!e)return  false;const n=e.getPreviousSibling();return !!yn(n)&&(an(t),t.shiftKey?s.focus.set(n.getParentOrThrow().getKey(),n.getIndexWithinParent(),"element"):n.selectEnd(),true)}if(t.shiftKey&&("up"===o||"down"===o)){const e=s.focus.getNode();if(!s.isCollapsed()&&("up"===o&&!s.isBackward()||"down"===o&&s.isBackward())){let l=qs(e,e=>yn(e));if(Me$1(l)&&(l=qs(l,yn)),l!==r)return  false;if(!l)return  false;const i="down"===o?l.getNextSibling():l.getPreviousSibling();if(!i)return  false;let c=0;"up"===o&&Pi(i)&&(c=i.getChildrenSize());let a=i;if("up"===o&&Pi(i)){const e=i.getLastChild();a=e||i,c=yr(a)?a.getTextContentSize():0;}const u=s.clone();return u.focus.set(a.getKey(),c,yr(a)?"text":"element"),zo(u),an(t),true}if(xs(e)){const e="up"===o?s.getNodes()[s.getNodes().length-1]:s.getNodes()[0];if(e){if(null!==zt(r,e)){const e=r.getFirstDescendant(),t=r.getLastDescendant();if(!e||!t)return  false;const[n]=wt(e),[o]=wt(t),s=r.getCordsFromCellNode(n,l.table),i=r.getCordsFromCellNode(o,l.table),c=r.getDOMCellFromCordsOrThrow(s.x,s.y,l.table),a=r.getDOMCellFromCordsOrThrow(i.x,i.y,l.table);return l.$setAnchorCellForSelection(c),l.$setFocusCellForSelection(a,true),true}}return  false}{let r=qs(e,e=>Pi(e)&&!e.isInline());if(Me$1(r)&&(r=qs(r,yn)),!r)return  false;const i="down"===o?r.getNextSibling():r.getPreviousSibling();if(yn(i)&&l.tableNodeKey===i.getKey()){const e=i.getFirstDescendant(),n=i.getLastDescendant();if(!e||!n)return  false;const[r]=wt(e),[l]=wt(n),c=s.clone();return c.focus.set(("up"===o?r:l).getKey(),"up"===o?0:l.getChildrenSize(),"element"),an(t),zo(c),true}}}}return "down"===o&&mn(e)&&l.setShouldCheckSelection(),false}if(wr(s)){if("backward"===o||"forward"===o){return sn(e,t,s,t.shiftKey?"extend":"move","backward"===o,r,l)}if(s.isCollapsed()){const{anchor:i,focus:c}=s,a=qs(i.getNode(),Me$1),u=qs(c.getNode(),Me$1);if(!Me$1(a)||!a.is(u))return  false;const h=ln(a);if(h!==r&&null!=h){const n=$t(h,e.getElementByKey(h.getKey()));if(null!=n)return l.table=Jt(h,n),cn(e,t,o,h,l)}const d=e.getElementByKey(a.__key),f=e.getElementByKey(i.key);if(null==f||null==d)return  false;let g;if("element"===i.type)g=f.getBoundingClientRect();else {const t=bs(Wt(e));if(null===t||0===t.rangeCount)return  false;g=t.getRangeAt(0).getBoundingClientRect();}const p="up"===o?a.getFirstChild():a.getLastChild();if(null==p)return  false;const m=e.getElementByKey(p.__key);if(null==m)return  false;const C=m.getBoundingClientRect();if("up"===o?C.top>g.top-g.height:g.bottom+g.height>C.bottom){an(t);const e=r.getCordsFromCellNode(a,l.table);if(!t.shiftKey)return Vt(l,r,e.x,e.y,o);{const t=r.getDOMCellFromCordsOrThrow(e.x,e.y,l.table);l.$setAnchorCellForSelection(t),l.$setFocusCellForSelection(t,true);}return  true}}}else if(Rt(s)){const{anchor:i,focus:c}=s,a=qs(i.getNode(),Me$1),u=qs(c.getNode(),Me$1),[h]=s.getNodes();yn(h)||We$1(251);const d=$t(h,e.getElementByKey(h.getKey()));if(!Me$1(a)||!Me$1(u)||!yn(h)||null==d)return  false;l.$updateTableTableSelection(s);const f=Jt(h,d),g=r.getCordsFromCellNode(a,f),p=r.getDOMCellFromCordsOrThrow(g.x,g.y,f);if(l.$setAnchorCellForSelection(p),an(t),t.shiftKey){const[e,t,n]=_t(r,a,u);return Zt(l,e,t,n,o)}return u.selectEnd(),true}return  false}function an(e){e.preventDefault(),e.stopImmediatePropagation(),e.stopPropagation();}function un(e,t,n){const o=Vi();"first"===e?t.insertBefore(o):t.insertAfter(o),o.append(...n||[]),o.selectEnd();}function hn(e,t,o){const r=o.getParent();if(!r)return;const l=bs(Wt(e));if(!l)return;const s=l.anchorNode,i=e.getElementByKey(r.getKey()),c=$t(o,e.getElementByKey(o.getKey()));if(!s||!i||!c||!i.contains(s)||c.contains(s))return;const a=qs(t.anchor.getNode(),e=>Me$1(e));if(!a)return;const u=qs(a,e=>yn(e));if(!yn(u)||!u.is(o))return;const[h,d]=_t(o,a,a),f=h[0][0],g=h[h.length-1][h[0].length-1],{startRow:p,startColumn:m}=d,C=p===f.startRow&&m===f.startColumn,_=p===g.startRow&&m===g.startColumn;return C?"first":_?"last":void 0}function dn(e,t){const{tableNode:n}=e.$lookup(),o=n.getCordsFromCellNode(t,e.table);return n.getDOMCellFromCordsOrThrow(o.x,o.y,e.table)}function fn(e,t,n){return zt(e,Do(t,n))}function gn(t,n,r){if(!n.theme.tableAlignment)return;const l=[],s=[];for(const e of ["center","right"]){const t=n.theme.tableAlignment[e];t&&(e===r?s:l).push(t);}tc(t,...l),Zl(t,...s);}const pn=new WeakSet;function mn(e=Is()){return pn.has(e)}function Cn(e,t){pn.add(e);}class _n extends Ai{__rowStriping;__frozenColumnCount;__frozenRowCount;__colWidths;static getType(){return "table"}getColWidths(){return this.getLatest().__colWidths}setColWidths(e){const t=this.getWritable();return t.__colWidths=e,t}static clone(e){return new _n(e.__key)}afterCloneFrom(e){super.afterCloneFrom(e),this.__colWidths=e.__colWidths,this.__rowStriping=e.__rowStriping,this.__frozenColumnCount=e.__frozenColumnCount,this.__frozenRowCount=e.__frozenRowCount;}static importDOM(){return {table:e=>({conversion:wn,priority:1})}}static importJSON(e){return bn().updateFromJSON(e)}updateFromJSON(e){return super.updateFromJSON(e).setRowStriping(e.rowStriping||false).setFrozenColumns(e.frozenColumnCount||0).setFrozenRows(e.frozenRowCount||0).setColWidths(e.colWidths)}constructor(e){super(e),this.__rowStriping=false,this.__frozenColumnCount=0,this.__frozenRowCount=0,this.__colWidths=void 0;}exportJSON(){return {...super.exportJSON(),colWidths:this.getColWidths(),frozenColumnCount:this.__frozenColumnCount?this.__frozenColumnCount:void 0,frozenRowCount:this.__frozenRowCount?this.__frozenRowCount:void 0,rowStriping:this.__rowStriping?this.__rowStriping:void 0}}extractWithChild(e,t,n){return "html"===n}getDOMSlot(e){const t=Mt(e)?e:e.querySelector("table");return Mt(t)||We$1(229),super.getDOMSlot(e).withElement(t).withAfter(t.querySelector("colgroup"))}createDOM(t,n){const o=document.createElement("table");this.__style&&(o.style.cssText=this.__style);const r=document.createElement("colgroup");if(o.appendChild(r),js(r),Zl(o,t.theme.table),this.updateTableElement(null,o,t),mn(n)){const n=document.createElement("div"),r=t.theme.tableScrollableWrapper;return r?Zl(n,r):n.style.cssText="overflow-x: auto;",n.appendChild(o),this.updateTableWrapper(null,n,o,t),n}return o}updateTableWrapper(t,n,r,l){this.__frozenColumnCount!==(t?t.__frozenColumnCount:0)&&function(t,n,r,l){l>0?(Zl(t,r.theme.tableFrozenColumn),n.setAttribute("data-lexical-frozen-column","true")):(tc(t,r.theme.tableFrozenColumn),n.removeAttribute("data-lexical-frozen-column"));}(n,r,l,this.__frozenColumnCount),this.__frozenRowCount!==(t?t.__frozenRowCount:0)&&function(t,n,r,l){l>0?(Zl(t,r.theme.tableFrozenRow),n.setAttribute("data-lexical-frozen-row","true")):(tc(t,r.theme.tableFrozenRow),n.removeAttribute("data-lexical-frozen-row"));}(n,r,l,this.__frozenRowCount);}updateTableElement(t,n,r){this.__style!==(t?t.__style:"")&&(n.style.cssText=this.__style),this.__rowStriping!==(!!t&&t.__rowStriping)&&function(t,n,r){r?(Zl(t,n.theme.tableRowStriping),t.setAttribute("data-lexical-row-striping","true")):(tc(t,n.theme.tableRowStriping),t.removeAttribute("data-lexical-row-striping"));}(n,r,this.__rowStriping),function(e,t,n,o){const r=e.querySelector("colgroup");if(!r)return;const l=[];for(let e=0;e<n;e++){const t=document.createElement("col"),n=o&&o[e];n&&(t.style.width=`${n}px`),l.push(t);}r.replaceChildren(...l);}(n,0,this.getColumnCount(),this.getColWidths()),gn(n,r,this.getFormatType());}updateDOM(e,t,n){const o=this.getDOMSlot(t).element;return t===o===mn()||(Ms(r=t)&&"DIV"===r.nodeName&&this.updateTableWrapper(e,t,o,n),this.updateTableElement(e,o,n),false);var r;}exportDOM(e){const t=super.exportDOM(e),{element:n}=t;return {after:n=>{if(t.after&&(n=t.after(n)),!Mt(n)&&Ms(n)&&(n=n.querySelector("table")),!Mt(n))return null;gn(n,e._config,this.getFormatType());const[o]=St(this,null,null),r=new Map;for(const e of o)for(const t of e){const e=t.cell.getKey();r.has(e)||r.set(e,{colSpan:t.cell.getColSpan(),startColumn:t.startColumn});}const s=new Set;for(const e of n.querySelectorAll(":scope > tr > [data-temporary-table-cell-lexical-key]")){const t=e.getAttribute("data-temporary-table-cell-lexical-key");if(t){const n=r.get(t);if(e.removeAttribute("data-temporary-table-cell-lexical-key"),n){r.delete(t);for(let e=0;e<n.colSpan;e++)s.add(e+n.startColumn);}}}const i=n.querySelector(":scope > colgroup");if(i){const e=Array.from(n.querySelectorAll(":scope > colgroup > col")).filter((e,t)=>s.has(t));i.replaceChildren(...e);}const c=n.querySelectorAll(":scope > tr");if(c.length>0){const e=document.createElement("tbody");for(const t of c)e.appendChild(t);n.append(e);}return n},element:!Mt(n)&&Ms(n)?n.querySelector("table"):n}}canBeEmpty(){return  false}isShadowRoot(){return  true}getCordsFromCellNode(e,t){const{rows:n,domRows:o}=t;for(let t=0;t<n;t++){const n=o[t];if(null!=n)for(let o=0;o<n.length;o++){const r=n[o];if(null==r)continue;const{elem:l}=r,s=fn(this,l);if(null!==s&&e.is(s))return {x:o,y:t}}}throw new Error("Cell not found in table.")}getDOMCellFromCords(e,t,n){const{domRows:o}=n,r=o[t];if(null==r)return null;const l=r[e<r.length?e:r.length-1];return null==l?null:l}getDOMCellFromCordsOrThrow(e,t,n){const o=this.getDOMCellFromCords(e,t,n);if(!o)throw new Error("Cell not found at cords.");return o}getCellNodeFromCords(e,t,n){const o=this.getDOMCellFromCords(e,t,n);if(null==o)return null;const r=Do(o.elem);return Me$1(r)?r:null}getCellNodeFromCordsOrThrow(e,t,n){const o=this.getCellNodeFromCords(e,t,n);if(!o)throw new Error("Node at cords not TableCellNode.");return o}getRowStriping(){return Boolean(this.getLatest().__rowStriping)}setRowStriping(e){const t=this.getWritable();return t.__rowStriping=e,t}setFrozenColumns(e){const t=this.getWritable();return t.__frozenColumnCount=e,t}getFrozenColumns(){return this.getLatest().__frozenColumnCount}setFrozenRows(e){const t=this.getWritable();return t.__frozenRowCount=e,t}getFrozenRows(){return this.getLatest().__frozenRowCount}canSelectBefore(){return  true}canIndent(){return  false}getColumnCount(){const e=this.getFirstChild();if(!e)return 0;let t=0;return e.getChildren().forEach(e=>{Me$1(e)&&(t+=e.getColSpan());}),t}}function Sn(e,t){const n=e.getElementByKey(t.getKey());return null===n&&We$1(230),Jt(t,n)}function wn(e){const n=bn();e.hasAttribute("data-lexical-row-striping")&&n.setRowStriping(true),e.hasAttribute("data-lexical-frozen-column")&&n.setFrozenColumns(1),e.hasAttribute("data-lexical-frozen-row")&&n.setFrozenRows(1);const o=e.querySelector(":scope > colgroup");if(o){let e=[];for(const t of o.querySelectorAll(":scope > col")){let n=t.style.width||"";if(!Fe$1.test(n)&&(n=t.getAttribute("width")||"",!/^\d+$/.test(n))){e=void 0;break}e.push(parseFloat(n));}e&&n.setColWidths(e);}return {after:e=>_t$4(e,Be$1),node:n}}function bn(){return Ss(new _n)}function yn(e){return e instanceof _n}function Nn(e){Be$1(e.getParent())?e.isEmpty()&&e.append(Vi()):e.remove();}function vn(e){yn(e.getParent())?Tt$4(e,Me$1):e.remove();}function xn(e){Tt$4(e,Be$1);const[t]=St(e,null,null),n=t.reduce((e,t)=>Math.max(e,t.length),0),o=e.getChildren();for(let e=0;e<t.length;++e){const r=o[e];if(!r)continue;Be$1(r)||We$1(254,r.constructor.name,r.getType());const l=t[e].reduce((e,t)=>t?1+e:e,0);if(l!==n)for(let e=l;e<n;++e){const e=Ee$1();e.append(Vi()),r.append(e);}}const r=e.getColWidths(),l=e.getColumnCount();if(r&&r.length!==l){let t;if(l<r.length)t=r.slice(0,l);else if(r.length>0){const e=r[r.length-1];t=[...r,...Array(l-r.length).fill(e)];}e.setColWidths(t);}}function Tn(e){if(e.detail<3||!As(e.target))return  false;const t=Do(e.target);if(null===t)return  false;const o=qs(t,e=>Pi(e)&&!e.isInline());if(null===o)return  false;return !!Me$1(o.getParent())&&(o.select(0),true)}function Rn(){const e=$r();if(!wr(e))return  false;const t=ln(e.anchor.getNode());if(null===t)return  false;const n=Io();if(!n.is(t.getParent())||1!==n.getChildrenSize())return  false;const[o]=St(t,null,null);if(0===o.length||0===o[0].length)return  false;const r=o[0][0];if(!r||!r.cell)return  false;const l=o[o.length-1],s=l[l.length-1];if(!s||!s.cell)return  false;const i=At(t,r.cell,s.cell);return zo(i),true}function An(e,t=true){const n=new Map,o=(o,r,l)=>{const s=$t(o,l),i=Pt(o,s,e,t);n.set(r,[i,s]);},r=e.registerMutationListener(_n,t=>{e.getEditorState().read(()=>{for(const[e,r]of t){const t=n.get(e);if("created"===r||"updated"===r){const{tableNode:r,tableElement:l}=Ot(e);void 0===t?o(r,e,l):l!==t[1]&&(t[0].removeListeners(),n.delete(e),o(r,e,l));}else "destroyed"===r&&void 0!==t&&(t[0].removeListeners(),n.delete(e));}},{editor:e});},{skipInitialization:false});return ()=>{r();for(const[,[e]]of n)e.removeListeners();}}function Kn(e,t){e.hasNodes([_n])||We$1(255);const{hasNestedTables:o=ot$1(false),hasFitNestedTables:r=ot$1(false)}={};return ec(e.registerCommand($e$1,e=>function({rows:e,columns:t,includeHeaders:n},o){const r=$r()||Vr();if(!r||!wr(r))return  false;if(!o&&ln(r.anchor.getNode()))return  false;const l=Ue$1(Number(e),Number(t),n);xt$3(l);const s=l.getFirstDescendant();return yr(s)&&s.select(),true}(e,o.peek()),qi),e.registerCommand(ie$2,(t,l)=>e===l&&function(e,t,o){const{nodes:r,selection:l}=e;if(!r.some(e=>yn(e)||st$3(e).some(e=>yn(e.node))))return  false;const s=Rt(l),i=wr(l);if(!(i&&null!==qs(l.anchor.getNode(),e=>Me$1(e))&&null!==qs(l.focus.getNode(),e=>Me$1(e))||s))return  false;if(1===r.length&&yn(r[0]))return function(e,t){const o=t.getStartEndPoints(),r=Rt(t);if(null===o)return  false;const[l,s]=o,[i,c,a]=wt(l),u=qs(s.getNode(),e=>Me$1(e));if(!(Me$1(i)&&Me$1(u)&&Be$1(c)&&yn(a)))return  false;const[h,d,f]=_t(a,i,u),[p]=St(e,null,null),C=h.length,_=C>0?h[0].length:0;let S=d.startRow,w=d.startColumn,b=p.length,y=b>0?p[0].length:0;if(r){const e=bt(h,d,f),t=e.maxRow-e.minRow+1,n=e.maxColumn-e.minColumn+1;S=e.minRow,w=e.minColumn,b=Math.min(b,t),y=Math.min(y,n);}let N=false;const v=Math.min(C,S+b)-1,x=Math.min(_,w+y)-1,T=new Set;for(let e=S;e<=v;e++)for(let t=w;t<=x;t++){const n=h[e][t];T.has(n.cell.getKey())||(1===n.cell.__rowSpan&&1===n.cell.__colSpan||(Ct(n.cell),T.add(n.cell.getKey()),N=true));}let[R]=St(a.getWritable(),null,null);const F=b-C+S;for(let e=0;e<F;e++){nt(R[C-1][0].cell);}const A=y-_+w;for(let e=0;e<A;e++){st(R[0][_-1].cell,true,false);}[R]=St(a.getWritable(),null,null);for(let e=S;e<S+b;e++)for(let t=w;t<w+y;t++){const n=e-S,o=t-w,r=p[n][o];if(r.startRow!==n||r.startColumn!==o)continue;const l=r.cell;if(1!==l.__rowSpan||1!==l.__colSpan){const n=[],o=Math.min(e+l.__rowSpan,S+b)-1,r=Math.min(t+l.__colSpan,w+y)-1;for(let l=e;l<=o;l++)for(let e=t;e<=r;e++){const t=R[l][e];n.push(t.cell);}gt(n),N=true;}const{cell:s}=R[e][t],i=l.getBackgroundColor();null!=i&&s.setBackgroundColor(i);const c=s.getChildren();l.getChildren().forEach(e=>{if(yr(e)){Vi().append(e),s.append(e);}else s.append(e);}),c.forEach(e=>e.remove());}if(r&&N){const[e]=St(a.getWritable(),null,null);e[d.startRow][d.startColumn].cell.selectEnd();}return  true}(r[0],l);if(i&&t.peek())return function(e,t,o){const r=Rt(t)&&!t.focus.getNode().is(t.anchor.getNode()),l=wr(t)&&Me$1(t.anchor.getNode())&&!t.anchor.getNode().is(t.focus.getNode());if(r||l)return  true;if(!o)return  false;const s=t.focus.getNode(),i=qs(s,Me$1);if(!i)return  false;const c=On(i);if(void 0===c)return  false;const a=function(e){const t=Is().getElementByKey(e.getKey());if(null===t)return 0;const n=window.getComputedStyle(t),o=n.getPropertyValue("padding-left")||"0px",r=n.getPropertyValue("padding-right")||"0px",l=n.getPropertyValue("border-left-width")||"0px",s=n.getPropertyValue("padding-right-width")||"0px";if(!(Fe$1.test(o)&&Fe$1.test(r)&&Fe$1.test(l)&&Fe$1.test(s)))return 0;const i=parseFloat(o),c=parseFloat(r),a=parseFloat(l),u=parseFloat(s);return i+c+a+u}(i),u=e.filter(yn);for(const e of u)kn(e,c,a);return  false}(r,l,o.peek());return  true}(t,o,r),qi),e.registerCommand(Ue$2,Rn,Hi),e.registerCommand(oe$4,Tn,qi),e.registerNodeTransform(_n,xn),e.registerNodeTransform(ze$1,vn),e.registerNodeTransform(Ke$1,Nn))}function On(e){const t=Xe$1(e),n=vt(e),o=t.getColWidths();if(!n||!o)return;const{columnIndex:r,colSpan:l}=n;let s=0;for(let e=r;e<r+l;e++)s+=o[e];return s}function kn(e,t,n){const o=e.getColWidths();if(!o)return e;const r=t-n,l=o.reduce((e,t)=>e+t,0);if(l<=r)return e;const s=r/l;e.setColWidths(o.map(e=>e*s));const i=e.getChildren().filter(Be$1);for(const e of i){const t=e.getChildren().filter(Me$1);for(const e of t){const t=On(e);if(void 0!==t)for(const o of e.getChildren().filter(yn))kn(o,t,n);}}}

const SILENT_UPDATE_TAGS = [ Wn, $n ];

function $createNodeSelectionWith(...nodes) {
  const selection = Jr();
  nodes.forEach(node => selection.add(node.getKey()));
  return selection
}

function $makeSafeForRoot(node) {
  if (yr(node)) {
    return Ct$3(node, Vi)
  } else if (node.isParentRequired()) {
    const parent = node.createRequiredParent();
    return Ct$3(node, parent)
  } else {
    return node
  }
}

function getListType(node) {
  const list = vt$4(node, ue$1);
  return list?.getListType() ?? null
}

function $isAtNodeEdge(point, atStart = null) {
  if (atStart === null) {
    return $isAtNodeEdge(point, true) || $isAtNodeEdge(point, false)
  } else {
    return atStart ? $isAtNodeStart(point) : _$3(point)
  }
}

function $isAtNodeStart(point) {
  return point.offset === 0
}

function extendTextNodeConversion(conversionName, ...callbacks) {
  return extendConversion(lr, conversionName, (conversionOutput, element) => ({
    ...conversionOutput,
    forChild: (lexicalNode, parentNode) => {
      const originalForChild = conversionOutput?.forChild ?? (x => x);
      let childNode = originalForChild(lexicalNode, parentNode);


      if (yr(childNode)) {
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

function isSelectionHighlighted(selection) {
  if (!wr(selection)) return false

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
    const styles = { ...b$3(css) };

    styles[this._property] = this.getCanonicalAllowedValue(styles[this._property]);
    if (!styles[this._property]) {
      delete styles[this._property];
    }

    return R$3(styles)
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
    index ||= this.#computedAllowedValues.indexOf(getComputedStyleForProperty(this._property, value));
    return index === -1 ? null : this._allowedValues[index]
  }

  get #computedAllowedValues() {
    return this._computedAllowedValues ||= this._allowedValues.map(
      value => getComputedStyleForProperty(this._property, value)
    )
  }
}

function getComputedStyleForProperty(property, value) {
  const style = `${property}: ${value};`;

  // the element has to be attached to the DOM have computed styles
  const element = document.body.appendChild(createElement("span", { style: "display: none;" + style }));
  const computedStyle = window.getComputedStyle(element).getPropertyValue(property);
  element.remove();

  return computedStyle
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

  initializeToolbar(_lexxyToolbar) {

  }
}

const TOGGLE_HIGHLIGHT_COMMAND = ne$3();
const REMOVE_HIGHLIGHT_COMMAND = ne$3();
const BLANK_STYLES = { "color": null, "background-color": null };

const hasPastedStylesState = it$2("hasPastedStyles", {
  parse: (value) => value || false
});

class HighlightExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    const extension = Yl({
      dependencies: [ Wt$2 ],
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

        return ec(
          editor.registerCommand(TOGGLE_HIGHLIGHT_COMMAND, $toggleSelectionStyles, Gi),
          editor.registerCommand(REMOVE_HIGHLIGHT_COMMAND, () => $toggleSelectionStyles(BLANK_STYLES), Gi),
          editor.registerNodeTransform(lr, $syncHighlightWithStyle),
          editor.registerNodeTransform(lr, (textNode) => $canonicalizePastedStyles(textNode, canonicalizers))
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

  if (fs(Jn)) { $setPastedStyles(textNode); }
  const highlightStyle = R$3(elementStyles);

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

function buildCanonicalizers(config) {
  return [
    new StyleCanonicalizer("color", [ ...config.buttons.color, ...config.permit.color ]),
    new StyleCanonicalizer("background-color", [ ...config.buttons["background-color"], ...config.permit["background-color"] ])
  ]
}

function $toggleSelectionStyles(styles) {
  const selection = $r();
  if (!wr(selection)) return

  const patch = {};
  for (const property in styles) {
    const oldValue = le$2(selection, property);
    patch[property] = toggleOrReplace(oldValue, styles[property]);
  }

  U$2(selection, patch);
}

function toggleOrReplace(oldValue, newValue) {
  return oldValue === newValue ? null : newValue
}

function $syncHighlightWithStyle(textNode) {
  if (hasHighlightStyles(textNode.getStyle()) !== textNode.hasFormat("highlight")) {
    textNode.toggleFormat("highlight");
  }
}

function $canonicalizePastedStyles(textNode, canonicalizers = []) {
  if ($hasPastedStyles(textNode)) {
    $setPastedStyles(textNode, false);

    const canonicalizedCSS = applyCanonicalizers(textNode.getStyle(), canonicalizers);
    textNode.setStyle(canonicalizedCSS);

    const selection = $r();
    if (textNode.isSelected(selection)) {
      selection.setStyle(textNode.getStyle());
      selection.setFormat(textNode.getFormat());
    }
  }
}

function $setPastedStyles(textNode, value = true) {
  lt$2(textNode, hasPastedStylesState, value);
}

function $hasPastedStyles(textNode) {
  return ot$2(textNode, hasPastedStylesState)
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

  "insertTable",

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

    this.#registerCommands();
    this.#registerKeyboardCommands();
    this.#registerDragAndDropHandlers();
  }

  dispatchPaste(event) {
    return this.clipboard.paste(event)
  }

  dispatchBold() {
    this.editor.dispatchCommand(me$2, "bold");
  }

  dispatchItalic() {
    this.editor.dispatchCommand(me$2, "italic");
  }

  dispatchStrikethrough() {
    this.editor.dispatchCommand(me$2, "strikethrough");
  }

  dispatchToggleHighlight(styles) {
    this.editor.dispatchCommand(TOGGLE_HIGHLIGHT_COMMAND, styles);
  }

  dispatchRemoveHighlight() {
    this.editor.dispatchCommand(REMOVE_HIGHLIGHT_COMMAND);
  }

  dispatchLink(url) {
    this.editor.update(() => {
      const selection = $r();
      if (!wr(selection)) return

      if (selection.isCollapsed()) {
        const autoLinkNode = z$2(url);
        const textNode = pr(url);
        autoLinkNode.append(textNode);
        selection.insertNodes([ autoLinkNode ]);
      } else {
        Z$1(url);
      }
    });
  }

  dispatchUnlink() {
    this.#toggleLink(null);
  }

  dispatchInsertUnorderedList() {
    const selection = $r();
    if (!selection) return

    const anchorNode = selection.anchor.getNode();

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "bullet") {
      this.contents.unwrapSelectedListItems();
    } else {
      this.editor.dispatchCommand(xe, undefined);
    }
  }

  dispatchInsertOrderedList() {
    const selection = $r();
    if (!selection) return

    const anchorNode = selection.anchor.getNode();

    if (this.selection.isInsideList && anchorNode && getListType(anchorNode) === "number") {
      this.contents.unwrapSelectedListItems();
    } else {
      this.editor.dispatchCommand(ke$2, undefined);
    }
  }

  dispatchInsertQuoteBlock() {
    this.contents.toggleNodeWrappingAllSelectedNodes((node) => Pt$3(node), () => Ot$3());
  }

  dispatchInsertCodeBlock() {
    this.editor.update(() => {
      if (this.selection.hasSelectedWordsInSingleLine) {
        this.editor.dispatchCommand(me$2, "code");
      } else {
        this.contents.toggleNodeWrappingAllSelectedLines((node) => Q$1(node), () => new U$1("plain"));
      }
    });
  }

  dispatchInsertHorizontalDivider() {
    this.contents.insertAtCursorEnsuringLineBelow(new HorizontalDividerNode());
    this.editor.focus();
  }

  dispatchRotateHeadingFormat() {
    const selection = $r();
    if (!wr(selection)) return

    if (xs(selection.anchor.getNode())) {
      selection.insertNodes([ Mt$2("h2") ]);
      return
    }

    const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow();
    let nextTag = "h2";
    if (It$2(topLevelElement)) {
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
      this.contents.insertNodeWrappingEachSelectedLine(() => Mt$2(nextTag));
    } else {
      this.contents.removeFormattingFromSelectedLines();
    }
  }

  dispatchUploadAttachments() {
    const input = createElement("input", {
      type: "file",
      multiple: true,
      style: "display: none;",
      onchange: ({ target: { files } }) => {
        this.contents.uploadFiles(files, { selectLast: true });
      }
    });

    // Append and remove to make testable
    this.editorElement.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 1000);
  }

  dispatchInsertTable() {
    this.editor.dispatchCommand($e$1, { "rows": 3, "columns": 3, "includeHeaders": true });
  }

  dispatchUndo() {
    this.editor.dispatchCommand(xe$1, undefined);
  }

  dispatchRedo() {
    this.editor.dispatchCommand(Ce$1, undefined);
  }

  #registerCommands() {
    for (const command of COMMANDS) {
      const methodName = `dispatch${capitalize(command)}`;
      this.#registerCommandHandler(command, 0, this[methodName].bind(this));
    }

    this.#registerCommandHandler(ge$2, Hi, this.dispatchPaste.bind(this));
  }

  #registerCommandHandler(command, priority, handler) {
    this.editor.registerCommand(command, handler, priority);
  }

  #registerKeyboardCommands() {
    this.editor.registerCommand(De$2, this.#handleTabKey.bind(this), Gi);
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

    this.contents.uploadFiles(files, { selectLast: true });

    this.editor.focus();
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
    const command = event.shiftKey? Ie$2 : Le$3;
    return this.editor.dispatchCommand(command)
  }

  #handleTabForCode() {
    const selection = $r();
    return wr(selection) && selection.isCollapsed()
  }

  // Not using TOGGLE_LINK_COMMAND because it's not handled unless you use React/LinkPlugin
  #toggleLink(url) {
    this.editor.update(() => {
      if (url === null) {
        Z$1(null);
      } else {
        Z$1(url);
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

class ActionTextAttachmentNode extends Fi {
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

  constructor({ tagName, sgid, src, previewable, altText, caption, contentType, fileName, fileSize, width, height }, key) {
    super(key);

    this.tagName = tagName || ActionTextAttachmentNode.TAG_NAME;
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

    this.editor = Is();
  }

  createDOM() {
    const figure = this.createAttachmentFigure();

    if (this.isPreviewableAttachment) {
      figure.appendChild(this.#createDOMForImage());
      figure.appendChild(this.#createEditableCaption());
    } else {
      figure.appendChild(this.#createDOMForFile());
      figure.appendChild(this.#createDOMForNotImage());
    }

    return figure
  }

  updateDOM(_prevNode, dom) {
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
    return this.isAttached() && !this.getParent().is(ms(this))
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
    const figure = createAttachmentFigure(this.contentType, this.isPreviewableAttachment, this.fileName);

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

  #createDOMForImage(options = {}) {
    const img = createElement("img", { src: this.src, draggable: false, alt: this.altText, ...this.#imageDimensions, ...options });
    return img
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
      event.stopPropagation();
      event.target.blur();

      this.editor.update(() => {
        // Place the cursor after the current image
        this.selectNext(0, 0);
      }, {
        tag: Wn
      });
    }

  }
}

function $createActionTextAttachmentNode(...args) {
  return new ActionTextAttachmentNode(...args)
}

function $isActionTextAttachmentNode(node) {
  return node instanceof ActionTextAttachmentNode
}

class Selection {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editorContentElement = editorElement.editorContentElement;
    this.editor = this.editorElement.editor;
    this.previouslySelectedKeys = new Set();

    this.#listenForNodeSelections();
    this.#processSelectionChangeCommands();
    this.#containEditorFocus();
  }

  set current(selection) {
    this.editor.update(() => {
      this.#syncSelectedClasses();
    });
  }

  get hasNodeSelection() {
    return this.editor.getEditorState().read(() => {
      const selection = $r();
      return selection !== null && Or(selection)
    })
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
      const root = Io();
      const lastDescendant = root.getLastDescendant();

      if (lastDescendant && yr(lastDescendant)) {
        lastDescendant.selectEnd();
      } else {
        root.selectEnd();
      }
    });
  }

  selectedNodeWithOffset() {
    const selection = $r();
    if (!selection) return { node: null, offset: 0 }

    if (wr(selection)) {
      return {
        node: selection.anchor.getNode(),
        offset: selection.anchor.offset
      }
    } else if (Or(selection)) {
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
      const selection = $r();
      if (selection && wr(selection)) {
        selectionState = {
          anchor: { key: selection.anchor.key, offset: selection.anchor.offset },
          focus: { key: selection.focus.key, offset: selection.focus.offset }
        };
      }
    });

    fn();

    if (selectionState) {
      this.editor.update(() => {
        const selection = $r();
        if (selection && wr(selection)) {
          selection.anchor.set(selectionState.anchor.key, selectionState.anchor.offset, "text");
          selection.focus.set(selectionState.focus.key, selectionState.focus.offset, "text");
        }
      });
    }
  }

  getFormat() {
    const selection = $r();
    if (!wr(selection)) return {}

    const anchorNode = selection.anchor.getNode();
    if (!anchorNode.getParent()) return {}

    const topLevelElement = anchorNode.getTopLevelElementOrThrow();
    const listType = getListType(anchorNode);

    return {
      isBold: selection.hasFormat("bold"),
      isItalic: selection.hasFormat("italic"),
      isStrikethrough: selection.hasFormat("strikethrough"),
      isHighlight: isSelectionHighlighted(selection),
      isInLink: vt$4(anchorNode, E$3) !== null,
      isInQuote: Pt$3(topLevelElement),
      isInHeading: It$2(topLevelElement),
      isInCode: selection.hasFormat("code") || vt$4(anchorNode, U$1) !== null,
      isInList: listType !== null,
      listType,
      isInTable: Je$1(anchorNode) !== null
    }
  }

  nearestNodeOfType(nodeType) {
    const anchorNode = $r()?.anchor?.getNode();
    return vt$4(anchorNode, nodeType)
  }

  get hasSelectedWordsInSingleLine() {
    const selection = $r();
    if (!wr(selection)) return false

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
      if (Zn(node)) {
        return false
      }
    }

    return true
  }

  get isInsideList() {
    return this.nearestNodeOfType(se$1)
  }

  get isIndentedList() {
    const closestListNode = this.nearestNodeOfType(ue$1);
    return closestListNode && (V$3(closestListNode) > 1)
  }

  get isInsideCodeBlock() {
    return this.nearestNodeOfType(U$1) !== null
  }

  get isTableCellSelected() {
    return this.nearestNodeOfType(Ke$1) !== null
  }

  get isOnPreviewableImage() {
    const selection = $r();
    const firstNode = selection?.getNodes().at(0);
    return $isActionTextAttachmentNode(firstNode) && firstNode.isPreviewableImage
  }

  get nodeAfterCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if (yr(anchorNode)) {
      return this.#getNodeAfterTextNode(anchorNode, offset)
    }

    if (Pi(anchorNode)) {
      return this.#getNodeAfterElementNode(anchorNode, offset)
    }

    return this.#findNextSiblingUp(anchorNode)
  }

  get topLevelNodeAfterCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if (yr(anchorNode)) {
      return this.#getNextNodeFromTextEnd(anchorNode)
    }

    if (Pi(anchorNode)) {
      return this.#getNodeAfterElementNode(anchorNode, offset)
    }

    return this.#findNextSiblingUp(anchorNode)
  }

  get nodeBeforeCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if (yr(anchorNode)) {
      return this.#getNodeBeforeTextNode(anchorNode, offset)
    }

    if (Pi(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  get topLevelNodeBeforeCursor() {
    const { anchorNode, offset } = this.#getCollapsedSelectionData();
    if (!anchorNode) return null

    if (yr(anchorNode)) {
      return this.#getPreviousNodeFromTextStart(anchorNode)
    }

    if (Pi(anchorNode)) {
      return this.#getNodeBeforeElementNode(anchorNode, offset)
    }

    return this.#findPreviousSiblingUp(anchorNode)
  }

  get #currentlySelectedKeys() {
    if (this.currentlySelectedKeys) { return this.currentlySelectedKeys }

    this.currentlySelectedKeys = new Set();

    const selection = $r();
    if (selection && Or(selection)) {
      for (const node of selection.getNodes()) {
        this.currentlySelectedKeys.add(node.getKey());
      }
    }

    return this.currentlySelectedKeys
  }

  #processSelectionChangeCommands() {
    this.editor.registerCommand(ke$3, this.#selectPreviousNode.bind(this), Hi);
    this.editor.registerCommand(ve$1, this.#selectNextNode.bind(this), Hi);
    this.editor.registerCommand(be$2, this.#selectPreviousTopLevelNode.bind(this), Hi);
    this.editor.registerCommand(we$1, this.#selectNextTopLevelNode.bind(this), Hi);

    this.editor.registerCommand(ue$2, this.#selectDecoratorNodeBeforeDeletion.bind(this), Hi);

    this.editor.registerCommand(re$2, () => {
      this.current = $r();
    }, Hi);
  }

  #listenForNodeSelections() {
    this.editor.registerCommand(oe$4, ({ target }) => {
      if (!As(target)) return false

      const targetNode = Do(target);
      return Li(targetNode) && this.#selectInLexical(targetNode)
    }, Hi);

    this.editor.getRootElement().addEventListener("lexxy:internal:move-to-next-line", (event) => {
      this.#selectOrAppendNextLine();
    });
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

  async #selectPreviousNode() {
    if (this.hasNodeSelection) {
      return await this.#withCurrentNode((currentNode) => currentNode.selectPrevious())
    } else {
      return this.#selectInLexical(this.nodeBeforeCursor)
    }
  }

  async #selectNextNode() {
    if (this.hasNodeSelection) {
      return await this.#withCurrentNode((currentNode) => currentNode.selectNext(0, 0))
    } else {
      return this.#selectInLexical(this.nodeAfterCursor)
    }
  }

  async #selectPreviousTopLevelNode() {
    if (this.hasNodeSelection) {
      return await this.#withCurrentNode((currentNode) => currentNode.getTopLevelElement().selectPrevious())
    } else {
      return this.#selectInLexical(this.topLevelNodeBeforeCursor)
    }
  }

  async #selectNextTopLevelNode() {
    if (this.hasNodeSelection) {
      return await this.#withCurrentNode((currentNode) => currentNode.getTopLevelElement().selectNext(0, 0))
    } else {
      return this.#selectInLexical(this.topLevelNodeAfterCursor)
    }
  }

  async #withCurrentNode(fn) {
    await nextFrame();
    if (this.hasNodeSelection) {
      this.editor.update(() => {
        fn($r().getNodes()[0]);
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
    const selection = $r();
    if (!selection) return null

    if (Or(selection)) {
      return this.#getTopLevelFromNodeSelection(selection)
    }

    if (wr(selection)) {
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
    const root = Io();
    const newParagraph = Vi();
    root.append(newParagraph);
    newParagraph.selectStart();
  }

  #selectInLexical(node) {
    if (Li(node)) {
      const selection = $createNodeSelectionWith(node);
      zo(selection);
      return selection
    } else {
      return false
    }
  }

  #selectDecoratorNodeBeforeDeletion(backwards) {
    const node = backwards ? this.nodeBeforeCursor : this.nodeAfterCursor;
    if (!Li(node)) return false

    this.#removeEmptyElementAnchorNode();

    const selection = this.#selectInLexical(node);
    return Boolean(selection)
  }

  #removeEmptyElementAnchorNode(anchor = $r()?.anchor) {
    const anchorNode = anchor?.getNode();
    if (Pi(anchorNode) && anchorNode?.isEmpty()) anchorNode.remove();
  }

  #getValidSelectionRange() {
    const lexicalSelection = $r();
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
    const selection = $r();
    if (!wr(selection) || !selection.isCollapsed()) {
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
    if (anchorNode.getNextSibling() instanceof Fi) {
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
    if (anchorNode.getPreviousSibling() instanceof Fi) {
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

function sanitize(html) {
  return purify.sanitize(html, buildConfig())
}

function dasherize(value) {
  return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`)
}

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

function upcaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
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

class CustomActionTextAttachmentNode extends Fi {
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
              nodes.push(pr(" "));
            }

            nodes.push(new CustomActionTextAttachmentNode({
              sgid: attachment.getAttribute("sgid"),
              innerHtml: JSON.parse(attachment.getAttribute("content")),
              contentType: attachment.getAttribute("content-type")
            }));

            nodes.push(pr(" "));

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

  constructor({ tagName, sgid, contentType, innerHtml }, key) {
    super(key);

    const contentTypeNamespace = Lexxy.global.get("attachmentContentTypeNamespace");

    this.tagName = tagName || CustomActionTextAttachmentNode.TAG_NAME;
    this.sgid = sgid;
    this.contentType = contentType || `application/vnd.${contentTypeNamespace}.unknown`;
    this.innerHtml = innerHtml;
  }

  createDOM() {
    const figure = createElement(this.tagName, { "content-type": this.contentType, "data-lexxy-decorator": true });

    figure.insertAdjacentHTML("beforeend", this.innerHtml);

    const deleteButton = createElement("lexxy-node-delete-button");
    figure.appendChild(deleteButton);

    return figure
  }

  updateDOM() {
    return false
  }

  getTextContent() {
    return this.createDOM().textContent.trim() || `[${this.contentType}]`
  }

  isInline() {
    return true
  }

  exportDOM() {
    const attachment = createElement(this.tagName, {
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
      tagName: this.tagName,
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
      Ee$2,
      (event) => this.#handleEnterKey(event),
      Xi
    );
  }

  #handleEnterKey(event) {
    const selection = $r();
    if (!wr(selection)) return false

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
      if (Pt$3(currentNode)) {
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
    return parent && ae$1(parent)
  }

  #isNodeEmpty(node) {
    if (node.getTextContent().trim() !== "") return false

    const children = node.getChildren();
    if (children.length === 0) return true

    return children.every(child => {
      if (Zn(child)) return true
      return this.#isNodeEmpty(child)
    })
  }

  #getListItemNode(node) {
    let currentNode = node;

    while (currentNode) {
      if (ae$1(currentNode)) {
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
    if (!parentList || !me$1(parentList)) return

    const blockquote = parentList.getParent();
    const isInBlockquote = blockquote && Pt$3(blockquote);

    if (isInBlockquote) {
      const listItemsAfter = this.#getListItemSiblingsAfter(listItem);
      const nonEmptyListItems = listItemsAfter.filter(item => !this.#isNodeEmpty(item));

      if (nonEmptyListItems.length > 0) {
        this.#splitBlockquoteWithList(blockquote, parentList, listItem, nonEmptyListItems);
        return
      }
    }

    const paragraph = Vi();
    parentList.insertAfter(paragraph);

    listItem.remove();
    paragraph.selectStart();
  }

  #shouldEscapeFromEmptyParagraphInBlockquote(node) {
    const paragraph = this.#getParagraphNode(node);
    if (!paragraph) return false

    if (!this.#isNodeEmpty(paragraph)) return false

    const parent = paragraph.getParent();
    return parent && Pt$3(parent)
  }

  #getParagraphNode(node) {
    let currentNode = node;

    while (currentNode) {
      if (Yi(currentNode)) {
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
    if (!blockquote || !Pt$3(blockquote)) return

    const siblingsAfter = this.#getSiblingsAfter(paragraph);
    const nonEmptySiblings = siblingsAfter.filter(sibling => !this.#isNodeEmpty(sibling));

    if (nonEmptySiblings.length > 0) {
      this.#splitBlockquote(blockquote, paragraph, nonEmptySiblings);
    } else {
      const newParagraph = Vi();
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
      if (ae$1(sibling)) {
        siblings.push(sibling);
      }
      sibling = sibling.getNextSibling();
    }

    return siblings
  }

  #splitBlockquoteWithList(blockquote, parentList, emptyListItem, listItemsAfter) {
    const blockquoteSiblingsAfterList = this.#getSiblingsAfter(parentList);
    const nonEmptyBlockquoteSiblings = blockquoteSiblingsAfterList.filter(sibling => !this.#isNodeEmpty(sibling));

    const middleParagraph = Vi();
    blockquote.insertAfter(middleParagraph);

    const newList = pe$1(parentList.getListType());

    const newBlockquote = Ot$3();
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
      if (ae$1(item) && this.#isNodeEmpty(item)) {
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
    const newParagraph = Vi();
    blockquote.insertAfter(newParagraph);

    const newBlockquote = Ot$3();
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

  constructor(node, key) {
    const { file, uploadUrl, blobUrlTemplate, progress, width, height, uploadError } = node;
    super({ ...node, contentType: file.type }, key);
    this.file = file;
    this.fileName = file.name;
    this.uploadUrl = uploadUrl;
    this.blobUrlTemplate = blobUrlTemplate;
    this.progress = progress ?? null;
    this.width = width;
    this.height = height;
    this.uploadError = uploadError;
  }

  createDOM() {
    if (this.uploadError) return this.#createDOMForError()

    // This side-effect is trigged on DOM load to fire only once and avoid multiple
    // uploads through cloning. The upload is guarded from restarting in case the
    // node is reloaded from saved state such as from history.
    this.#startUploadIfNeeded();

    const figure = this.createAttachmentFigure();

    if (this.isPreviewableAttachment) {
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

  #createDOMForError() {
    const figure = this.createAttachmentFigure();
    figure.classList.add("attachment--error");
    figure.appendChild(createElement("div", { innerText: `Error uploading ${this.file?.name ?? "file"}` }));
    return figure
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

    const nameSpan = createElement("span", { className: "attachment__name", textContent: this.caption || this.file.name || "" });
    const sizeSpan = createElement("span", { className: "attachment__size", textContent: bytesToHumanSize(this.file.size) });
    figcaption.appendChild(nameSpan);
    figcaption.appendChild(sizeSpan);

    return figcaption
  }

  #createProgressBar() {
    return createElement("progress", { value: this.progress ?? 0, max: 100 })
  }

  #setDimensionsFromImage({ width, height }) {
    if (this.#hasDimensions) return

    this.editor.update(() => {
      const writable = this.getWritable();
      writable.width = width;
      writable.height = height;
    }, { tag: SILENT_UPDATE_TAGS });
  }

  get #hasDimensions() {
    return Boolean(this.width && this.height)
  }

  async #startUploadIfNeeded() {
    if (this.#uploadStarted) return

    this.#setUploadStarted();

    const { DirectUpload } = await import('@rails/activestorage');

    const upload = new DirectUpload(this.file, this.uploadUrl, this);
    upload.delegate = this.#createUploadDelegate();

    this.#dispatchEvent("lexxy:upload-start", { file: this.file });

    upload.create((error, blob) => {
      if (error) {
        this.#dispatchEvent("lexxy:upload-end", { file: this.file, error });
        this.#handleUploadError(error);
      } else {
        this.#dispatchEvent("lexxy:upload-end", { file: this.file, error: null });
        this.#showUploadedAttachment(blob);
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

        const uploadProgressHandler = (event) => this.#handleUploadProgress(event);
        request.upload.addEventListener("progress", uploadProgressHandler);
      }
    }
  }

  #setUploadStarted() {
    this.#setProgress(1);
  }

  #handleUploadProgress(event) {
    const progress = Math.round(event.loaded / event.total * 100);
    this.#setProgress(progress);
    this.#dispatchEvent("lexxy:upload-progress", { file: this.file, progress });
  }

  #setProgress(progress) {
    this.editor.update(() => {
      this.getWritable().progress = progress;
    }, { tag: SILENT_UPDATE_TAGS });
  }

  #handleUploadError(error) {
    console.warn(`Upload error for ${this.file?.name ?? "file"}: ${error}`);
    this.editor.update(() => {
      this.getWritable().uploadError = true;
    }, { tag: SILENT_UPDATE_TAGS });
  }

  #showUploadedAttachment(blob) {
    this.editor.update(() => {
      const shouldTransferNodeSelection = this.isSelected();

      const replacementNode = this.#toActionTextAttachmentNodeWith(blob);
      this.replace(replacementNode);

      if (shouldTransferNodeSelection) {
        const nodeSelection = $createNodeSelectionWith(replacementNode);
        zo(nodeSelection);
      }
    }, { tag: SILENT_UPDATE_TAGS });
  }

  #toActionTextAttachmentNodeWith(blob) {
    const conversion = new AttachmentNodeConversion(this, blob);
    return conversion.toAttachmentNode()
  }

  #dispatchEvent(name, detail) {
    const figure = this.editor.getElementByKey(this.getKey());
    if (figure) dispatch(figure, name, detail);
  }
}

class AttachmentNodeConversion {
  constructor(uploadNode, blob) {
    this.uploadNode = uploadNode;
    this.blob = blob;
  }

  toAttachmentNode() {
    return new ActionTextAttachmentNode({
      ...this.uploadNode,
      ...this.#propertiesFromBlob,
      src: this.#src
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

class ImageGalleryNode extends Ai {
  $config() {
    return this.config("image_gallery", {
      extends: Ai,
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
        const containsAttachment = element.querySelector(`:scope > :is(${this.#attachmentTags.join()})`);
        if (!containsAttachment) return null

        return {
          conversion: () => {
            return {
              node: $createImageGalleryNode(),
              after: children => _t$4(children, this.isValidChild)
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
      const paragraph = Vi();
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
      Pt$5(this, node);
    } else {
      this.append(node);
    }

    Tt$4(this, ImageGalleryNode.isValidChild);

    return true
  }

  unwrapEmptyNode() {
    if (this.isEmpty()) {
      const paragraph = Vi();
      return this.replace(paragraph)
    }
  }

  replaceWithSingularChild() {
    if (this.#hasSingularChild) {
      const child = this.getFirstChild();
      return this.replace(child)
    }
  }

  splitAroundInvalidChild() {
    for (const child of Kt$4(this)) {
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
    return Es(this, index)
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

  const existingGallery = vt$4(node, ImageGalleryNode);
  return existingGallery ?? Ct$3(node, $createImageGalleryNode)
}

class Uploader {
  #files

  static for(editorElement, files) {
    const UploaderKlass = GalleryUploader.handle(editorElement, files) ? GalleryUploader : Uploader;
    return new UploaderKlass(editorElement, files)
  }

  constructor(editorElement, files) {
    this.#files = files;

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
    this.nodes = this.files.map(file =>
      $createActionTextAttachmentUploadNode({
        ...this.#nodeUrlProperties,
        file: file,
        contentType: file.type
      })
    );
  }

  $insertUploadNodes() {
    this.nodes.forEach(this.contents.insertAtCursor);
  }

  get #nodeUrlProperties() {
    return {
      uploadUrl: this.editorElement.directUploadUrl,
      blobUrlTemplate: this.editorElement.blobUrlTemplate
    }
  }
}

class GalleryUploader extends Uploader {
  #gallery

  static handle(editorElement, files) {
    return this.#isMultipleImageUpload(files) || this.#gallerySelection(editorElement.selection)
  }

  static #isMultipleImageUpload(files) {
    let imageFileCount = 0;
    for (const file of files) {
      if (isPreviewableImage(file.type)) imageFileCount++;
      if (imageFileCount > 1) return true
    }
    return false
  }

  static #gallerySelection(selection) {
    if (selection.isOnPreviewableImage) return true

    const { node: selectedNode } = selection.selectedNodeWithOffset();
    return vt$4(selectedNode, ImageGalleryNode) !== null
  }

  $insertUploadNodes() {
    this.#findOrCreateGallery();
    this.#insertImagesInGallery();
    this.#insertNonImagesAfterGallery();
  }

  #findOrCreateGallery() {
    if (this.selection.isOnPreviewableImage) {
      this.#gallery = $findOrCreateGalleryForImage(this.#selectedNode);
    } else {
      this.#gallery = $createImageGalleryNode();
      this.contents.insertAtCursor(this.#gallery);
    }
  }

  get #selectedNode() {
    const { node } = this.selection.selectedNodeWithOffset();
    return node
  }

  get #galleryInsertPosition() {
    const anchor = $r()?.anchor;
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

class Contents {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;

    new FormatEscaper(editorElement).monitor();
  }

  insertHtml(html, { tag } = {}) {
    this.insertDOM(parseHtml(html), { tag });
  }

  insertDOM(doc, { tag } = {}) {
    this.editor.update(() => {
      const selection = $r();
      if (!wr(selection)) return

      const nodes = m$1(this.editor, doc);
      if (!this.#insertUploadNodes(nodes)) {
        selection.insertNodes(nodes);
      }
    }, { tag });
  }

  insertAtCursor(node) {
    const selection = $r() ?? Io().selectEnd();
    const selectedNodes = selection?.getNodes();

    if (wr(selection)) {
      selection.insertNodes([ node ]);
    } else if (Or(selection) && selectedNodes.length > 0) {
      // Overrides Lexical's default behavior of _removing_ the currently selected nodes
      // https://github.com/facebook/lexical/blob/v0.38.2/packages/lexical/src/LexicalSelection.ts#L412
      const lastNode = selectedNodes.at(-1);
      lastNode.insertAfter(node);
    }
}

  insertAtCursorEnsuringLineBelow(node) {
    this.insertAtCursor(node);
    this.#insertLineBelowIfLastNode(node);
  }

  insertNodeWrappingEachSelectedLine(newNodeFn) {
    this.editor.update(() => {
      const selection = $r();
      if (!wr(selection)) return

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
      const selection = $r();
      if (!wr(selection)) return

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
      const selection = $r();
      if (!wr(selection)) return

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
      const selection = $r();
      if (!wr(selection)) return

      const topLevelElement = selection.anchor.getNode().getTopLevelElementOrThrow();
      const paragraph = Vi();
      paragraph.append(...topLevelElement.getChildren());
      topLevelElement.replace(paragraph);
    });
  }

  hasSelectedText() {
    let result = false;

    this.editor.read(() => {
      const selection = $r();
      result = wr(selection) && !selection.isCollapsed();
    });

    return result
  }

  unwrapSelectedListItems() {
    this.editor.update(() => {
      const selection = $r();
      if (!wr(selection)) return

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
      const textNode = pr(url);
      const linkNode = K$3(url);
      linkNode.append(textNode);

      const selection = $r();
      if (wr(selection)) {
        selection.insertNodes([ linkNode ]);
        linkNodeKey = linkNode.getKey();
      }
    });

    return linkNodeKey
  }

  createLinkWithSelectedText(url) {
    if (!this.hasSelectedText()) return

    this.editor.update(() => {
      Z$1(null);
      Z$1(url);
    });
  }

  textBackUntil(string) {
    let result = "";

    this.editor.getEditorState().read(() => {
      const selection = $r();
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();

      if (!yr(anchorNode)) return

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
      const selection = $r();
      if (!selection || !selection.isCollapsed()) return

      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();

      if (!yr(anchorNode)) return

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
    const newParagraph = Vi();
    node.insertAfter(newParagraph);
    newParagraph.selectStart();

    // Insert the typed text
    if (text) {
      newParagraph.append(pr(text));
      newParagraph.select(1, 1); // Place cursor after the text
    }
  }

  createParagraphBeforeNode(node, text) {
    const newParagraph = Vi();
    node.insertBefore(newParagraph);
    newParagraph.selectStart();

    // Insert the typed text
    if (text) {
      newParagraph.append(pr(text));
      newParagraph.select(1, 1); // Place cursor after the text
    }
  }

  uploadFiles(files, { selectLast } = {}) {
    if (!this.editorElement.supportsAttachments) {
      console.warn("This editor does not supports attachments (it's configured with [attachments=false])");
      return
    }
    const validFiles = Array.from(files).filter(this.#shouldUploadFile.bind(this));

    this.editor.update(() => {
      const uploader = Uploader.for(this.editorElement, validFiles);
      uploader.$uploadFiles();

      if (selectLast && uploader.nodes?.length) {
        const lastNode = uploader.nodes.at(-1);
        lastNode.selectEnd();
      }
    });
  }

  replaceNodeWithHTML(nodeKey, html, options = {}) {
    this.editor.update(() => {
      const node = Mo(nodeKey);
      if (!node) return

      const selection = $r();
      let wasSelected = false;

      if (wr(selection)) {
        const selectedNodes = selection.getNodes();
        wasSelected = selectedNodes.includes(node) || selectedNodes.some(n => n.getParent() === node);

        if (wasSelected) {
          zo(null);
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
      const node = Mo(nodeKey);
      if (!node) return

      const previousNode = node.getTopLevelElement() || node;

      const newNode = options.attachment ? this.#createCustomAttachmentNodeWithHtml(html, options.attachment) : this.#createHtmlNodeWith(html);
      previousNode.insertAfter(newNode);
    });
  }

  #insertUploadNodes(nodes) {
    if (nodes.every($isActionTextAttachmentNode)) {
      const uploader = Uploader.for(this.editorElement, []);
      uploader.nodes = nodes;
      uploader.$insertUploadNodes();
      return true
    }
  }

  #insertLineBelowIfLastNode(node) {
    this.editor.update(() => {
      const nextSibling = node.getNextSibling();
      if (!nextSibling) {
        const newParagraph = Vi();
        node.insertAfter(newParagraph);
        newParagraph.selectStart();
      }
    });
  }

  #unwrap(node) {
    const children = node.getChildren();

    if (children.length == 0) {
      node.insertBefore(Vi());
    } else {
      children.forEach((child) => {
        if (yr(child) && child.getTextContent().trim() !== "") {
          const newParagraph = Vi();
          newParagraph.append(child);
          node.insertBefore(newParagraph);
        } else if (!Zn(child)) {
          node.insertBefore(child);
        }
      });
    }

    node.remove();
  }

  #insertNodeWrappingAllSelectedNodes(newNodeFn) {
    this.editor.update(() => {
      const selection = $r();
      if (!wr(selection)) return

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
      if (!Yi(element) || !this.#isElementEmpty(element)) {
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
    return children.length === 0 || children.every(child => Zn(child))
  }

  #removeStandaloneEmptyParagraph() {
    const root = Io();
    if (root.getChildrenSize() === 1) {
      const firstChild = root.getFirstChild();
      if (firstChild && Yi(firstChild) && this.#isElementEmpty(firstChild)) {
        firstChild.remove();
      }
    }
  }

  #insertNodeWrappingAllSelectedLines(newNodeFn) {
    this.editor.update(() => {
      const selection = $r();
      if (!wr(selection)) return

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
      selection.insertNodes([ newNodeFn() ]);
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

    zo(null);
    return selectedParagraphs
  }

  #getParagraphFromNode(node) {
    if (Yi(node)) return node
    if (yr(node) && node.getParent() && Yi(node.getParent())) {
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
      wrappingNode.append(pr(lineText));
      if (index < lines.length - 1) {
        wrappingNode.append(Qn());
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

  #collectSelectedListItems(selection) {
    const nodes = selection.getNodes();
    const listItems = new Set();
    const parentLists = new Set();

    for (const node of nodes) {
      const listItem = vt$4(node, se$1);
      if (listItem) {
        listItems.add(listItem);
        const parentList = listItem.getParent();
        if (parentList && me$1(parentList)) {
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
    if (!parentList || !me$1(parentList)) return null

    const paragraph = Vi();
    const sublists = this.#extractSublistsAndContent(listItem, paragraph);

    listItem.insertAfter(paragraph);
    this.#insertSublists(paragraph, sublists);
    listItem.remove();

    return paragraph
  }

  #extractSublistsAndContent(listItem, paragraph) {
    const sublists = [];

    listItem.getChildren().forEach((child) => {
      if (me$1(child)) {
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
      if (me$1(parentList) && parentList.getChildrenSize() === 0) {
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
    const currentSelection = $r();
    if (currentSelection && wr(currentSelection)) {
      currentSelection.anchor.set(firstParagraph.getKey(), 0, "element");
      currentSelection.focus.set(lastParagraph.getKey(), lastParagraph.getChildrenSize(), "element");
    }
  }

  #getTextAnchorData() {
    const selection = $r();
    if (!selection || !selection.isCollapsed()) return { anchorNode: null, offset: 0 }

    const anchor = selection.anchor;
    const anchorNode = anchor.getNode();

    if (!yr(anchorNode)) return { anchorNode: null, offset: 0 }

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

    const textNodeBefore = pr(textBeforeString);
    const textNodeAfter = pr(textAfterCursor || " ");

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
    if (Yi(paragraph) && this.editorElement.supportsMultiLine) {
      const children = paragraph.getChildren();
      const last = children[children.length - 1];
      const beforeLast = children[children.length - 2];

      if (yr(last) && last.getTextContent() === "" && (beforeLast && !yr(beforeLast))) {
        paragraph.append(Qn());
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
    return htmlNodes[0] || Vi()
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

class Clipboard {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editor = editorElement.editor;
    this.contents = editorElement.contents;
  }

  paste(event) {
    const clipboardData = event.clipboardData;

    if (!clipboardData || this.#isPastingIntoCodeBlock()) return false

    if (this.#isPlainTextOrURLPasted(clipboardData)) {
      this.#pastePlainText(clipboardData);
      event.preventDefault();
      return true
    }

    return this.#handlePastedFiles(clipboardData)
  }

  #isPlainTextOrURLPasted(clipboardData) {
    return this.#isOnlyPlainTextPasted(clipboardData) || this.#isOnlyURLPasted(clipboardData)
  }

  #isOnlyPlainTextPasted(clipboardData) {
    const types = Array.from(clipboardData.types);
    return types.length === 1 && types[0] === "text/plain"
  }

  #isOnlyURLPasted(clipboardData) {
    // Safari URLs are copied as a text/plain + text/uri-list object
    const types = Array.from(clipboardData.types);
    return types.length === 2 && types.includes("text/uri-list") && types.includes("text/plain")
  }

  #isPastingIntoCodeBlock() {
    let result = false;

    this.editor.getEditorState().read(() => {
      const selection = $r();
      if (!wr(selection)) return

      let currentNode = selection.anchor.getNode();

      while (currentNode) {
        if (Q$1(currentNode)) {
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
      } else if (this.editorElement.supportsMarkdown) {
        this.#pasteMarkdown(text);
      } else {
        this.#pasteRichText(clipboardData);
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
    const html = k(text, { breaks: true });
    const doc = parseHtml(html);
    const detail = Object.freeze({
      markdown: text,
      document: doc,
      addBlockSpacing: () => addBlockSpacing(doc)
    });

    dispatch(this.editorElement, "lexxy:insert-markdown", detail);
    this.contents.insertDOM(doc, { tag: Jn });
  }

  #pasteRichText(clipboardData) {
    this.editor.update(() => {
      const selection = $r();
      R$2(clipboardData, selection, this.editor);
    }, { tag: Jn });
  }

  #handlePastedFiles(clipboardData) {
    if (!this.editorElement.supportsAttachments) return false

    const html = clipboardData.getData("text/html");
    if (html) {
      this.contents.insertHtml(html, { tag: Jn });
      return true
    }

    this.#preservingScrollPosition(() => {
      const files = clipboardData.files;
      if (files.length) {
        this.contents.uploadFiles(files, { selectLast: true });
      }
    });

    return true
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

class Extensions {

  constructor(lexxyElement) {
    this.lexxyElement = lexxyElement;

    this.enabledExtensions = this.#initializeExtensions();
  }

  get lexicalExtensions() {
    return this.enabledExtensions.map(ext => ext.lexicalExtension).filter(Boolean)
  }

  initializeToolbars() {
    if (this.#lexxyToolbar) {
      this.enabledExtensions.forEach(ext => ext.initializeToolbar(this.#lexxyToolbar));
    }
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

class ProvisionalParagraphNode extends Ui {
  $config() {
    return this.config("provisonal_paragraph", {
      extends: Ui,
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
    const selected = this.isSelected($r());
    p.classList.add("provisional-paragraph");
    p.classList.toggle("hidden", !selected);
    return p
  }

  updateDOM(_prevNode, dom) {
    const selected = this.isSelected($r());
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
    const targetSelection = selection || $r();
    return targetSelection?.getNodes().some(node => node.is(this) || this.isParentOf(node))
  }

  removeUnlessRequired(self = this.getLatest()) {
    if (!self.required) self.remove();
  }

  concretizeIfEdited(self = this.getLatest()) {
    if (self.getTextContentSize() > 0) {
      self.replace(Vi(), true);
    }
  }


  get required() {
    return this.isDirectRootChild && ProvisionalParagraphNode.neededBetween(...this.immediateSiblings)
  }

  get isDirectRootChild() {
    const parent = this.getParent();
    return xs(parent)
  }

  get immediateSiblings() {
    return [ this.getPreviousSibling(), this.getNextSibling() ]
  }
}

function $isProvisionalParagraphNode(node) {
  return node instanceof ProvisionalParagraphNode
}

function $isSelectableElement(node, direction) {
  return Pi(node) && (direction === "next" ? node.canInsertTextBefore() : node.canInsertTextAfter())
}

class ProvisionalParagraphExtension extends LexxyExtension {
  get lexicalExtension() {
    return Yl({
      name: "lexxy/provisional-paragraph",
      nodes: [
        ProvisionalParagraphNode
      ],
      register(editor) {
        return ec(
          // Process Provisional Paragraph Nodes on RootNode changes as sibling status influences whether
          // they are required and their visible/hidden status
          editor.registerNodeTransform(Ii, $insertRequiredProvisionalParagraphs),
          editor.registerNodeTransform(Ii, $removeUnneededProvisionalParagraphs),
          editor.registerCommand(re$2, $markAllProvisionalParagraphsDirty, Xi)
        )
      }
    })
  }
}

function $insertRequiredProvisionalParagraphs(rootNode) {
  const firstNode = rootNode.getFirstChild();
  if (ProvisionalParagraphNode.neededBetween(null, firstNode)) {
    Pt$5(rootNode, new ProvisionalParagraphNode);
  }

  for (const node of Kt$4(rootNode)) {
    const nextNode = node.getNextSibling();
    if (ProvisionalParagraphNode.neededBetween(node, nextNode)) {
      node.insertAfter(new ProvisionalParagraphNode);
    }
  }
}

function $removeUnneededProvisionalParagraphs(rootNode) {
  for (const provisionalParagraph of $getAllProvisionalParagraphs(rootNode)) {
    provisionalParagraph.removeUnlessRequired();
  }
}

function $markAllProvisionalParagraphsDirty() {
  for (const provisionalParagraph of $getAllProvisionalParagraphs()) {
    provisionalParagraph.markDirty();
  }
}

function $getAllProvisionalParagraphs(rootNode = Io()) {
  return _t$4(rootNode.getChildren(), $isProvisionalParagraphNode)
}

const TRIX_LANGUAGE_ATTR = "language";

class TrixContentExtension extends LexxyExtension {

  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    return Yl({
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
            conversion: extendConversion(U$1, "pre", $applyLanguage),
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
  const language = mt(element.getAttribute(TRIX_LANGUAGE_ATTR));
  conversionOutput.node.setLanguage(language);
}

class WrappedTableNode extends _n {
  $config() {
    return this.config("wrapped_table_node", { extends: _n })
  }

  static importDOM() {
    return super.importDOM()
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

  get lexicalExtension() {
    return Yl({
      name: "lexxy/tables",
      nodes: [
        WrappedTableNode,
        {
          replace: _n,
          with: () => new WrappedTableNode(),
          withKlass: WrappedTableNode
        },
        Ke$1,
        ze$1
      ],
      register(editor) {
        return ec(
          // Register Lexical table plugins
          Kn(editor),
          An(editor, true),
          Cn(editor),

          // Bug fix: Prevent hardcoded background color (Lexical #8089)
          editor.registerNodeTransform(Ke$1, (node) => {
            if (node.getBackgroundColor() === null) {
              node.setBackgroundColor("");
            }
          }),

          // Bug fix: Fix column header states (Lexical #8090)
          editor.registerNodeTransform(Ke$1, (node) => {
            const headerState = node.getHeaderStyles();

            if (headerState !== Ae$1.ROW) return

            const rowParent = node.getParent();
            const tableNode = rowParent?.getParent();
            if (!tableNode) return

            const rows = tableNode.getChildren();
            const cellIndex = rowParent.getChildren().indexOf(node);

            const cellsInRow = rowParent.getChildren();
            const isHeaderRow = cellsInRow.every(cell =>
              cell.getHeaderStyles() !== Ae$1.NO_STATUS
            );

            const isHeaderColumn = rows.every(row => {
              const cell = row.getChildren()[cellIndex];
              return cell && cell.getHeaderStyles() !== Ae$1.NO_STATUS
            });

            let newHeaderState = Ae$1.NO_STATUS;

            if (isHeaderRow) newHeaderState |= Ae$1.ROW;
            if (isHeaderColumn) newHeaderState |= Ae$1.COLUMN;

            if (newHeaderState !== headerState) {
              node.setHeaderStyles(newHeaderState, Ae$1.BOTH);
            }
          }),

          editor.registerCommand("insertTableRowAfter", () => {
            et(true);
          }, Gi),

          editor.registerCommand("insertTableRowBefore", () => {
            et(false);
          }, Gi),

          editor.registerCommand("insertTableColumnAfter", () => {
            rt(true);
          }, Gi),

          editor.registerCommand("insertTableColumnBefore", () => {
            rt(false);
          }, Gi),

          editor.registerCommand("deleteTableRow", () => {
            ct();
          }, Gi),

          editor.registerCommand("deleteTableColumn", () => {
            ut();
          }, Gi),

          editor.registerCommand("deleteTable", () => {
            const selection = $r();
            if (!wr(selection)) return false
            ln(selection.anchor.getNode())?.remove();
          }, Gi)
        )
      }
    })
  }
}

class AttachmentsExtension extends LexxyExtension {
  get enabled() {
    return this.editorElement.supportsAttachments
  }

  get lexicalExtension() {
    return Yl({
      name: "lexxy/action-text-attachments",
      nodes: [
        ActionTextAttachmentNode,
        ActionTextAttachmentUploadNode,
        ImageGalleryNode
      ],
      register(editor) {
        return ec(
          editor.registerCommand(ue$2, $collapseIntoGallery, Gi)
        )
      }
    })
  }
}

function $collapseIntoGallery(backwards) {
  const anchor = $r()?.anchor;
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

  const isWithinEmptyParagraph = Yi(anchorNode) && anchorNode.isEmpty();
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

  if (Li(previousNode)) {
    // Handled by Lexxy decorator selection behavior
    return false
  } else if (previousNode.isEmpty()) {
    previousNode.remove();
  } else {
    previousNode.selectEnd();
  }

  return true
}

class LexicalEditorElement extends HTMLElement {
  static formAssociated = true
  static debug = false
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
    this.config = new EditorConfiguration(this);
    this.extensions = new Extensions(this);

    this.editor = this.#createEditor();

    this.contents = new Contents(this);
    this.selection = new Selection(this);
    this.clipboard = new Clipboard(this);

    CommandDispatcher.configureFor(this);
    this.#initialize();

    requestAnimationFrame(() => dispatch(this, "lexxy:initialize"));
    this.toggleAttribute("connected", true);

    this.#handleAutofocus();

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
    this.editor.dispatchCommand(Ve$2, undefined);
  }

  toString() {
    if (!this.cachedStringValue) {
      this.editor?.getEditorState().read(() => {
        this.cachedStringValue = Io().getTextContent();
      });
    }

    return this.cachedStringValue
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

  get baseExtensions() {
    return [
      ProvisionalParagraphExtension,
      HighlightExtension,
      TrixContentExtension,
      TablesExtension,
      AttachmentsExtension
    ]
  }

  get directUploadUrl() {
    return this.dataset.directUploadUrl
  }

  get blobUrlTemplate() {
    return this.dataset.blobUrlTemplate
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

  // TODO: Deprecate `single-line` attribute
  get isSingleLineMode() {
    return this.hasAttribute("single-line")
  }

  get contentTabIndex() {
    return parseInt(this.editorContentElement?.getAttribute("tabindex") ?? "0")
  }

  focus() {
    this.editor.focus(() => this.#onFocus());
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
      ds(Vn);
      const root = Io();
      root.clear();
      root.append(...this.#parseHtmlIntoLexicalNodes(html));
      root.selectEnd();

      this.#toggleEmptyStatus();

      // The first time you set the value, when the editor is empty, it seems to leave Lexical
      // in an inconsistent state until, at least, you focus. You can type but adding attachments
      // fails because no root node detected. This is a workaround to deal with the issue.
      requestAnimationFrame(() => this.editor?.update(() => { }));
    });
  }

  #parseHtmlIntoLexicalNodes(html) {
    if (!html) html = "<p></p>";
    const nodes = m$1(this.editor, parseHtml(`${html}`));

    return nodes
      .map(this.#wrapTextNode)
      .map(this.#unwrapDecoratorNode)
  }

  // Raw string values produce TextNodes which cannot be appended directly to the RootNode.
  // We wrap those in <p>
  #wrapTextNode(node) {
    if (!yr(node)) return node

    const paragraph = Vi();
    paragraph.append(node);
    return paragraph
  }

  // Custom decorator block elements such as action-text-attachments get wrapped into <p> automatically by Lexical.
  // We unwrap those.
  #unwrapDecoratorNode(node) {
    if (Yi(node) && node.getChildrenSize() === 1) {
      const child = node.getFirstChild();
      if (Li(child) && !child.isInline()) {
        return child
      }
    }
    return node
  }

  #initialize() {
    this.#synchronizeWithChanges();
    this.#registerComponents();
    this.#handleEnter();
    this.#registerFocusEvents();
    this.#attachDebugHooks();
    this.#attachToolbar();
    this.#loadInitialValue();
    this.#resetBeforeTurboCaches();
  }

  #createEditor() {
    this.editorContentElement ||= this.#createEditorContentElement();

    const editor = Qt$2({
      name: "lexxy/core",
      namespace: "Lexxy",
      theme: theme,
      nodes: this.#lexicalNodes
    },
      ...this.extensions.lexicalExtensions
    );

    editor.setRootElement(this.editorContentElement);

    return editor
  }

  get #lexicalNodes() {
    const nodes = [ CustomActionTextAttachmentNode ];

    if (this.supportsRichText) {
      nodes.push(
        _t$2,
        Tt$2,
        ue$1,
        se$1,
        U$1,
        nt$1,
        E$3,
        $$2,
        HorizontalDividerNode
      );
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
    this.#validationTextArea.value = this.isEmpty ? "" : html;

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
      this.#clearCachedValues();
      this.#internalFormValue = this.value;
      this.#toggleEmptyStatus();
      this.#setValidity();
    }));
  }

  #clearCachedValues() {
    this.cachedValue = null;
    this.cachedStringValue = null;
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
    if (this.supportsRichText) {
      Jt$2(this.editor);
      Le$2(this.editor);
      this.#registerTableComponents();
      this.#registerCodeHiglightingComponents();
      if (this.supportsMarkdown) {
        Yt$1(this.editor, Jt$1);
      }
    } else {
      z$1(this.editor);
    }
    this.historyState = H();
    E$1(this.editor, this.historyState, 20);
  }

  #registerTableComponents() {
    this.tableTools = createElement("lexxy-table-tools");
    this.append(this.tableTools);
  }

  #registerCodeHiglightingComponents() {
    zt$2(this.editor);
    this.codeLanguagePicker = createElement("lexxy-code-language-picker");
    this.append(this.codeLanguagePicker);
  }

  #handleEnter() {
    // We can't prevent these externally using regular keydown because Lexical handles it first.
    this.editor.registerCommand(
      Ee$2,
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
      Gi
    );
  }

  #registerFocusEvents() {
    this.addEventListener("focusin", this.#handleFocusIn);
    this.addEventListener("focusout", this.#handleFocusOut);
  }

  #handleFocusIn(event) {
    if (this.#elementInEditorOrToolbar(event.target) && !this.currentlyFocused) {
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


  #attachDebugHooks() {
    return
  }

  #attachToolbar() {
    if (this.#hasToolbar) {
      this.toolbarElement.setEditor(this);
      this.extensions.initializeToolbars();
    }
  }

  #findOrCreateDefaultToolbar() {
    const toolbarId = this.config.get("toolbar");
    if (toolbarId && toolbarId !== true) {
      return document.getElementById(toolbarId)
    } else {
      return this.#createDefaultToolbar()
    }
  }

  get #hasToolbar() {
    return this.supportsRichText && this.config.get("toolbar")
  }

  #createDefaultToolbar() {
    const toolbar = createElement("lexxy-toolbar");
    toolbar.innerHTML = LexicalToolbarElement.defaultTemplate;
    toolbar.setAttribute("data-attachments", this.supportsAttachments); // Drives toolbar CSS styles
    this.prepend(toolbar);
    return toolbar
  }

  #toggleEmptyStatus() {
    this.classList.toggle("lexxy-editor--empty", this.isEmpty);
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

    if (this.codeLanguagePicker) {
      this.codeLanguagePicker.remove();
      this.codeLanguagePicker = null;
    }

    if (this.tableHandler) {
      this.tableHandler.remove();
      this.tableHandler = null;
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

class ToolbarDropdown extends HTMLElement {
  connectedCallback() {
    this.container = this.closest("details");

    this.container.addEventListener("toggle", this.#handleToggle.bind(this));
    this.container.addEventListener("keydown", this.#handleKeyDown.bind(this));

    this.#onToolbarEditor(this.initialize.bind(this));
  }

  disconnectedCallback() {
    this.container.removeEventListener("keydown", this.#handleKeyDown.bind(this));
  }

  get toolbar() {
    return this.closest("lexxy-toolbar")
  }

  get editorElement() {
    return this.toolbar.editorElement
  }

  get editor() {
    return this.toolbar.editor
  }

  initialize() {
    // Any post-editor initialization
  }

  close() {
    this.editor.focus();
    this.container.open = false;
  }

  async #onToolbarEditor(callback) {
    await this.toolbar.editorConnected;
    callback();
  }

  #handleToggle() {
    if (this.container.open) {
      this.#handleOpen();
    }
  }

  async #handleOpen() {
    this.#interactiveElements[0].focus();
    this.#resetTabIndexValues();
  }

  #handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      this.close();
    }
  }

  async #resetTabIndexValues() {
    await nextFrame();
    this.#buttons.forEach((element, index) => {
      element.setAttribute("tabindex", index === 0 ? 0 : "-1");
    });
  }

  get #interactiveElements() {
    return Array.from(this.querySelectorAll("button, input"))
  }

  get #buttons() {
    return Array.from(this.querySelectorAll("button"))
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
      const selection = $r();
      if (!wr(selection)) return

      let node = selection.getNodes()[0];
      while (node && node.getParent()) {
        if (B$2(node)) {
          url = node.getURL();
          break
        }
        node = node.getParent();
      }
    });

    return url
  }
}

const APPLY_HIGHLIGHT_SELECTOR = "button.lexxy-highlight-button";
const REMOVE_HIGHLIGHT_SELECTOR = "[data-command='removeHighlight']";

// Use Symbol instead of null since $getSelectionStyleValueForProperty
// responds differently for backward selections if null is the default
// see https://github.com/facebook/lexical/issues/8013
const NO_STYLE = Symbol("no_style");

class HighlightDropdown extends ToolbarDropdown {
  connectedCallback() {
    super.connectedCallback();
    this.#registerToggleHandler();
  }

  initialize() {
    this.#setUpButtons();
    this.#registerButtonHandlers();
  }

  #registerToggleHandler() {
    this.container.addEventListener("toggle", this.#handleToggle.bind(this));
  }

  #registerButtonHandlers() {
    this.#colorButtons.forEach(button => button.addEventListener("click", this.#handleColorButtonClick.bind(this)));
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).addEventListener("click", this.#handleRemoveHighlightClick.bind(this));
  }

  #setUpButtons() {
    const colorGroups = this.editorElement.config.get("highlight.buttons");

    this.#populateButtonGroup("color", colorGroups.color);
    this.#populateButtonGroup("background-color", colorGroups["background-color"]);

    const maxNumberOfColors = Math.max(colorGroups.color.length, colorGroups["background-color"].length);
    this.style.setProperty("--max-colors", maxNumberOfColors);
  }

  #populateButtonGroup(attribute, values) {
    values.forEach((value, index) => {
      this.#buttonContainer.appendChild(this.#createButton(attribute, value, index));
    });
  }

  #createButton(attribute, value, index) {
    const button = document.createElement("button");
    button.dataset.style = attribute;
    button.style.setProperty(attribute, value);
    button.dataset.value = value;
    button.classList.add("lexxy-editor__toolbar-button", "lexxy-highlight-button");
    button.name = attribute + "-" + index;
    return button
  }

  #handleToggle({ newState }) {
    if (newState === "open") {
      this.editor.getEditorState().read(() => {
        this.#updateColorButtonStates($r());
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
    if (!wr(selection)) { return }

    // Use non-"" default, so "" indicates mixed highlighting
    const textColor = le$2(selection, "color", NO_STYLE);
    const backgroundColor = le$2(selection, "background-color", NO_STYLE);

    this.#colorButtons.forEach(button => {
      const matchesSelection = button.dataset.value === textColor || button.dataset.value === backgroundColor;
      button.setAttribute("aria-pressed", matchesSelection);
    });

    const hasHighlight = textColor !== NO_STYLE || backgroundColor !== NO_STYLE;
    this.querySelector(REMOVE_HIGHLIGHT_SELECTOR).disabled = !hasHighlight;
  }

  get #buttonContainer() {
    return this.querySelector(".lexxy-highlight-colors")
  }

  get #colorButtons() {
    return Array.from(this.querySelectorAll(APPLY_HIGHLIGHT_SELECTOR))
  }
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
    const unregister = this.#editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (this.#selection.isInsideCodeBlock) return

        const { node, offset } = this.#selection.selectedNodeWithOffset();
        if (!node) return

        if (yr(node)) {
          const fullText = node.getTextContent();
          const triggerLength = this.trigger.length;

          // Check if we have enough characters for the trigger
          if (offset >= triggerLength) {
            const textBeforeCursor = fullText.slice(offset - triggerLength, offset);

            // Check if trigger is at the start of the text node (new line case) or preceded by space or newline
            if (textBeforeCursor === this.trigger) {
              const isAtStart = offset === triggerLength;

              const charBeforeTrigger = offset > triggerLength ? fullText[offset - triggerLength - 1] : null;
              const isPrecededBySpaceOrNewline = charBeforeTrigger === " " || charBeforeTrigger === "\n";

              if (isAtStart || isPrecededBySpaceOrNewline) {
                unregister();
                this.#showPopover();
              }
            }
          }
        }
      });
    });
  }

  #addCursorPositionListener() {
    this.cursorPositionListener = this.#editor.registerUpdateListener(({ editorState }) => {
      if (this.closed) return

      editorState.read(() => {
        if (this.#selection.isInsideCodeBlock) {
          this.#hidePopover();
          return
        }

        const { node, offset } = this.#selection.selectedNodeWithOffset();
        if (!node) return

        if (yr(node) && offset > 0) {
          const fullText = node.getTextContent();
          const textBeforeCursor = fullText.slice(0, offset);
          const lastTriggerIndex = textBeforeCursor.lastIndexOf(this.trigger);
          const triggerEndIndex = lastTriggerIndex + this.trigger.length - 1;

          // If trigger is not found, or cursor is at or before the trigger end position, hide popover
          if (lastTriggerIndex === -1 || offset <= triggerEndIndex) {
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
    this.keyListeners.push(this.#editor.registerCommand(Ee$2, this.#handleSelectedOption.bind(this), Qi));
    this.keyListeners.push(this.#editor.registerCommand(De$2, this.#handleSelectedOption.bind(this), Qi));

    if (this.#doesSpaceSelect) {
      this.keyListeners.push(this.#editor.registerCommand(Oe$2, this.#handleSelectedOption.bind(this), Qi));
    }

    // Register arrow keys with CRITICAL priority to prevent Lexical's selection handlers from running
    this.keyListeners.push(this.#editor.registerCommand(be$2, this.#handleArrowUp.bind(this), Qi));
    this.keyListeners.push(this.#editor.registerCommand(we$1, this.#handleArrowDown.bind(this), Qi));
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
      this.#setPopoverOffsetX(x);
      this.#setPopoverOffsetY(y + verticalOffset);
      this.popoverElement.toggleAttribute("data-anchored", true);
    }

    const popoverRect = this.popoverElement.getBoundingClientRect();

    if (popoverRect.right > window.innerWidth) {
      this.popoverElement.toggleAttribute("data-clipped-at-right", true);
    }

    if (popoverRect.bottom > window.innerHeight) {
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
    return m$1(this.#editor, parseHtml(`${template.innerHTML}`))
  }

  #insertTemplatesAsAttachments(templates, stringToReplace, fallbackSgid = null) {
    this.#editor.update(() => {
      const attachmentNodes = this.#buildAttachmentNodes(templates, fallbackSgid);
      const spacedAttachmentNodes = attachmentNodes.flatMap(node => [ node, this.#getSpacerTextNode() ]).slice(0, -1);
      this.#editorContents.replaceTextBackUntil(stringToReplace, spacedAttachmentNodes);
    });
  }

  #buildAttachmentNodes(templates, fallbackSgid = null) {
    return templates.map(
      template => this.#buildAttachmentNode(
        template.innerHTML,
        template.getAttribute("content-type") || this.#defaultPromptContentType,
        template.getAttribute("sgid") || fallbackSgid
      ))
  }

  #getSpacerTextNode() {
    return pr(" ")
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

class CodeLanguagePicker extends HTMLElement {
  connectedCallback() {
    this.editorElement = this.closest("lexxy-editor");
    this.editor = this.editorElement.editor;
    this.classList.add("lexxy-floating-controls");

    this.#attachLanguagePicker();
    this.#hide();
    this.#monitorForCodeBlockSelection();
  }

  disconnectedCallback() {
    this.unregisterUpdateListener?.();
    this.unregisterUpdateListener = null;
  }

  #attachLanguagePicker() {
    this.languagePickerElement = this.#createLanguagePicker();

    this.languagePickerElement.addEventListener("change", () => {
      this.#updateCodeBlockLanguage(this.languagePickerElement.value);
    });

    this.languagePickerElement.setAttribute("nonce", getNonce());
    this.appendChild(this.languagePickerElement);
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
    const languages = { ...ht$1 };

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
    this.unregisterUpdateListener = this.editor.registerUpdateListener(() => {
      this.editor.getEditorState().read(() => {
        const codeNode = this.#getCurrentCodeNode();

        if (codeNode) {
          this.#codeNodeWasSelected(codeNode);
        } else {
          this.#hide();
        }
      });
    });
  }

  #getCurrentCodeNode() {
    const selection = $r();

    if (!wr(selection)) {
      return null
    }

    const anchorNode = selection.anchor.getNode();
    const parentNode = anchorNode.getParent();

    if (Q$1(anchorNode)) {
      return anchorNode
    } else if (Q$1(parentNode)) {
      return parentNode
    }

    return null
  }

  #codeNodeWasSelected(codeNode) {
    const language = codeNode.getLanguage();

    this.#updateLanguagePickerWith(language);
    this.#show();
    this.#positionLanguagePicker(codeNode);
  }

  #updateLanguagePickerWith(language) {
    if (this.languagePickerElement && language) {
      const normalizedLanguage = mt(language);
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

    if (!this.deleteButton) {
      this.#attachDeleteButton();
    }
  }

  disconnectedCallback() {
    if (this.deleteButton && this.handleDeleteClick) {
      this.deleteButton.removeEventListener("click", this.handleDeleteClick);
    }

    this.handleDeleteClick = null;
    this.deleteButton = null;
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
      const node = Do(this);
      node?.remove();
    });
  }
}

class TableController {
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

    this.#unregisterKeyHandlers();
  }

  get currentCell() {
    if (!this.currentCellKey) return null

    return this.editor.getEditorState().read(() => {
      const cell = Mo(this.currentCellKey);
      return (cell instanceof Ke$1) ? cell : null
    })
  }

  get currentTableNode() {
    if (!this.currentTableNodeKey) return null

    return this.editor.getEditorState().read(() => {
      const tableNode = Mo(this.currentTableNodeKey);
      return (tableNode instanceof _n) ? tableNode : null
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
      return qe$1(currentCell)
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
      return Ve$1(currentCell)
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
      const selection = $r();
      if (!selection || !this.selection.isTableCellSelected) return

      const node = selection.getNodes()[0];

      cellNode = rn(node);
      tableNode = ln(node);
    });

    this.currentCellKey = cellNode?.getKey() ?? null;
    this.currentTableNodeKey = tableNode?.getKey() ?? null;
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
      headerState = Ae$1.ROW;
    } else if (childType === "column") {
      cells = this.currentColumnCells;
      headerState = Ae$1.COLUMN;
    }

    if (!cells || cells.length === 0) return

    this.editor.update(() => {
      const firstCell = Je$1(cells[0]);
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
      const selection = $r();
      if (!selection) return

      const node = selection.getNodes()[0];

      rn(node)?.selectEnd();
    });
  }

  #commandName(command) {
    const { action, childType, direction } = command;

    const childTypeSuffix = upcaseFirst(childType);
    const directionSuffix = action == "insert" ? upcaseFirst(direction) : "";
    return `${action}Table${childTypeSuffix}${directionSuffix}`
  }

  #setHeaderStyle(cell, newStyle, headerState) {
    const tableCellNode = Je$1(cell);
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
      const cell = Je$1(row.getChildAtIndex(columnIndex));
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
      if (Yi(next)) {
        next.selectStart();
      } else {
        const newParagraph = Vi();
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
    this.unregisterBackspaceKeyHandler = this.editor.registerCommand(Me$2, (event) => this.#handleBackspaceKey(event), Xi);
    this.unregisterEnterKeyHandler = this.editor.registerCommand(Ee$2, (event) => this.#handleEnterKey(event), Xi);
  }

  #unregisterKeyHandlers() {
    this.unregisterBackspaceKeyHandler?.();
    this.unregisterEnterKeyHandler?.();

    this.unregisterBackspaceKeyHandler = null;
    this.unregisterEnterKeyHandler = null;
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
  connectedCallback() {
    this.tableController = new TableController(this.#editorElement);
    this.classList.add("lexxy-floating-controls");

    this.#setUpButtons();
    this.#hide();
    this.#monitorForTableSelection();
    this.#registerKeyboardShortcuts();
  }

  disconnectedCallback() {
    this.#unregisterKeyboardShortcuts();

    this.unregisterUpdateListener?.();
    this.unregisterUpdateListener = null;

    this.removeEventListener("keydown", this.#handleToolsKeydown);

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
    this.appendChild(this.#createRowButtonsContainer());
    this.appendChild(this.#createColumnButtonsContainer());

    this.appendChild(this.#createDeleteTableButton());
    this.addEventListener("keydown", this.#handleToolsKeydown);
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
    this.unregisterKeyboardShortcuts = this.#editor.registerCommand(Se$2, this.#handleAccessibilityShortcutKey, Xi);
  }

  #unregisterKeyboardShortcuts() {
    this.unregisterKeyboardShortcuts?.();
    this.unregisterKeyboardShortcuts = null;
  }

  #handleAccessibilityShortcutKey = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "F10") {
      const firstButton = this.querySelector("button, [tabindex]:not([tabindex='-1'])");
      firstButton?.focus();
    }
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
    this.unregisterUpdateListener = this.#editor.registerUpdateListener(() => {
      this.tableController.updateSelectedTable();

      const tableNode = this.tableController.currentTableNode;
      if (tableNode) {
        this.#show();
      } else {
        this.#hide();
      }
    });
  }

  #executeTableCommand(command) {
    this.tableController.executeTableCommand(command);
    this.#update();
  }

  #show() {
    this.style.display = "flex";
    this.#update();
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

    const tableElement = Sn(this.#editor, tableNode);
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
    "lexxy-toolbar": LexicalToolbarElement,
    "lexxy-editor": LexicalEditorElement,
    "lexxy-link-dropdown": LinkDropdown,
    "lexxy-highlight-dropdown": HighlightDropdown,
    "lexxy-prompt": LexicalPromptElement,
    "lexxy-code-language-picker": CodeLanguagePicker,
    "lexxy-node-delete-button": NodeDeleteButton,
    "lexxy-table-tools": TableTools,
  };

  Object.entries(elements).forEach(([ name, element ]) => {
    customElements.define(name, element);
  });
}

function highlightCode() {
  const elements = document.querySelectorAll("pre[data-language]");

  elements.forEach(preElement => {
    highlightElement(preElement);
  });
}

function highlightElement(preElement) {
  const language = preElement.getAttribute("data-language");
  let code = preElement.innerHTML.replace(/<br\s*\/?>/gi, "\n");

  const grammar = Prism$1.languages?.[language];
  if (!grammar) return

  // unescape HTML entities in the code block
  code = new DOMParser().parseFromString(code, "text/html").body.textContent || "";

  const highlightedHtml = Prism$1.highlight(code, grammar, language);
  const codeElement = createElement("code", { "data-language": language, innerHTML: highlightedHtml });
  preElement.replaceWith(codeElement);
}

const configure = Lexxy.configure;

// Pushing elements definition to after the current call stack to allow global configuration to take place first
setTimeout(defineElements, 0);

export { $createActionTextAttachmentNode, $createActionTextAttachmentUploadNode, $isActionTextAttachmentNode, ActionTextAttachmentNode, ActionTextAttachmentUploadNode, CustomActionTextAttachmentNode, LexxyExtension as Extension, HorizontalDividerNode, configure, highlightCode as highlightAll, highlightCode };
//# sourceMappingURL=lexxy.js.map
