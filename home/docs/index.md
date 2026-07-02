---
title: Installation
layout: default
nav_order: 1
has_children: true
---

# Installation

## How to install

Add this line to your application's Gemfile:

```ruby
gem 'lexxy', '~> 0.9.21' # Need to specify the version since it's a pre-release
```

And then execute:

```bash
bundle install
```

### With import maps

If you are using [propshaft](https://github.com/rails/propshaft) and [import maps](https://github.com/rails/importmap-rails):

```ruby
# importmap.rb
pin "lexxy", to: "lexxy.js"
pin "@rails/activestorage", to: "activestorage.esm.js" # to support attachments
```

Then import it in your JavaScript entry point:

```javascript
// app/javascript/application.js
import "lexxy"
```

### With JavaScript bundlers

If you're using [jsbundling-rails](https://github.com/rails/jsbundling-rails), esbuild, webpack, or any other JavaScript bundler, you can install the NPM package:

```bash
yarn add @37signals/lexxy
yarn add @rails/activestorage # to support attachments
```

Then import it in your JavaScript entry point:

```javascript
// app/javascript/application.js
import "@37signals/lexxy"
```

### With CDNs such as esm.sh

Like the [sandbox]({{ "/sandbox/" | relative_url }}), Lexxy's JavaScript can be included directly from [esm.sh](https://esm.sh). This will load all of Lexxy's dependencies.

```html
<link rel="stylesheet" href="https://unpkg.com/@37signals/lexxy@latest/dist/stylesheets/lexxy.css">
<script type="module">
  import * as Lexxy from "https://esm.sh/@37signals/lexxy@latest"; /* <-- consider pinning to a stable version */
  // You can also configure Lexxy with:
  // Lexxy.configure(...)
</script>

<lexxy-editor class="lexxy-content" placeholder="Write something…">
</lexxy-editor>
```

## Integration with Action Text

Once the gem is installed, Lexxy takes over Action Text automatically — `form.rich_text_area` renders a Lexxy editor instead of Trix. No extra configuration is required. How it hooks in depends on your Rails version.

### Rails 8.2+

Lexxy is registered as an [Action Text editor adapter](https://github.com/rails/rails/pull/51238) and set as the default. The gem does this for you (`config.action_text.editor = :lexxy`), so you'd only touch that option to point Action Text at a different editor.

### Rails 8.0 and 8.1

These versions predate the editor adapter, so the gem overrides Action Text's form helpers so that `form.rich_text_area` renders a Lexxy editor instead of Trix.

You can opt out of this behavior by disabling this option in `application.rb`:

```ruby
# config/application.rb
config.lexxy.override_action_text_defaults = false
```

If you do this, you can invoke Lexxy explicitly using the same helpers with a `lexxy` prefix: `lexxy_rich_textarea_tag` and `form.lexxy_rich_text_area`.

This path is meant to let you incrementally move to Lexxy, or to use it in specific places while keeping Trix in others.
