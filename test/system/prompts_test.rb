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

  test "hasOpenPrompt reports correct status" do
    assert_not find_editor.open_prompt?

    find_editor.send "1"

    wait_until { find_editor.open_prompt? }

    find_editor.send "peter "

    wait_until { !find_editor.open_prompt? }
  end

  test "configure space support in searches" do
    find_editor.send "3"
    find_editor.send "peter johnson"

    within_popover do
      assert_text "Peter Johnson"
    end

    assert_no_mention_attachments
  end

  test "prompt with multiple attachables" do
    find_editor.send "group:"

    click_on_prompt "Group 0"

    find_editor.within_contents do
      assert_selector %(action-text-attachment[content-type="application/vnd.actiontext.group_mention"]), count: 5
    end

    all("action-text-attachment").map { |el| el["sgid"] }.uniq.size == 5
  end

  test "multichar prompt preceded by space" do
    find_editor.send "hello group:"

    within_popover do
      assert_text "Group 0"
    end
  end

  test "multichar prompt not triggered without space" do
    find_editor.send "hellogroup:"

    assert_no_css ".lexxy-prompt-menu--visible"
  end

  test "space support in multichar triggers" do
    find_editor.send "person:"
    find_editor.send "peter johnson"

    within_popover do
      assert_text "Peter Johnson"
    end

    assert_no_mention_attachments
  end

  test "global custom content-type of mentions" do
    visit edit_post_path(posts(:empty), attachment_content_type_namespace: "myapp")

    find_editor.send "1"
    click_on_prompt "Peter Johnson"

    assert_selector %(action-text-attachment[content-type="application/vnd.myapp.mention"])
    assert_no_selector %(action-text-attachment[content-type="application/vnd.actiontext.mention"])
  end

  private
    def within_popover(&block)
      within(".lexxy-prompt-menu", &block)
    end
end
