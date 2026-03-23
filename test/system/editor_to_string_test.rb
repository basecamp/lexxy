require "application_system_test_case"

class EditorValueMethodsTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "Attachments return their placeholder strings" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_editor_plain_text "\n\n[example.png]\n\n"

    find("figcaption textarea").click.send_keys("Example Image")
    find_editor.click

    assert_editor_plain_text "\n\n[Example Image]\n\n"
  end

  test "toString returns content for custom_action_text_attachment (mention)" do
    find_editor.send "1"
    click_on_prompt "Peter Johnson"

    assert_editor_plain_text "Peter Johnson"
  end

  test "toString with mixed content includes all text" do
    find_editor.send "Hello, "
    find_editor.send "1"
    click_on_prompt "Peter Johnson"
    find_editor.send :backspace
    find_editor.send ". How are you?"

    assert_editor_plain_text "Hello, Peter Johnson. How are you?"
  end
end
