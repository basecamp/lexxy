require "application_system_test_case"

class LinkedAttachmentRoundTripTest < ApplicationSystemTestCase
  URL = "https://example.com/photos"

  test "a linked image survives saving, rendering and a re-edit" do
    post = posts(:empty)
    visit edit_post_path(post)
    wait_for_editor

    attach_file file_fixture("example.png") do
      click_on "Upload files"
    end
    assert_selector "figure.attachment img[src*='/rails/active_storage']"

    link_selected_image

    click_on "Update Post"
    assert_current_path post_path(post)
    within "article.post" do
      assert_selector "action-text-attachment[href='#{URL}'] figure.attachment a[href='#{URL}'] img"
    end

    visit edit_post_path(post)
    wait_for_editor
    assert_includes find_editor.value, %(href="#{URL}")

    click_on "Update Post"
    assert_current_path post_path(post)
    assert_selector "action-text-attachment[href='#{URL}'] figure.attachment a[href='#{URL}'] img"
  end

  test "a javascript: href stored on an image is not rendered" do
    blob = ActiveStorage::Blob.create_and_upload!(io: file_fixture("example.png").open, filename: "example.png")
    post = posts(:empty)
    post.update!(body: %(<action-text-attachment sgid="#{blob.attachable_sgid}" href="javascript:alert(1)"></action-text-attachment>))

    visit post_path(post)

    within "article.post" do
      assert_selector "figure.attachment img"
      assert_no_selector "[href^='javascript']"
    end
  end

  private
    def link_selected_image
      find("figure.attachment img").click
      assert_selector "figure.attachment.node--selected"

      find("button[name='link']").click
      within "lexxy-link-dropdown [data-dropdown-panel]" do
        find("input").set(URL)
        find("button[value='link']").click
      end

      assert_includes find_editor.value, %(href="#{URL}")
    end
end
