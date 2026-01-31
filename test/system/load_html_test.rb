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

  test "load attachment with custom tag" do
    visit new_post_path(attachment_tag_name: "bc-attachment")

    person = people(:james)

    find_editor.value = <<~HTML
    Hello World <bc-attachment sgid="#{person.attachable_sgid}" content-type="#{person.content_type}" content="&quot;#{person.name}&quot;"></bc-attachment>
    HTML

    assert_editor_html do
      assert_selector "bc-attachment"
    end
  end
end
