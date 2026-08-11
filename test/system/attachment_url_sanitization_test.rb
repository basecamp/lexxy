require "application_system_test_case"

# Regression coverage for GHSA-cjmm-f4jc-qw8r. DOMPurify's ADD_ATTR-predicate form
# (used by buildConfig for per-tag attribute allowlisting) skipped URI validation, so a
# javascript: scheme in an action-text-attachment `url` — which is read into an <img src>
# — survived sanitization. This exercises the full Action Text round-trip
# (editor -> save -> render -> re-edit) and asserts the dangerous scheme is stripped at
# every stage while a legitimate image url survives.
class AttachmentUrlSanitizationTest < ApplicationSystemTestCase
  SAFE_URL = "https://example.com/safe.png".freeze
  UNSAFE_URL = "javascript:alert(document.domain)".freeze

  setup do
    # Injecting a javascript: url makes the browser log ERR_UNKNOWN_URL_SCHEME when it
    # fails to *load* the <img src> (which is exactly why it is inert), and the placeholder
    # https image 404s — both are expected console noise for this test.
    allow_console_messages
    visit edit_post_path(posts(:empty))
    wait_for_editor
  end

  test "strips a javascript: attachment url across save/render/re-edit while a safe url survives" do
    find_editor.value = <<~HTML.gsub("\n", "")
      <p>before</p>
      <action-text-attachment content-type="image/png" url="#{SAFE_URL}"></action-text-attachment>
      <action-text-attachment content-type="image/png" url="#{UNSAFE_URL}"></action-text-attachment>
      <p>after</p>
    HTML

    click_on "Update Post"

    # Wait for the show page (only it carries "Edit this post"), then assert on the rendered body.
    assert_link "Edit this post"
    rendered = find("article.post")["innerHTML"]
    assert_includes rendered, SAFE_URL, "the legitimate image url should survive to the rendered page"
    refute_match(/javascript:/i, rendered, "no javascript: scheme should reach the rendered page")

    click_on "Edit this post"
    wait_for_editor

    reedited = find_editor.value
    assert_includes reedited, SAFE_URL, "the legitimate image url should survive re-edit"
    refute_match(/javascript:/i, reedited, "no javascript: scheme should survive into the re-opened editor")
  end
end
