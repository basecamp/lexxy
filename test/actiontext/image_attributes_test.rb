require "test_helper"

# Lexxy's sanitizer decides what an image may carry inside the editor. Action
# Text's decides what survives being saved. When the two disagree the editor
# shows something the server quietly drops, and the difference only appears
# after a reload — so this asserts they agree about images.
#
# Agreement means the attribute survives on the image carrying a value, not that
# its name appears somewhere in the rendered document. Those are different
# claims: the dummy layout wraps content in `<div class="lexxy-content">`, so a
# whole-document substring check passed the `class` case with no class on the
# image at all, and passed `style` while Action Text emptied its value.
#
# Lexxy's list is read from source rather than copied. That is deliberately not
# the STYLE.md default of testing behaviour over implementation, and the reason
# is that the property here spans two languages: the thing that has to hold is
# "these two allowlists agree", and Ruby has no public interface onto the
# JavaScript one. Copying the list into Ruby turns a drift this test would catch
# into one it cannot — the Ruby copy would keep passing while Lexxy widened
# underneath it. Reading the source is what makes the assertion mean anything.
#
# The cost is a Ruby test coupled to two declarations in dom_purify.js. It is
# bounded: rename or restructure either one and the first test below fails
# loudly, rather than the suite passing vacuously.
class ImageAttributesTest < ActiveSupport::TestCase
  DOM_PURIFY_SOURCE = Pathname.new(File.expand_path("../../src/config/dom_purify.js", __dir__)).read

  # Editor machinery. Action Text strips it and we don't want it persisted, so it
  # is the one blanket attribute exempt from the agreement below.
  NOT_PERSISTED = %w[ contenteditable ].freeze

  # `alt` and friends are in the blanket allowlist; width/height are scoped to img
  # through the tag-specific mechanism, so they're read from different places.
  BLANKET_ATTRIBUTES = DOM_PURIFY_SOURCE[/ALLOWED_HTML_ATTRIBUTES\s*=\s*\[([^\]]*)\]/m, 1].to_s.scan(/"([^"]+)"/).flatten
  TAG_SCOPED_IMAGE_ATTRIBUTES = DOM_PURIFY_SOURCE[/DEFAULT_TAG_ATTRIBUTES\s*=\s*\{\s*img:\s*\[([^\]]*)\]/m, 1].to_s.scan(/"([^"]+)"/).flatten

  # Every blanket attribute, not an intersection with a hardcoded name. An earlier
  # version read `blanket & %w[ alt ]`, which meant a newly blanket-allowed
  # attribute was silently outside the check — the exact drift the comment above
  # claims to catch.
  IMAGE_ATTRIBUTES = (TAG_SCOPED_IMAGE_ATTRIBUTES + (BLANKET_ATTRIBUTES - NOT_PERSISTED)).uniq

  # A uniform "1" won't do: Action Text parses `style` as CSS and hands back
  # `style=""` for it — the name kept, the value destroyed. `color` and
  # `background-color` are the two properties Lexxy allows, and both round-trip.
  ATTRIBUTE_VALUES = { "style" => "color: red" }.freeze

  test "the source still declares the image attributes this test reads" do
    # Guards the regexes above: if the declarations are renamed or restructured,
    # IMAGE_ATTRIBUTES silently empties and every assertion below passes vacuously.
    assert_includes IMAGE_ATTRIBUTES, "alt"
    assert_includes IMAGE_ATTRIBUTES, "width"
    assert_includes IMAGE_ATTRIBUTES, "height"
    assert_includes IMAGE_ATTRIBUTES, "src"
  end

  test "every image attribute Lexxy preserves also survives Action Text" do
    markup = %(<img #{IMAGE_ATTRIBUTES.map { |name| %(#{name}="#{ATTRIBUTE_VALUES.fetch(name, "1")}") }.join(" ")}>)

    sanitized = ActionText::Content.new(markup).to_s
    image = Nokogiri::HTML5.fragment(sanitized).at("img")

    assert_not_nil image, "Action Text dropped the image itself"

    IMAGE_ATTRIBUTES.each do |name|
      assert image.key?(name), "Lexxy keeps #{name} on an image but Action Text strips it on save"
      # Not equality: Action Text normalizes `style` to `color:red;`.
      assert_not_empty image[name], "Action Text keeps #{name} on an image but empties its value"
    end
  end

  test "the exempt attribute really is the one Action Text drops" do
    # Pins the exemption. If Action Text starts persisting contenteditable, or the
    # list above grows a name that doesn't belong there, this says so rather than
    # letting NOT_PERSISTED quietly widen into a way of hiding real disagreements.
    markup = %(<img src="/a.png" #{NOT_PERSISTED.map { |name| %(#{name}="1") }.join(" ")}>)

    sanitized = ActionText::Content.new(markup).to_s

    NOT_PERSISTED.each do |name|
      assert_not_includes sanitized, "#{name}=", "#{name} is exempt from the agreement check but Action Text does persist it"
    end
  end

  test "srcset is excluded on both sides" do
    # It carries URLs, so Lexxy leaves it to a consumer that declares it —
    # and Action Text wouldn't persist it anyway. Allowing it client-side would
    # have produced exactly the disagreement this test exists to catch.
    assert_not_includes IMAGE_ATTRIBUTES, "srcset"
    assert_not_includes ActionText::Content.new(%(<img src="/a.png" srcset="/a2.png 2x">)).to_s, "srcset"
  end
end
