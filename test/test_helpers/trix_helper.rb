module TrixHelper
  def fill_trix_editor(with:)
    find("trix-editor")
    page.execute_script <<~JS, with
      const editor = document.querySelector("trix-editor").editor
      const position = editor.getDocument().toString().trimEnd().length
      editor.setSelectedRange([position, position])
      editor.insertString(arguments[0])
    JS
  end

  def upload_trix_file(path)
    find("trix-editor")
    attach_file(path) do
      find("button[data-trix-action='attachFiles']").click
    end
  end
end
