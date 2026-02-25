---
title: Installation
layout: default
nav_order: 3
has_children: true
---

# Installation

Add this line to your application's Gemfile:

```ruby
gem 'lexxy', '~> 0.1.26.beta' # Need to specify the version since it's a pre-release
```

And then execute:

```bash
bundle install
```

## With import maps

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

## With javascript bundlers

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

## With CDNs such as esm.sh

Like the ["Try it"](try-it) page, Lexxy's js can be included directly from [esm.sh](https://esm.sh). This will load all of Lexxy's dependencies.

```javascript
<link rel="stylesheet" href="https://unpkg.com/@37signals/lexxy@latest/dist/stylesheets/lexxy.css">
<script type="module">
  import * as Lexxy from "https://esm.sh/@37signals/lexxy@latest";
</script>

<lexxy-editor class="lexxy-content" placeholder="Write something…">
</lexxy-editor>
```

## Override Action Text defaults

By default, the gem overrides Action Text form helpers, so that if you use `form.rich_text_area`, it will render a Lexxy editor instead of the default Trix editor.

You can opt out of this behavior by disabling this option in `application.rb`:

```ruby
# config/application.rb
config.lexxy.override_action_text_defaults = false
```

If you do this, you can invoke Lexxy explicitly using the same helpers with a `lexxy` preffix: `lexxy_rich_textarea_tag` and `form.lexxy_rich_text_area`.

This path is meant to let you incrementally move to Lexxy, or to use it in specific places while keeping Trix in others.
