require "application_system_test_case"

class EncryptedRichTextTest < ApplicationSystemTestCase
	test "works with encrypted rich text" do
		visit edit_secret_path(secrets(:this_is_it))

		assert_equal_html "<p>This is it.</p>", find_editor.value
	end
end