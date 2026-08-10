require "test_helper"

# Lexxy's sanitizer decides what an image may carry inside the editor. Action
# Text's decides what survives being saved. When the two disagree the editor
# shows something the server quietly drops, and the difference only appears
# after a reload — so this asserts they agree about images, reading Lexxy's list
# from source rather than copying it, so widening one side without the other
# fails here.
#
# Not every client-side attribute belongs in this check. `contenteditable` and
# `style` are editor machinery and Action Text drops both by design; persisting
# them is not wanted. What has to round-trip is the markup an image needs to
# render the same way twice.
class ImageAttributesTest < ActiveSupport::TestCase
  DOM_PURIFY_SOURCE = Pathname.new(File.expand_path("../../src/config/dom_purify.js", __dir__)).read

  # `alt` is in the blanket allowlist; width/height are scoped to img through the
  # tag-specific mechanism, so they're read from different places.
  IMAGE_ATTRIBUTES = begin
    tag_scoped = DOM_PURIFY_SOURCE[/DEFAULT_TAG_ATTRIBUTES\s*=\s*\{\s*img:\s*\[([^\]]*)\]/m, 1].to_s.scan(/"([^"]+)"/).flatten
    blanket = DOM_PURIFY_SOURCE[/ALLOWED_HTML_ATTRIBUTES\s*=\s*\[([^\]]*)\]/m, 1].to_s.scan(/"([^"]+)"/).flatten
    # Parenthesised deliberately: `+` binds tighter than `&`, so without them
    # this reads (tag_scoped + blanket) & %w[ alt ] and collapses to just "alt".
    (tag_scoped + (blanket & %w[ alt ])).uniq
  end

  test "the source still declares the image attributes this test reads" do
    # Guards the regexes above: if the declarations are renamed or restructured,
    # IMAGE_ATTRIBUTES silently empties and every assertion below passes vacuously.
    assert_includes IMAGE_ATTRIBUTES, "alt"
    assert_includes IMAGE_ATTRIBUTES, "width"
    assert_includes IMAGE_ATTRIBUTES, "height"
  end

  test "every image attribute Lexxy preserves also survives Action Text" do
    markup = %(<img src="/avatar.png" #{IMAGE_ATTRIBUTES.map { |name| %(#{name}="1") }.join(" ")}>)

    sanitized = ActionText::Content.new(markup).to_s

    IMAGE_ATTRIBUTES.each do |name|
      assert_includes sanitized, "#{name}=", "Lexxy keeps #{name} on an image but Action Text strips it on save"
    end
  end

  test "srcset is excluded on both sides" do
    # It carries URLs, so Lexxy leaves it to a consumer that declares it —
    # and Action Text wouldn't persist it anyway. Allowing it client-side would
    # have produced exactly the disagreement this test exists to catch.
    refute_includes IMAGE_ATTRIBUTES, "srcset"
    refute_includes ActionText::Content.new(%(<img src="/a.png" srcset="/a2.png 2x">)).to_s, "srcset"
  end
end
