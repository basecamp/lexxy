require "application_system_test_case"

class AttachmentPreviewableTypesRoundTripTest < ApplicationSystemTestCase
  test "a TIFF stays out of the gallery through save, render and re-edit" do
    post = posts(:empty)
    visit edit_post_path(post)
    wait_for_editor

    attach_file [ file_fixture("example.png"), file_fixture("example2.png"), file_fixture("example.tif") ] do
      click_on "Upload files"
    end
    assert_no_selector "figure.attachment progress"
    assert_selector ".attachment-gallery figure.attachment--preview", count: 2
    assert_no_selector ".attachment-gallery figure.attachment--tif"
    assert_selector "figure.attachment--tif.attachment--file"

    click_on "Update Post"
    assert_current_path post_path(post)

    within "article.post" do
      assert_selector ".attachment-gallery figure.attachment", count: 2
      assert_no_selector ".attachment-gallery figure.attachment--tif"
      assert_selector "figure.attachment--tif"
    end
    assert_equal 3, post.reload.body.body.attachments.size

    click_on "Edit this post"
    wait_for_editor
    assert_selector ".attachment-gallery figure.attachment--preview", count: 2
    assert_no_selector ".attachment-gallery figure.attachment--tif"
    assert_selector "figure.attachment--tif.attachment--file"
  end
end
