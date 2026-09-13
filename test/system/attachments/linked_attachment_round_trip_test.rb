require "application_system_test_case"

class LinkedAttachmentRoundTripTest < ApplicationSystemTestCase
  URL = "https://example.com/photos"

  test "a linked image survives saving, rendering and a re-edit" do
    visit edit_post_path(posts(:empty))

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end
    assert_selector "figure.attachment img"

    link_selected_image

    click_on "Update Post"
    assert_text "Post was successfully updated."
    assert_selector "action-text-attachment[href='#{URL}'] figure.attachment img"

    visit edit_post_path(posts(:empty))
    assert_includes find_editor.value, %(href="#{URL}")

    click_on "Update Post"
    assert_selector "action-text-attachment[href='#{URL}'] figure.attachment img"
  end

  private
    def link_selected_image
      find("figure.attachment img").click
      assert_selector "figure.attachment.node--selected"

      find("button[name='link']").click
      within "lexxy-link-dropdown [data-dropdown-panel]" do
        find("input[type='url']").set(URL)
        find("button[value='link']").click
      end

      assert_includes find_editor.value, %(href="#{URL}")
    end
end
