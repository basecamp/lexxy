require "application_system_test_case"

class ColorHighlighterTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:hello_world))
  end

  test "use bold and italic together" do
    find_editor.select "everyone"
    find_editor.toggle_command "bold"
    find_editor.toggle_command "italic"

    click_on "Update Post"
    click_on "Edit this post"

    assert_equal_html "<p>Hello <i><b><strong>everyone</strong></b></i></p>", find_editor.value
  end

  test "color highlighting collapsed selection" do
    find_editor.select "everyone"
    find_editor.send :arrow_right

    apply_highlight_option "color", 1
    find_editor.send " again!"

    assert_equal_html "<p>Hello everyone<mark style=\"color: var(--highlight-1);\"> again!</mark></p>", find_editor.value
  end

  test "color highlighting is preserved after saving" do
    find_editor.select "everyone"
    apply_highlight_option "background-color", 1

    click_on "Update Post"

    assert_selector "mark[style='background-color:var(--highlight-bg-1);']", text: "everyone"
  end
end
