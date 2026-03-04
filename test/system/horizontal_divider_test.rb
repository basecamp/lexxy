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

    find_editor.send_key "Delete"

    assert_no_selector "figure.horizontal-divider"
    assert_editor_html "<p>Text before</p><p>Text after</p>"
  end

  test "delete horizontal divider with the delete button" do
    find_editor.send "Text before"
    click_on "Insert a divider"
    find_editor.send "Text after"

    find("figure.horizontal-divider").click

    assert_selector "lexxy-node-delete-button"
    find("lexxy-node-delete-button button[aria-label='Remove']").click

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
