# Lexxy

A modern rich text editor for Rails, built on top of [Lexical](https://lexical.dev), the powerful text editor framework from Meta.

> [!IMPORTANT]  
> This is an early beta. It hasn't been battle-tested yet. Please try it out and report any issues you find.

## 📖 Table of Contents

- [✨ Features](#-features)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎛️ Options](#️-options)
- [🎯 Prompts](#-prompts)
  - [General Setup](#general-setup)
  - [Custom Attachments (Inline)](#custom-attachments-with-inline-loading)
  - [Custom Attachments (Remote)](#custom-attachments-with-remote-loading)
  - [Free HTML Attachments](#free-html-attachments)
  - [Remote Filtering](#remote-filtering)
  - [Prompt Options Reference](#prompt-options-reference)
- [🎪 Events](#-events)
  - [Available Events](#available-events)
  - [Event Examples](#event-examples)
  - [Preventing File Uploads](#preventing-file-uploads)
  - [Autosave Implementation](#autosave-implementation)
  - [Stimulus Integration](#stimulus-integration)
- [🛣️ Roadmap](#️-roadmap)
- [💻 Development](#-development)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

- **Built on [Lexical](https://lexical.dev)** - Meta's powerful text editor framework
- **Good HTML semantics** - Paragraphs are real `<p>` tags, as they should be
- **Markdown support** - Shortcuts, auto-formatting on paste
- **Real-time code syntax highlighting** - Beautiful code blocks with proper highlighting with Prism.js
- **Create links by pasting URLs** - Automatic link creation on selected text (💡 hit backspace to create a link)
- **Configurable prompts** - Support for mentions and other interactive prompts with multiple loading and filtering strategies
- **Preview attachments** - PDFs and Videos directly in the editor
- **Action Text compatibility** - Works seamlessly with Action Text, generating the same canonical HTML format it expects for attachments

![Lexxy editor screenshot](docs/images/home.screenshot.png)

## 🚀 Installation

Add this line to your application's Gemfile:

```ruby
gem 'lexxy', '~> 0.1.3.beta' # Need to specify the version since it's a pre-release
```

And then execute:

```bash
bundle install
```

Then, you need to import the lexxy source in your app. If you are using [propshaft](https://github.com/rails/propshaft) and [import maps](https://github.com/rails/importmap-rails) you can do:

```ruby
# importmap.rb
pin "lexxy", to: "lexxy.js"
```

```javascript
// application.js
import "lexxy"
```

For the CSS, you can include it with the standard Rails helper:

```erb
<%= stylesheet_link_tag "lexxy" %>
```

For applying the same styles to rendered Action Text content, you need to override the current default by adding this template  `app/views/layouts/action_text/contents/_content.html.erb`:

```erb
<div class="lexxy-content">
  <%= yield -%>
</div>
```

Of course, you can copy the CSS to your project and adapt it to your needs. 

> [!NOTE]  
> We'll streamline the configuration process as we work towards a final release.

## ⚙️ Configuration

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

## 🎛️ Options

The `<lexxy-editor>` element supports these options:

- **`placeholder`** - Text displayed when the editor is empty.
- **`toolbar`** - Pass `"false"` to disable the toolbar entirely, or pass an element ID to render the toolbar in an external element. By default, the toolbar is bootstrapped and displayed above the editor.
- **`attachments`** - Pass `"false"` to disable attachments completely. By default, attachments are supported, including paste and Drag & Drop support.

Lexxy uses the `ElementInternals` API to participate in HTML forms as any standard control. This means that you can use standard HTML attributes like `name`, `value`, `required`, `disabled`, etc.

## 🎯 Prompts

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

- **Inline**, by defining the items inside the `<lexxy-prompt>` element.
- **Remotely**, by setting a `src` attribute with an endpoint to load the items.

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
* `template[type="menu"]` defines how the item appears in the dropdown menu.
* `template[type="editor"]` defines how the item appears in the editor when selected.

### Custom attachments with inline loading

Imagine you want to implement a *mentions* feature, where users can type "@" and select a person to mention. You want to save mentions as action text attachments for further server-side processing when the form is submitted.

First, you need to include the `ActionText::Attachable` concern in your model.

```ruby
# app/models/person.rb
class Person < ApplicationRecord
  include ActionText::Attachable
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

Notice how the template for rendering the editor representation (`type="editor"`) uses the same template as the attachment partial. This way, you ensure consistency between how the mention looks in the editor and how it will render when displaying the text in view mode with Action Text.

Two important additional notes to use action text with custom attachments:

* Each `<lexxy-prompt-item>` must include a `sgid` attribute with the [global id that Action Text will use to find the associated model](https://guides.rubyonrails.org/action_text_overview.html#signed-globalid).
* The `<lexxy-prompt>` must include a `name` attribute that will determine the content type of the attachment. For example, for `name="mention"`, the attachment will be saved as `application/vnd.actiontext.mention`.

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
<% @people.each do |person| %>
  <%= render "people/prompt_item", person: person %>
<% end %>
```

### Free HTML attachments

If you don't want to use custom action text attachments, you can configure prompts to simply insert the prompt item HTML directly in the editor. This is useful for things like hashtags, emojis, or other inline elements that don't require server-side processing.

To enable these, you must add the `insert-editable-text` attribute to the `<lexxy-prompt>` element:

```erb
<lexxy-prompt trigger="@" src="<%= people_path %>" insert-editable-text>
</lexxy-prompt>
```

When configured like this, if you select an item from the prompt, the content of the `template[type="editor"]` will be inserted directly in the editor as HTML you can edit freely, instead of as an `<action-text-attachment>` element. Notice that in this case, you need to make sure that the HTML is compatible with the tags that Lexxy supports.

### Remote filtering

There are scenarios where you want to query the server for filtering, instead of loading all options at once. This is useful for large datasets or complex searches. In this case, you must add the `remote-filtering` attribute to the `<lexxy-prompt>` element:

```erb
<lexxy-prompt trigger="@" src="<%= people_path %>" name="mention" remote-filtering>
</lexxy-prompt>
```

By default, the `SPACE` key will select the current item in the prompt. If you want to allow spaces in the search query, you can add the `supports-space-in-searches` attribute to the prompt. This can be handy to search by full names in combination with remote filtering.

### Prompt Options reference

#### `<lexxy-prompt>`

- **`trigger`** - The character that activates the prompt (e.g., "@", "#", "/").
- **`src`** - Path or URL to load items remotely.
- **`name`** - Identifier for the prompt type (determines attachment content type, e.g., `name="mention"` creates `application/vnd.actiontext.mention`). Mandatory unless using `insert-editable-text`.
- **`empty-results`** - Message shown when no matches found. By default it is "Nothing found".
- **`remote-filtering`** - Enable server-side filtering instead of loading all options at once.
- **`insert-editable-text`** - Insert prompt item HTML directly as editable text instead of Action Text attachments.
- **`supports-space-in-searches`** - Allow spaces in search queries (useful with remote filtering for full name searches).

#### `<lexxy-prompt-item>`

- **`search`** - The text to match against when filtering (can include multiple fields for better search).
- **`sgid`** - The signed GlobalID for Action Text attachments (use `attachable_sgid` helper). Mandatory unless using `insert-editable-text`.

## 🎪 Events

Lexxy dispatches custom events that you can listen to for implementing features like autosaving, custom attachment handling, and editor interactions. These events provide the same functionality as Trix events for easy migration.

All events are dispatched as standard DOM `CustomEvent`s with `bubbles: true`, making them perfect for Stimulus controllers in Rails applications.

### Available Events

#### `lexxy:change`
**Source**: [`src/elements/editor.js:220`](https://github.com/basecamp/lexxy/blob/main/src/elements/editor.js#L220)  
**Fired when**: Editor content changes (form value updates)  
**Perfect for**: Autosave functionality, change tracking, real-time preview

#### `lexxy:node-selected`  
**Source**: [`src/nodes/action_text_attachment_node.js:177`](https://github.com/basecamp/lexxy/blob/main/src/nodes/action_text_attachment_node.js#L177)  
**Fired when**: A node (attachment or decorator) is selected  
**Event detail**: `{ key: nodeKey }`  
**Perfect for**: Custom attachment interactions, selection handling

#### `lexxy:node-invalidated`
**Source**: [`src/nodes/action_text_attachment_node.js:209`](https://github.com/basecamp/lexxy/blob/main/src/nodes/action_text_attachment_node.js#L209)  
**Fired when**: A node needs to be updated with new values  
**Event detail**: `{ key: nodeKey, values: { caption: value } }`  
**Perfect for**: Node synchronization, attachment updates

#### `lexxy:move-to-next-line`
**Source**: [`src/nodes/action_text_attachment_node.js:215`](https://github.com/basecamp/lexxy/blob/main/src/nodes/action_text_attachment_node.js#L215)  
**Fired when**: Navigation events (Enter key in captions)  
**Perfect for**: Custom navigation handling, cursor management

### Stimulus Integration

#### Basic Lexxy Stimulus Controller

```javascript
// app/javascript/controllers/lexxy_editor_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["saveStatus", "changeCounter"]
  static values = { 
    autoSaveDelay: { type: Number, default: 1000 },
    autoSaveUrl: { type: String, default: "/autosave" }
  }
  
  connect() {
    this.changeCount = 0
    this.setupEventListeners()
  }
  
  setupEventListeners() {
    // Find lexxy-editor within controller scope
    this.lexxyEditor = this.element.querySelector('lexxy-editor')
    if (!this.lexxyEditor) {
      console.warn('lexxy-editor not found within controller scope')
      return
    }
    
    // Stimulus actions automatically bind events, but you can also listen manually
    this.lexxyEditor.addEventListener("lexxy:change", this.handleChange.bind(this))
    this.lexxyEditor.addEventListener("lexxy:node-selected", this.handleNodeSelected.bind(this))
  }
  
  // Handle content changes
  handleChange(event) {
    this.changeCount++
    if (this.hasChangeCounterTarget) {
      this.changeCounterTarget.textContent = this.changeCount
    }
    this.triggerAutoSave()
  }
  
  // Handle node selection  
  handleNodeSelected(event) {
    const { key } = event.detail
    console.log(`Node selected: ${key}`)
    // Custom node selection logic here
  }
  
  // Autosave functionality
  triggerAutoSave() {
    clearTimeout(this.autoSaveTimeout)
    
    if (this.hasSaveStatusTarget) {
      this.saveStatusTarget.textContent = "Saving..."
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.performAutoSave()
    }, this.autoSaveDelayValue)
  }
  
  performAutoSave() {
    const form = this.element.closest('form')
    const formData = new FormData(form)
    
    fetch(this.autoSaveUrlValue, {
      method: 'POST',
      body: formData,
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => {
      if (response.ok) {
        if (this.hasSaveStatusTarget) {
          this.saveStatusTarget.textContent = "✅ Saved"
          this.saveStatusTarget.className = "text-green-600"
        }
      } else {
        throw new Error(`Save failed: ${response.status}`)
      }
    })
    .catch(error => {
      if (this.hasSaveStatusTarget) {
        this.saveStatusTarget.textContent = "❌ Save failed"
        this.saveStatusTarget.className = "text-red-600"
      }
      console.error('Autosave failed:', error)
    })
  }
}
```

#### ERB Template Usage

```erb
<!-- Use Stimulus controller with data attributes -->
<div data-controller="lexxy-editor"
     data-lexxy-editor-auto-save-delay-value="2000"
     data-lexxy-editor-auto-save-url-value="<%= posts_path %>">
  
  <%= form.rich_text_area :content, placeholder: "Start typing..." do %>
    <lexxy-prompt trigger="@" src="<%= people_path %>" name="mention"></lexxy-prompt>
  <% end %>
  
  <!-- Status indicators using Stimulus targets -->
  <div class="flex justify-between items-center mt-2 text-sm">
    <span>Changes: <strong data-lexxy-editor-target="changeCounter">0</strong></span>
    <span data-lexxy-editor-target="saveStatus" class="text-gray-500">Ready</span>
  </div>
</div>
```

#### Stimulus Actions (Alternative Approach)

You can also use Stimulus actions directly in your ERB templates:

```erb
<!-- Using Stimulus actions for event handling -->
<!-- Note: This approach requires corresponding methods in your controller -->
<div data-controller="lexxy-editor" 
     data-action="lexxy:change->lexxy-editor#handleChange 
                  lexxy:node-selected->lexxy-editor#handleNodeSelected">
  
  <%= form.rich_text_area :content do %>
    <!-- prompts -->
  <% end %>
</div>

<!-- Tip: Use Stimulus actions for simple delegations, 
     addEventListener for complex logic with event details -->
```

### Advanced Examples

#### Preventing File Uploads with Stimulus

```javascript
// app/javascript/controllers/lexxy_secure_editor_controller.js  
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.lexxyEditor = this.element.querySelector('lexxy-editor')
    this.preventFileUploads()
  }
  
  preventFileUploads() {
    // Method 1: Disable attachments completely
    this.lexxyEditor.setAttribute('attachments', 'false')
    
    // Method 2: Prevent drag & drop
    this.lexxyEditor.addEventListener("dragover", this.preventDrag.bind(this))
    this.lexxyEditor.addEventListener("drop", this.preventDrop.bind(this))
    
    // Method 3: Prevent paste uploads
    this.lexxyEditor.addEventListener("paste", this.preventPasteFiles.bind(this))
  }
  
  preventDrag(event) {
    event.preventDefault()
    console.log("File drag prevented")
  }
  
  preventDrop(event) {
    event.preventDefault()
    this.showMessage("File uploads are not allowed", "error")
  }
  
  preventPasteFiles(event) {
    if (event.clipboardData && event.clipboardData.files.length > 0) {
      event.preventDefault()
      this.showMessage("File pasting is not allowed", "error") 
    }
  }
  
  showMessage(text, type) {
    // Show user-friendly message using your notification system
    console.log(`${type.toUpperCase()}: ${text}`)
  }
}
```

#### Multiple Event Handling

```javascript
// app/javascript/controllers/lexxy_advanced_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["eventLog"]
  
  connect() {
    this.lexxyEditor = this.element.querySelector('lexxy-editor')
    this.setupAllEventListeners()
  }
  
  setupAllEventListeners() {
    // Listen to all Lexxy events
    const events = [
      'lexxy:change',
      'lexxy:node-selected', 
      'lexxy:node-invalidated',
      'lexxy:move-to-next-line'
    ]
    
    events.forEach(eventType => {
      this.lexxyEditor.addEventListener(eventType, (event) => {
        this.logEvent(eventType, event.detail)
      })
    })
  }
  
  logEvent(type, detail) {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${type}: ${JSON.stringify(detail || {})}`
    
    if (this.hasEventLogTarget) {
      const div = document.createElement('div')
      div.className = "text-xs text-gray-600 border-b pb-1"
      div.textContent = logEntry
      this.eventLogTarget.prepend(div)
      
      // Keep only last 10 entries
      if (this.eventLogTarget.children.length > 10) {
        this.eventLogTarget.removeChild(this.eventLogTarget.lastChild)
      }
    }
    
    console.log(logEntry)
  }
}
```

### Event Migration from Trix

| Trix Event | Lexxy Equivalent | Stimulus Pattern |
|------------|------------------|------------------|
| `trix-change` | `lexxy:change` | `data-action="lexxy:change->controller#method"` |
| `trix-initialize` | Manual setup | Use `connect()` lifecycle |
| `trix-attachment-add` | DOM events + config | `attachments="false"` + drag prevention |
| `trix-file-accept` | DOM events + config | Custom validation in `paste` event |

### Integration with Rails Features

#### ActionCable Integration

```javascript
// Real-time collaborative editing
handleChange(event) {
  // Debounce changes for performance
  clearTimeout(this.broadcastTimeout)
  this.broadcastTimeout = setTimeout(() => {
    // Get or create subscription
    this.subscription = this.subscription || App.cable.subscriptions.create("DocumentChannel", {
      received: (data) => this.handleRemoteChange(data)
    })
    
    // Send change via subscription
    this.subscription.perform('content_changed', {
      content: event.target.value,
      document_id: this.documentIdValue
    })
  }, 500)
}

handleRemoteChange(data) {
  // Handle incoming changes from other users
  console.log('Remote change received:', data)
}
```

#### Rails Form Integration  

```javascript
// Ensure proper Rails form handling
performAutoSave() {
  const form = this.element.closest('form')
  const formData = new FormData(form)
  
  // Add Rails authenticity token safely
  const tokenElement = document.querySelector('meta[name="csrf-token"]')
  if (tokenElement) {
    formData.append('authenticity_token', tokenElement.content)
  }
  
  // Rails recognizes this as AJAX
  fetch(this.autoSaveUrlValue, {
    method: 'POST',
    body: formData,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    }
  })
}
```

All events work seamlessly with Rails conventions and Stimulus controllers, providing a native Rails development experience while leveraging Lexxy's powerful editor capabilities.

## 🛣️ Roadmap

This is an early beta. Here's what's coming next:

- **Configurable editors in Action Text** - Choose your editor like you choose your database.
- **More editing features**:
    - Tables
    - Text highlighting
- **Image galleries** - The only remaining feature for full Action Text compatibility
- **Install task** that generates the necessary JS and adds stylesheets.
- **Standalone JS package** - to use in non-Rails environments.

## 💻 Development

To build the JS source when it changes, run:

```bash
yarn build -w
```

To run the sandbox app:

```bash
bin/rails server
```

The sandbox app is available at http://localhost:3000. There is also a CRUD example at http://localhost:3000/posts.

## 🤝 Contributing

- Bug reports and pull requests are welcome on [GitHub Issues](https://github.com/basecamp/lexxy/issues). Help is especially welcome with [those tagged as "Help Wanted"](https://github.com/basecamp/lexxy/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22help%20wanted%22).
- For questions and general Lexxy discussion, please use the [Discussions section](https://github.com/basecamp/lexxy/discussions)

## 📄 License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).