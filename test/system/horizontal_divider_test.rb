require "application_system_test_case"

class HorizontalDividerTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "insert horizontal divider via toolbar" do
    find_editor.send "Some text before"
    find_editor.send_key "Enter"

    click_on "Insert a divider"

    assert_selector "figure.horizontal-divider"
    assert_selector "figure.horizontal-divider hr"

    find_editor.send_key "Enter"
    find_editor.send "Some text after"

    assert_equal_html "<p>Some text before</p><hr><p>Some text after</p>", find_editor.value
  end

  test "delete horizontal divider with keyboard" do
    find_editor.send "Text before"
    find_editor.send_key "Enter"
    click_on "Insert a divider"
    find_editor.send_key "Enter"
    find_editor.send "Text after"

    # Click on the divider to select it
    find("figure.horizontal-divider").click
    find_editor.send_key "Delete"

    assert_no_selector "figure.horizontal-divider"
    assert_equal_html "<p>Text before</p><p>Text after</p>", find_editor.value
  end

  test "horizontal divider with surrounding content" do
    find_editor.send "Before divider"
    find_editor.send_key "Enter"
    click_on "Insert a divider"
    find_editor.send_key "Enter"
    find_editor.send "After divider"

    assert_selector "figure.horizontal-divider"
    assert_selector "figure.horizontal-divider hr"

    assert_equal_html "<p>Before divider</p><hr><p>After divider</p>", find_editor.value
  end
end
