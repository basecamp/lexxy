require "bundler/setup"

APP_RAKEFILE = File.expand_path("test/dummy/Rakefile", __dir__)
load "rails/tasks/engine.rake"

load "rails/tasks/statistics.rake"

require "bundler/gem_tasks"

task :yarn_build do
  sh "yarn install --frozen-lockfile"
  sh "yarn build"
end

task :verify_bundled_dependencies do
  locked_versions = Hash.new { |versions, name| versions[name] = [] }
  File.read("yarn.lock").scan(/^"?(@?[^@\s"]+)@.*:\n  version "(.+)"/) do |name, version|
    locked_versions[name] << version
  end

  bundled_package_paths = JSON.parse(File.read("app/assets/javascript/lexxy.js.map"))["sources"]
    .grep(/node_modules/)
    .map { |source| File.expand_path(source[%r{\A.*node_modules/(@[^/]+/)?[^/]+}], "app/assets/javascript") }
    .uniq

  mismatches = bundled_package_paths.filter_map do |path|
    package = JSON.parse(File.read("#{path}/package.json"))
    "#{package["name"]} #{package["version"]}" unless locked_versions[package["name"]].include?(package["version"])
  end

  if mismatches.any?
    abort "lexxy.js bundles packages that don't match yarn.lock: #{mismatches.join(", ")}. Reinstall node_modules from scratch and rebuild."
  end
end

Rake::Task["build"].enhance([ :yarn_build, :verify_bundled_dependencies ])
