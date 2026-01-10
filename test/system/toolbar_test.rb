require "application_system_test_case"

class ToolbarTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:hello_world))
    wait_for_editor
  end

  test "bold" do
    find_editor.select("everyone")
    click_on "Bold"

    assert_editor_html "<p>Hello <b><strong>everyone</strong></b></p>"
  end

  test "italic" do
    find_editor.select("everyone")
    click_on "Italic"

    assert_editor_html "<p>Hello <i><em>everyone</em></i></p>"
  end

  test "strikethrough" do
    find_editor.select("everyone")
    click_on "Strikethrough"

    assert_editor_html "<p>Hello <s>everyone</s></p>"
  end

  test "color highlighting" do
    find_editor.select("everyone")
    apply_highlight_option("color", 1)

    assert_editor_html "<p>Hello <mark style=\"color: var(--highlight-1);\">everyone</mark></p>"
  end

  test "background color highlighting" do
    find_editor.select("everyone")
    apply_highlight_option("background-color", 1)

    assert_editor_html "<p>Hello <mark style=\"background-color: var(--highlight-bg-1);\">everyone</mark></p>"
  end

  test "color and background highlighting" do
    find_editor.select("everyone")
    apply_highlight_option("color", 1)

    find_editor.select("everyone")
    apply_highlight_option("background-color", 1)

    assert_editor_html "<p>Hello <mark style=\"color: var(--highlight-1);background-color: var(--highlight-bg-1);\">everyone</mark></p>"
  end

  test "bold and color highlighting" do
    find_editor.select("everyone")
    click_on "Bold"

    find_editor.select("everyone")
    apply_highlight_option("color", 1)

    assert_editor_html "<p>Hello <b><mark style=\"color: var(--highlight-1);\"><strong>everyone</strong></mark></b></p>"
  end

  test "rotate headers" do
    find_editor.select("everyone")

    click_on "Heading"
    assert_editor_html "<h2>Hello everyone</h2>"

    click_on "Heading"
    assert_editor_html "<h3>Hello everyone</h3>"

    click_on "Heading"
    assert_editor_html "<h4>Hello everyone</h4>"

    click_on "Heading"
    assert_editor_html "<p>Hello everyone</p>"
  end

  test "bullet list" do
    find_editor.select("everyone")

    click_on "Bullet list"
    assert_editor_html "<ul><li>Hello everyone</li></ul>"
  end

  test "numbered list" do
    find_editor.select("everyone")

    click_on "Numbered list"
    assert_editor_html "<ol><li>Hello everyone</li></ol>"
  end

  test "toggle code for selected words" do
    find_editor.select("everyone")

    click_on "Code"
    assert_editor_html %( <p>Hello <code>everyone</code></p> )

    find_editor.select("everyone")
    click_on "Code"
    assert_editor_html "<p>Hello everyone</p>"
  end

  test "toggle code for block" do
    find_editor.click

    click_on "Code"
    assert_editor_html %( <pre data-language=\"plain\" data-highlight-language=\"plain\">Hello everyone</pre> )

    click_on "Code"
    assert_editor_html "<p>Hello everyone</p>"
  end

  test "insert quote without selection" do
    click_on "Quote"
    assert_editor_html "<blockquote><p>Hello everyone</p></blockquote>"
  end

  test "quote" do
    find_editor.select("everyone")

    click_on "Quote"
    assert_editor_html "<blockquote><p>Hello everyone</p></blockquote>"

    find_editor.select("everyone")
    click_on "Quote"
    assert_editor_html "<p>Hello everyone</p>"
  end

  test "multi line quote" do
    find_editor.value = "<p>Hello</p><p>Everyone</p>"
    find_editor.select_all
    click_on "Quote"
    assert_editor_html "<blockquote><p>Hello</p><p>Everyone</p></blockquote>"
  end

  test "links" do
    find_editor.select("everyone")

    find("[name='link']").click
    fill_in "Enter a URL…", with: "https://37signals.com"

    within "lexxy-link-dropdown" do
      click_on "Link"
    end

    assert_editor_html "<p>Hello <a href=\"https://37signals.com\">everyone</a></p>"
  end

  test "disable toolbar" do
    assert_selector "lexxy-toolbar"

    visit edit_post_path(posts(:hello_world), toolbar_disabled: true)

    assert_no_selector "lexxy-toolbar"
  end

  test "attachments icon display" do
    assert_selector "lexxy-toolbar button[name=upload]"

    visit edit_post_path(posts(:empty), attachments_disabled: true)

    assert_no_selector "lexxy-toolbar button[name=upload]"

    visit edit_post_path(posts(:empty), attachments_disabled: false)

    assert_selector "lexxy-toolbar button[name=upload]"

    visit edit_post_path(posts(:empty), attachments_disabled: nil)

    assert_selector "lexxy-toolbar button[name=upload]"

    visit edit_post_path(posts(:empty), attachments_disabled: "invalid")

    assert_selector "lexxy-toolbar button[name=upload]"
  end

  test "keyboard navigation from editor to toolbar" do
    find_editor.click

    find_editor.send [ :shift, :tab ]
    assert_toolbar_button_focused "bold"

    page.active_element.send_keys(:arrow_right)
    assert_toolbar_button_focused "italic"

    page.active_element.send_keys(:arrow_right)
    assert_toolbar_button_focused "strikethrough"

    page.active_element.send_keys(:arrow_left)
    assert_toolbar_button_focused "italic"
  end

  test "undo and redo commands" do
    # Start with empty editor
    visit edit_post_path(posts(:empty))

    # Type first text
    find_editor.send "Hello"
    assert_editor_html "<p>Hello</p>"

    # Type second text
    find_editor.send " World"
    assert_editor_html "<p>Hello World</p>"

    # Click undo 2 times
    click_on "Undo"
    assert_editor_html "<p>Hello</p>"

    click_on "Undo"
    assert_editor_html "<p><br></p>"

    # Click redo 2 times
    click_on "Redo"
    assert_editor_html "<p>Hello</p>"

    click_on "Redo"
    assert_editor_html "<p>Hello World</p>"
  end

  test "external toolbar" do
    visit edit_post_path(posts(:empty), toolbar_external: true)

    assert_selector "lexxy-toolbar#external_toolbar[connected]"
  end
end
