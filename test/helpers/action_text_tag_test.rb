require "test_helper"

class ActionTextTagTest < ActionView::TestCase
  include ActionText::TagHelper
  include ActionView::Helpers::FormHelper
  include ActionView::RecordIdentifier

  setup do
    @post = posts(:hello_world)
  end

  test "rich_textarea renders with object (uses dom_id path)" do
    @post = posts(:hello_world)

    html = rich_textarea(:post, :body)

    assert_match(/trix-editor|lexxy-editor/, html)
    assert_match(/post\[body\]/, html)
  end

  test "rich_textarea renders with object and block (uses dom_id path)" do
    @post = posts(:hello_world)

    html = rich_textarea(:post, :body) do
      "<lexxy-prompt>test</lexxy-prompt>".html_safe
    end

    assert_match(/trix-editor|lexxy-editor/, html)
    assert_match(/post\[body\]/, html)
  end

  test "rich_textarea renders without object" do
    html = rich_textarea(:message, :content)

    assert_match(/trix-editor|lexxy-editor/, html)
    assert_match(/message\[content\]/, html)
  end
end
