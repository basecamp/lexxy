module HtmlHelper
  def assert_equal_html(expected, actual)
    assert_equal normalize_html(expected), normalize_html(actual)
  end

  def normalize_html(html)
    Nokogiri::HTML.fragment(html).to_html.strip
  end
end
