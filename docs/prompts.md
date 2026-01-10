---
title: Prompts
layout: default
parent: Configuration
nav_order: 1
has_children: true
---

# Prompts

Prompts let you implement features like @mentions, /commands, or any other trigger-based suggestions. When you select an item from the prompt, you have two options:

1. Insert the item as an [Action Text custom attachment](https://guides.rubyonrails.org/action_text_overview.html#signed-globalid). This allows you to use standard Action Text to customize how it renders or processes them on the server side.
2. Insert the item as free text in the editor.

Lexxy also lets you configure how to load the items: inline or remotely, and how to do the filtering (locally or on the server).

## General setup

The first thing to do is to add a `<lexxy-prompt>` element to the editor:

```erb
<%= form.rich_text_area :body do %>
  <lexxy-prompt trigger="@">
  </lexxy-prompt>
<% end %>
```

The `trigger` option determines which key will open the prompt. A prompt can load its items from two sources:

- Inline, by defining the items inside the `<lexxy-prompt>` element.
- Remotely, by setting a `src` attribute with an endpoint to load the items.

Regardless of the source, the prompt items are defined using `<lexxy-prompt-item>` elements. A basic prompt item looks like this:

```html
<lexxy-prompt-item search="...">
  <template type="menu">...</template>
  <template type="editor">
    ...
  </template>
</lexxy-prompt-item>
```

Where:

* `search` contains the text to match against when filtering.
* `template[type= "menu"]` defines how the item appears in the dropdown menu.
* `template[type= "editor"]` defines how the item appears in the editor when selected.
