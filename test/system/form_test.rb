require "application_system_test_case"

class ActionTextLoadTest < ApplicationSystemTestCase
  test "can create new records" do
    visit posts_path
    click_on "New post"

    find_editor.send "Hello"
    find_editor.send :enter
    find_editor.send "there"

    click_on "Create Post"
    click_on "Edit this post"

    assert_equal_html "<p>Hello</p><p>there</p>", find_editor.value
  end

  test "edit existing records" do
    visit edit_post_path(posts(:empty))

    find_editor.send "Hello"
    find_editor.send :enter
    find_editor.send "there"

    click_on "Update Post"

    assert_equal_html "<p>Hello</p><p>there</p>", find_editor.value
  end

  test "resets editor to initial state when empty" do
    visit posts_path
    click_on "New post"

    find_editor.send "This"
    click_on "Reset"
    find_editor.send "That"

    click_on "Create Post"
    click_on "Edit this post"

    assert_equal_html "<p><br></p><p>That</p>", find_editor.value
  end

  test "resets editor to initial state when form is reset" do
    visit edit_post_path(posts(:hello_world))

    find_editor.send " Changed!"

    click_on "Reset"

    assert_equal_html "<p>Hello everyone</p>", find_editor.value
  end
end
