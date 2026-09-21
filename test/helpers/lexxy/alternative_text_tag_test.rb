require "test_helper"

class Lexxy::AlternativeTextTagTest < ActionView::TestCase
  test "applications can disable alternative text authoring" do
    render inline: <<~ERB
      <%= rich_textarea_tag :body, "", "alternative-text": false %>
    ERB

    assert_dom "lexxy-editor[alternative-text='false']"
  end
end
