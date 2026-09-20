require "application_system_test_case"

class TurboCachingTest < ApplicationSystemTestCase
  # A same-document fragment navigation fires a native popstate with no Turbo state,
  # which makes Turbo cache the page without ever navigating away from it.
  test "editor survives an in-page anchor navigation" do
    visit edit_post_path(posts(:empty))
    assert_mounted_editor

    find_editor.send "Hello"
    page.execute_script("window.location.hash = 'comments'")

    assert_mounted_editor
    find_editor.send " world"
    assert_editor_plain_text "Hello world"
  end

  test "editor is restored intact from the Turbo page cache" do
    visit edit_post_path(posts(:empty))
    assert_mounted_editor

    find_editor.send "Hello"

    click_on "← Back to posts"
    assert_selector "h1", text: "Posts"

    page.go_back
    assert_mounted_editor

    find_editor.send "Restored"
    assert_editor_plain_text "Restored"
  end

  private
    def assert_mounted_editor
      wait_for_editor
      assert_css "lexxy-editor .lexxy-editor__content[data-lexical-editor]", count: 1
    end
end
