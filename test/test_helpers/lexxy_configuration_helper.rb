module LexxyConfigurationHelper
  def with_lexxy_config(**options)
    config = Rails.application.config.lexxy
    original_values = options.transform_values { nil }

    options.each_key do |key|
      original_values[key] = config.public_send(key)
    end

    options.each do |key, value|
      config.public_send("#{key}=", value)
    end
    Lexxy.configure_action_text_sanitizer!(config)

    yield
  ensure
    options.each_key do |key|
      config.public_send("#{key}=", original_values[key])
    end
    Lexxy.configure_action_text_sanitizer!(config)
  end
end
