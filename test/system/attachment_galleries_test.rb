require "application_system_test_case"

class AttachmentGalleriesTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "creates gallery when uploading two images at once" do
    attach_file [file_fixture("example.png"), file_fixture("example2.png")] do
      click_on "Upload file"
    end

    assert_gallery count: 2
  end

  test "single attachment is not wrapped in gallery" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
    assert_no_gallery
  end
end
