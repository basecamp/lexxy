require "application_system_test_case"

class HorizontalDividerTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "insert horizontal divider via toolbar" do
    find_editor.send "Some text before"

    click_on "Insert a divider"

    assert_selector "figure.horizontal-divider"
    assert_selector "figure.horizontal-divider hr"

    find_editor.send "Some text after"

    assert_editor_html "<p>Some text before</p><hr><p>Some text after</p>"
  end

  test "delete horizontal divider with keyboard" do
    find_editor.send "Text before"
    click_on "Insert a divider"
    find_editor.send "Text after"

    find("figure.horizontal-divider").click
    wait_for_node_selection

    find_editor.send_key "Delete"
    wait_for_node_selection false

    assert_no_selector "figure.horizontal-divider"
    assert_editor_html "<p>Text before</p><p>Text after</p>"
  end

  test "horizontal divider with surrounding content" do
    find_editor.send "Before divider"
    click_on "Insert a divider"
    find_editor.send "After divider"

    assert_selector "figure.horizontal-divider" do
      assert_selector "hr"
    end

    assert_editor_html "<p>Before divider</p><hr><p>After divider</p>"
  end
end
