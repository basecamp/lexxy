module ToolbarHelper
  def apply_highlight_option(attribute, button_index)
    find("[name='highlight']").click

    within "lexxy-dropdown-highlight [data-button-group='#{attribute}']" do
      all(".lexxy-highlight-button")[button_index - 1].click
    end
  end
end
