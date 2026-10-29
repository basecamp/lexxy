require "bundler/setup"

APP_RAKEFILE = File.expand_path("test/dummy/Rakefile", __dir__)
load "rails/tasks/engine.rake"

load "rails/tasks/statistics.rake"

require "bundler/gem_tasks"

task :yarn_build do
  sh "yarn install --frozen-lockfile"
  sh "yarn build"
end

task :verify_bundled_dompurify do
  locked = File.read("yarn.lock")[/^dompurify@.*:\n  version "(.+)"/, 1]
  bundled = File.read("app/assets/javascript/lexxy.js")[/@license DOMPurify (\S+)/, 1]

  if bundled != locked
    abort "lexxy.js bundles DOMPurify #{bundled.inspect}, but yarn.lock locks #{locked.inspect}. Reinstall node_modules from scratch and rebuild."
  end
end

Rake::Task["build"].enhance([ :yarn_build, :verify_bundled_dompurify ])
