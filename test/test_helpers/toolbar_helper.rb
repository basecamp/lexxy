module ToolbarHelper
  def apply_highlight_option(attribute, button_index)
    click_on "Color highlight"

    within "lexxy-highlight-dialog dialog[open] [data-button-group='#{attribute}']" do
      all(".lexxy-highlight-button")[button_index - 1].click
    end
  end
end
