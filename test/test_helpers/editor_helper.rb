module EditorHelper
  def assert_toolbar_button_focused(name)
    assert_css "button[name='#{name}']:focus"
  end

  def find_editor(selector = "lexxy-editor")
    @handlers_by_selector ||= {}
    @handlers_by_selector[selector] ||= EditorHandler.new(page, selector)
  end

  def assert_editor_plain_text(value)
    wait_until { find_editor.plain_text_value == value }
  rescue Timeout::Error
    assert_equal value, find_editor.plain_text_value
  end

  def assert_editor_html(expected = nil, &block)
    if block
      Capybara.string(find_editor.value).instance_exec(&block)
    else
      wait_until { normalize_html(find_editor.value) == normalize_html(expected) }
    end
  rescue Timeout::Error
    assert_equal normalize_html(expected), normalize_html(find_editor.value)
  end

  def wait_until(timeout: Capybara.default_max_wait_time)
    Timeout.timeout(timeout) do
      sleep 0.05 until yield
    end
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
    find("lexxy-table-tools button[aria-label='#{aria_label}']").click
  end

  def open_table_row_menu
    more_menu = find("lexxy-table-tools .lexxy-table-control--row details")
    more_menu.click
  end

  def open_table_column_menu
    more_menu = find("lexxy-table-tools .lexxy-table-control--column details")
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
