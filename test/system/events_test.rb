require "application_system_test_case"

class EventsTest < ApplicationSystemTestCase
  test "no lexxy:change event on initial load" do
    visit edit_post_path(posts(:empty))

    assert_no_dispatched_event "lexxy:change"
  end

  test "dispatch lexxy:focus and lexxy:blur events on focus gain and loss" do
    visit edit_post_path(posts(:empty))
    find_editor.focus
    assert_dispatched_event "lexxy:focus"

    page.find("input[name='post[title]']").click
    assert_dispatched_event "lexxy:blur"
  end

  test "dispatch lexxy:change event on edits" do
    visit edit_post_path(posts(:empty))

    find_editor.send "Y"

    assert_dispatched_event "lexxy:change"
  end

  test "use lexxy:file-accept to allow valid attachments" do
    visit edit_post_path(posts(:empty), attachment_type: "image/png")

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
  end

  test "use lexxy:file-accept to block invalid attachments" do
    visit edit_post_path(posts(:empty), attachment_type: "image/png")

    attach_file file_fixture("note.txt") do
      click_on "Upload file"
    end

    assert_no_attachment content_type: "text/plain"
  end

  test "dispatch lexxs:insert-link event when a link is pasted in" do
    visit edit_post_path(posts(:empty))

    assert_no_dispatched_event "lexxy:insert-link"

    find_editor.paste "https://37signals.com"

    assert_dispatched_event "lexxy:insert-link"

    find_editor.value = ""

    find_editor.paste "https://example.com?action=replace&attachment=false"
    assert_selector "div", text: "Link Preview: https://example.com?action=replace&attachment=false"
    assert_no_selector "a[href*='example.com']"

    find_editor.value = ""

    find_editor.paste "https://example.com?action=replace&attachment=true"
    assert_selector "action-text-attachment[content-type='text/html']"
    assert_no_selector "a[href*='example.com']"

    find_editor.value = ""

    find_editor.paste "https://example.com?action=insert&attachment=false"
    assert_selector "a[href*='example.com']"
    assert_selector "div", text: "Link Preview: https://example.com?action=insert&attachment=false"

    find_editor.value = ""

    find_editor.paste "https://example.com?action=insert&attachment=true"
    assert_selector "a[href*='example.com']"
    assert_selector "action-text-attachment[content-type='text/html']"
  end

  private
    def assert_dispatched_event(type)
      assert_selector "[data-event='#{type}']"
    end

    def assert_no_dispatched_event(type)
      assert_no_selector "[data-event='#{type}']"
    end
end
