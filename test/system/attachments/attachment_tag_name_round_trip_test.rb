require "application_system_test_case"

# The editor → save → render → re-edit round trip AGENTS.md requires for a change to
# serialization, driven by the crafted application/x-lexical-editor payload that made
# the tagName binding necessary. Two properties, at two different hops.
#
# The security one lands before the save: a poisoned tagName becomes a real <script>
# in the live editor DOM and runs there. By the time the value is read, DOMPurify has
# already dropped the unknown tag, so the value and everything downstream of it look
# clean either way — the pre-save assertions are the ones that fail without the fix.
#
# The round trip is the regression half. Bound to the configured tag, the pasted
# attachment still has to survive Action Text: the saved value, Loofah, the attachable
# resolved from its sgid on the rendered page, and the re-inflated document on re-edit.
# Without the fix it is poisoned into a tag DOMPurify drops, so nothing reaches the
# server at all and the attachment never comes back.
class AttachmentTagNameRoundTripTest < ApplicationSystemTestCase
  CONFIGURED_TAG = "action-text-attachment"
  HTML_FALLBACK = "html-fallback-marker"
  PROBE = "window.poisonedAttachmentTagExecuted = true"

  test "a poisoned tagName never runs, and the attachment it rode in on still round-trips" do
    person = people(:james)

    visit edit_post_path(posts(:empty))
    wait_for_editor

    find_editor.paste "", html: "<p>#{HTML_FALLBACK}</p>", lexical: poisoned_payload(person)
    find_editor.flush_lexical_updates

    assert_no_poisoned_tag_in_editor
    assert_attachment_in_editor

    click_on "Update Post"

    within "article.post" do
      assert_selector %(#{CONFIGURED_TAG}[sgid][content-type="#{person.content_type}"] bc-mention[gid="#{person.to_gid}"]), text: person.name
    end

    click_on "Edit this post"
    wait_for_editor

    assert_attachment_in_editor
  end

  private
    def poisoned_payload(person)
      {
        namespace: "Lexxy",
        nodes: [ {
          type: "custom_action_text_attachment",
          version: 1,
          tagName: "script",
          sgid: person.attachable_sgid,
          contentType: person.content_type,
          innerHtml: PROBE
        } ]
      }
    end

    # text/html carries a marker the lexical payload does not, so an editor that ever
    # stopped honoring application/x-lexical-editor would surface it here rather than
    # let this test pass through the fallback path with no poisoned node in it.
    def assert_no_poisoned_tag_in_editor
      within find_editor.content_element do
        assert_no_selector "script", visible: :all
        assert_no_text HTML_FALLBACK
      end

      assert_nil page.evaluate_script("window.poisonedAttachmentTagExecuted ?? null"),
        "the poisoned tag was created as a real <script> element and ran"
    end

    def assert_attachment_in_editor
      within find_editor.content_element do
        assert_selector CONFIGURED_TAG, visible: :all
      end

      Capybara.string(find_editor.value).assert_selector %(#{CONFIGURED_TAG}[sgid]), visible: :all
    end
end
