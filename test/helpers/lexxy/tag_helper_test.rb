require "test_helper"

class Lexxy::TagHelperTest < ActionView::TestCase
  helper ActionText::ContentHelper

  test "#lexxy_rich_textarea_tag renders <action-text-attachment> elements" do
    render inline: <<~ERB, locals: { post: posts(:hello_james) }
      <%= lexxy_rich_textarea_tag :body, post.body %>
    ERB

    assert_dom "lexxy-editor", count: 1 do |lexxy_editor, *|
      assert_dom fragment(lexxy_editor["value"]), "*" do |value|
        attachment = value.at("action-text-attachment")

        assert_equal "Hello ", value.text
        assert_equal "<em>James Anderson</em> (<strong>JA</strong>)", JSON.parse(attachment["content"])
      end
    end
  end

  test "#lexxy_rich_textarea_tag renders passed in value" do
    render inline: <<~ERB
      <%= lexxy_rich_textarea_tag :body, "<p>Sample Content</p>" %>
    ERB
    assert_dom "lexxy-editor", count: 1 do |lexxy_editor, *|
      assert_equal "<p>Sample Content</p>", lexxy_editor["value"]
    end
  end

  test "#lexxy_rich_textarea_tag preserves HTML entities in code blocks" do
    code_html = '<pre data-language="html">&lt;div&gt;test&lt;/div&gt;</pre>'.html_safe

    render inline: <<~ERB, locals: { code_html: code_html }
      <%= lexxy_rich_textarea_tag :body, code_html %>
    ERB

    assert_dom "lexxy-editor", count: 1 do |lexxy_editor, *|
      value = lexxy_editor["value"]
      assert_includes value, "&lt;div&gt;"
      assert_not_includes value, "<div>"
    end
  end
end
