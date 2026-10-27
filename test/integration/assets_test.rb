require "test_helper"

class AssetsTest < ActionDispatch::IntegrationTest
  test "the engine's JavaScript and stylesheets are served by the asset pipeline" do
    %w[ lexxy.js lexxy.css ].each do |asset|
      get ActionController::Base.helpers.asset_path(asset)

      assert_response :success, "expected #{asset} to be served"
    end
  end
end
