module ActionText
  module Attachables
    class RemoteVideo
      extend ActiveModel::Naming

      class << self
        def from_node(node)
          if node["url"] && content_type_is_video?(node["content-type"])
            new(attributes_from_node(node))
          end
        end

        private
          def content_type_is_video?(content_type)
            content_type.to_s.match?(/^video(\/.+|$)/)
          end

          def attributes_from_node(node)
            { url: node["url"],
              content_type: node["content-type"],
              width: node["width"],
              height: node["height"],
              filename: node["filename"] }
          end
      end

      attr_reader :url, :content_type, :width, :height, :filename

      def initialize(attributes = {})
        @url = attributes[:url]
        @content_type = attributes[:content_type]
        @width = attributes[:width]
        @height = attributes[:height]
        @filename = attributes[:filename]
      end

      def attachable_plain_text_representation(caption)
        "[#{caption || filename || "Video"}]"
      end

      def to_partial_path
        "action_text/attachables/remote_video"
      end
    end
  end
end
