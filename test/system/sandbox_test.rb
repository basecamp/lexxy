require "application_system_test_case"

class SandboxTest < ApplicationSystemTestCase
  SANDBOX_BUTTON_LABELS = {
    "default" => "Default",
    "tables" => "Tables",
    "code" => "Code blocks",
    "lists" => "Lists",
    "highlights" => "Text Highlights",
    "images" => "Images",
    "empty" => "Empty"
  }

  SandboxController::ALLOWED_TEMPLATES.each do |template|
    test "sandbox/#{template} loads without console errors" do
      visit (template == "default") ? "/sandbox" : "/sandbox/#{template}"
      wait_for_editor
    end
  end

  test "navigating between sandbox templates via turbo-frame loads cleanly" do
    visit "/sandbox"
    wait_for_editor

    SANDBOX_BUTTON_LABELS.except("default").each_value do |label|
      click_on label
      wait_for_editor
    end

    click_on "Default"
    wait_for_editor
  end
end
