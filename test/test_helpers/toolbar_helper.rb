module ToolbarHelper
  def apply_highlight_option(attribute, button_index)
    find("[name='highlight']").click

    within "lexxy-toolbar-dropdown[data-content='highlight'] [data-dropdown-panel] .lexxy-highlight-colors" do
      all(".lexxy-highlight-button[data-style='#{attribute}']")[button_index - 1].click
    end
  end
end
