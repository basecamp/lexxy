require "application_system_test_case"

class HtmlSnippetPasteTest < ApplicationSystemTestCase
  SNIPPET = "<div id=\"widget\"></div>\n<script>\n  const s = \"a  b\";\n</script>"

  test "a pasted HTML snippet survives saving, rendering and re-editing as code" do
    visit edit_post_path(posts(:empty))
    find_editor.paste "Add this:\n\n#{SNIPPET}"
    find_editor.within_contents { assert_text "const s" }

    click_on "Update Post"

    assert_selector "pre[data-language='html']"
    assert_includes find("pre[data-language='html']").text, SNIPPET

    visit edit_post_path(posts(:empty))

    find_editor.within_contents do
      assert_text "Add this:"
      assert_includes find("code").text, SNIPPET
    end
  end
end
