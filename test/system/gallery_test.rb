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
  end

  test "uploading an image with an image selected creates a gallery" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    find("figure.attachment img").click

    attach_file file_fixture("example2.png") do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)
  end

  test "uploading an image and a non-image file does not create a gallery" do
    attach_file [ file_fixture("example.png"), file_fixture("dummy.pdf") ] do
      click_on "Upload file"
    end

    assert_no_gallery
    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
    assert_figure_attachment content_type: "application/pdf"
  end

  test "uploading an image and a non-image file with an image selected creates a gallery and appends file" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    find("figure.attachment img").click

    attach_file [ file_fixture("example2.png"), file_fixture("dummy.pdf") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)
    assert_selector "figure.attachment[data-content-type='application/pdf']"
    within ".attachment-gallery" do
      assert_no_selector "figure.attachment[data-content-type='application/pdf']"
    end
  end

  test "deleting an image from a 2-image gallery unwraps it" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)

    find(".attachment-gallery figure.attachment img", match: :first).click

    find_editor.send_key "Delete"

    assert_no_gallery
    assert_selector "figure.attachment--preview", count: 1
  end

  private
    def assert_gallery_with_images(count:)
      assert_selector "div.attachment-gallery"
      within "div.attachment-gallery" do
        assert_selector "figure.attachment", count: count
      end
    end

    def assert_no_gallery
      assert_no_selector ".attachment-gallery"
    end
end
