require "application_system_test_case"

class EventsTest < ApplicationSystemTestCase
  test "use lexxy:file-accept to allow valid attachments" do
    visit edit_post_path(posts(:empty), attachment_type: "image/png")

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
  end

  test "dispatch lexxy:upload-start and lexxy:upload-end on successful upload" do
    visit edit_post_path(posts(:empty))

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
    assert_dispatched_event "lexxy:upload-start"
    assert_dispatched_event "lexxy:upload-progress"
    assert_dispatched_event "lexxy:upload-end"
  end

  test "use lexxy:file-accept to block invalid attachments" do
    visit edit_post_path(posts(:empty), attachment_type: "image/png")

    attach_file file_fixture("note.txt") do
      click_on "Upload file"
    end

    assert_no_attachment content_type: "text/plain"
  end

  private
    def assert_dispatched_event(type)
      assert_selector "[data-event='#{type}']"
    end

    def assert_no_dispatched_event(type)
      assert_no_selector "[data-event='#{type}']"
    end
end
