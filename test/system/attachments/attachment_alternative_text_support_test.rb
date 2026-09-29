require "application_system_test_case"

class AttachmentAlternativeTextSupportTest < ApplicationSystemTestCase
  test "unsupported Action Text does not offer alternative text authoring" do
    skip "Action Text supports alternative text" if ActionText::Attachment::ATTRIBUTES.include?("alt")

    visit edit_post_path(posts(:empty))
    wait_for_editor
    attach_file file_fixture("example.png") do
      click_on "Upload files"
    end
    assert_selector "figure.attachment .attachment__caption--editable"
    find("figure.attachment").click x: 8, y: 8

    assert_selector "lexxy-attachment-toolbar button[aria-label='Remove']"
    assert_no_selector "lexxy-attachment-toolbar button[aria-label='Alternative text']"
  end
end
