require "application_system_test_case"

class PasteGoogleDocsTest < ApplicationSystemTestCase
  test "bold, italic and soft line breaks pasted from Google Docs survive saving and re-editing" do
    visit edit_post_path(posts(:empty))

    find_editor.paste "Some sample text italic bold \nSoft Line break\nReal line break", html: file_fixture("google_docs_clipboard.html").read

    expected_html = "<p>Some sample text <em>italic</em> <strong>bold</strong> <br>Soft Line break</p><p>Real line break</p>"
    assert_equal_html expected_html, find_editor.value

    click_on "Update Post"

    assert_selector "em", text: "italic"
    assert_selector "strong", text: "bold"
    assert_no_selector "strong", text: "Some sample text"
    assert_selector "p br", visible: :all

    click_on "Edit this post"

    # Loading saved HTML collapses the invisible space before a <br>, as it does for any content
    assert_equal_html expected_html.sub(" <br>", "<br>"), find_editor.value
  end
end
