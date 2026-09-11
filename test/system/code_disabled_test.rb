require "application_system_test_case"

class CodeDisabledTest < ApplicationSystemTestCase
  test "a saved code block is reduced to plain text on load and round-trips without one" do
    visit edit_post_path(posts(:empty), code_blocks_disabled: true)
    wait_for_editor

    find_editor.value = '<pre data-language="plain"><code>alpha beta</code></pre><p>After</p>'

    assert_no_selector "lexxy-editor pre"
    assert_text "alpha beta"
    assert_text "After"

    click_on "Update Post"

    within "article.post" do
      assert_no_selector "pre"
      assert_text "alpha beta"
      assert_text "After"
    end

    click_on "Edit this post"
    wait_for_editor
    assert_no_match(/<pre/, find_editor.value)
    assert_includes find_editor.value, "alpha beta"
  end

  test "saved inline code is reduced to plain text on load and round-trips without it" do
    visit edit_post_path(posts(:empty), inline_code_disabled: true)
    wait_for_editor

    find_editor.value = "<p>Hello <code>world</code> again</p>"

    assert_no_selector "lexxy-editor code"
    assert_text "Hello"
    assert_text "world"

    click_on "Update Post"

    within "article.post" do
      assert_no_selector "code"
      assert_text "Hello world again"
    end

    click_on "Edit this post"
    wait_for_editor
    assert_no_match(/<code/, find_editor.value)
    assert_includes find_editor.value, "world"
  end
end
