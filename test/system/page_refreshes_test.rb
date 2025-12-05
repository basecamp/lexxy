require "application_system_test_case"

class PageRefreshesTest < ApplicationSystemTestCase
  test "prompts work after page refresh" do
    visit edit_post_path(posts(:empty), refresh: true)

    find_editor.send "Hello"
    click_on "Update Post"

    wait_for_editor

    # Prompt is only opened if trigger follows a space or newline
    find_editor.send "\n"

    find_editor.send "1"
    click_on_prompt "Peter Johnson"
    assert_mention_attachment people(:peter)
  end
end
