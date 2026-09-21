require "application_system_test_case"

class AttachmentAltTextRoundTripTest < ApplicationSystemTestCase
  setup do
    skip "Action Text alternative text support is required" unless ActionText::Attachment::ATTRIBUTES.include?("alt")
  end

  test "uploaded image descriptions survive save, render and re-edit" do
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

    [ 'A canoe beside a sign reading "River & lake"', "A blue canoe" ].each do |description|
      edit_description description
      click_on "Update Post"

      within "article.post" do
        assert_selector "img[alt='#{description}']"
        assert_selector "figcaption", text: "On the river"
      end

      attachment = post.reload.body.body.attachments.first
      assert_equal description, attachment.alt
      assert_equal "On the river", attachment.caption

      click_on "Edit this post"
      wait_for_editor
      assert_selector "figure.attachment img[alt='#{description}']"
      find("figure.attachment figcaption").click
      assert_equal "On the river", find("textarea[aria-label='Image caption']").value
      find("textarea[aria-label='Image caption']").send_keys :escape
    end
  end

  test "removing an image description survives save, render and re-edit" do
    post = posts(:empty)
    visit edit_post_path(post)
    wait_for_editor

    attach_file file_fixture("example.png") do
      click_on "Upload files"
    end
    assert_selector "figure.attachment .attachment__caption--editable"
    find("figure.attachment figcaption").click
    find("textarea[aria-label='Image caption']").fill_in with: "On the river"
    find("textarea[aria-label='Image caption']").send_keys :enter
    edit_description "A red canoe"
    click_on "Update Post"
    assert_selector "article.post img[alt='A red canoe']"

    click_on "Edit this post"
    wait_for_editor
    edit_description ""
    click_on "Update Post"

    assert_selector "article.post img"
    assert_no_selector "article.post img[alt]"
    assert_selector "article.post figcaption", text: "On the river"
    assert_nil post.reload.body.body.attachments.first.alt
    assert_equal "On the river", post.body.body.attachments.first.caption

    click_on "Edit this post"
    wait_for_editor
    assert_selector "figure.attachment img[alt='']"
    assert_selector "figure.attachment figcaption", text: "On the river"
    find("figure.attachment").click x: 8, y: 8
    click_on "Alternative text"
    assert_field "Description", with: ""
  end

  test "remote image descriptions survive save, render and re-edit without becoming captions" do
    post = posts(:empty)
    visit edit_post_path(post)
    wait_for_editor
    image_url = URI.join(page.current_url, "/icon.png")
    find_editor.value = <<~HTML
      <action-text-attachment content-type="image/png" url="#{image_url}" filename="icon.png" alt="An icon"></action-text-attachment>
    HTML
    edit_description "A green tree"
    click_on "Update Post"

    within "article.post" do
      assert_selector "img[alt='A green tree']"
      assert_no_selector "figcaption"
    end

    click_on "Edit this post"
    wait_for_editor
    assert_selector "figure.attachment img[alt='A green tree']"
    find("figure.attachment figcaption").click
    assert_equal "", find("textarea[aria-label='Image caption']").value
  end

  private
    def edit_description(description)
      find("figure.attachment").click x: 8, y: 8
      click_on "Alternative text"
      within "dialog[open]" do
        fill_in "Description", with: description
        click_on "Save"
      end
      assert_no_selector "dialog[open]"
    end
end
