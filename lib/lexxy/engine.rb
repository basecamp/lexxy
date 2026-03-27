require_relative "rich_text_area_tag"
require_relative "form_helper"
require_relative "form_builder"
require_relative "action_text_tag"
require_relative "attachable"

require "active_storage/blob_with_preview_url"

module Lexxy
  class Engine < ::Rails::Engine
    isolate_namespace Lexxy

    config.lexxy = ActiveSupport::OrderedOptions.new
    config.lexxy.additional_allowed_attributes = []
    config.lexxy.override_action_text_defaults = true

    initializer "lexxy.initialize" do |app|
      app.config.to_prepare do
        # TODO: We need to move these extensions to Action Text
        ActionText::TagHelper.prepend(Lexxy::TagHelper)
        ActionView::Helpers::FormHelper.prepend(Lexxy::FormHelper)
        ActionView::Helpers::FormBuilder.prepend(Lexxy::FormBuilder)
        ActionView::Helpers::Tags::ActionText.prepend(Lexxy::ActionTextTag)
        ActionText::Attachable.singleton_class.prepend(Lexxy::Attachable)

        Lexxy.override_action_text_defaults if app.config.lexxy.override_action_text_defaults
      end
    end

    initializer "lexxy.assets" do |app|
      if Rails.application.config.respond_to?(:assets)
        app.config.assets.paths << root.join("app/assets/stylesheets")
        app.config.assets.paths << root.join("app/javascript")
      end
    end

    initializer "lexxy.sanitization" do |app|
      ActiveSupport.on_load(:action_text_content) do
        Lexxy.configure_action_text_sanitizer!(app.config.lexxy)
      end
    end

    initializer "lexxy.blob_with_preview" do |app|
      ActiveSupport.on_load(:active_storage_blob) do
        prepend ActiveStorage::BlobWithPreviewUrl
      end
    end
  end
end
