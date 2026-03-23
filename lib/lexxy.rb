require "lexxy/version"

module Lexxy
  class << self
    # Check for ActionText::Editor with block-children support (rails/rails#56926)
    def supports_editor_adapter?
      defined?(ActionText::Editor) && ActionText::Editor.instance_method(:editor_tag).parameters.assoc(:block)
    end

    def override_action_text_defaults
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
  end
end

require "lexxy/engine"
