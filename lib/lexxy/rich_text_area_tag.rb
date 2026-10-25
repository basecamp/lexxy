module Lexxy
  module TagHelper
    def lexxy_rich_textarea_tag(name, value = nil, options = {}, &block)
      options = options.symbolize_keys

      value = render_custom_attachments_in(value)
      # remove the html_safe attribute to preserve attribute escape
      value = value.to_str if value.respond_to? :to_str

      options[:name] ||= name
      options[:value] ||= value
      options[:class] ||= "lexxy-content"
      options[:data] ||= {}
      options[:data][:action_text_supports_alt] = Lexxy.supports_alternative_text?
      options[:data][:direct_upload_url] ||= main_app.rails_direct_uploads_url
      options[:data][:blob_url_template] ||= main_app.rails_service_blob_url(":signed_id", ":filename")

      editor_tag = content_tag("lexxy-editor", "", options, &block)
      editor_tag
    end

    alias_method :lexxy_rich_text_area_tag, :lexxy_rich_textarea_tag

    private
      # Temporary: we need to *adaptarize* action text
      def render_custom_attachments_in(value)
        if value.respond_to?(:body)
          if html = editable_html_from(value).presence
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

      # Prefer the stored HTML as is. An encrypted body (has_rich_text encrypted: true)
      # stores ciphertext, so read the decrypted body instead.
      def editable_html_from(rich_text)
        if rich_text.try(:encrypted_attribute?, :body)
          rich_text.body&.to_html
        else
          rich_text.body_before_type_cast
        end
      end
  end
end
