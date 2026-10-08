require "test_helper"
require "json"
require "open3"

class SanitizerListsTest < ActiveSupport::TestCase
  RAILS_WITH_LEXXY = "config.action_text.editors = ActiveSupport::InheritableOptions.new(lexxy: {}, trix: {})"
  APPLICATION_LISTS = <<~RUBY
    ActionText::ContentHelper.allowed_tags = %w[ p ]
    ActionText::ContentHelper.allowed_attributes = %w[ class ]
  RUBY

  test "allows the markup Lexxy produces" do
    lists = sanitizer_lists_for_app(configuration: rails_without_lexxy)

    assert_includes lists["tags"], "table"
    assert_includes lists["attributes"], "data-language"
  end

  test "adds the markup Lexxy produces to the lists an application sets" do
    lists = sanitizer_lists_for_app(configuration: rails_without_lexxy, initializer: APPLICATION_LISTS)

    assert_equal %w[ p table ], lists["tags"] & %w[ p table ]
    assert_equal %w[ class data-language ], lists["attributes"] & %w[ class data-language ]
  end

  test "leaves the lists an application sets to a Rails version that includes Lexxy" do
    skip "Rails without the Action Text editor adapter doesn't include Lexxy" unless Lexxy.supports_editor_adapter?

    [ false, true ].each do |eager_load|
      lists = sanitizer_lists_for_app(configuration: RAILS_WITH_LEXXY, initializer: APPLICATION_LISTS, eager_load: eager_load)

      assert_equal %w[ p ], lists["tags"], "eager_load: #{eager_load}"
      assert_equal %w[ class ], lists["attributes"], "eager_load: #{eager_load}"
    end
  end

  test "doesn't set sanitizer lists on a Rails version that includes Lexxy" do
    skip "Rails without the Action Text editor adapter doesn't include Lexxy" unless Lexxy.supports_editor_adapter?

    lists = sanitizer_lists_for_app(configuration: RAILS_WITH_LEXXY)

    assert_nil lists["assigned_tags"]
    assert_nil lists["assigned_attributes"]
  end

  private
    def rails_without_lexxy
      "config.action_text.editors = ActiveSupport::InheritableOptions.new(trix: {})" if Lexxy.supports_editor_adapter?
    end

    def sanitizer_lists_for_app(configuration: "", initializer: "", eager_load: false)
      output, status = Dir.mktmpdir do |root|
        environment = { "DATABASE_URL" => "sqlite3::memory:", "PRIMARY_DATABASE_URL" => nil }

        Open3.capture2e(environment, RbConfig.ruby, "-e", <<~RUBY, chdir: root)
          require "bundler/setup"
          require "json"
          require "rails"
          require "active_record/railtie"
          require "active_storage/engine"
          require "action_text/engine"
          require "lexxy"

          class SanitizerListsApp < Rails::Application
            config.load_defaults "8.0"
            config.eager_load = #{eager_load}
            config.logger = Logger.new(nil)
            config.secret_key_base = "sanitizer-lists-test"
            config.active_record.encryption.primary_key = "sanitizer-lists-test"
            config.active_record.encryption.deterministic_key = "sanitizer-lists-test"
            config.active_record.encryption.key_derivation_salt = "sanitizer-lists-test"
            config.active_storage.service = :local
            config.active_storage.service_configurations = { local: { service: "Disk", root: #{File.join(root, "storage").inspect} } }
            #{configuration}

            initializer "sanitizer_lists_app.sanitizer", before: :eager_load! do
              #{initializer}
            end
          end

          Rails.application.initialize!
          ActionText::Content

          helper = Class.new.include(ActionText::ContentHelper).new
          print "lists=\#{JSON.generate(
            tags: helper.sanitizer_allowed_tags.to_a,
            attributes: helper.sanitizer_allowed_attributes.to_a,
            assigned_tags: ActionText::ContentHelper.allowed_tags&.to_a,
            assigned_attributes: ActionText::ContentHelper.allowed_attributes&.to_a
          )}"
        RUBY
      end

      assert status.success?, output
      JSON.parse(output[/lists=(.*)\z/, 1])
    end
end
