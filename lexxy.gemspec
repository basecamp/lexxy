require_relative "lib/lexxy/version"

Gem::Specification.new do |spec|
  spec.name        = "lexxy"
  spec.version     = Lexxy::VERSION
  spec.authors     = [ "Jorge Manrubia" ]
  spec.email       = [ "jorge@37signals.com" ]
  spec.homepage    = "https://github.com/basecamp/lexxy"
  spec.summary     = "A new editor for Action Text based on Meta's Lexical framework."
  spec.description = "A new editor for Action Text based on Meta's Lexical framework."
  spec.license     = "MIT"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/basecamp/lexxy"
  spec.metadata["changelog_uri"] = "https://github.com/basecamp/lexxy"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  spec.add_dependency "rails", ">= 8.0.2"
  spec.add_development_dependency "turbo-rails", "~> 2.0"
  spec.add_development_dependency "stimulus-rails", "~> 1.0"
  spec.add_development_dependency "capybara", "~> 3.0"
  spec.add_development_dependency "selenium-webdriver", "~> 4.0"
  spec.add_development_dependency "cuprite", "~> 0.17"
  spec.add_development_dependency "image_processing", "~> 1.0"
end
