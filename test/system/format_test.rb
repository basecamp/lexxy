require "application_system_test_case"

class FormatTest < ApplicationSystemTestCase
  test "use bold and italic together" do
    visit edit_post_path(posts(:hello_world))

    find_editor.select("everyone")
    find_editor.toggle_command("bold")
    find_editor.toggle_command("italic")

    click_on "Update Post"
    click_on "Edit this post"

    assert_equal_html "<p>Hello <i><b><strong>everyone</strong></b></i></p>", find_editor.value
    assert_equal_html "<p dir=\"auto\"><span data-lexical-text=\"true\">Hello </span><strong class=\"lexxy-content__bold lexxy-content__italic\" data-lexical-text=\"true\">everyone</strong></p>", find_editor.inner_html
  end
end
