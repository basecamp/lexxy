# Runs again on every reload, so it adds to the current lists rather than resetting them,
# which would drop what Lexxy allows.
Rails.application.config.to_prepare do
  content_helper = Class.new.include(ActionText::ContentHelper).new

  ActionText::ContentHelper.allowed_tags = content_helper.sanitizer_allowed_tags |
    [ ActionText::Attachment.tag_name, "figure", "figcaption", "bc-mention" ]
  ActionText::ContentHelper.allowed_attributes = content_helper.sanitizer_allowed_attributes |
    ActionText::Attachment::ATTRIBUTES | [ "gid" ]
end
