module Lexxy
  module ActionTextTag
    extend ActiveSupport::Concern

    prepended do
      delegate :dom_id, to: ActionView::RecordIdentifier
    end

    def initialize(object_name, method_name, template_object, options = {}, &block)
      super

      @block = block
    end

    def lexxy_render
      options = @options.stringify_keys

      add_default_name_and_id(options)
      options["input"] ||= dom_id(object, [ options["id"], :trix_input ].compact.join("_")) if object
      html_tag = @template_object.lexxy_rich_textarea_tag(options.delete("name"), options.fetch("value") { value }, options.except("value"), &@block)
      error_wrapping(html_tag)
    end
  end
end
