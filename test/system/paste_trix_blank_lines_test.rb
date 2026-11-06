require "application_system_test_case"

class PasteTrixBlankLinesTest < ApplicationSystemTestCase
  test "blank lines pasted from Trix content survive saving and re-editing" do
    visit edit_post_path(posts(:empty))

    find_editor.paste "First\n\n\nSecond", html: "<div>First</div><div><br></div><div><br></div><div>Second</div>"

    expected_html = "<p>First</p><p><br></p><p><br></p><p>Second</p>"
    assert_equal_html expected_html, find_editor.value

    click_on "Update Post"

    assert_selector "p", text: "Second"
    assert_selector "p > br:only-child", count: 2, visible: :all

    click_on "Edit this post"

    assert_equal_html expected_html, find_editor.value
  end
end
