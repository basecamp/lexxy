require "application_system_test_case"

# Attachment content is re-sanitized in mXSS-safe mode every time the attachment
# renders in the editor, so comment-bearing content — Rails view annotations land
# inside the partial an attachment renders — has to survive the whole loop: the
# editor, the saved value, the rendered page and the re-edited document all have to
# agree, with Loofah on the server getting a say between them. Unit tests only ever
# see the first hop; this is the test that would catch a server stage dropping it.
#
# The content survives with no special handling. The `content` attribute this test
# follows is produced by exportDOM and by the server-side pass in
# lib/lexxy/rich_text_area_tag.rb, and it is only ever sanitized on the value hop,
# where SAFE_FOR_XML is off — so the mXSS guard never sees it. The safe-XML call in
# CustomActionTextAttachmentNode#createDOM is handed the *decoded inner* markup, one
# level down, where a `content` attribute would only belong to a nested attachment.
# The client-side re-inflation guard is covered directly in
# test/javascript/unit/editor/attachments/content_reinflation_sanitization.test.js.
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

    # The re-edit: content is re-inflated under SAFE_FOR_XML, and the attachment
    # renders from it. Lose the content on any hop and the attachment comes back
    # empty here.
    assert_mention_in_editor person
    assert_comment_in_saved_value
  end

  private
    # Asserted on the attachment element rather than on bc-mention, which never
    # reaches the editor DOM: an editor's allowlist is its importable tags plus
    # whatever its extensions declare, and the dummy app declares no
    # allowedElements for bc-mention. DOMPurify drops an unlisted tag and keeps
    # its children, so what re-inflation leaves behind is the rendered mention —
    # the avatar and the name — inside the attachment. That is the property this
    # test is after: lose the content and the attachment renders empty.
    #
    # The gid is not dropped, only relocated: mention_round_trip_test asserts it
    # on the rendered page and in the serialized content, which is where it lives.
    def assert_mention_in_editor(person)
      within find_editor.selector do
        assert_selector %(action-text-attachment[content-type="application/vnd.actiontext.mention"]),
          text: person.name, visible: :all
      end
    end

    # The value the form submits: attachment content re-serialized after sanitizing.
    def assert_comment_in_saved_value
      attachment = Capybara.string(find_editor.value)
        .find(%(action-text-attachment[content-type="application/vnd.actiontext.mention"]))

      content = CGI.unescapeHTML(attachment["content"])

      assert_includes content, COMMENT,
        "the comment inside attachment content was dropped, which is what SAFE_FOR_XML would do to it on this hop"
    end
end
