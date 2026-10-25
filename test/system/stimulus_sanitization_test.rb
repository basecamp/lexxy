require "application_system_test_case"

class StimulusSanitizationTest < ApplicationSystemTestCase
  # #3925075: an attachment's content= can smuggle Stimulus behavior attributes
  # (data-controller/data-action). On hydration Lexxy renders that stored HTML
  # into the live editor DOM (createDOM -> insertAdjacentHTML(sanitize(...))), so
  # the sanitizer must strip those attributes there — otherwise stored content
  # wires up arbitrary controllers/actions in the viewer's editing session.
  #
  # This exercises the full Action Text round-trip in the dummy app: the payload
  # is hydrated in a real edit page, saved through Rails (Loofah), rendered on
  # the show page, and re-opened for editing. Legitimate content — a mention and
  # a data-language code block — survives the whole cycle, while the Stimulus
  # attributes never reach the live editor DOM.
  #
  # The payload is delivered with setValue rather than a seeded Post body,
  # mirroring test/browser/tests/paste/xss_sanitization.test.js: Action Text
  # re-renders a resolvable mention attachment from its partial on save (dropping
  # a custom content=), and a content-carrying non-attachable attachment fails to
  # render, so neither seeds the vector faithfully. The security-critical
  # assertion is the first hydration below — the leg that goes red if the
  # sanitizer hook / FORBID_ATTR from lexxy#1225 is reverted. The save/render/
  # re-edit legs confirm the fix does not strip legitimate content and that the
  # editor stays clean across the round-trip.
  test "smuggled Stimulus behavior attributes never hydrate into the editor across the Action Text round trip" do
    person = people(:michael)

    visit edit_post_path(posts(:empty))
    wait_for_editor

    smuggled_content = CGI.escapeHTML(
      %(<span data-controller="content-loader" data-action="click->content-loader#load" class="person--inline">Smuggled</span>)
    )
    find_editor.value =
      %(<div>) +
      %(<p>Intro</p>) +
      %(<action-text-attachment sgid="#{person.attachable_sgid}" content-type="application/vnd.actiontext.mention" content="#{smuggled_content}"></action-text-attachment>) +
      %(<pre data-language="ruby"><code>puts "hi"</code></pre>) +
      %(</div>)

    # First hydration — the guarded path. The smuggled markup renders into the
    # live editor DOM with the Stimulus attributes stripped, while the code
    # block's data-language and the attachment survive. Reverting lexxy#1225's
    # hook/FORBID_ATTR leaves data-controller/data-action live here.
    within find_editor.content_element do
      assert_selector "action-text-attachment", text: "Smuggled"
      assert_selector "[data-language='ruby']"
      assert_no_selector "[data-controller]"
      assert_no_selector "[data-action]"
    end

    click_on "Update Post"

    # Saved through Rails and rendered: the mention resolves to its partial and
    # the code block survives Loofah and the highlight pass; no Stimulus behavior
    # rides along inside the rendered attachment.
    within "article.post" do
      assert_selector "bc-mention", text: person.name
      assert_selector "pre[data-language='ruby']"
      assert_no_selector "action-text-attachment [data-controller]"
    end

    click_on "Edit this post"
    wait_for_editor

    # Re-editing the stored post rehydrates a clean editor: the mention and code
    # block are back, and no Stimulus behavior attributes reappear.
    within find_editor.content_element do
      assert_selector "action-text-attachment[content-type='application/vnd.actiontext.mention']", text: person.name
      assert_selector "[data-language='ruby']"
      assert_no_selector "[data-controller]"
      assert_no_selector "[data-action]"
    end
  end
end
