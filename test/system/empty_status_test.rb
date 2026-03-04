require "application_system_test_case"

class LoadHtmlTest < ApplicationSystemTestCase
  setup do
  end

  test "add empty class on load when it's empty" do
    visit edit_post_path(posts(:empty))

    assert_empty_class
    find_editor.value = "<p><br></p>"
    assert_empty_class
  end

  test "don't add empty class on load  if not empty" do
    visit edit_post_path(posts(:hello_world))
    assert_no_empty_class
  end

  test "update empty class dynamically as you type" do
    visit edit_post_path(posts(:empty))

    assert_empty_class
    find_editor.send "Hey there"
    assert_no_empty_class

    find_editor.select "Hey there"
    find_editor.send :backspace
    assert_empty_class
  end

  test "don't flag as empty when there is a pending upload" do
    visit edit_post_path(posts(:empty))
    assert_empty_class

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_selector "figure.attachment"
    assert_no_empty_class
  end

  test "don't flag as empty when there is only attachments" do
    visit edit_post_path(posts(:empty))

    assert_empty_class

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end
    assert_image_figure_attachment content_type: "image/png", caption: "example.png" # wait for upload to finish

    assert_no_empty_class
  end

  private
    EMPTY_SELECTOR = "lexxy-editor.lexxy-editor--empty"

    def assert_empty_class
      assert_selector EMPTY_SELECTOR
    end

    def assert_no_empty_class
      assert_no_selector EMPTY_SELECTOR
    end
end
