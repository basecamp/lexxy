require "application_system_test_case"

class CodeHighlightingTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "ruby code is highlighted in editor and after saving" do
    find_editor.send "def hello_world"
    find_editor.select("dev")
    click_on "Code"
    assert_equal "plain", find("select[name=lexxy-code-language]").value

    select "Ruby", from: "lexxy-code-language"
    assert_selector "span.code-token__attr", text: "def"

    click_on "Update Post"

    # Verify the rendered output has syntax highlighting
    assert_selector "pre[data-language='ruby']"
    assert_selector "pre span.token.keyword", text: "def"
  end

  test "color highlights inside code blocks are preserved in rendered view" do
    find_editor.send "def hello_world"
    find_editor.select("dev")
    click_on "Code"
    select "Ruby", from: "lexxy-code-language"

    # Apply a background highlight to "hello"
    find_editor.select "hello"
    apply_highlight_option "background-color", 1

    click_on "Update Post"

    # Verify the rendered output preserves the highlight mark inside Prism tokens
    assert_selector "pre[data-language='ruby']"
    assert_selector "pre mark[style*='background-color']", text: "hello"
  end

  test "color highlights survive editing the code block and saving" do
    find_editor.send "def hello_world"
    find_editor.select("dev")
    click_on "Code"
    select "Ruby", from: "lexxy-code-language"

    find_editor.select "hello"
    apply_highlight_option "background-color", 1
    assert_selector "code mark[style*='background-color']", text: "hello"

    # Appending to the code block retokenizes it. Before the fix the fresh
    # tokens dropped the highlight; it must now survive the edit and save.
    find_editor.place_cursor_at_end
    find_editor.send "s"
    assert_selector "code", text: "def hello_worlds"

    click_on "Update Post"

    assert_selector "pre[data-language='ruby']"
    assert_selector "pre mark[style*='background-color']", text: "hello"
  end
end
