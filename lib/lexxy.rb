require "lexxy/version"
require "lexxy/engine"

module Lexxy
  ACTION_TEXT_ALLOWED_TAGS = %w[ video audio source embed table tbody tr th td ].freeze
  ACTION_TEXT_ALLOWED_ATTRIBUTES = %w[ controls poster data-language style ].freeze

  def self.override_action_text_defaults
    ActionText::TagHelper.module_eval do
      alias_method :rich_textarea_tag, :lexxy_rich_textarea_tag
      alias_method :rich_text_area_tag, :lexxy_rich_textarea_tag
    end

    ActionView::Helpers::FormHelper.module_eval do
      alias_method :rich_textarea, :lexxy_rich_textarea
      alias_method :rich_text_area, :lexxy_rich_textarea
    end

    ActionView::Helpers::FormBuilder.module_eval do
      alias_method :rich_textarea, :lexxy_rich_textarea
      alias_method :rich_text_area, :lexxy_rich_textarea
    end

    ActionView::Helpers::Tags::ActionText.module_eval do
      alias_method :render, :lexxy_render
    end
  end

  def self.additional_allowed_attributes(config = Rails.application.config.lexxy)
    Array(config.additional_allowed_attributes).map(&:to_s)
  end

  def self.configure_action_text_sanitizer!(config = Rails.application.config.lexxy)
    action_text_content_helper = Class.new.include(ActionText::ContentHelper).new

    ActionText::ContentHelper.allowed_tags = (action_text_content_helper.sanitizer_allowed_tags.dup + ACTION_TEXT_ALLOWED_TAGS).uniq
    ActionText::ContentHelper.allowed_attributes = (action_text_content_helper.sanitizer_allowed_attributes.dup + ACTION_TEXT_ALLOWED_ATTRIBUTES + additional_allowed_attributes(config)).uniq

    css_functions = Loofah::HTML5::SafeList::ALLOWED_CSS_FUNCTIONS
    css_functions << "var" unless css_functions.include?("var")
  end
end
