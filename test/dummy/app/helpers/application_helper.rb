module ApplicationHelper
  # Convert rich text content to Trix-editable HTML. When Lexxy is the
  # configured editor, to_editor_html returns canonical format (which Trix
  # can't understand), so we explicitly use the TrixEditor adapter to
  # produce the Trix-specific format.
  def to_trix_html(rich_text)
    return "" if rich_text.blank?

    content = rich_text.body
    return "" if content.blank?

    if defined?(ActionText::Editor)
      require "action_text/editor/trix_editor"
      trix_editor = ActionText::Editor::TrixEditor.new
      canonical_content = content.render_attachments(&:to_editor_attachment)
      canonical_fragment = ActionText::Fragment.wrap(canonical_content.fragment)
      trix_editor.as_editable(canonical_fragment).to_html
    else
      content.to_trix_html
    end
  end
end
