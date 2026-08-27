module Lexxy
  # Builds the static markup a prerendering editor emits inside <lexxy-editor>
  # (see LexicalEditorElement#prerenderedContentElement). Shared by the Rails 8.2
  # editor-adapter Tag and the 8.0/8.1 TagHelper fallback.
  #
  # Between them, the two elements below reserve the whole height the editor
  # lands on: the toolbar's, which is fixed and could equally come from CSS, and
  # the content's, which varies per record and is the part no stylesheet can know.
  module Prerender
    def self.inner_html_for(view, options)
      parts = []
      parts << toolbar_placeholder_tag(view) if reserves_toolbar?(options)
      parts << content_tag_for(view, options[:value])

      view.safe_join(parts)
    end

    # The value is the same editable HTML the editor parses from the `value`
    # attribute, so the element renders at the height the live editor lands on.
    # Two deliberate differences from the live element:
    #
    # - It is sanitized with Action Text's display sanitizer (whose allow-list
    #   this engine already extends): the attribute path is escaped and then
    #   DOMPurify-cleaned client-side before touching the live DOM, but this
    #   HTML enters the DOM straight from storage, so it must not trust it.
    # - It carries none of the interactive attributes (contenteditable, role,
    #   aria-*): before Lexical mounts they would advertise an editability that
    #   isn't there yet — keystrokes would be discarded on adoption. The editor
    #   adds them when it adopts the element.
    def self.content_tag_for(view, value)
      html = view.sanitize(value.presence || "<p><br></p>",
        tags: view.sanitizer_allowed_tags, attributes: view.sanitizer_allowed_attributes)

      view.content_tag "div", html, class: "lexxy-editor__content"
    end

    # The toolbar itself, empty: the editor fills it in on connect rather than
    # building another one. It has to be a real <lexxy-toolbar> and not a neutral
    # spacer, because whether a toolbar occupies space at all is the host's CSS
    # to decide — an inline editor floats it out of flow, and a spacer sized from
    # --lexxy-toolbar-height would then reserve height nothing ever fills and
    # shift the page *up* on connect. Styled by the host's own toolbar rules, it
    # reserves exactly what the real one will take, including nothing.
    def self.toolbar_placeholder_tag(view)
      view.content_tag "lexxy-toolbar", "", data: { prerendered: "server" }, aria: { hidden: true }
    end

    # Only reserve a toolbar the editor is actually going to prepend, or the
    # field would give the space back on connect — the same shift, upwards.
    # Mirrors the client's own conditions: rich text off means no toolbar, and a
    # `toolbar` that names an element by id puts it outside this editor.
    def self.reserves_toolbar?(options)
      # fetch, not `||`: an explicit `toolbar: false` is exactly the case this
      # has to catch, and `||` would collapse it to nil and reserve anyway.
      toolbar = options.fetch(:toolbar) { options["toolbar"] }
      rich_text = options.fetch(:rich_text) { options.fetch("rich-text") { options["rich_text"] } }

      return false if [ false, "false" ].include?(rich_text)
      return false if [ false, "false" ].include?(toolbar)
      return false if toolbar.is_a?(String)

      true
    end
  end
end
