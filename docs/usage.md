---
title: Usage
layout: default
nav_order: 3
---

# Usage

## Rails

You can add a Lexxy instance using the regular Action Text form helper:

```erb
<%= form_with model: @post do |form| %>
  <%= form.rich_text_area :content %>
<% end %>
```

## Vanilla HTML

Insert a `<lexxy-editor>` tag, that will be a first-class form control:

```html
<lexxy-editor name="post[body]"...>...</lexxy-editor>
```

See [Configuration](configuration.html) for details on customizing editors.
