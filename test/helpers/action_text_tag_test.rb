require "test_helper"

class ActionTextTagTest < ActionView::TestCase
  include ActionText::ContentHelper
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

  test "rich_textarea loads decrypted content for encrypted rich text" do
    person = people(:james)
    @post = Post.create!(secret_body: "<p>Secret note for #{ActionText::Attachment.from_attachable(person).to_html}</p>")
    @post.reload
    assert @post.secret_body.encrypted_attribute?(:body)

    html = rich_textarea(:post, :secret_body)
    value = Nokogiri::HTML5.fragment(html).at("lexxy-editor")["value"]

    assert_includes value, "<p>Secret note for "
    assert_includes Nokogiri::HTML5.fragment(value).at("action-text-attachment")["content"], person.name
    assert_not_includes value, @post.secret_body.body_before_type_cast
  end
end
