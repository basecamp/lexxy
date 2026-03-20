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
    assert_selector "code[data-language='ruby']"
    assert_selector "code span.token.keyword", text: "def"
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
    assert_selector "code[data-language='ruby']"
    assert_selector "code mark[style*='background-color']", text: "hello"
  end
end
