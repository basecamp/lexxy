# frozen_string_literal: true

module ActionText
  class Editor::LexxyEditor < Editor
    def editor_tag(...)
      Tag.new(editor_name, ...)
    end
  end

  class Editor::LexxyEditor::Tag < Editor::Tag
    def render_in(view_context, ...)
      options[:value] = "<div>#{options[:value]}</div>" if options[:value].present?
      options[:name] = name
      super
    end
  end
end
