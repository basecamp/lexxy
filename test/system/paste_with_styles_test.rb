require "application_system_test_case"

class PastesWithStylesTest < ApplicationSystemTestCase
  test "preserves non-canonical styles loaded from database" do
    post = posts(:empty)
    existing_styled_html = '<p>some <mark style="color: purple;">existing text</mark></p>'
    post.update!(body: existing_styled_html)

    visit edit_post_path(post)

    assert_equal_html existing_styled_html, find_editor.value
  end
end
