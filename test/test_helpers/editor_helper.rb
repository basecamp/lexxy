module EditorHelper
  def assert_toolbar_button_focused(name)
    assert_css "button[name='#{name}']:focus"
  end

  def find_editor(selector = "lexxy-editor")
    @handlers_by_selector ||= {}
    @handlers_by_selector[selector] ||= EditorHandler.new(page, selector)
  end

  def assert_editor_plain_text(value)
    assert_equal value, find_editor.plain_text_value
  end

  def assert_figure_attachment(content_type:, &block)
    figure = find("figure.attachment[data-content-type='#{content_type}']")
    within(figure, &block) if block_given?
  end

  def assert_image_figure_attachment(content_type: "image/png", caption:)
    assert_figure_attachment(content_type: content_type) do
      assert_selector("img[src*='/rails/active_storage']")
      assert_selector "figcaption textarea[placeholder='#{caption}']"
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

  def click_on_prompt(name)
    find(".lexxy-prompt-menu__item", text: name).click
  end

  def wait_for_editor
    assert_css "lexxy-editor[connected]"
    assert_css "lexxy-toolbar[connected]" if has_css?("lexxy-toolbar")
  end

  def click_table_handler_button(aria_label)
    find(".lexxy-table-handle-buttons button[aria-label='#{aria_label}']").click
  end

  def open_table_more_menu
    more_menu = find(".lexxy-table-handle-buttons details.lexxy-table-control__more-menu")
    more_menu.click
  end

  def assert_editor_table_structure(cols, rows)
    within("lexxy-editor table") do
      assert_table_structure(cols, rows)
    end
  end

  def assert_table_structure(cols, rows)
    assert_selector "tr", count: rows
    within(first("tr")) do
      assert_selector "td, th", count: cols
    end
  end
end
