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

    enter_trix_text " and Trix"
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

    find_editor.send "With image"
    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_selector "action-text-attachment[content-type='image/png']"

    # Edit with Trix and save
    visit edit_trix_post_path(Post.last)

    enter_trix_text " edited"
    click_on "Update Post"

    assert_text "Post was successfully updated."
    assert_selector "action-text-attachment[content-type='image/png']"
  end

  test "gallery" do
    visit new_post_path

    fill_in "Post title", with: "Gallery test"
    attach_file [ file_fixture("example.png"), file_fixture("example2.png") ] do
      click_on "Upload file"
    end
    assert_selector ".attachment-gallery"

    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_selector "action-text-attachment[content-type='image/png']", count: 2

    # Edit with Trix and save
    visit edit_trix_post_path(Post.last)

    click_on "Update Post"

    assert_text "Post was successfully updated."
    assert_selector "action-text-attachment[content-type='image/png']", count: 2
  end

  private
    def enter_trix_text(text)
      find("trix-editor")
      page.execute_script <<~JS, text
        const editor = document.querySelector("trix-editor").editor
        const position = editor.getDocument().toString().trimEnd().length
        editor.setSelectedRange([position, position])
        editor.insertString(arguments[0])
      JS
    end
end
