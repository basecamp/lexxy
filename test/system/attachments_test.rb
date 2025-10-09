require "application_system_test_case"

class AttachmentsTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "upload image" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
  end

  test "upload previewable attachment" do
    attach_file file_fixture("dummy.pdf") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "application/pdf", caption: "dummy.pdf"
  end

  test "upload non previewable attachment" do
    attach_file file_fixture("note.txt") do
      click_on "Upload file"
    end

    assert_not_image_figure_attachment content_type: "text/plain", caption: "note.txt"
  end

  test "delete attachments with the keyboard" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"

    find("figure.attachment img").click
    find_editor.send_key "Delete"

    assert_no_attachment content_type: "image/png"

    assert_equal_html "<p><br></p>", find_editor.value
  end

  test "disable attachments" do
    allow_console_messages

    visit edit_post_path(posts(:empty), attachments_disabled: true)

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_no_attachment content_type: "image/png"
  end
end
