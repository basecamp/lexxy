require "application_system_test_case"

class CodeBlockLinksTest < ApplicationSystemTestCase
  test "links inside a code block survive editing, saving, and rendering" do
    visit edit_post_path(posts(:linked_code))

    assert_selector "code", text: "see the docs here"

    # Editing the code block retokenizes it. Before the fix the fresh tokens
    # dropped the link; it must now survive the edit, the save, and the
    # Prism rewrite of the rendered view.
    find_editor.place_cursor_at_end
    find_editor.send "s"
    assert_selector "code", text: "see the docs heres"

    click_on "Update Post"

    assert_selector "pre[data-language='javascript']"
    assert_selector "pre a[href='https://example.com/']", text: "the docs"
  end

  test "links inside a code block survive a re-edit round-trip" do
    visit edit_post_path(posts(:linked_code))
    find_editor.place_cursor_at_end
    find_editor.send "s"
    click_on "Update Post"

    visit edit_post_path(posts(:linked_code))
    find_editor.place_cursor_at_end
    find_editor.send "s"
    click_on "Update Post"

    assert_selector "pre a[href='https://example.com/']", text: "the docs"
  end
end
