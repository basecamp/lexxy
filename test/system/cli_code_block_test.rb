require "application_system_test_case"

class CliCodeBlockTest < ApplicationSystemTestCase
  test "code block with nested pre>code from CLI is highlighted correctly" do
    post = posts(:empty)
    # CLI-generated HTML: markdown code fences produce <pre><code class="language-ruby">
    post.update!(body: '<pre><code class="language-ruby">def hello
  puts "world"
end</code></pre>')

    visit post_path(post)

    # highlightCode() should process CLI-style <pre><code class="language-*"> and produce
    # a single <code data-language="ruby"> with Prism syntax highlighting
    assert_selector "code[data-language='ruby']"
    assert_selector "code span.token.keyword", text: "def"

    # There should be no nested <pre><code> structure left (which causes double styling)
    assert_no_selector "pre code"
  end

  test "code block with nested pre>code without language class renders as a proper code block" do
    post = posts(:empty)
    # CLI might also produce code blocks without language annotation
    post.update!(body: '<pre><code>puts "hello world"</code></pre>')

    visit post_path(post)

    # Even without a language, the nested <code> should not create broken double-box styling.
    # The <pre> should remain as a block-level code element without a redundant inner <code>.
    assert_no_selector "pre > code"
  end

  test "code block with pre data-language from CLI uses newlines instead of br" do
    post = posts(:empty)
    # Some CLI tools might produce <pre data-language> with newlines instead of <br>
    post.update!(body: "<pre data-language=\"ruby\">def hello\n  puts \"world\"\nend</pre>")

    visit post_path(post)

    # highlightCode() should handle newlines (not just <br>) and produce highlighted output
    assert_selector "code[data-language='ruby']"
    assert_selector "code span.token.keyword", text: "def"
  end
end
