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

## Custom styles and dark mode

All of Lexxy's color styles are defiend as CSS variables in `app/stylesheets/lexxy-variables.css`. This enables a straightforward way to customize Lexxy to match your application's theme. You can see an example implementation of a custom dark mode style in the Sandbox's stylesheet at `test/dummy/app/assets/stylesheets/sandbox.css`.

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

