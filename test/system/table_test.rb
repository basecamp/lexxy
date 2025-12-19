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

    html = find_editor.value
    assert_match(/Test Cell/, html)
    assert_match(/<table>.*?Test Cell.*?<\/table>/m, html)
  end

  test "adding a new row" do
    find_editor.toggle_command("insertTable")

    click_table_handler_button("Add row")
    assert_editor_table_structure(4, 3)
  end

  test "toggling header style on row" do
    find_editor.toggle_command("insertTable")

    html_before = find_editor.value
    initial_th_in_first_row = html_before.match(/<tr>.*?<\/tr>/m)&.to_s&.scan(/<th\b/).count || 0

    more_menu = open_table_more_menu

    click_table_handler_button("Toggle row style")

    html = find_editor.value
    first_row_th_count = html.match(/<tr>.*?<\/tr>/m)&.to_s&.scan(/<th\b/).count || 0
    assert_not_equal initial_th_in_first_row, first_row_th_count, "Row header style should have changed"

    more_menu.click
    click_table_handler_button("Toggle row style")

    html = find_editor.value
    final_th_in_first_row = html.match(/<tr>.*?<\/tr>/m)&.to_s&.scan(/<th\b/).count || 0
    assert_equal initial_th_in_first_row, final_th_in_first_row, "Row header style should have reverted"
  end

  test "deleting a row" do
    find_editor.toggle_command("insertTable")

    initial_rows = find_editor.value.scan(/<tr>/).count

    click_table_handler_button("Remove row")

    html = find_editor.value
    rows = html.scan(/<tr>/).count
    assert_equal initial_rows - 1, rows, "Expected one less row after deletion"
  end

  test "adding a new column" do
    find_editor.toggle_command("insertTable")

    assert_editor_table_structure(3, 3)

    click_table_handler_button("Add column")
    assert_editor_table_structure(3, 4)
  end

  test "toggling header style on column" do
    find_editor.toggle_command("insertTable")

    html_before = find_editor.value
    initial_th_in_first_col = html_before.scan(/<tr>.*?<th\b/m).count

    more_menu = open_table_more_menu

    click_table_handler_button("Toggle column style")

    html = find_editor.value
    th_in_first_col_after = html.scan(/<tr>.*?<th\b/m).count
    assert_not_equal initial_th_in_first_col, th_in_first_col_after, "Column header style should have changed"

    more_menu.click
    click_table_handler_button("Toggle column style")

    html = find_editor.value
    th_in_first_col_final = html.scan(/<tr>.*?<th\b/m).count
    assert_equal initial_th_in_first_col, th_in_first_col_final, "Column header style should have reverted"
  end

  test "deleting a column" do
    find_editor.toggle_command("insertTable")

    assert_editor_table_structure(3, 3)

    click_table_handler_button("Remove column")
    assert_editor_table_structure(3, 2)
  end

  test "deleting the table" do
    find_editor.toggle_command("insertTable")

    assert_match(/<table>/, find_editor.value)

    open_table_more_menu

    click_table_handler_button("Delete table")

    html = find_editor.value
    assert_no_match(/<table>/, html, "Table should be removed")
  end

  test "tables render with action text" do
    find_editor.toggle_command("insertTable")
    click_on "Update Post"

    assert_no_selector "lexxy-editor"
    assert_table_structure(3, 3)
  end
end
