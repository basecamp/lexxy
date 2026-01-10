---
title: Custom attachments with remote loading
layout: default
parent: Prompts
grand_parent: Configuration
nav_order: 2
---

# Custom attachments with remote loading

For moderately large sets, you can configure Lexxy to load all the options from a remote endpoint once, and filter them locally as the user types. This is a good balance between performance and responsiveness.

Continuing with the mentions example, we could have a controller action that returns all people as prompt items, and configure it as the remote source via the `src` attribute:

```erb
<lexxy-prompt trigger="@" src="<%= people_path %>" name="mention">
</lexxy-prompt>
```

We could define the controller action to serve the prompt items like this:

```ruby
class PeopleController < ApplicationController
  def index
    @people = Person.all

    render layout: false
  end
end
```

And the action would just list the prompt items:

```erb
<%= render partial: "people/prompt_item", collection: @people %>
```
