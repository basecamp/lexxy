module ActiveStorage
  module BlobWithPreviewUrl
    PREVIEW_SIZE = [ 1024, 768 ]

    def as_json(options = nil)
      json = super
      options ||= {}

      if previewable? && ActiveStorage::Current.url_options
        attributes = (root = preview_json_root(options)) ? json[root] : json
        attributes["previewable"] = true if serializes_preview_field?("previewable", options)
        attributes["url"] = preview_url_path if serializes_preview_field?("url", options)
      end

      json
    end

    private
      def preview_json_root(options)
        root = options.key?(:root) ? options[:root] : include_root_in_json
        root == true ? model_name.element : root
      end

      def serializes_preview_field?(field, options)
        only = Array(options[:only]).map(&:to_s)
        except = Array(options[:except]).map(&:to_s)

        (only.empty? || only.include?(field)) && except.exclude?(field)
      end

      def preview_url_path
        Rails.application.routes.url_helpers.rails_representation_path(
          preview(resize_to_limit: PREVIEW_SIZE), ActiveStorage::Current.url_options.merge(only_path: true)
        )
      end
  end
end
