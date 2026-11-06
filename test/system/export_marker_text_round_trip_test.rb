require "application_system_test_case"

class ExportMarkerTextRoundTripTest < ApplicationSystemTestCase
  test "text that reads like Lexical's indentation attribute survives save, show, and re-edit" do
    visit edit_post_path(posts(:empty))
    wait_for_editor

    find_editor.send 'Explain data-lexical-indent="2" here'
    find_editor.send :enter
    click_on "Code"
    select "HTML", from: "lexxy-code-language"
    find_editor.send '<p data-lexical-indent="1">x</p>'

    assert_editor_html do
      has_css?("p", text: 'Explain data-lexical-indent="2" here') &&
        has_css?("pre", text: '<p data-lexical-indent="1">x</p>')
    end

    click_on "Update Post"

    within "article.post" do
      assert_selector "p", text: 'Explain data-lexical-indent="2" here'
      assert_selector "pre[data-language='html']", text: '<p data-lexical-indent="1">x</p>'
    end

    click_on "Edit this post"
    wait_for_editor

    assert_editor_html do
      has_css?("p", text: 'Explain data-lexical-indent="2" here') &&
        has_css?("pre", text: '<p data-lexical-indent="1">x</p>')
    end
  end
end
