require "application_system_test_case"

class AttachmentContentAttributePolicyTest < ApplicationSystemTestCase
  test "denied data attributes stay out of the editor across save, render and re-edit" do
    person = people(:james)

    visit edit_post_path(posts(:hello_james), restrict_attachment_content: true)
    wait_for_editor
    assert_mention_in_editor_without_denied_attributes person

    click_on "Update Post"

    # Rails' own sanitizer drops data attributes from the rendered page, allowed or not.
    within "article.post" do
      assert_selector %(bc-mention[gid="#{person.to_gid}"] em), text: person.name
    end

    visit edit_post_path(posts(:hello_james), restrict_attachment_content: true)
    wait_for_editor
    assert_mention_in_editor_without_denied_attributes person
  end

  private
    def assert_mention_in_editor_without_denied_attributes(person)
      within find_editor.content_element do
        within %(action-text-attachment[content-type="application/vnd.actiontext.mention"]) do
          assert_selector %(em[data-person-id="#{person.id}"]), text: person.name
          assert_no_selector "[data-behavior]"
        end
      end
    end
end
