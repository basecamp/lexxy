require "application_system_test_case"

# Images inside a custom attachment's content are sanitized every time the
# attachment renders in the editor, so what an <img> may carry is decided by
# Lexxy rather than by the app that wrote the markup.
#
# Lexxy's allowlist is a display gate here, not a persistence gate: alt and
# width/height were never being lost from storage, only from what the editor
# rendered. Of the assertions below, only the two in the editor are sensitive to
# dom_purify.js; the saved value and the rendered page pin that nothing else in
# the round trip drops the content on the way past.
#
# alt is what a screen reader reads; width and height are what stop the line
# reflowing while the image loads. Both are inert, and both were being dropped.
class AttachmentContentImagesTest < ApplicationSystemTestCase
  test "an avatar inside attachment content keeps its alt and size through save, render and re-edit" do
    person = people(:james)

    visit edit_post_path(posts(:hello_james))
    wait_for_editor

    assert_avatar_in_editor person
    assert_avatar_in_saved_value person

    click_on "Update Post"

    within "article.post" do
      assert_selector %(bc-mention[gid="#{person.to_gid}"] img[alt="#{person.name}"][width="20"][height="20"])
    end

    click_on "Edit this post"
    wait_for_editor

    assert_avatar_in_editor person
    assert_avatar_in_saved_value person
  end

  private
    # The rendered editor DOM: attachment content passed through createDOM.
    def assert_avatar_in_editor(person)
      within find_editor.selector do
        assert_selector %(img[alt="#{person.name}"][width="20"][height="20"]), visible: :all
      end
    end

    # The value the form submits: the attachment's stored content, verbatim.
    # Not re-sanitized — exportDOM emits the innerHtml it imported, and the
    # document-level sanitize treats `content` as an opaque attribute value.
    # Still worth pinning: export must not lose the content on the way out.
    def assert_avatar_in_saved_value(person)
      attachment = Capybara.string(find_editor.value)
        .find(%(action-text-attachment[content-type="application/vnd.actiontext.mention"]))

      Capybara.string(CGI.unescapeHTML(attachment["content"]))
        .assert_selector %(img[alt="#{person.name}"][width="20"][height="20"]), visible: :all
    end
end
