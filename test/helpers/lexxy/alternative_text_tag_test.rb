require "test_helper"

class Lexxy::AlternativeTextTagTest < ActionView::TestCase
  test "alternative text support follows Action Text capabilities" do
    render inline: <<~ERB
      <%= rich_textarea_tag :body, "" %>
    ERB

    supported = ActionText::Attachment::ATTRIBUTES.include?("alt")
    assert_dom "lexxy-editor[data-action-text-supports-alt='#{supported}']"
  end
end
