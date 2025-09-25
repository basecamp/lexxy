require "test_helper"
require "capybara/cuprite"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium_chrome_headless, options: { js_errors: true }

  setup do
    # Add any setup code needed for all system tests
  end

  teardown do
    assert_no_console_messages
    # Add any teardown code needed for all system tests
  end

  def assert_no_console_messages(level = nil)
    logs = page.driver.browser.logs.get(:browser)
    logs = logs.select { |log| log.level == level } if level
    assert logs.empty?, "Unexpected console messages: \n" + logs.map(&:message).join("\n\n")
  end
end
