require "application_system_test_case"

class BlockquoteEmphasisRoundTripTest < ApplicationSystemTestCase
  test "emphasis inside a quote renders upright on the saved post" do
    visit edit_post_path(posts(:empty))
    wait_for_editor

    find_editor.value = "<blockquote><p>Quoted <em>italic</em> and <strong><em>bold italic</em></strong></p></blockquote>"
    click_on "Update Post"

    within "article.post blockquote" do
      assert_selector "em", text: "italic"
      assert_selector "i", text: "bold italic"
    end

    assert_equal "italic", font_style_of("article.post blockquote p")
    assert_equal "normal", font_style_of("article.post blockquote em")
    assert_equal "normal", font_style_of("article.post blockquote i")
  end

  private
    def font_style_of(selector)
      page.evaluate_script("getComputedStyle(document.querySelector(#{selector.to_json})).fontStyle")
    end
end
