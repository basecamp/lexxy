require "application_system_test_case"

class LineBreakTest < ApplicationSystemTestCase
  test "line breaks default to hard" do
    visit edit_post_path(posts(:empty))

    find_editor.send "aaaa"
    find_editor.send :enter
    find_editor.send "bbbb"

    assert_editor_html "<p>aaaa</p><p>bbbb</p>"
  end

  test "with hard breaks, single enter inserts a paragraph break" do
    visit edit_post_path(posts(:empty), line_breaks: "hard")

    find_editor.send "aaaa"
    find_editor.send :enter
    find_editor.send "bbbb"

    assert_editor_html "<p>aaaa</p><p>bbbb</p>"
  end

  test "with soft breaks, single enter inserts a line break" do
    visit edit_post_path(posts(:empty), line_breaks: "soft")

    find_editor.send "aaaa"
    find_editor.send :enter
    find_editor.send "bbbb"

    assert_editor_html "<p>aaaa<br>bbbb</p>"
  end

  test "with hard breaks, double enter inserts a paragraph break with an empty paragraph" do
    visit edit_post_path(posts(:empty), line_breaks: "hard")

    find_editor.send "aaaa"
    find_editor.send :enter
    find_editor.send :enter
    find_editor.send "bbbb"

    assert_editor_html "<p>aaaa</p><p><br></p><p>bbbb</p>"
  end

  test "with soft breaks, double enter inserts a paragraph break" do
    visit edit_post_path(posts(:empty), line_breaks: "soft")

    find_editor.send "aaaa"
    find_editor.send :enter
    find_editor.send :enter
    find_editor.send "bbbb"

    assert_editor_html "<p>aaaa</p><p>bbbb</p>"
  end

  test "with hard breaks, backspace at paragraph start merges paragraphs" do
    visit edit_post_path(posts(:empty), line_breaks: "hard")

    find_editor.send "aaaa"
    find_editor.send :enter
    find_editor.send "bbbb"
    find_editor.send :home
    find_editor.send :backspace

    assert_editor_html "<p>aaaabbbb</p>"
  end

  test "with soft breaks, backspace at paragraph start merges with line break" do
    visit edit_post_path(posts(:empty), line_breaks: "soft")

    find_editor.send "aaaa"
    find_editor.send :enter
    find_editor.send :enter
    find_editor.send "bbbb"
    find_editor.send :home
    find_editor.send :backspace

    assert_editor_html "<p>aaaa<br>bbbb</p>"
  end

  test "with soft breaks, escape from blockquote with list at end" do
    visit edit_post_path(posts(:empty), line_breaks: "soft")

    find_editor.send "First line"
    find_editor.select_all

    click_on "Bullet list"
    assert_equal_html "<ul><li>First line</li></ul>", find_editor.value

    click_on "Quote"
    assert_equal_html "<blockquote><ul><li>First line</li></ul></blockquote>", find_editor.value

    find_editor.send :arrow_right # Move to end of selection
    find_editor.send :enter
    find_editor.send :enter
    find_editor.send :enter

    find_editor.send "Outside quote"

    assert_editor_html "<blockquote><ul><li>First line</li></ul></blockquote><p>Outside quote</p>"
  end

  test "with soft breaks, enter in list creates a new list item" do
    visit edit_post_path(posts(:empty), line_breaks: "soft")

    find_editor.send "First item"
    find_editor.select_all
    click_on "Bullet list"
    assert_equal_html "<ul><li>First item</li></ul>", find_editor.value

    find_editor.send :arrow_right # Move to end of selection
    find_editor.send :enter
    find_editor.send "Second item"

    assert_editor_html "<ul><li>First item</li><li>Second item</li></ul>"
  end
end
