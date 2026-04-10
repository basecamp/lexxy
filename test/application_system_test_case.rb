require "test_helper"
require "capybara/cuprite"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium_chrome_headless, options: { js_errors: true }

  Capybara.app_host = "http://lexxy.localhost"

  include ConsoleHelper

  # When Chrome crashes mid-test, Capybara's reset! fails because it tries to
  # talk to the dead browser. That poisons every subsequent test. Detect the
  # dead session and force a fresh one so later tests can proceed.
  teardown do
    page.driver.browser.window_handles
  rescue Selenium::WebDriver::Error::WebDriverError, NoMethodError
    Capybara.current_session.quit
  end
end
