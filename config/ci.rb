# Run using bin/ci

CI.run do
  step "Style: Ruby", "bin/rubocop -f github"
  step "Style: JavaScript", "yarn lint"

  step "Tests: JavaScript", "yarn test"
  step "Tests: Rails (prepare)", "env RAILS_ENV=test bin/rails db:test:prepare"
  step "Tests: Rails (run)", "env RAILS_ENV=test bin/rails test:all -d"

  unless success?
    failure "Signoff: CI failed.", "Fix the issues and try again."
  end
end
