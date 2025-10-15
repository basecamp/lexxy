class EditorHandler
  attr_reader :page, :editor_element

  delegate_missing_to :editor_element

  def initialize(page, editor_element)
    @page = page
    @editor_element = editor_element
  end

  def value=(value)
    editor_element.set value
    page.execute_script("arguments[0].value = '#{value}'", editor_element)
  end

  def send(*keys)
    content_element.send_keys *keys
  end

  def send_key(key)
    page.execute_script <<~JS, content_element
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: "#{key}",
        keyCode: 46
      });
      arguments[0].dispatchEvent(event);
    JS
  end

  def select(text)
    page.execute_script <<~JS, editor_element
      const editable = arguments[0]
      const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT)
      let node

      while ((node = walker.nextNode())) {
        const idx = node.nodeValue.indexOf("#{text}")
        if (idx !== -1) {
          const range = document.createRange()
          range.setStart(node, idx)
          range.setEnd(node, idx + "#{text}".length)
          const sel = window.getSelection()
          sel.removeAllRanges()
          sel.addRange(range)
          break
        }
      }
    JS
    sleep 0.1
  end

  def focus
    page.execute_script <<~JS, editor_element
      arguments[0].focus()
    JS
  end

  def paste(text)
    page.execute_script <<~JS, content_element
      arguments[0].focus()
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
      })
      pasteEvent.clipboardData.setData("text/plain", "#{text}")
      arguments[0].dispatchEvent(pasteEvent)
    JS
  end

  def within_contents(&block)
    page.within content_element, &block
  end

  def toggle_command(command, toolbar_selector = "lexxy-toolbar")
    begin
      find("#{toolbar_selector} [data-command=\"#{command}\"]").click

    # If not found in main toolbar, try the overflow menu
    rescue Capybara::ElementNotFound
      find("#{toolbar_selector} .lexxy-editor__toolbar-overflow-menu [data-command=\"#{command}\"]").click
    end
  end

  def inner_html
    content_element.native.attribute("innerHTML")
  end

  private
    def content_element
      @content_element ||= editor_element.find(".lexxy-editor__content")
    end
end
