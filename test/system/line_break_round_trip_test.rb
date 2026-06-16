require "application_system_test_case"

class LineBreakRoundTripTest < ApplicationSystemTestCase
  # Reproduces the reported bug: adding a soft line break (Shift+Enter), saving,
  # then editing again to add another break elsewhere drops the earlier break.
  # The break survives the first save -> render -> re-edit cycle but is lost on a
  # subsequent edit -> save because re-importing the saved HTML discards a <br>
  # that ends up as the last child of a block.
  test "a trailing soft line break survives a later edit and save" do
    visit edit_post_path(posts(:empty))
    wait_for_editor

    find_editor.send "First line"
    find_editor.send [ :shift, :enter ]
    find_editor.send [ :shift, :enter ]

    click_on "Update Post"
    assert_selector "article.post", text: "First line"

    # First re-edit: the break must still be present after one round trip.
    click_on "Edit this post"
    wait_for_editor
    assert_includes find_editor.value, "First line<br><br>"

    # Add a second break elsewhere and save again. The earlier break must survive.
    find_editor.send :end
    find_editor.send "Second line"
    find_editor.send [ :shift, :enter ]
    find_editor.send [ :shift, :enter ]
    find_editor.send "Third line"

    click_on "Update Post"

    click_on "Edit this post"
    wait_for_editor

    value = find_editor.value
    assert_includes value, "First line<br><br>"
    assert_includes value, "Second line<br><br>"
    assert_includes value, "Third line"
  end
end
