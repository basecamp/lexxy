require "application_system_test_case"

# Attachment content is re-sanitized in mXSS-safe mode every time the attachment
# renders in the editor, and DOMPurify's SAFE_FOR_XML guard rejects any attribute
# value that could close a comment. A serialized `content` attribute routinely
# contains one: Rails view annotations land inside the partial an attachment
# renders, so the guard would drop the whole attribute and the attachment with it.
#
# A hook keeps the attribute, which makes this a round-trip property rather than a
# client-side one. The editor, the saved value, the rendered page and the re-edited
# document all have to agree, and Loofah on the server gets a say between them.
# Unit tests only see the first hop; this is the test that would catch a server
# stage dropping the attribute.
class AttachmentContentRoundTripTest < ApplicationSystemTestCase
  COMMENT = "BEGIN app/views/people/_person.html.erb"

  test "comment-bearing attachment content survives save, render and re-edit" do
    person = people(:james)

    visit edit_post_path(posts(:hello_james))
    wait_for_editor

    assert_comment_in_saved_value
    assert_mention_in_editor person

    click_on "Update Post"

    # The rendered page: the attachment has been through Loofah on the way in.
    within "article.post" do
      assert_selector %(bc-mention[gid="#{person.to_gid}"]), text: person.name
    end

    click_on "Edit this post"
    wait_for_editor

    # The re-edit is the hop this PR changes: content is re-inflated under
    # SAFE_FOR_XML. Without the preservation hook the attachment loses its
    # content here and the mention disappears.
    assert_mention_in_editor person
    assert_comment_in_saved_value
  end

  private
    def assert_mention_in_editor(person)
      within find_editor.selector do
        assert_selector %(bc-mention[gid="#{person.to_gid}"]), text: person.name, visible: :all
      end
    end

    # The value the form submits: attachment content re-serialized after sanitizing.
    def assert_comment_in_saved_value
      attachment = Capybara.string(find_editor.value)
        .find(%(action-text-attachment[content-type="application/vnd.actiontext.mention"]))

      content = CGI.unescapeHTML(attachment["content"])

      assert_includes content, COMMENT,
        "the comment inside attachment content was dropped, which is what SAFE_FOR_XML does without the preservation hook"
    end
end
