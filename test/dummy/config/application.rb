require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Dummy
  class Application < Rails::Application
    config.load_defaults Rails::VERSION::STRING.to_f

    # For compatibility with applications that use this config
    config.action_controller.include_all_helpers = false

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")


    #
    # THIS IS FOR TESTING PURPOSES ONLY.
    # DO NOT EVER DO THIS IN A REAL PROJECT. EVER.
    #

    config.active_record.encryption.primary_key = "eAtTEMwJgGutHDNYnDMhaqVxZ3PICykB"
    config.active_record.encryption.deterministic_key = "q6iCZ1L5EDqiE1GrZx01Ugxa5sqTCEkZ"
    config.active_record.encryption.key_derivation_salt = "EQZbSKxfs9f8j6PP200tpUtVJD98w4jE"

    #
    # SERIOUSLY. NOT EVER.
    #

  end
end
