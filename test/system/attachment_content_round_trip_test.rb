require "application_system_test_case"

# Attachment content is re-sanitized in mXSS-safe mode every time the attachment
# renders in the editor, so a comment-bearing `content` attribute — Rails view
# annotations land inside the partial an attachment renders — has to survive the
# whole loop: the editor, the saved value, the rendered page and the re-edited
# document all have to agree, with Loofah on the server getting a say between them.
# Unit tests only ever see the first hop; this is the test that would catch a
# server stage dropping the attribute.
#
# What this does NOT cover, despite what it looks like: preserveSerializedContentHook.
# That hook fires on a `content` attribute sanitized under SAFE_FOR_XML, and no hop
# here is one. The saved value is read with SAFE_FOR_XML false, and the safe-XML call
# in CustomActionTextAttachmentNode#createDOM is handed the *inner* markup, which
# carries no `content` attribute of its own — only a nested attachment would. Verified
# by reverting this PR's src/ entirely: the test still passes. Sanitizer coverage for
# the hook lives in test/javascript/unit/helpers/sanitization_helper.test.js, which
# calls sanitize() with a shape createDOM does not currently produce.
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
        "the comment inside attachment content was dropped, which is what SAFE_FOR_XML does without the preservation hook"
    end
end
