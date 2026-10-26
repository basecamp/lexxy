require "application_system_test_case"

class FormTest < ApplicationSystemTestCase
  test "can create new records" do
    visit posts_path
    click_on "New post"

    find_editor.send "Hello"
    find_editor.send :enter
    find_editor.send "there"

    click_on "Create Post"
    click_on "Edit this post"
    wait_for_editor

    assert_editor_html "<p>Hello</p><p>there</p>"
  end

  test "edit existing records" do
    visit edit_post_path(posts(:empty))

    find_editor.send "Hello"
    find_editor.send :enter
    find_editor.send "there"

    click_on "Update Post"
    click_on "Edit this post"
    wait_for_editor

    assert_editor_html "<p>Hello</p><p>there</p>"
  end

  test "resets editor to initial state when empty" do
    visit posts_path
    click_on "New post"

    find_editor.send "This"
    click_on "Reset"
    find_editor.send "That"

    click_on "Create Post"
    click_on "Edit this post"
    wait_for_editor

    assert_editor_html "<p>That</p>"
  end

  test "resets editor to initial state when form is reset" do
    visit edit_post_path(posts(:hello_world))

    find_editor.send " Changed!"

    click_on "Reset"

    assert_editor_html "<p>Hello everyone</p>"
  end

  test "supports required field" do
    visit posts_path
    click_on "New post"

    click_on "Create Post"

    assert_selector "lexxy-editor:invalid"
    assert_current_path new_post_path
  end

  test "an empty editor submits an empty value" do
    visit posts_path
    click_on "New post"
    wait_for_editor

    assert_editor_html ""
    assert_equal "", submitted_body
  end

  test "clearing the editor saves an empty body" do
    visit edit_post_path(posts(:hello_world))

    find_editor.value = ""
    assert_equal "", submitted_body

    find_editor.execute_script "this.removeAttribute('required')"
    click_on "Update Post"
    assert_text "Post was successfully updated"

    assert_equal "", posts(:hello_world).reload.body.body.to_html
  end

  test "clearing value of editor keeps an empty paragraph to type into" do
    visit edit_post_path(posts(:hello_world))

    find_editor.value = ""

    assert_editor_html ""
    assert_selector "lexxy-editor [contenteditable] p", count: 1
  end

  test "an emptied editor stays empty when moved in the page" do
    visit edit_post_path(posts(:hello_world))

    find_editor.value = ""
    find_editor.execute_script "this.parentElement.append(this)"

    assert_editor_html ""
    assert_no_text "Hello everyone"
  end

  private
    def submitted_body
      find_editor.evaluate_script "new FormData(this.form).get('post[body]')"
    end
end
