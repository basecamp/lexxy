require "application_system_test_case"

class TableTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
    wait_for_editor
  end

  test "tables render with action text" do
    find_editor.toggle_command("insertTable")
    click_on "Update Post"

    assert_no_selector "lexxy-editor"
    assert_table_structure(3, 3)
  end
end
