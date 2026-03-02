require "application_system_test_case"

class EventsTest < ApplicationSystemTestCase
  test "no lexxy:change event on initial load" do
    visit edit_post_path(posts(:empty))

    assert_no_dispatched_event "lexxy:change"
  end

  test "dispatch lexxy:focus and lexxy:blur events on focus gain and loss" do
    visit edit_post_path(posts(:empty))
    find_editor.focus
    assert_dispatched_event "lexxy:focus"

    page.find("input[name='post[title]']").click
    assert_dispatched_event "lexxy:blur"
  end

  test "using toolbar dispatches lexxy:focus" do
    visit edit_post_path(posts(:empty))
    page.find("input[name='post[title]']").click
    assert_no_dispatched_event "lexxy:focus"

    page.find("button[data-command='bold']").click
    assert_dispatched_event "lexxy:focus"
    assert_no_dispatched_event "lexxy:blur"
  end

  test "using toolbar does not dispatch lexxy:blur" do
    visit edit_post_path(posts(:empty))
    find_editor.focus
    assert_dispatched_event "lexxy:focus"

    page.find("button[data-command='bold']").click
    assert_no_dispatched_event "lexxy:blur"
  end

  test "toolbar dropdowns do not dispatch lexxy:blur" do
    visit edit_post_path(posts(:empty))
    find_editor.focus
    assert_dispatched_event "lexxy:focus"

    apply_highlight_option "background-color", 1
    assert_no_dispatched_event "lexxy:blur"
  end

  test "dispatch lexxy:change event on edits" do
    visit edit_post_path(posts(:empty))

    find_editor.send "Y"

    assert_dispatched_event "lexxy:change"
  end

  test "use lexxy:file-accept to allow valid attachments" do
    visit edit_post_path(posts(:empty), attachment_type: "image/png")

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end

    assert_image_figure_attachment content_type: "image/png", caption: "example.png"
  end

  test "use lexxy:file-accept to block invalid attachments" do
    visit edit_post_path(posts(:empty), attachment_type: "image/png")

    attach_file file_fixture("note.txt") do
      click_on "Upload file"
    end

    assert_no_attachment content_type: "text/plain"
  end

  test "dispatch lexxs:insert-link event when a link is pasted in" do
    visit edit_post_path(posts(:empty))

    assert_no_dispatched_event "lexxy:insert-link"

    find_editor.paste "https://37signals.com"

    assert_dispatched_event "lexxy:insert-link"

    find_editor.value = ""

    find_editor.paste "https://example.com?action=replace&attachment=false"
    assert_selector "div", text: "Link Preview: https://example.com?action=replace&attachment=false"
    assert_no_selector "a[href*='example.com']"

    find_editor.value = ""

    find_editor.paste "https://example.com?action=replace&attachment=true"
    assert_selector "action-text-attachment[content-type='text/html']"
    assert_no_selector "a[href*='example.com']"

    find_editor.value = ""

    find_editor.paste "https://example.com?action=insert&attachment=false"
    assert_selector "a[href*='example.com']"
    assert_selector "div", text: "Link Preview: https://example.com?action=insert&attachment=false"

    find_editor.value = ""

    find_editor.paste "https://example.com?action=insert&attachment=true"
    assert_selector "a[href*='example.com']"
    assert_selector "action-text-attachment[content-type='text/html']"
  end

  test "dispatch lexxy:insert-markdown event when markdown is pasted" do
    visit edit_post_path(posts(:empty))

    find_editor.paste "Hello **there**"

    assert_dispatched_event "lexxy:insert-markdown"
    assert_editor_html "<p>Hello <b><strong>there</strong></b></p>"
  end

  test "lexxy:insert-markdown event detail is frozen with expected shape" do
    visit edit_post_path(posts(:empty))

    page.execute_script <<~JS
      document.querySelector("lexxy-editor").addEventListener("lexxy:insert-markdown", (event) => {
        const d = event.detail
        const results = []
        if (!Object.isFrozen(d)) results.push("detail is not frozen")
        if (typeof d.markdown !== "string") results.push("markdown is not a string")
        if (!(d.document instanceof Document)) results.push("document is not a Document")
        if (typeof d.addBlockSpacing !== "function") results.push("addBlockSpacing is not a function")

        const el = document.createElement("div")
        el.id = "detail-check"
        el.textContent = results.length === 0 ? "all checks passed" : results.join(", ")
        document.body.appendChild(el)
      })
    JS

    find_editor.paste "Hello **there**"

    assert_selector "#detail-check", text: "all checks passed"
  end

  test "lexxy:insert-markdown event detail includes the original markdown" do
    visit edit_post_path(posts(:empty))

    page.execute_script <<~JS
      document.querySelector("lexxy-editor").addEventListener("lexxy:insert-markdown", (event) => {
        const el = document.createElement("div")
        el.id = "markdown-check"
        el.textContent = event.detail.markdown
        document.body.appendChild(el)
      })
    JS

    find_editor.paste "Hello **there**"

    assert_equal "Hello **there**", find("#markdown-check").text
  end

  test "lexxy:insert-markdown event handler can mutate the DOM to remove images" do
    visit edit_post_path(posts(:empty))

    page.execute_script <<~JS
      document.querySelector("lexxy-editor").addEventListener("lexxy:insert-markdown", (event) => {
        event.detail.document.querySelectorAll("img").forEach(img => img.remove())
      })
    JS

    find_editor.paste "Hello ![alt](http://example.com/image.png) world"

    assert_editor_html do
      assert_selector "p", text: "Hello world"
      assert_no_selector "img"
    end
  end

  test "lexxy:insert-markdown event handler can use addBlockSpacing" do
    visit edit_post_path(posts(:empty))

    page.execute_script <<~JS
      document.querySelector("lexxy-editor").addEventListener("lexxy:insert-markdown", (event) => {
        event.detail.addBlockSpacing()
      })
    JS

    find_editor.paste "paragraph one\n\nparagraph two"

    assert_editor_html "<p>paragraph one</p><p><br></p><p>paragraph two</p>"
  end

  test "lexxy:insert-markdown event does not fire when pasting a URL" do
    visit edit_post_path(posts(:empty))

    find_editor.paste "https://37signals.com"

    assert_no_dispatched_event "lexxy:insert-markdown"
    assert_dispatched_event "lexxy:insert-link"
  end

  test "lexxy:insert-markdown event does not fire when markdown is disabled" do
    visit edit_post_path(posts(:empty), markdown_disabled: true)

    find_editor.click
    find_editor.paste "Hello **there**"

    assert_no_dispatched_event "lexxy:insert-markdown"
    assert_editor_html "<p>Hello **there**</p>"
  end

  test "lexxy:insert-markdown event does not fire when pasting into code block" do
    visit edit_post_path(posts(:empty))

    find_editor.paste "some text"
    find_editor.toggle_command "insertCodeBlock"
    page.execute_script 'document.querySelector("#events").innerHTML = ""'
    find_editor.paste "Hello **there**"

    assert_no_dispatched_event "lexxy:insert-markdown"
    assert_editor_html do
      assert_text "**there**"
      assert_no_selector "strong", text: "there"
    end
  end

  private
    def assert_dispatched_event(type)
      assert_selector "[data-event='#{type}']"
    end

    def assert_no_dispatched_event(type)
      assert_no_selector "[data-event='#{type}']"
    end
end
