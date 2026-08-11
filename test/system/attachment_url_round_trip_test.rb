require "application_system_test_case"

# An attachment's `url` is now validated by Lexxy rather than skipped, so what a
# `url` may carry is Lexxy's decision on the way out and Loofah's on the way in.
# When the two disagree the editor shows an attachment the server quietly drops,
# and the difference only appears after a reload.
#
# `action_text_load_test` loads a data: URL but stops there; this is the hop it
# doesn't cover. A data: URI is the case that matters, because it is the one the
# hook exists to permit — DOMPurify drops it on a custom element by default, and
# an attachment's url becomes an <img src>, where data: is what Lexxy allows.
class AttachmentUrlRoundTripTest < ApplicationSystemTestCase
  DATA_URL = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="

  test "an attachment url with a data: URI survives save, render and re-edit" do
    post = Post.create!(title: "Data URL attachment", body: attachment_html(DATA_URL))

    visit edit_post_path(post)
    wait_for_editor

    assert_url_in_editor_value

    click_on "Update Post"

    # The rendered page: the attachment has been through Loofah on the way in.
    within "article.post" do
      assert_selector %(action-text-attachment[url="#{DATA_URL}"]), visible: :all
    end

    click_on "Edit this post"
    wait_for_editor

    assert_url_in_editor_value
  end

  # The other half of the same decision. Before dompurify 3.3.2 restored URI
  # validation for functional ADD_ATTR attributes, this survived the round trip;
  # the hook now refuses it, and the attachment element itself is kept.
  test "an attachment url with an executable scheme never reaches the server" do
    # Deliberate, and asserted rather than waved through — see the console check
    # at the end of this test, which is the point of allowing it.
    allow_console_messages

    post = Post.create!(title: "Executable URL attachment", body: attachment_html("javascript:alert(1)"))

    visit edit_post_path(post)
    wait_for_editor

    value = find_editor.value
    assert_no_match(/javascript:/i, value,
      "an executable scheme reached the value the form submits")
    assert_includes value, "action-text-attachment",
      "only the url should be refused, not the attachment element"

    click_on "Update Post"

    within "article.post" do
      assert_no_selector %([url^="javascript:" i]), visible: :all
    end

    assert_only_console_message_is_the_refused_scheme
  end

  private
    def attachment_html(url)
      <<~HTML
        <div><action-text-attachment content-type="image/gif" url="#{url}" filename="pixel.gif" filesize="43" width="1" height="1" previewable="true"></action-text-attachment></div>
      HTML
    end

    def assert_url_in_editor_value
      assert_includes find_editor.value, DATA_URL,
        "the data: url was dropped from the value the form submits"
    end

    # Pins a known gap rather than tolerating noise.
    #
    # The sanitizer decides what reaches the *value*, which is what this test is
    # about. It does not decide what the attachment node renders: the node reads
    # the raw `url` into `this.src` and assigns it to img.src directly, so a
    # refused scheme still lands in the editor DOM and the browser declines to
    # load it. That console line is the gap, and it is why this test allows
    # console messages at all.
    #
    # Not a regression — before this branch the scheme survived in the value too,
    # so this is strictly narrower. Not exploitable either: browsers do not
    # execute a javascript: URL in img[src]. Asserted exactly so that any *other*
    # console error still fails, and so that whoever closes the gap in
    # action_text_attachment_node finds the reason here instead of a bare
    # allow_console_messages.
    def assert_only_console_message_is_the_refused_scheme
      messages = page.driver.browser.logs.get(:browser).map(&:message)

      assert messages.any? { |message| message.include?("javascript:alert(1)") },
        "expected the refused url to still reach img[src]; if this gap is closed, drop allow_console_messages here"

      unrelated = messages.reject { |message| message.include?("javascript:alert(1)") }
      assert_empty unrelated, "unexpected console messages beyond the known img[src] gap:\n#{unrelated.join("\n\n")}"
    end
end
