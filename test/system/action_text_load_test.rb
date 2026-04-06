require "application_system_test_case"

class ActionTextLoadTest < ApplicationSystemTestCase
  PREVIEW_DATA_URL = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="

  test "works when no rich text record" do
    visit edit_post_path(posts(:empty))

    assert_equal_html "<p><br></p>", find_editor.value
  end

  test "loads mixed previewable gallery attachments" do
    post = Post.create!(
      body: <<~HTML
        <div>
          <action-text-attachment content-type="image/webp" url="#{PREVIEW_DATA_URL}" filename="first.webp" filesize="2580520" width="3948" height="2674" previewable="true" presentation="gallery"></action-text-attachment>
          <action-text-attachment content-type="image/webp" url="#{PREVIEW_DATA_URL}" filename="second.webp" filesize="2600346" width="3948" height="2674" previewable="true" presentation="gallery"></action-text-attachment>
          <action-text-attachment content-type="video/mp4" url="#{PREVIEW_DATA_URL}" filename="clip.mp4" filesize="11856764" width="3420.0" height="2214.0" previewable="true" presentation="gallery"></action-text-attachment>
        </div>
      HTML
    )

    visit edit_post_path(post)

    assert_editor_html do
      assert_selector "action-text-attachment[content-type='image/webp']", count: 2
      assert_selector "action-text-attachment[content-type='video/mp4']", count: 1
    end
  end

  test "preserves configured HTML attributes through the Action Text round trip" do
    with_lexxy_config(additional_allowed_attributes: %w[start]) do
      post = Post.create!(
        title: "Ordered list",
        body: '<ol start="3"><li>Third</li><li>Fourth</li></ol>'
      )

      visit edit_post_path(post)

      assert_editor_html '<ol start="3"><li>Third</li><li>Fourth</li></ol>'

      click_on "Update Post"

      assert_selector "ol[start='3'] li", text: "Third"
      assert_selector "ol[start='3'] li", text: "Fourth"

      click_on "Edit this post"

      assert_editor_html '<ol start="3"><li>Third</li><li>Fourth</li></ol>'
    end
  end
end
