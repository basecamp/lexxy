require "application_system_test_case"

class ListItemLineBreakRoundTripTest < ApplicationSystemTestCase
  test "a Shift+Enter line break at the end of a list item round-trips through save, show, and re-edit" do
    visit edit_post_path(posts(:empty))
    wait_for_editor

    find_editor.value = "<ul><li>First</li><li>Second</li><li>Third</li></ul>"
    find_editor.select "First"
    find_editor.send :arrow_right
    find_editor.send [ :shift, :enter ]

    expected_html = '<ul><li value="1">First<br><br></li><li value="2">Second</li><li value="3">Third</li></ul>'
    assert_editor_html expected_html

    click_on "Update Post"

    within "article.post" do
      assert_selector "li:first-child br", count: 2, visible: :all
    end
    first_item_height, second_item_height = evaluate_script(<<~JS)
      Array.from(document.querySelectorAll("article.post li"), (item) => item.getBoundingClientRect().height)
    JS
    assert_operator first_item_height, :>, second_item_height, "the line break should render as a blank line"

    click_on "Edit this post"
    wait_for_editor

    assert_editor_html expected_html
  end
end
