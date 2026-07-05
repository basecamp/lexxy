module Lexxy
  module TagHelper
    def lexxy_rich_textarea_tag(name, value = nil, options = {}, &block)
      options = options.symbolize_keys

      value = render_custom_attachments_in(value)
      # remove the html_safe attribute to preserve attribute escape
      value = value.to_str if value.respond_to? :to_str

      # Opt-in: render the value into a content element the editor adopts on
      # connect, so the field has its final height at first paint instead of
      # reflowing when the editor builds a frame after load. Off by default.
      prerender = options.delete(:prerender)

      options[:name] ||= name
      options[:value] ||= value
      options[:class] ||= "lexxy-content"
      options[:data] ||= {}
      options[:data][:direct_upload_url] ||= main_app.rails_direct_uploads_url
      options[:data][:blob_url_template] ||= main_app.rails_service_blob_url(":signed_id", ":filename")

      inner = (block || !prerender) ? "" : prerendered_content_tag(options[:value])
      editor_tag = content_tag("lexxy-editor", inner, options, &block)
      editor_tag
    end

    alias_method :lexxy_rich_text_area_tag, :lexxy_rich_textarea_tag

    private
      # A static copy of the value the editor adopts as its content element on
      # connect (see LexicalEditorElement#prerenderedContentElement). It is the
      # same HTML the editor parses from `value`, so it renders at the same
      # height the live editor lands on.
      def prerendered_content_tag(value)
        content_tag "div", (value.presence || "<p><br></p>").html_safe,
          class: "lexxy-editor__content",
          contenteditable: "true",
          role: "textbox",
          "aria-multiline": "true"
      end

      # Temporary: we need to *adaptarize* action text
      def render_custom_attachments_in(value)
        if value.respond_to?(:body)
          if html = value.body_before_type_cast.presence
            self.prefix_partial_path_with_controller_namespace = false if respond_to?(:prefix_partial_path_with_controller_namespace=)
            ActionText::Fragment.wrap(html).replace(ActionText::Attachment.tag_name) do |node|
              if node["url"].blank?
                attachment = ActionText::Attachment.from_node(node)
                node["content"] = render_action_text_attachment(attachment).to_json
                node["content-type"] ||= attachment.content_type
              end
              node
            end
          end
        else
          value
        end
      end
  end
end
