require "application_system_test_case"

class FocusTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "focus the editor" do
    find_editor.focus
    assert_editor_has_focus
  end

  test "text after focus doesn't add new line" do
    find_editor.focus
    find_editor.send "Hello there"

    assert_editor_html "<p>Hello there</p>"
  end

  test "autofocus attribute" do
    visit edit_post_path(posts(:empty), autofocus: true)
    assert_editor_has_focus
  end

  private
    def assert_editor_has_focus
      assert_equal active_element, find_editor.content_element, "editor should have focus"
    end
end
