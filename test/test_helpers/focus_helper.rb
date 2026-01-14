module FocusHelper
  def active_element
    page.evaluate_script "document.activeElement"
  end
end
