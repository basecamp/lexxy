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
gem 'lexxy', '~> 0.9.21'
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

How Lexxy hooks into Action Text depends on your Rails version. On Rails 8.0 and 8.1, and on Rails versions with the editor adapter that don't include Lexxy, installing the gem is enough: `form.rich_text_area` renders a Lexxy editor instead of Trix.

### Rails with the Action Text editor adapter

On Rails versions with the [Action Text editor adapter](https://github.com/rails/rails/pull/51238), what makes Lexxy the default depends on whether that Rails version includes Lexxy.

#### Rails versions that include Lexxy

Action Text registers Lexxy as one of its editors and chooses the default editor with `config.load_defaults`. The gem doesn't change `config.action_text.editor`, so that setting decides which editor you get:

```ruby
# config/application.rb
config.action_text.editor = :lexxy
```

The gem leaves the setting alone whenever Lexxy is already registered as an Action Text editor, whether by Rails or by your application. If your application uses Lexxy through this gem and upgrades to a Rails version that includes Lexxy, but keeps `config.load_defaults` below that version, set the editor as above to keep Lexxy.

#### Rails versions that don't include Lexxy

The gem registers Lexxy as an editor and sets it as the default (`config.action_text.editor = :lexxy`), replacing the Trix default that Action Text configures.

To keep Trix, or another editor, while the gem is installed, disable this option in `application.rb`. Lexxy then leaves `config.action_text.editor` as you configure it:

```ruby
# config/application.rb
config.lexxy.override_action_text_defaults = false
config.action_text.editor = :trix
```

### Rails 8.0 and 8.1

These versions predate the editor adapter, so the gem overrides Action Text's form helpers so that `form.rich_text_area` renders a Lexxy editor instead of Trix.

You can opt out of this behavior by disabling this option in `application.rb`:

```ruby
# config/application.rb
config.lexxy.override_action_text_defaults = false
```

If you do this, you can invoke Lexxy explicitly using the same helpers with a `lexxy` prefix: `lexxy_rich_textarea_tag` and `form.lexxy_rich_text_area`.

This path is meant to let you incrementally move to Lexxy, or to use it in specific places while keeping Trix in others.

### Sanitizing rendered content

Lexxy's markup includes tables, audio and video, code languages and highlight styles, which Action Text's sanitizer removes by default. The gem adds them to `ActionText::ContentHelper.allowed_tags` and `ActionText::ContentHelper.allowed_attributes`, including lists your application sets itself, and allows the CSS `var()` function.

Rails versions that include Lexxy allow that markup themselves. On those, and whenever Lexxy is already registered as an Action Text editor, the gem leaves the sanitizer lists to Rails and your application. If your application sets its own lists there, include the markup you want to keep.
