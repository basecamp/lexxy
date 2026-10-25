require "application_system_test_case"

class TablesDisabledTest < ApplicationSystemTestCase
  TABLE_HTML = '<figure class="lexxy-content__table-wrapper"><table><thead><tr><th>alpha</th><th>beta</th></tr></thead><tbody><tr><td>gamma</td><td>delta</td></tr></tbody></table></figure><p>After table</p>'

  test "the table button and tools are not shown" do
    visit edit_post_path(posts(:empty), tables_disabled: true)
    wait_for_editor

    assert_no_selector "lexxy-toolbar button[name='table']"
    assert_no_selector "lexxy-editor lexxy-table-tools"
  end

  test "a table set as the value round-trips as paragraphs" do
    visit edit_post_path(posts(:empty), tables_disabled: true)
    wait_for_editor

    find_editor.value = TABLE_HTML

    assert_no_selector "lexxy-editor table"
    assert_text "After table"

    click_on "Update Post"

    within "article.post" do
      assert_no_selector "table"
      assert_text "alpha"
      assert_text "delta"
      assert_text "After table"
    end

    click_on "Edit this post"
    wait_for_editor
    assert_includes find_editor.value, "<p>alpha</p><p>beta</p><p>gamma</p><p>delta</p><p>After table</p>"
  end

  test "a table saved before tables were turned off loads as paragraphs" do
    post = posts(:empty)
    post.update!(body: TABLE_HTML)

    visit edit_post_path(post, tables_disabled: true)
    wait_for_editor

    assert_no_selector "lexxy-editor table"
    assert_includes find_editor.value, "<p>alpha</p><p>beta</p><p>gamma</p><p>delta</p><p>After table</p>"
  end
end
