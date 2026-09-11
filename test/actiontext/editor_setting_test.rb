require "test_helper"
require "open3"

class EditorSettingTest < ActiveSupport::TestCase
  RAILS_WITHOUT_LEXXY = "config.action_text.editors = ActiveSupport::InheritableOptions.new(trix: {})"
  RAILS_WITH_LEXXY = "config.action_text.editors = ActiveSupport::InheritableOptions.new(lexxy: {}, trix: {})"

  setup do
    skip "Rails without the Action Text editor adapter has no editor setting" unless Lexxy.supports_editor_adapter?
  end

  test "replaces the Trix default with Lexxy" do
    assert_equal "lexxy", editor_name_for_app(RAILS_WITHOUT_LEXXY)
  end

  test "replaces a Trix setting with Lexxy while overriding Action Text's defaults" do
    assert_equal "lexxy", editor_name_for_app(<<~RUBY)
      #{RAILS_WITHOUT_LEXXY}
      config.action_text.editor = :trix
    RUBY
  end

  test "leaves the configured editor when override_action_text_defaults is disabled" do
    assert_equal "trix", editor_name_for_app(<<~RUBY)
      #{RAILS_WITHOUT_LEXXY}
      config.lexxy.override_action_text_defaults = false
      config.action_text.editor = :trix
    RUBY
  end

  test "leaves the default editor when Lexxy is already registered" do
    assert_equal "trix", editor_name_for_app(RAILS_WITH_LEXXY)
  end

  test "leaves a Trix setting when Lexxy is already registered" do
    assert_equal "trix", editor_name_for_app(<<~RUBY)
      #{RAILS_WITH_LEXXY}
      config.action_text.editor = :trix
    RUBY
  end

  test "uses Lexxy when it's already registered and configured" do
    assert_equal "lexxy", editor_name_for_app(<<~RUBY)
      #{RAILS_WITH_LEXXY}
      config.action_text.editor = :lexxy
    RUBY
  end

  private
    def editor_name_for_app(configuration)
      output, status = Dir.mktmpdir do |root|
        environment = { "DATABASE_URL" => "sqlite3::memory:", "PRIMARY_DATABASE_URL" => nil }

        Open3.capture2e(environment, RbConfig.ruby, "-e", <<~RUBY, chdir: root)
          require "bundler/setup"
          require "rails"
          require "active_record/railtie"
          require "active_storage/engine"
          require "action_text/engine"
          require "lexxy"

          class EditorSettingApp < Rails::Application
            config.load_defaults "8.1"
            config.eager_load = false
            config.logger = Logger.new(nil)
            config.secret_key_base = "editor-setting-test"
            #{configuration}
          end

          Rails.application.initialize!
          print "editor=\#{ActionText::RichText.editor.editor_name}"
        RUBY
      end

      assert status.success?, output
      output[/editor=(\w+)\z/, 1]
    end
end
