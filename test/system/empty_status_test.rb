require "application_system_test_case"

class EmptyStatusTest < ApplicationSystemTestCase
  test "don't flag as empty when there is only attachments" do
    visit edit_post_path(posts(:empty))

    assert_empty_class

    attach_file file_fixture("example.png") do
      click_on "Upload file"
    end
    assert_image_figure_attachment content_type: "image/png", caption: "example.png" # wait for upload to finish

    assert_no_empty_class
  end

  private
    EMPTY_SELECTOR = "lexxy-editor.lexxy-editor--empty"

    def assert_empty_class
      assert_selector EMPTY_SELECTOR
    end

    def assert_no_empty_class
      assert_no_selector EMPTY_SELECTOR
    end
end
