require "application_system_test_case"

class CodeBlocksTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "enter a code block and set a language" do
    find_editor.send "def hello_world"
    find_editor.select("dev")
    click_on "Code"
    assert_equal "plain", find("select[name=lexxy-code-language]").value

    select "Ruby", from: "lexxy-code-language"
    assert_selector "span.code-token__attr", text: "def"
  end
end
