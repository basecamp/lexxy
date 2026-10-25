
# Style

We aim to write code that is a pleasure to read, and we have a lot of opinions about how to do it well. Writing great code is an essential part of our programming culture, and we deliberately set a high bar for every code change anyone contributes. We care about how code reads, how code looks, and how code makes you feel when you read it.

Lexxy is young, and not all of the existing code follows this guide yet. When the surrounding code disagrees with what's written here, treat **this document** — not the neighboring code — as the source of truth, and improve what you touch as you go.

Lexxy is two things at once: a JavaScript rich text editor built on [Lexical](https://lexical.dev), and a thin Ruby gem that wires it into Action Text.

## General style

These rules apply to all the code we write, in any language.

### Comments

Avoid adding comments to code — the code itself should be both readable and understandable on its own. Comments are usually a sign that the code is below our standards.

If you feel the need to add a comment, it's a good idea to ask yourself if there is a way to rewrite the code to make it more clear without the comment. We only add comments to point out unexpected or non-obvious behavior such as non-obvious performance optimizations or workarounds.

Editor code attracts more of these legitimate comments than most code: browser quirks and ordering constraints are genuinely non-obvious, and a short comment explaining *why* a workaround exists earns its place. A comment that merely restates *what* the code does or what bug it fixed does not.

### Conditional returns

In general, we prefer to use expanded conditionals over guard clauses.

```js
// Bad
edit() {
  if (!this.isEditable) return
  this.showEditor()
}

// Good
edit() {
  if (this.isEditable) {
    this.showEditor()
  }
}
```

This is because guard clauses can be hard to read, especially when they are nested.

As an exception, we sometimes use guard clauses to return early from a method:

* When the return is right at the beginning of the method.
* When the main method body is not trivial and involves several lines of code.

A common, legitimate case in Lexxy is a type guard at the top of a `read`/`update` callback or a command handler, where the rest of the work is meaningless unless the selection is the type we expect:

```js
// Good — guard right at the start, non-trivial body follows
editor.update(() => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return

  // …several lines that only make sense for a range selection…
})
```

For similar reasons, we avoid ternaries. They're nifty in isolation but hard to parse at a glance, and they quickly turn into code golf once you start nesting them or stretching them across multiple lines. Prefer a plain `if`/`else`.

```js
// Bad
const [first, last] = from < to ? [from, to] : [to, from]

// Good
let first, last
if (from < to) {
  first = from
  last = to
} else {
  first = to
  last = from
}
```

### Performance and clarity

Don't make code harder to read for speculative or inconsequential performance wins. Prefer the clear, idiomatic version unless there is evidence that the code is on a meaningful hot path or the clearer version has obviously bad complexity for realistic inputs.

```js
// Bad: harder to read for a tiny, speculative win
#readingContaining(element) {
  const closestReading = element.closest?.("[data-reading]")

  if (closestReading && this.element.contains(closestReading)) {
    return closestReading
  } else {
    return this.readingTargets.find(reading => reading.contains(element))
  }
}

// Good: clear, idiomatic, fast enough for realistic inputs
#readingContaining(element) {
  return this.readingTargets.find(reading => reading.contains(element))
}
```

"Evidence" here is concrete: editor bootstrap, loading large documents, and big tables are real hot paths, and we have a benchmark harness for exactly this (`yarn benchmark:browser`). If you're optimizing, measure first — don't trade clarity for a guess.

### Methods ordering

We order methods in classes in the following order:

1. static members
2. public members, with the constructor at the top
3. private members

### Invocation order

We order methods vertically based on their invocation order. This helps us to understand the flow of the code. Use `#` to mark private methods.

```js
export default class Selection {
  save() {
    this.#validate()
    this.#persist()
  }

  #validate() {
    this.#checkRequiredFields()
    this.#checkUniqueness()
  }

  #checkRequiredFields() {
    // ...
  }

  #checkUniqueness() {
    // ...
  }

  #persist() {
    // ...
  }
}
```

### Defensive programming

We prefer code that fails fast and loudly when something is wrong, rather than code that tries to be defensive and handle unexpected cases silently. This helps us catch bugs early and makes it easier to understand when something is wrong — changing code to avoid an error often masks the bug causing it and manifests other errors later on.

The point is to distinguish *our* bugs from genuinely optional state. Swallowing a `null` that should never be `null` hides a bug; it's better to let it raise so we can find and fix the underlying issue.

Lexical, though, has plenty of legitimately optional state: `$getSelection()` returns `null` when there is no selection, and a selection may be a range, a node, or a grid selection. Guarding those is not defensive cruft — it's correctness (see [Selection type guards](#selection-type-guards)). The smell is the *opposite*: reaching for `?.` or a fallback to paper over a value that our own logic guarantees is present.

## JavaScript & Lexical

Lexxy's JavaScript is a set of plain ES modules. The editor is a custom element (`<lexxy-editor>`) that builds a handful of object-oriented controllers (`Contents`, `Selection`, `Clipboard`) around a Lexical editor, plus a set of extensions for optional behavior. Lexical is a *component we drive*, not the pattern we organize around.

`yarn lint` (ESLint) enforces our formatting: double quotes, no semicolons, two-space indentation, `camelCase`, `const`/`let` over `var`, and private fields/methods with `#`. Run it before every commit and fix what it flags.

Lexical's documentation is available at https://lexical.dev/docs/intro

### Internal variables

Declare internal state as private fields at the top of the class, then reference them with `this.#name`. Don't assign ad-hoc `this.something` properties from inside methods without declaring them first.

```js
// Bad
export default class Selection {
  start() {
    this.frame = requestAnimationFrame(() => this.#render())
  }
}

// Good
export default class Selection {
  #frame

  start() {
    this.#frame = requestAnimationFrame(() => this.#render())
  }
}
```

This keeps the class's state visible at a glance and makes the field genuinely private.

### OO controllers wrap Lexical

Our controllers exist to give the editor a clear, intention-revealing API and to keep Lexical's lower-level abstractions from leaking out. A controller method should read like a sentence about the editor, not like a Lexical incantation.

```js
// Good: a clear OO accessor that delegates to Lexical internally
get isInsideList() {
  let result = false
  this.editor.read(() => {
    result = $getNearestNodeOfType($getSelection()?.anchor.getNode(), ListItemNode) !== null
  })
  return result
}

// Bad: leaking Lexical's selection object out of the controller as the public API
getRangeSelection() {
  return $getSelection()
}
```

Keep UI concerns out of the controllers, and keep raw Lexical objects (`RangeSelection`, `LexicalNode`, commands) from appearing in their public signatures. Callers should talk to the controller in the editor's own vocabulary.

### Package features as Lexxy Extensions

Optional, self-contained behavior belongs in an extension that subclasses `LexxyExtension`, not bolted onto a controller. An extension declares whether it's `enabled` and returns a `lexicalExtension`; it owns its commands, transforms, and listeners.

```js
// Good
export class MyExtension extends LexxyExtension {
  get enabled() {
    return this.editorConfig.get("myFeature.enabled")
  }

  get lexicalExtension() {
    return defineExtension({
      name: "lexxy/my-feature",
      register(editor) {
        return mergeRegister(
          editor.registerCommand(MY_COMMAND, handler, COMMAND_PRIORITY_NORMAL)
        )
      }
    })
  }
}
```

When you find yourself adding a feature's commands and transforms directly to the editor wiring, ask whether it should be an extension instead. Features should be config-driven through the extension's `enabled` getter rather than hardcoded.

### Use NodeCaret for directional and symmetrical code

Lexical's powerful [NodeCaret](https://lexical.dev/docs/concepts/traversals) API allows writing symmetrical, direction-agnostic code. Especially consider a caret when:
- building a selection after a traversal: consider `$setSelectionFromCaretRange`
- writing functions which pass `direction` (and often `node`) as a parameter down the stack
- writing functions which are pairs around up/down, left/right, previous/next, or before/after

### Reading and writing editor state

Read editor state with `editor.read(() => { return state })`, which will return the callback's return value. Prefer `editor.read` over `editor.getEditorState().read()` unless you specifically need to access the in-flight state.

State is available inside `editor.update`. Don't nest a `read` within an `update` as this will flush updates and force reconciliation, impacting speed. Avoid nested `editor.update` calls as they will run sequentially: design code with a single, logical entry-point into the editor update.

Keep updates, command handlers, and reads synchronous unless specifically required. `requestAnimationFrame` and `await` within/around an update or handler are a smell and will likely cause bugs by acting on inconsistent state.

In an update listener, use the passed `{ editorState }` rather than reading a new one with `editor.getEditorState()`.

### Selection type guards

Always type-check a selection before acting on it. `$getSelection()` can return `null`, and the API surface differs between range, node, and grid selections.

```js
const selection = $getSelection()
if ($isRangeSelection(selection)) {
  selection.insertText("hello")
}
```

See https://lexical.dev/docs/concepts/selection

### Clean up listeners

Every `registerCommand`, `registerListener`, `addEventListener`, timer, or animation frame you create must be torn down. Use `mergeRegister()` to combine the teardown functions Lexical hands back. Leaked listeners are memory leaks and a frequent source of "ghost" behavior across editor instances.

Lexxy provides a `ListenerBin` helper class to track and clean up Lexical and browser listeners. A `registerEventListener` helper also returns a cleanup function for HTML events which is API compatible with Lexical listeners.

```js
const listeners = new ListenerBin()
listeners.track(mergeRegister(
  editor.registerCommand(MY_COMMAND, handler, COMMAND_PRIORITY_NORMAL),
  editor.registerUpdateListener(onUpdate),
  registerEventListener("button", "click", event => doSomething(event)))
))

// later
listeners.dispose()
```

### Prefer Lexical's built-in utilities

Lexical ships helpers for traversal and mutation. Reach for them instead of hand-rolling loops — the idiomatic version is shorter and often clearer. Most loops are replaceable by a native handler (or NodeCaret).

```js
// Bad: manual parent traversal
let current = node
while (current !== null) {
  if ($isListItemNode(current)) return current
  current = current.getParent()
}

// Good
return $getNearestNodeOfType(node, ListItemNode)
```

Other common swaps:

- `node.replace(newNode)` instead of `node.insertAfter(newNode); node.remove()`
- `node.isEmpty()` instead of `node.getChildrenSize() === 0`
- `parent.append(...children)` instead of `children.forEach(child => parent.append(child))`
- `$getCommonAncestor(a, b)` instead of comparing `getTopLevelElement()` by hand
- `$nodesOfType(NodeClass)` to find all nodes of a type

When you're unsure whether a utility exists or how an API behaves, check the [Lexical docs](https://lexical.dev/docs) or its source.

## Ruby

Lexxy's Ruby surface is small and intentionally thin: the Action Text editor registration, form helpers and builders, and the Rails engine that ships the assets. `bin/rubocop` (rubocop-rails-omakase) governs formatting — run it before committing.

The general rules above (comments, conditional returns, defensive programming, method/invocation ordering) apply to Ruby just as they do to JavaScript.

## Tests

We strongly value tests. Tests are how we keep changes honest — especially in the era of AI agents, which can lose context or implement one fix with disregard for existing behavior. A comprehensive suite catches those mistakes as soon as they happen.

Lexxy has three test suites, each with a clear job:

- **Vitest (`test/`, run with `yarn test`)** — fast JS unit tests for helpers and pure logic.
- **Playwright (`test/browser/`, run with `yarn test:browser`)** — real browser tests of editing behavior: typing, cursor/selection, formatting, paste, toolbar, keyboard shortcuts, node transforms, tables, code blocks.
- **Capybara system tests (`test/system/`, run with `bin/rails test:all`)** — the full Rails stack: Action Text rendering and persistence, Trix ↔ Lexxy conversion, uploads, SGID/prompt resolution, Turbo. Use these for anything that has to survive the editor → save → render → re-edit round-trip.

Use a browser-facing test in Playwright for anything involving rendering or interaction; reach for the fast Vitest layer only for logic that doesn't need a DOM. Capybara is for select editor round-trip tests where persistence is involved.

**Test behavior, not implementation.** Only test the public interface — never private methods directly. Set up state, drive the public API, and assert on what the user or caller observes. This keeps tests resilient to refactoring.

**Group related assertions.** You don't have to break every assertion into its own test case. Testing the response, the persisted record, and the redirect together in one case strikes a good balance between speed and readability.

**Use fixtures, not factories.** For the Rails suite, set up test data with fixtures (including Action Text and Active Storage fixtures). A handful of fixtures goes a long way; tweak one inline in a test when you need a small variation, and add a new fixture when you find yourself doing that repeatedly. Reuse `posts(:empty)` and `posts(:hello_world)` as starting points.

**Don't stub our own code.** Stubbing our own code couples tests to implementation details and makes refactoring painful. Stub *external* boundaries only, and as a last resort.

Whenever you need a fake URL or email address, use `example.com` or `example.org` — they're reserved for exactly this and won't reach anything real.
