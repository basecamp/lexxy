require "application_system_test_case"

class TablesDisabledTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty), tables_disabled: true)
    wait_for_editor
  end

  test "the table toolbar button is not visible" do
    assert_no_selector "lexxy-toolbar button[name='table']"
  end

  test "the lexxy-table-tools element is not created" do
    assert_no_selector "lexxy-editor lexxy-table-tools"
  end

  test "a saved table is stripped to plain text on load and round-trips without one" do
    find_editor.value = '<figure class="lexxy-content__table-wrapper"><table><thead><tr><th>alpha</th><th>beta</th></tr></thead><tbody><tr><td>gamma</td><td>delta</td></tr></tbody></table></figure><p>After table</p>'

    assert_no_selector "lexxy-editor table"
    assert_text "After table"
    assert_text "alpha"
    assert_text "delta"

    click_on "Update Post"

    within "article.post" do
      assert_no_selector "table"
      assert_text "After table"
      assert_text "alpha"
      assert_text "delta"
    end

    click_on "Edit this post"
    wait_for_editor
    assert_no_match(/<table/, find_editor.value)
    assert_includes find_editor.value, "alpha"
  end
end
