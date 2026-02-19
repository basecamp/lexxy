require "application_system_test_case"

class ContentsTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "insertHtml inserts HTML content into the editor" do
    find_editor.evaluate_script "this.contents.insertHtml('<p>Hello world</p>')"
    assert_editor_html "<p>Hello world</p>"
  end

  test "insertDom inserts a parsed document into the editor" do
    find_editor.execute_script <<~JS
      const doc = new DOMParser().parseFromString('<p>Hello from DOM</p>', 'text/html')
      this.contents.insertDom(doc)
    JS
    assert_editor_html "<p>Hello from DOM</p>"
  end
end
