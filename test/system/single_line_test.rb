require "application_system_test_case"

class SingleLineTest < ApplicationSystemTestCase
  test "disable multiline" do
    visit edit_post_path(posts(:empty), multiline_disabled: true)

    find_editor.send "Hello"
    find_editor.send :enter
    find_editor.send "there"

    assert_equal_html "<p>Hellothere</p>", find_editor.value
  end
end
