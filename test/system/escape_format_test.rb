require "application_system_test_case"

class EscapeFormatTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "escape from blockquote with list at end" do
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

    assert_equal_html "<blockquote><ul><li>First line</li></ul></blockquote><p>Outside quote</p>", find_editor.value
  end

  test "split blockquote when escaping from middle" do
    find_editor.send "First paragraph"
    find_editor.send :enter
    find_editor.send "Second paragraph"
    find_editor.send :enter
    find_editor.send "Third paragraph"
    find_editor.select_all
    click_on "Quote"

    find_editor.select("Second paragraph")
    find_editor.send :arrow_right  # Move to end of selection

    find_editor.send :enter
    find_editor.send :enter

    find_editor.send "Middle content"

    assert_equal_html "<blockquote><p>First paragraph</p><p>Second paragraph</p></blockquote><p>Middle content</p><blockquote><p>Third paragraph</p></blockquote>", find_editor.value
  end

  test "split blockquote when escaping from middle of list" do
    find_editor.send "Item one"
    find_editor.send :enter
    find_editor.send "Item two"
    find_editor.send :enter
    find_editor.send "Item three"
    find_editor.select_all
    click_on "Bullet list"

    click_on "Quote"
    assert_equal_html "<blockquote><ul><li>Item one</li><li>Item two</li><li>Item three</li></ul></blockquote>", find_editor.value

    find_editor.select("Item two")
    find_editor.send :arrow_right

    find_editor.send :enter
    find_editor.send :enter

    find_editor.send "Middle text"

    assert_equal_html "<blockquote><ul><li>Item one</li><li>Item two</li></ul></blockquote><p>Middle text</p><blockquote><ul><li>Item three</li></ul></blockquote>", find_editor.value
  end

  test "escape without splitting when all nodes after are empty" do
    find_editor.send "Item one"
    find_editor.select_all
    click_on "Bullet list"

    click_on "Quote"
    assert_equal_html "<blockquote><ul><li>Item one</li></ul></blockquote>", find_editor.value

    find_editor.send :arrow_right # Move to end of selection
    find_editor.send :enter
    find_editor.send :enter
    find_editor.send :enter

    find_editor.send "After escape"

    assert_equal_html "<blockquote><ul><li>Item one</li></ul></blockquote><p>After escape</p>", find_editor.value
  end
end
