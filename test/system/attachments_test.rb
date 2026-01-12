require "application_system_test_case"

class AttachmentsTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "upload image" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
  end

  test "upload previewable attachment" do
    attach_file file_fixture("dummy.pdf") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "application/pdf", caption: "dummy.pdf"
  end

  test "upload non previewable attachment" do
    attach_file file_fixture("note.txt") do
      click_on "Upload file"
    end

    assert_not_image_figure_attachment content_type: "text/plain", caption: "note.txt"
  end

  test "delete attachments with the keyboard" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"

    find("figure.attachment img").click
    find_editor.send_key "Delete"

    assert_no_attachment content_type: "image/png"

    assert_editor_html "<p><br></p>"
  end

  test "disable attachments" do
    visit edit_post_path(posts(:empty))
    assert_button "Upload file"

    visit edit_post_path(posts(:empty), attachments_disabled: true)
    assert_no_button "Upload file"
  end

  test "configure attachment tag name" do
    visit edit_post_path(posts(:empty), attachment_tag_name: "test-attachment")
    find_editor.send "1"
    find_editor.send "peter "
    assert_selector "test-attachment"
  end

  test "authenticated uploads use storage subdomain URL" do
    visit edit_post_path(posts(:empty), authenticated_storage: true)

    upload_url = find_editor["data-direct-upload-url"]
    assert_match(/storage\.lexxy\.localhost/, upload_url)
  end

  test "authenticated upload succeeds with auth cookie" do
    add_auth_cookie
    visit edit_post_path(posts(:empty),
      authenticated_storage: true,
      configure_authenticated_uploads: true)

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
  end

  test "authenticated upload fails without auth enabled" do
    # allow the 401 unauthorized console message
    allow_console_messages

    add_auth_cookie
    visit edit_post_path(posts(:empty),
      authenticated_storage: true,
      configure_authenticated_uploads: false)

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_selector "figure.attachment--error"
  end

  private
    def add_auth_cookie
      domain = ".lexxy.localhost"
      page.driver.browser.manage.add_cookie(name: "auth_token", value: "test", same_site: "Lax", domain: domain, secure: false, http_only: true)
    end
end
