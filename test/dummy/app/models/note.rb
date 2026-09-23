class Note < ApplicationRecord
  has_rich_text :body, encrypted: true
end
