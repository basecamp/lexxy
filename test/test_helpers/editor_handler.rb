class EditorHandler
  attr_reader :page, :selector

  delegate_missing_to :editor_element

  def initialize(page, selector)
    @page = page
    @selector = selector
  end

  def value
    evaluate_script "this.value"
  end

  def value=(value)
    editor_element.set value
    editor_element.execute_script "this.value = `#{value}`"
  end

  def plain_text_value
    evaluate_script "this.toString()"
  end

  def empty?
    evaluate_script "this.isEmpty"
  end

  def blank?
    evaluate_script "this.isBlank"
  end

  def has_node_selection?
    evaluate_script "this.selection.hasNodeSelection"
  end

  def open_prompt?
    evaluate_script "this.hasOpenPrompt"
  end

  def click
    # Proper usage is a click on the content element rather than on the editor
    content_element.click
  end

  def send(*keys)
    simulate_first_interaction_if_needed
    content_element.send_keys *keys
  end

  def send_key(key, ctrl: false)
    simulate_first_interaction_if_needed

    content_element.execute_script <<~JS
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: "#{key}",
        ctrlKey: #{ctrl}
      });
      this.dispatchEvent(event);
    JS
  end

  def send_tab(shift: false)
    simulate_first_interaction_if_needed

    content_element.execute_script <<~JS
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        shiftKey: #{shift}
      });
      this.dispatchEvent(event);
    JS
  end

  def select(text)
    simulate_first_interaction_if_needed

    execute_script <<~JS
      const editable = this
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
  end

  def flush_lexical_updates
    page.evaluate_async_script <<~JS
      const [ done ] = arguments
      const editor = document.querySelector('lexxy-editor').editor
      editor.update(() => null, {
        onUpdate: () => requestAnimationFrame(done)
      });
    JS
  end

  def select_all
    simulate_first_interaction_if_needed
    content_element.execute_script <<~JS
      const editable = this
      const range = document.createRange()
      range.selectNodeContents(editable)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    JS
  end

  def focus
    execute_script "this.focus()"
  end

  def paste(text, html: nil)
    simulate_first_interaction_if_needed

    content_element.execute_script <<~JS
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
      })
      pasteEvent.clipboardData.setData("text/plain", #{text.to_json})
      #{"pasteEvent.clipboardData.setData(\"text/html\", `#{html}`)" if html}
      this.dispatchEvent(pasteEvent)
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

  def content_element
    editor_element.find(".lexxy-editor__content")
  end

  private
    def editor_element
      page.find(selector)
    end

    def simulate_first_interaction_if_needed
      # Adding text or selecting text will not work otherwise
      unless @first_interaction_simulated || content_element_active?
        content_element.click
        @first_interaction_simulated = true
      end
    end

    def content_element_active?
      active_element == content_element
    end

    def active_element
      page.evaluate_script "document.activeElement"
    end
end
