require_relative "rich_text_area_tag"
require "active_storage/blob_with_preview_url"

module Actiontext
  module Lexical
    class Engine < ::Rails::Engine
      isolate_namespace Actiontext::Lexical

      initializer "actiontext-lexical.initialize" do |app|
        app.config.to_prepare do
          ActionText::TagHelper.prepend(ActionText::Lexical::TagHelper)
        end
      end

      initializer "actiontext-lexical.assets" do |app|
        app.config.assets.paths << root.join("app/assets/stylesheets")
        app.config.assets.paths << root.join("app/javascript")
      end

      initializer "actiontext-lexical.sanitization" do |app|
        ActiveSupport.on_load(:action_text_content) do
          default_allowed_tags = Class.new.include(ActionText::ContentHelper).new.sanitizer_allowed_tags
          ActionText::ContentHelper.allowed_tags = default_allowed_tags + %w[ video audio source embed ]

          default_allowed_attributes = Class.new.include(ActionText::ContentHelper).new.sanitizer_allowed_attributes
          ActionText::ContentHelper.allowed_attributes = default_allowed_attributes + %w[ controls poster data-language style ]
        end
      end

      initializer "actiontext-lexical.blob_with_preview" do |app|
        ActiveSupport.on_load(:active_storage_blob) do
          prepend ActiveStorage::BlobWithPreviewUrl
        end
      end
    end
  end
end
