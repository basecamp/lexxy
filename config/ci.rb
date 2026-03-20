# Run using bin/ci

CI.run do
  step "Style: Ruby", "bin/rubocop -f github"
  step "Style: JavaScript", "yarn lint"
  step "Style: GitHub Actions (actionlint)", "actionlint"
  step "Style: GitHub Actions (zizmor)", "zizmor ."

  step "Tests: JavaScript", "yarn test"
  step "Tests: Rails (prepare)", "env RAILS_ENV=test bin/rails db:test:prepare"
  step "Tests: Rails (run)", "env RAILS_ENV=test bin/rails test:all -d"

  step "Tests: Playwright (install)", "npx playwright install --with-deps chromium"
  step "Tests: Playwright (run)", "yarn test:browser:chromium"

  unless success?
    failure "Signoff: CI failed.", "Fix the issues and try again."
  end
end
