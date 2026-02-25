require "application_system_test_case"

class TableTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
    wait_for_editor
  end

  test "adding a table" do
    find_editor.toggle_command("insertTable")
    assert_editor_table_structure(3, 3)
  end

  test "writing in table fields" do
    find_editor.toggle_command("insertTable")

    find_editor.send "Test Cell"

    within_table do
      assert_selector "th", text: "Test Cell"
    end
  end

  test "adding a new row" do
    find_editor.toggle_command("insertTable")

    click_table_handler_button("Add row")
    assert_editor_table_structure(3, 4)
  end

  test "toggling header style on row" do
    find_editor.toggle_command("insertTable")

    header_row = "tr:has(th + th + th)"
    single_hr_row = "tr:has(th + td + td)"

    within_table do
      assert_selector header_row, count: 1
      assert_selector single_hr_row, count: 2
    end

    open_table_row_menu
    click_table_handler_button("Toggle row style")

    within_table do
      assert_selector header_row, count: 0
      assert_selector single_hr_row, count: 3
    end

    open_table_row_menu
    click_table_handler_button("Toggle row style")

    within_table do
      assert_selector header_row, count: 1
      assert_selector single_hr_row, count: 2
    end
  end

  test "deleting a row" do
    find_editor.toggle_command("insertTable")

    within_table do
      assert_selector "tr", count: 3
    end

    click_table_handler_button("Remove row")

    within_table do
      assert_selector "tr", count: 2
    end
  end

  test "adding a new column" do
    find_editor.toggle_command("insertTable")
    assert_editor_table_structure(3, 3)

    click_table_handler_button("Add column")
    assert_editor_table_structure(4, 3)
  end

  test "toggling header style on column" do
    find_editor.toggle_command("insertTable")

    within_table do
      assert_selector "tr > th:first-child", count: 3
    end

    open_table_column_menu
    click_table_handler_button("Toggle column style")

    within_table do
      assert_selector "tr > th:first-child", count: 1
    end

    open_table_column_menu
    click_table_handler_button("Toggle column style")

    within_table do
      assert_selector "tr > th:first-child", count: 3
    end
  end

  test "deleting a column" do
    find_editor.toggle_command("insertTable")

    assert_editor_table_structure(3, 3)

    click_table_handler_button("Remove column")
    assert_editor_table_structure(2, 3)
  end

  test "deleting the table" do
    find_editor.toggle_command("insertTable")

    find_editor.value { has_table? }

    click_table_handler_button("Delete this table?")

    find_editor.value { has_no_table? }
  end

  test "tables render with action text" do
    find_editor.toggle_command("insertTable")
    click_on "Update Post"

    assert_no_selector "lexxy-editor"
    assert_table_structure(3, 3)
  end

  test "table is wrapped in figure.table-wrapper" do
    find_editor.toggle_command("insertTable")

    assert_editor_html do
      assert_selector "figure.lexxy-content__table-wrapper" do |figure|
        figure.has_table?
      end
    end
  end

  private
    def within_table(&)
      assert_editor_html do
        find("table").instance_exec(&) if has_table?
      end
    end
end
