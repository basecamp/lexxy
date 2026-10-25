Rails.application.config.to_prepare do
  ActionText::ContentHelper.allowed_tags = ActionText::ContentHelper.sanitizer.class.allowed_tags +
    [ ActionText::Attachment.tag_name, "figure", "figcaption", "bc-mention" ]
  ActionText::ContentHelper.allowed_attributes = ActionText::ContentHelper.sanitizer.class.allowed_attributes +
    ActionText::Attachment::ATTRIBUTES + [ "gid" ]
end
