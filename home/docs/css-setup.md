---
title: CSS Setup
layout: default
parent: Installation
nav_order: 1
---

# CSS Setup

For the CSS, you can include it with the standard Rails helper:

```erb
<%= stylesheet_link_tag "lexxy" %>
```

You can copy the CSS to your project and adapt it to your needs.

## With JavaScript bundlers

If you're using esbuild, Vite, or any other JavaScript bundler, you can import the CSS via:

```javascript
import "@37signals/lexxy/stylesheets/lexxy.css"
```

Or from a bundler-processed CSS file:

```css
@import "@37signals/lexxy/stylesheets/lexxy.css";
```

If you only need part of the styles, import the individual files instead:

| Import                                              | Contents                                         |
|-----------------------------------------------------|--------------------------------------------------|
| `@37signals/lexxy/stylesheets/lexxy.css`            | Everything: the editor and rendered content      |
| `@37signals/lexxy/stylesheets/lexxy-content.css`    | Rendered Action Text content, with the variables |
| `@37signals/lexxy/stylesheets/lexxy-editor.css`     | The editor, with the variables                   |
| `@37signals/lexxy/stylesheets/lexxy-variables.css`  | The CSS variables only, for theming              |

## Custom styles and dark mode

All of Lexxy's color styles are defined as CSS variables in `app/stylesheets/lexxy-variables.css`. This enables a straightforward way to customize Lexxy to match your application's theme. You can see an example implementation of a custom dark mode style in the Sandbox's stylesheet at `test/dummy/app/assets/stylesheets/sandbox.css`.

### Text size

Content inherits its font size from the surrounding page, and headings are sized relative to it. To change the text size of the editor and rendered content, set `--lexxy-text-size` on `:root` or on any ancestor, for example `--lexxy-text-size: 1.125rem`. Headings and the toolbar scale with it. Use `rem` or `px`: an `em` value compounds when one rich text body is nested inside another.

Captions, file icons and the editor's menus and dialogs use `--lexxy-text-small` (`0.875rem` by default), which you can set separately. Spacing uses `--lexxy-content-margin`.

## Rendered Action Text content

For applying the same styles to rendered Action Text content, you need to override the current default by adding this template  `app/views/layouts/action_text/contents/_content.html.erb`:

```erb
<div class="lexxy-content">
  <%= yield -%>
</div>
```

To apply syntax highlighting to rendered Action Text content, you need to call the `highlightCode` function from Lexxy. For example, create a Stimulus controller in `app/javascript/controllers/syntax_highlight_controller.js`:

```javascript
import { Controller } from "@hotwired/stimulus"
import { highlightCode } from "lexxy"
// Or if you installed via a javascript bundler:
// import { highlightCode } from "@37signals/lexxy"

export default class extends Controller {
  connect() {
    highlightCode()
  }
}
```

`highlightCode` processes code blocks in small chunks, yielding to the browser between them so the page stays responsive on content with many or large code blocks. It returns a `Promise` that resolves when every block has been highlighted — calling it fire-and-forget, as above, is fine, or you can `await` it if you need to run code after highlighting completes.

Then update the Action Text Content template to include the `data-controller` attribute:

```erb
<div data-controller="syntax-highlight" class="lexxy-content">
  <%= yield -%>
</div>
```

If you are importing the npm package and want to split Lexxy from your main bundle, you can import just the `highlightCode` helper from a submodule:

```javascript
import { highlightCode } from "@37signals/lexxy/helpers"
```
