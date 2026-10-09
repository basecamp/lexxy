require "application_system_test_case"

class PlainTextPasteTest < ApplicationSystemTestCase
  PASTED_TEXT = "Plain text pasted from the clipboard"
  MODIFIER = RUBY_PLATFORM.include?("darwin") ? :command : :control

  test "pastes plain text when markdown is disabled" do
    visit new_post_path(markdown_disabled: 1)
    paste_from_clipboard PASTED_TEXT

    find_editor.within_contents do
      assert_text PASTED_TEXT
    end
  end

  test "pastes plain text in a plain-text-only editor" do
    visit new_post_path(rich_text_disabled: 1)
    paste_from_clipboard PASTED_TEXT

    find_editor.within_contents do
      assert_text PASTED_TEXT
    end
  end

  private
    def paste_from_clipboard(text)
      copy_to_clipboard text

      find_editor.click
      find_editor.content_element.send_keys [ MODIFIER, "v" ]
    end

    def copy_to_clipboard(text)
      title = find_field("Post title")
      title.set text
      title.send_keys [ MODIFIER, "a" ], [ MODIFIER, "c" ]
    end
end
