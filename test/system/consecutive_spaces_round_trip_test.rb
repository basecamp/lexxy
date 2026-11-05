require "application_system_test_case"

class ConsecutiveSpacesRoundTripTest < ApplicationSystemTestCase
  test "double spaces survive edit, save, show, re-edit and save again" do
    visit edit_post_path(posts(:hello_world))
    wait_for_editor

    find_editor.send :end, "  again"
    click_on "Update Post"

    assert_equal "Hello everyone  again", rendered_body_text

    click_on "Edit this post"
    wait_for_editor
    click_on "Update Post"

    assert_equal "Hello everyone  again", rendered_body_text
  end

  private
    def rendered_body_text
      find "article.post p"
      evaluate_script(%(document.querySelector("article.post p").innerText)).tr("\u00a0", " ")
    end
end
