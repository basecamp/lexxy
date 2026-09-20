require "application_system_test_case"

class AttachmentCaptionRoundTripTest < ApplicationSystemTestCase
  test "caption edits survive save, render and re-edit" do
    post = posts(:empty)
    visit edit_post_path(post)
    wait_for_editor

    attach_file file_fixture("example.png") do
      click_on "Upload files"
    end
    assert_image_figure_attachment caption: "example.png"

    find("figure.attachment figcaption").click
    find("textarea[aria-label='Image caption']").fill_in with: "On the river"
    find("textarea[aria-label='Image caption']").send_keys :enter
    click_on "Update Post"

    within "article.post" do
      assert_selector "figcaption", text: "On the river"
    end
    assert_equal "On the river", post.reload.body.body.attachments.first.caption

    click_on "Edit this post"
    wait_for_editor
    assert_selector "figure.attachment figcaption", text: "On the river"
    find("figure.attachment figcaption").click
    assert_equal "On the river", find("textarea[aria-label='Image caption']").value
  end
end
