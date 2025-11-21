require "application_system_test_case"

class TrixHtmlTest < ApplicationSystemTestCase
  test "load trix html" do
    trix_html = <<~TRIX.split("\n")
      <h1>Title</h1>
      <h1><span style="color: purple;">Purple subtitle</span></h1>
      <pre language="text"><span style="color: red;">def ruby</span></pre>
      <pre language="javascript">const language = "js"</pre>
      <bc-attachment content-type="application/vnd.basecamp.horizontal-rule.html"><figure class="attachment attachment--content attachment--horizontal-rule"><hr></figure></bc-attachment>
    TRIX

    lexxy_html = <<~LEXXY.split("\n")
      <h1>Title</h1>
      <h1><mark style="color: purple;">Purple subtitle</mark></h1>
      <pre data-language="plain" data-highlight-language="plain">def ruby</pre>
      <pre data-language="js" data-highlight-language="js">const language = "js"</pre>
      <hr>
    LEXXY

    trix_html.zip(lexxy_html).each do |trix_html, lexxy_html|
      post = Post.create! body: "<div>#{trix_html}</div>"

      visit edit_post_path(post)

      assert_equal_html lexxy_html, find_editor.value
    end
  end

  test "load trix html p children" do
    trix_html = <<~TRIX.split("\n")
      <span style="color: red;">red color</span>
      <span style="background-color: blue;">blue background</span>
      <span style="color: darkgreen;background-color: green;">green everything</span>
      <del>corrected</del>
      <strong><del>wrong!</del></strong>
      <del style="color: red;">deleted</del>
      <strong style="color: yellow;">banana</strong>
      <em style="color: blue;">wave</em>
    TRIX

    lexxy_html = <<~LEXXY.split("\n")
      <mark style="color: red;">red color</mark>
      <mark style="background-color: blue;">blue background</mark>
      <mark style="color: darkgreen;background-color: green;">green everything</mark>
      <s>corrected</s>
      <s><b><strong>wrong!</strong></b></s>
      <s><mark style="color: red;">deleted</mark></s>
      <b><mark style="color: yellow;"><strong>banana</strong></mark></b>
      <i><mark style="color: blue;"><em>wave</em></mark></i>
    LEXXY

    trix_html.zip(lexxy_html).each do |trix_html, lexxy_html|
      post = Post.create! body: "<div>#{trix_html}</div>"

      visit edit_post_path(post)

      assert_equal_html "<p>#{lexxy_html}</p>", find_editor.value
    end
  end
end
