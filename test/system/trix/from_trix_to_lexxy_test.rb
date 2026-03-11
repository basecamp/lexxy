require "application_system_test_case"

class Trix::FromTrixToLexxyTest < ApplicationSystemTestCase
  setup do
    allow_console_messages
  end

  test "rich text" do
    visit new_trix_post_path

    fill_in "Post title", with: "Trix to Lexxy"
    enter_trix_text "Hello from Trix"
    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_text "Hello from Trix"

    visit edit_post_path(Post.last)

    assert_editor_html "<p>Hello from Trix</p>"

    find_editor.send [:end]
    find_editor.send " and Lexxy"
    click_on "Update Post"

    assert_text "Hello from Trix and Lexxy"
  end

  test "attachment" do
    visit new_trix_post_path

    fill_in "Post title", with: "Trix attachment"
    upload_trix_file file_fixture("example.png")

    within "trix-editor" do
      assert_selector "figure.attachment", wait: 5
    end

    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_selector "action-text-attachment[content-type='image/png']"

    visit edit_post_path(Post.last)

    assert_editor_html do
      assert_selector "action-text-attachment[content-type='image/png']"
    end
  end

  test "gallery" do
    visit new_trix_post_path

    fill_in "Post title", with: "Trix gallery"
    upload_trix_file file_fixture("example.png")
    upload_trix_file file_fixture("example2.png")

    within "trix-editor" do
      assert_selector "figure.attachment", count: 2, wait: 5
    end

    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_selector "action-text-attachment[content-type='image/png']", count: 2

    visit edit_post_path(Post.last)

    assert_editor_html do
      assert_selector "action-text-attachment[content-type='image/png']", count: 2
    end
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

    def upload_trix_file(path)
      find("trix-editor")
      attach_file(path) do
        find("button[data-trix-action='attachFiles']").click
      end
    end
end
