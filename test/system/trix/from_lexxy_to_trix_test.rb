require "application_system_test_case"

class Trix::FromLexxyToTrixTest < ApplicationSystemTestCase
  setup do
    allow_console_messages
  end

  test "rich text" do
    visit new_post_path

    fill_in "Post title", with: "Rich text test"
    find_editor.send "Hello from Lexxy"
    click_on "Create Post"

    assert_text "Post was successfully created."

    visit edit_trix_post_path(Post.last)

    fill_trix_editor with: " and Trix"
    click_on "Update Post"

    assert_text "Post was successfully updated."
    assert_text "Hello from Lexxy and Trix"
  end

  test "attachment" do
    visit new_post_path

    fill_in "Post title", with: "Attachment test"
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end
    assert_image_figure_attachment content_type: "image/png", caption: "example.png"

    find_editor.place_cursor_at_end
    find_editor.send "With image"
    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_text "With image"
    assert_selector "action-text-attachment[content-type='image/png']"

    # Edit with Trix and save
    visit edit_trix_post_path(Post.last)

    fill_trix_editor with: " edited"
    click_on "Update Post"

    assert_text "Post was successfully updated."
    assert_text "With image edited"
    assert_selector "action-text-attachment[content-type='image/png']"
  end

  test "gallery" do
    visit new_post_path

    fill_in "Post title", with: "Gallery test"
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end
    assert_selector ".attachment-gallery"
    find_editor.send "With gallery"

    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_text "With gallery"
    assert_selector "action-text-attachment[content-type='image/png']", count: 2

    # Edit with Trix and save
    visit edit_trix_post_path(Post.last)

    fill_trix_editor with: " edited"
    click_on "Update Post"

    assert_text "Post was successfully updated."
    assert_text "With gallery edited"
    assert_selector "action-text-attachment[content-type='image/png']", count: 2
  end
end
