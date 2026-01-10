require "application_system_test_case"

class LoadHtmlTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "load simple string" do
    find_editor.value = "Hello"

    assert_editor_html do
      assert_selector "p", text: "Hello"
    end
  end

  test "normalize loaded HTML" do
    find_editor.value = "<div>hello</div> <div>there</div>"
    assert_editor_html "<p>hello</p><p>there</p>"
  end
end
