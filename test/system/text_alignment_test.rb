require "application_system_test_case"

class TextAlignmentTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:hello_world))
  end

  test "right alignment is preserved after saving" do
    find_editor.select "everyone"
    apply_alignment "right"

    click_on "Update Post"

    assert_selector "p[style='text-align:right;']", text: "Hello everyone"
  end

  test "center alignment survives an edit round-trip" do
    find_editor.select "everyone"
    apply_alignment "center"

    click_on "Update Post"
    click_on "Edit this post"

    assert_equal_html '<p style="text-align: center;">Hello everyone</p>', find_editor.value
  end
end
