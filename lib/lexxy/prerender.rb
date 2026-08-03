module Lexxy
  # Builds the static content element a prerendering editor emits inside
  # <lexxy-editor> (see LexicalEditorElement#prerenderedContentElement). Shared
  # by the Rails 8.2 editor-adapter Tag and the 8.0/8.1 TagHelper fallback.
  #
  # Scope: this reserves the height of the editor's *content* — the part that
  # varies per record, and so cannot be reserved by a CSS rule the way a fixed
  # row count can. It does not reserve the default toolbar, which
  # connectedCallback prepends in normal flow: an editor using it still gains
  # that element's height on mount. The editors this option exists for float the
  # toolbar out of flow, since an inline field standing in for published copy has
  # nowhere to put one, but the boundary is real and is pinned by
  # test/browser/tests/editor/prerender_adoption.test.js.
  module Prerender
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
  end
end
