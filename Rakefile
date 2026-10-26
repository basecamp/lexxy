require "bundler/setup"

APP_RAKEFILE = File.expand_path("test/dummy/Rakefile", __dir__)
load "rails/tasks/engine.rake"

load "rails/tasks/statistics.rake"

require "bundler/gem_tasks"

task :yarn_build do
  sh "yarn build"
end

Rake::Task["build"].enhance([ :yarn_build ])
