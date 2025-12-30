# Run using bin/ci

CI.run do
  step "Style: Ruby", "bin/rubocop -f github"
  step "Style: JavaScript", "yarn lint"

  step "Tests: prepare", "env RAILS_ENV=test bin/rails db:test:prepare"
  step "Tests: run", "env RAILS_ENV=test bin/rails test:all -d"

  unless success?
    failure "Signoff: CI failed.", "Fix the issues and try again."
  end
end
