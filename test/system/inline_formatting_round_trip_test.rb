require "application_system_test_case"

class InlineFormattingRoundTripTest < ApplicationSystemTestCase
  test "strikethrough and underline round-trip through edit, save, show, and re-edit" do
    visit edit_post_path(posts(:hello_world))
    wait_for_editor

    find_editor.select "everyone"
    find_editor.toggle_command "strikethrough"
    find_editor.toggle_command "underline"

    assert_editor_html "<p>Hello <u><s>everyone</s></u></p>"

    click_on "Update Post"

    within "article.post" do
      assert_selector "u s", text: "everyone"
    end

    click_on "Edit this post"
    wait_for_editor

    assert_editor_html "<p>Hello <u><s>everyone</s></u></p>"
  end
end
