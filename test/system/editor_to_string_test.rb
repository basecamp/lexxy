require "application_system_test_case"

class EditorValueMethodsTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "An empty editor returns an empty string" do
    assert_editor_plain_text ""
  end

  test "Text content is returned as-is" do
    find_editor.send "Hello World"
    assert_editor_plain_text "Hello World"
  end

  test "toString includes line breaks" do
    find_editor.send "Hello"
    find_editor.send :enter
    find_editor.send "World"

    assert_editor_plain_text "Hello\n\nWorld"
  end

  test "Attachments return their placeholder strings" do
    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end
    sleep 0.1

    assert_editor_plain_text "[example.png]\n\n"

    find("figcaption textarea").click.send_keys("Example Image")
    find_editor.click
    sleep 0.1

    assert_editor_plain_text "[Example Image]\n\n"
  end

  test "toString returns content for custom_action_text_attachment (mention)" do
    find_editor.send "1"
    click_on_prompt "Peter Johnson"

    assert_editor_plain_text "Peter Johnson "
  end

  test "toString with mixed content includes all text" do
    find_editor.send "Hello, "
    find_editor.send "1"
    click_on_prompt "Peter Johnson"
    find_editor.send :backspace
    find_editor.send ". How are you?"

    assert_editor_plain_text "Hello, Peter Johnson. How are you?"
  end

  test "toString demo value" do
    find_editor.value = <<~HTML
    <h3>Lexxy</h3>
    <p>Introducing <a href="https://github.com/basecamp/lexxy">Lexxy</a></p>
    <pre data-language="html" data-highlight-language="html">
    &lt;lexxy-editor placeholder="It all starts here..."&gt;<br>&lt;/lexxy-editor&gt;</pre>
    <h4>Features</h4>
    <ul>
      <li>Built on top of Lexical</li>
     <li>Text <mark style="color: var(--highlight-1);">highlights</mark></li>
    </ul>
    <blockquote>Quote block</blockquote>
    <hr />
    HTML

    assert_editor_plain_text <<~TEXT
    Lexxy

    Introducing Lexxy

    <lexxy-editor placeholder="It all starts here...">
    </lexxy-editor>

    Features

    Built on top of Lexical

    Text highlights

    Quote block

    ┄

    TEXT
  end
end
