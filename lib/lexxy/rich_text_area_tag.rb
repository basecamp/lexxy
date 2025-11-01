module Lexxy
  module TagHelper
    def lexxy_rich_textarea_tag(name, value = nil, options = {}, &block)
      options = options.symbolize_keys
      form = options.delete(:form)

      value = render_custom_attachments_in(value)
      value = "<div>#{value}</div>" if value

      options[:name] ||= name
      options[:value] ||= value
      options[:class] ||= "lexxy-content"
      options[:data] ||= {}
      options[:data][:direct_upload_url] ||= main_app.rails_direct_uploads_url
      options[:data][:blob_url_template] ||= main_app.rails_service_blob_url(":signed_id", ":filename")

      editor_tag = content_tag("lexxy-editor", "", options, &block)
      editor_tag
    end

    alias_method :lexxy_rich_text_area_tag, :lexxy_rich_textarea_tag

    private
      # Tempoary: we need to *adaptarize* action text
      def render_custom_attachments_in(value)
        if html = value.try(:body_before_type_cast).presence
          ActionText::Fragment.wrap(html).replace(ActionText::Attachment.tag_name) do |node|
            if node["url"].blank?
              attachment = ActionText::Attachment.from_node(node)
              node["content"] = render_action_text_attachment(attachment).to_json
            end
            node
          end
        else
          value
        end
      end
  end
end
