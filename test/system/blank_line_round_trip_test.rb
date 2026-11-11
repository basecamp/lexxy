require "application_system_test_case"

class BlankLineRoundTripTest < ApplicationSystemTestCase
  test "Trix blank lines survive editing and saving without changes" do
    post = Post.create!(title: "From Trix", body: "<div>A</div><div><br></div><div>B<br><br></div><div>C</div>")

    visit edit_post_path(post)
    wait_for_editor

    expected_html = "<p>A</p><p><br></p><p>B<br><br></p><p>C</p>"
    assert_editor_html expected_html

    click_on "Update Post"
    assert_text "Post was successfully updated."

    click_on "Edit this post"
    wait_for_editor

    assert_editor_html expected_html
  end

  test "trailing line breaks survive repeated saves" do
    post = Post.create!(title: "Soft breaks", body: "<p>C<br><br><br></p><p>D</p>")

    3.times do
      visit edit_post_path(post)
      wait_for_editor
      click_on "Update Post"
      assert_text "Post was successfully updated."
    end

    visit edit_post_path(post)
    wait_for_editor

    assert_editor_html "<p>C<br><br><br></p><p>D</p>"
  end
end
