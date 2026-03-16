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

  spec.extensions = [ "ext/Rakefile" ]

  spec.add_dependency "rails", ">= 8.0.2"
  spec.add_development_dependency "turbo-rails"
  spec.add_development_dependency "stimulus-rails"
  spec.add_development_dependency "capybara"
  spec.add_development_dependency "selenium-webdriver"
  spec.add_development_dependency "cuprite"
  spec.add_development_dependency "image_processing"
end
