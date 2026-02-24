require "application_system_test_case"

class EditorValueMethodsTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "An empty editor is both blank and empty" do
    assert find_editor.empty?
    assert find_editor.blank?
  end

  test "Text is neither empty nor blank" do
    find_editor.send "Hello"

    assert_not find_editor.empty?
    assert_not find_editor.blank?
  end

  test "An editor with an attachment is neither empty nor blank" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    # give the upload a chance to happen
    wait_until {
      !find_editor.empty? && !find_editor.blank?
    }
  rescue Timeout::Error
    assert_not find_editor.empty?
    assert_not find_editor.blank?
  end

  test "An editor with prompt content is neither empty nor blank" do
    find_editor.send "1"
    click_on_prompt "Peter Johnson"
    assert_mention_attachment people(:peter)

    assert_not find_editor.empty?
    assert_not find_editor.blank?
  end

  test "An editor returns to empty and blank state atfer content is removed" do
    find_editor.send "Hello"
    find_editor.select_all
    find_editor.send :backspace

    assert find_editor.empty?
    assert find_editor.blank?
  end


  test "An editor with white space is blank but not empty" do
    find_editor.send "   "
    find_editor.send :tab
    find_editor.send :enter

    assert_not find_editor.empty?
    assert find_editor.blank?
  end
end
