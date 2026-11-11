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

    within "article.post" do
      assert_selector "p > br:only-child", count: 1, visible: :all
    end
    heights = rendered_paragraph_heights
    assert_equal 4, heights.size
    assert_operator heights[1], :>, 0, "the blank line should render"
    assert_operator heights[2], :>, heights[0], "the line break at the end of B should render as a blank line"

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

    visit post_path(post)
    soft_breaks, plain = rendered_paragraph_heights
    assert_operator soft_breaks, :>=, plain * 3, "the two line breaks after C should render as two blank lines"

    visit edit_post_path(post)
    wait_for_editor

    assert_editor_html "<p>C<br><br><br></p><p>D</p>"
  end

  private
    def rendered_paragraph_heights
      find "article.post p", match: :first
      evaluate_script(<<~JS)
        Array.from(document.querySelectorAll("article.post p"), (paragraph) => paragraph.getBoundingClientRect().height)
      JS
    end
end
