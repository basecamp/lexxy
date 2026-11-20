# Run using bin/ci

CI.run do
  step "Style: Ruby", "bin/rubocop -f github"
  step "Style: JavaScript", "yarn lint"
  step "Style: GitHub Actions (actionlint)", "actionlint"
  step "Style: GitHub Actions (zizmor)", "zizmor ."

  step "Tests: JavaScript", "yarn test"
  step "Build: JavaScript", "yarn build"
  step "Tests: Bundled JavaScript packages", "bundle exec rake verify_bundled_dependencies"
  step "Tests: Rails (prepare)", "env RAILS_ENV=test bin/rails db:test:prepare"
  step "Tests: Rails (run)", "env RAILS_ENV=test bin/rails test:all -d"

  # --with-deps installs the browser's system libraries with apt-get, so it fails on
  # Linux distributions without it, like Arch. Skip it there.
  apt_less_linux = RUBY_PLATFORM.include?("linux") && !system("command -v apt-get > /dev/null")
  step "Tests: Playwright (install)", "npx playwright install #{"--with-deps " unless apt_less_linux}chromium"
  step "Tests: Playwright (run)", "yarn test:browser:chromium"

  unless success?
    failure "Signoff: CI failed.", "Fix the issues and try again."
  end
end
