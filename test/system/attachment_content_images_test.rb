require "application_system_test_case"

# Images inside a custom attachment's content are sanitized every time the
# attachment renders in the editor, so what an <img> may carry is decided by
# Lexxy rather than by the app that wrote the markup. That makes it a round-trip
# property: the editor, the saved value, the rendered page and the re-edited
# document all have to agree, and a difference only shows up after a reload.
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

    # The value the form submits: attachment content re-serialized and sanitized.
    def assert_avatar_in_saved_value(person)
      attachment = Capybara.string(find_editor.value)
        .find(%(action-text-attachment[content-type="application/vnd.actiontext.mention"]))

      Capybara.string(CGI.unescapeHTML(attachment["content"]))
        .assert_selector %(img[alt="#{person.name}"][width="20"][height="20"]), visible: :all
    end
end
