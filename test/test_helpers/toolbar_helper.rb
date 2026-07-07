module ToolbarHelper
  def apply_highlight_option(attribute, button_index)
    find("[name='highlight']").click

    within "lexxy-highlight-dropdown [data-dropdown-panel] .lexxy-highlight-colors" do
      all(".lexxy-highlight-button[data-style='#{attribute}']")[button_index - 1].click
    end
  end

  def apply_alignment(direction)
    find("[name='alignment']").click
    find("[name='align-#{direction}']").click
  end
end
