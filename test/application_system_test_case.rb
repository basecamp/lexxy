require "test_helper"
require "capybara/cuprite"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium_chrome_headless, options: { js_errors: true }

  Capybara.app_host = "http://lexxy.localhost"

  include ConsoleHelper
end
