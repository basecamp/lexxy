module FocusHelper
  def active_element
    page.evaluate_script "document.activeElement"
  end

  def assert_editor_has_focus
    assert_equal active_element, find_editor.content_element, "editor should have focus"
  end
end
