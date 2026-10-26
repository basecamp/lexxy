---
title: Free HTML attachments
layout: default
parent: Prompts
grand_parent: Configuration
nav_order: 3
---

# Free HTML attachments

If you don't want to use custom action text attachments, you can configure prompts to simply insert the prompt item HTML directly in the editor. This is useful for things like hashtags, emojis, or other inline elements that don't require server-side processing.

To enable these, you must add the `insert-editable-text` attribute to the `<lexxy-prompt>` element:

```erb
<lexxy-prompt trigger="@" src="<%= people_path %>" insert-editable-text>
</lexxy-prompt>
```

When configured like this,if you select an item from the prompt, the content of the `template[type= "editor"]` will be inserted directly in the editor as HTML you can edit freely, instead of as an `<action-text-attachment>` element. Notice that in this case, you need to make sure that the HTML is compatible with the tags that Lexxy supports.
