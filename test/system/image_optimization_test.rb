require "application_system_test_case"

class ImageOptimizationTest < ApplicationSystemTestCase
  setup do
    visit root_path

    @editor_root = find('[contenteditable="true"]')
    @editor_root.click

    execute_script("arguments[0].innerHTML = ''", @editor_root)
  end

  test "does not optimize image uploads by default (original filename and extension preserved)" do
    upload_image("example.png")

    upload_figure = find("figure.attachment")

    within(upload_figure) do
      assert_selector "progress"

      within "figcaption.attachment__caption" do
        assert_selector ".attachment__name", text: /example\.png\z/
      end

      assert_selector 'img[src^="data:image/"]'
    end

    assert_no_selector "progress", wait: 30

    final_figure = find("figure.attachment")

    within(final_figure) do
      assert_selector "img"

      within "figcaption.attachment__caption" do
        assert_selector ".attachment__name", text: /example\.png\z/
      end
    end
  end

  test "optimizes image uploads to WebP when enabled (requires temporary hardcode — see comment)" do
    skip <<~MSG
      To run this test locally:
      1. Temporarily hardcode optimization in app/javascript/nodes/action_text_attachment_upload_node.js:
         Change:
           const optimizationConfig = Lexxy.global.get("imageOptimization") ?? { enabled: false }
         To:
           const optimizationConfig = { enabled: true, maxWidth: 1200, quality: 0.8, format: "webp" }
      2. Run the system tests.
      3. Assertions below should pass (filename changes to .webp).
      4. Revert the change before committing.
    MSG

    upload_image("example.png")

    upload_figure = find("figure.attachment")

    within(upload_figure) do
      within "figcaption.attachment__caption" do
        assert_selector ".attachment__name", text: /example\.webp\z/
      end
    end

    assert_no_selector "progress", wait: 30

    final_figure = find("figure.attachment")

    within(final_figure) do
      within "figcaption.attachment__caption" do
        assert_selector ".attachment__name", text: /example\.webp\z/
      end
    end
  end

  private

  def upload_image(fixture_name)
    fixture_path = File.expand_path("../../fixtures/files/#{fixture_name}", __dir__)

    raise "Fixture not found: #{fixture_path}" unless File.exist?(fixture_path)

    find("button[data-command='uploadAttachments']").click

    file_input = find("input[type='file']", visible: :hidden)
    file_input.attach_file(fixture_path)
  end
end