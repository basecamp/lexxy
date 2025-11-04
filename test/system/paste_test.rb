require "application_system_test_case"

class PasteTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "convert to markdown on paste" do
    find_editor.paste "Hello **there**"
    assert_equal_html "<p>Hello <b><strong>there</strong></b></p>", find_editor.value
  end

  test "create links when pasting URLs" do
    visit edit_post_path(posts(:hello_world))
    find_editor.select("everyone")
    find_editor.paste "https://37signals.com"
    assert_equal_html %(<p>Hello <a href="https://37signals.com">everyone</a></p>), find_editor.value
  end

  test "keep content when pasting URLs" do
    visit edit_post_path(posts(:hello_world))
    find_editor.paste "https://37signals.com"
    assert_equal_html %(<p><a href=\"https://37signals.com\">https://37signals.com</a>Hello everyone</p>), find_editor.value
  end

  test "create links when pasting URLs keeps formatting" do
    visit edit_post_path(posts(:hello_world))
    find_editor.select("everyone")
    find_editor.toggle_command("bold")
    find_editor.paste "https://37signals.com"
    assert_equal_html %(<p>Hello <a href="https://37signals.com"><b><strong>everyone</strong></b></a></p>), find_editor.value
  end

  test "don't convert markdown when pasting into code block" do
    find_editor.paste "some text"
    find_editor.toggle_command("insertCodeBlock")
    find_editor.paste "Hello **there**"
    assert_includes find_editor.value, "**there**"
    refute_includes find_editor.value, "<strong>there</strong>"
  end
end
