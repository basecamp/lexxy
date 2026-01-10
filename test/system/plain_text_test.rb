require "application_system_test_case"

class PlainTextTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:hello_world), rich_text_disabled: true)
  end

  test "markdown conversion on paste disabled in plain-text mode" do
    find_editor.select("Hello")
    find_editor.paste "**Hello**"

    assert_editor_html "<p>**Hello** everyone</p>"
  end

  test "formatting shortcuts disabled in plain-text mode" do
    find_editor.select("Hello")
    find_editor.send_key("b", ctrl: true)

    assert_editor_html "<p>Hello everyone</p>"
  end

  test "no toolbar in plaintext mode" do
    assert_no_selector "lexxy-toolbar"
  end
end
