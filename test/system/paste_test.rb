require "application_system_test_case"

class PasteTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "convert to markdown on paste" do
    find_editor.paste "Hello **there**"
    assert_editor_html "<p>Hello <b><strong>there</strong></b></p>"
  end

  test "create links when pasting URLs" do
    visit edit_post_path(posts(:hello_world))
    find_editor.select("everyone")
    find_editor.paste "https://37signals.com"

    assert_editor_html do
      assert_selector %(a[href="https://37signals.com"]), text: "everyone"
    end
  end

  test "keep content when pasting URLs" do
    visit edit_post_path(posts(:hello_world))
    find_editor.paste "https://37signals.com"

    assert_editor_html %(<p>Hello everyone<a href=\"https://37signals.com\">https://37signals.com</a></p>)
  end

  test "create links when pasting URLs keeps formatting" do
    visit edit_post_path(posts(:hello_world))
    find_editor.select("everyone")
    find_editor.toggle_command("bold")
    find_editor.paste "https://37signals.com"

    assert_editor_html %(<p>Hello <a href="https://37signals.com"><b><strong>everyone</strong></b></a></p>)
  end

  test "merge adjacent links when pasting URL over multiple words" do
    visit edit_post_path(posts(:empty))

    find_editor.send "Hello"
    find_editor.select("Hello")
    find_editor.paste "https://37signals.com"

    find_editor.send :arrow_right
    find_editor.send " everyone"

    find_editor.select_all
    find_editor.paste "https://37signals.com"

    assert_editor_html do
      assert_selector %(a[href="https://37signals.com"]), text: "Hello everyone", count: 1
      assert_no_selector %(a + a)
    end
  end

  test "don't convert markdown when pasting into code block" do
    find_editor.paste "some text"
    find_editor.toggle_command("insertCodeBlock")
    find_editor.paste "Hello **there**"

    assert_editor_html do
      assert_text "**there**"
      assert_no_selector "strong", text: "there"
    end
  end

  test "don't convert markdown when disabled" do
    visit edit_post_path(posts(:empty), markdown_disabled: true)
    find_editor.click
    find_editor.paste "Hello **there**"

    assert_editor_html "<p>Hello **there**</p>"
  end
end
