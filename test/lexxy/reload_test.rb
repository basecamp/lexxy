require "test_helper"

class Lexxy::ReloadTest < ActiveSupport::TestCase
  test "reloading does not add more copies of Lexxy's helpers" do
    skip "Lexxy patches no helpers on this Rails version" if Lexxy.supports_editor_adapter?

    copies = [
      -> { ActionView::Base.ancestors.count(Lexxy::FormHelper) },
      -> { ActionController::Base._helpers.ancestors.count(Lexxy::TagHelper) }
    ]

    assert_no_difference copies do
      3.times { Rails.application.reloader.prepare! }
    end
  end
end
