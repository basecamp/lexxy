require "application_system_test_case"

class HighlightTextDecorationTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:hello_world))
  end

  test "strikethrough and underline lines take the highlight color in rendered content" do
    find_editor.select "everyone"
    find_editor.toggle_command "strikethrough"
    find_editor.toggle_command "underline"
    apply_highlight_option "color", 1
    apply_highlight_option "background-color", 1

    click_on "Update Post"

    assert_link "Edit this post"
    assert_selector ".lexxy-content mark", text: "everyone"
    assert_equal text_color_of("mark"), line_color_of("s"), "the strikethrough line should take the highlight color"
    assert_equal text_color_of("mark"), line_color_of("u"), "the underline should take the highlight color"

    click_on "Edit this post"

    assert_equal_html \
      '<p>Hello <mark style="color: var(--highlight-1);background-color: var(--highlight-bg-1);"><u><s>everyone</s></u></mark></p>',
      find_editor.value
  end

  private
    # A text decoration is drawn in the color of the element that declares it.
    def line_color_of(selector)
      evaluate_script("getComputedStyle(document.querySelector('.lexxy-content #{selector}')).textDecorationColor")
    end

    def text_color_of(selector)
      evaluate_script("getComputedStyle(document.querySelector('.lexxy-content #{selector}')).color")
    end
end
