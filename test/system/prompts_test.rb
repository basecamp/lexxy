require "application_system_test_case"

class ActionTextLoadTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "inline prompt" do
    find_editor.send "1"
    click_on_prompt "Peter Johnson"
    assert_mention_attachment people(:peter)
  end

  test "deferred prompt" do
    find_editor.send "2"
    click_on_prompt "Peter Johnson"
    assert_mention_attachment people(:peter)
  end

  test "remote filtering prompt with editable-text insertion" do
    find_editor.send "3"
    click_on_prompt "Peter Johnson"

    find_editor.within_contents do
      assert_text people(:peter).name
    end
  end

  test "space selects by default" do
    find_editor.send "1"
    find_editor.send "peter "
    assert_mention_attachment people(:peter)
  end

  test "configure space support in searches" do
    find_editor.send "3"
    find_editor.send "peter johnson"

    within_popover do
      assert_text "Peter Johnson"
    end

    assert_no_mention_attachments
  end

  private
    def within_popover(&block)
      within(".lexxy-prompt-menu", &block)
    end
end
