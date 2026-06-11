require "application_system_test_case"

class OrderedListNumberingTest < ApplicationSystemTestCase
  test "ordered list numbering offset round-trips through edit, save, show, and re-edit" do
    visit edit_post_path(posts(:hello_world))
    wait_for_editor

    find_editor.value = '<ol start="2"><li>Second item</li><li>Third item</li></ol>'

    click_on "Update Post"

    within "article.post" do
      assert_selector "ol[start='2'] li", text: "Second item"
    end

    click_on "Edit this post"
    wait_for_editor

    assert_editor_html '<ol start="2"><li value="2">Second item</li><li value="3">Third item</li></ol>'
  end
end
