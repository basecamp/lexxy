module EditorHelper
  def find_editor(selector = "lexxy-editor")
    @handlers_by_selector ||= {}
    @handlers_by_selector[selector] = begin
      editor_element = find(selector)
      EditorHandler.new(page, editor_element)
    end
  end

  def assert_figure_attachment(content_type:, &block)
    figure = find("figure.attachment[data-content-type='#{content_type}']")
    within(figure, &block) if block_given?
  end

  def assert_image_figure_attachment(content_type: "image/png", caption:)
    assert_figure_attachment(content_type: content_type) do
      assert_selector("img[src*='/rails/active_storage']")
      assert_selector "figcaption input[placeholder='#{caption}']"
    end
  end

  def assert_not_image_figure_attachment(content_type: "image/png", caption:)
    assert_figure_attachment(content_type: content_type) do
      assert_no_selector "img"
      within "figcaption" do
        assert_text caption
      end
    end
  end

  def assert_no_attachment(content_type:)
    assert_no_selector "figure.attachment[data-content-type='#{content_type}']"
  end

  def assert_mention_attachment(user)
    within "action-text-attachment[content-type='application/vnd.actiontext.mention']" do
      assert_text user.name
    end
  end

  def assert_no_mention_attachments
    assert_no_css "action-text-attachment[content-type='application/vnd.actiontext.mention']"
  end

  def assert_gallery(count:)
    assert_selector ".attachment-gallery.attachment-gallery--#{count}", count: 1
    assert_selector "figure.attachment", count: count
  end

  def assert_no_gallery
    assert_no_selector ".attachment-gallery"
  end
end
