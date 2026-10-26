require "application_system_test_case"

class CustomAttachmentWhitespaceRoundTripTest < ApplicationSystemTestCase
  test "spaces between formatted text and a mention survive save, render, and re-edit" do
    person = people(:james)
    mention = ActionText::Attachment.from_attachable(person).to_html
    post = Post.create!(title: "Formatted mention", body: "<p><strong>Hello </strong>#{mention}<strong> there</strong></p>")

    visit edit_post_path(post)
    wait_for_editor
    assert_editor_spaces_around_mention

    click_on "Update Post"

    assert_rendered_spaces_around_mention
    assert_stored_spaces_around_mention post

    click_on "Edit this post"
    wait_for_editor
    assert_editor_spaces_around_mention

    find_editor.place_cursor_at_end
    find_editor.send "!"
    click_on "Update Post"

    assert_rendered_spaces_around_mention
    assert_stored_spaces_around_mention post
  end

  private
    def assert_editor_spaces_around_mention
      value = find_editor.value
      assert_match %r{</strong> <action-text-attachment}, value
      assert_match %r{</action-text-attachment> <strong>there}, value
    end

    def assert_rendered_spaces_around_mention
      assert_link "Edit this post"
      html = find("article.post p", text: people(:james).name)["innerHTML"]
      assert_match %r{</strong> <action-text-attachment}, html
      assert_match %r{</action-text-attachment> <strong>there}, html
    end

    def assert_stored_spaces_around_mention(post)
      html = post.reload.body.body.to_html
      assert_match %r{</strong> <action-text-attachment}, html
      assert_match %r{</action-text-attachment> <strong>there}, html
    end
end
