require "application_system_test_case"

class MarkdownModeTest < ApplicationSystemTestCase
  include EditorHelper

  setup do
    visit edit_post_path(posts(:hello_world))
    wait_for_editor
  end

  test "toggle to markdown shows textarea with converted content" do
    click_on "Markdown"

    assert_selector ".lexxy-editor__markdown-textarea:not([hidden])"
    assert_selector ".lexxy-editor__content[hidden]"
  end

  test "toggle back to rich text converts markdown to HTML" do
    click_on "Markdown"
    find(".lexxy-editor__markdown-textarea").set("# Hello **world**")
    click_on "Markdown"

    assert_selector ".lexxy-editor__content:not([hidden])"
    assert_no_selector ".lexxy-editor__markdown-textarea:not([hidden])"
  end

  test "form submit from markdown mode saves HTML" do
    click_on "Markdown"
    find(".lexxy-editor__markdown-textarea").set("**bold text**")
    click_on "Update Post"

    visit edit_post_path(posts(:hello_world))
    wait_for_editor

    assert_selector ".lexxy-editor__content strong", text: "bold text"
  end
end
