require "application_system_test_case"

class PastesWithStylesTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
  end

  test "strips non-canonical color styles when pasting" do
    paste_with_style "color: purple"
    assert_style_stripped
  end

  test "strips non-canonical background-color styles when pasting" do
    paste_with_style "background-color: yellow"
    assert_style_stripped
  end

  test "preserves canonical CSS variable color when pasting" do
    paste_with_style "color: var(--highlight-1)"
    assert_canonicalized_to "color: var(--highlight-1)"
  end

  test "preserves canonical CSS variable background-color when pasting" do
    paste_with_style "background-color: var(--highlight-bg-1)"
    assert_canonicalized_to "background-color: var(--highlight-bg-1)"
  end

  test "canonicalizes RGB color value matching canonical color" do
    paste_with_style "color:  #{highlight_1_rgb}"
    assert_canonicalized_to "color: var(--highlight-1)"
  end

  test "canonicalizes RGBA background-color value matching canonical color" do
    paste_with_style "background-color: rgba(229, 223, 6, 0.3)"
    assert_canonicalized_to "background-color: var(--highlight-bg-1)"
  end

  test "preserves valid color but strips invalid background-color" do
    paste_with_style "color: #{highlight_1_rgb}; background-color: yellow"
    assert_canonicalized_to "color: var(--highlight-1)"
  end

  test "preserves valid background-color but strips invalid color" do
    paste_with_style "color: purple; background-color: rgba(229, 223, 6, 0.3)"
    assert_canonicalized_to "background-color: var(--highlight-bg-1)"
  end

  test "strips irrelevant style properties" do
    paste_with_style "background-color: rgba(229, 223, 6, 0.3); color:  #{highlight_1_rgb}; box-sizing: border-box; scrollbar-color: rgb(193, 193, 193) rgba(0, 0, 0, 0); scrollbar-width: thin; background-image: unset; background-position: unset; background-size: unset; background-repeat: unset; background-attachment: unset; background-origin: unset; background-clip: unset; text-decoration: inherit; border-radius: 4px;"
    assert_canonicalized_to "color: var(--highlight-1);background-color: var(--highlight-bg-1)"
  end

  test "canonicalizes styles in mark-up sent as plain-text" do
    find_editor.paste %(some <span style='color: purple; background-color: rgba(229, 223, 6, 0.3);'>styled text</span>)
    assert_canonicalized_to "background-color: var(--highlight-bg-1)"
  end

  test "canonicalizes styles in <span>" do
    find_editor.paste "styled text", html: %(some <span style="color: purple; background-color: rgba(229, 223, 6, 0.3);">styled text</span>)
    assert_canonicalized_to "background-color: var(--highlight-bg-1)"
  end

  test "preserves non-canonical styles loaded from database" do
    post = posts(:empty)
    existing_styled_html = '<p>some <mark style="color: purple;">existing text</mark></p>'
    post.update!(body: existing_styled_html)

    visit edit_post_path(post)

    assert_equal_html existing_styled_html, find_editor.value
  end

  private
    def paste_with_style(style)
      find_editor.paste "some styled text", html: %(some <mark style="#{style}">styled text</mark>)
    end

    def assert_style_stripped
      assert_equal_html %(<p>some styled text</p>), find_editor.value
    end

    def assert_canonicalized_to(style)
      assert_equal_html %(<p>some <mark style="#{style};">styled text</mark></p>), find_editor.value
    end

    def highlight_1_rgb
      dark_mode? ? "rgb(240, 200, 22)" : "rgb(136, 118, 38)"
    end

    def dark_mode?
      page.evaluate_script "window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches"
    end
end
