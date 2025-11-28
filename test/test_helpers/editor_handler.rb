class EditorHandler
  attr_reader :page, :selector

  delegate_missing_to :editor_element

  def initialize(page, selector)
    @page = page
    @selector = selector
  end

  def value=(value)
    editor_element.set value
    page.execute_script("arguments[0].value = '#{value}'", editor_element)
    sleep 0.1
  end

  def send(*keys)
    simulate_first_interaction_if_needed
    content_element.send_keys *keys
  end

  def send_key(key)
    simulate_first_interaction_if_needed

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

  def send_tab(shift: false)
    simulate_first_interaction_if_needed

    page.execute_script <<~JS, content_element
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        shiftKey: #{shift}
      });
      arguments[0].dispatchEvent(event);
    JS
    sleep 0.1
  end

  def select(text)
    simulate_first_interaction_if_needed

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

  def select_all
    simulate_first_interaction_if_needed
    page.execute_script <<~JS, content_element
      const editable = arguments[0]
      const range = document.createRange()
      range.selectNodeContents(editable)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
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
    find("#{toolbar_selector} [data-command=\"#{command}\"]").click
  end

  def inner_html
    content_element.native.attribute("innerHTML")
  end

  private
    def editor_element
      page.find(selector)
    end

    def content_element
      editor_element.find(".lexxy-editor__content")
    end

    def simulate_first_interaction_if_needed
      # Adding text or selecting text will not work otherwise
      unless @first_interaction_simulated
        content_element.click
        @first_interaction_simulated = true
      end
    end
end
