# frozen_string_literal: true

module ActionText
  class Editor::LexxyEditor < Editor
    def editor_tag(...)
      Tag.new(editor_name, ...)
    end
  end

  class Editor::LexxyEditor::Tag < Editor::Tag
    def render_in(view_context, ...)
      options[:"alternative-text"] = Lexxy.supports_alternative_text? && options.fetch(:"alternative-text", true)
      # Strip html_safe to preserve attribute escaping (see #749)
      options[:value] = options[:value].to_str if options[:value].respond_to?(:to_str)
      super
    end
  end
end
