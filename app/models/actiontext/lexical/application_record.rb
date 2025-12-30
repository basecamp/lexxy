module Actiontext
  module Lexical
    class ApplicationRecord < ActiveRecord::Base
      self.abstract_class = true
    end
  end
end
