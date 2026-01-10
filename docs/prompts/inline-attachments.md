---
title: Custom attachments with inline loading
layout: default
parent: Prompts
grand_parent: Configuration
nav_order: 1
---

# Custom attachments with inline loading

Imagine you want to implement a *mentions* feature, where users can type "@" and select a person to mention. You want to save mentions as action text attachments for further server-side processing when the form is submitted.

First, you need to include the `ActionText::Attachable` concern in your model, and you need to define the `#content_type` method to return a value like `application/vnd.actiontext.<prompt name>`, where `<prompt name>` is the value of the `name` attribute you will set in the `<lexxy-prompt>` element later. Let's use `mention` as the prompt name:

```ruby
# app/models/person.rb
class Person < ApplicationRecord
  include ActionText::Attachable

  def content_type
    "application/vnd.actiontext.mention"
  end
end
```

By default, the partial to render the attachment will be looked up in `app/views/[model plural]/_[model singular].html.erb`. You can customize this by implementing `#to_attachable_partial_path` in the model. Let's go with the default and render a simple view that renders the person's name and initials:

```erb
# app/views/people/_person.html.erb
<em><%= person.name %></em> (<strong><%= person.initials %></strong>)
```

On the editor side, let's start with the *inline* approach by rendering all the prompt items inside the `<lexxy-prompt>` element:

```erb
<%= form.rich_text_area :body do %>
  <lexxy-prompt trigger="@" name="mention">
    <%= render partial: "people/prompt_item", collection: Person.all, as: :person %>
  </lexxy-prompt>
<% end %>
```

With `app/views/people/_prompt_item.html.erb` defining each prompt item:

```erb
<lexxy-prompt-item search="<%= "#{person.name} #{person.initials}" %>" sgid="<%= person.attachable_sgid %>">
  <template type="menu"><%= person.name %></template>
  <template type="editor">
    <%= render "people/person", person: person %>
  </template>
</lexxy-prompt-item>
```

Notice how the template for rendering the editor representation (`type=" editor") uses the same template as the attachment partial. This way, you ensure consistency between how the mention looks in the editor and how it will render when displaying the text in view mode with Action Text.

Two important additional notes to use action text with custom attachments:

* Each `<lexxy-prompt-item>` must include a `sgid` attribute with the [global id that Action Text will use to find the associated model](https://guides.rubyonrails.org/action_text_overview.html#signed-globalid).
* The `<lexxy-prompt>` must include a `name` attribute that will determine the content type of the attachment. For example, for `name= "mention"`, the attachment will be saved as `application/vnd.actiontext.mention`.
