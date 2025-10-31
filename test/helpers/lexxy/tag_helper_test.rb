require "test_helper"

class Lexxy::TagHelperTest < ActionView::TestCase
  helper ActionText::ContentHelper

  test "#lexxy_rich_textarea_tag renders <action-text-attachment> elements" do
    render inline: <<~ERB, locals: { post: posts(:hello_james) }
      <%= lexxy_rich_textarea_tag :body, post.body %>
    ERB

    assert_dom "lexxy-editor", count: 1 do |lexxy_editor, *|
      assert_dom fragment(lexxy_editor["value"]), "div" do |div|
        attachment = div.at("action-text-attachment")

        assert_equal "Hello ", div.text
        assert_equal "<em>James Anderson</em> (<strong>JA</strong>)", JSON.parse(attachment["content"])
      end
    end
  end

  test "#lexxy_rich_textarea_tag renders passed in value" do
    render inline: <<~ERB
      <%= lexxy_rich_textarea_tag :body, "<p>Sample Content</p>" %>
    ERB
    assert_dom "lexxy-editor", count: 1 do |lexxy_editor, *|
      assert_dom fragment(lexxy_editor["value"]), "div" do |div|
        assert_equal "<p>Sample Content</p>", div.inner_html
      end
    end
  end
end
