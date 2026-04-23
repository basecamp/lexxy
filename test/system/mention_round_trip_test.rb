require "application_system_test_case"

class MentionRoundTripTest < ApplicationSystemTestCase
  test "mention attachment round-trips through edit, save, show, and re-edit" do
    post = posts(:hello_james)
    person = people(:james)

    visit edit_post_path(post)
    wait_for_editor

    assert_editor_value_has_mention_for(person)

    click_on "Update Post"

    within "article.post" do
      assert_selector %(action-text-attachment[sgid][content-type="application/vnd.actiontext.mention"] bc-mention[gid="#{person.to_gid}"]), text: person.name
    end

    click_on "Edit this post"
    wait_for_editor

    assert_editor_value_has_mention_for(person)
  end

  private
    def assert_editor_value_has_mention_for(person)
      value = Capybara.string(find_editor.value)
      attachment = value.find(%(action-text-attachment[content-type="application/vnd.actiontext.mention"]))
      assert attachment[:sgid].present?

      mention_markup = CGI.unescapeHTML(attachment["content"])
      mention_fragment = Capybara.string(mention_markup)
      mention_fragment.assert_selector %(bc-mention[gid="#{person.to_gid}"]), text: person.name
    end
end
