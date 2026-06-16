require "application_system_test_case"

class Trix::FromTrixToLexxyTest < ApplicationSystemTestCase
  setup do
    allow_console_messages
  end

  test "rich text" do
    visit new_trix_post_path

    fill_in "Post title", with: "Trix to Lexxy"
    fill_trix_editor with: "Hello from Trix"
    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_text "Hello from Trix"

    visit edit_post_path(Post.last)

    assert_editor_html "<p>Hello from Trix</p>"

    find_editor.send :end
    find_editor.send " and Lexxy"
    click_on "Update Post"

    assert_text "Hello from Trix and Lexxy"
  end

  test "preserves blank lines from a Trix-authored document on edit and save round-trip" do
    # Trix stores blank lines as empty block elements like <div><br></div>. This mirrors a
    # document authored in the old Trix editor that is now opened in Lexxy for editing.
    post = Post.create!(
      title: "Trix blank lines",
      body: "<div>First paragraph.</div><div><br></div><div>Second paragraph.</div>"
    )

    visit edit_post_path(post)

    assert_editor_html "<p>First paragraph.</p><p><br></p><p>Second paragraph.</p>"

    # The blank line must survive the full save → render → re-edit round-trip, not just the
    # initial load. Customers reported re-added spacing being stripped again on save.
    click_on "Update Post"
    assert_text "Post was successfully updated."

    visit edit_post_path(post)
    assert_editor_html "<p>First paragraph.</p><p><br></p><p>Second paragraph.</p>"
  end

  test "attachment" do
    visit new_trix_post_path

    fill_in "Post title", with: "Trix attachment"
    upload_trix_file file_fixture("example.png")
    fill_trix_editor with: "Hello from Trix"

    within "trix-editor" do
      assert_text "Hello from Trix"
      assert_selector "figure.attachment", wait: 5
    end

    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_selector "action-text-attachment[content-type='image/png']"

    visit edit_post_path(Post.last)

    assert_editor_html do
      assert_text "Hello from Trix"
      assert_selector "action-text-attachment[content-type='image/png']"
    end
  end

  test "gallery" do
    visit new_trix_post_path

    fill_in "Post title", with: "Trix gallery"
    fill_trix_editor with: "Hello from Trix"
    upload_trix_file file_fixture("example.png")
    upload_trix_file file_fixture("example2.png")

    within "trix-editor" do
      assert_text "Hello from Trix"
      assert_selector "figure.attachment", count: 2, wait: 5
    end

    click_on "Create Post"

    assert_text "Post was successfully created."
    assert_selector "action-text-attachment[content-type='image/png']", count: 2

    visit edit_post_path(Post.last)

    assert_editor_html do
      assert_text "Hello from Trix"
      assert_selector "action-text-attachment[content-type='image/png']", count: 2
    end
  end
end
