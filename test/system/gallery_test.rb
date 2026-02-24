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

  test "uploading an image and a non-image file with an image selected creates a gallery and appends file after gallery" do
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

    select_gallery_image(index: 0)

    find_editor.send(:delete)
    find_editor.flush_lexical_updates

    assert_no_gallery
    assert_selector "figure.attachment--preview", count: 1
  end

  test "clicking different images in gallery changes selection" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png"), file_fixture("example.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 3)

    select_gallery_image(index: 0)
    assert_gallery_image_selected(index: 0)

    select_gallery_image(index: 1)
    assert_gallery_image_selected(index: 1)

    select_gallery_image(index: 2)
    assert_gallery_image_selected(index: 2)
  end

  test "deleting selected image in gallery removes it" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png"), file_fixture("example.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 3)

    select_gallery_image(index: 1)
    find_editor.send :delete

    assert_gallery_with_images(count: 2)
  end

  test "uploading into an existing gallery adds images" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)

    select_gallery_image(index: 1)

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 3)
  end

  test "uploading mixed files into gallery adds images and appends non-images" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)
    select_gallery_image(index: 0)

    attach_file [ file_fixture("example.png"), file_fixture("dummy.pdf") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 3)
    assert_selector "figure.attachment[data-content-type='application/pdf']"
    within ".attachment-gallery" do
      assert_no_selector "figure.attachment[data-content-type='application/pdf']"
    end
  end

  test "enter in between a dual-image gallery splits it and backspace joins them" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)

    select_gallery_at_offset(1)
    find_editor.send :enter

    assert_no_gallery
    assert_selector "figure.attachment--preview", count: 2

    find_editor.send :backspace

    assert_gallery_with_images(count: 2)
  end

  test "enter in middle of gallery splits it and backspace joins them" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png"), file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 4)

    select_gallery_at_offset(2)
    find_editor.send :enter

    assert_gallery_count(2)

    find_editor.send :backspace

    assert_gallery_count(1)
  end

  test "backspace at gallery start absorbs previous image" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png"), file_fixture("example.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 3)

    select_gallery_at_offset(1)
    find_editor.send :enter

    assert_selector "figure.attachment--preview", count: 3
    assert_gallery_with_images(count: 2)

    find_editor.send :backspace

    assert_gallery_with_images(count: 3)
  end

  test "delete at gallery end absorbs next image" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    find_editor.send :enter

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)
    assert_selector "figure.attachment--preview", count: 3

    select_gallery_at_offset(2)
    find_editor.send :delete

    assert_gallery_with_images(count: 3)
  end

  test "delete at gallery end absorbs next gallery" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    find_editor.send :enter

    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_count(2)

    select_gallery_at_offset(2, gallery_index: 0)
    find_editor.send :delete

    assert_gallery_count(1)
    assert_gallery_with_images(count: 4)
  end

  test "backspace at gallery start with empty paragraph above removes paragraph" do
    find_editor.send :enter

    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)

    select_gallery_at_offset(0)
    find_editor.send :backspace

    assert_gallery_with_images(count: 2)
    assert_editor_html do
      assert_selector ".attachment-gallery:first-child"
    end
  end

  test "backspace at gallery start with content above moves selection" do
    find_editor.send "Before"
    find_editor.send :enter

    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end

    assert_gallery_with_images(count: 2)

    select_gallery_at_offset(0)
    find_editor.send :backspace

    assert_gallery_with_images(count: 2)
    assert_text "Before"
  end

  test "gallery maintains correct count class" do
    attach_file [ file_fixture("example.png"), file_fixture("example2.png"), file_fixture("example.png") ] do
      click_on "Upload file"
    end

    assert_selector ".attachment-gallery.attachment-gallery--3"

    select_gallery_image(index: 0)
    find_editor.send :delete

    assert_selector ".attachment-gallery.attachment-gallery--2"
  end

  private
    def assert_gallery_with_images(count:)
      assert_selector ".attachment-gallery"
      within first(".attachment-gallery") do
        assert_selector "figure.attachment", count: count
      end
    end

    def assert_no_gallery
      assert_no_selector ".attachment-gallery"
    end

    def assert_gallery_count(count)
      assert_selector ".attachment-gallery", count: count
    end

    def select_gallery_image(index:, gallery_index: 0)
      all(".attachment-gallery")[gallery_index].tap do |gallery|
        gallery.all("figure.attachment img")[index].tap do |image|
          image.click
        end
      end
    end

    # Element selection is tough to simulate, so we judo and select the image and move with arrows keys
    # This has the side-benefit of testing this user interaction
    def select_gallery_at_offset(offset, gallery_index: 0)
      if offset == 0
        select_gallery_image(index: 0, gallery_index: gallery_index)
        find_editor.send_key "ArrowLeft"
      else
        select_gallery_image(index: offset - 1, gallery_index: gallery_index)
        find_editor.send_key "ArrowRight"
      end
    end

    def assert_gallery_image_selected(index:)
      figures = first(".attachment-gallery").all("figure.attachment")
      assert figures[index].matches_css?(".node--selected"), "Expected image at index #{index} to be selected"
    end

    def assert_no_gallery_image_selected
      assert_no_selector ".attachment-gallery figure.attachment.node--selected"
    end
end
