require "application_system_test_case"

class ListIndentationTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
    wait_for_editor
  end

  test "Tab key indents bullet list item" do
    find_editor.value = "<ul><li>First item</li><li>Second item</li></ul>"

    find_editor.select("Second item")

    find_editor.send_tab

    assert_equal_html "<ul><li>First item</li><li class=\"lexxy-nested-listitem\"><ul><li>Second item</li></ul></li></ul>", find_editor.value
  end

  test "multiple Tab presses create deeper nesting in bullet list" do
    find_editor.value = "<ul><li>First</li><li>Second</li></ul>"

    find_editor.select("Second")

    find_editor.send_tab
    find_editor.send_tab

    assert_equal_html "<ul><li>First</li><li class=\"lexxy-nested-listitem\"><ul><li class=\"lexxy-nested-listitem\"><ul><li>Second</li></ul></li></ul></li></ul>", find_editor.value
  end

  test "Tab and Shift+Tab can indent and outdent multiple times in bullet list" do
    find_editor.value = "<ul><li>First</li><li>Second</li></ul>"

    find_editor.select("Second")

    find_editor.send_tab
    find_editor.send_tab

    find_editor.send_tab(shift: true)

    assert_equal_html "<ul><li>First</li><li class=\"lexxy-nested-listitem\"><ul><li>Second</li></ul></li></ul>", find_editor.value
  end

  test "Shift+Tab outdents bullet list item" do
    find_editor.value = "<ul><li>First item</li><li class=\"lexxy-nested-listitem\"><ul><li>Nested item</li></ul></li></ul>"

    find_editor.select("Nested item")

    find_editor.send_tab(shift: true)

    assert_equal_html "<ul><li>First item</li><li>Nested item</li></ul>", find_editor.value
  end

  test "Tab key indents numbered list item" do
    find_editor.value = "<ol><li>First item</li><li>Second item</li></ol>"

    find_editor.select("Second item")

    find_editor.send_tab

    assert_equal_html "<ol><li>First item</li><li class=\"lexxy-nested-listitem\"><ol><li>Second item</li></ol></li></ol>", find_editor.value
  end

  test "Shift+Tab outdents numbered list item" do
    find_editor.value = "<ol><li>First item</li><li class=\"lexxy-nested-listitem\"><ol><li>Nested item</li></ol></li></ol>"

    find_editor.select("Nested item")

    find_editor.send_tab(shift: true)

    assert_equal_html "<ol><li>First item</li><li>Nested item</li></ol>", find_editor.value
  end

  test "Tab key does nothing when not inside a list" do
    find_editor.value = "<p>Regular paragraph</p>"

    find_editor.select("Regular")

    initial_value = find_editor.value

    find_editor.send_tab

    assert_equal_html initial_value, find_editor.value
  end
end
