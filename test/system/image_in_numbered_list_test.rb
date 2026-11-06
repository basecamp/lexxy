require "application_system_test_case"

class ImageInNumberedListTest < ApplicationSystemTestCase
  test "an image inserted into a numbered list keeps a soft-broken bullet and the numbering through save and re-edit" do
    visit edit_post_path(posts(:empty))
    wait_for_editor

    find_editor.value = "<ol><li>First</li><li>Second</li><li>Third</li></ol>"
    find_editor.select("Second")
    find_editor.send :right, :enter, [ :shift, :enter ]

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end
    assert_selector "lexxy-editor figure.attachment img[src*='/rails/active_storage']"

    click_on "Update Post"
    assert_text "Post was successfully updated."

    within "article.post" do
      assert_selector "ol", count: 2
      assert_selector "ol:first-of-type > li", count: 3
      assert_selector "ol:first-of-type > li", text: "Second"
      assert_selector "ol[start='4'] > li", text: "Third"
    end

    click_on "Edit this post"
    wait_for_editor

    assert_selector "lexxy-editor ol", count: 2
    assert_selector "lexxy-editor ol:first-of-type > li", count: 3
    assert_selector "lexxy-editor ol[start='4'] > li", text: "Third"
  end
end
