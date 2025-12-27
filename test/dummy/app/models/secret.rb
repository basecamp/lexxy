class Secret < ApplicationRecord
	has_rich_text :body, encrypted: true
	encrypts :title
end
