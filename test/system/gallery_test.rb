require "application_system_test_case"

class GalleryTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "uploading multiple images creates a gallery" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)

    click_on "Update Post"

    visit post_path(posts(:empty))
    assert_gallery_with_images(count: 2)
  end

  private
    def assert_gallery_with_images(count:)
      assert_selector ".attachment-gallery"
      within first(".attachment-gallery") do
        assert_selector "figure.attachment", count: count
      end
    end
end
