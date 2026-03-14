require "application_system_test_case"

class UrlPreviewBracketEscapingTest < ApplicationSystemTestCase
  setup do
    # Create a post with a custom attachment containing angle brackets in the content.
    # The content attribute uses Lexxy's format: a JSON-stringified HTML string.
    #
    # In the browser, the Lexxy editor serializes this as:
    #   JSON.stringify('<div>Title: &lt;Hello&gt; Page</div>')
    #   => '"<div>Title: &lt;Hello&gt; Page</div>"'
    #
    # When the browser serializes the attribute to HTML (via outerHTML), it
    # HTML-entity-encodes the value:
    #   content="&quot;&lt;div&gt;Title: &amp;lt;Hello&amp;gt; Page&lt;/div&gt;&quot;"
    @post = Post.create!(
      title: "Post with bracketed URL preview",
      body: '<p><action-text-attachment content="&quot;&lt;div&gt;Title: &amp;lt;Hello&amp;gt; Page&lt;/div&gt;&quot;" content-type="text/html"></action-text-attachment></p>'
    )
  end

  test "displays angle bracket content correctly in URL preview after save and reload" do
    visit edit_post_path(@post)
    wait_for_editor

    # The editor should display the angle brackets as actual characters
    within("lexxy-editor") do
      assert_text "<Hello>"
      assert_no_text "&lt;Hello&gt;"
      assert_no_text "&amp;lt;"
    end
  end

  test "preserves angle bracket content through save-reload cycle" do
    allow_console_messages

    visit edit_post_path(@post)
    wait_for_editor

    # Verify initial display
    within("lexxy-editor") do
      assert_text "<Hello>"
    end

    # Get the editor value before save
    value_before = find_editor.value

    # Save the post
    click_on "Update Post"

    # Edit again
    visit edit_post_path(@post)
    wait_for_editor

    # The angle brackets should still be displayed correctly
    within("lexxy-editor") do
      assert_text "<Hello>"
      assert_no_text "&lt;Hello&gt;"
      assert_no_text "&amp;lt;"
    end

    # Check the editor value hasn't been corrupted
    value_after = find_editor.value

    # Parse content attributes from both values
    content_before = extract_attachment_content(value_before)
    content_after = extract_attachment_content(value_after)

    assert_includes content_before, "&lt;Hello&gt;", "Before save: content should have HTML-encoded brackets"
    assert_not_includes content_before, "&amp;lt;", "Before save: content should not be double-encoded"

    assert_includes content_after, "&lt;Hello&gt;", "After reload: content should have HTML-encoded brackets"
    assert_not_includes content_after, "&amp;lt;", "After reload: content should not be double-encoded"
  end

  private
    def extract_attachment_content(editor_value)
      doc = Nokogiri::HTML.fragment(editor_value)
      node = doc.at_css("action-text-attachment")
      return nil unless node

      content = node["content"]
      begin
        JSON.parse(content)
      rescue
        content
      end
    end
end
