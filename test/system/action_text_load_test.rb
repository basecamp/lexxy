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

  test "loads via turbo when content ends with a table" do
    post = Post.create!(
      title: "Ends with table",
      body: <<~HTML
        <figure class="lexxy-content__table-wrapper"><table><tbody><tr><th><p>Hello</p></th><td><p>there</p></td></tr></tbody></table></figure>
      HTML
    )

    visit post_path(post)
    click_on "Edit this post"

    wait_for_editor
    wait_until do
      editor_html = Capybara.string(find_editor.value)
      editor_html.has_selector?("table") && editor_html.has_text?("Hello") && editor_html.has_text?("there")
    end
  end
end
