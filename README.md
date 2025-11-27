# Lexxy

A modern rich text editor for Rails.

> [!IMPORTANT]
> This is an early beta. It hasn't been battle-tested yet. Please try it out and report any issues you find.

## Features

- Built on top of [Lexical](https://lexical.dev), the powerful text editor framework from Meta.
- Good HTML semantics. Paragraphs are real `<p>` tags, as they should be.
- Markdown support: shortcuts, auto-formatting on paste.
- Real-time code syntax highlighting.
- Create links by pasting URLs on selected text.
- Configurable prompts. Support for mentions and other interactive prompts with multiple loading and filtering strategies.
- Preview attachments like PDFs and Videos in the editor.
- Works seamlessly with Action Text, generating the same canonical HTML format it expects for attachments.

![Lexxy editor screenshot](docs/images/home.screenshot.png)

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'lexxy', '~> 0.1.21.beta' # Need to specify the version since it's a pre-release
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

### With javascript bundlers

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

### Override Action Text defaults

By default, the gem overrides Action Text form helpers, so that if you use `form.rich_text_area`, it will render a Lexxy editor instead of the default Trix editor.

You can opt out of this behavior by disabling this option in `application.rb`:

```ruby# config/application.rb
config.lexxy.override_action_text_defaults = false
```

If you do this, you can invoke Lexxy explicitly using the same helpers with a `lexxy` preffix: `lexxy_rich_textarea_tag` and `form.lexxy_rich_text_area`.

This path is meant to let you incrementally move to Lexxy, or to use it in specific places while keeping Trix in others.

### CSS Setup

For the CSS, you can include it with the standard Rails helper:

```erb
<%= stylesheet_link_tag "lexxy" %>
```

You can copy the CSS to your project and adapt it to your needs.

#### Custom styles and dark mode

All of Lexxy's color styles are defiend as CSS variables in `app/stylesheets/lexxy-variables.css`. This enables a straightforward way to customize Lexxy to match your application's theme. You can see an example implementation of a custom dark mode style in the Sandbox's stylesheet at `test/dummy/app/assets/stylesheets/sandbox.css`.

#### Rendered Action Text content

For applying the same styles to rendered Action Text content, you need to override the current default by adding this template  `app/views/layouts/action_text/contents/_content.html.erb`:

```erb
<div class="lexxy-content">
  <%= yield -%>
</div>
```

To apply syntax highlighting to rendered Action Text content, you need to call the `highlightAll` function from Lexxy. For example, create a Stimulus controller in `app/javascript/controllers/syntax_highlight_controller.js`:

```javascript
import { Controller } from "@hotwired/stimulus"
import { highlightAll } from "lexxy"
// Or if you installed via a javascript bundler:
// import { highlightAll } from "@37signals/lexxy"

export default class extends Controller {
  connect() {
    highlightAll()
  }
}
```

Then update the Action Text Content template to include the `data-controller` attribute:

```erb
<div data-controller="syntax-highlight" class="lexxy-content">
  <%= yield -%>
</div>
```

## Configuration

You can add a Lexxy instance using the regular Action Text form helper:

```erb
<%= form_with model: @post do |form| %>
  <%= form.rich_text_area :content %>
<% end %>
```

Under the hood, this will insert a `<lexxy-editor>` tag, that will be a first-class form control:

```html
<lexxy-editor name="post[body]"...>...</lexxy-editor>
```

## Options

The `<lexxy-editor>` element supports these options:

- `placeholder`: Text displayed when the editor is empty.
- `toolbar`: Pass `"false"` to disable the toolbar entirely, or pass an element ID to render the toolbar in an external element. By default, the toolbar is bootstrapped and displayed above the editor.
- `attachments`: Pass `"false"` to disable attachments completely. By default, attachments are supported, including paste and Drag & Drop support.

Lexxy uses the `ElementInternals` API to participate in HTML forms as any standard control. This means that you can use standard HTML attributes like `name`, `value`, `required`, `disabled`, etc.

## Prompts

Prompts let you implement features like @mentions, /commands, or any other trigger-based suggestions. When you select an item from the prompt, you have two options:

1. Insert the item as an [Action Text custom attachment](https://guides.rubyonrails.org/action_text_overview.html#signed-globalid). This allows you to use standard Action Text to customize how it renders or processes them on the server side.
2. Insert the item as free text in the editor.

Lexxy also lets you configure how to load the items: inline or remotely, and how to do the filtering (locally or on the server).

### General setup

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

### Custom attachments with inline loading

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

### Custom attachments with remote loading

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

### Free HTML attachments

If you don't want to use custom action text attachments, you can configure prompts to simply insert the prompt item HTML directly in the editor. This is useful for things like hashtags, emojis, or other inline elements that don't require server-side processing.

To enable these, you must add the `insert-editable-text` attribute to the `<lexxy-prompt>` element:

```erb
<lexxy-prompt trigger="@" src="<%= people_path %>" insert-editable-text>
</lexxy-prompt>
```

When configured like this,if you select an item from the prompt, the content of the `template[type= "editor"]` will be inserted directly in the editor as HTML you can edit freely, instead of as an `<action-text-attachment>` element. Notice that in this case, you need to make sure that the HTML is compatible with the tags that Lexxy supports.

### Remote filtering

There are scenarios where you want to query the server for filtering, instead of loading all options at once. This is useful for large datasets or complex searches. In this case, you must add the `remote-filtering` attribute to the `<lexxy-prompt>` element:

```erb
<lexxy-prompt trigger="@" src="<%= people_path %>" name="mention" remote-filtering>
</lexxy-prompt>
```

By default, the `SPACE` key will select the current item in the prompt. If you want to allow spaces in the search query, you can add the `supports-space-in-searches` attribute to the prompt. This can be handy to search by full names in combination with remote filtering.

### Prompt Options reference

#### `<lexxy-prompt>`

- `trigger`: The character that activates the prompt (e.g., "@", "#", "/").
- `src`: Path or URL to load items remotely.
- `name`: Identifier for the prompt type (determines attachment content type, e.g., `name= "mention"` creates `application/vnd.actiontext.mention`). Mandatory unless using `insert-editable-text`.
- `empty-results`: Message shown when no matches found. By default it is "Nothing found".
- `remote-filtering`: Enable server-side filtering instead of loading all options at once.
- `insert-editable-text`: Insert prompt item HTML directly as editable text instead of Action Text attachments.
- `supports-space-in-searches`: Allow spaces in search queries (useful with remote filtering for full name searches).

#### `<lexxy-prompt-item>`

- `search`: The text to match against when filtering (can include multiple fields for better search).
- `sgid`: The signed GlobalID for Action Text attachments (use `attachable_sgid` helper). Mandatory unless using `insert-editable-text`.

## Roadmap

This is an early beta. Here's what's coming next:

- Configurable editors in Action Text: Choose your editor like you choose your database.
- More editing features:
    - Tables
    - Text highlighting
- Image galleries: The only remaining feature for full Action Text compatibility
- Install task that generates the necessary JS and adds stylesheets.
- Configuration hooks.
- Standalone JS package: to use in non-Rails environments.

## Development

To build the JS source when it changes, run:

```bash
yarn build -w
```

To the sandbox app:

```bash
bin/rails server
```

The sandbox app is available at http://localhost:3000. There is also a CRUD example at http://localhost:3000/posts.

## Events

Lexxy fires a handful of custom events that you can hook into.
Each event is dispatched on the `<lexxy-editor>` element.

### `lexxy:initialize`

Fired when the `<lexxy-editor>` element is attached to the DOM and ready for use.
This is useful for one-time setup.

### lexxy:focus and lexxy:blur

Fired whenever the editor element gains or loses focus.
Useful to show or hide accessory UI state.

### `lexxy:change`

Fired whenever the editor content changes.
You can use this to sync the editor state with your application.

### `lexxy:file-accept`

Fired when a file is dropped or inserted into the editor.

- Access the file via `event.detail.file`.
- Call `event.preventDefault()` to cancel the upload and prevent attaching the file.

### `lexxy:insert-link`

Fired when a plain text link is pasted into the editor.
Access the link’s URL via `event.detail.url`.

You also get a handful of callback helpers on `event.detail`:

- **`replaceLinkWith(html, options)`** – replace the pasted link with your own HTML.
- **`insertBelowLink(html, options)`** – insert custom HTML below the link.
- **Attachment rendering** – pass `{ attachment: true }` in `options` to render as non-editable content,
  or `{ attachment: { sgid: "your-sgid-here" } }` to provide a custom SGID.

#### Example: Link Unfurling with Stimulus

When a user pastes a link, you may want to turn it into a preview or embed.
Here’s a Stimulus controller that sends the URL to your app, retrieves metadata,
and replaces the plain text link with a richer version:

```javascript
// app/javascript/controllers/link_unfurl_controller.js
import { Controller } from "@hotwired/stimulus"
import { post } from "@rails/request.js"

export default class extends Controller {
  static values = {
    url: String, // endpoint that handles unfurling
  }

  unfurl(event) {
    this.#unfurlLink(event.detail.url, event.detail)
  }

  async #unfurlLink(url, callbacks) {
    const { response } = await post(this.urlValue, {
      body: JSON.stringify({ url }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })

    const metadata = await response.json()
    this.#insertUnfurledLink(metadata, callbacks)
  }

  #insertUnfurledLink(metadata, callbacks) {
    // Replace the pasted link with your custom HTML
    callbacks.replaceLinkWith(this.#renderUnfurledLinkHTML(metadata))

    // Or, insert below the link as an attachment:
    // callbacks.insertBelowLink(this.#renderUnfurledLinkHTML(metadata), { attachment: true })
  }

  #renderUnfurledLinkHTML(link) {
    return `<a href="${link.canonical_url}">${link.title}</a>`
  }
}
```

## Contributing

- Bug reports and pull requests are welcome on [GitHub Issues](https://github.com/basecamp/lexxy/issues). Help is especially welcome with [those tagged as "Help Wanted"](https://github.com/basecamp/lexxy/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22help%20wanted%22).
- For questions and general Lexxy discussion, please use the [Discussions section](https://github.com/basecamp/lexxy/discussions)

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
