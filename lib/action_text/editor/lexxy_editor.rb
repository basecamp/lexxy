# frozen_string_literal: true

module ActionText
  class Editor::LexxyEditor < Editor
    def editor_tag(...)
      Tag.new(editor_name, ...)
    end
  end

  class Editor::LexxyEditor::Tag < Editor::Tag
    def render_in(view_context, ...)
      # Strip html_safe to preserve attribute escaping (see #749)
      options[:value] = options[:value].to_str if options[:value].respond_to?(:to_str)

      # Opt-in: render the value into a content element the editor adopts on
      # connect (see LexicalEditorElement#prerenderedContentElement), so the
      # field has its final height at first paint instead of reflowing when the
      # editor builds a frame after load. Mirrors the same option on the
      # Rails 8.0/8.1 TagHelper fallback.
      if options.delete(:prerender) && @block.nil?
        value = options[:value]
        @block = proc { Lexxy::Prerender.content_tag_for(view_context, value) }
      end

      super
    end
  end
end
