module ConsoleHelper
  extend ActiveSupport::Concern

  included do
    setup do
      clear_console_messages
    end

    teardown do
      assert_no_console_messages unless allow_console_messages?
    end
  end

  private
    def allow_console_messages
      @console_messages_allowed = true
    end

    def allow_console_messages?
      @console_messages_allowed
    end

    def assert_no_console_messages(level = nil)
      logs = page.driver.browser.logs.get(:browser)
      logs = logs.select { |log| log.level == level } if level
      assert logs.empty?, "Unexpected console messages: \n" + logs.map(&:message).join("\n\n")
    end

    def clear_console_messages
      page.driver.browser.logs.get(:browser)
    end
end
