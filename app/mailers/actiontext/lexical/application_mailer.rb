module Actiontext
  module Lexical
    class ApplicationMailer < defined?(ActionMailer::Base) ? ActionMailer::Base : Object
      if defined?(ActionMailer::Base)
        default from: "from@example.com"
        layout "mailer"
      end
    end
  end
end
