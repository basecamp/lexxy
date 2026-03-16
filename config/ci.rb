# Run using bin/ci
require "etc"

def arch_linux?
  Etc.uname[:release].match?(/arch/)
end

CI.run do
  step "Style: Ruby", "bin/rubocop -f github"
  step "Style: JavaScript", "yarn lint"

  step "Tests: JavaScript", "yarn test"
  step "Tests: Rails (prepare)", "env RAILS_ENV=test bin/rails db:test:prepare"
  step "Tests: Rails (run)", "env RAILS_ENV=test bin/rails test:all -d"

  if arch_linux?
    step "Tests: checking for chromium on arch", %(test -f "/usr/bin/chromium" && echo "local chromium found")
    step "Tests: checking for firefox on arch",  %(test -f "/usr/bin/firefox" && echo "local firefox found")
  else
    step "Tests: Playwright (install)", "npx playwright install --with-deps chromium" unless ArchSystem
  end
  step "Tests: Playwright (run)", "yarn test:browser:chromium"

  unless success?
    failure "Signoff: CI failed.", "Fix the issues and try again."
  end
end
