---
title: Multiple attachments
layout: default
parent: Prompts
grand_parent: Configuration
nav_order: 5
---

# Multiple attachments from a single prompt item

A single prompt item can also insert multiple attachments. This is useful for scenarios like mentioning groups of users. To enable this, add multiple `<template type="editor">` elements inside your prompt item and attach the `sgid`s to the `template[type=editor]` tags:

```erb
<lexxy-prompt-item search="<%= group.name %>" >
  <template type="menu"><%= group.name %></template>
  <template type="editor" sgid="<% first.attachable_sgid %>">
    <%# first content %>
  </template>
  <template type="editor" sgid="<% second.attachable_sgid %>">
    <%# second content %>
  </template>
  <%# etc... %>
</lexxy-prompt-item>
```
