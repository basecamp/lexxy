require "test_helper"

# The prerender: option renders the value into a static content element inside
# <lexxy-editor>, which the editor adopts on connect instead of building an
# empty one — giving the field its final height at first paint (see
# LexicalEditorElement#prerenderedContentElement). Exercised through
# rich_textarea_tag so the same assertions cover whichever integration is
# active: the ActionText::Editor adapter or the TagHelper fallback.
class PrerenderTest < ActionView::TestCase
  helper ActionText::ContentHelper

  test "renders an empty editor by default" do
    render inline: <<~ERB
      <%= rich_textarea_tag :body, "<p>Hello</p>" %>
    ERB

    assert_dom "lexxy-editor", count: 1
    assert_dom "lexxy-editor > *", count: 0
  end

  test "prerender: true renders the value into a content element" do
    render inline: <<~ERB
      <%= rich_textarea_tag :body, "<p>Hello</p>", prerender: true %>
    ERB

    assert_dom "lexxy-editor > div.lexxy-editor__content", count: 1 do
      assert_dom "p", text: "Hello"
    end
    # prerender must not leak through as an HTML attribute
    assert_dom "lexxy-editor[prerender]", count: 0
  end

  test "prerendered content is static until the editor adopts it" do
    render inline: <<~ERB
      <%= rich_textarea_tag :body, "<p>Hello</p>", prerender: true %>
    ERB

    # The element advertises no editability before Lexical mounts — keystrokes
    # into it would be discarded. Adoption adds these attributes on connect.
    assert_dom "lexxy-editor > div.lexxy-editor__content:not([contenteditable]):not([role])"
  end

  test "prerendered content is sanitized" do
    value = %(<p>Safe</p><script>alert("boom")</script><p><img src="x" onerror="alert('boom')"></p>)

    render inline: <<~ERB, locals: { value: value }
      <%= rich_textarea_tag :body, value, prerender: true %>
    ERB

    # The value attribute is escaped and DOMPurify cleans it client-side, but
    # the prerendered element enters the DOM straight from storage — it must go
    # through Action Text's sanitizer.
    assert_dom "lexxy-editor > div.lexxy-editor__content" do |content, *|
      assert_dom "p", text: "Safe"
      assert_dom "script", count: 0
      assert_dom "[onerror]", count: 0
    end
  end

  test "prerendering a blank value renders the editor's empty paragraph" do
    render inline: <<~ERB
      <%= rich_textarea_tag :body, nil, prerender: true %>
    ERB

    assert_dom "lexxy-editor > div.lexxy-editor__content" do
      assert_dom "p br", count: 1
    end
  end

  test "an explicit block wins over prerender" do
    render inline: <<~ERB
      <%= rich_textarea_tag :body, "<p>Hello</p>", prerender: true do %>
        <span id="custom">custom child</span>
      <% end %>
    ERB

    assert_dom "lexxy-editor > span#custom", count: 1
    assert_dom "lexxy-editor > div.lexxy-editor__content", count: 0
  end
end
