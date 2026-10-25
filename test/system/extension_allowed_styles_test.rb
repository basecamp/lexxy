require "application_system_test_case"

# A style an extension declares in allowedStyles survives the Action Text round
# trip: the editor's sanitizer keeps it in the submitted value, the server's
# sanitizer keeps it on render, and re-editing imports it again.
class ExtensionAllowedStylesTest < ApplicationSystemTestCase
  test "a declared style survives save, render and re-edit" do
    visit edit_post_path(posts(:empty), allow_text_align: true)
    enter_centered_paragraph

    click_on "Update Post"
    assert_text "Post was successfully updated."

    assert_selector "article.post p[style*='text-align'][style*='center']", text: "Centered!"

    visit edit_post_path(posts(:empty), allow_text_align: true)

    assert_includes find_editor.value, "text-align: center"
    assert_includes find_editor.value, "Centered!"
  end

  test "an undeclared style is stripped from the saved value" do
    visit edit_post_path(posts(:empty))
    enter_centered_paragraph

    click_on "Update Post"
    assert_text "Post was successfully updated."

    assert_selector "article.post p", text: "Centered!"
    assert_no_selector "article.post p[style*='text-align']"
  end

  private
    # Typed into after it's set, so the submitted value is read back through the
    # editor's sanitizer rather than being the string just assigned.
    def enter_centered_paragraph
      find_editor.value = '<p style="text-align: center;">Centered</p>'
      find_editor.place_cursor_at_end
      find_editor.send "!"
    end
end
