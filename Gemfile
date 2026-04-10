source "https://rubygems.org"

# Specify your gem's dependencies in actiontext-lexical.gemspec.
gemspec

if ENV["USE_RAILS_WITHOUT_ACTION_TEXT_ADAPTER"] == "true"
  gem "rails", "~> 8.1.0"
else
  gem "rails", github: "rails/rails", branch: "main"
end

gem "puma", "~> 7.0"

gem "sqlite3", "~> 2.0"

gem "propshaft", "~> 1.0"

gem "rubocop-rails-omakase", "~> 1.0", require: false
gem "importmap-rails", "~> 2.0"
gem "image_processing", "~> 1.0"

gem "turbo-rails", "~> 2.0"
gem "stimulus-rails", "~> 1.0"

gem "rack-cors"

gem "foreman"

gem "capybara", "~> 3.0"
gem "selenium-webdriver", "~> 4.0"
gem "cuprite", "~> 0.17"
